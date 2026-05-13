const mysql = require('mysql2/promise');
async function run() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'vogstya_jewellery'
    });
    
    // 1. Ensure shops exist
    const [shops] = await conn.execute('SELECT * FROM shops');
    console.log("Current Shops:", shops);
    
    const shopNames = shops.map(s => s.name);
    if (!shopNames.includes("Vogue By Satyabhama")) {
      await conn.execute('INSERT INTO shops (name, is_active) VALUES (?, 1)', ["Vogue By Satyabhama"]);
      console.log("Created: Vogue By Satyabhama");
    }
    if (!shopNames.includes("SHOBHA STORES")) {
      await conn.execute('INSERT INTO shops (name, is_active) VALUES (?, 1)', ["SHOBHA STORES"]);
      console.log("Created: SHOBHA STORES");
    }
    
    // 2. Get IDs
    const [newShops] = await conn.execute('SELECT id, name FROM shops');
    const vogueId = newShops.find(s => s.name === "Vogue By Satyabhama")?.id;
    
    // 3. Update products with NULL shop_id to Vogue By Satyabhama
    if (vogueId) {
      const [result] = await conn.execute('UPDATE products SET shop_id = ? WHERE shop_id IS NULL OR shop_id = 0', [vogueId]);
      console.log(`Updated ${result.affectedRows} products to shop_id ${vogueId}`);
    }

    await conn.end();
  } catch (err) {
    console.error(err);
  }
}
run();
