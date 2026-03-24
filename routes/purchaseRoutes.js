import express from "express";
import {
  createPurchase,
  createPurchaseItem,
  getPurchases,
  getPurchaseItems,
} from "../controllers/purchaseController.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// STEP 1 — Create a purchase (parent)
router.post("/purchases", adminMiddleware, createPurchase);

// STEP 2 — Add purchase item (child)
router.post("/purchase-items", adminMiddleware, createPurchaseItem);

// GET all purchases
router.get("/purchases-list", adminMiddleware, getPurchases);

// GET items for a specific purchase
router.get("/purchases/:id/items", adminMiddleware, getPurchaseItems);

export default router;
