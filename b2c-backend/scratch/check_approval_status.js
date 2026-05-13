const mysql = require('mysql2/promise');
async function run() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'vogstya_jewellery'
    });
    const [rows] = await conn.execute('SELECT approval_status, COUNT(*) as count FROM products GROUP BY approval_status');
    console.log(JSON.stringify(rows, null, 2));
    await conn.end();
  } catch (err) {
    console.error(err);
  }
}
run();
