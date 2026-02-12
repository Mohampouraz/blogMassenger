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
    
    socket.data = { sessionId: null, isAdmin: false, name: "کاربر" };

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
            
            try {
                const users = await pool.query(`
                    SELECT s.id, s.name, s.last_active,
                    (SELECT COUNT(*)::int FROM p_messages m WHERE m.session_id = s.id AND m.is_admin = FALSE AND m.is_read = FALSE) as unread_count
                    FROM sessions s
                    ORDER BY last_active DESC LIMIT 50
                `);
                socket.emit('admin_inbox', users.rows);
            } catch (err) {
                console.error("Error fetching users:", err);
            }
        } else {
            socket.join(sessionId);
            try {
                await pool.query(
                    'INSERT INTO sessions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2, last_active = CURRENT_TIMESTAMP',
                    [sessionId, name]
                );
            } catch (err) {
                console.error("Error saving session:", err);
            }
        }

        socket.emit('auth_success', { isAdmin, name, sessionId });
    };
    handleAuth();

    // === 2. ارسال پیام ===
    socket.on('message', async (data) => {
        const { sessionId, text, tempId } = data;
        const isSenderAdmin = socket.data.isAdmin;

        if (!text || !sessionId) return;

        try {
            const res = await pool.query(
                'INSERT INTO p_messages (session_id, is_admin, text) VALUES ($1, $2, $3) RETURNING id, created_at',
                [sessionId, isSenderAdmin, text]
            );

            await pool.query('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [sessionId]);

            const payload = {
                id: res.rows[0].id,
                sessionId,
                text,
                isAdmin: isSenderAdmin,
                is_read: false,
                created_at: res.rows[0].created_at,
                tempId
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
                    increment_unread: true
                });
            }

        } catch (err) {
            console.error("Error sending message:", err);
        }
    });

    // === 3. دیده شدن پیام ===
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

    // === 4. تاریخچه ===
    socket.on('get_history', async (sessionId) => {
        if (!socket.data.isAdmin && socket.data.sessionId !== sessionId) return;
        try {
            const res = await pool.query(
                'SELECT * FROM p_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 100',
                [sessionId]
            );
            socket.emit('history_data', res.rows.map(m => ({
                id: m.id, sessionId: m.session_id, isAdmin: m.is_admin, text: m.text, is_read: m.is_read, created_at: m.created_at
            })));
        } catch (err) { console.error(err); }
    });

    // === 5. تایپینگ ===
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
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
