import { db } from "../config/db.js";

function query(sql, params = []) {
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

async function main() {
  try {
    const rows = await query(`
      SELECT sv.*, s.name as specification_name 
      FROM specification_values sv
      LEFT JOIN specifications s ON sv.specification_id = s.id
      ORDER BY sv.id ASC
    `);
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error("Error fetching specification values:", error.message);
  } finally {
    process.exit();
  }
}

main();
