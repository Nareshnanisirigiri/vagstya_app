import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "",
  database: process.env.DB_NAME || "vogstya"
};

const APPROVED_COLORS = [
  { name: "Aquamarine", color_code: "#7FFFD4" },
  { name: "Black", color_code: "#000000" },
  { name: "Blue", color_code: "#0000FF" },
  { name: "Brown", color_code: "#A52A2A" },
  { name: "Cyan", color_code: "#00FFFF" },
  { name: "Dark Blue", color_code: "#00008B" },
  { name: "Gold", color_code: "#FFD700" },
  { name: "Green", color_code: "#008000" },
  { name: "Grey", color_code: "#808080" },
  { name: "IndianRed", color_code: "#CD5C5C" },
  { name: "Light Blue", color_code: "#ADD8E6" },
  { name: "Light Pink", color_code: "#FFB6C1" },
  { name: "Lime", color_code: "#00FF00" },
  { name: "Magenta", color_code: "#FF00FF" },
  { name: "Maroon", color_code: "#800000" },
  { name: "Mehendi", color_code: "#557054" },
  { name: "Multi Colour", color_code: "transparent" },
  { name: "Navy", color_code: "#000080" },
  { name: "Nickel", color_code: "#727472" },
  { name: "Olive", color_code: "#808000" },
  { name: "Orange", color_code: "#FFA500" },
  { name: "PINK", color_code: "#FFC0CB" },
  { name: "Purple", color_code: "#800080" },
  { name: "Red", color_code: "#FF0000" },
  { name: "Rose gold", color_code: "#B76E79" },
  { name: "Silver", color_code: "#C0C0C0" },
  { name: "Teal", color_code: "#008080" },
  { name: "White", color_code: "#FFFFFF" },
  { name: "Yellow", color_code: "#FFFF00" },
];

const APPROVED_SIZES = [
  "0-3 Months", "0-6 Months", "1", "1-2 Years", "10", "10-11 Years", "100 CMS", "105 CMS", "11",
  "11-12 Years", "110 CMS", "12", "12-13 Years", "12-18 Months", "13-14 Years", "14", "2", "2-2",
  "2-4", "2-6", "2-8", "26", "28", "3", "3-4 Years", "30", "32", "32A", "32B", "32C", "32D", "34",
  "34A", "34B", "34C", "34D", "36", "36A", "36B", "36C", "36D", "38", "38A", "38B", "38C", "38D",
  "3XL", "4", "4 XL", "4-5 Years", "40", "40A", "40B", "40C", "40D", "42", "44", "46", "48", "5",
  "5 XL", "5-6 Years", "50", "6", "6 XL", "6-12 months", "7", "7-8 Years", "75 CMS", "8", "8-9 Years",
  "80 CMS", "85 CMS", "9", "9-10 Years", "90 CMS", "95 CMS", "Adjustable", "Free Style", "L", "M",
  "Non-Adjustable", "S", "XL", "XS", "XXL"
];

const APPROVED_UNITS = [
  "1 Item", "2 Item", "3 Item", "4 Item", "1 pair", "2 pairs", "5 Item", "6 Item",
  "1 Dozen", "10 pcs", "12 pcs", "50 pcs", "100 pcs", "1 packet", "1 card",
  "7 Item", "8 Item", "9 Item", "10 Item", "3 pairs", "1 Sheet", "2 Dozens", "1 Set",
  "3 Dozens", "4 Pairs", "5 Pairs", "6 Pairs", "1 Box", "1 Pcs", "2 pcs"
];

async function seed() {
  const connection = await mysql.createConnection(dbConfig);
  console.log("Connected to database.");

  try {
    // 1. Setup Units Table
    console.log("Checking units table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS units (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        is_active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 2. Sync Colors
    console.log("Syncing Colors...");
    for (const color of APPROVED_COLORS) {
      const [rows] = await connection.query("SELECT id FROM colors WHERE name = ?", [color.name]);
      if (rows.length === 0) {
        await connection.query("INSERT INTO colors (name, color_code, is_active) VALUES (?, ?, 1)", [color.name, color.color_code]);
      } else {
        await connection.query("UPDATE colors SET color_code = ? WHERE name = ?", [color.color_code, color.name]);
      }
    }

    // 3. Sync Sizes
    console.log("Syncing Sizes...");
    for (const sizeName of APPROVED_SIZES) {
      const [rows] = await connection.query("SELECT id FROM sizes WHERE name = ?", [sizeName]);
      if (rows.length === 0) {
        await connection.query("INSERT INTO sizes (name, size, is_active) VALUES (?, ?, 1)", [sizeName, sizeName]);
      }
    }

    // 4. Sync Units
    console.log("Syncing Units...");
    for (const unitName of APPROVED_UNITS) {
      const [rows] = await connection.query("SELECT id FROM units WHERE name = ?", [unitName]);
      if (rows.length === 0) {
        await connection.query("INSERT INTO units (name, is_active) VALUES (?, 1)", [unitName]);
      }
    }

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await connection.end();
  }
}

seed();
