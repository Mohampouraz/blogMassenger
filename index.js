const { Client } = require('pg');

// تنظیمات اتصال به دیتابیس (از متغیرهای محیطی Render می‌خواند)
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // این خط برای اتصال به Render و Neon ضروری است
});

async function wipeAndRebuildDB() {
  try {
    await client.connect();
    console.log('🔌 Connected to Database...');

    console.log('🔥 Deleting old tables...');
    // 1. حذف جدول پیام‌ها (چون به سشن وابسته است اول این پاک شود)
    await client.query('DROP TABLE IF EXISTS p_messages');
    // 2. حذف جدول سشن‌ها
    await client.query('DROP TABLE IF EXISTS sessions');

    console.log('🏗️ Creating new tables...');
    
    // 3. ایجاد جدول سشن‌ها (کاربران)
    await client.query(`
      CREATE TABLE sessions (
        id VARCHAR(100) PRIMARY KEY, 
        name VARCHAR(100), 
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. ایجاد جدول پیام‌ها (با ستون وضعیت خواندن)
    await client.query(`
      CREATE TABLE p_messages (
        id SERIAL PRIMARY KEY, 
        session_id VARCHAR(100), 
        is_admin BOOLEAN, 
        text TEXT, 
        is_read BOOLEAN DEFAULT FALSE, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database Wiped and Recreated Successfully!');
  } catch (error) {
    console.error('❌ Error in Database Reset:', error);
  } finally {
    await client.end();
    console.log('🔌 Connection Closed.');
  }
}

// اجرای تابع
wipeAndRebuildDB();
