import Purchase from "../../models/Purchase.js";
import PurchaseItem from "../../models/PurchaseItem.js";

let batchCounter = 1;
function generateBatchId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const seq = String(batchCounter++).padStart(3, "0");
  return `B-${year}${month}${day}-${seq}`;
}

export const createPurchaseItem = async (req, res) => {
  try {
    const { purchaseId, productName, quantity, costPrice, sellingPrice } = req.body;

    if (!purchaseId || !productName || !quantity || !costPrice || !sellingPrice) {
      return res.status(400).json({ message: "purchaseId, productName, quantity, costPrice and sellingPrice are required" });
    }

    if (quantity <= 0 || costPrice <= 0) {
      return res.status(400).json({ message: "quantity and costPrice must be greater than 0" });
    }

    const total = quantity * costPrice;
    const batchId = generateBatchId();

    const item = await PurchaseItem.create({ purchaseId, productName, quantity, costPrice, sellingPrice, total, batchId });

    const allItems = await PurchaseItem.find({ purchaseId });
    const grandTotal = allItems.reduce((sum, i) => sum + i.total, 0);
    await Purchase.findByIdAndUpdate(purchaseId, { grandTotal, status: "completed" });

    res.status(201).json(item);
  } catch (error) {
    console.error("createPurchaseItem error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
