
import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sathyavogue_db'
});

const queries = [
  "ALTER TABLE flash_sales MODIFY COLUMN thumbnail LONGTEXT",
  "ALTER TABLE products MODIFY COLUMN image LONGTEXT",
  "ALTER TABLE products MODIFY COLUMN image_url LONGTEXT"
];

db.connect(err => {
  if (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to DB');
  
  let completed = 0;
  queries.forEach(q => {
    db.query(q, (err) => {
      if (err) console.error('Query failed:', q, err.message);
      else console.log('Query success:', q);
      completed++;
      if (completed === queries.length) {
        db.end();
        console.log('All migrations applied');
      }
    });
  });
});
