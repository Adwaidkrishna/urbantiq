import PurchaseItem from "../../models/PurchaseItem.js";

export const getPurchaseItems = async (req, res) => {
  try {
    const items = await PurchaseItem.find({ purchaseId: req.params.id });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
