/**
 * services/walletService.js
 * ─────────────────────────────────────────────────────────
 * Handles all wallet business logic:
 *   - Debit wallet for order payment
 *   - Credit wallet for refunds / top-ups
 *   - Fetch wallet balance + transactions
 * ─────────────────────────────────────────────────────────
 */

import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";

// ─────────────────────────────────────────────────────────
// Debit wallet — used when placing a wallet-paid order
// ─────────────────────────────────────────────────────────
export async function processWalletDebit(userId, amount, orderId = null) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  if ((user.wallet || 0) < amount) {
    throw new Error(
      `Insufficient wallet balance. You need ₹${amount - user.wallet} more.`
    );
  }

  user.wallet -= amount;
  await user.save();

  const transaction = await WalletTransaction.create({
    user: userId,
    amount,
    type: "DEBIT",
    description: "Payment for Order",
    orderId,
  });

  return transaction;
}

// ─────────────────────────────────────────────────────────
// Credit wallet — used for refunds on cancel/return
//                 and for Razorpay top-up
// ─────────────────────────────────────────────────────────
export async function processWalletCredit(userId, amount, description, extras = {}) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  user.wallet = (user.wallet || 0) + Number(amount);
  await user.save();

  const transaction = await WalletTransaction.create({
    user: userId,
    amount: Number(amount),
    type: "CREDIT",
    description,
    ...extras, // orderId, razorpayOrderId, paymentId etc.
  });

  return { balance: user.wallet, transaction };
}

// ─────────────────────────────────────────────────────────
// Fetch wallet balance + transaction history for a user
// ─────────────────────────────────────────────────────────
export async function getWalletData(userId) {
  const user = await User.findById(userId).select("wallet");
  if (!user) throw new Error("User not found");

  const transactions = await WalletTransaction.find({ user: userId }).sort({
    createdAt: -1,
  });

  return {
    balance: user.wallet || 0,
    transactions,
  };
}
