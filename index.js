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

// دیتابیس
async function initDB() {
    try {
        const client = await pool.connect();
        await client.query(`CREATE TABLE IF NOT EXISTS sessions (id VARCHAR(100) PRIMARY KEY, name VARCHAR(100), last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await client.query(`CREATE TABLE IF NOT EXISTS p_messages (id SERIAL PRIMARY KEY, session_id VARCHAR(100), is_admin BOOLEAN, text TEXT, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        client.release();
        console.log(">>> Database Connected");
    } catch (err) { console.error("DB Error:", err); }
}
initDB();

io.on('connection', (socket) => {
    console.log(`>>> New Socket Connected: ${socket.id}`);

    // 1. احراز هویت و عضویت در اتاق (مهمترین بخش)
    socket.on('auth', async ({ sessionId, inputName }) => {
        let isAdmin = false;
        let finalName = inputName || "کاربر ناشناس";

        // چک کردن ادمین
        if (inputName && inputName.startsWith("admin:")) {
            const pass = inputName.split("admin:")[1];
            if (pass === ADMIN_PASSWORD) {
                isAdmin = true;
                finalName = "سیگار با ته‌چین ماست";
                socket.join('admin_room');
                console.log(`>>> Admin Joined 'admin_room'`);
                
                // لیست کاربران برای ادمین
                const result = await pool.query('SELECT * FROM sessions ORDER BY last_active DESC LIMIT 50');
                socket.emit('admin_inbox', result.rows);
            }
        }

        if (!isAdmin) {
            // *** فیکس اصلی: کاربر حتما باید در اتاق خودش جوین شود ***
            socket.join(sessionId); 
            console.log(`>>> User ${finalName} Joined Room: ${sessionId}`);

            // ذخیره در دیتابیس
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
        const isSenderAdmin = socket.rooms.has('admin_room');

        if (!text || !sessionId) return;

        // لاگ برای دیباگ: ببینیم پیام داره کجا میره
        console.log(`>>> MSG from ${isSenderAdmin ? 'Admin' : 'User'} to Room: ${sessionId}`);

        // اگر کاربر معمولی است، چک کن که حتما تو اتاقش باشه (محکم کاری)
        if (!isSenderAdmin) socket.join(sessionId);

        try {
            const res = await pool.query('INSERT INTO p_messages (session_id, is_admin, text) VALUES ($1, $2, $3) RETURNING id, created_at', [sessionId, isSenderAdmin, text]);
            await pool.query('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [sessionId]);

            const msgPayload = { 
                id: res.rows[0].id,
                sessionId, text, 
                isAdmin: isSenderAdmin, 
                is_read: false, 
                created_at: res.rows[0].created_at, 
                tempId 
            };

            // ارسال به اتاق کاربر (چه ادمین فرستاده باشه چه خود کاربر)
            io.to(sessionId).emit('message_receive', msgPayload);
            
            // ارسال به اتاق ادمین (تا ادمین هم ببینه)
            io.to('admin_room').emit('message_receive', msgPayload);

            // آپدیت لیست ادمین اگر کاربر پیام داد
            if (!isSenderAdmin) {
                io.to('admin_room').emit('new_user_msg', msgPayload);
            }

        } catch (e) { console.error("Message Error:", e); }
    });

    // 3. سین خوردن (Real-time Fix)
    socket.on('mark_seen', async ({ sessionId, viewerIsAdmin }) => {
        try {
            // اگر ادمین دیده، پیام‌های کاربر (is_admin=false) سین میخورن
            // اگر کاربر دیده، پیام‌های ادمین (is_admin=true) سین میخورن
            const targetIsAdmin = !viewerIsAdmin; 
            
            await pool.query('UPDATE p_messages SET is_read = TRUE WHERE session_id = $1 AND is_admin = $2 AND is_read = FALSE', [sessionId, targetIsAdmin]);

            console.log(`>>> SEEN fired for room: ${sessionId}`);
            
            // خبر دادن به اتاق کاربر (برای دو تیک شدن سمت کاربر)
            io.to(sessionId).emit('msgs_seen_update');
            
            // خبر دادن به ادمین
            io.to('admin_room').emit('msgs_seen_update');
            
        } catch (e) { console.error(e); }
    });

    // 4. دریافت تاریخچه
    socket.on('get_history', async (sessionId) => {
        if (socket.rooms.has('admin_room') || socket.rooms.has(sessionId)) {
            const res = await pool.query('SELECT * FROM p_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 100', [sessionId]);
            socket.emit('history_data', res.rows.map(r => ({ ...r, sessionId: r.session_id, isAdmin: r.is_admin, is_read: r.is_read })));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
