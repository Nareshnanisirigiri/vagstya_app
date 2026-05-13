const mysql = require('mysql2');
const conn = mysql.createConnection(process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/vagstya');
conn.query("SELECT * FROM products WHERE name LIKE '%Mustard Yellow Printed Saree%'", (err, rows) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(JSON.stringify(rows, null, 2));
  conn.end();
});
