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

const migrations = [
  // Ensure 'orders' table exists and has all required columns
  {
    table: "orders",
    columns: [
      { name: "pos_order", type: "TINYINT(1) DEFAULT 0" },
      { name: "delivery_charge", type: "DOUBLE DEFAULT 0" },
      { name: "payable_amount", type: "DOUBLE DEFAULT 0" },
      { name: "total_amount", type: "DOUBLE DEFAULT 0" },
      { name: "tax_amount", type: "DOUBLE DEFAULT 0" },
      { name: "discount", type: "DOUBLE DEFAULT 0" },
      { name: "coupon_id", type: "BIGINT UNSIGNED NULL" },
      { name: "coupon_discount", type: "DOUBLE DEFAULT 0" },
      { name: "payment_status", type: "VARCHAR(50) DEFAULT 'Pending'" },
      { name: "order_status", type: "VARCHAR(50) DEFAULT 'Pending'" },
      { name: "payment_method", type: "VARCHAR(100) NULL" },
      { name: "address_id", type: "BIGINT UNSIGNED NULL" },
      { name: "instruction", type: "TEXT NULL" },
      { name: "admin_commission", type: "DOUBLE DEFAULT 0" },
      { name: "shop_id", type: "BIGINT UNSIGNED NULL" },
      { name: "customer_id", type: "BIGINT UNSIGNED NULL" },
      { name: "order_code", type: "VARCHAR(50) NULL" },
      { name: "prefix", type: "VARCHAR(20) DEFAULT 'RC'" }
    ]
  },
  // Ensure 'addresses' table
  {
    table: "addresses",
    sql: `CREATE TABLE IF NOT EXISTS addresses (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NULL,
      phone VARCHAR(20) NULL,
      customer_id BIGINT UNSIGNED NULL,
      address_type VARCHAR(50) DEFAULT 'Home',
      city VARCHAR(100) NULL,
      area VARCHAR(100) NULL,
      address_line TEXT NULL,
      address_line2 TEXT NULL,
      post_code VARCHAR(20) NULL,
      latitude DOUBLE NULL,
      longitude DOUBLE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  },
  // Ensure 'payments' table
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
  // Ensure 'order_payments' table
  {
    table: "order_payments",
    sql: `CREATE TABLE IF NOT EXISTS order_payments (
      order_id BIGINT UNSIGNED NOT NULL,
      payment_id BIGINT UNSIGNED NOT NULL,
      PRIMARY KEY (order_id, payment_id)
    )`
  },
  // Ensure 'order_products' table
  {
    table: "order_products",
    sql: `CREATE TABLE IF NOT EXISTS order_products (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_id BIGINT UNSIGNED NOT NULL,
      product_id BIGINT UNSIGNED NOT NULL,
      quantity INT NOT NULL,
      color VARCHAR(50) NULL,
      size VARCHAR(50) NULL,
      unit VARCHAR(50) NULL,
      price DOUBLE NOT NULL
    )`
  },
  // Ensure 'customers' table
  {
    table: "customers",
    sql: `CREATE TABLE IF NOT EXISTS customers (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  }
];

db.connect((err) => {
  if (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }

  console.log("Connected to MySQL. Running order system migrations...");

  let migrationIndex = 0;

  function runNext() {
    if (migrationIndex >= migrations.length) {
      console.log("All order system migrations finished.");
      db.end();
      process.exit(0);
      return;
    }

    const m = migrations[migrationIndex];
    migrationIndex++;

    if (m.sql) {
      db.query(m.sql, (err) => {
        if (err) console.error(`Error creating table ${m.table}:`, err.message);
        else console.log(`Table ${m.table} checked/created.`);
        runNext();
      });
    } else if (m.columns) {
      // Check and add columns to existing table
      db.query(`DESCRIBE ${m.table}`, (err, rows) => {
        if (err) {
          console.error(`Error describing ${m.table}:`, err.message);
          runNext();
          return;
        }

        const existingFields = rows.map(r => r.Field);
        const missing = m.columns.filter(c => !existingFields.includes(c.name));

        if (missing.length === 0) {
          console.log(`Table ${m.table} is up to date.`);
          runNext();
          return;
        }

        console.log(`Adding ${missing.length} missing columns to ${m.table}...`);
        let colsAdded = 0;
        missing.forEach(col => {
          db.query(`ALTER TABLE ${m.table} ADD COLUMN ${col.name} ${col.type}`, (err) => {
            colsAdded++;
            if (err) console.error(`Error adding ${col.name}:`, err.message);
            else console.log(`Successfully added ${col.name} to ${m.table}.`);
            
            if (colsAdded === missing.length) runNext();
          });
        });
      });
    }
  }

  runNext();
});
