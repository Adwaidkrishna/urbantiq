import Product from "../../models/Product.js";

export const createProduct = async (req, res) => {
    try {
        const { name, description, category, price, offerPrice, status } = req.body;
        const variants = JSON.parse(req.body.variants);

        const variantsWithImages = variants.map((variant, index) => { // attaching uploaded images to each variant.
            const images = req.files
                .filter(file => file.fieldname === `variantImages${index}`) // matching variant images with fieldname
                .map(file => file.filename);
            return { ...variant, images };
        });

        const newProduct = new Product({
            name,
            description,
            category,
            price,
            offerPrice,
            status: status === "true" || status === true, // boolean conversion
            variants: variantsWithImages
        });

        await newProduct.save();
        res.status(201).json({ success: true, message: "Product created successfully", product: newProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
