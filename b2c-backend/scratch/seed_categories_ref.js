import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "root",
  database: process.env.DB_NAME || "sathyavogue_db"
});

const categories = [
  "Sarees",
  "Jewellery",
  "Fashion Accessories",
  "Women's Wear",
  "Men's Wear"
];

async function seed() {
  for (const cat of categories) {
    await new Promise((resolve) => {
      db.query("SELECT id FROM categories WHERE name = ?", [cat], (err, rows) => {
        if (err) {
          console.error(`Error checking category ${cat}:`, err);
          resolve();
        } else if (rows.length === 0) {
          db.query("INSERT INTO categories (name, status) VALUES (?, 1)", [cat], (err) => {
            if (err) console.error(`Error inserting category ${cat}:`, err);
            else console.log(`Inserted category: ${cat}`);
            resolve();
          });
        } else {
          console.log(`Category already exists: ${cat}`);
          resolve();
        }
      });
    });
  }
  db.end();
}

seed();
