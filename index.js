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
  
  await client.query(`CREATE TABLE IF NOT EXISTS sessions (id VARCHAR(100) PRIMARY KEY, name VARCHAR(100), last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await client.query(`CREATE TABLE IF NOT EXISTS p_messages (id SERIAL PRIMARY KEY, session_id VARCHAR(100), is_admin BOOLEAN, text TEXT, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
}
initDB();

// 🔴 تنظیمات ورود مدیر
const ADMIN_PASS = "@Fazl930105"; // رمز دقیق شما
const ADMIN_DISPLAY_NAME = "سیگار با ته‌چین ماست";

io.on('connection', (socket) => {
  
  // 1. احراز هویت
  socket.on('auth', async ({ sessionId, inputName }) => {
    let isAdmin = false;
    let finalName = inputName;

    // بررسی دقیق پسورد
    if (inputName && inputName.startsWith("admin:")) {
      const providedPass = inputName.split("admin:")[1]; // جدا کردن دقیق
      if (providedPass === ADMIN_PASS) {
        isAdmin = true;
        finalName = ADMIN_DISPLAY_NAME;
        socket.join('admin_room');
        console.log("Admin Logged In!");
        
        // ارسال لیست کاربران برای ادمین
        const users = await client.query('SELECT * FROM sessions ORDER BY last_active DESC LIMIT 50');
        socket.emit('admin_inbox', users.rows);
      }
    }

    if (!isAdmin) {
      socket.join(sessionId); // کاربر عادی عضو اتاق خودش می‌شود
      // ذخیره کاربر در لیست
      await client.query('INSERT INTO sessions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2, last_active = CURRENT_TIMESTAMP', [sessionId, finalName]);
      // اطلاع به ادمین که کاربری آنلاین شد
      io.to('admin_room').emit('session_update', { id: sessionId, name: finalName, last_active: new Date() });
    }

    // نتیجه را به فرانت برمی‌گردانیم
    socket.emit('auth_success', { isAdmin, name: finalName });
  });

  // 2. تغییر نام
  socket.on('change_name', async ({ sessionId, newName, isAdmin }) => {
    if (!isAdmin) {
        await client.query('UPDATE sessions SET name = $1 WHERE id = $2', [newName, sessionId]);
        io.to('admin_room').emit('session_update', { id: sessionId, name: newName, last_active: new Date() });
    }
    socket.emit('name_changed', newName);
  });

  // 3. دریافت و ارسال پیام
  socket.on('message', async (data) => {
    const { sessionId, text, isAdmin, tempId } = data;
    if (!text) return;

    // امنیت: چک کنیم آیا واقعا ادمین است؟
    const isRealAdmin = socket.rooms.has('admin_room');
    
    // اگر کسی سعی کرد ادای ادمین را دربیاورد ولی ادمین نبود، پیامش کاربر ثبت شود
    const finalIsAdmin = (isAdmin && isRealAdmin);

    // ذخیره در دیتابیس
    const res = await client.query('INSERT INTO p_messages (session_id, is_admin, text) VALUES ($1, $2, $3) RETURNING id', [sessionId, finalIsAdmin, text]);
    await client.query('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [sessionId]);

    const msgPayload = { 
      id: res.rows[0].id,
      sessionId, 
      text, 
      isAdmin: finalIsAdmin, 
      is_read: false,
      created_at: new Date(),
      tempId: tempId
    };

    // برادکست به اتاق کاربر
    io.to(sessionId).emit('message_receive', msgPayload);
    // برادکست به اتاق مدیران
    io.to('admin_room').emit('message_receive', msgPayload);
    
    // اگر پیام از کاربر بود، لیست اینباکس ادمین را رفرش کن تا بیاید بالا
    if (!finalIsAdmin) {
        io.to('admin_room').emit('new_user_msg', msgPayload);
    }
  });

  // 4. تیک خوانده شدن
  socket.on('mark_seen', async ({ sessionId, viewerIsAdmin }) => {
    await client.query(
      'UPDATE p_messages SET is_read = TRUE WHERE session_id = $1 AND is_admin = $2 AND is_read = FALSE',
      [sessionId, !viewerIsAdmin]
    );
    io.to(sessionId).emit('msgs_seen_update');
    io.to('admin_room').emit('msgs_seen_update', { sessionId });
  });

  // 5. تاریخچه
  socket.on('get_history', async (sessionId) => {
    // فقط اگر ادمین است یا خود صاحب سشن
    if (socket.rooms.has('admin_room') || socket.rooms.has(sessionId)) {
      const res = await client.query('SELECT * FROM p_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 100', [sessionId]);
      
      const rows = res.rows.map(r => ({
          text: r.text,
          isAdmin: r.is_admin,
          is_read: r.is_read,
          created_at: r.created_at
      }));
      socket.emit('history_data', rows);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server Started'));
