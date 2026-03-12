import express from "express";
import { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory } from "../controllers/categoryController.js";
import adminAuthMiddleware from "../middleware/adminMiddleware.js"
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/categories", upload.single("image"), createCategory);
router.get("/categories/list", adminAuthMiddleware, getCategories);
router.get("/categories/:id", adminAuthMiddleware, getCategoryById);
router.put("/categories/:id", adminAuthMiddleware, upload.single("image"), updateCategory);
router.delete("/categories/:id", adminAuthMiddleware, deleteCategory);

export default router;