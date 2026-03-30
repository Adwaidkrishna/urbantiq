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

    if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({ message: "allocations array is required" });
    }

    // Double check size field
    for (const a of allocations) {
      if (!a.size) {
        return res.status(400).json({ message: `Size label is missing for variant ${a.variantId}` });
      }
    }

    const batch = await PurchaseItem.findById(id);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    if (batch.status === "LINKED") {
      throw new Error("Batch already linked");
    }

    // Update allocations with their initial remainingQuantity
    batch.allocations = allocations.map(a => ({
      ...a,
      remainingQuantity: Number(a.quantity)
    }));
    for (const alloc of batch.allocations) {
      if (alloc.quantity > 0) {
        console.log(`Linking Batch: Incrementing product stock for variant ${alloc.variantId} size ${alloc.size} qty ${alloc.quantity}`);
        const result = await Product.updateOne(
          { "variants._id": new mongoose.Types.ObjectId(alloc.variantId) },
          { $inc: { "variants.$[v].sizes.$[s].stock": alloc.quantity } },
          { 
            arrayFilters: [
              { "v._id": new mongoose.Types.ObjectId(alloc.variantId) },
              { "s.size": alloc.size }
            ] 
          }
        );
        console.log(`Update result for size ${alloc.size}: Matched ${result.matchedCount}, Modified ${result.modifiedCount}`);
      }
    }

    // ONLY SAVE AS LINKED if everything else succeeds!
    batch.status = "LINKED";
    await batch.save();

    res.json({ message: "Batch linked successfully", batch });
  } catch (error) {
    console.error("linkBatch error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
