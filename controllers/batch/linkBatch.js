import mongoose from "mongoose";
import PurchaseItem from "../../models/PurchaseItem.js";
import Product from "../../models/Product.js";

export const linkBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { allocations } = req.body;

    const batch = await PurchaseItem.findById(id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });
    if (batch.status === "LINKED") return res.status(400).json({ message: "Batch already linked" });

    if (!allocations || allocations.length === 0) {
      return res.status(400).json({ message: "At least one variant must be selected" });
    }

    let totalAllocated = 0;
    for (const a of allocations) {
      if (Number(a.quantity) <= 0) {
        return res.status(400).json({ message: `Quantity for size ${a.size} must be greater than 0` });
      }
      totalAllocated += Number(a.quantity);
    }//checking if total allocated quantity matches batch quantity

    if (totalAllocated !== batch.quantity) {
      return res.status(400).json({ message: `Total allocated (${totalAllocated}) doesn't match batch total (${batch.quantity})` });
    }

    batch.allocations = allocations.map(a => ({
      ...a,
      remainingQuantity: Number(a.quantity)
    }));//selecting the correct varient

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
    }//updating the stock of the product variant

    batch.status = "LINKED";
    await batch.save();

    res.json({ message: "Batch implemented successfully and stock updated.", batch });
  } catch (error) {
    console.error("linkBatch error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
