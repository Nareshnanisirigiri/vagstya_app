import { Router } from "express";
import { couponController } from "../converted-http/Controllers/Admin/CouponController.js";

export const adminCouponRoutes = Router();

adminCouponRoutes.get("/", (req, res) => couponController.index(req, res));
adminCouponRoutes.post("/", (req, res) => couponController.store(req, res));
adminCouponRoutes.put("/:id", (req, res) => couponController.update(req, res));
adminCouponRoutes.patch("/:id/status", (req, res) => couponController.statusToggle(req, res));
adminCouponRoutes.delete("/:id", (req, res) => couponController.destroy(req, res));
