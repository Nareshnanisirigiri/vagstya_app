import { db } from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}

const categories = [
  "Sarees",
  "Jewellery",
  "Fashion Accessories",
  "Kids Wear",
  "Tailoring Needs",
  "Toys & Stationary",
  "Women's Wear",
  "Men's Wear",
  "Home & Living",
  "Festive Vibes"
];

async function seed() {
  try {
    console.log("Seeding categories...");
    
    // Check if table exists
    const tables = await query("SHOW TABLES LIKE 'categories'");
    if (tables.length === 0) {
      console.log("Creating categories table...");
      await query(`
        CREATE TABLE categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          image_url VARCHAR(255),
          status TINYINT DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Optional: Clear existing if user wants "only" these
    // await query("DELETE FROM categories"); 
    
    for (const name of categories) {
      const existing = await query("SELECT id FROM categories WHERE name = ?", [name]);
      if (existing.length === 0) {
        await query("INSERT INTO categories (name, image_url, status) VALUES (?, ?, ?)", [
          name, 
          `https://source.unsplash.com/featured/?${name.replace(/ /g, ',')}`, // Placeholder images
          1
        ]);
        console.log(`Added: ${name}`);
      } else {
        console.log(`Skipped (exists): ${name}`);
      }
    }
    
    console.log("Seeding completed successfully.");
  } catch (err) {
    console.error("Seeding failed:", err.message);
  } finally {
    db.end();
  }
}

seed();
