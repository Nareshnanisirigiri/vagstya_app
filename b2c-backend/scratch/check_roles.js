const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL || 'mysql://root:RreCscXnKjUWhhWpXlZUKNqAHevPzOks@mysql.railway.internal:3306/railway');
    const [rows] = await connection.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    console.log('Roles found in users table:');
    console.table(rows);
    await connection.end();
  } catch (error) {
    console.error('Error checking roles:', error.message);
  }
}
run();
