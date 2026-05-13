const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function getSpecs() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });
        const [rows] = await connection.query('SELECT id, name FROM specifications');
        const output = {
            timestamp: new Date().toISOString(),
            specs: rows
        };
        fs.writeFileSync(path.join(__dirname, 'output.json'), JSON.stringify(output, null, 2));
        console.log('Successfully wrote specifications to output.json');
    } catch (err) {
        fs.writeFileSync(path.join(__dirname, 'error.txt'), err.message);
        console.error('Database error:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

getSpecs();
