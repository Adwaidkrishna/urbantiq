import Product from "../../models/Product.js";

export const getProducts = async (req, res) => {
    try {
        const products = await Product
            .find()
            .populate("category", "name")
            .sort({ createdAt: -1 });

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
