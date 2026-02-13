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
    connectionString: process.env.DATABASE_URL
    // نکته مهم: برای لوکال هاست، ssl را کامنت کردم چون معمولا باعث خطا می‌شود.
    // اگر روی سرور واقعی (مثل Render) هستید، خط زیر را از کامنت در بیاورید:
    // ssl: { rejectUnauthorized: false }
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// ========== دیتابیس - ایجاد جداول ==========
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
                reply_to_id INTEGER DEFAULT NULL,
                is_read BOOLEAN DEFAULT FALSE, 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (reply_to_id) REFERENCES p_messages(id) ON DELETE SET NULL
            )
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS message_reactions (
                id SERIAL PRIMARY KEY,
                message_id INTEGER NOT NULL,
                session_id VARCHAR(100) NOT NULL,
                is_admin BOOLEAN NOT NULL,
                emoji VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(message_id, session_id, emoji),
                FOREIGN KEY (message_id) REFERENCES p_messages(id) ON DELETE CASCADE
            )
        `);
        
        client.release();
        console.log("✅ Database connected successfully with reactions and replies support");
        
        // سرور فقط زمانی اجرا شود که دیتابیس آماده باشد
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });

    } catch (err) { 
        console.error("❌ Database error (Check .env or Postgres running):", err); 
        process.exit(1);
    }
}

// اجرای دیتابیس و سپس سرور
initDB();

// ========== میدلور احراز هویت ==========
io.use(async (socket, next) => {
    const { sessionId, token, inputName } = socket.handshake.auth;
    
    socket.data = { 
        sessionId: null, 
        isAdmin: false, 
        name: "کاربر",
        reconnectCount: 0
    };

    if (token && token.startsWith("admin:")) {
        const pass = token.split("admin:")[1];
        if (pass === ADMIN_PASSWORD) {
            socket.data.isAdmin = true;
            socket.data.name = "سیگار با ته‌چین ماست";
            socket.data.sessionId = sessionId || `admin_${Date.now()}`;
            return next();
        }
    }

    if (sessionId) {
        socket.data.sessionId = sessionId;
        socket.data.name = inputName || "کاربر";
        socket.data.isAdmin = false;
        
        try {
            const sessionRes = await pool.query(
                'SELECT name FROM sessions WHERE id = $1',
                [sessionId]
            );
            if (sessionRes.rows.length > 0) {
                socket.data.name = sessionRes.rows[0].name;
            }
        } catch (err) {
            console.error("Error restoring session:", err);
        }
        
        return next();
    }

    next(new Error("احراز هویت ناموفق"));
});

// ========== رویدادهای Socket ==========
io.on('connection', (socket) => {
    
    const handleAuth = async () => {
        const { sessionId, isAdmin, name } = socket.data;

        if (isAdmin) {
            socket.join('admin_room');
            socket.join(sessionId);
            try {
                const users = await pool.query(`
                    SELECT 
                        s.id, 
                        s.name, 
                        s.last_active,
                        (SELECT COUNT(*)::int FROM p_messages m 
                         WHERE m.session_id = s.id 
                         AND m.is_admin = FALSE 
                         AND m.is_read = FALSE) as unread_count
                    FROM sessions s
                    ORDER BY 
                        CASE WHEN s.last_active > NOW() - INTERVAL '5 minutes' THEN 0 ELSE 1 END,
                        s.last_active DESC 
                    LIMIT 50
                `);
                socket.emit('admin_inbox', users.rows);
            } catch (err) {
                console.error("Error fetching users:", err);
            }
        } else {
            socket.join(sessionId);
            try {
                await pool.query(
                    `INSERT INTO sessions (id, name) VALUES ($1, $2) 
                     ON CONFLICT (id) DO UPDATE SET 
                     name = $2, 
                     last_active = CURRENT_TIMESTAMP`,
                    [sessionId, name]
                );
            } catch (err) {
                console.error("Error saving session:", err);
            }
        }

        socket.emit('auth_success', { 
            isAdmin, 
            name, 
            sessionId,
            reconnectCount: socket.data.reconnectCount 
        });
    };
    handleAuth();

    socket.on('get_history', async (data) => {
        const { sessionId, limit } = data;
        const targetSession = socket.data.isAdmin ? sessionId : socket.data.sessionId;
        if (!targetSession) return;
        try {
            const res = await pool.query(
                `SELECT 
                    m.id, m.session_id, m.is_admin, m.text, m.reply_to_id, m.is_read, m.created_at,
                    r.text as reply_text, r.is_admin as reply_admin
                 FROM p_messages m
                 LEFT JOIN p_messages r ON m.reply_to_id = r.id
                 WHERE m.session_id = $1 
                 ORDER BY m.created_at DESC LIMIT $2`,
                [targetSession, limit || 50]
            );
            const messages = res.rows.map(m => ({
                id: m.id, sessionId: m.session_id, isAdmin: m.is_admin, text: m.text, replyToId: m.reply_to_id, is_read: m.is_read, created_at: m.created_at,
                replyTo: m.reply_to_id ? { text: m.reply_text, isAdmin: m.reply_admin } : null
            }));
            socket.emit('history_data', messages);
        } catch (err) { console.error("Error fetching history:", err); }
    });

    socket.on('get_older_history', async (data) => {
        const { sessionId, before, limit } = data;
        const targetSession = socket.data.isAdmin ? sessionId : socket.data.sessionId;
        if (!targetSession || !before) return;
        try {
            const res = await pool.query(
                `SELECT 
                    m.id, m.session_id, m.is_admin, m.text, m.reply_to_id, m.is_read, m.created_at,
                    r.text as reply_text, r.is_admin as reply_admin
                 FROM p_messages m
                 LEFT JOIN p_messages r ON m.reply_to_id = r.id
                 WHERE m.session_id = $1 AND m.created_at < $2
                 ORDER BY m.created_at DESC LIMIT $3`,
                [targetSession, before, limit || 20]
            );
            const messages = res.rows.map(m => ({
                id: m.id, sessionId: m.session_id, isAdmin: m.is_admin, text: m.text, replyToId: m.reply_to_id, is_read: m.is_read, created_at: m.created_at,
                replyTo: m.reply_to_id ? { text: m.reply_text, isAdmin: m.reply_admin } : null
            }));
            socket.emit('older_history_data', { messages });
        } catch (err) { console.error("Error fetching older history:", err); }
    });

    socket.on('message', async (data) => {
        const { sessionId, text, tempId, replyToId } = data;
        const isSenderAdmin = socket.data.isAdmin;
        if (!text || !sessionId) return;
        try {
            let query, params;
            if (replyToId) {
                query = 'INSERT INTO p_messages (session_id, is_admin, text, reply_to_id) VALUES ($1, $2, $3, $4) RETURNING id, created_at';
                params = [sessionId, isSenderAdmin, text, replyToId];
            } else {
                query = 'INSERT INTO p_messages (session_id, is_admin, text) VALUES ($1, $2, $3) RETURNING id, created_at';
                params = [sessionId, isSenderAdmin, text];
            }
            const res = await pool.query(query, params);
            await pool.query('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [sessionId]);

            let replyToMessage = null;
            if (replyToId) {
                const replyRes = await pool.query('SELECT id, text, is_admin FROM p_messages WHERE id = $1', [replyToId]);
                if (replyRes.rows.length > 0) {
                    replyToMessage = { text: replyRes.rows[0].text, isAdmin: replyRes.rows[0].is_admin };
                }
            }

            const payload = {
                id: res.rows[0].id, sessionId, text, isAdmin: isSenderAdmin, is_read: false, created_at: res.rows[0].created_at, tempId,
                replyTo: replyToMessage, replyToId: replyToId
            };

            io.to(sessionId).emit('message_receive', payload);
            if (isSenderAdmin) {
                socket.to('admin_room').emit('message_receive', payload);
            } else {
                io.to('admin_room').emit('message_receive', payload);
                io.to('admin_room').emit('list_update', { id: sessionId, name: socket.data.name, last_active: new Date(), increment_unread: true });
            }
        } catch (err) { console.error("Error sending message:", err); }
    });

    socket.on('mark_seen', async ({ sessionId, viewerIsAdmin }) => {
        try {
            const targetIsAdmin = !viewerIsAdmin;
            const result = await pool.query(
                'UPDATE p_messages SET is_read = TRUE WHERE session_id = $1 AND is_admin = $2 AND is_read = FALSE RETURNING id',
                [sessionId, targetIsAdmin]
            );
            if (result.rowCount > 0) {
                io.to(sessionId).emit('msgs_seen_update');
                io.to('admin_room').emit('msgs_seen_update');
                if (viewerIsAdmin) {
                    io.to('admin_room').emit('list_update', { id: sessionId, reset_unread: true });
                }
            }
        } catch (err) { console.error("Error in mark_seen:", err); }
    });

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
            await pool.query('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [socket.data.sessionId]);
        }
    });

    socket.on('request_missed_messages', async (data) => {
         const { lastMessageId, sessionId } = data;
         if (!sessionId) return;
         if (!socket.data.isAdmin && socket.data.sessionId !== sessionId) return;
         try {
             const res = await pool.query(
                 `SELECT m.*, r.text as reply_text, r.is_admin as reply_admin
                  FROM p_messages m
                  LEFT JOIN p_messages r ON m.reply_to_id = r.id
                  WHERE m.session_id = $1 AND m.id > $2 ORDER BY m.created_at ASC`,
                 [sessionId, lastMessageId || 0]
             );
             if (res.rows.length > 0) {
                 const messages = res.rows.map(m => ({
                     id: m.id, sessionId: m.session_id, isAdmin: m.is_admin, text: m.text, replyToId: m.reply_to_id, is_read: m.is_read, created_at: m.created_at,
                     replyTo: m.reply_to_id ? { text: m.reply_text, isAdmin: m.reply_admin } : null
                 }));
                 socket.emit('missed_messages', messages);
             }
         } catch (err) { console.error("Error fetching missed messages:", err); }
    });
});
