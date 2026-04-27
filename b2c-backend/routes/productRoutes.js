import express from "express";
import { addProduct, deleteProduct, getProducts, updateProduct, getActiveAd } from "../Controllers/productController.js";
import { createReview, getProductReviews, getAllReviews, deleteReview } from "../Controllers/reviewController.js";
import { verifyToken } from "../Middleware/auth.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/active-ad", getActiveAd);
router.post("/", addProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

// Review routes
router.get("/reviews/all", verifyToken, getAllReviews); // Admin: fetch all reviews
router.get("/:productId/reviews", getProductReviews);
router.post("/reviews", verifyToken, createReview);
router.delete("/reviews/:id", verifyToken, deleteReview);

export { router as productRoutes };   // ✅
