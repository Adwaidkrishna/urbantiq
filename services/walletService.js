import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";

export const walletService = {
  /**
   * Debits the user's wallet and creates a WalletTransaction record.
   */
  async debitWallet(userId, amount, session) {
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.wallet < amount) {
      throw new Error(`Insufficient wallet balance. You need ₹${amount - user.wallet} more.`);
    }

    // Atomic update to prevent race conditions during concurrent wallet payments
    const updateResult = await User.updateOne(
      { _id: userId, wallet: { $gte: amount } },
      { $inc: { wallet: -amount } },
      { session }
    );

    if (updateResult.modifiedCount === 0) {
       throw new Error(`Concurrency Error: Insufficient wallet balance for user ${userId}.`);
    }

    const transaction = new WalletTransaction({
      user: userId,
      amount: amount,
      type: "DEBIT",
      description: `Payment for Order`
    });
    
    await transaction.save({ session });
    return transaction;
  },

  /**
   * Links an unlinked wallet payment to the newly created order.
   */
  async linkOrderToTransaction(userId, orderId, session) {
    await WalletTransaction.findOneAndUpdate(
      { user: userId, description: "Payment for Order", orderId: { $exists: false } },
      { orderId: orderId },
      { sort: { createdAt: -1 }, session }
    );
  }
};
