import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const APPROVED_CATEGORY_CATALOG = [
  "Women's Wear", "saree", "men's Wear", "Jewellery", "Fashion Accessories",
  "Kids Wear", "Tailoring Needs", "Toys & Stationary", "Home & Living", "Festive Vibes"
];

async function seedCategories() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sathyavogue_db'
  });

  console.log("Seeding categories...");
  for (const catName of APPROVED_CATEGORY_CATALOG) {
    const [existing] = await connection.query("SELECT id FROM categories WHERE name = ?", [catName]);
    if (!existing.length) {
      const defaultIcon = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(catName)}&backgroundColor=0d5731&fontFamily=Inter&fontWeight=700`;
      await connection.query("INSERT INTO categories (name, image_url, status, is_active, shop_id) VALUES (?, ?, 1, 1, 1)", [catName, defaultIcon]);
      console.log(`Inserted: ${catName}`);
    } else {
      await connection.query("UPDATE categories SET status = 1, is_active = 1 WHERE id = ?", [existing[0].id]);
      console.log(`Updated: ${catName}`);
    }
  }

  await connection.end();
  console.log("Done!");
}

seedCategories();
