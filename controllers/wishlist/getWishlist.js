import Wishlist from "../../models/Wishlist.js";

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
