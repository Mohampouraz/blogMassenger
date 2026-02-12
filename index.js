const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { Client } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// دریافت اطلاعات حساس از متغیرهای محیطی
const DB_URL = process.env.DATABASE_URL;
const ADMIN_SECRET = process.env.ADMIN_PASSWORD || "12345"; // رمز پیش‌فرض اگر ست نکنید

const client = new Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  await client.connect();
  console.log('DB Connected');
  
  // === بخش خطرناک: حذف و ایجاد مجدد دیتابیس ===
  // این دستور تمام اطلاعات قبلی را پاک می‌کند!
  await client.query('DROP TABLE IF EXISTS p_messages');
  await client.query('DROP TABLE IF EXISTS sessions');
  
  console.log('Database Wiped Clean!');

  await client.query(`
    CREATE TABLE sessions (
      id VARCHAR(100) PRIMARY KEY, 
      name VARCHAR(100), 
      is_online BOOLEAN DEFAULT TRUE,
      last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await client.query(`
    CREATE TABLE p_messages (
      id SERIAL PRIMARY KEY, 
      session_id VARCHAR(100), 
      is_admin BOOLEAN, 
      text TEXT, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Tables Re-created.');
}

initDB().catch(e => console.error('DB Init Error:', e));

io.on('connection', (socket) => {
  // تایید هویت فقط در سمت سرور انجام می‌شود
  socket.on('auth', async ({ sessionId, inputName }) => {
    let isAdmin = false;
    let displayName = inputName;

    // چک کردن رمز عبور در سرور
    if (inputName.startsWith("admin:")) {
      const pass = inputName.split(":")[1];
      if (pass === ADMIN_SECRET) {
        isAdmin = true;
        displayName = "مدیر";
        socket.join('admin_room');
      } else {
        // اگر رمز اشتباه بود، به عنوان کاربر عادی با نام غلط وارد می‌شود (یا می‌توان ارور داد)
        isAdmin = false;
      }
    }

    socket.join(sessionId);

    // ارسال نتیجه تایید هویت به فرانت
    socket.emit('auth_success', { isAdmin, name: displayName });

    if (isAdmin) {
      // اگر مدیر است، لیست سشن‌ها را ببیند
      const users = await client.query("SELECT * FROM sessions ORDER BY last_active DESC LIMIT 50");
      socket.emit('admin_inbox', users.rows);
    } else {
      // اگر کاربر است، ذخیره شود
      await client.query(
        "INSERT INTO sessions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2, last_active = CURRENT_TIMESTAMP",
        [sessionId, displayName]
      );
      // اطلاع به مدیر
      io.to('admin_room').emit('session_update', { id: sessionId, name: displayName, last_active: new Date() });
    }
  });

  socket.on('message', async ({ sessionId, text, isAdmin }) => {
    if (!text) return;
    
    // اعتبارسنجی امنیتی: آیا کسی که ادعا می‌کند ادمین است، واقعا در روم ادمین هست؟
    const realAdmin = socket.rooms.has('admin_room');
    if (isAdmin && !realAdmin) return; // جلوگیری از هک

    await client.query("INSERT INTO p_messages (session_id, is_admin, text) VALUES ($1, $2, $3)", [sessionId, realAdmin, text]);
    await client.query("UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1", [sessionId]);

    const msgPayload = { text, isAdmin: realAdmin, created_at: new Date() };
    
    // ارسال به کاربر مربوطه
    io.to(sessionId).emit('message_receive', msgPayload);
    
    // ارسال به مدیران (برای سینک شدن)
    if (!realAdmin) {
       io.to('admin_room').emit('new_user_msg', { sessionId, ...msgPayload });
    }
  });

  socket.on('get_history', async (sessionId) => {
    // فقط مدیر یا صاحب سشن می‌تواند تاریخچه را بگیرد (امنیت)
    if (socket.rooms.has('admin_room') || socket.rooms.has(sessionId)) {
      const res = await client.query("SELECT * FROM p_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 100", [sessionId]);
      socket.emit('history_data', res.rows);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server Running'));
