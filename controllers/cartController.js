import Cart from "../models/Cart.js";
import Product from "../models/ProductModel.js";

// Add to Cart
export const addToCart = async (req, res) => {
  try {
    const { productId, variantId, size, quantity } = req.body;
    const userId = req.userId;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Find or create cart for user
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item already exists in cart with same variant and size
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.variant.toString() === variantId &&
        item.size === size
    );

    if (itemIndex > -1) {
      // Update quantity if it exists
      cart.items[itemIndex].quantity += parseInt(quantity);
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        variant: variantId,
        size: size,
        quantity: parseInt(quantity)
      });
    }

    await cart.save();
    res.json({ success: true, message: "Item added to cart", cart });
  } catch (error) {
    console.error("Cart Add Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Cart
export const getCart = async (req, res) => {
  try {
    const userId = req.userId;
    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      populate: { path: "category", select: "name" }
    });

    if (!cart) {
      return res.json({ success: true, items: [] });
    }

    res.json({ success: true, items: cart.items });
  } catch (error) {
    console.error("Cart Get Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update Cart Item Quantity
export const updateCartQuantity = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const userId = req.userId;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.items.find(item => item._id.toString() === itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found in cart" });

    item.quantity = parseInt(quantity);
    await cart.save();

    res.json({ success: true, message: "Quantity updated", cart });
  } catch (error) {
    console.error("Cart Update Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Remove Item from Cart
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
