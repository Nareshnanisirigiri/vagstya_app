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
    console.log("Shops:", rows);
    await conn.end();
  } catch (err) {
    console.error(err);
  }
}
run();
