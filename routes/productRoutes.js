import express from "express";
import { getPublicProducts, getProductDetails } from "../controllers/productController.js";

const router = express.Router();

// Get all public products (active only) with filtering and sorting
router.get("/products", getPublicProducts);

// Get single product details
router.get("/products/:id", getProductDetails);

export default router;
