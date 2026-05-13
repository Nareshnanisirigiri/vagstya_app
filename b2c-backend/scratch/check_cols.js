const mysql = require('mysql2/promise');
async function run() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'vogstya_jewellery'
    });
    const [cols] = await conn.execute('DESCRIBE products');
    console.log(JSON.stringify(cols.map(c => c.Field), null, 2));
    await conn.end();
  } catch (err) {
    console.error(err);
  }
}
run();
