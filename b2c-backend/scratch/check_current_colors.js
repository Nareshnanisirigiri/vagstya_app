import { db } from "../config/db.js";

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results);
    });
  });
}

async function checkColors() {
  try {
    const rows = await query("SELECT id, name, color_code, is_active FROM colors ORDER BY id ASC");
    console.log("Current colors in database:");
    console.table(rows);
  } catch (err) {
    console.error("Error fetching colors:", err.message);
  }
  process.exit(0);
}

checkColors();
