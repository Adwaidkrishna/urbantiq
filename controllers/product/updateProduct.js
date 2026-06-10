import Product from "../../models/Product.js";
import { applyOffers } from "../offer/offerUtils.js";

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category, price, offerPrice, status } = req.body;
        const variants = JSON.parse(req.body.variants);

        const existingProduct = await Product.findById(id);
        if (!existingProduct) return res.status(404).json({ success: false, message: "Product not found" });

        // Handle images for each variant
        variants.forEach((variant, index) => {
            const newImages = req.files
                .filter(file => file.fieldname === `variantImages${index}`)
                .map(file => file.filename);

            // Clean paths from existing images if they come with prefix
            const existingImages = (variant.images || []).map(img => img.split('/').pop()); // ["uploads","products","img1.jpg"]
            variant.images = [...existingImages, ...newImages]; // replacing old images with new images
        });

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            {
                name,
                description,
                category,
                price,
                offerPrice: offerPrice || null,
                productOfferPrice: offerPrice || null,
                status: status === "true" || status === true,
                variants
            },
            { new: true }
        );

        await applyOffers(true);

        res.json({ success: true, message: "Product updated successfully", product: updatedProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
