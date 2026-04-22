import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "root",
    database: process.env.DB_NAME || "sathyavogue_db"
  });

  try {
    console.log("Checking if image_url exists...");
    const [columns] = await db.execute("SHOW COLUMNS FROM categories LIKE 'image_url'");
    if (columns.length === 0) {
      console.log("Adding image_url column...");
      await db.execute("ALTER TABLE categories ADD COLUMN image_url text DEFAULT NULL AFTER media_id");
      console.log("Done adding column.");
    } else {
      console.log("Column image_url already exists.");
    }

    const requestedCategories = [
      { name: "Jewellery", type: "category", img: "https://images.unsplash.com/photo-1599643478514-4a11011c00c8?auto=format&fit=crop&q=80&w=400&h=400" },
      { name: "Sarees", type: "category", img: "https://images.unsplash.com/photo-1610189013233-5c20202dcde0?auto=format&fit=crop&q=80&w=400&h=400" },
      { name: "Men", type: "category", img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=400&h=400" },
      { name: "Fashion Accessories", type: "category", img: "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&q=80&w=400&h=400" },
      { name: "Festive Vibes", type: "category", img: "https://images.unsplash.com/photo-1582560461805-4b47eb5959da?auto=format&fit=crop&q=80&w=400&h=400" },
      { name: "Collections", type: "category", img: "https://images.unsplash.com/photo-1579227114347-15d08fc37cae?auto=format&fit=crop&q=80&w=400&h=400" },
    ];

    console.log("Seeding requested categories...");
    for (const c of requestedCategories) {
      const [existing] = await db.execute("SELECT id FROM categories WHERE name = ?", [c.name]);
      if (existing.length === 0) {
        await db.execute("INSERT INTO categories (name, type, status, image_url) VALUES (?, ?, 1, ?)", [c.name, c.type, c.img]);
        console.log(`Inserted category: ${c.name}`);
      } else {
        await db.execute("UPDATE categories SET image_url = ? WHERE name = ? AND (image_url IS NULL OR image_url = '')", [c.img, c.name]);
        console.log(`Updated existing category: ${c.name}`);
      }
    }
  } catch(e) {
    console.error("Error migrating categories:", e);
  } finally {
    await db.end();
  }
}

run();
