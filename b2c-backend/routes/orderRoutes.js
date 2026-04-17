import express from "express";
import {
  completeCheckout,
  createOrder,
  getOrderDetails,
  listOrders,
  listPaymentGateways,
  startCheckout,
} from "../controllers/orderController.js";
import { attachUserIfToken, verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/payment-gateways", listPaymentGateways);
router.get("/", verifyToken, listOrders);
router.post("/checkout/start", attachUserIfToken, startCheckout);
router.post("/checkout/complete", attachUserIfToken, completeCheckout);

// Backward-compatible entry point
router.post("/", attachUserIfToken, createOrder);
router.get("/:id", attachUserIfToken, getOrderDetails);

export { router as orderRoutes };
