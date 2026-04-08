import express from "express";
import adminAuthMiddleware from "../middleware/adminMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon } from "../controllers/couponController.js";

const router = express.Router();

// ADMIN ROUTES (Protected)
router.get("/admin/all", adminAuthMiddleware, getAllCoupons);
router.post("/admin", adminAuthMiddleware, createCoupon);
router.put("/admin/:id", adminAuthMiddleware, updateCoupon);
router.delete("/admin/:id", adminAuthMiddleware, deleteCoupon);

// USER ROUTES (Protected)
router.post("/validate", authMiddleware, validateCoupon);

export default router;
