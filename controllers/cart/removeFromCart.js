import Cart from "../../models/Cart.js";

export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.userId;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();

    res.json({ success: true, message: "Item removed", cart });
  } catch (error) {
    console.error("Cart Remove Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
