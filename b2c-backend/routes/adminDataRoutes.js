import express from "express";
import { getCategories, getColors, getSizes, getUnits, getCustomers, getSqlTableContent, getSqlTables, createRecord, updateRecord, deleteRecord, seedAdminData, getMetadata, handleProductAction } from "../Controllers/adminDataController.js";
import { verifyToken } from "../Middleware/auth.js";

const router = express.Router();

router.get("/tables", verifyToken, getSqlTables);
router.get("/tables/categories", verifyToken, getCategories);
router.get("/tables/customers", verifyToken, getCustomers);
router.get("/tables/:tableName", verifyToken, getSqlTableContent);
router.post("/products/action", verifyToken, handleProductAction);

// Generic CRUD
router.post("/tables/:tableName", verifyToken, createRecord);
router.put("/tables/:tableName/:id", verifyToken, updateRecord);
router.delete("/tables/:tableName/:id", verifyToken, deleteRecord);
router.post("/seed", verifyToken, seedAdminData);
router.get("/seed_temp", seedAdminData);
router.get("/metadata", verifyToken, getMetadata);

router.get("/debug-flash-sales", verifyToken, (req, res) => {
  db.query("DESCRIBE flash_sales", (err, rows) => {
    if (err) res.status(500).json(err);
    else res.json(rows);
  });
});

export { router as adminDataRoutes };
