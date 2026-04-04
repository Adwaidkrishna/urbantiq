/**
 * controllers/walletController.js
 * ─────────────────────────────────────────────────────────
 * Thin controller — delegates to walletService + paymentService.
 * ─────────────────────────────────────────────────────────
 */

import { getWalletData, processWalletCredit } from "../services/walletService.js";
import { createRazorpayOrder, verifyRazorpaySignature } from "../services/paymentService.js";

// @desc    Get wallet balance + transaction history
// @route   GET /api/user-profile/wallet
// @access  Private
export const getWallet = async (req, res, next) => {
  try {
    const data = await getWalletData(req.userId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a Razorpay order for wallet top-up
// @route   POST /api/user-profile/wallet/create-order
// @access  Private
export const createWalletOrder = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    const order = await createRazorpayOrder(amount, "wallet_topup");
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay payment + credit wallet
// @route   POST /api/user-profile/wallet/verify
// @access  Private
export const verifyWalletPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
    } = req.body;

    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    const { balance } = await processWalletCredit(
      req.userId,
      amount,
      "Wallet Recharge (Razorpay)",
      {
        razorpayOrderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      }
    );

    res.json({ success: true, balance });
  } catch (error) {
    next(error);
  }
};