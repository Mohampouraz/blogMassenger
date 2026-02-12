const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { Client } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  await client.connect();
  console.log('DB Connected');
  // ساخت جداول (اگر وجود ندارند)
  await client.query(`CREATE TABLE IF NOT EXISTS sessions (id VARCHAR(100) PRIMARY KEY, name VARCHAR(100), last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await client.query(`CREATE TABLE IF NOT EXISTS p_messages (id SERIAL PRIMARY KEY, session_id VARCHAR(100), is_admin BOOLEAN, text TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
}
initDB();

const ADMIN_PASS = process.env.ADMIN_PASSWORD || "12345";

io.on('connection', (socket) => {
  // 1. ورود و تعیین نقش
  socket.on('auth', async ({ sessionId, inputName }) => {
    let isAdmin = false;
    let name = inputName;

    // تشخیص مدیر
    if (inputName && inputName.startsWith("admin:")) {
      if (inputName.split(":")[1] === ADMIN_PASS) {
        isAdmin = true;
        name = "سیگار با ته‌چین ماست";
        socket.join('admin_room'); // عضویت در اتاق مدیران
        
        // ارسال لیست آخرین کاربران به مدیر
        const users = await client.query('SELECT * FROM sessions ORDER BY last_active DESC LIMIT 50');
        socket.emit('admin_inbox', users.rows);
      }
    }

    if (!isAdmin) {
      socket.join(sessionId); // عضویت در اتاق اختصاصی کاربر
      // ذخیره نام کاربر
      await client.query('INSERT INTO sessions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2, last_active = CURRENT_TIMESTAMP', [sessionId, name]);
      // اطلاع به مدیر که کاربری آنلاین شد
      io.to('admin_room').emit('session_update', { id: sessionId, name, last_active: new Date() });
    }

    socket.emit('auth_success', { isAdmin, name });
  });

  // 2. دریافت و پخش پیام
  socket.on('message', async ({ sessionId, text, isAdmin }) => {
    if (!text) return;

    // ذخیره در دیتابیس
    await client.query('INSERT INTO p_messages (session_id, is_admin, text) VALUES ($1, $2, $3)', [sessionId, isAdmin, text]);
    await client.query('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [sessionId]);

    const msgData = { 
      sessionId, 
      text, 
      isAdmin, 
      created_at: new Date() 
    };

    // *** تغییر مهم: ارسال اجباری به هر دو طرف ***
    
    // الف) ارسال به اتاق کاربر (خود کاربر و اگر ادمین جوین شده باشد)
    io.to(sessionId).emit('message_receive', msgData);

    // ب) ارسال به اتاق مدیریت (برای نوتیفیکیشن و آپدیت زنده)
    io.to('admin_room').emit('message_receive', msgData);
    
    // ج) اگر پیام از طرف کاربر است، لیست اینباکس مدیر را رفرش کن
    if (!isAdmin) {
        io.to('admin_room').emit('new_user_msg', msgData);
    }
  });

  // 3. دریافت تاریخچه
  socket.on('get_history', async (sessionId) => {
      const res = await client.query('SELECT * FROM p_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 100', [sessionId]);
      socket.emit('history_data', res.rows);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server Started'));
