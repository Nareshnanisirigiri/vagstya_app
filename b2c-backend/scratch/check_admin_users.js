import { db } from "./config/db.js";

db.query("DESCRIBE admin_users", (err, results) => {
  if (err) {
    console.error("Error describing admin_users:", err);
  } else {
    console.log("admin_users Schema:");
    console.table(results);
  }
  process.exit();
});
