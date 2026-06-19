import mongoose from "mongoose";
import Product from "../models/Product.js";
import PurchaseItem from "../models/PurchaseItem.js";

export const inventoryService = {
  /**
   * Validates if there is enough stock for the requested items.
   * Does NOT deduct stock.
   */
  async validateStock(items) {
    if (!items || items.length === 0) {
      throw new Error("No items to validate");
    }

    for (const item of items) {
      const productId = item.product?._id || item.product;
      const variantId = item.variant?._id || item.variant;
      const sizeStr = item.size;
      const qty = Number(item.quantity);

      if (!productId || !variantId || !sizeStr || qty <= 0) {
        throw new Error("Invalid product variant or quantity data");
      }

      const product = await Product.findById(productId);
      if (!product) throw new Error(`Product ${productId} not found`);

      const variant = product.variants.find(v => v._id.toString() === variantId.toString());
      if (!variant) throw new Error(`Variant not found for product ${product.name}`);

      const sizeObj = variant.sizes.find(s => s.size === sizeStr);
      if (!sizeObj || sizeObj.stock < qty) {
        throw new Error(`Out of stock: ${product.name} (${sizeStr}) only has ${sizeObj ? sizeObj.stock : 0} left.`);
      }

      // Check FIFO batch availability without modifying
      const batches = await PurchaseItem.find({
        status: "LINKED",
        allocations: {
          $elemMatch: {
            variantId: new mongoose.Types.ObjectId(variantId),
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
        throw new Error(`Out of Stock: Sync issue for ${product.name} (${sizeStr}). FIFO batches insufficient.`);
      }
    }
    return true;
  },

  /**
   * Deducts stock from FIFO batches and Product Variants using a session.
   * Ensures atomic updates and throws error on concurrency issues.
   */
  async deductStock(items, session) {
    for (const item of items) {
      const requestedQty = Number(item.quantity);
      const productId = item.product?._id || item.product;
      const variantId = item.variant?._id || item.variant;
      const sizeStr = item.size;

      // 1. Deduct from FIFO batches
      const batches = await PurchaseItem.find({
        status: "LINKED",
        allocations: {
          $elemMatch: {
            variantId: new mongoose.Types.ObjectId(variantId),
            size: sizeStr,
            remainingQuantity: { $gt: 0 }
          }
        }
      }).session(session).sort({ createdAt: 1 });

      let remainingQtyToDeduct = requestedQty;

      for (const batch of batches) {
        if (remainingQtyToDeduct <= 0) break;

        const alloc = batch.allocations.find(a =>
          a.variantId.toString() === variantId.toString() &&
          a.size === sizeStr &&
          a.remainingQuantity > 0
        );

        if (alloc) {
          const deductAmount = Math.min(alloc.remainingQuantity, remainingQtyToDeduct);

          const batchUpdate = await PurchaseItem.updateOne(
            {
              _id: batch._id,
              allocations: { 
                $elemMatch: { 
                  _id: alloc._id, 
                  remainingQuantity: { $gte: deductAmount } 
                } 
              }
            },
            { $inc: { "allocations.$.remainingQuantity": -deductAmount } },
            { session }
          );

          if (batchUpdate.modifiedCount > 0) {
            remainingQtyToDeduct -= deductAmount;
          }
        }
      }

      if (remainingQtyToDeduct > 0) {
        throw new Error(`Concurrency Error: Insufficient stock in batches for product ${productId}.`);
      }

      // 2. Deduct from Product Variants
      const productUpdate = await Product.updateOne(
        { _id: productId },
        { $inc: { "variants.$[v].sizes.$[s].stock": -requestedQty } },
        {
          arrayFilters: [
            { "v._id": new mongoose.Types.ObjectId(variantId) },
            { "s.size": sizeStr, "s.stock": { $gte: requestedQty } }
          ],
          session
        }
      );

      if (productUpdate.modifiedCount === 0) {
         throw new Error(`Concurrency Error: Insufficient variant stock for product ${productId}.`);
      }
      
      // To strictly ensure stock doesn't drop below 0 due to concurrency if we don't check it in query,
      // it's safer to check it within arrayFilters, but if stock falls below zero, let's catch it.
      // Wait, Mongoose/MongoDB will allow stock to drop below 0 if not guarded.
      // Let's refine the update to ensure it only updates if stock >= requestedQty.
    }
  },

  /**
   * Reverses stock deduction (for rollback controllers, cancellations)
   */
  async rollbackStock(items, session = null) {
    const options = session ? { session } : {};

    for (const item of items) {
      const productId = item.product?._id || item.product;
      const variantId = item.variant?._id || item.variant;
      const sizeStr = item.size;
      const quantity = Number(item.quantity);

      // 1. Update Master Product Stock
      await Product.updateOne(
        { _id: new mongoose.Types.ObjectId(productId) },
        { $inc: { "variants.$[v].sizes.$[s].stock": quantity } },
        {
          arrayFilters: [
            { "v._id": new mongoose.Types.ObjectId(variantId) },
            { "s.size": sizeStr }
          ],
          ...options
        }
      );

      // 2. Rollback Batches (FIFO reversed)
      const batches = await PurchaseItem.find({
        status: "LINKED",
        allocations: {
          $elemMatch: {
            variantId: new mongoose.Types.ObjectId(variantId),
            size: sizeStr
          }
        }
      }).session(options.session || null).sort({ createdAt: -1 });

      let qtyToRestore = quantity;

      for (const batch of batches) {
        if (qtyToRestore <= 0) break;

        const alloc = batch.allocations.find(a =>
          a.variantId.toString() === variantId.toString() && a.size === sizeStr
        );

        if (alloc && alloc.remainingQuantity < alloc.quantity) {
          const spaceInBatch = alloc.quantity - alloc.remainingQuantity;
          const addAmount = Math.min(spaceInBatch, qtyToRestore);

          await PurchaseItem.updateOne(
            { _id: batch._id, "allocations._id": alloc._id },
            { $inc: { "allocations.$.remainingQuantity": addAmount } },
            options
          );

          qtyToRestore -= addAmount;
        }
      }
    }
  }
};
