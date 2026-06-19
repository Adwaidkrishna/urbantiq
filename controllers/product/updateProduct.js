import Product from "../../models/Product.js";
import { applyOffers } from "../offer/offerUtils.js";

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category, price, offerPrice, status } = req.body;
        const variants = JSON.parse(req.body.variants);

        const existingProduct = await Product.findById(id);
        if (!existingProduct) return res.status(404).json({ success: false, message: "Product not found" });

        if (req.body.__v !== undefined) {
            existingProduct.__v = req.body.__v;
        }

        // Validate IDs
        const incomingVariantIds = variants.filter(v => v._id).map(v => v._id);
        const incomingSizeIds = variants.flatMap(v => v.sizes || []).filter(s => s._id).map(s => s._id);

        if (new Set(incomingVariantIds).size !== incomingVariantIds.length || new Set(incomingSizeIds).size !== incomingSizeIds.length) {
            return res.status(400).json({ success: false, message: "Existing Variant IDs are immutable. Only new variants may receive new IDs." });
        }

        for (const existingVariant of existingProduct.variants) {
            if (!incomingVariantIds.includes(existingVariant._id.toString())) {
                return res.status(400).json({ success: false, message: "Existing Variant IDs are immutable. Only new variants may receive new IDs." });
            }
            const incomingSizes = variants.find(v => v._id === existingVariant._id.toString())?.sizes || [];
            const incomingSizeIdsForVariant = incomingSizes.filter(s => s._id).map(s => s._id);
            for (const sId of existingVariant.sizes.map(s => s._id.toString())) {
                if (!incomingSizeIdsForVariant.includes(sId)) {
                    return res.status(400).json({ success: false, message: "Existing Variant IDs are immutable. Only new variants may receive new IDs." });
                }
            }
        }

        // Handle images for each variant
        variants.forEach((variant, index) => {
            const newImages = req.files
                .filter(file => file.fieldname === `variantImages${index}`)
                .map(file => file.filename);

            const existingImages = (variant.images || []).map(img => img.split('/').pop());
            variant.images = [...existingImages, ...newImages];
        });

        existingProduct.name = name;
        existingProduct.description = description;
        existingProduct.category = category;
        existingProduct.price = price;
        existingProduct.offerPrice = offerPrice || null;
        existingProduct.productOfferPrice = offerPrice || null;
        existingProduct.status = status === "true" || status === true;

        const newVariantsArray = [];
        for (const vData of variants) {
            if (vData._id) {
                const existingVariant = existingProduct.variants.find(v => v._id.toString() === vData._id);
                if (existingVariant) {
                    existingVariant.color = vData.color;
                    existingVariant.colorName = vData.colorName;
                    existingVariant.images = vData.images;
                    
                    const newSizesArray = [];
                    for (const sData of vData.sizes) {
                        if (sData._id) {
                            const existingSize = existingVariant.sizes.find(s => s._id.toString() === sData._id);
                            if (existingSize) {
                                existingSize.size = sData.size;
                                existingSize.stock = sData.stock;
                                newSizesArray.push(existingSize);
                            } else {
                                newSizesArray.push({ size: sData.size, stock: sData.stock });
                            }
                        } else {
                            newSizesArray.push({ size: sData.size, stock: sData.stock });
                        }
                    }
                    existingVariant.sizes = newSizesArray;
                    newVariantsArray.push(existingVariant);
                } else {
                    newVariantsArray.push({ color: vData.color, colorName: vData.colorName, images: vData.images, sizes: vData.sizes });
                }
            } else {
                newVariantsArray.push({ color: vData.color, colorName: vData.colorName, images: vData.images, sizes: vData.sizes });
            }
        }
        
        existingProduct.variants = newVariantsArray;
        await existingProduct.save();
        const updatedProduct = existingProduct;

        await applyOffers(true);

        res.json({ success: true, message: "Product updated successfully", product: updatedProduct });
    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ success: false, message: "The product has been modified by another user. Please refresh and try again." });
        }
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
