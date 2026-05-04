import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? "root",
  database: process.env.DB_NAME || "sathyavogue_db"
});

const schema = [
  {
    table: "users",
    sql: `CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'customer',
      phone VARCHAR(20) NULL,
      image_id BIGINT UNSIGNED NULL,
      remember_token VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  },
  {
    table: "customers",
    sql: `CREATE TABLE IF NOT EXISTS customers (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  },
  {
    table: "shops",
    sql: `CREATE TABLE IF NOT EXISTS shops (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      delivery_charge DOUBLE DEFAULT 50,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    table: "products",
    sql: `CREATE TABLE IF NOT EXISTS products (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      shop_id BIGINT UNSIGNED NULL,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      price DOUBLE NOT NULL,
      discount_price DOUBLE DEFAULT 0,
      quantity INT DEFAULT 0,
      short_description TEXT NULL,
      description LONGTEXT NULL,
      media_id BIGINT UNSIGNED NULL,
      is_active TINYINT(1) DEFAULT 1,
      is_new TINYINT(1) DEFAULT 0,
      is_featured TINYINT(1) DEFAULT 0,
      is_ad TINYINT(1) DEFAULT 0,
      is_auspicious TINYINT(1) DEFAULT 0,
      is_banner_main TINYINT(1) DEFAULT 0,
      is_banner_earrings TINYINT(1) DEFAULT 0,
      is_banner_necklaces TINYINT(1) DEFAULT 0,
      is_popular_jewellery TINYINT(1) DEFAULT 0,
      is_mens_shirts TINYINT(1) DEFAULT 0,
      is_womens_highlights TINYINT(1) DEFAULT 0,
      is_premium_sarees TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  },
  {
    table: "orders",
    sql: `CREATE TABLE IF NOT EXISTS orders (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      shop_id BIGINT UNSIGNED NULL,
      customer_id BIGINT UNSIGNED NULL,
      address_id BIGINT UNSIGNED NULL,
      order_code VARCHAR(50) NOT NULL,
      prefix VARCHAR(20) DEFAULT 'RC',
      payable_amount DOUBLE NOT NULL,
      total_amount DOUBLE NOT NULL,
      delivery_charge DOUBLE DEFAULT 0,
      tax_amount DOUBLE DEFAULT 0,
      discount DOUBLE DEFAULT 0,
      coupon_id BIGINT UNSIGNED NULL,
      coupon_discount DOUBLE DEFAULT 0,
      payment_status VARCHAR(50) DEFAULT 'Pending',
      order_status VARCHAR(50) DEFAULT 'Pending',
      payment_method VARCHAR(100) NULL,
      instruction TEXT NULL,
      pos_order TINYINT(1) DEFAULT 0,
      admin_commission DOUBLE DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  },
  {
    table: "order_products",
    sql: `CREATE TABLE IF NOT EXISTS order_products (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_id BIGINT UNSIGNED NOT NULL,
      product_id BIGINT UNSIGNED NOT NULL,
      quantity INT NOT NULL,
      price DOUBLE NOT NULL,
      color VARCHAR(50) NULL,
      size VARCHAR(50) NULL,
      unit VARCHAR(50) NULL
    )`
  },
  {
    table: "addresses",
    sql: `CREATE TABLE IF NOT EXISTS addresses (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      customer_id BIGINT UNSIGNED NULL,
      name VARCHAR(255) NULL,
      phone VARCHAR(20) NULL,
      city VARCHAR(100) NULL,
      area VARCHAR(100) NULL,
      address_line TEXT NULL,
      address_line2 TEXT NULL,
      post_code VARCHAR(20) NULL,
      address_type VARCHAR(50) DEFAULT 'Home',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  },
  {
    table: "payments",
    sql: `CREATE TABLE IF NOT EXISTS payments (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      amount DOUBLE NOT NULL,
      currency VARCHAR(10) DEFAULT 'INR',
      payment_method VARCHAR(50) NULL,
      is_paid TINYINT(1) DEFAULT 0,
      payment_token TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  },
  {
    table: "order_payments",
    sql: `CREATE TABLE IF NOT EXISTS order_payments (
      order_id BIGINT UNSIGNED NOT NULL,
      payment_id BIGINT UNSIGNED NOT NULL,
      PRIMARY KEY (order_id, payment_id)
    )`
  },
  {
    table: "media",
    sql: `CREATE TABLE IF NOT EXISTS media (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      src TEXT NOT NULL,
      type VARCHAR(50) NULL,
      name TEXT NULL,
      original_name TEXT NULL,
      extention VARCHAR(10) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  },
  {
    table: "categories",
    sql: `CREATE TABLE IF NOT EXISTS categories (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    table: "product_categories",
    sql: `CREATE TABLE IF NOT EXISTS product_categories (
      product_id BIGINT UNSIGNED NOT NULL,
      category_id BIGINT UNSIGNED NOT NULL,
      PRIMARY KEY (product_id, category_id)
    )`
  },
  {
    table: "ads",
    sql: `CREATE TABLE IF NOT EXISTS ads (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      media_id BIGINT UNSIGNED NULL,
      status TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  }
];

db.connect((err) => {
  if (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }

  console.log("Connected to MySQL. Starting global schema repair...");

  async function repair() {
    for (const item of schema) {
      console.log(`Checking table: ${item.table}...`);
      
      // 1. Create table if not exists
      await new Promise((resolve) => {
        db.query(item.sql, (err) => {
          if (err) console.error(`Error creating/checking table ${item.table}:`, err.message);
          resolve();
        });
      });

      // 2. Add missing columns explicitly
      const columns = {
        users: [
          { name: "role", type: "VARCHAR(50) DEFAULT 'customer'" },
          { name: "image_id", type: "BIGINT UNSIGNED NULL" },
          { name: "phone", type: "VARCHAR(20) NULL" }
        ],
        products: [
          { name: "is_ad", type: "TINYINT(1) DEFAULT 0" },
          { name: "is_banner_main", type: "TINYINT(1) DEFAULT 0" },
          { name: "is_popular_jewellery", type: "TINYINT(1) DEFAULT 0" },
          { name: "is_premium_sarees", type: "TINYINT(1) DEFAULT 0" }
        ],
        orders: [
          { name: "pos_order", type: "TINYINT(1) DEFAULT 0" },
          { name: "delivery_charge", type: "DOUBLE DEFAULT 0" },
          { name: "payment_status", type: "VARCHAR(50) DEFAULT 'Pending'" }
        ],
        categories: [
          { name: "slug", type: "VARCHAR(255) NULL" }
        ]
      };

      if (columns[item.table]) {
        await new Promise((resolve) => {
          db.query(`DESCRIBE ${item.table}`, (err, rows) => {
            if (err) {
              resolve();
              return;
            }

            const existing = rows.map(r => r.Field.toLowerCase());
            const missing = columns[item.table].filter(c => !existing.includes(c.name.toLowerCase()));

            if (missing.length === 0) {
              resolve();
              return;
            }

            let completed = 0;
            missing.forEach(col => {
              console.log(`Adding missing column ${col.name} to ${item.table}...`);
              db.query(`ALTER TABLE ${item.table} ADD COLUMN ${col.name} ${col.type}`, (err) => {
                if (err) console.error(`Error adding ${col.name} to ${item.table}:`, err.message);
                completed++;
                if (completed === missing.length) resolve();
              });
            });
          });
        });
      }
    }

    console.log("Database repair complete.");
    db.end();
    process.exit(0);
  }

  repair();
});
