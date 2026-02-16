require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

// پیکربندی آپلود فایل چندتایی
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + safeName);
    }
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static(uploadDir));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// ========== دیتابیس =========
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
        try {
            await client.query(`
                INSERT INTO sessions (id, name, last_active) 
                VALUES ('ADMIN', 'سیگار با ته‌چین ماست', CURRENT_TIMESTAMP) 
                ON CONFLICT (id) DO NOTHING
            `);
        } catch (e) {}

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

        const alterQueries = [
            `ALTER TABLE p_messages ADD COLUMN IF NOT EXISTS reply_to_id INTEGER DEFAULT NULL`,
            `ALTER TABLE p_messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb`,
            `ALTER TABLE p_messages ADD COLUMN IF NOT EXISTS file_url TEXT DEFAULT NULL`,
            `ALTER TABLE p_messages ADD COLUMN IF NOT EXISTS file_name VARCHAR(255) DEFAULT NULL`,
            `ALTER TABLE p_messages ADD COLUMN IF NOT EXISTS file_type VARCHAR(100) DEFAULT NULL`,
            `ALTER TABLE p_messages ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb`,
            `ALTER TABLE p_messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE`
        ];

        for (let q of alterQueries) {
            try { await client.query(q); } catch (e) { } 
        }
        client.release();
        console.log("✅ Database structure checked and updated successfully");
    } catch (err) { console.error("❌ Database error:", err); }
}
initDB();

app.post('/upload', upload.array('files', 10), (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).send('No files uploaded.');
    const fileList = req.files.map(f => ({
        url: '/uploads/' + f.filename,
        name: f.originalname,
        type: f.mimetype
    }));
    res.json({ files: fileList });
});

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
                await pool.query("UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = 'ADMIN'");
                socket.broadcast.emit('admin_status_change', { is_online: true });
                const users = await pool.query(`
                    SELECT s.id, s.name, s.last_active,
                    (SELECT COUNT(*)::int FROM p_messages m WHERE m.session_id = s.id AND m.is_admin = FALSE AND m.is_read = FALSE) as unread_count
                    FROM sessions s ORDER BY last_active DESC LIMIT 50
                `);
                const mappedUsers = users.rows.map(r => {
                    const room = io.sockets.adapter.rooms.get(r.id);
                    return { ...r, is_online: !!(room && room.size > 0) };
                });
                socket.emit('admin_inbox', mappedUsers);
            } catch (err) {}
        } else {
            socket.join(sessionId);
            io.to('admin_room').emit('user_status_change', { id: sessionId, is_online: true, last_active: new Date() });
            try {
                await pool.query('INSERT INTO sessions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2, last_active = CURRENT_TIMESTAMP', [sessionId, name]);
                socket.emit('get_history', { sessionId, limit: 50 });
            } catch (err) {}
        }
        socket.emit('auth_success', { isAdmin, name, sessionId });
    };
    handleAuth();

    socket.on('check_status', async (targetId) => {
        let isOnline = false, lastActive = null;
        if (targetId === 'ADMIN') {
            const room = io.sockets.adapter.rooms.get('admin_room');
            isOnline = !!(room && room.size > 0);
            if (!isOnline) {
                try {
                    const res = await pool.query("SELECT last_active FROM sessions WHERE id = 'ADMIN'");
                    if (res.rows.length > 0) lastActive = res.rows[0].last_active;
                } catch(e) {}
            }
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

    socket.on('message', async (data) => {
        const { sessionId, text, tempId, replyToId, files, file_url, file_name, file_type } = data;
        const isSenderAdmin = socket.data.isAdmin;

        let finalFiles = files || [];
        if (file_url && finalFiles.length === 0) {
            finalFiles.push({ url: file_url, name: file_name, type: file_type });
        }

        if (!sessionId || (!text && finalFiles.length === 0)) return;

        try {
            const res = await pool.query(
                `INSERT INTO p_messages 
                (session_id, is_admin, text, reply_to_id, reactions, files, file_url, file_name, file_type) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, created_at`,
                [sessionId, isSenderAdmin, text || '', replyToId || null, '{}', JSON.stringify(finalFiles), file_url||null, file_name||null, file_type||null]
            );

            await pool.query('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [sessionId]);
            if (isSenderAdmin) await pool.query("UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = 'ADMIN'");

            let replyData = null;
            if (replyToId) {
                const parentMsg = await pool.query('SELECT text, is_admin FROM p_messages WHERE id = $1', [replyToId]);
                if (parentMsg.rows.length > 0) {
                    replyData = { id: replyToId, text: parentMsg.rows[0].text, isAdmin: parentMsg.rows[0].is_admin };
                }
            }

            const payload = {
                id: res.rows[0].id,
                sessionId, text: text || '', isAdmin: isSenderAdmin, is_read: false, created_at: res.rows[0].created_at, tempId,
                reply_to: replyData, reactions: {}, files: finalFiles, file_url, file_name, file_type, is_edited: false
            };

            // ارسال پیام به همه اعضای اتاق به جز خود فرستنده
            socket.to(sessionId).emit('message_receive', payload);
            
            // ارسال به خود فرستنده با tempId
            socket.emit('message_receive', { ...payload, isOwnMessage: true });

            if (isSenderAdmin) {
                socket.to('admin_room').emit('message_receive', payload);
            } else {
                io.to('admin_room').emit('message_receive', payload);
                io.to('admin_room').emit('list_update', { id: sessionId, name: socket.data.name, last_active: new Date(), increment_unread: true, is_online: true });
            }
        } catch (err) { console.error("Error sending message:", err); }
    });

    socket.on('edit_message', async ({ messageId, newText }) => {
        try {
            const res = await pool.query('SELECT session_id, is_admin FROM p_messages WHERE id = $1', [messageId]);
            if (res.rows.length === 0) return;
            const msg = res.rows[0];
            const isOwner = socket.data.isAdmin ? msg.is_admin : (!msg.is_admin && msg.session_id === socket.data.sessionId);
            
            if (isOwner) {
                await pool.query('UPDATE p_messages SET text = $1, is_edited = TRUE WHERE id = $2', [newText, messageId]);
                const payload = { messageId, newText };
                io.to(msg.session_id).emit('message_edited', payload);
                io.to('admin_room').emit('message_edited', payload);
            }
        } catch (err) { console.error("Error editing message:", err); }
    });

    socket.on('send_reaction', async (data) => {
        const { messageId, emoji } = data;
        const reactorId = socket.data.isAdmin ? "ADMIN" : socket.data.sessionId;
        if (!messageId || !emoji) return;

        try {
            const res = await pool.query('SELECT reactions, session_id FROM p_messages WHERE id = $1', [messageId]);
            if (res.rows.length === 0) return;

            let currentReactions = res.rows[0].reactions || {};
            const chatSessionId = res.rows[0].session_id;
            
            if (!currentReactions[emoji]) currentReactions[emoji] = [];
            if (currentReactions[emoji].includes(reactorId)) {
                currentReactions[emoji] = currentReactions[emoji].filter(id => id !== reactorId);
                if (currentReactions[emoji].length === 0) delete currentReactions[emoji];
            } else {
                currentReactions[emoji].push(reactorId);
            }

            await pool.query('UPDATE p_messages SET reactions = $1 WHERE id = $2', [JSON.stringify(currentReactions), messageId]);
            const updatePayload = { messageId, reactions: currentReactions };

            io.to(chatSessionId).emit('reaction_update', updatePayload);
            io.to('admin_room').emit('reaction_update', updatePayload);
        } catch (err) { console.error("Error setting reaction:", err); }
    });

    socket.on('mark_seen', async ({ sessionId, viewerIsAdmin }) => {
        try {
            const targetIsAdmin = !viewerIsAdmin;
            const upRes = await pool.query('UPDATE p_messages SET is_read = TRUE WHERE session_id = $1 AND is_admin = $2 AND is_read = FALSE', [sessionId, targetIsAdmin]);
            io.to(sessionId).emit('msgs_seen_update', { sessionId, readerIsAdmin: viewerIsAdmin });
            io.to('admin_room').emit('msgs_seen_update', { sessionId, readerIsAdmin: viewerIsAdmin });
            if (viewerIsAdmin) io.to('admin_room').emit('list_update', { id: sessionId, reset_unread: true });
        } catch (err) {}
    });

    socket.on('get_history', async (data) => {
        const { sessionId, limit = 50 } = data || {};
        if (!sessionId || (!socket.data.isAdmin && socket.data.sessionId !== sessionId)) return;
        try {
            const query = `
                SELECT m.*, p.text as reply_text, p.is_admin as reply_admin_flag 
                FROM p_messages m LEFT JOIN p_messages p ON m.reply_to_id = p.id
                WHERE m.session_id = $1 ORDER BY m.created_at DESC LIMIT $2
            `;
            const res = await pool.query(query, [sessionId, limit]);
            socket.emit('history_data', res.rows.map(m => ({
                id: m.id, sessionId: m.session_id, isAdmin: m.is_admin, text: m.text, is_read: m.is_read, created_at: m.created_at,
                reactions: m.reactions || {}, files: m.files || [], file_url: m.file_url, file_name: m.file_name, file_type: m.file_type, is_edited: m.is_edited,
                reply_to: m.reply_to_id ? { id: m.reply_to_id, text: m.reply_text, isAdmin: m.reply_admin_flag } : null
            })));
        } catch (err) { console.error(err); }
    });

    socket.on('get_older_history', async (data) => {
        const { sessionId, before, limit = 20 } = data || {};
        if (!sessionId || !before || (!socket.data.isAdmin && socket.data.sessionId !== sessionId)) return;
        try {
            const query = `
                SELECT m.*, p.text as reply_text, p.is_admin as reply_admin_flag 
                FROM p_messages m LEFT JOIN p_messages p ON m.reply_to_id = p.id
                WHERE m.session_id = $1 AND m.created_at < $2 ORDER BY m.created_at DESC LIMIT $3
            `;
            const res = await pool.query(query, [sessionId, before, limit]);
            socket.emit('older_history_data', {
                messages: res.rows.map(m => ({
                    id: m.id, sessionId: m.session_id, isAdmin: m.is_admin, text: m.text, is_read: m.is_read, created_at: m.created_at,
                    reactions: m.reactions || {}, files: m.files || [], file_url: m.file_url, file_name: m.file_name, file_type: m.file_type, is_edited: m.is_edited,
                    reply_to: m.reply_to_id ? { id: m.reply_to_id, text: m.reply_text, isAdmin: m.reply_admin_flag } : null
                }))
            });
        } catch (err) { console.error(err); }
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
            const now = new Date();
            await pool.query('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [socket.data.sessionId]);
            io.to('admin_room').emit('user_status_change', { id: socket.data.sessionId, is_online: false, last_active: now });
        } else if (socket.data.isAdmin) {
            const room = io.sockets.adapter.rooms.get('admin_room');
            if (!room || room.size === 0) {
                const now = new Date();
                try { await pool.query("UPDATE sessions SET last_active = $1 WHERE id = 'ADMIN'", [now]); } catch(e){}
                socket.broadcast.emit('admin_status_change', { is_online: false, last_active: now });
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log(`🚀 Server running on port ${PORT}`); });
