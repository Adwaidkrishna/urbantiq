import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";

export const updateCartQuantity = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const userId = req.userId;
    const newQty = parseInt(quantity, 10);

    if (isNaN(newQty) || newQty < 1) {
      return res.status(400).json({ success: false, message: "Invalid quantity" });
    }

    if (newQty > 10) {
      return res.status(400).json({ success: false, message: "Maximum limit of 10 items per product reached" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.items.find(item => item._id.toString() === itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found in cart" });

    // Stock check
    const product = await Product.findById(item.product);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const variant = product.variants.find(v => v._id.toString() === item.variant.toString());
    const sizeInfo = variant?.sizes.find(s => s.size === item.size);

    if (!sizeInfo || newQty > sizeInfo.stock) {
      return res.status(400).json({ success: false, message: `Only ${sizeInfo?.stock || 0} items left in stock` });
    }

    item.quantity = newQty;
    await cart.save();

    res.json({ success: true, message: "Quantity updated", cart });
  } catch (error) {
    console.error("Cart Update Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
