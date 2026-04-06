import Cart from "../models/Cart.js";
import Product from "../models/ProductModel.js";

// Add to Cart
export const addToCart = async (req, res) => {
  try {
    const { productId, variantId, size, quantity, override } = req.body;
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
    if (!cart) {
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

// Get Cart
export const getCart = async (req, res) => {
  try {
    const userId = req.userId;
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart) {
      return res.json({ success: true, items: [] });
    }

    // Secondary populate for category if needed, but keeping it simple for now
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

// Validate all items in cart before checkout
export const validateCartStock = async (req, res) => {
  try {
    const userId = req.userId;
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const problematicItems = [];

    for (const item of cart.items) {
      const product = item.product;
      const variant = product.variants.find(v => v._id.toString() === item.variant.toString());
      const sizeInfo = variant?.sizes.find(s => s.size === item.size);

      if (!sizeInfo || sizeInfo.stock < item.quantity) {
        problematicItems.push({
          itemId: item._id,
          productName: product.name,
          availableStock: sizeInfo?.stock || 0,
          requestedQty: item.quantity
        });
      }
    }

    if (problematicItems.length > 0) {
      return res.json({
        success: false,
        message: "Some items in your cart exceed available stock",
        problematicItems
      });
    }

    res.json({ success: true, message: "All items available" });
  } catch (error) {
    console.error("Stock Validation Error:", error);
    res.status(500).json({ success: false, message: "Server error during stock validation" });
  }
};
