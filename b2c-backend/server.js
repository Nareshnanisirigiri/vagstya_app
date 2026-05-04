import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { authRoutes } from "./routes/authRoutes.js";
import { productRoutes } from "./routes/productRoutes.js";
import { cartRoutes } from "./routes/cartRoutes.js";
import { orderRoutes } from "./routes/orderRoutes.js";
import { adminAdRoutes } from "./routes/adminAdRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
import { adminDataRoutes } from "./routes/adminDataRoutes.js";
import { categoryRoutes } from "./routes/categoryRoutes.js";
import { db } from "./config/db.js";

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
`;

db.query(createDraftsTable, (err) => {
  if (err) console.error("Failed to create pos_drafts table:", err);
  else console.log("pos_drafts table checked/created");
});

const app = express();
const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || "0.0.0.0";

app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, host: HOST, port: PORT });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/ads", adminAdRoutes);
app.use("/api/admin", dashboardRoutes);
app.use("/api/admin/data", adminDataRoutes);

app.get("/api/debug-schema", (req, res) => {
  db.query("DESCRIBE products", (err, products) => {
    db.query("DESCRIBE brands", (err2, brands) => {
      res.json({ products: err ? err : products, brands: err2 ? err2 : brands });
    });
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
