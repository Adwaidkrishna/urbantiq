import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";
import razorpay from "../config/razorpay.js";
import crypto from "crypto";

// ================= GET WALLET =================
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

// ================= WALLET TOP-UP: CREATE ORDER =================
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

// ================= WALLET TOP-UP: VERIFY & CREDIT =================
export const verifyWalletPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // Success - Credit Wallet
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.wallet = (user.wallet || 0) + Number(amount);
    await user.save();

    // Record transaction
    const transaction = new WalletTransaction({
      user: req.userId,
      amount: Number(amount),
      type: "CREDIT",
      description: "Wallet Recharge (Razorpay)",
      razorpayOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id
    });
    await transaction.save();

    return res.json({ success: true, balance: user.wallet });
  } catch (error) {
    console.error("Verify Wallet Payment Error:", error);
    return res.status(500).json({ message: "Payment verification failed" });
  }
};