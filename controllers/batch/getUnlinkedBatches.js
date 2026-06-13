import PurchaseItem from "../../models/PurchaseItem.js";

export const getUnlinkedBatches = async (req, res) => {
  try {
    const batches = await PurchaseItem.find({ status: "UNLINKED" }).sort({ createdAt: 1 });
    res.json(batches);
  } catch (error) {
    console.error("getUnlinkedBatches error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
