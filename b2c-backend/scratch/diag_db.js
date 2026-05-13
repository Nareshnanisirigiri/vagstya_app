const mysql = require('mysql2/promise');
async function run() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'vogstya_jewellery'
    });
    
    // Check columns
    const [cols] = await conn.execute('DESCRIBE products');
    console.log("Columns:", cols.map(c => c.Field));
    
    // Check sample data
    const [rows] = await conn.execute('SELECT id, name, approval_status FROM products LIMIT 5');
    console.log("Sample Data:", rows);
    
    // Check total count
    const [count] = await conn.execute('SELECT COUNT(*) as total FROM products');
    console.log("Total products:", count[0].total);
    
    // Check counts by status
    const [statusCounts] = await conn.execute('SELECT approval_status, COUNT(*) as count FROM products GROUP BY approval_status');
    console.log("Status Counts:", statusCounts);

    await conn.end();
  } catch (err) {
    console.error(err);
  }
}
run();
