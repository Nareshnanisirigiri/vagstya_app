import { db } from "./config/db.js";

db.query("DESCRIBE notifications", (err, results) => {
  if (err) {
    console.error("Error describing table:", err.message);
    process.exit(1);
  }
  console.log("Table structure:");
  console.table(results);
  process.exit(0);
});
