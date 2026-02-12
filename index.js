const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { Client } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// اتصال دیتابیس
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect().then(async () => {
  console.log('DB Connected');
  // ساخت جدول کاربران و پیام‌ها
  await client.query(`CREATE TABLE IF NOT EXISTS sessions (id VARCHAR(100) PRIMARY KEY, name VARCHAR(100), last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await client.query(`CREATE TABLE IF NOT EXISTS p_messages (id SERIAL PRIMARY KEY, session_id VARCHAR(100), is_admin BOOLEAN, text TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
});

io.on('connection', (socket) => {
  // 1. ثبت نام کاربر یا مدیر
  socket.on('register', async ({ sessionId, name, isAdmin }) => {
    socket.join(sessionId); // عضویت در اتاق اختصاصی (برای مدیر: اتاق 'admin')
    
    if (isAdmin) {
      // اگر مدیر است، لیست تمام چت‌ها را بفرست
      const users = await client.query('SELECT * FROM sessions ORDER BY last_active DESC LIMIT 50');
      socket.emit('admin_inbox', users.rows);
    } else {
      // اگر کاربر است، نامش را ذخیره/آپدیت کن
      await client.query('INSERT INTO sessions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2, last_active = CURRENT_TIMESTAMP', [sessionId, name]);
      // به مدیر خبر بده یک کاربر آنلاین شد
      io.to('admin_room').emit('session_update', { id: sessionId, name, last_active: new Date() });
    }
  });

  // 2. دریافت پیام
  socket.on('message', async ({ sessionId, text, isAdmin, senderName }) => {
    if (!text) return;
    
    // ذخیره پیام
    await client.query('INSERT INTO p_messages (session_id, is_admin, text) VALUES ($1, $2, $3)', [sessionId, isAdmin, text]);
    // آپدیت زمان آخرین فعالیت
    await client.query('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [sessionId]);

    const msgData = { sessionId, text, isAdmin, created_at: new Date() };

    if (isAdmin) {
      // پیام مدیر: ارسال به کاربر خاص + پخش در دستگاه‌های دیگر مدیر
      io.to(sessionId).emit('message_receive', msgData);
      io.to('admin_room').emit('message_receive', msgData); 
    } else {
      // پیام کاربر: ارسال به خودش + ارسال به اتاق مدیران
      socket.emit('message_receive', msgData);
      io.to('admin_room').emit('new_user_msg', { ...msgData, name: senderName });
    }
  });

  // 3. لود تاریخچه چت خاص
  socket.on('get_history', async (sessionId) => {
    const res = await client.query('SELECT * FROM p_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 100', [sessionId]);
    socket.emit('history_data', res.rows);
  });

  // ورود به اتاق مدیریت برای شنیدن زنگ‌ها
  socket.on('join_admin_feed', () => socket.join('admin_room'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server OK'));
