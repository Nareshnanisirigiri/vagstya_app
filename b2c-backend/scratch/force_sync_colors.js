import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const APPROVED_COLORS = [
  { name: "Aquamarine", colorCode: "#7FFFD4" },
  { name: "Black", colorCode: "#000000" },
  { name: "Blue", colorCode: "#0000FF" },
  { name: "Brown", colorCode: "#A52A2A" },
  { name: "Cyan", colorCode: "#00FFFF" },
  { name: "Dark Blue", colorCode: "#00008B" },
  { name: "Gold", colorCode: "#FFD700" },
  { name: "Green", colorCode: "#008000" },
  { name: "Grey", colorCode: "#808080" },
  { name: "IndianRed", colorCode: "#CD5C5C" },
  { name: "Light Blue", colorCode: "#ADD8E6" },
  { name: "Light Pink", colorCode: "#FFB6C1" },
  { name: "Lime", colorCode: "#00FF00" },
  { name: "Magenta", colorCode: "#FF00FF" },
  { name: "Maroon", colorCode: "#800000" },
  { name: "Mehendi", colorCode: "#557054" },
  { name: "Multi Colour", colorCode: "transparent" },
  { name: "Navy", colorCode: "#000080" },
  { name: "Nickel", colorCode: "#727472" },
];

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  console.log("Deactivating all colors...");
  await connection.execute('UPDATE colors SET is_active = 0');

  for (const color of APPROVED_COLORS) {
    console.log(`Syncing ${color.name}...`);
    const [existing] = await connection.execute('SELECT id FROM colors WHERE name = ?', [color.name]);
    
    if (existing && existing.length > 0) {
      await connection.execute(
        'UPDATE colors SET color_code = ?, is_active = 1, shop_id = 1 WHERE id = ?',
        [color.colorCode, existing[0].id]
      );
    } else {
      await connection.execute(
        'INSERT INTO colors (name, color_code, is_active, shop_id) VALUES (?, ?, 1, 1)',
        [color.name, color.colorCode]
      );
    }
  }

  console.log("Forcing Multi Colour code...");
  await connection.execute('UPDATE colors SET color_code = "transparent" WHERE name = "Multi Colour"');

  console.log("Sync complete!");
  await connection.end();
}

run().catch(console.error);
