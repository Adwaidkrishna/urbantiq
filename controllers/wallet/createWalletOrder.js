import razorpay from "../../config/razorpay.js";

export const createWalletOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const options = {
      amount: amount * 100, // value in paise
      currency: "INR",
      receipt: `wallet_topup_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    return res.json({ success: true, order });
  } catch (error) {
    console.error("Create Wallet Order Error:", error);
    return res.status(500).json({ message: "Razorpay order creation failed" });
  }
};
