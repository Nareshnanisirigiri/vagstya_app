import express from "express";
import { adminLogin, adminRegister, register, login, portalLogin, portalRegister } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/admin/register", adminRegister);
router.post("/admin/login", adminLogin);
router.post("/portal-login", portalLogin);
router.post("/portal-register", portalRegister);

export { router as authRoutes };   // ✅ IMPORTANT
