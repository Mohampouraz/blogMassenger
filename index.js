require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// ========== دیتابیس ==========
async function initDB() {
    try {
        const client = await pool.connect();
        
        // ایجاد جدول سشن‌ها
        await client.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(100) PRIMARY KEY, 
                name VARCHAR(100), 
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // ایجاد جدول پیام‌ها
        await client.query(`
            CREATE TABLE IF NOT EXISTS p_messages (
                id SERIAL PRIMARY KEY, 
                session_id VARCHAR(100), 
                is_admin BOOLEAN, 
                text TEXT, 
                is_read BOOLEAN DEFAULT FALSE, 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // === بخش آپدیت دیتابیس (Migration) ===
        // افزودن ستون reply_to_id (برای پشتیبانی از نسخه‌های قبلی)
        try {
            await client.query(`ALTER TABLE p_messages ADD COLUMN IF NOT EXISTS reply_to_id INTEGER DEFAULT NULL`);
            console.log("✅ Column 'reply_to_id' check passed");
        } catch (e) {
            console.log("ℹ️ Column 'reply_to_id' already exists or error checking");
        }

        // افزودن ستون reactions برای ایموجی‌ها (فرمت JSONB برای کارایی بالا)
        try {
            await client.query(`ALTER TABLE p_messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb`);
            console.log("✅ Column 'reactions' check passed");
        } catch (e) {
            console.log("ℹ️ Column 'reactions' already exists or error checking");
        }

        client.release();
        console.log("✅ Database connected successfully");
    } catch (err) { 
        console.error("❌ Database error:", err); 
    }
}
initDB();

// ========== میدلور احراز هویت ==========
io.use(async (socket, next) => {
    const { sessionId, token, inputName } = socket.handshake.auth;
    
    socket.data = { sessionId: null, isAdmin: false, name: "کاربر" };

    if (token && token.startsWith("admin:")) {
        const pass = token.split("admin:")[1];
        if (pass === ADMIN_PASSWORD) {
            socket.data.isAdmin = true;
            socket.data.name = "سیگار با ته‌چین ماست";
            // برای ادمین یک شناسه موقت می‌سازیم اما در لاجیک ری‌اکشن از شناسه ثابت استفاده می‌کنیم
            socket.data.sessionId = sessionId || `admin_${Date.now()}`;
            return next();
        }
    }

    if (sessionId) {
        socket.data.sessionId = sessionId;
        socket.data.name = inputName || "کاربر";
        socket.data.isAdmin = false;
        return next();
    }

    next(new Error("احراز هویت ناموفق"));
});

// ========== رویدادهای Socket ==========
io.on('connection', (socket) => {
    // === 1. احراز هویت ===
    const handleAuth = async () => {
        const { sessionId, isAdmin, name } = socket.data;

        if (isAdmin) {
            socket.join('admin_room');
            socket.join(sessionId);
            
            // به بقیه اعلام کنیم ادمین آنلاین شد
            socket.broadcast.emit('admin_status_change', { is_online: true });
            
            try {
                const users = await pool.query(`
                    SELECT s.id, s.name, s.last_active,
                    (SELECT COUNT(*)::int FROM p_messages m WHERE m.session_id = s.id AND m.is_admin = FALSE AND m.is_read = FALSE) as unread_count
                    FROM sessions s
                    ORDER BY last_active DESC LIMIT 50
                `);
                
                // بررسی آنلاین بودن کاربران در لحظه برای لیست ادمین
                const mappedUsers = users.rows.map(r => {
                    const room = io.sockets.adapter.rooms.get(r.id);
                    return {
                        ...r,
                        is_online: !!(room && room.size > 0)
                    };
                });
                
                socket.emit('admin_inbox', mappedUsers);
            } catch (err) {
                console.error("Error fetching users:", err);
            }
        } else {
            socket.join(sessionId);
            
            // به ادمین اعلام کنیم این کاربر آنلاین شد
            io.to('admin_room').emit('user_status_change', { id: sessionId, is_online: true, last_active: new Date() });
            
            try {
                await pool.query(
                    'INSERT INTO sessions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2, last_active = CURRENT_TIMESTAMP',
                    [sessionId, name]
                );
                // Load initial history for user
                socket.emit('get_history', { sessionId, limit: 50 });
            } catch (err) {
                console.error("Error saving session:", err);
            }
        }

        socket.emit('auth_success', { isAdmin, name, sessionId });
    };
    handleAuth();

    // === درخواست وضعیت آنلاین بودن شخص مورد نظر ===
    socket.on('check_status', async (targetId) => {
        let isOnline = false;
        let lastActive = null;

        if (targetId === 'ADMIN') {
            const room = io.sockets.adapter.rooms.get('admin_room');
            isOnline = !!(room && room.size > 0);
        } else {
            const room = io.sockets.adapter.rooms.get(targetId);
            isOnline = !!(room && room.size > 0);
            if (!isOnline) {
                try {
                    const res = await pool.query('SELECT last_active FROM sessions WHERE id = $1', [targetId]);
                    if (res.rows.length > 0) lastActive = res.rows[0].last_active;
                } catch(e) {}
            }
        }
        socket.emit('status_result', { targetId, isOnline, lastActive });
    });

    // === 2. ارسال پیام ===
    socket.on('message', async (data) => {
        // دریافت replyToId از کلاینت
        const { sessionId, text, tempId, replyToId } = data;
        const isSenderAdmin = socket.data.isAdmin;

        if (!text || !sessionId) return;

        try {
            // ذخیره پیام در دیتابیس به همراه reply_to_id
            const res = await pool.query(
                'INSERT INTO p_messages (session_id, is_admin, text, reply_to_id, reactions) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at',
                [sessionId, isSenderAdmin, text, replyToId || null, '{}']
            );

            await pool.query('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [sessionId]);

            // اگر پیامی ریپلای شده، متن والد را پیدا کنیم
            let replyData = null;
            if (replyToId) {
                const parentMsg = await pool.query('SELECT text, is_admin FROM p_messages WHERE id = $1', [replyToId]);
                if (parentMsg.rows.length > 0) {
                    replyData = {
                        id: replyToId,
                        text: parentMsg.rows[0].text,
                        isAdmin: parentMsg.rows[0].is_admin
                    };
                }
            }

            const payload = {
                id: res.rows[0].id,
                sessionId,
                text,
                isAdmin: isSenderAdmin,
                is_read: false,
                created_at: res.rows[0].created_at,
                tempId,
                reply_to: replyData, // ارسال اطلاعات پیام والد
                reactions: {} // آبجکت خالی ری‌اکشن برای پیام جدید
            };

            io.to(sessionId).emit('message_receive', payload);

            if (isSenderAdmin) {
                socket.to('admin_room').emit('message_receive', payload);
            } else {
                io.to('admin_room').emit('message_receive', payload);
                io.to('admin_room').emit('list_update', {
                    id: sessionId,
                    name: socket.data.name,
                    last_active: new Date(),
                    increment_unread: true,
                    is_online: true
                });
            }

        } catch (err) {
            console.error("Error sending message:", err);
        }
    });

    // === 3. ارسال ری‌اکشن ===
    socket.on('send_reaction', async (data) => {
        const { messageId, emoji } = data;
        // اگر ادمین است، از شناسه ثابت ADMIN استفاده می‌کنیم تا با تغییر سشن ادمین، ری‌اکشن گم نشود
        const reactorId = socket.data.isAdmin ? "ADMIN" : socket.data.sessionId;

        if (!messageId || !emoji) return;

        try {
            // 1. دریافت ری‌اکشن‌های فعلی پیام و سشن مربوط به پیام
            const res = await pool.query('SELECT reactions, session_id FROM p_messages WHERE id = $1', [messageId]);
            
            if (res.rows.length === 0) return;

            let currentReactions = res.rows[0].reactions || {};
            const chatSessionId = res.rows[0].session_id;
            
            if (!currentReactions[emoji]) {
                currentReactions[emoji] = [];
            }

            if (currentReactions[emoji].includes(reactorId)) {
                // اگر قبلاً ری‌اکشن داده، حذفش کن
                currentReactions[emoji] = currentReactions[emoji].filter(id => id !== reactorId);
                // اگر آرایه خالی شد، کل کلید را حذف کن
                if (currentReactions[emoji].length === 0) {
                    delete currentReactions[emoji];
                }
            } else {
                // اضافه کن
                if (!currentReactions[emoji]) currentReactions[emoji] = [];
                currentReactions[emoji].push(reactorId);
            }

            // 3. ذخیره در دیتابیس
            await pool.query('UPDATE p_messages SET reactions = $1 WHERE id = $2', [JSON.stringify(currentReactions), messageId]);

            // 4. اطلاع‌رسانی به کلاینت‌ها
            const updatePayload = {
                messageId,
                reactions: currentReactions
            };

            // ارسال به اتاق کاربری که چت متعلق به اوست
            io.to(chatSessionId).emit('reaction_update', updatePayload);
            
            // ارسال به اتاق ادمین
            io.to('admin_room').emit('reaction_update', updatePayload);

        } catch (err) {
            console.error("Error setting reaction:", err);
        }
    });

    // === 4. دیده شدن پیام ===
    socket.on('mark_seen', async ({ sessionId, viewerIsAdmin }) => {
        try {
            const targetIsAdmin = !viewerIsAdmin;
            await pool.query(
                'UPDATE p_messages SET is_read = TRUE WHERE session_id = $1 AND is_admin = $2 AND is_read = FALSE',
                [sessionId, targetIsAdmin]
            );
            io.to(sessionId).emit('msgs_seen_update');
            io.to('admin_room').emit('msgs_seen_update');
            
            if (viewerIsAdmin) {
                io.to('admin_room').emit('list_update', {
                    id: sessionId,
                    reset_unread: true
                });
            }
        } catch (err) { console.error(err); }
    });

    // === 5. تاریخچه (شامل ری‌اکشن‌ها) ===
    socket.on('get_history', async (data) => {
        const { sessionId, limit = 50 } = data || {};
        if (!sessionId || (!socket.data.isAdmin && socket.data.sessionId !== sessionId)) return;
        try {
            const query = `
                SELECT m.*, p.text as reply_text, p.is_admin as reply_admin_flag 
                FROM p_messages m 
                LEFT JOIN p_messages p ON m.reply_to_id = p.id
                WHERE m.session_id = $1 
                ORDER BY m.created_at DESC 
                LIMIT $2
            `;
            const res = await pool.query(query, [sessionId, limit]);
            
            socket.emit('history_data', res.rows.map(m => ({
                id: m.id, 
                sessionId: m.session_id, 
                isAdmin: m.is_admin, 
                text: m.text, 
                is_read: m.is_read, 
                created_at: m.created_at,
                reactions: m.reactions || {}, // ارسال ری‌اکشن‌ها
                reply_to: m.reply_to_id ? {
                    id: m.reply_to_id,
                    text: m.reply_text,
                    isAdmin: m.reply_admin_flag
                } : null
            })));
        } catch (err) { console.error(err); }
    });

    // === 6. بارگذاری پیام‌های قدیمی‌تر ===
    socket.on('get_older_history', async (data) => {
        const { sessionId, before, limit = 20 } = data || {};
        if (!sessionId || !before || (!socket.data.isAdmin && socket.data.sessionId !== sessionId)) return;
        try {
            const query = `
                SELECT m.*, p.text as reply_text, p.is_admin as reply_admin_flag 
                FROM p_messages m 
                LEFT JOIN p_messages p ON m.reply_to_id = p.id
                WHERE m.session_id = $1 AND m.created_at < $2 
                ORDER BY m.created_at DESC 
                LIMIT $3
            `;
            const res = await pool.query(query, [sessionId, before, limit]);
            
            socket.emit('older_history_data', {
                messages: res.rows.map(m => ({
                    id: m.id, 
                    sessionId: m.session_id, 
                    isAdmin: m.is_admin, 
                    text: m.text, 
                    is_read: m.is_read, 
                    created_at: m.created_at,
                    reactions: m.reactions || {}, // ارسال ری‌اکشن‌ها
                    reply_to: m.reply_to_id ? {
                        id: m.reply_to_id,
                        text: m.reply_text,
                        isAdmin: m.reply_admin_flag
                    } : null
                }))
            });
        } catch (err) { console.error(err); }
    });

    // === 7. تایپینگ ===
    socket.on('typing', (data) => {
        const sessionId = data.sessionId || socket.data.sessionId;
        const isAdmin = socket.data.isAdmin;
        if (isAdmin) socket.to(sessionId).emit('typing', { sessionId, isAdmin: true });
        else socket.to('admin_room').emit('typing', { sessionId, isAdmin: false });
    });

    socket.on('stop_typing', (data) => {
        const sessionId = data.sessionId || socket.data.sessionId;
        const isAdmin = socket.data.isAdmin;
        if (isAdmin) socket.to(sessionId).emit('stop_typing', { sessionId, isAdmin: true });
        else socket.to('admin_room').emit('stop_typing', { sessionId, isAdmin: false });
    });

    socket.on('disconnect', async () => {
        if (!socket.data.isAdmin && socket.data.sessionId) {
            const now = new Date();
            await pool.query('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [socket.data.sessionId]);
            io.to('admin_room').emit('user_status_change', { id: socket.data.sessionId, is_online: false, last_active: now });
        } else if (socket.data.isAdmin) {
            const room = io.sockets.adapter.rooms.get('admin_room');
            if (!room || room.size === 0) {
                socket.broadcast.emit('admin_status_change', { is_online: false });
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
