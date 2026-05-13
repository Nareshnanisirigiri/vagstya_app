import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function debugSubCategory() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sathyavogue_db'
  });

  const [rows] = await connection.query('SELECT id, name, category_id FROM sub_categories ORDER BY id DESC LIMIT 5');
  console.log('Last 5 Sub Categories:', JSON.stringify(rows, null, 2));

  await connection.end();
}

debugSubCategory();
