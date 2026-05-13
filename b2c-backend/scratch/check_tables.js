import { db } from "./config/db.js";

async function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(results);
    });
  });
}

async function run() {
  try {
    const [dbResult] = await query("SELECT DATABASE() as dbName");
    const databaseName = dbResult?.dbName || "sathyavogue_db";
    const tables = await query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
      [databaseName]
    );
    console.log(tables.map(t => t.TABLE_NAME));
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
