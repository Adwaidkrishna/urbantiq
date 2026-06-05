import express from "express";
import { toggleWishlist, getWishlist } from "../../controllers/wishlist/index.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/toggle", authMiddleware, toggleWishlist);
router.get("/", authMiddleware, getWishlist);

export default router;
