import { db } from "../config/db.js";

const categories = [
  "Sarees",
  "Jewellery",
  "Fashion Accessories",
  "Women's Wear",
  "Men's Wear",
  "Men",
  "Collections"
];

async function run() {
  for (const name of categories) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    db.query(
      "INSERT IGNORE INTO categories (name, url_slug, type, status) VALUES (?, ?, ?, 1)",
      [name, slug, "catalog"]
    );
  }
  console.log("Categories initialized.");
  process.exit(0);
}

run();
