import mysql from 'mysql2';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sathyavogue_db'
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting:', err);
    return;
  }
  
  console.log('Checking sub_categories table schema...');
  connection.query('DESCRIBE sub_categories', (err, results) => {
    if (err) {
      console.error('Error describing sub_categories:', err);
    } else {
      console.table(results);
    }
    
    console.log('Checking categories table contents...');
    connection.query('SELECT id, name FROM categories', (err, cats) => {
      if (err) {
        console.error('Error fetching categories:', err);
      } else {
        console.log('Categories in DB:', cats);
      }
      connection.end();
    });
  });
});
