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
  // پاکسازی و ساخت مجدد جداول برای جلوگیری از تداخل
  await client.query('DROP TABLE IF EXISTS p_messages');
  await client.query('DROP TABLE IF EXISTS sessions');
  
  await client.query(`CREATE TABLE sessions (id VARCHAR(100) PRIMARY KEY, name VARCHAR(100), last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await client.query(`CREATE TABLE p_messages (id SERIAL PRIMARY KEY, session_id VARCHAR(100), is_admin BOOLEAN, text TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  console.log('Tables Re-created');
}

initDB().catch(console.error);

const ADMIN_PASS = process.env.ADMIN_PASSWORD || "12345";

io.on('connection', (socket) => {
  // این بخش جدید است که قالب شما منتظرش است
  socket.on('auth', async ({ sessionId, inputName }) => {
    let isAdmin = false;
    let name = inputName;

    if (inputName.startsWith("admin:")) {
      if (inputName.split(":")[1] === ADMIN_PASS) {
        isAdmin = true;
        name = "مدیر";
        socket.join('admin_room');
      }
    }

    socket.join(sessionId);
    // تاییدیه به فرانت
    socket.emit('auth_success', { isAdmin, name });

    if (isAdmin) {
      const users = await client.query('SELECT * FROM sessions ORDER BY last_active DESC LIMIT 50');
      socket.emit('admin_inbox', users.rows);
    } else {
      await client.query('INSERT INTO sessions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2, last_active = CURRENT_TIMESTAMP', [sessionId, name]);
      io.to('admin_room').emit('session_update', { id: sessionId, name, last_active: new Date() });
    }
  });

  socket.on('message', async ({ sessionId, text, isAdmin }) => {
    // تشخیص هویت واقعی سمت سرور
    const realAdmin = socket.rooms.has('admin_room');
    
    // اگر کسی سعی کرد ادای مدیر را در بیاورد ولی مدیر نبود، بلاک شود
    if (isAdmin && !realAdmin) return; 

    await client.query('INSERT INTO p_messages (session_id, is_admin, text) VALUES ($1, $2, $3)', [sessionId, realAdmin, text]);
    await client.query('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [sessionId]);

    const msg = { sessionId, text, isAdmin: realAdmin, created_at: new Date() };

    // ارسال به کاربر (و مدیری که در اتاق کاربر است)
    io.to(sessionId).emit('message_receive', msg);
    
    // اگر فرستنده کاربر است، به اتاق مدیران هم زنگ بزن
    if (!realAdmin) {
      io.to('admin_room').emit('new_user_msg', msg);
    }
  });

  socket.on('get_history', async (sessionId) => {
    if (socket.rooms.has('admin_room') || socket.rooms.has(sessionId)) {
      const res = await client.query('SELECT * FROM p_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 100', [sessionId]);
      socket.emit('history_data', res.rows);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server Running'));
