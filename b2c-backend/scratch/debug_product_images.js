const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

const sql = `
  SELECT p.id, p.name, p.media_id, m.src 
  FROM products p 
  LEFT JOIN media m ON m.id = p.media_id 
  ORDER BY p.id DESC 
  LIMIT 5
`;

db.query(sql, (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("Recent Products and Media:");
  console.log(JSON.stringify(rows, null, 2));
  db.end();
});
