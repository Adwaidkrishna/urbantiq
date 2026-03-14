import express from "express";
import Product from "../models/ProductModel.js";

const router = express.Router();

// Get all public products (active only)
router.get("/products", async (req, res) => {
    try {
        const products = await Product.find({ status: true })
            .populate("category", "name")
            .sort({ createdAt: -1 });
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get single product details
router.get("/products/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate("category", "name");
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;
