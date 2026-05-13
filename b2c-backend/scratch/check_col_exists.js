const mysql = require('mysql2');
const conn = mysql.createConnection(process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/vagstya');
conn.query("SHOW COLUMNS FROM products LIKE 'sold_quantity'", (err, rows) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('COLUMN EXISTS:', rows.length > 0);
  console.log('DETAILS:', JSON.stringify(rows, null, 2));
  conn.end();
});
