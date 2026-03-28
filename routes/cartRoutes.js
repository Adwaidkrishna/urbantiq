import express from "express";
import { addToCart, getCart, updateCartQuantity, removeFromCart } from "../controllers/cartController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", authMiddleware, addToCart);
router.get("/", authMiddleware, getCart);
router.put("/update", authMiddleware, updateCartQuantity);
router.delete("/remove/:itemId", authMiddleware, removeFromCart);

export default router;
