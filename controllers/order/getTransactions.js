import Order from "../../models/Order.js";

export const getTransactions = async (req, res) => {
  try {
    const transactions = await Order.find({})
      .populate("user", "name email")
      .select("transactionId _id paymentMethod finalAmount createdAt paymentStatus orderStatus")
      .sort("-createdAt");
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching transactions" });
  }
};
