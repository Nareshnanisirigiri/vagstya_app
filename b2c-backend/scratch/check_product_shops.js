const mysql = require('mysql2/promise');
async function run() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'vogstya_jewellery'
    });
    const [rows] = await conn.execute('SELECT shop_id, COUNT(*) as count FROM products GROUP BY shop_id');
    console.log("Shop ID Counts:", rows);
    await conn.end();
  } catch (err) {
    console.error(err);
  }
}
run();
