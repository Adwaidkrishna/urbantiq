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

    const batch = await PurchaseItem.findById(id);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    if (batch.status === "LINKED") {
      throw new Error("Batch already linked");
    }

    const totalAllocated = allocations.reduce((sum, a) => sum + Number(a.quantity), 0);
    if (totalAllocated !== batch.quantity) {
      return res.status(400).json({ message: `Total allocated (${totalAllocated}) does not match batch quantity (${batch.quantity})` });
    }

    batch.allocations = allocations;
    batch.status = "LINKED";
    await batch.save();

    for (const alloc of allocations) {
      if (alloc.quantity > 0) {
        await Product.updateOne(
          { "variants.sizes._id": alloc.variantId },
          { $inc: { "variants.$[v].sizes.$[s].stock": alloc.quantity } },
          { 
            arrayFilters: [
              { "v._id": alloc.variantId },
              { "s._id": alloc.sizeId }
            ] 
          }
        );
      }
    }

    res.json({ message: "Batch linked successfully", batch });
  } catch (error) {
    console.error("linkBatch error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
