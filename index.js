require('dotenv').config(); // بارگذاری متغیرهای محیطی
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { Pool } = require('pg'); // استفاده از Pool به جای Client
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // در محیط پروداکشن بهتر است آدرس وبلاگ خود را بگذارید
        methods: ["GET", "POST"]
    }
});

// اتصال به دیتابیس با استفاده از Pool (پایدارتر)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // برای Render و Heroku الزامی است
});

// رمز عبور ادمین از متغیرهای محیطی خوانده می‌شود
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; 

async function initDB() {
    try {
        const client = await pool.connect();
        console.log('DB Connected Successfully');
        
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
    } catch (err) {
        console.error('DB Connection Error:', err);
    }
}
initDB();

io.on('connection', (socket) => {
    
    // 1. احراز هویت
    socket.on('auth', async ({ sessionId, inputName }) => {
        let isAdmin = false;
        let finalName = inputName;

        // بررسی اینکه آیا کاربر قصد ورود به عنوان ادمین را دارد؟
        if (inputName && inputName.startsWith("admin:")) {
            const providedPass = inputName.split("admin:")[1];
            
            // چک کردن رمز عبور با متغیر محیطی
            if (providedPass === ADMIN_PASSWORD) {
                isAdmin = true;
                finalName = "سیگار با ته‌چین ماست"; // نام نمایشی ادمین
                socket.join('admin_room');
                console.log("Admin connected!");
                
                // ارسال لیست کاربران اخیر برای ادمین
                try {
                    const result = await pool.query('SELECT * FROM sessions ORDER BY last_active DESC LIMIT 50');
                    socket.emit('admin_inbox', result.rows);
                } catch (e) { console.error(e); }
            }
        }

        if (!isAdmin) {
            // کاربر معمولی
            socket.join(sessionId); 
            // اگر نام معتبر بود، در دیتابیس بروزرسانی کن
            if (finalName && !finalName.startsWith("admin:")) {
                try {
                    await pool.query(
                        'INSERT INTO sessions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2, last_active = CURRENT_TIMESTAMP',
                        [sessionId, finalName]
                    );
                    // خبر دادن به ادمین که کاربر فعال شد
                    io.to('admin_room').emit('session_update', { id: sessionId, name: finalName, last_active: new Date() });
                } catch (e) { console.error(e); }
            }
        }

        // نتیجه را به کلاینت برمی‌گردانیم
        socket.emit('auth_success', { isAdmin, name: finalName });
    });

    // 2. تغییر نام کاربر
    socket.on('change_name', async ({ sessionId, newName, isAdmin }) => {
        if (!isAdmin) {
            try {
                await pool.query('UPDATE sessions SET name = $1 WHERE id = $2', [newName, sessionId]);
                io.to('admin_room').emit('session_update', { id: sessionId, name: newName, last_active: new Date() });
                socket.emit('name_changed', newName);
            } catch (e) { console.error(e); }
        }
    });

    // 3. ارسال پیام
    socket.on('message', async (data) => {
        const { sessionId, text, tempId } = data;
        // نکته: ما isAdmin را از دیتای کلاینت نمی‌گیریم چون قابل جعل است.
        // چک می‌کنیم آیا این سوکت واقعا در اتاق ادمین هست یا نه.
        const isSenderAdmin = socket.rooms.has('admin_room');

        if (!text || !sessionId) return;

        try {
            // ذخیره در دیتابیس
            const res = await pool.query(
                'INSERT INTO p_messages (session_id, is_admin, text) VALUES ($1, $2, $3) RETURNING id, created_at',
                [sessionId, isSenderAdmin, text]
            );

            // بروزرسانی زمان آخرین فعالیت کاربر
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

            // **اصلاح مهم:** ارسال پیام
            // ۱. ارسال به خود کاربر (چه گیرنده باشد چه فرستنده)
            io.to(sessionId).emit('message_receive', msgPayload);
            
            // ۲. ارسال به ادمین (تا در پنل ادمین هم دیده شود)
            io.to('admin_room').emit('message_receive', msgPayload);

            // اگر فرستنده کاربر بود، یک نوتیفیکیشن خاص به ادمین بده تا لیستش آپدیت شود
            if (!isSenderAdmin) {
                io.to('admin_room').emit('new_user_msg', msgPayload);
            }

        } catch (e) {
            console.error("Message Save Error:", e);
        }
    });

    // 4. سین کردن پیام‌ها
    socket.on('mark_seen', async ({ sessionId, viewerIsAdmin }) => {
        try {
            // اگر ادمین دیده، پیام‌های کاربر (is_admin=false) سین می‌شوند
            // اگر کاربر دیده، پیام‌های ادمین (is_admin=true) سین می‌شوند
            const targetIsAdminMsg = !viewerIsAdmin; 
            
            await pool.query(
                'UPDATE p_messages SET is_read = TRUE WHERE session_id = $1 AND is_admin = $2 AND is_read = FALSE',
                [sessionId, targetIsAdminMsg]
            );

            // اطلاع‌رسانی به هر دو طرف که تیک دوم بخورد
            io.to(sessionId).emit('msgs_seen_update');
            io.to('admin_room').emit('msgs_seen_update');
        } catch (e) { console.error(e); }
    });

    // 5. دریافت تاریخچه
    socket.on('get_history', async (targetSessionId) => {
        // فقط ادمین یا صاحب سشن حق دسترسی دارند
        if (socket.rooms.has('admin_room') || socket.rooms.has(targetSessionId)) {
            try {
                const res = await pool.query(
                    'SELECT * FROM p_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 100',
                    [targetSessionId]
                );
                
                // فرمت‌دهی برای فرانت
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
