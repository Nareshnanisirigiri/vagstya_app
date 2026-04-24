import express from "express";
import {
  completeCheckout,
  createOrder,
  getOrderDetails,
  listOrders,
  listPaymentGateways,
  startCheckout,
  updateOrderLifecycleStatus,
} from "../Controllers/orderController.js";
import { attachUserIfToken, verifyToken } from "../Middleware/auth.js";

const router = express.Router();

router.get("/payment-gateways", listPaymentGateways);
router.get("/", verifyToken, listOrders);
router.post("/checkout/start", attachUserIfToken, startCheckout);
router.post("/checkout/complete", attachUserIfToken, completeCheckout);
router.patch("/:id/lifecycle-status", verifyToken, updateOrderLifecycleStatus);

// Backward-compatible entry point
router.post("/", attachUserIfToken, createOrder);
router.get("/:id", attachUserIfToken, getOrderDetails);

export { router as orderRoutes };
