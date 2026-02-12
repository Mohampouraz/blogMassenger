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
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// اتصال به دیتابیس
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// رمز عبور ادمین از متغیر محیطی (Environment Variable)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; 

async function initDB() {
    try {
        const client = await pool.connect();
        console.log('DB Connected Successfully');
        
        // ایجاد جدول نشست‌ها
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
        client.release();
    } catch (err) {
        console.error('DB Connection Error:', err);
    }
}
initDB();

io.on('connection', (socket) => {
    
    // 1. احراز هویت (Login/Auth)
    socket.on('auth', async ({ sessionId, inputName }) => {
        let isAdmin = false;
        let finalName = inputName;

        // بررسی اینکه آیا کاربر ادمین است؟ (فرمت ورودی: admin:PASSWORD)
        if (inputName && inputName.startsWith("admin:")) {
            const providedPass = inputName.split("admin:")[1];
            
            if (providedPass === ADMIN_PASSWORD) {
                isAdmin = true;
                finalName = "سیگار با ته‌چین ماست";
                socket.join('admin_room');
                console.log("Admin connected!");
                
                // ارسال لیست کاربران (مرتب شده بر اساس آخرین فعالیت)
                // این باعث می‌شود کاربر جدید همیشه در بالا باشد
                try {
                    const result = await pool.query('SELECT * FROM sessions ORDER BY last_active DESC LIMIT 50');
                    socket.emit('admin_inbox', result.rows);
                } catch (e) { console.error(e); }
            }
        }

        if (!isAdmin) {
            // کاربر معمولی
            socket.join(sessionId); 
            // بروزرسانی نام و زمان فعالیت در دیتابیس
            if (finalName && !finalName.startsWith("admin:")) {
                try {
                    await pool.query(
                        'INSERT INTO sessions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2, last_active = CURRENT_TIMESTAMP',
                        [sessionId, finalName]
                    );
                    // خبر دادن به ادمین که کاربری آنلاین شد
                    io.to('admin_room').emit('session_update', { id: sessionId, name: finalName, last_active: new Date() });
                } catch (e) { console.error(e); }
            }
        }

        // نتیجه احراز هویت را به کلاینت برمی‌گردانیم
        socket.emit('auth_success', { isAdmin, name: finalName, sessionId: sessionId });
    });

    // 2. تغییر نام کاربر
    socket.on('change_name', async ({ sessionId, newName, isAdmin }) => {
        if (!isAdmin) {
            try {
                await pool.query('UPDATE sessions SET name = $1 WHERE id = $2', [newName, sessionId]);
                // آپدیت کردن لیست ادمین
                io.to('admin_room').emit('session_update', { id: sessionId, name: newName, last_active: new Date() });
                socket.emit('name_changed', newName);
            } catch (e) { console.error(e); }
        }
    });

    // 3. دریافت و ارسال پیام (بخش حیاتی)
    socket.on('message', async (data) => {
        const { sessionId, text, tempId } = data;
        
        // بررسی امنیتی: آیا فرستنده واقعاً در اتاق ادمین است؟
        const isSenderAdmin = socket.rooms.has('admin_room');

        if (!text || !sessionId) return;

        // اصلاح مهم: اگر فرستنده کاربر است، مطمئن شو که در اتاق خودش عضو است
        // این خط مشکل "عدم دریافت پاسخ" را حل می‌کند اگر سوکت قطع و وصل شده باشد
        if (!isSenderAdmin) {
             socket.join(sessionId);
        }

        try {
            // ذخیره در دیتابیس
            const res = await pool.query(
                'INSERT INTO p_messages (session_id, is_admin, text) VALUES ($1, $2, $3) RETURNING id, created_at',
                [sessionId, isSenderAdmin, text]
            );

            // بروزرسانی زمان آخرین فعالیت (تا کاربر بیاید بالای لیست ادمین)
            await pool.query('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [sessionId]);

            const msgPayload = { 
                id: res.rows[0].id,
                sessionId: sessionId, 
                text: text, 
                isAdmin: isSenderAdmin, 
                is_read: false,
                created_at: res.rows[0].created_at,
                tempId: tempId
            };

            // الف) ارسال به اتاق کاربر (چه خودش فرستاده باشد چه ادمین)
            io.to(sessionId).emit('message_receive', msgPayload);
            
            // ب) ارسال به اتاق ادمین (تا ادمین همیشه همه پیام‌ها را ببیند)
            io.to('admin_room').emit('message_receive', msgPayload);

            // ج) اگر پیام از سمت کاربر بود، به ادمین بگو لیستش را رفرش کند
            if (!isSenderAdmin) {
                // ارسال کل آبجکت نشست برای آپدیت لیست
                // ما نام کاربر را هم دوباره می‌گیریم تا لیست دقیق باشد
                const userQuery = await pool.query('SELECT name FROM sessions WHERE id = $1', [sessionId]);
                const userName = userQuery.rows.length > 0 ? userQuery.rows[0].name : "کاربر";
                
                io.to('admin_room').emit('session_update', { 
                    id: sessionId, 
                    name: userName, 
                    last_active: new Date(),
                    last_msg: text // برای نمایش پیش‌نمایش پیام (اختیاری)
                });
                
                io.to('admin_room').emit('new_user_msg', msgPayload);
            }

        } catch (e) {
            console.error("Message Save Error:", e);
        }
    });

    // 4. سین کردن پیام‌ها (تیک دوم)
    socket.on('mark_seen', async ({ sessionId, viewerIsAdmin }) => {
        try {
            // اگر بیننده ادمین است، پیام‌های کاربر باید سین شوند
            // اگر بیننده کاربر است، پیام‌های ادمین باید سین شوند
            const targetMsgIsAdmin = !viewerIsAdmin; 
            
            await pool.query(
                'UPDATE p_messages SET is_read = TRUE WHERE session_id = $1 AND is_admin = $2 AND is_read = FALSE',
                [sessionId, targetMsgIsAdmin]
            );

            // اطلاع‌رسانی به هر دو طرف
            io.to(sessionId).emit('msgs_seen_update');
            io.to('admin_room').emit('msgs_seen_update');
        } catch (e) { console.error(e); }
    });

    // 5. دریافت تاریخچه پیام‌ها
    socket.on('get_history', async (targetSessionId) => {
        // فقط ادمین یا خود صاحب نشست حق دیدن تاریخچه را دارند
        if (socket.rooms.has('admin_room') || socket.rooms.has(targetSessionId)) {
            try {
                const res = await pool.query(
                    'SELECT * FROM p_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 100',
                    [targetSessionId]
                );
                
                const rows = res.rows.map(r => ({
                    text: r.text,
                    isAdmin: r.is_admin,
                    is_read: r.is_read,
                    created_at: r.created_at,
                    sessionId: r.session_id
                }));
                
                socket.emit('history_data', rows);
            } catch (e) { console.error(e); }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
