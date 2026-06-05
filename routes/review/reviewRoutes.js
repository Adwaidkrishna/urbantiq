import express from "express";
import { createReview, getReviews } from "../../controllers/review/index.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createReview);

router.get("/:productId", getReviews);

export default router;
