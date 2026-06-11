import express from "express";
import { getPublicProducts, getProductDetails } from "../../controllers/product/index.js";
import { getActiveSaleDetails } from "../../controllers/offer/index.js";

const router = express.Router();

// Get active sale details (countdown target date & coupons)
router.get("/active-sale", getActiveSaleDetails);

// Get all public products (active only) with filtering and sorting
router.get("/products", getPublicProducts);

// Get single product details
router.get("/products/:id", getProductDetails);

export default router;

