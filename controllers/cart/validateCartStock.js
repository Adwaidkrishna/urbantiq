import Cart from "../../models/Cart.js";

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
