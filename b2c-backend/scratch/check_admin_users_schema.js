const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'vogstya_jewellery'
    });

    try {
        const [columns] = await connection.query('SHOW COLUMNS FROM admin_users');
        console.log('Schema for admin_users:');
        console.table(columns);
    } catch (e) {
        console.error('Error fetching schema:', e.message);
    } finally {
        await connection.end();
    }
}

checkSchema();
