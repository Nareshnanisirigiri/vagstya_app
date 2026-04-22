import express from "express";
import { getCategories, getColors, getSizes, getCustomers, getSqlTableContent, getSqlTables, createRecord, updateRecord, deleteRecord } from "../controllers/adminDataController.js";
import { verifyToken } from "../Middleware/auth.js";

const router = express.Router();

router.get("/tables", verifyToken, getSqlTables);
router.get("/tables/categories", verifyToken, getCategories);
router.get("/tables/colors", verifyToken, getColors);
router.get("/tables/sizes", verifyToken, getSizes);
router.get("/tables/customers", verifyToken, getCustomers);
router.get("/tables/:tableName", verifyToken, getSqlTableContent);

// Generic CRUD
router.post("/tables/:tableName", verifyToken, createRecord);
router.put("/tables/:tableName/:id", verifyToken, updateRecord);
router.delete("/tables/:tableName/:id", verifyToken, deleteRecord);

export { router as adminDataRoutes };
