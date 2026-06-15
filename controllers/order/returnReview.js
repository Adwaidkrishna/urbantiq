import Order from "../../models/Order.js";
import User from "../../models/User.js";
import WalletTransaction from "../../models/WalletTransaction.js";
import { rollbackOrderStock } from "./rollbackOrderStock.js";

export const returnReview = async (req, res) => {
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

    if (!order.returnRequest || !order.returnRequest.requested) {
      return res.status(400).json({ success: false, message: "No return request exists for this order" });
    }

    if (order.returnRequest.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Return request has already been reviewed" });
    }

    order.returnRequest.status = decision;
    order.returnRequest.reviewedAt = new Date();
    order.returnRequest.adminComment = comment || "";

    if (decision === "Approved") {
      order.orderStatus = "Returned";

      // Rollback Inventory
      await rollbackOrderStock(order);

      // Refund to Wallet (All approved returns get refunded via wallet credit)
      if (order.paymentStatus !== "Refunded") {
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
              description: `Refund for Returned Order: ${order._id}`,
              orderId: order._id
            });
            await transaction.save();
          }
          order.paymentStatus = "Refunded";
        }
      }
    } else {
      order.orderStatus = "Return Rejected";
    }

    await order.save();

    return res.json({
      success: true,
      message: `Return request ${decision.toLowerCase()} successfully.`
    });
  } catch (error) {
    console.error("Return Review Error:", error);
    res.status(500).json({ success: false, message: error.message || "Error reviewing return request" });
  }
};
