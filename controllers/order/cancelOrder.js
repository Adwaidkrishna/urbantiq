import Order from "../../models/Order.js";
import User from "../../models/User.js";
import WalletTransaction from "../../models/WalletTransaction.js";
import { rollbackOrderStock } from "./rollbackOrderStock.js";

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({ message: "Order is already cancelled" });
    }

    if (order.orderStatus === "Delivered" || order.orderStatus === "Shipped") {
      return res.status(400).json({ message: "Order cannot be cancelled at this stage" });
    }

    // Rollback Inventory
    await rollbackOrderStock(order);

    // Refund to Wallet if Paid
    if (order.paymentStatus === "Paid") {
      const user = await User.findById(req.userId);
      if (user) {
        user.wallet += order.finalAmount;
        await user.save();

        const transaction = new WalletTransaction({
          user: req.userId,
          amount: order.finalAmount,
          type: "CREDIT",
          description: `Refund for Cancelled Order: ${order._id}`,
          orderId: order._id
        });
        await transaction.save();
      }
    }

    // Update status
    order.orderStatus = "Cancelled";
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    console.error("Cancel Order Error:", error);
    res.status(500).json({ message: error.message || "Error cancelling order" });
  }
};
