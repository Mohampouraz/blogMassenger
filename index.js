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
        await client.query(`CREATE TABLE IF NOT EXISTS sessions (id VARCHAR(100) PRIMARY KEY, name VARCHAR(100), last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await client.query(`CREATE TABLE IF NOT EXISTS p_messages (id SERIAL PRIMARY KEY, session_id VARCHAR(100), is_admin BOOLEAN, text TEXT, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        client.release();
        console.log(">>> DB Connected");
    } catch (err) { console.error("DB Error", err); }
}
initDB();

io.on('connection', (socket) => {
    // 1. احراز هویت (Login)
    socket.on('auth', async ({ sessionId, inputName, token }) => {
        let isAdmin = false;
        let finalName = inputName || "کاربر";

        // اولویت با توکن است (برای اتصال مجدد ادمین)
        const passCheck = token || inputName;
        
        if (passCheck && passCheck.startsWith("admin:")) {
            const pass = passCheck.split("admin:")[1];
            if (pass === ADMIN_PASSWORD) {
                isAdmin = true;
                finalName = "سیگار با ته‌چین ماست";
                socket.join('admin_room');
                // ادمین نیازی به جوین شدن در اتاق‌های تکی ندارد، چون قدرت ارسال به همه را دارد
                const users = await pool.query('SELECT * FROM sessions ORDER BY last_active DESC LIMIT 50');
                socket.emit('admin_inbox', users.rows);
                console.log(`>>> Admin Re-Connected: ${socket.id}`);
            }
        }

        if (!isAdmin) {
            socket.join(sessionId);
            if (finalName && !finalName.startsWith("admin:")) {
                await pool.query('INSERT INTO sessions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2, last_active = CURRENT_TIMESTAMP', [sessionId, finalName]);
                io.to('admin_room').emit('session_update', { id: sessionId, name: finalName, last_active: new Date() });
            }
        }

        socket.emit('auth_success', { isAdmin, name: finalName, sessionId });
    });

    // 2. ارسال پیام
    socket.on('message', async (data) => {
        const { sessionId, text, tempId } = data;
        const isSenderAdmin = socket.rooms.has('admin_room'); // چک کردن واقعی ادمین بودن

        if (!text || !sessionId) return;

        // اگر ادمین نیست، مطمئن شویم در اتاق خودش است
        if (!isSenderAdmin) socket.join(sessionId);

        try {
            // ذخیره در دیتابیس
            const res = await pool.query('INSERT INTO p_messages (session_id, is_admin, text) VALUES ($1, $2, $3) RETURNING id, created_at', [sessionId, isSenderAdmin, text]);
            await pool.query('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [sessionId]);

            const payload = {
                id: res.rows[0].id,
                sessionId, text, 
                isAdmin: isSenderAdmin, // این فیلد حیاتی است که بنفش یا زرد بودن را تعیین میکند
                is_read: false, 
                created_at: res.rows[0].created_at, 
                tempId 
            };

            // ارسال به کاربر (با استفاده از ID نشست)
            io.to(sessionId).emit('message_receive', payload);
            
            // ارسال به ادمین (برای نمایش در پنل)
            io.to('admin_room').emit('message_receive', payload);

            if (!isSenderAdmin) {
                io.to('admin_room').emit('new_user_msg', payload);
            }
        } catch (e) { console.error(e); }
    });

    // 3. سین خوردن
    socket.on('mark_seen', async ({ sessionId, viewerIsAdmin }) => {
        try {
            const targetIsAdmin = !viewerIsAdmin;
            await pool.query('UPDATE p_messages SET is_read = TRUE WHERE session_id = $1 AND is_admin = $2 AND is_read = FALSE', [sessionId, targetIsAdmin]);
            io.to(sessionId).emit('msgs_seen_update');
            io.to('admin_room').emit('msgs_seen_update');
        } catch (e) { console.error(e); }
    });

    // 4. تاریخچه
    socket.on('get_history', async (sessionId) => {
        if (socket.rooms.has('admin_room') || socket.rooms.has(sessionId)) {
            const res = await pool.query('SELECT * FROM p_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 100', [sessionId]);
            socket.emit('history_data', res.rows.map(r => ({ ...r, sessionId: r.session_id, isAdmin: r.is_admin, is_read: r.is_read })));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server Running ${PORT}`));
