import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const data = [
    { spec: "Material", name: "Silk", active: 0 },
    { spec: "Material", name: "Copper", active: 0 },
    { spec: "Material", name: "cotton", active: 0 },
    { spec: "Material", name: "Lenin", active: 0 },
    { spec: "Blouse", name: "With Blouse", active: 1 },
    { spec: "Blouse", name: "Without Blouse", active: 1 },
    { spec: "Blouse", name: "Running Blouse", active: 1 },
    { spec: "Saree Fabric", name: "Cotton", active: 1 },
    { spec: "Saree Fabric", name: "Mul-Mul Cotton", active: 1 },
    { spec: "Saree Fabric", name: "Kota Saree", active: 1 },
    { spec: "Occasion", name: "Party Wear", active: 1 },
    { spec: "Occasion", name: "Casual Wear", active: 1 },
    { spec: "Occasion", name: "Office Wear", active: 1 },
    { spec: "Occasion", name: "Ethnic Wear", active: 1 },
    { spec: "Saree Fabric", name: "Lenin", active: 1 },
    { spec: "Loom", name: "Handloom", active: 1 },
    { spec: "Loom", name: "Power Loom", active: 1 },
    { spec: "Loom", name: "Semi Handloom", active: 1 },
    { spec: "Thread Count", name: "100", active: 1 },
    { spec: "Thread Count", name: "120", active: 1 },
    { spec: "Saree Fabric", name: "Chanderi", active: 1 },
    { spec: "Saree Fabric", name: "Banana Pattu", active: 1 },
    { spec: "Saree Fabric", name: "Silk", active: 1 },
    { spec: "Saree Fabric", name: "Kanchi Pattu", active: 1 },
    { spec: "Saree Fabric", name: "kanjeevaram Pattu", active: 1 },
    { spec: "Saree Fabric", name: "Venkatagiri Pattu", active: 1 },
    { spec: "Saree Fabric", name: "Mangalagiri Pattu", active: 1 },
    { spec: "Saree Fabric", name: "Banaras", active: 1 },
    { spec: "Saree Fabric", name: "Gadwal Pattu", active: 1 },
    { spec: "Saree Fabric", name: "Gadwal Cotton", active: 1 },
    { spec: "Saree Fabric", name: "chanderi Cotton", active: 1 },
    { spec: "Saree Fabric", name: "Chanderi Pattu", active: 1 },
    { spec: "Saree Fabric", name: "Ikkat Cotton", active: 1 },
    { spec: "Saree Fabric", name: "Ikkat Silk", active: 1 },
    { spec: "Saree Fabric", name: "Maheshwari Pattu", active: 1 },
    { spec: "Saree Fabric", name: "Maheshwari Cotton", active: 1 },
    { spec: "Saree Fabric", name: "Paithani", active: 1 },
    { spec: "Saree Fabric", name: "Patola", active: 1 },
    { spec: "Saree Fabric", name: "Georgette", active: 1 },
    { spec: "Saree Fabric", name: "Chiffon", active: 1 },
    { spec: "Saree Fabric", name: "Satin", active: 1 },
    { spec: "Saree Fabric", name: "Bengal Cotton", active: 1 },
    { spec: "Saree Fabric", name: "Silk Cotton", active: 1 },
    { spec: "Saree Fabric", name: "Khadi Cotton", active: 1 },
    { spec: "Saree Fabric", name: "Modal Silk", active: 1 },
    { spec: "Saree Fabric", name: "Tussar", active: 1 },
    { spec: "Saree Fabric", name: "Raw Silk", active: 1 },
    { spec: "Saree Fabric", name: "Gajji Silk", active: 1 },
    { spec: "Saree Fabric", name: "Bishnupuri Silk", active: 1 },
    { spec: "Saree Fabric", name: "Musheerabad Silk", active: 1 },
    { spec: "Saree Fabric", name: "Mushroom Silk", active: 1 },
    { spec: "Saree Fabric", name: "Mango Silk", active: 1 },
    { spec: "Saree Fabric", name: "Kanchi Cotton", active: 1 },
    { spec: "Saree Fabric", name: "Bhandani", active: 1 },
    { spec: "Blouse Length", name: "0.80 mtrs", active: 1 },
    { spec: "Blouse Length", name: "1 mtr", active: 1 },
    { spec: "Weight", name: "300 gms", active: 1 },
    { spec: "Weight", name: "350 gms", active: 1 },
    { spec: "Weight", name: "400 gms", active: 1 },
    { spec: "Weight", name: "450 gms", active: 1 },
    { spec: "Weight", name: "500 gms", active: 1 },
    { spec: "Weight", name: "550 gms", active: 1 },
    { spec: "Weight", name: "50 gms", active: 1 },
    { spec: "Weight", name: "100 gms", active: 1 },
    { spec: "Weight", name: "10 gms", active: 1 },
    { spec: "Weight", name: "20 gms", active: 1 },
    { spec: "Weight", name: "30 gms", active: 1 },
    { spec: "Weight", name: "40 gms", active: 1 },
    { spec: "Weight", name: "60 gms", active: 1 },
    { spec: "Weight", name: "70 gms", active: 1 },
    { spec: "Weight", name: "80 gms", active: 1 },
    { spec: "Weight", name: "90 gms", active: 1 },
    { spec: "Weight", name: "150 gms", active: 1 },
    { spec: "Weight", name: "200 gms", active: 1 },
    { spec: "Weight", name: "250 gms", active: 1 },
    { spec: "Blouse Fabric", name: "Lenin", active: 1 },
    { spec: "Blouse Fabric", name: "Cotton", active: 1 },
    { spec: "Blouse Fabric", name: "Ikkat Cotton", active: 1 },
    { spec: "Blouse Fabric", name: "Silk", active: 1 },
    { spec: "Blouse Fabric", name: "Chiffon", active: 1 },
    { spec: "Blouse Fabric", name: "Georgette", active: 1 },
    { spec: "Blouse Fabric", name: "Satin", active: 1 },
    { spec: "Saree Work", name: "Kalamkari", active: 1 },
    { spec: "Blouse Fabric", name: "Same as Saree Fabric", active: 1 },
    { spec: "Blouse work", name: "Plain With Border", active: 1 },
    { spec: "Blouse work", name: "Printed", active: 1 },
    { spec: "Blouse work", name: "Maggam", active: 1 },
    { spec: "Blouse work", name: "Embriodery", active: 1 },
    { spec: "Blouse work", name: "Glass work", active: 1 },
    { spec: "Wash and Care", name: "Only Hand Wash", active: 1 },
    { spec: "Wash and Care", name: "Mild Hand Wash , Do Not Dry in Direct Sunlight.", active: 1 },
    { spec: "Wash and Care", name: "Dry Cleaning and Iron.", active: 1 },
    { spec: "Wash and Care", name: "Machine Wash", active: 1 },
    { spec: "Wash and Care", name: "Wash Separately.", active: 1 },
    { spec: "Base Metal", name: "Alloy", active: 1 },
    { spec: "Base Metal", name: "Brass", active: 1 },
    { spec: "Base Metal", name: "Brass & Copper", active: 1 },
    { spec: "Base Metal", name: "Bronze", active: 1 },
    { spec: "Base Metal", name: "Copper", active: 1 },
    { spec: "Base Metal", name: "Fabric", active: 1 },
    { spec: "Base Metal", name: "German silver", active: 1 },
    { spec: "Base Metal", name: "Plastic", active: 1 },
    { spec: "Base Metal", name: "Glass", active: 1 },
    { spec: "Base Metal", name: "Silver", active: 1 },
    { spec: "Base Metal", name: "Stainless Steel", active: 1 },
    { spec: "Base Metal", name: "Synthetic", active: 1 },
    { spec: "Base Metal", name: "Thread", active: 1 },
    { spec: "Base Metal", name: "Terracotta", active: 1 },
    { spec: "Base Metal", name: "Wood", active: 1 },
    { spec: "Base Metal", name: "Resin", active: 1 },
    { spec: "Stone Type", name: "Agate", active: 1 },
    { spec: "Stone Type", name: "American Diamond", active: 1 },
    { spec: "Stone Type", name: "Artificial Stone and Beads", active: 1 },
    { spec: "Stone Type", name: "Crystal", active: 1 },
    { spec: "Stone Type", name: "Cubic Zirconia", active: 1 },
    { spec: "Stone Type", name: "Citrine", active: 1 },
    { spec: "Stone Type", name: "Emerald", active: 1 },
    { spec: "Stone Type", name: "Garnet", active: 1 },
    { spec: "Stone Type", name: "Kundan", active: 1 },
    { spec: "Stone Type", name: "No Stone", active: 1 },
    { spec: "Stone Type", name: "Pearls", active: 1 },
    { spec: "Stone Type", name: "Onyx", active: 1 },
    { spec: "Stone Type", name: "Peridot", active: 1 },
    { spec: "Stone Type", name: "Polki", active: 1 },
    { spec: "Stone Type", name: "Quartz", active: 1 },
    { spec: "Stone Type", name: "Rhinestone", active: 1 },
    { spec: "Stone Type", name: "Rhodolite", active: 1 },
    { spec: "Stone Type", name: "Ruby", active: 1 },
    { spec: "Stone Type", name: "Rudraksh", active: 1 },
    { spec: "Stone Type", name: "Sapphire", active: 1 },
    { spec: "Stone Type", name: "Topaz", active: 1 },
    { spec: "Stone Type", name: "Tourmaline", active: 1 },
    { spec: "Stone Type", name: "Turquoise", active: 1 },
    { spec: "Trend", name: "Afghan", active: 1 },
    { spec: "Trend", name: "Butterfly", active: 1 },
    { spec: "Trend", name: "Claywork", active: 1 },
    { spec: "Trend", name: "Coin Work", active: 1 },
    { spec: "Trend", name: "Enamelled", active: 1 },
    { spec: "Trend", name: "Evil Eye", active: 1 },
    { spec: "Trend", name: "Feather", active: 1 },
    { spec: "Trend", name: "Floral", active: 1 },
    { spec: "Trend", name: "Galaxy", active: 1 },
    { spec: "Trend", name: "Geometric", active: 1 },
    { spec: "Trend", name: "Gold Filigree", active: 1 },
    { spec: "Trend", name: "Gota Patti", active: 1 },
    { spec: "Trend", name: "Guttapusalu", active: 1 },
    { spec: "Trend", name: "Hand-crafted", active: 1 },
    { spec: "Trend", name: "Kempu Work", active: 1 },
    { spec: "Trend", name: "Korean", active: 1 },
    { spec: "Trend", name: "Kundan", active: 1 },
    { spec: "Trend", name: "LakshmiDevi", active: 1 },
    { spec: "Trend", name: "Layered", active: 1 },
    { spec: "Trend", name: "Mango", active: 1 },
    { spec: "Trend", name: "Mantasha", active: 1 },
    { spec: "Trend", name: "Meenakari", active: 1 },
    { spec: "Trend", name: "Minimal", active: 1 },
    { spec: "Trend", name: "Mirror", active: 1 },
    { spec: "Trend", name: "Peacock", active: 1 },
    { spec: "Trend", name: "Pearl Work", active: 1 },
    { spec: "Trend", name: "Pom Pom", active: 1 },
    { spec: "Trend", name: "Radha Krishna", active: 1 },
    { spec: "Trend", name: "Ram Parivar", active: 1 },
    { spec: "Trend", name: "Religious", active: 1 },
    { spec: "Trend", name: "Shellwork", active: 1 },
    { spec: "Trend", name: "Tasseled", active: 1 },
    { spec: "Saree Fabric", name: "Chennuri silk saree", active: 1 },
    { spec: "Trend", name: "Temple", active: 1 },
    { spec: "Trend", name: "Threadwork", active: 1 },
    { spec: "Trend", name: "Tribal", active: 1 },
    { spec: "Fashion Type", name: "Tassel", active: 1 },
    { spec: "Fashion Type", name: "Studs", active: 1 },
    { spec: "Fashion Type", name: "Oversized Studs", active: 1 },
    { spec: "Fashion Type", name: "Bahubali", active: 1 },
    { spec: "Fashion Type", name: "Butta Boma", active: 1 },
    { spec: "Fashion Type", name: "Chandbalis", active: 1 },
    { spec: "Fashion Type", name: "Chandelier", active: 1 },
    { spec: "Fashion Type", name: "Drop Earrings", active: 1 },
    { spec: "Fashion Type", name: "Ear Cuff", active: 1 },
    { spec: "Fashion Type", name: "Ear Jackets", active: 1 },
    { spec: "Fashion Type", name: "Earrings with Chain", active: 1 },
    { spec: "Fashion Type", name: "Half Hoop Earrings", active: 1 },
    { spec: "Fashion Type", name: "Hoop Earrings", active: 1 },
    { spec: "Fashion Type", name: "Heggie Earrings", active: 1 },
    { spec: "Fashion Type", name: "Jhumka", active: 1 },
    { spec: "Fashion Type", name: "Long", active: 1 },
    { spec: "Occasion", name: "Bridal Wear", active: 1 },
    { spec: "Occasion", name: "Festive Wear", active: 1 },
    { spec: "Size", name: "10", active: 1 },
    { spec: "Size", name: "12", active: 1 },
    { spec: "Size", name: "14", active: 1 },
    { spec: "Size", name: "2-2", active: 1 },
    { spec: "Size", name: "2-4", active: 1 },
    { spec: "Size", name: "2-6", active: 1 },
    { spec: "Size", name: "2-8", active: 1 },
    { spec: "Occasion", name: "Casual Wear", active: 1 },
    { spec: "Occasion", name: "Office Wear", active: 1 },
    { spec: "Occasion", name: "Traditional Wear", active: 1 },
    { spec: "Fashion Type", name: "Minimal", active: 1 },
    { spec: "Fashion Type", name: "Elegant", active: 1 },
    { spec: "Occasion", name: "Daily Wear", active: 1 },
    { spec: "Wash and Care", name: "Dry cleaing", active: 1 },
    { spec: "Cotton Count", name: "80/100", active: 1 },
    { spec: "Thread Count", name: "80/100", active: 1 },
    { spec: "Silk Sarees", name: "Single Weaving", active: 1 },
    { spec: "Silk Sarees", name: "Double Weaving", active: 1 },
    { spec: "Silk Sarees", name: "2 Ply", active: 1 },
    { spec: "Silk Sarees", name: "3 Ply", active: 1 },
    { spec: "Silk Sarees", name: "120", active: 1 },
    { spec: "Silk Sarees", name: "60", active: 1 },
    { spec: "Thread Count", name: "100/120", active: 1 },
    { spec: "Thread Count", name: "100/100", active: 1 },
    { spec: "Silk Sarees", name: "110/120", active: 1 },
    { spec: "Silk Sarees", name: "60/80", active: 1 },
    { spec: "Cotton Count", name: "80 Gram", active: 1 },
    { spec: "Cotton Count", name: "120 Gram", active: 1 },
    { spec: "Cotton Count", name: "60 Gram", active: 1 },
    { spec: "Silk Sarees", name: "110/120 Gram", active: 1 },
    { spec: "Base Metal", name: "Metal", active: 1 },
    { spec: "Sleeves", name: "Full sleeve", active: 1 },
    { spec: "Sleeves", name: "Half sleeve", active: 1 },
    { spec: "Fabric", name: "Cotton", active: 1 }
];

async function seed() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        console.log('Seeding specification values...');

        // 1. Ensure all specifications exist
        const uniqueSpecs = [...new Set(data.map(d => d.spec))];
        for (const specName of uniqueSpecs) {
            await connection.query(
                'INSERT IGNORE INTO specifications (name, is_active) VALUES (?, 1)',
                [specName]
            );
        }

        // 2. Fetch all specs to map names to IDs
        const [specs] = await connection.query('SELECT id, name FROM specifications');
        const specMap = {};
        specs.forEach(s => specMap[s.name] = s.id);

        // 3. Clear existing values to avoid duplicates (optional but safer for "clean sync")
        // await connection.query('DELETE FROM specification_values');

        // 4. Insert specification values
        let count = 0;
        for (const item of data) {
            const specId = specMap[item.spec];
            if (!specId) {
                console.warn(`Could not find spec: ${item.spec}`);
                continue;
            }

            // Check if exists to avoid duplicates
            const [existing] = await connection.query(
                'SELECT id FROM specification_values WHERE specification_id = ? AND name = ?',
                [specId, item.name]
            );

            if (existing.length === 0) {
                await connection.query(
                    'INSERT INTO specification_values (specification_id, name, is_active) VALUES (?, ?, ?)',
                    [specId, item.name, item.active]
                );
                count++;
            } else {
                // Update active status if already exists
                await connection.query(
                    'UPDATE specification_values SET is_active = ? WHERE id = ?',
                    [item.active, existing[0].id]
                );
            }
        }

        fs.writeFileSync(path.join(__dirname, 'seed_result.txt'), `Successfully processed ${data.length} records. New: ${count}`);
        console.log(`Successfully processed ${data.length} records.`);

    } catch (err) {
        fs.writeFileSync(path.join(__dirname, 'seed_error.txt'), err.message);
        console.error('Error during seeding:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

seed();
