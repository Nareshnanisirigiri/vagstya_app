import express from "express";
import { addToCart, getCart } from "../Controllers/cartController.js";
import { verifyToken } from "../Middleware/auth.js";

const router = express.Router();

router.post("/", verifyToken, addToCart);
router.get("/", verifyToken, getCart);

export { router as cartRoutes };   // ✅