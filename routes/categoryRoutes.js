import express from "express";
import { getActiveCategories } from "../controllers/categoryController.js";

const router = express.Router();

router.get("/categories", getActiveCategories);

export default router;