import Order from "../../models/Order.js";
import User from "../../models/User.js";
import WalletTransaction from "../../models/WalletTransaction.js";
import { rollbackOrderStock } from "./rollbackOrderStock.js";

export const cancelReview = async (req, res) => {
  try {
    const { decision, comment } = req.body;
    const orderId = req.params.orderId || req.params.id;

    if (!["Approved", "Rejected"].includes(decision)) {
      return res.status(400).json({ success: false, message: "Invalid decision. Must be Approved or Rejected." });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.cancellationRequest || !order.cancellationRequest.requested) {
      return res.status(400).json({ success: false, message: "No cancellation request exists for this order" });
    }

    if (order.cancellationRequest.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Cancellation request has already been reviewed" });
    }

    order.cancellationRequest.status = decision;
    order.cancellationRequest.reviewedAt = new Date();
    order.cancellationRequest.adminComment = comment || "";

    if (decision === "Approved") {
      order.orderStatus = "Cancelled";

      // Rollback Inventory
      await rollbackOrderStock(order);

      // Refund to Wallet if Paid or Prepaid (Online/Wallet)
      const isPrepaid = ["Online", "Wallet"].includes(order.paymentMethod);
      if ((order.paymentStatus === "Paid" || isPrepaid) && order.paymentStatus !== "Refunded") {
        const user = await User.findById(order.user);
        if (user) {
          // Check for duplicate refund
          const existingTx = await WalletTransaction.findOne({
            orderId: order._id,
            type: "CREDIT"
          });
          
          if (!existingTx) {
            user.wallet += order.finalAmount;
            await user.save();

            const transaction = new WalletTransaction({
              user: user._id,
              amount: order.finalAmount,
              type: "CREDIT",
              description: `Refund for Cancelled Order: ${order._id}`,
              orderId: order._id
            });
            await transaction.save();
          }
          order.paymentStatus = "Refunded";
        }
      }
    } else {
      // If rejected, return status to a processing state (Confirmed)
      order.orderStatus = "Confirmed";
    }

    await order.save();

    return res.json({
      success: true,
      message: `Cancellation request ${decision.toLowerCase()} successfully.`
    });
  } catch (error) {
    console.error("Cancel Review Error:", error);
    res.status(500).json({ success: false, message: error.message || "Error reviewing cancellation request" });
  }
};
