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

client.connect().then(async () => {
  console.log('DB Connected');
  await client.query(`CREATE TABLE IF NOT EXISTS sessions (id VARCHAR(100) PRIMARY KEY, name VARCHAR(100), last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await client.query(`CREATE TABLE IF NOT EXISTS p_messages (id SERIAL PRIMARY KEY, session_id VARCHAR(100), is_admin BOOLEAN, text TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
});

io.on('connection', (socket) => {
  socket.on('register', async ({ sessionId, name, isAdmin }) => {
    socket.join(sessionId); 
    if (isAdmin) {
      socket.join('admin_room'); // مدیر عضو اتاق مدیران می‌شود
      const users = await client.query('SELECT * FROM sessions ORDER BY last_active DESC LIMIT 50');
      socket.emit('admin_inbox', users.rows);
    } else {
      await client.query('INSERT INTO sessions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2, last_active = CURRENT_TIMESTAMP', [sessionId, name]);
      io.to('admin_room').emit('session_update', { id: sessionId, name, last_active: new Date() });
    }
  });

  socket.on('message', async ({ sessionId, text, isAdmin, senderName }) => {
    if (!text) return;
    await client.query('INSERT INTO p_messages (session_id, is_admin, text) VALUES ($1, $2, $3)', [sessionId, isAdmin, text]);
    await client.query('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [sessionId]);

    const msgData = { sessionId, text, isAdmin, created_at: new Date() };

    // ارسال آنی به خود کاربر و مدیر
    io.to(sessionId).emit('message_receive', msgData); // برای کاربر (و مدیر اگر داخل چت باشد)
    
    if (!isAdmin) {
        // اگر فرستنده کاربر است، به اتاق مدیران هم زنگ بزن
        io.to('admin_room').emit('new_user_msg', { ...msgData, name: senderName });
    }
  });

  socket.on('get_history', async (sessionId) => {
    const res = await client.query('SELECT * FROM p_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 100', [sessionId]);
    socket.emit('history_data', res.rows);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server Running'));
