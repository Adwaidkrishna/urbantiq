import Product from "../../models/Product.js";
import Order from "../../models/Order.js";
import { applyOffers } from "../offer/offerUtils.js";

export const getPublicProducts = async (req, res) => {
    try {
        await applyOffers();
        const { categories, maxPrice, search, sort, sizes, colors, newArrival, rating, limit, onSale, page } = req.query;
        let query = { status: true };

        if (onSale === "true") {
            query.offerPrice = { $gt: 0, $ne: null };
        }


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

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        let productsCount;
        let totalPages = 1;

        if (pageNum) {
            const lim = limitNum || 16;
            if (sort !== "Most Popular") {
                productsCount = await Product.countDocuments(query);
                totalPages = Math.ceil(productsCount / lim);
                dbQuery = dbQuery.skip((pageNum - 1) * lim).limit(lim);
            }
        } else if (limit && sort !== "Most Popular") {
            dbQuery = dbQuery.limit(Number(limit));
        }

        const products = await dbQuery;

        let productsWithSales = await Promise.all(products.map(async (p) => {
            const orders = await Order.find({
                "items.product": p._id
            });

            let salesCount = 0;
            orders.forEach(order => {
                order.items.forEach(item => {
                    if (
                        item.product.toString() === p._id.toString() &&
                        !["Cancelled", "Returned", "Return Rejected"].includes(item.itemStatus)
                    ) {
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
            if (pageNum) {
                const lim = limitNum || 16;
                productsCount = productsWithSales.length;
                totalPages = Math.ceil(productsCount / lim);
                productsWithSales = productsWithSales.slice((pageNum - 1) * lim, pageNum * lim);
            } else if (limit) {
                productsWithSales = productsWithSales.slice(0, Number(limit));
            }
        }

        res.json({
            success: true,
            products: productsWithSales,
            totalPages,
            currentPage: pageNum || 1,
            totalProducts: productsCount !== undefined ? productsCount : productsWithSales.length
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
