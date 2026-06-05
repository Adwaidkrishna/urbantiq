import Category from "../../models/Category.js";

export const getActiveCategories = async (req, res) => {
  try {
    const categories = await Category.find({ status: true }).sort({ createdAt: -1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
