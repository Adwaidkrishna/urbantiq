import Product from "../models/ProductModel.js";

export const createProduct = async (req, res) => {
    try {
        const { name, description, category, price, offerPrice, status } = req.body;
        const variants = JSON.parse(req.body.variants);

        const variantsWithImages = variants.map((variant, index) => {
            const images = req.files
                .filter(file => file.fieldname === `variantImages${index}`)
                .map(file => file.filename);
            return { ...variant, images };
        });

        const newProduct = new Product({
            name,
            description,
            category,
            price,
            offerPrice,
            status: status === "true" || status === true,
            variants: variantsWithImages
        });

        await newProduct.save();
        res.status(201).json({ success: true, message: "Product created successfully", product: newProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

export const getProducts = async (req, res) => {
    try {
        const products = await Product
            .find()
            .populate("category", "name")   // so p.category?.name works in your UI
            .sort({ createdAt: -1 });

        res.json(products);               // your frontend expects a plain array
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id).populate("category", "name");
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

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
            const existingImages = (variant.images || []).map(img => img.split('/').pop());
            variant.images = [...existingImages, ...newImages];
        });

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            {
                name,
                description,
                category,
                price,
                offerPrice: offerPrice || null,
                status: status === "true" || status === true,
                variants
            },
            { new: true }
        );

        res.json({ success: true, message: "Product updated successfully", product: updatedProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

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

export const getProductDetails = async (req, res) => {
    try {

        const product = await Product
            .findById(req.params.id)
            .populate("category", "name");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            product
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};