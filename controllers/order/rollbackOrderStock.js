import mongoose from "mongoose";
import Product from "../../models/Product.js";
import PurchaseItem from "../../models/PurchaseItem.js";

export async function rollbackOrderStock(order) {
  for (const item of order.items) {
    // 1. Update Master Product Stock
    await Product.updateOne(
      { _id: new mongoose.Types.ObjectId(item.product) },
      { $inc: { "variants.$[v].sizes.$[s].stock": item.quantity } },
      {
        arrayFilters: [
          { "v._id": new mongoose.Types.ObjectId(item.variant) },
          { "s.size": item.size }
        ]
      }
    );

    // 2. Rollback Batches (FIFO reversed)
    // Find batches that are missing stock (remaining < initial quantity)
    // We restore to the NEWEST batches first (reverse of placement deduction)
    const batches = await PurchaseItem.find({
      status: "LINKED",
      allocations: {
        $elemMatch: {
          variantId: new mongoose.Types.ObjectId(item.variant),
          size: item.size
        }
      }
    }).sort({ createdAt: -1 });

    let qtyToRestore = item.quantity;

    for (const batch of batches) {
      if (qtyToRestore <= 0) break;

      const alloc = batch.allocations.find(a =>
        a.variantId.toString() === item.variant.toString() && a.size === item.size
      );

      if (alloc && alloc.remainingQuantity < alloc.quantity) {
        const spaceInBatch = alloc.quantity - alloc.remainingQuantity;
        const addAmount = Math.min(spaceInBatch, qtyToRestore);

        await PurchaseItem.updateOne(
          { _id: batch._id, "allocations._id": alloc._id },
          { $inc: { "allocations.$.remainingQuantity": addAmount } }
        );

        qtyToRestore -= addAmount;
      }
    }
  }
}
