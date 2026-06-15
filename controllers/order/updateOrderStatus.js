import Order from "../../models/Order.js";
import User from "../../models/User.js";
import WalletTransaction from "../../models/WalletTransaction.js";
import { rollbackOrderStock } from "./rollbackOrderStock.js";

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const previousStatus = order.orderStatus;

    // Transition paymentStatus to Paid when order is Delivered (e.g. for COD)
    if (status === "Delivered" && previousStatus !== "Delivered") {
      order.paymentStatus = "Paid";
    }

    // Handle cancellation rollback for admin
    if (status === "Cancelled" && previousStatus !== "Cancelled") {
      await rollbackOrderStock(order);

      // Refund to Wallet if Paid
      if (order.paymentStatus === "Paid" && order.paymentStatus !== "Refunded") {
        const user = await User.findById(order.user);
        if (user) {
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
              description: `Refund for Cancelled Order (Admin): ${order._id}`,
              orderId: order._id
            });
            await transaction.save();
          }
          order.paymentStatus = "Refunded";
        }
      }
    }

    // Handle Return refund
    if (status === "Returned" && previousStatus !== "Returned") {
      await rollbackOrderStock(order);
      
      // Always refund for returns if paid
      if (order.paymentStatus === "Paid" && order.paymentStatus !== "Refunded") {
        const user = await User.findById(order.user);
        if (user) {
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
    }

    order.orderStatus = status;
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    console.error("Admin Status Update Error:", error);
    res.status(500).json({ message: error.message || "Error updating order status" });
  }
};
