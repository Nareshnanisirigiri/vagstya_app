import express from "express";
import { getAdminDashboard, getVendorDashboard } from "../Controllers/dashboardController.js";
import { verifyToken } from "../Middleware/auth.js";

const router = express.Router();

router.get("/dashboard", verifyToken, getAdminDashboard);
router.get("/vendor", getVendorDashboard);

export { router as dashboardRoutes };
