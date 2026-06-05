import express from "express";
import { getActiveCategories } from "../controllers/category/index.js";

const router = express.Router();

router.get("/categories", getActiveCategories);

export default router;