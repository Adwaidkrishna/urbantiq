import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";

export const addToCart = async (req, res) => {
  try {
    const { productId, variantId, size, quantity, override, clearCart } = req.body;
    const userId = req.userId;
    const qty = parseInt(quantity, 10);

    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: "Invalid quantity" });
    }

    // Limit check (e.g. max 10 per item)
    if (qty > 10) {
      return res.status(400).json({ success: false, message: "Maximum limit of 10 items per product is allowed" });
    }

    // Check if product exists and check stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Find the variant and size to check stock
    const variantIdStr = variantId ? variantId.toString() : "";
    const variant = product.variants.find(v => v._id.toString() === variantIdStr);
    if (!variant) {
      console.error(`Variant mismatch: ${variantIdStr} not in [${product.variants.map(v => v._id.toString()).join(',')}]`);
      return res.status(404).json({ success: false, message: `Selected variant (ID: ${variantIdStr}) not found for this product.` });
    }

    const sizeInfo = variant.sizes.find(s => s.size.toString().trim() === size.toString().trim());
    if (!sizeInfo) {
      console.error(`Size mismatch: "${size}" not in [${variant.sizes.map(s => s.size).join(',')}]`);
      return res.status(404).json({ success: false, message: `Selected size "${size}" not available for this variant.` });
    }

    if (sizeInfo.stock <= 0) {
      return res.status(400).json({ success: false, message: "This item is out of stock" });
    }

    // Find or create cart for user
    let cart = await Cart.findOne({ user: userId });
    
    // If clearCart is true, wipe the cart items before adding the new one (Order Now flow)
    if (clearCart === true || clearCart === 'true') {
      if (cart) {
        cart.items = [];
      } else {
        cart = new Cart({ user: userId, items: [] });
      }
    } else if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item already exists in cart with same variant and size
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.variant.toString() === variantIdStr &&
        item.size === size
    );

    let finalQty = qty;
    let existingQty = 0;
    if (itemIndex > -1) {
      existingQty = cart.items[itemIndex].quantity;
      const shouldOverride = override === true || override === 'true';
      if (shouldOverride) {
        finalQty = qty;
      } else {
        finalQty = existingQty + qty;
      }
    }

    // Re-check total quantity against stock and limits
    if (finalQty > sizeInfo.stock) {
      if (existingQty > 0) {
        return res.status(400).json({
          success: false,
          message: `You already have ${existingQty} in your cart. Only ${sizeInfo.stock} items are available in total.`
        });
      }
      return res.status(400).json({ success: false, message: `Only ${sizeInfo.stock} items left in stock` });
    }
    if (finalQty > 10) {
      return res.status(400).json({ success: false, message: "Maximum limit of 10 items per product reached" });
    }


    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = finalQty;
    } else {
      cart.items.push({
        product: productId,
        variant: variantIdStr,
        size: size,
        quantity: finalQty
      });
    }

    await cart.save();
    res.json({ success: true, message: "Item added to cart", cart });
  } catch (error) {
    console.error("Cart Add Error:", error);
    res.status(500).json({ success: false, message: "Server error during cart operation" });
  }
};
