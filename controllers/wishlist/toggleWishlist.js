import Wishlist from "../../models/Wishlist.js";
import Product from "../../models/Product.js";

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
      wishlist.products.splice(index, 1);
    } else {
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
