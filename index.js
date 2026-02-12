const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { Client } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // اجازه دسترسی به همه دامنه‌ها (برای بلاگفا)
    methods: ["GET", "POST"]
  }
});

// اتصال به دیتابیس با آدرس شما
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://webcomment_user:XgkZamnr6Y0cnhpwLaaW3BjqZf9St1cp@dpg-d66k28i4d50c73bri9rg-a.frankfurt-postgres.render.com/webcomment',
  ssl: { rejectUnauthorized: false }
};

const client = new Client(dbConfig);
client.connect()
  .then(() => {
    console.log('Connected to PostgreSQL');
    // ساخت جدول اگر وجود نداشته باشد
    return client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50),
        text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  })
  .catch(err => console.error('DB Error', err));

io.on('connection', async (socket) => {
  console.log('A user connected');

  // 1. ارسال 50 پیام آخر به کاربری که تازه وارد شده
  try {
    const res = await client.query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 50');
    socket.emit('load_history', res.rows.reverse());
  } catch (e) {
    console.error(e);
  }

  // 2. دریافت پیام جدید
  socket.on('send_message', async (data) => {
    const { username, text } = data;
    if(!text || !username) return;

    try {
      // ذخیره در دیتابیس
      const res = await client.query(
        'INSERT INTO messages (username, text) VALUES ($1, $2) RETURNING *',
        [username, text]
      );
      const savedMsg = res.rows[0];
      
      // پخش پیام به همه افراد آنلاین
      io.emit('receive_message', savedMsg);
    } catch (e) {
      console.error(e);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
