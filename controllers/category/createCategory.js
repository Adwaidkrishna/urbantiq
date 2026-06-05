import Category from "../../models/Category.js";

export const createCategory = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const description = req.body.description?.trim();

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const image = req.file.filename;

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = new Category({ name, description, image });
    await category.save();

    res.status(201).json({ message: "Category created successfully", category });
  } catch (error) {
    console.error("Create Category Error:", error);
    res.status(500).json({ message: "Server error during category creation", error: error.message });
  }
};
