import mongoose from "mongoose";
import PurchaseItem from "../models/PurchaseItemModel.js";
import Product from "../models/ProductModel.js";

// ─── GET only unlinked batches ─────────────────────────────────────────────
export const getUnlinkedBatches = async (req, res) => {
  try {
    const batches = await PurchaseItem.find({ status: "UNLINKED" }).sort({ createdAt: 1 });
    res.json(batches);
  } catch (error) {
    console.error("getUnlinkedBatches error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ─── LINK Batch to Product Variant ─────────────────────────────────────────
export const linkBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { allocations } = req.body;

    const batch = await PurchaseItem.findById(id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    if (batch.status === "LINKED") return res.status(400).json({ message: "Batch already linked" });

    // 1. Validation
    if (!allocations || allocations.length === 0) {
      return res.status(400).json({ message: "At least one variant must be selected" });
    }

    let totalAllocated = 0;
    for (const a of allocations) {
      if (Number(a.quantity) <= 0) {
        return res.status(400).json({ message: `Quantity for size ${a.size} must be greater than 0` });
      }
      totalAllocated += Number(a.quantity);
    }

    if (totalAllocated !== batch.quantity) {
      return res.status(400).json({ message: `Total allocated (${totalAllocated}) doesn't match batch total (${batch.quantity})` });
    }

    // 2. Perform Stock Updates & Setup Allocations
    batch.allocations = allocations.map(a => ({
      ...a,
      remainingQuantity: Number(a.quantity)
    }));

    for (const alloc of batch.allocations) {
      await Product.updateOne(
        { "variants._id": new mongoose.Types.ObjectId(alloc.variantId) },
        { $inc: { "variants.$[v].sizes.$[s].stock": alloc.quantity } },
        { 
          arrayFilters: [
            { "v._id": new mongoose.Types.ObjectId(alloc.variantId) },
            { "s.size": alloc.size }
          ] 
        }
      );
    }

    // 3. Mark Batch as LINKED and Save
    batch.status = "LINKED";
    await batch.save();

    res.json({ 
      message: "Batch implemented successfully and stock updated.", 
      batch 
    });
  } catch (error) {
    console.error("linkBatch error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
