import Category from "../models/CategoryModel.js";

export const createCategory = async (req, res) => {
  try {

    const name = req.body.name?.trim();
    const description = req.body.description?.trim();

    if (!req.file) {
      return res.status(400).json({
        message: "Image is required"
      });
    }

    const image = req.file.filename;

    // check existing category
    const existingCategory = await Category.findOne({ name });

    if (existingCategory) {
      return res.status(400).json({
        message: "Category already exists"
      });
    }

    const category = new Category({
      name,
      description,
      image
    });

    await category.save();

    res.status(201).json({
      message: "Category created successfully",
      category
    });

  } catch (error) {
    console.error("Create Category Error:", error);
    res.status(500).json({
      message: "Server error during category creation",
      error: error.message
    });
  }
};

export const getCategories = async (req, res) => {
  try {

    const categories = await Category.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: "Categories fetched successfully",
      categories
    });

  } catch (error) {
    console.error("Get Categories Error:", error);
    res.status(500).json({
      message: "Server error during categories fetch",
      error: error.message
    });
  }
};

export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) return res.status(404).json({ message: "Category not found" });
        res.json({ category });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateCategory = async (req, res) => {

    try {

        const { id } = req.params;
        const { name, description, status } = req.body;

        const updateData = { name, description };

        // Only update status if provided
        if (status !== undefined) {
            updateData.status = status === "true" || status === true;
        }

        // Only update image if a new file was uploaded
        if (req.file) {
            updateData.image = req.file.filename;
        }

        const category = await Category.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json({
            message: "Category updated successfully",
            category
        });

    } catch (error) {

        res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }

};


export const deleteCategory = async (req, res) => {

    try {

        const { id } = req.params;

        const category = await Category.findByIdAndDelete(id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        res.json({
            message: "Category deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }

};


export const getActiveCategories = async (req, res) => {
  try {

    const categories = await Category.find({ status: true });

    res.json({
      success: true,
      categories
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error"
    });

  }
};