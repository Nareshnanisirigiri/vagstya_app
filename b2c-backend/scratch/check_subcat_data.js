import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sathyavogue_db'
  });

  const [rows] = await connection.query('SELECT id, name, category_id FROM sub_categories LIMIT 5');
  console.log('Sub Categories Sample:', rows);

  const [cats] = await connection.query('SELECT id, name FROM categories WHERE status = 1');
  console.log('Categories Metadata Sample:', cats);

  await connection.end();
}

checkData();
