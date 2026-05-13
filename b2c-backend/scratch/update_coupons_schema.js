import { db } from "../config/db.js";

async function updateCouponsTable() {
  console.log("Updating coupons table schema...");
  
  const columnsToAdd = [
    { name: "min_purchase", type: "DECIMAL(10,2) DEFAULT 0" },
    { name: "max_discount", type: "DECIMAL(10,2) DEFAULT 0" },
    { name: "limit_per_user", type: "INT DEFAULT 1" },
    { name: "discount", type: "DECIMAL(10,2) DEFAULT 0" }, // Rename or add discount if missing
    { name: "shop_ids", type: "TEXT" } // For comma-separated shop IDs
  ];

  for (const col of columnsToAdd) {
    try {
      await new Promise((resolve, reject) => {
        db.query(`ALTER TABLE coupons ADD COLUMN ${col.name} ${col.type}`, (err, results) => {
          if (err) {
              if (err.message.includes("duplicate column name")) {
                  console.log(`Column ${col.name} already exists.`);
                  resolve();
              } else {
                  reject(err);
              }
          }
          else resolve(results);
        });
      });
      console.log(`Column ${col.name} added successfully.`);
    } catch (err) {
      console.error(`Error adding column ${col.name}:`, err.message);
    }
  }
  
  console.log("Coupons table schema updated.");
  process.exit(0);
}

updateCouponsTable();
