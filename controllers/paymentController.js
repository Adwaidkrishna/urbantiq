/**
 * controllers/paymentController.js
 * ─────────────────────────────────────────────────────────
 * Thin controller — delegates to paymentService.
 * ─────────────────────────────────────────────────────────
 */

import { createRazorpayOrder, verifyRazorpaySignature } from "../services/paymentService.js";

// @desc    Create a Razorpay order for checkout
// @route   POST /api/payment/create-order
// @access  Private
export const createPaymentOrder = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const order = await createRazorpayOrder(amount, "order");
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/payment/verify
// @access  Private
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    res.status(200).json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    next(error);
  }
};
