import express from "express";
import { addToCart, getCart } from "../controllers/cartController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/", verifyToken, addToCart);
router.get("/", verifyToken, getCart);

export { router as cartRoutes };   // ✅