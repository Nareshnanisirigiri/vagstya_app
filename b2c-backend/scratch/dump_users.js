const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL || 'mysql://root:RreCscXnKjUWhhWpXlZUKNqAHevPzOks@mysql.railway.internal:3306/railway');
    const [rows] = await connection.query('SELECT id, name, email, role FROM users LIMIT 20');
    console.log('All Users from database (Top 20):');
    console.table(rows);
    await connection.end();
  } catch (error) {
    console.error('Error checking users:', error.message);
  }
}
run();
