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

export async function synchronizeAllAdminData(query) {
  console.log("Starting full admin data synchronization...");

  // 1. Sync Colors (uses existing colorCatalog logic)
  console.log("Syncing Colors...");
  await synchronizeApprovedColors(query);

  // 1b. Sync Categories
  console.log("Syncing Categories...");
  await query(`UPDATE categories SET is_active = 0`);
  for (const catName of APPROVED_CATEGORY_CATALOG) {
    const [existing] = await query("SELECT id FROM categories WHERE name = ?", [catName]);
    if (!existing) {
      const defaultIcon = `https://api.dicebear.com/7.x/initials/svg?seed=${catName}&backgroundColor=0d5731&fontFamily=Inter&fontWeight=700`;
      await query("INSERT INTO categories (name, image_url, is_active) VALUES (?, ?, 1)", [catName, defaultIcon]);
    } else {
      await query("UPDATE categories SET is_active = 1 WHERE id = ?", [existing.id]);
    }
  }

  // 2. Sync Sizes
  console.log("Syncing Sizes...");
  await query(`UPDATE sizes SET is_active = 0`);
  for (const sizeName of APPROVED_SIZE_CATALOG) {
    const [existing] = await query("SELECT id FROM sizes WHERE name = ?", [sizeName]);
    if (!existing) {
      await query("INSERT INTO sizes (name, size, is_active) VALUES (?, ?, 1)", [sizeName, sizeName]);
    } else {
      await query("UPDATE sizes SET is_active = 1 WHERE id = ?", [existing.id]);
    }
  }

  // 3. Sync Units
  console.log("Syncing Units...");
  await query(`UPDATE units SET is_active = 0`);
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
      await query("INSERT INTO units (name, is_active) VALUES (?, 1)", [unitName]);
    } else {
      await query("UPDATE units SET is_active = 1 WHERE id = ?", [existing.id]);
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
      user_profile_url VARCHAR(1000),
      name VARCHAR(255) NOT NULL,
      state VARCHAR(100),
      address TEXT,
      gst_id VARCHAR(100),
      logo_url VARCHAR(1000),
      banner_url VARCHAR(1000),
      description TEXT,
      is_active TINYINT DEFAULT 1,
      product_count INT DEFAULT 0,
      order_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

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
      await query(`
        INSERT INTO shops (name, email, first_name, last_name, phone, gender, state, address, logo_url, banner_url, product_count, order_count, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [shop.name, shop.email, shop.first_name, shop.last_name, shop.phone, shop.gender, shop.state, shop.address, shop.logo_url, shop.banner_url, shop.product_count, shop.order_count, shop.is_active]);
    }
  }

  console.log("Admin data synchronization completed!");
  return { success: true, message: "All admin datasets (Colors, Sizes, Units, Shops) synchronized successfully." };
}
