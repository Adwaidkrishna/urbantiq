import Purchase from "../../models/Purchase.js";

let batchCounter = 1;
function generateBatchId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const seq = String(batchCounter++).padStart(3, "0");
  return `B-${year}${month}${day}-${seq}`;
}

export const createPurchase = async (req, res) => {
  try {
    const { supplierId, invoiceNumber, purchaseDate } = req.body;

    if (!supplierId || !invoiceNumber || !purchaseDate) {
      return res.status(400).json({ message: "supplierId, invoiceNumber and purchaseDate are required" });
    }

    const purchase = await Purchase.create({ supplierId, invoiceNumber, purchaseDate });
    res.status(201).json(purchase);
  } catch (error) {
    console.error("createPurchase error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
