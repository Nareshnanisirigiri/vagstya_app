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
  
  db.query('SELECT * FROM products LIMIT 10', (err, results) => {
    if (err) {
      console.error('Query error:', err);
    } else {
      console.log('Products:', JSON.stringify(results, null, 2));
    }
    
    db.query('SELECT COUNT(*) as count FROM products', (err, results) => {
        if (err) console.error(err);
        else console.log('Total Products:', results[0].count);
        db.end();
        process.exit(0);
    });
  });
});
