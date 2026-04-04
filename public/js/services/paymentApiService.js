/**
 * public/js/services/paymentApiService.js
 * ─────────────────────────────────────────────────────────
 * Centralizes ALL payment-related API calls.
 * Handles Razorpay order creation and verification.
 * ─────────────────────────────────────────────────────────
 */

const BASE = "/api/payment";
const WALLET_BASE = "/api/user-profile/wallet";

// Create a Razorpay order for checkout
export async function createPaymentOrder(amountInRupees) {
  const res = await fetch(`${BASE}/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountInRupees }),
  });
  if (!res.ok) throw new Error("Failed to create payment order");
  return res.json();
}

// Verify a completed Razorpay checkout payment
export async function verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const res = await fetch(`${BASE}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature }),
  });
  return res.json();
}

// Create a Razorpay order for wallet top-up
export async function createWalletTopupOrder(amountInRupees) {
  const res = await fetch(`${WALLET_BASE}/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountInRupees }),
  });
  if (!res.ok) throw new Error("Failed to create wallet top-up order");
  return res.json();
}

// Verify wallet top-up payment + credit balance
export async function verifyWalletTopup({ razorpay_order_id, razorpay_payment_id, razorpay_signature, amount }) {
  const res = await fetch(`${WALLET_BASE}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, amount }),
  });
  return res.json();
}
