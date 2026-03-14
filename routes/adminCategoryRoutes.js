import express from "express";
import { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory } from "../controllers/categoryController.js";
import adminAuthMiddleware from "../middleware/adminMiddleware.js"
import categoryUploadMiddleware from "../middleware/categoryUploadMiddleware.js";

const router = express.Router();

router.post("/categories", categoryUploadMiddleware.single("image"), createCategory);
router.get("/categories/list", adminAuthMiddleware, getCategories);
router.get("/categories/:id", adminAuthMiddleware, getCategoryById);
router.put("/categories/:id", adminAuthMiddleware, categoryUploadMiddleware.single("image"), updateCategory);
router.delete("/categories/:id", adminAuthMiddleware, deleteCategory);

export default router;