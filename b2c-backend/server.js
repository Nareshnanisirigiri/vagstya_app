import express from "express"; // v2.1
// Trigger restart for show all users fix
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import { productRoutes } from "./routes/productRoutes.js";
import { cartRoutes } from "./routes/cartRoutes.js";
import { orderRoutes } from "./routes/orderRoutes.js";
import { adminAdRoutes } from "./routes/adminAdRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
import { adminDataRoutes } from "./routes/adminDataRoutes.js";
import { adminCouponRoutes } from "./routes/adminCouponRoutes.js";
import { categoryRoutes } from "./routes/categoryRoutes.js";
import { notificationRoutes } from "./routes/notificationRoutes.js";
import { login } from "./Controllers/authController.js";
import { db } from "./config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const createDraftsTable = `
CREATE TABLE IF NOT EXISTS pos_drafts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer VARCHAR(255),
  total_products INT,
  subtotal DECIMAL(10,2),
  discount DECIMAL(10,2),
  total DECIMAL(10,2),
  items_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  src LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

db.query(createDraftsTable, (err) => {
  if (err) console.error("Failed to create tables:", err);
  else {
    console.log("Base tables checked/created");
    
    const migrations = [
      "CREATE TABLE IF NOT EXISTS categories (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), status TINYINT DEFAULT 1)",
      "CREATE TABLE IF NOT EXISTS sub_categories (id INT AUTO_INCREMENT PRIMARY KEY, category_id INT, name VARCHAR(255), status TINYINT DEFAULT 1)",
      "CREATE TABLE IF NOT EXISTS flash_sale_products (id INT AUTO_INCREMENT PRIMARY KEY, product_id INT, price DECIMAL(10,2), discount DECIMAL(10,2), quantity INT, sale_quantity INT DEFAULT 0, flash_sale_id INT)",
      "CREATE TABLE IF NOT EXISTS product_colors (product_id INT, color_id INT)",
      "CREATE TABLE IF NOT EXISTS product_sizes (product_id INT, size_id INT)",
      "CREATE TABLE IF NOT EXISTS brands (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), is_active TINYINT DEFAULT 1)",
      "CREATE TABLE IF NOT EXISTS units (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))",
      "ALTER TABLE products ADD COLUMN is_new TINYINT DEFAULT 0",
      "ALTER TABLE products ADD COLUMN category_id INT",
      "ALTER TABLE products ADD COLUMN sub_category_id INT",
      "ALTER TABLE products ADD COLUMN media_id INT",
      "ALTER TABLE products ADD COLUMN image TEXT",
      "ALTER TABLE products ADD COLUMN image_url TEXT",
      "ALTER TABLE products ADD COLUMN metal VARCHAR(255)",
      "ALTER TABLE products ADD COLUMN weight VARCHAR(255)",
      "ALTER TABLE products ADD COLUMN size VARCHAR(255)",
      "ALTER TABLE products ADD COLUMN code VARCHAR(255)",
      "ALTER TABLE products ADD COLUMN hsin_code VARCHAR(255)",
      "ALTER TABLE products ADD COLUMN spcifications TEXT",
      "ALTER TABLE products ADD COLUMN meta_title TEXT",
      "ALTER TABLE products ADD COLUMN meta_description TEXT",
      "ALTER TABLE products ADD COLUMN meta_keywords TEXT",
      "ALTER TABLE products ADD COLUMN brand_id INT",
      "ALTER TABLE products ADD COLUMN unit_id INT",
      "ALTER TABLE products ADD COLUMN approval_status VARCHAR(50) DEFAULT 'approved'",
      "ALTER TABLE products ADD COLUMN pending_data JSON NULL",
      "ALTER TABLE brands ADD COLUMN is_active TINYINT DEFAULT 1",
      "CREATE TABLE IF NOT EXISTS shops (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), is_active TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
      "INSERT IGNORE INTO shops (id, name, is_active) VALUES (1, 'Vogue By Satyabhama', 1), (2, 'SHOBHA STORES', 1)",
      "ALTER TABLE products ADD COLUMN shop_id INT DEFAULT 1",
      "CREATE TABLE IF NOT EXISTS specifications (id INT AUTO_INCREMENT PRIMARY KEY, category_id INT, name VARCHAR(255), is_active TINYINT DEFAULT 1)",
      "CREATE TABLE IF NOT EXISTS specification_values (id INT AUTO_INCREMENT PRIMARY KEY, specification_id INT, name VARCHAR(255), is_active TINYINT DEFAULT 1)",
      "CREATE TABLE IF NOT EXISTS flash_sales (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), min_discount INT, start_date DATETIME, end_date DATETIME, description TEXT, thumbnail LONGTEXT, is_active TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
      "ALTER TABLE flash_sales ADD COLUMN thumbnail LONGTEXT",
      "ALTER TABLE flash_sales MODIFY COLUMN thumbnail LONGTEXT",
      "ALTER TABLE products MODIFY COLUMN image LONGTEXT",
      "ALTER TABLE products MODIFY COLUMN image_url LONGTEXT",
      "CREATE TABLE IF NOT EXISTS riders (id INT AUTO_INCREMENT PRIMARY KEY, first_name VARCHAR(255), last_name VARCHAR(255), phone VARCHAR(20), email VARCHAR(255), gender VARCHAR(20), driving_license VARCHAR(255), password VARCHAR(255), profile_image LONGTEXT, dob DATE, vehicle_type VARCHAR(100), status TINYINT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
      "CREATE TABLE IF NOT EXISTS banners (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), image_url LONGTEXT, url VARCHAR(255), is_active TINYINT DEFAULT 1, is_for_own_shop TINYINT DEFAULT 0, type VARCHAR(50) DEFAULT 'main', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)",
      "ALTER TABLE banners ADD COLUMN is_for_own_shop TINYINT DEFAULT 0",
      "ALTER TABLE banners ADD COLUMN type VARCHAR(50) DEFAULT 'main'",
      "ALTER TABLE banners ADD COLUMN image_url LONGTEXT",
      "ALTER TABLE banners MODIFY COLUMN image_url LONGTEXT",
      "CREATE TABLE IF NOT EXISTS coupons (id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(100) NOT NULL, discount_type VARCHAR(50), discount DECIMAL(10,2) DEFAULT 0, min_purchase DECIMAL(10,2) DEFAULT 0, max_discount DECIMAL(10,2) DEFAULT 0, limit_per_user INT DEFAULT 1, start_date DATETIME, expire_date DATETIME, status TINYINT DEFAULT 1, shop_ids TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)",
      "ALTER TABLE coupons ADD COLUMN discount_type VARCHAR(50)",
      "ALTER TABLE coupons ADD COLUMN discount DECIMAL(10,2) DEFAULT 0",
      "ALTER TABLE coupons ADD COLUMN min_purchase DECIMAL(10,2) DEFAULT 0",
      "ALTER TABLE coupons ADD COLUMN max_discount DECIMAL(10,2) DEFAULT 0",
      "ALTER TABLE coupons ADD COLUMN limit_per_user INT DEFAULT 1",
      "ALTER TABLE coupons ADD COLUMN start_date DATETIME",
      "ALTER TABLE coupons ADD COLUMN expire_date DATETIME",
      "ALTER TABLE coupons ADD COLUMN status TINYINT DEFAULT 1",
      "ALTER TABLE coupons ADD COLUMN shop_ids TEXT",
      "CREATE TABLE IF NOT EXISTS notifications (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), message TEXT, image_url LONGTEXT, user_id INT NULL, is_read TINYINT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
      "ALTER TABLE notifications ADD COLUMN content TEXT",
      "ALTER TABLE notifications ADD COLUMN message TEXT"
    ];

    const runMigrations = (index) => {
      if (index >= migrations.length) {
        console.log("All migrations completed successfully");
        fs.appendFileSync("migration_log.txt", `[${new Date().toISOString()}] ALL MIGRATIONS COMPLETED\n`);
        return;
      }
      db.query(migrations[index], (err) => {
        let logMsg = `[${new Date().toISOString()}] Migration [${index}] (${migrations[index].substring(0, 30)}...): `;
        if (err) {
          if (err.message.includes("Duplicate column name") || err.message.includes("already exists")) {
            logMsg += "Already applied (skipped)\n";
          } else {
            logMsg += `FAILED: ${err.message}\n`;
            console.warn(`Migration [${index}] failed: ${err.message}`);
          }
        } else {
          logMsg += "SUCCESS\n";
        }
        fs.appendFileSync("migration_log.txt", logMsg);
        runMigrations(index + 1);
      });
    };
    runMigrations(0);
  }
});

const app = express();
const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || "0.0.0.0";

app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.all("/api/auth/login", (req, res, next) => {
  console.log("LOGIN ROUTE HIT!", req.method, req.url);
  if (req.method === "POST") {
    return login(req, res);
  }
  res.status(405).send("Method Not Allowed");
});

app.use("/api/auth", authRoutes);
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, host: HOST, port: PORT });
});

console.log("Registering routes...");
console.log("authRoutes defined:", !!authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/ads", adminAdRoutes);
app.use("/api/admin/coupons", adminCouponRoutes);
app.use("/api/admin", dashboardRoutes);
app.use("/api/admin/data", adminDataRoutes);

app.get("/api/debug-schema", (req, res) => {
  db.query("SELECT COUNT(*) as count FROM ads", (err, count1) => {
    db.query("SELECT * FROM ads LIMIT 5", (err2, rows1) => {
      res.json({ 
        ads_count: count1 ? count1[0].count : 0,
        ads_rows: rows1,
        ads_error: err ? err.message : null,
        ads_query_error: err2 ? err2.message : null
      });
    });
  });
});

app.use((req, res) => {
  console.log(`404: ${req.method} ${req.url}`);
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found.` });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
