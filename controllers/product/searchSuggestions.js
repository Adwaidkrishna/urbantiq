import Product from "../../models/Product.js";

export const searchSuggestions = async (req, res) => {
    try {
        const query = req.query.q || "";
        
        if (query.trim().length < 2) {
            return res.json({ success: true, products: [] });
        }

        const products = await Product.find({
            status: true,
            name: { $regex: query, $options: "i" }
        })
        .populate("category", "name")
        .limit(5)
        .lean();

        const formattedProducts = products.map(p => ({
            _id: p._id,
            name: p.name,
            category: p.category?.name || "Uncategorized",
            price: p.price,
            offerPrice: p.offerPrice,
            image: p.variants?.[0]?.images?.[0] || null
        }));

        res.json({
            success: true,
            products: formattedProducts
        });

    } catch (error) {
        console.error("Search suggestions error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
