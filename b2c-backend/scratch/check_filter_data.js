const mysql = require('mysql2/promise');
async function run() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'vogstya_jewellery'
    });
    const [rows] = await conn.execute('SELECT * FROM shops');
    console.log("Shops In DB:", rows);
    const [count] = await conn.execute('SELECT shop_id, COUNT(*) as total FROM products GROUP BY shop_id');
    console.log("Products per Shop:", count);
    await conn.end();
  } catch (err) {
    console.error(err);
  }
}
run();
