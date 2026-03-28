import Wishlist from "../models/Wishlist.js";
import Product from "../models/ProductModel.js";

// Toggle Wishlist item
export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.userId;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
    }

    const index = wishlist.products.indexOf(productId);
    let added = false;

    if (index > -1) {
      // Remove if exists
      wishlist.products.splice(index, 1);
    } else {
      // Add if doesn't exist
      wishlist.products.push(productId);
      added = true;
    }

    await wishlist.save();
    res.json({ success: true, message: added ? "Product added to wishlist" : "Product removed", added });
  } catch (error) {
    console.error("Wishlist Toggle Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Wishlist
export const getWishlist = async (req, res) => {
  try {
    const userId = req.userId;
    const wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: "products",
      populate: { path: "category", select: "name" }
    });

    if (!wishlist) {
      return res.json({ success: true, products: [] });
    }

    res.json({ success: true, products: wishlist.products });
  } catch (error) {
    console.error("Wishlist Get Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
