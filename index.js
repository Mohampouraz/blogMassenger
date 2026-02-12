require('dotenv').config(); // بارگذاری متغیرهای محیطی برای دسترسی به DATABASE_URL
const { Pool } = require('pg');

// تنظیمات اتصال دقیقاً مشابه فایل اصلی سرور
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // تنظیمات SSL برای سرورهای ابری مثل Render/Heroku
});

async function wipeDB() {
    const client = await pool.connect();
    
    try {
        console.log('⚠️  Starting Database Wipe...');

        // حذف جدول پیام‌ها (اول این حذف می‌شود چون ممکن است به سشن‌ها وابسته باشد)
        await client.query('DROP TABLE IF EXISTS p_messages');
        console.log('✅ Table "p_messages" dropped.');

        // حذف جدول سشن‌ها
        await client.query('DROP TABLE IF EXISTS sessions');
        console.log('✅ Table "sessions" dropped.');

        console.log('🚀 Database wiped successfully! Restart your server to recreate tables.');

    } catch (err) {
        console.error('❌ Error wiping database:', err);
    } finally {
        client.release();
        await pool.end(); // بستن اتصال به دیتابیس
    }
}

// اجرای تابع
wipeDB();
