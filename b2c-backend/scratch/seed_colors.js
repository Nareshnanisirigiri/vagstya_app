import { db } from "../config/db.js";
import { APPROVED_COLOR_CATALOG, synchronizeApprovedColors } from "../utils/colorCatalog.js";

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

async function seedColors() {
  console.log("Starting to synchronize colors...");

  try {
    await synchronizeApprovedColors(query);
    const rows = await query(
      `SELECT id, name, color_code, is_active
       FROM colors
       WHERE name IN (${APPROVED_COLOR_CATALOG.map(() => "?").join(", ")})
       ORDER BY id ASC`,
      APPROVED_COLOR_CATALOG.map((color) => color.name)
    );
    console.log(`Synchronized ${rows.length} approved color rows.`);
  } catch (err) {
    console.error("Error updating colors:", err.message);
  }

  process.exit(0);
}

seedColors();
