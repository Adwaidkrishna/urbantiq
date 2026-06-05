import Cart from "../../models/Cart.js";

export const getCart = async (req, res) => {
  try {
    const userId = req.userId;
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart) {
      return res.json({ success: true, items: [] });
    }

    res.json({ success: true, items: cart.items });
  } catch (error) {
    console.error("Cart Get Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
