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
  // برای اعمال تغییرات دیتابیس، یکبار دو خط زیر را از کامنت خارج و دیپلوی کنید، سپس دوباره کامنت کنید
  // await client.query('DROP TABLE IF EXISTS p_messages');
  // await client.query('DROP TABLE IF EXISTS sessions');

  await client.query(`CREATE TABLE IF NOT EXISTS sessions (id VARCHAR(100) PRIMARY KEY, name VARCHAR(100), last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await client.query(`CREATE TABLE IF NOT EXISTS p_messages (id SERIAL PRIMARY KEY, session_id VARCHAR(100), is_admin BOOLEAN, text TEXT, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
}
initDB();

const ADMIN_PASS = process.env.ADMIN_PASSWORD || "12345";
const ADMIN_NAME = "سیگار با ته‌چین ماست";

io.on('connection', (socket) => {
  
  // 1. احراز هویت و ورود به اتاق
  socket.on('auth', async ({ sessionId, inputName }) => {
    let isAdmin = false;
    let name = inputName;

    if (inputName && inputName.startsWith("admin:")) {
      if (inputName.split(":")[1] === ADMIN_PASS) {
        isAdmin = true;
        name = ADMIN_NAME;
        socket.join('admin_room');
        const users = await client.query('SELECT * FROM sessions ORDER BY last_active DESC LIMIT 50');
        socket.emit('admin_inbox', users.rows);
      }
    }

    if (!isAdmin) {
      socket.join(sessionId); // کاربر حتما باید عضو اتاق خودش شود
      // آپدیت نام کاربر در دیتابیس
      await client.query('INSERT INTO sessions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2, last_active = CURRENT_TIMESTAMP', [sessionId, name]);
      io.to('admin_room').emit('session_update', { id: sessionId, name, last_active: new Date() });
    }

    socket.emit('auth_success', { isAdmin, name });
  });

  // 2. تغییر نام آنی (AJAX)
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
    if (isAdmin && !isRealAdmin) return; 

    // ذخیره
    const res = await client.query('INSERT INTO p_messages (session_id, is_admin, text) VALUES ($1, $2, $3) RETURNING id', [sessionId, isRealAdmin, text]);
    await client.query('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [sessionId]);

    const msgData = { 
      id: res.rows[0].id,
      sessionId, 
      text, 
      isAdmin: isRealAdmin, 
      is_read: false,
      created_at: new Date(),
      tempId: tempId // شناسه موقت برای جلوگیری از تکرار در فرانت
    };

    // ارسال به همه (کاربر و ادمین)
    io.to(sessionId).emit('message_receive', msgData);
    io.to('admin_room').emit('message_receive', msgData);
    
    if (!isRealAdmin) io.to('admin_room').emit('new_user_msg', msgData);
  });

  // 4. تیک دوم (Seen)
  socket.on('mark_seen', async ({ sessionId, viewerIsAdmin }) => {
    await client.query(
      'UPDATE p_messages SET is_read = TRUE WHERE session_id = $1 AND is_admin = $2 AND is_read = FALSE',
      [sessionId, !viewerIsAdmin]
    );
    io.to(sessionId).emit('msgs_seen_update');
    io.to('admin_room').emit('msgs_seen_update', { sessionId });
  });

  socket.on('get_history', async (sessionId) => {
    if (socket.rooms.has('admin_room') || socket.rooms.has(sessionId)) {
      const res = await client.query('SELECT * FROM p_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 100', [sessionId]);
      socket.emit('history_data', res.rows);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server Started'));
