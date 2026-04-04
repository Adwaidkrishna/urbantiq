/**
 * services/paymentService.js
 * ─────────────────────────────────────────────────────────
 * Handles all Razorpay payment business logic:
 *   - Create Razorpay order
 *   - Verify payment signature (HMAC)
 * ─────────────────────────────────────────────────────────
 */

import Razorpay from "razorpay";
import crypto from "crypto";

// Lazily initialized Razorpay instance (reads from env at call time)
let _razorpay;
function getRazorpay() {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

// ─────────────────────────────────────────────────────────
// Create a Razorpay order
// receiptPrefix: 'order' | 'wallet_topup' — distinguishes contexts
// ─────────────────────────────────────────────────────────
export async function createRazorpayOrder(amountInRupees, receiptPrefix = "order") {
  const options = {
    amount: Math.round(amountInRupees * 100), // paise
    currency: "INR",
    receipt: `${receiptPrefix}_${Date.now()}`,
  };
  return await getRazorpay().orders.create(options);
}

// ─────────────────────────────────────────────────────────
// Verify Razorpay webhook signature
// Returns true if valid, false if tampered
// ─────────────────────────────────────────────────────────
export function verifyRazorpaySignature(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}
