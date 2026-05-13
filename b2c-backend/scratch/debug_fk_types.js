import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  const [shops] = await connection.execute('DESCRIBE shops');
  const [colors] = await connection.execute('DESCRIBE colors');
  const [sizes] = await connection.execute('DESCRIBE sizes');
  
  console.log('SHOPS SCHEMA:');
  console.log(JSON.stringify(shops, null, 2));
  console.log('COLORS SCHEMA:');
  console.log(JSON.stringify(colors, null, 2));
  console.log('SIZES SCHEMA:');
  console.log(JSON.stringify(sizes, null, 2));
  
  await connection.end();
}

run().catch(console.error);
