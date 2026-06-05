import Category from "../../models/Category.js";

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, status } = req.body;

        const updateData = { name, description };

        if (status !== undefined) {
            updateData.status = status === "true" || status === true;
        }

        if (req.file) {
            updateData.image = req.file.filename;
        }

        const category = await Category.findByIdAndUpdate(id, updateData, { new: true });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json({ message: "Category updated successfully", category });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
