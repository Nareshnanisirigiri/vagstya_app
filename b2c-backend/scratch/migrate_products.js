import { db } from "../config/db.js";

async function migrate() {
  console.log("Starting Products Table Migration...");
  
  const columnsToAdd = [
    { name: "image_url", type: "LONGTEXT" },
    { name: "short_description", type: "TEXT" },
    { name: "purchase_price", type: "DECIMAL(10, 2) DEFAULT 0" },
    { name: "brand", type: "VARCHAR(255)" },
    { name: "unit", type: "VARCHAR(100)" },
    { name: "sku", type: "VARCHAR(100)" },
    { name: "hsn_code", type: "VARCHAR(100)" },
    { name: "vat_tax", type: "DECIMAL(10, 2) DEFAULT 0" },
    { name: "min_order_qty", type: "INT DEFAULT 1" },
    { name: "meta_title", type: "VARCHAR(255)" },
    { name: "meta_description", type: "TEXT" },
    { name: "meta_keywords", type: "TEXT" },
    { name: "is_flash_sale", type: "INT DEFAULT 0" },
    { name: "is_ad", type: "INT DEFAULT 0" }
  ];

  for (const col of columnsToAdd) {
    try {
      // Check if column exists
      const [rows] = await db.promise().query(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'products' 
        AND COLUMN_NAME = ?
      `, [col.name]);

      if (rows.length === 0) {
        console.log(`Adding column: ${col.name}`);
        await db.promise().query(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`);
      } else {
        console.log(`Column already exists: ${col.name}`);
      }
    } catch (err) {
      console.error(`Error adding column ${col.name}:`, err.message);
    }
  }

  // Also ensure categories has meta fields
  const catColumns = [
    { name: "meta_title", type: "VARCHAR(255)" },
    { name: "meta_description", type: "TEXT" },
    { name: "meta_keywords", type: "TEXT" },
    { name: "description", type: "TEXT" }
  ];

  for (const col of catColumns) {
    try {
      const [rows] = await db.promise().query(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'categories' 
        AND COLUMN_NAME = ?
      `, [col.name]);

      if (rows.length === 0) {
        console.log(`Adding category column: ${col.name}`);
        await db.promise().query(`ALTER TABLE categories ADD COLUMN ${col.name} ${col.type}`);
      }
    } catch (err) {
      console.error(`Error adding category column ${col.name}:`, err.message);
    }
  }

  console.log("Migration Complete!");
  process.exit(0);
}

migrate();
