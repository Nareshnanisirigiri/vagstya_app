const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || 'root',
  database: process.env.DB_NAME || 'sathyavogue_db'
});

db.connect((err) => {
  if (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL.');
  
  db.query('SHOW TABLES', (err, results) => {
    if (err) {
      console.error('Query error:', err);
    } else {
      console.log('Tables:', JSON.stringify(results, null, 2));
    }
    db.end();
    process.exit(0);
  });
});
