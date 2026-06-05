import User from "../../models/User.js";
import WalletTransaction from "../../models/WalletTransaction.js";

export const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("wallet");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const transactions = await WalletTransaction.find({ user: req.userId })
      .sort({ createdAt: -1 });

    return res.json({
      balance: user.wallet || 0,
      transactions
    });
  } catch (error) {
    console.error("Get Wallet Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
