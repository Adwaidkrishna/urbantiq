import Order from "../../models/Order.js";
import User from "../../models/User.js";
import WalletTransaction from "../../models/WalletTransaction.js";
import { rollbackOrderStock } from "./rollbackOrderStock.js";

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, itemId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!itemId) {
      return res.status(400).json({ message: "Item ID is required" });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in order" });
    }

    const previousStatus = item.itemStatus || "Pending";
    
    // Calculate proportional refund
    const itemGross = item.price * item.quantity;
    let itemRefundAmount = itemGross;
    if (order.discount > 0 && order.totalPrice > 0) {
      const itemDiscount = (itemGross / order.totalPrice) * order.discount;
      itemRefundAmount = Math.round(itemGross - itemDiscount);
    }

    // Transition paymentStatus to Paid when order is Delivered (e.g. for COD)
    // We will keep the global paymentStatus update here for simplicity if any item is delivered
    if (status === "Delivered" && order.paymentStatus !== "Paid") {
      order.paymentStatus = "Paid";
    }

    // Handle cancellation rollback for admin
    if (status === "Cancelled" && previousStatus !== "Cancelled") {
      await rollbackOrderStock(order, itemId);

      // Refund to Wallet if Paid
      if (order.paymentStatus === "Paid" && (item.refundedAmount || 0) === 0) {
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
    }

    // Handle Return refund
    if (status === "Returned" && previousStatus !== "Returned") {
      await rollbackOrderStock(order, itemId);
      
      // Always refund for returns if paid
      if (order.paymentStatus === "Paid" && (item.refundedAmount || 0) === 0) {
        const user = await User.findById(order.user);
        if (user) {
          user.wallet += itemRefundAmount;
          item.refundedAmount = itemRefundAmount;
          await user.save();

          const transaction = new WalletTransaction({
            user: user._id,
            amount: itemRefundAmount,
            type: "CREDIT",
            description: `Refund for Returned Item: ${itemId} in Order: ${order._id}`,
            orderId: order._id
          });
          await transaction.save();
        }
      }
    }

    item.itemStatus = status;

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

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    console.error("Admin Status Update Error:", error);
    res.status(500).json({ message: error.message || "Error updating order status" });
  }
};
