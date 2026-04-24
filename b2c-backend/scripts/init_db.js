import { db } from "../config/db.js";

const createTables = [
  `CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url_slug VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(100),
    image_url TEXT,
    status INT DEFAULT 1,
    media_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    src TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'image',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2) DEFAULT 0,
    metal VARCHAR(100),
    weight VARCHAR(50),
    size VARCHAR(50),
    description TEXT,
    quantity INT DEFAULT 0,
    is_active INT DEFAULT 1,
    is_featured INT DEFAULT 0,
    is_auspicious INT DEFAULT 0,
    is_banner_main INT DEFAULT 0,
    is_banner_earrings INT DEFAULT 0,
    is_banner_necklaces INT DEFAULT 0,
    is_popular_jewellery INT DEFAULT 0,
    is_mens_shirts INT DEFAULT 0,
    is_womens_highlights INT DEFAULT 0,
    is_premium_sarees INT DEFAULT 0,
    media_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS product_categories (
    product_id INT,
    category_id INT,
    PRIMARY KEY (product_id, category_id)
  )`,
  `CREATE TABLE IF NOT EXISTS flash_sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    discount INT,
    status INT DEFAULT 1,
    start_time DATETIME,
    end_time DATETIME
  )`,
  `CREATE TABLE IF NOT EXISTS flash_sale_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flash_sale_id INT,
    product_id INT,
    price DECIMAL(10, 2),
    discount INT,
    quantity INT,
    sale_quantity INT DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    phone VARCHAR(50),
    auth_type VARCHAR(50) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS product_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    user_id INT,
    rating INT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
];

const seedData = [
  "INSERT IGNORE INTO categories (id, name, url_slug, type, image_url) VALUES (1, 'Jewellery', 'jewellery', 'category', 'https://images.unsplash.com/photo-1599643478514-4a11011c00c8?w=400')",
  "INSERT IGNORE INTO categories (id, name, url_slug, type, image_url) VALUES (2, 'Sarees', 'sarees', 'category', 'https://images.unsplash.com/photo-1610189013233-5c20202dcde0?w=400')",
  "INSERT IGNORE INTO media (id, src) VALUES (1, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600')",
  "INSERT IGNORE INTO products (id, name, slug, price, discount_price, description, quantity, is_featured, media_id) VALUES (1, 'Premium Gold Necklace', 'premium-gold-necklace', 25000, 22000, 'Handcrafted gold necklace', 10, 1, 1)",
  "INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (1, 1)"
];

async function init() {
  console.log("Starting Database Initialization...");
  
  for (const sql of createTables) {
    try {
      await db.promise().query(sql);
      console.log("Table created/verified.");
    } catch (err) {
      console.error("Error creating table:", err.message);
    }
  }

  for (const sql of seedData) {
    try {
      await db.promise().query(sql);
      console.log("Seed data inserted/verified.");
    } catch (err) {
      console.error("Error seeding data:", err.message);
    }
  }

  console.log("Database Initialization Complete!");
  process.exit(0);
}

init();
