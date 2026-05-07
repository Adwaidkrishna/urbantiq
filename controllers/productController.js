import Product from "../models/ProductModel.js";
import Order from "../models/OrderModel.js";

export const createProduct = async (req, res) => {
    try {
        const { name, description, category, price, offerPrice, status } = req.body;
        const variants = JSON.parse(req.body.variants);

        const variantsWithImages = variants.map((variant, index) => {//attaching uploaded images to each variant.
            const images = req.files
                .filter(file => file.fieldname === `variantImages${index}`)//matching variant images with fieldname
                .map(file => file.filename);
            return { ...variant, images };
        });

        const newProduct = new Product({
            name,
            description,
            category,
            price,
            offerPrice,
            status: status === "true" || status === true,//boolean conversion
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
            .populate("category", "name")
            .sort({ createdAt: -1 });

        res.json(products);
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
            const existingImages = (variant.images || []).map(img => img.split('/').pop());//["uploads","products","img1.jpg"]
            variant.images = [...existingImages, ...newImages];// replacing old images with new images
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

        const orders = await Order.find({ 
            "items.product": product._id,
            orderStatus: { $nin: ["Cancelled", "Returned", "Return Rejected"] }
        });
        
        let salesCount = 0;
        orders.forEach(order => {
             order.items.forEach(item => {
                  if (item.product.toString() === product._id.toString()) {
                       salesCount += item.quantity;
                  }
             });
        });

        const productObj = product.toObject();
        productObj.salesCount = salesCount;

        res.status(200).json({
            success: true,
            product: productObj
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

export const getPublicProducts = async (req, res) => {
    try {
        const { categories, maxPrice, search, sort, sizes, colors, newArrival, rating, limit } = req.query;
        let query = { status: true };

        // 1. Search
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        // 2. Category Filter
        if (categories) {
            const categoryIds = categories.split(",");
            query.category = { $in: categoryIds };
        }

        // 3. Price Filter
        if (maxPrice) {
            const max = Number(maxPrice);
            query.$or = [
                { offerPrice: { $gt: 0, $lte: max } },
                { offerPrice: null, price: { $lte: max } },
                { offerPrice: { $exists: false }, price: { $lte: max } },
                { offerPrice: 0, price: { $lte: max } }
            ];
        }

        // 5. Size Filter
        if (sizes) {
            const sizeArr = sizes.split(",");
            query["variants.sizes.size"] = { $in: sizeArr.map(s => new RegExp(`^${s}$`, "i")) };
        }

        // 6. Color Filter
        if (colors) {
            const colorArr = colors.split(",");
            query["variants.colorName"] = { $in: colorArr.map(c => new RegExp(`^${c}$`, "i")) };
        }

        // 7. New Arrivals (Last 7 days)
        if (newArrival === "true") {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            query.createdAt = { $gte: sevenDaysAgo };
        }

        // 8. Ratings
        if (rating) {
            query.averageRating = { $gte: Number(rating) };
        }

        // 4. Sorting
        let sortObj = { createdAt: -1 }; // default: Newest First
        if (sort === "Price: Low to High") {
            sortObj = { price: 1 };
        } else if (sort === "Price: High to Low") {
            sortObj = { price: -1 };
        } else if (sort === "Newest First") {
            sortObj = { createdAt: -1 };
        } else if (sort === "Top Rated") {
            sortObj = { averageRating: -1, createdAt: -1 };
        } else if (sort === "Most Popular") {
            sortObj = { reviewCount: -1, createdAt: -1 };
        }

        let dbQuery = Product.find(query)
            .populate("category", "name")
            .sort(sortObj);
            
        if (limit && sort !== "Most Popular") {
            dbQuery = dbQuery.limit(Number(limit));
        }
            
        const products = await dbQuery;

        let productsWithSales = await Promise.all(products.map(async (p) => {
             const orders = await Order.find({ 
                 "items.product": p._id,
                 orderStatus: { $nin: ["Cancelled", "Returned", "Return Rejected"] }
             });
             
             let salesCount = 0;
             orders.forEach(order => {
                  order.items.forEach(item => {
                       if (item.product.toString() === p._id.toString()) {
                            salesCount += item.quantity;
                       }
                  });
             });

             const pObj = p.toObject();
             pObj.salesCount = salesCount;
             return pObj;
        }));

        if (sort === "Most Popular") {
            productsWithSales.sort((a, b) => b.salesCount - a.salesCount);
            if (limit) {
                productsWithSales = productsWithSales.slice(0, Number(limit));
            }
        }
            
        res.json({ success: true, products: productsWithSales });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};