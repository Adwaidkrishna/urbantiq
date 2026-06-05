import Category from "../../models/Category.js";

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json({ message: "Categories fetched successfully", categories });
  } catch (error) {
    console.error("Get Categories Error:", error);
    res.status(500).json({ message: "Server error during categories fetch", error: error.message });
  }
};
