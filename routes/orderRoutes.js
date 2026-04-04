import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminAuthMiddleware from "../middleware/adminMiddleware.js";
import { 
  placeOrder, getMyOrders, getOrderById, cancelOrder, requestReturn,
  getAllOrders, updateOrderStatus, validateStock 
} from "../controllers/orderController.js";

const router = express.Router();

// USER ROUTES (Protected)
router.get("/my-orders", authMiddleware, getMyOrders);
router.get("/:id", authMiddleware, getOrderById);
router.put("/:id/cancel", authMiddleware, cancelOrder);
router.put("/:id/return-request", authMiddleware, requestReturn);
router.post("/validate-stock", authMiddleware, validateStock);
router.post("/", authMiddleware, placeOrder);

// ADMIN ROUTES (Protected)
router.get("/admin/all", adminAuthMiddleware, getAllOrders);
router.put("/admin/:id/status", adminAuthMiddleware, updateOrderStatus);

export default router;
