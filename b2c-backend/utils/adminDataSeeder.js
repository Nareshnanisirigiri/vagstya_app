import { synchronizeApprovedColors } from "./colorCatalog.js";
import { 
  INDIAN_STATES, 
  GENDER_OPTIONS, 
  ORDER_STATUS_CATALOG, 
  HOME_SECTION_FILTERS,
  APPROVED_SIZE_CATALOG,
  APPROVED_UNIT_CATALOG,
  APPROVED_CATEGORY_CATALOG
} from "./metadataCatalog.js";
import { APPROVED_SPECIFICATION_VALUES } from "./specificationCatalog.js";

export async function synchronizeAllAdminData(query) {
  console.log("Starting full admin data synchronization...");

  // Ensure all tables exist
  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      image_url TEXT,
      status TINYINT DEFAULT 1,
      shop_id INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sub_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      image_url TEXT,
      status TINYINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sizes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      size VARCHAR(50),
      shop_id INT DEFAULT 1,
      is_active TINYINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS colors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      color_code VARCHAR(50),
      shop_id INT DEFAULT 1,
      is_active TINYINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // 1. Sync Colors (uses existing colorCatalog logic)
  console.log("Syncing Colors...");
  await synchronizeApprovedColors(query);

  // 1b. Sync Categories
  console.log("Syncing Categories...");
  // Safely check for column presence before updating
  try {
    await query(`UPDATE categories SET status = 0`);
    try { await query(`UPDATE categories SET is_active = 0`); } catch(e) {}
  } catch(e) {
    console.log("Category reset note:", e.message);
  }
  
  for (const catName of APPROVED_CATEGORY_CATALOG) {
    const [existing] = await query("SELECT id FROM categories WHERE name = ?", [catName]);
    if (!existing) {
      const defaultIcon = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(catName)}&backgroundColor=0d5731&fontFamily=Inter&fontWeight=700`;
      try {
        await query("INSERT INTO categories (name, image_url, status, is_active, shop_id) VALUES (?, ?, 1, 1, 1)", [catName, defaultIcon]);
      } catch (e) {
        // Fallback if is_active is missing
        await query("INSERT INTO categories (name, image_url, status, shop_id) VALUES (?, ?, 1, 1)", [catName, defaultIcon]);
      }
    } else {
      try {
        await query("UPDATE categories SET status = 1, is_active = 1 WHERE id = ?", [existing.id]);
      } catch (e) {
        await query("UPDATE categories SET status = 1 WHERE id = ?", [existing.id]);
      }
    }
  }

  // 2. Sync Sizes
  console.log("Syncing Sizes...");
  try { await query(`UPDATE sizes SET is_active = 0`); } catch(e) {}
  for (const sizeName of APPROVED_SIZE_CATALOG) {
    const [existing] = await query("SELECT id FROM sizes WHERE name = ?", [sizeName]);
    if (!existing) {
      try {
        await query("INSERT INTO sizes (name, size, is_active, shop_id) VALUES (?, ?, 1, 1)", [sizeName, sizeName]);
      } catch (e) {
        await query("INSERT INTO sizes (name, size, shop_id) VALUES (?, ?, 1)", [sizeName, sizeName]);
      }
    } else {
      try {
        await query("UPDATE sizes SET is_active = 1 WHERE id = ?", [existing.id]);
      } catch (e) {}
    }
  }

  // 3. Sync Units
  console.log("Syncing Units...");
  try { await query(`UPDATE units SET is_active = 0`); } catch(e) {}
  // Ensure table exists
  await query(`
    CREATE TABLE IF NOT EXISTS units (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      is_active TINYINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  for (const unitName of APPROVED_UNIT_CATALOG) {
    const [existing] = await query("SELECT id FROM units WHERE name = ?", [unitName]);
    if (!existing) {
      try {
        await query("INSERT INTO units (name, is_active, shop_id) VALUES (?, 1, 1)", [unitName]);
      } catch (e) {
        await query("INSERT INTO units (name, shop_id) VALUES (?, 1)", [unitName]);
      }
    } else {
      try {
        await query("UPDATE units SET is_active = 1 WHERE id = ?", [existing.id]);
      } catch (e) {}
    }
  }

  // 4. Sync Shops
  console.log("Syncing Shops...");
  await query(`
    CREATE TABLE IF NOT EXISTS shops (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      phone VARCHAR(50),
      gender VARCHAR(20),
      email VARCHAR(255),
      user_profile_url LONGTEXT,
      name VARCHAR(255) NOT NULL,
      state VARCHAR(100),
      address TEXT,
      gst_id VARCHAR(100),
      logo_url LONGTEXT,
      banner_url LONGTEXT,
      description LONGTEXT,
      is_active TINYINT DEFAULT 1,
      product_count INT DEFAULT 0,
      order_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Ensure existing columns are migrated to LONGTEXT if they already exist
  try {
    await query("ALTER TABLE shops MODIFY COLUMN user_profile_url LONGTEXT");
    await query("ALTER TABLE shops MODIFY COLUMN logo_url LONGTEXT");
    await query("ALTER TABLE shops MODIFY COLUMN banner_url LONGTEXT");
    await query("ALTER TABLE shops MODIFY COLUMN description LONGTEXT");
  } catch (e) {
    console.log("Migration note (shops):", e.message);
  }

  const DUMMY_SHOPS = [
    {
      name: "Vogue By Satyabhama",
      email: "sathyabhama@vogstya.com",
      first_name: "Satyabhama",
      last_name: "Vogue",
      phone: "7989631244",
      gender: "Female",
      state: "Telangana",
      address: "Vogue Headquarters, Hyderabad",
      logo_url: "https://api.dicebear.com/7.x/initials/svg?seed=Vogue&backgroundColor=0d5731",
      banner_url: "https://images.unsplash.com/photo-1513519245088-0e12902e35a6?q=80&w=2000&auto=format&fit=crop",
      product_count: 368,
      order_count: 16,
      is_active: 1
    },
    {
      name: "SHOBHA STORES",
      email: "shobhastores2022@gmail.com",
      first_name: "Puligilla",
      last_name: "Shobha Rani",
      phone: "8801094946",
      gender: "Female",
      state: "Telangana",
      address: "101, LAKSHMI NILAYAM, YENDAMURI LAYOUT",
      logo_url: "https://api.dicebear.com/7.x/initials/svg?seed=Shobha&backgroundColor=0d5731",
      banner_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop",
      product_count: 0,
      order_count: 0,
      is_active: 1
    }
  ];

  for (const shop of DUMMY_SHOPS) {
    const [existing] = await query("SELECT id FROM shops WHERE email = ?", [shop.email]);
    if (!existing) {
      try {
        await query(`
          INSERT INTO shops (name, email, first_name, last_name, phone, gender, state, address, logo_url, banner_url, product_count, order_count, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [shop.name, shop.email, shop.first_name, shop.last_name, shop.phone, shop.gender, shop.state, shop.address, shop.logo_url, shop.banner_url, shop.product_count, shop.order_count, shop.is_active]);
      } catch (e) {
        await query(`
          INSERT INTO shops (name, email, first_name, last_name, phone, gender, state, address, logo_url, banner_url, product_count, order_count)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [shop.name, shop.email, shop.first_name, shop.last_name, shop.phone, shop.gender, shop.state, shop.address, shop.logo_url, shop.banner_url, shop.product_count, shop.order_count]);
      }
    }
  }
  
  // 5. Sync Specifications & Values
  console.log("Syncing Specifications & Values...");
  await query(`
    CREATE TABLE IF NOT EXISTS specifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT DEFAULT 1,
      name VARCHAR(255) NOT NULL,
      is_active TINYINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  
  await query(`
    CREATE TABLE IF NOT EXISTS specification_values (
      id INT AUTO_INCREMENT PRIMARY KEY,
      specification_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      is_active TINYINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const specMap = {};
  for (const item of APPROVED_SPECIFICATION_VALUES) {
    if (!specMap[item.spec]) {
      const [existingSpec] = await query("SELECT id FROM specifications WHERE name = ?", [item.spec]);
      if (existingSpec) {
        specMap[item.spec] = existingSpec.id;
      } else {
        const result = await query("INSERT INTO specifications (name, category_id, is_active) VALUES (?, 1, 1)", [item.spec]);
        specMap[item.spec] = result.insertId;
      }
    }
    
    const specId = specMap[item.spec];
    const [existingValue] = await query("SELECT id FROM specification_values WHERE specification_id = ? AND name = ?", [specId, item.name]);
    
    if (!existingValue) {
      await query("INSERT INTO specification_values (specification_id, name, is_active) VALUES (?, ?, ?)", [specId, item.name, item.active]);
    } else {
      await query("UPDATE specification_values SET is_active = ? WHERE id = ?", [item.active, existingValue.id]);
    }
  }

  // 6. Sync all remaining CRUD tables
  console.log("Creating any missing admin tables...");
  const missingTables = [
    `CREATE TABLE IF NOT EXISTS brands (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, image_url TEXT, status TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS flash_sales (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, start_date DATETIME, end_date DATETIME, status TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS drivers (id INT AUTO_INCREMENT PRIMARY KEY, first_name VARCHAR(255) NOT NULL, last_name VARCHAR(255), email VARCHAR(255), phone VARCHAR(50), status TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS admin_users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255), role VARCHAR(100), status TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS banners (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), image_url TEXT, link TEXT, status TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS ads (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), image_url TEXT, link TEXT, status TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS coupons (id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(100) NOT NULL, discount_type VARCHAR(50), discount_value DECIMAL(10,2), start_date DATETIME, end_date DATETIME, status TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS notifications (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, message TEXT, status TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS blogs (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, content LONGTEXT, image_url TEXT, status TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS withdraws (id INT AUTO_INCREMENT PRIMARY KEY, shop_id INT, amount DECIMAL(10,2), status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS support_tickets (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, subject VARCHAR(255), description TEXT, status VARCHAR(50) DEFAULT 'open', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS contact_us (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), subject VARCHAR(255), message TEXT, is_read TINYINT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS languages (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), code VARCHAR(10), is_active TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS galleries (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), image_url TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS generate_settings (id INT AUTO_INCREMENT PRIMARY KEY, setting_key VARCHAR(255) UNIQUE, setting_value TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS verify_manages (id INT AUTO_INCREMENT PRIMARY KEY, shop_id INT, document_type VARCHAR(100), document_url TEXT, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS currencies (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), symbol VARCHAR(10), exchange_rate DECIMAL(10,4), is_default TINYINT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS delivery_charges (id INT AUTO_INCREMENT PRIMARY KEY, region VARCHAR(255), charge DECIMAL(10,2), status TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS vat_taxes (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), percentage DECIMAL(5,2), status TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS theme_colors (id INT AUTO_INCREMENT PRIMARY KEY, primary_color VARCHAR(50), secondary_color VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS social_links (id INT AUTO_INCREMENT PRIMARY KEY, platform VARCHAR(100), url TEXT, status TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS ticket_issue_types (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), status TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS roles (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), permissions TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS legal_pages (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), slug VARCHAR(255), content LONGTEXT, status TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS payment_gateways (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), client_id VARCHAR(255), secret_key VARCHAR(255), is_active TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS s_m_s_configs (id INT AUTO_INCREMENT PRIMARY KEY, gateway_name VARCHAR(100), api_key VARCHAR(255), sender_id VARCHAR(100), is_active TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS google_re_captchas (id INT AUTO_INCREMENT PRIMARY KEY, site_key VARCHAR(255), secret_key VARCHAR(255), is_active TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`
  ];
  for (const t of missingTables) {
    try { await query(t); } catch(e) { console.log("Table create error:", e.message); }
  }

  console.log("Admin data synchronization completed!");
  return { success: true, message: "All admin datasets and missing tables synchronized successfully." };
}
