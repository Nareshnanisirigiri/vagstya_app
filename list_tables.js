import { db } from "./b2c-backend/config/db.js";

db.query(
  `SELECT TABLE_NAME as tableName FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'sathyavogue_db'`,
  (err, results) => {
    if (err) console.error(err);
    else console.log(results.map(r => r.tableName).join(", "));
    process.exit();
  }
);
