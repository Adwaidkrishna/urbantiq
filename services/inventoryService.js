/**
 * services/inventoryService.js
 * ─────────────────────────────────────────────────────────
 * Handles all inventory-related business logic:
 *   - FIFO batch stock deduction
 *   - Master product stock update
 *   - Stock rollback on cancellation/return
 *   - Pre-flight stock validation
 * ─────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";
import Product from "../models/ProductModel.js";
import PurchaseItem from "../models/PurchaseItemModel.js";

// ─────────────────────────────────────────────────────────
// Validate stock availability (pre-flight check before order)
// ─────────────────────────────────────────────────────────
export async function validateStockAvailability(items) {
  for (const item of items) {
    const productId = item.product?._id || item.product;
    const variantId = item.variant?._id || item.variant;
    const sizeStr = item.size;
    const qty = Number(item.quantity);

    if (!productId || !variantId || !sizeStr) {
      throw new Error("Invalid product or variant data in cart");
    }

    const product = await Product.findById(productId);
    if (!product) throw new Error(`Product not found`);

    const variant = product.variants.find(
      (v) => v._id.toString() === variantId.toString()
    );
    const sizeObj = variant?.sizes.find((s) => s.size === sizeStr);

    if (!sizeObj || sizeObj.stock < qty) {
      throw new Error(
        `Out of stock: ${product.name} (${sizeStr}) only has ${sizeObj ? sizeObj.stock : 0} left.`
      );
    }

    // Check FIFO batch availability
    const batches = await PurchaseItem.find({
      status: "LINKED",
      allocations: {
        $elemMatch: {
          variantId: new mongoose.Types.ObjectId(variantId.toString()),
          size: sizeStr,
          remainingQuantity: { $gt: 0 },
        },
      },
    });

    const availableInBatches = batches.reduce((acc, batch) => {
      const alloc = batch.allocations.find(
        (a) =>
          a.variantId.toString() === variantId.toString() && a.size === sizeStr
      );
      return acc + (alloc ? alloc.remainingQuantity : 0);
    }, 0);

    if (availableInBatches < qty) {
      throw new Error(
        `Inventory sync issue: ${product.name} batches insufficient.`
      );
    }
  }
}

// ─────────────────────────────────────────────────────────
// Deduct stock from FIFO batches + update master product stock
// Called during order placement for each item
// ─────────────────────────────────────────────────────────
export async function deductFIFOStock(items) {
  const orderItems = [];

  for (const item of items) {
    const productId = item.product?._id || item.product;
    const variantId = item.variant?._id || item.variant;
    const sizeStr = item.size;
    const requestedQty = Number(item.quantity);

    if (!productId || !variantId || !sizeStr || requestedQty <= 0) {
      throw new Error("Invalid product variant or quantity data");
    }

    // Validate master stock
    const product = await Product.findById(productId);
    if (!product) throw new Error(`Product ${productId} not found`);

    const variant = product.variants.find(
      (v) => v._id.toString() === variantId.toString()
    );
    if (!variant) throw new Error(`Variant not found for product ${product.name}`);

    const sizeObj = variant.sizes.find((s) => s.size === sizeStr);
    if (!sizeObj || sizeObj.stock < requestedQty) {
      throw new Error(
        `Out of stock: ${product.name} (${sizeStr}) only has ${sizeObj ? sizeObj.stock : 0} left.`
      );
    }

    // Deduct from FIFO batches (oldest first)
    const batches = await PurchaseItem.find({
      status: "LINKED",
      allocations: {
        $elemMatch: {
          variantId: new mongoose.Types.ObjectId(variantId),
          size: sizeStr,
          remainingQuantity: { $gt: 0 },
        },
      },
    }).sort({ createdAt: 1 });

    let remaining = requestedQty;

    for (const batch of batches) {
      if (remaining <= 0) break;

      const alloc = batch.allocations.find(
        (a) =>
          a.variantId.toString() === variantId.toString() &&
          a.size === sizeStr &&
          a.remainingQuantity > 0
      );

      if (alloc) {
        const deductAmount = Math.min(alloc.remainingQuantity, remaining);

        const batchUpdate = await PurchaseItem.updateOne(
          {
            _id: batch._id,
            allocations: {
              $elemMatch: {
                _id: alloc._id,
                remainingQuantity: { $gte: deductAmount },
              },
            },
          },
          { $inc: { "allocations.$.remainingQuantity": -deductAmount } }
        );

        if (batchUpdate.modifiedCount === 0) {
          throw new Error(
            `Concurrency mismatch: Batch allocation failed for ${product.name}.`
          );
        }

        remaining -= deductAmount;
      }
    }

    if (remaining > 0) {
      throw new Error(
        `Out of Stock: Sync issue for ${product.name} (${sizeStr}). FIFO batches insufficient.`
      );
    }

    // Update master product stock
    const productUpdate = await Product.updateOne(
      { _id: productId },
      { $inc: { "variants.$[v].sizes.$[s].stock": -requestedQty } },
      {
        arrayFilters: [
          { "v._id": new mongoose.Types.ObjectId(variantId) },
          { "s.size": sizeStr },
        ],
      }
    );

    if (productUpdate.modifiedCount === 0) {
      throw new Error(`Failed to update master stock for ${product.name}.`);
    }

    orderItems.push({
      product: productId,
      variant: variantId,
      size: sizeStr,
      quantity: requestedQty,
      price: item.price,
    });
  }

  return orderItems;
}

// ─────────────────────────────────────────────────────────
// Rollback stock (on cancellation or return)
// Restores to master product + FIFO batches (newest first)
// ─────────────────────────────────────────────────────────
export async function rollbackOrderStock(order) {
  for (const item of order.items) {
    // 1. Restore master product stock
    await Product.updateOne(
      { _id: new mongoose.Types.ObjectId(item.product) },
      { $inc: { "variants.$[v].sizes.$[s].stock": item.quantity } },
      {
        arrayFilters: [
          { "v._id": new mongoose.Types.ObjectId(item.variant) },
          { "s.size": item.size },
        ],
      }
    );

    // 2. Restore FIFO batches (newest first — reverse of deduction)
    const batches = await PurchaseItem.find({
      status: "LINKED",
      "allocations.variantId": new mongoose.Types.ObjectId(item.variant),
      "allocations.size": item.size,
    }).sort({ createdAt: -1 });

    let qtyToRestore = item.quantity;

    for (const batch of batches) {
      if (qtyToRestore <= 0) break;

      const alloc = batch.allocations.find(
        (a) =>
          a.variantId.toString() === item.variant.toString() &&
          a.size === item.size
      );

      if (alloc && alloc.remainingQuantity < alloc.quantity) {
        const space = alloc.quantity - alloc.remainingQuantity;
        const addAmount = Math.min(space, qtyToRestore);

        await PurchaseItem.updateOne(
          { _id: batch._id, "allocations._id": alloc._id },
          { $inc: { "allocations.$.remainingQuantity": addAmount } }
        );

        qtyToRestore -= addAmount;
      }
    }
  }
}
