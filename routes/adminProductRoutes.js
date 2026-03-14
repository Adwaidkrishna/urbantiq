import express from "express";
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct } from "../controllers/productController.js";
import adminAuthMiddleware from "../middleware/adminMiddleware.js";
import uploadProduct from "../middleware/uploadProduct.js";

const router = express.Router();

router.post("/products", adminAuthMiddleware, uploadProduct.any(), createProduct);
router.get("/products/list", adminAuthMiddleware, getProducts);
router.get("/products/:id", adminAuthMiddleware, getProductById);
router.put("/products/:id", adminAuthMiddleware, uploadProduct.any(), updateProduct);
router.delete("/products/:id", adminAuthMiddleware, deleteProduct);

export default router;
