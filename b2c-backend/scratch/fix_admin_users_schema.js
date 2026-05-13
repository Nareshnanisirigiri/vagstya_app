import { db } from "./config/db.js";

const fixAdminUsersTable = async () => {
  console.log("Starting admin_users table schema fix...");
  
  const queries = [
    "ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255)",
    "ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255)",
    "ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)",
    "ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS gender VARCHAR(20)",
    "ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS image_url LONGTEXT",
    "ALTER TABLE admin_users MODIFY COLUMN image_url LONGTEXT",
    "ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin'",
    "ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active TINYINT DEFAULT 1"
  ];

  for (const sql of queries) {
    try {
      await new Promise((resolve, reject) => {
        db.query(sql, (err) => {
          if (err) {
            if (err.code === 'ER_DUP_FIELDNAME' || err.message.includes('Duplicate column')) {
              resolve();
            } else {
              console.error(`Error executing: ${sql}`, err.message);
              resolve(); // Continue with others
            }
          } else {
            console.log(`Success: ${sql}`);
            resolve();
          }
        });
      });
    } catch (e) {
      console.error("Migration step failed:", e);
    }
  }
  
  console.log("admin_users table schema fix completed.");
  process.exit();
};

fixAdminUsersTable();
