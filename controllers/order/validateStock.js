import mongoose from "mongoose";
import Product from "../../models/Product.js";
import PurchaseItem from "../../models/PurchaseItem.js";

export const validateStock = async (req, res) => {
  try {
    if (!req.body) {
        return res.status(500).json({ message: "Request body is missing on server" });
    }
    const { items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: "No items to validate" });

    for (const item of items) {
      const productId = item.product?._id || item.product;
      const variantId = item.variant?._id || item.variant;
      const sizeStr = item.size;
      const qty = Number(item.quantity);

      if (!productId || !variantId || !sizeStr) {
          return res.status(400).json({ message: "Invalid product or variant data in cart" });
      }

      const product = await Product.findById(productId);
      if (!product) return res.status(400).json({ message: `Product not found` });

      const variant = product.variants.find(v => v._id.toString() === variantId.toString());
      const sizeObj = variant?.sizes.find(s => s.size === sizeStr);

      if (!sizeObj || sizeObj.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Out of stock: ${product.name} (${sizeStr}) only has ${sizeObj ? sizeObj.stock : 0} left.`
        });
      }

      // Check Batch (FIFO) availability
      const batches = await PurchaseItem.find({
        status: "LINKED",
        allocations: {
          $elemMatch: {
            variantId: new mongoose.Types.ObjectId(variantId.toString()),
            size: sizeStr,
            remainingQuantity: { $gt: 0 }
          }
        }
      });

      const availableInBatches = batches.reduce((acc, batch) => {
        const alloc = batch.allocations.find(a => a.variantId.toString() === variantId.toString() && a.size === sizeStr);
        return acc + (alloc ? alloc.remainingQuantity : 0);
      }, 0);

      if (availableInBatches < qty) {
        return res.status(400).json({
          success: false,
          message: `Inventory sync issue: ${product.name} batches insufficient.`
        });
      }
    }

    res.json({ success: true, message: "Stock validated" });
  } catch (error) {
    console.error("Validate Stock Error Stack:", error.stack);
    res.status(500).json({ message: `Internal validation error: ${error.message}` });
  }
};
