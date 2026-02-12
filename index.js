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
console.log(ADMIN_PASSWORD);

// ========== دیتابیس ==========
async function initDB() {
    try {
        const client = await pool.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(100) PRIMARY KEY, 
                name VARCHAR(100), 
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
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
    
    // ذخیره اطلاعات در socket.data
    socket.data = {
        sessionId: null,
        isAdmin: false,
        name: "کاربر"
    };
    console.log(token);
    // بررسی ادمین بودن
    if (token && token.startsWith("admin:")) {
        const pass = token.split("admin:")[1];
        console.log("AUTH PASS =",pass);
        if (pass === ADMIN_PASSWORD) {
            socket.data.isAdmin = true;
            socket.data.name = "سیگار با ته‌چین ماست";
            socket.data.sessionId = sessionId || `admin_${Date.now()}`;
            return next();
        }
    }

    // بررسی کاربر عادی
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
    console.log(`🔌 New connection: ${socket.id} | Admin: ${socket.data.isAdmin} | Session: ${socket.data.sessionId}`);

    // === 1. احراز هویت نهایی و جوین اتاق‌ها ===
    const handleAuth = async () => {
        const { sessionId, isAdmin, name } = socket.data;

        if (isAdmin) {
            // ادمین به همه اتاق‌ها جوین می‌شود
            socket.join('admin_room');
            socket.join(sessionId);
            
            // ارسال لیست کاربران به ادمین
            try {
                const users = await pool.query(
                    'SELECT * FROM sessions ORDER BY last_active DESC LIMIT 50'
                );
                socket.emit('admin_inbox', users.rows);
            } catch (err) {
                console.error("Error fetching users:", err);
            }
        } else {
            // کاربر فقط به اتاق خودش جوین می‌شود
            socket.join(sessionId);
            
            // ذخیره یا بروزرسانی کاربر در دیتابیس
            try {
                await pool.query(
                    'INSERT INTO sessions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2, last_active = CURRENT_TIMESTAMP',
                    [sessionId, name]
                );
                // اطلاع به ادمین برای بروزرسانی لیست
                io.to('admin_room').emit('session_update', { 
                    id: sessionId, 
                    name, 
                    last_active: new Date() 
                });
            } catch (err) {
                console.error("Error saving session:", err);
            }
        }

        // ارسال تاییدیه به کلاینت
        socket.emit('auth_success', { 
            isAdmin, 
            name, 
            sessionId 
        });
    };
    handleAuth();

    // === 2. ارسال پیام ===
    socket.on('message', async (data) => {
        const { sessionId, text, tempId } = data;
        const isSenderAdmin = socket.data.isAdmin;

        if (!text || !sessionId) {
            socket.emit('error', { message: 'متن پیام یا شناسه جلسه نامعتبر است' });
            return;
        }

        try {
            // ذخیره در دیتابیس
            const res = await pool.query(
                'INSERT INTO p_messages (session_id, is_admin, text) VALUES ($1, $2, $3) RETURNING id, created_at',
                [sessionId, isSenderAdmin, text]
            );

            // بروزرسانی زمان آخرین فعالیت
            await pool.query(
                'UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1',
                [sessionId]
            );

            const payload = {
                id: res.rows[0].id,
                sessionId,
                text,
                isAdmin: isSenderAdmin,
                is_read: false,
                created_at: res.rows[0].created_at,
                tempId
            };

            // ارسال به کاربر مورد نظر (اتاق sessionId)
            io.to(sessionId).emit('message_receive', payload);

            // ارسال به ادمین‌ها
            if (isSenderAdmin) {
                // اگر فرستنده ادمین است، به بقیه ادمین‌ها ارسال کن (نه به خودش)
                socket.to('admin_room').emit('message_receive', payload);
            } else {
                // اگر فرستنده کاربر است، به همه ادمین‌ها ارسال کن
                io.to('admin_room').emit('message_receive', payload);
                io.to('admin_room').emit('new_user_msg', payload);
            }

        } catch (err) {
            console.error("Error sending message:", err);
            socket.emit('error', { message: 'خطا در ارسال پیام' });
        }
    });

    // === 3. دیده شدن پیام‌ها ===
    socket.on('mark_seen', async ({ sessionId, viewerIsAdmin }) => {
        try {
            const targetIsAdmin = !viewerIsAdmin;
            
            await pool.query(
                'UPDATE p_messages SET is_read = TRUE WHERE session_id = $1 AND is_admin = $2 AND is_read = FALSE',
                [sessionId, targetIsAdmin]
            );

            // اطلاع به کاربر
            io.to(sessionId).emit('msgs_seen_update');
            
            // اطلاع به ادمین
            io.to('admin_room').emit('msgs_seen_update');
            
        } catch (err) {
            console.error("Error marking messages as seen:", err);
        }
    });

    // === 4. دریافت تاریخچه پیام‌ها ===
    socket.on('get_history', async (sessionId) => {
        // بررسی دسترسی: ادمین یا صاحب جلسه
        if (!socket.data.isAdmin && socket.data.sessionId !== sessionId) {
            socket.emit('error', { message: 'دسترسی غیرمجاز' });
            return;
        }

        try {
            const res = await pool.query(
                'SELECT * FROM p_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 100',
                [sessionId]
            );

            const messages = res.rows.map(msg => ({
                id: msg.id,
                sessionId: msg.session_id,
                isAdmin: msg.is_admin,
                text: msg.text,
                is_read: msg.is_read,
                created_at: msg.created_at
            }));

            socket.emit('history_data', messages);
            
        } catch (err) {
            console.error("Error fetching history:", err);
            socket.emit('error', { message: 'خطا در دریافت تاریخچه' });
        }
    });

    // === 5. قطع اتصال ===
    socket.on('disconnect', async () => {
        console.log(`🔌 Disconnected: ${socket.id} | Admin: ${socket.data.isAdmin}`);
        
        // اگر کاربر عادی بود، زمان آخرین فعالیت را بروز کن
        if (!socket.data.isAdmin && socket.data.sessionId) {
            try {
                await pool.query(
                    'UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1',
                    [socket.data.sessionId]
                );
            } catch (err) {
                console.error("Error updating last_active:", err);
            }
        }
    });

    // === 6. خطاهای عمومی ===
    socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
    });
});

// ========== راه‌اندازی سرور ==========
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Admin password: ${ADMIN_PASSWORD ? '✅ Set' : '❌ Not set'}`);
});
