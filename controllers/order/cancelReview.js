import Order from "../../models/Order.js";
import User from "../../models/User.js";
import WalletTransaction from "../../models/WalletTransaction.js";
import { rollbackOrderStock } from "./rollbackOrderStock.js";

export const cancelReview = async (req, res) => {
  try {
    const { decision, comment, itemId } = req.body;
    const orderId = req.params.orderId || req.params.id;

    if (!["Approved", "Rejected"].includes(decision)) {
      return res.status(400).json({ success: false, message: "Invalid decision. Must be Approved or Rejected." });
    }

    if (!itemId) {
      return res.status(400).json({ success: false, message: "Item ID is required" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found in order" });
    }

    if (!item.cancellationRequest || !item.cancellationRequest.requested) {
      return res.status(400).json({ success: false, message: "No cancellation request exists for this item" });
    }

    if (item.cancellationRequest.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Cancellation request has already been reviewed" });
    }

    item.cancellationRequest.status = decision;
    item.cancellationRequest.reviewedAt = new Date();
    item.cancellationRequest.adminComment = comment || "";

    // Calculate proportional refund
    const itemGross = item.price * item.quantity;
    let itemRefundAmount = itemGross;
    if (order.discount > 0 && order.totalPrice > 0) {
      const itemDiscount = (itemGross / order.totalPrice) * order.discount;
      itemRefundAmount = Math.round(itemGross - itemDiscount);
    }

    if (decision === "Approved") {
      item.itemStatus = "Cancelled";

      // Rollback Inventory
      await rollbackOrderStock(order, itemId);

      // Refund to Wallet if Paid or Prepaid (Online/Wallet)
      const isPrepaid = ["Online", "Wallet"].includes(order.paymentMethod);
      if ((order.paymentStatus === "Paid" || isPrepaid) && (item.refundedAmount || 0) === 0) {
        const user = await User.findById(order.user);
        if (user) {
          user.wallet += itemRefundAmount;
          item.refundedAmount = itemRefundAmount;
          await user.save();

          const transaction = new WalletTransaction({
            user: user._id,
            amount: itemRefundAmount,
            type: "CREDIT",
            description: `Refund for Cancelled Item: ${itemId} in Order: ${order._id}`,
            orderId: order._id
          });
          await transaction.save();
        }
      }
    } else {
      // If rejected, return status to a processing state (Confirmed)
      item.itemStatus = "Confirmed";
    }

    if (order.items && order.items.length > 0) {
      const statuses = order.items.map(i => i.itemStatus || "Pending");
      const uniqueStatuses = [...new Set(statuses)];
      if (uniqueStatuses.length === 1) {
        order.orderStatus = uniqueStatuses[0];
      } else {
        const allTerminal = statuses.every(s => ["Delivered", "Cancelled", "Returned", "Return Rejected"].includes(s));
        const hasDelivered = statuses.includes("Delivered");
        if (allTerminal && hasDelivered) {
          order.orderStatus = "Partially Completed";
        } else {
          order.orderStatus = "Mixed";
        }
      }
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
