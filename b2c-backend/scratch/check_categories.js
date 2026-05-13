import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkCategories() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sathyavogue_db'
  });

  const [rows] = await connection.query('SELECT id, name, status FROM categories');
  console.log('All Categories:', rows);

  await connection.end();
}

checkCategories();
