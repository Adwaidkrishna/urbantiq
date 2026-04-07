import express from "express";
import { createReview, getReviews } from "../controllers/reviewController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /api/reviews
 * @desc Create a new review for a delivered product in an order.
 * @access Private
 */
router.post("/", authMiddleware, createReview);

/**
 * @route GET /api/reviews/:productId
 * @desc Fetch all reviews for a specific product.
 * @access Public
 */
router.get("/:productId", getReviews);

export default router;
