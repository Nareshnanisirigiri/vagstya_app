import express from "express";
import { getCategories, getColors, getSizes, getCustomers, getSqlTableContent, getSqlTables } from "../controllers/adminDataController.js";
import { verifyToken } from "../Middleware/auth.js";

const router = express.Router();

router.get("/tables", verifyToken, getSqlTables);
router.get("/tables/categories", verifyToken, getCategories);
router.get("/tables/colors", verifyToken, getColors);
router.get("/tables/sizes", verifyToken, getSizes);
router.get("/tables/customers", verifyToken, getCustomers);
router.get("/tables/:tableName", verifyToken, getSqlTableContent);

export { router as adminDataRoutes };
