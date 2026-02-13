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
        await client.query(`
            CREATE TABLE IF NOT EXISTS message_replies (
                id SERIAL PRIMARY KEY, 
                message_id INTEGER REFERENCES p_messages(id) ON DELETE CASCADE, 
                reply_to_id INTEGER REFERENCES p_messages(id) ON DELETE CASCADE, 
                reply_text TEXT, 
                reply_is_admin BOOLEAN, 
                reply_created_at TIMESTAMP, 
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

io.on('connection', (socket) => {
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
                    ORDER BY s.last_active DESC LIMIT 50
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
                socket.emit('get_history', { sessionId, limit: 50 });
            } catch (err) {
                console.error("Error saving session:", err);
            }
        }

        socket.emit('auth_success', { isAdmin, name, sessionId });
    };
    handleAuth();

    socket.on('message', async (data) => {
        const { sessionId, text, tempId, replyTo } = data;
        const isSenderAdmin = socket.data.isAdmin;

        if (!text || !sessionId) return;

        try {
            const res = await pool.query(
                'INSERT INTO p_messages (session_id, is_admin, text) VALUES ($1, $2, $3) RETURNING id, created_at',
                [sessionId, isSenderAdmin, text]
            );

            const messageId = res.rows[0].id;
            const createdAt = res.rows[0].created_at;

            await pool.query(
                'UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', 
                [sessionId]
            );

            const payload = {
                id: messageId,
                sessionId,
                text,
                isAdmin: isSenderAdmin,
                is_read: false,
                created_at: createdAt,
                tempId
            };

            if (replyTo) {
                try {
                    const findOriginalMsg = await pool.query(
                        'SELECT id FROM p_messages WHERE session_id = $1 AND text = $2 AND created_at = $3',
                        [sessionId, replyTo.text, replyTo.time]
                    );
                    if (findOriginalMsg.rows.length > 0) {
                        const replyToId = findOriginalMsg.rows[0].id;
                        await pool.query(
                            'INSERT INTO message_replies (message_id, reply_to_id, reply_text, reply_is_admin, reply_created_at) VALUES ($1, $2, $3, $4, $5)',
                            [messageId, replyToId, replyTo.text, replyTo.isAdmin, replyTo.time]
                        );
                        payload.replyTo = {
                            id: replyToId,
                            text: replyTo.text,
                            isAdmin: replyTo.isAdmin,
                            time: replyTo.time
                        };
                    }
                } catch (replyErr) {
                    console.error("Error saving reply:", replyErr);
                }
            }

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
        } catch (err) { 
            console.error(err); 
        }
    });

    socket.on('get_history', async (data) => {
        const { sessionId, limit = 50 } = data || {};
        if (!sessionId || (!socket.data.isAdmin && socket.data.sessionId !== sessionId)) return;
        try {
            const res = await pool.query(
                `SELECT m.*, 
                json_build_object(
                    'id', r.reply_to_id,
                    'text', r.reply_text,
                    'isAdmin', r.reply_is_admin,
                    'time', r.reply_created_at
                ) as reply_to
                FROM p_messages m
                LEFT JOIN message_replies r ON r.message_id = m.id
                WHERE m.session_id = $1 
                ORDER BY m.created_at DESC 
                LIMIT $2`,
                [sessionId, limit]
            );
            
            socket.emit('history_data', res.rows.map(m => ({
                id: m.id, 
                sessionId: m.session_id, 
                isAdmin: m.is_admin, 
                text: m.text, 
                is_read: m.is_read, 
                created_at: m.created_at,
                replyTo: m.reply_to && m.reply_to.id ? m.reply_to : null
            })));
        } catch (err) { 
            console.error(err); 
        }
    });

    socket.on('get_older_history', async (data) => {
        const { sessionId, before, limit = 20 } = data || {};
        if (!sessionId || !before || (!socket.data.isAdmin && socket.data.sessionId !== sessionId)) return;
        try {
            const res = await pool.query(
                `SELECT m.*, 
                json_build_object(
                    'id', r.reply_to_id,
                    'text', r.reply_text,
                    'isAdmin', r.reply_is_admin,
                    'time', r.reply_created_at
                ) as reply_to
                FROM p_messages m
                LEFT JOIN message_replies r ON r.message_id = m.id
                WHERE m.session_id = $1 AND m.created_at < $2 
                ORDER BY m.created_at DESC 
                LIMIT $3`,
                [sessionId, before, limit]
            );
            socket.emit('older_history_data', {
                messages: res.rows.map(m => ({
                    id: m.id, 
                    sessionId: m.session_id, 
                    isAdmin: m.is_admin, 
                    text: m.text, 
                    is_read: m.is_read, 
                    created_at: m.created_at,
                    replyTo: m.reply_to && m.reply_to.id ? m.reply_to : null
                }))
            });
        } catch (err) { 
            console.error(err); 
        }
    });

    socket.on('typing', (data) => {
        const sessionId = data.sessionId || socket.data.sessionId;
        const isAdmin = socket.data.isAdmin;
        if (isAdmin) {
            socket.to(sessionId).emit('typing', { sessionId, isAdmin: true });
        } else {
            socket.to('admin_room').emit('typing', { sessionId, isAdmin: false });
        }
    });

    socket.on('stop_typing', (data) => {
        const sessionId = data.sessionId || socket.data.sessionId;
        const isAdmin = socket.data.isAdmin;
        if (isAdmin) {
            socket.to(sessionId).emit('stop_typing', { sessionId, isAdmin: true });
        } else {
            socket.to('admin_room').emit('stop_typing', { sessionId, isAdmin: false });
        }
    });

    socket.on('disconnect', async () => {
        if (!socket.data.isAdmin && socket.data.sessionId) {
            await pool.query(
                'UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', 
                [socket.data.sessionId]
            );
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
