import PurchaseItem from "../../models/PurchaseItem.js";

export const getPurchases = async (req, res) => {
  try {
    const items = await PurchaseItem.find()
      .populate({
        path: "purchaseId",
        select: "invoiceNumber purchaseDate status",
        populate: { path: "supplierId", select: "name companyName" }
      })
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error("getPurchases error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
