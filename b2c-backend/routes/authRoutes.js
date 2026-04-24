import express from "express";
import { adminLogin, adminRegister, register, login, portalLogin, portalRegister, forgotPassword, resetPassword } from "../Controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/admin/register", adminRegister);
router.post("/admin/login", adminLogin);
router.post("/portal-login", portalLogin);
router.post("/portal-register", portalRegister);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export { router as authRoutes };   // ✅ IMPORTANT
