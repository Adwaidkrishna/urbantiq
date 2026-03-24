import Purchase from "../models/PurchaseModel.js";
import PurchaseItem from "../models/PurchaseItemModel.js";

// ─── Counter for batch generation ─────────────────────────────────────────
// Simple in-process counter per server boot; for production use a DB counter.
let batchCounter = 1;
function generateBatchId() {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // 01–12
  const day   = String(now.getDate()).padStart(2, "0");       // 01–31
  const seq   = String(batchCounter++).padStart(3, "0");      // 001, 002 …
  return `B-${year}${month}${day}-${seq}`;
  // e.g. B-20260324-001
}

// ─── STEP 1: Create Purchase (parent) ─────────────────────────────────────
export const createPurchase = async (req, res) => {
  try {
    const { supplierId, invoiceNumber, purchaseDate } = req.body;

    if (!supplierId || !invoiceNumber || !purchaseDate) {
      return res
        .status(400)
        .json({ message: "supplierId, invoiceNumber and purchaseDate are required" });
    }

    const purchase = await Purchase.create({
      supplierId,
      invoiceNumber,
      purchaseDate,
    });

    res.status(201).json(purchase);
  } catch (error) {
    console.error("createPurchase error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ─── STEP 2: Add Item (child) ──────────────────────────────────────────────
export const createPurchaseItem = async (req, res) => {
  try {
    const { purchaseId, productName, quantity, costPrice, sellingPrice } = req.body;

    if (!purchaseId || !productName || !quantity || !costPrice || !sellingPrice) {
      return res
        .status(400)
        .json({ message: "purchaseId, productName, quantity, costPrice and sellingPrice are required" });
    }

    if (quantity <= 0 || costPrice <= 0) {
      return res
        .status(400)
        .json({ message: "quantity and costPrice must be greater than 0" });
    }

    const total = quantity * costPrice;
    const batchId = generateBatchId();

    const item = await PurchaseItem.create({
      purchaseId,
      productName,
      quantity,
      costPrice,
      sellingPrice,
      total,
      batchId,
    });

    // Recalculate grandTotal on the parent purchase
    const allItems = await PurchaseItem.find({ purchaseId });
    const grandTotal = allItems.reduce((sum, i) => sum + i.total, 0);
    await Purchase.findByIdAndUpdate(purchaseId, { grandTotal, status: "completed" });

    res.status(201).json(item);
  } catch (error) {
    console.error("createPurchaseItem error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ─── GET all purchase items (for the list view) ──────────────────────────────
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

export const getPurchaseItems = async (req, res) => {
  try {
    const items = await PurchaseItem.find({ purchaseId: req.params.id });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
