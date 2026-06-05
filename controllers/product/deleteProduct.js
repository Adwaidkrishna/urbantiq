import Product from "../../models/Product.js";

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
