import Category from "../../models/Category.js";

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
