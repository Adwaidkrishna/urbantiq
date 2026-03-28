import express from "express";
import { toggleWishlist, getWishlist } from "../controllers/wishlistController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/toggle", authMiddleware, toggleWishlist);
router.get("/", authMiddleware, getWishlist);

export default router;
