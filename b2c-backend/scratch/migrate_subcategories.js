import { db } from "../config/db.js";

async function migrate() {
  console.log("Checking sub_categories table schema...");
  
  const createSubCategories = `
  CREATE TABLE IF NOT EXISTS sub_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    image_url TEXT,
    is_active INT DEFAULT 1,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );
  `;

  try {
    await db.promise().query(createSubCategories);
    console.log("sub_categories table created or already exists.");
    
    // Check for missing columns in case it existed
    const [columns] = await db.promise().query("SHOW COLUMNS FROM sub_categories");
    const colNames = columns.map(c => c.Field);
    
    const updates = [
      { name: 'image_url', type: 'TEXT' },
      { name: 'is_active', type: 'INT DEFAULT 1' },
      { name: 'meta_title', type: 'VARCHAR(255)' },
      { name: 'meta_description', type: 'TEXT' },
      { name: 'meta_keywords', type: 'TEXT' }
    ];
    
    for (const col of updates) {
      if (!colNames.includes(col.name)) {
        console.log(`Adding column ${col.name}...`);
        await db.promise().query(`ALTER TABLE sub_categories ADD COLUMN ${col.name} ${col.type}`);
      }
    }
    
    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}

migrate();
