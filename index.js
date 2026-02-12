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
  console.log('DB Connected and Ready for Chat');
  // نکته: کدهای حذف جدول را برداشتیم چون دیتابیس شما الان ساخته شده است
}
initDB();

const ADMIN_PASS = process.env.ADMIN_PASSWORD || "12345";
const ADMIN_NAME = "سیگار با ته‌چین ماست";

io.on('connection', (socket) => {
  
  // 1. احراز هویت و ورود
  socket.on('auth', async ({ sessionId, inputName }) => {
    let isAdmin = false;
    let name = inputName;

    if (inputName && inputName.startsWith("admin:")) {
      if (inputName.split(":")[1] === ADMIN_PASS) {
        isAdmin = true;
        name = ADMIN_NAME;
        socket.join('admin_room');
        // دریافت لیست کاربران برای ادمین
        const users = await client.query('SELECT * FROM sessions ORDER BY last_active DESC LIMIT 50');
        socket.emit('admin_inbox', users.rows);
      }
    }

    if (!isAdmin) {
      socket.join(sessionId); 
      // ثبت یا بروزرسانی نام کاربر
      await client.query('INSERT INTO sessions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2, last_active = CURRENT_TIMESTAMP', [sessionId, name]);
      io.to('admin_room').emit('session_update', { id: sessionId, name, last_active: new Date() });
    }

    socket.emit('auth_success', { isAdmin, name });
  });

  // 2. تغییر نام
  socket.on('change_name', async ({ sessionId, newName, isAdmin }) => {
    if (!isAdmin) {
        await client.query('UPDATE sessions SET name = $1 WHERE id = $2', [newName, sessionId]);
        io.to('admin_room').emit('session_update', { id: sessionId, name: newName, last_active: new Date() });
    }
    socket.emit('name_changed', newName);
  });

  // 3. ارسال پیام
  socket.on('message', async ({ sessionId, text, isAdmin, tempId }) => {
    if (!text) return;
    const isRealAdmin = socket.rooms.has('admin_room');
    
    // اعتبارسنجی ادمین بودن واقعی
    const finalIsAdmin = (isAdmin && isRealAdmin);

    // ذخیره در دیتابیس
    const res = await client.query('INSERT INTO p_messages (session_id, is_admin, text) VALUES ($1, $2, $3) RETURNING id', [sessionId, finalIsAdmin, text]);
    await client.query('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [sessionId]);

    const msgData = { 
      id: res.rows[0].id,
      sessionId, 
      text, 
      isAdmin: finalIsAdmin, 
      is_read: false,
      created_at: new Date(),
      tempId: tempId // برگرداندن شناسه موقت برای جلوگیری از تکرار در فرانت
    };

    // ارسال به کاربر و ادمین
    io.to(sessionId).emit('message_receive', msgData);
    io.to('admin_room').emit('message_receive', msgData);
    
    if (!finalIsAdmin) io.to('admin_room').emit('new_user_msg', msgData);
  });

  // 4. تیک دوم (خوانده شدن)
  socket.on('mark_seen', async ({ sessionId, viewerIsAdmin }) => {
    await client.query(
      'UPDATE p_messages SET is_read = TRUE WHERE session_id = $1 AND is_admin = $2 AND is_read = FALSE',
      [sessionId, !viewerIsAdmin]
    );
    io.to(sessionId).emit('msgs_seen_update');
    io.to('admin_room').emit('msgs_seen_update', { sessionId });
  });

  // 5. تاریخچه پیام‌ها
  socket.on('get_history', async (sessionId) => {
    if (socket.rooms.has('admin_room') || socket.rooms.has(sessionId)) {
      const res = await client.query('SELECT * FROM p_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 100', [sessionId]);
      
      // استانداردسازی نام‌ها برای فرانت
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
