import express from "express";
import Category from "../models/CategoryModel.js";

const router = express.Router();

router.get("/categories", async (req, res) => {
  try {

    const categories = await Category.find({ status: true }).sort({ createdAt: -1 });

    res.json({
      success: true,
      categories
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error"
    });

  }
});

export default router;