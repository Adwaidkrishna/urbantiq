import Category from "../../models/Category.js";

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByIdAndDelete(id);

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json({ message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
