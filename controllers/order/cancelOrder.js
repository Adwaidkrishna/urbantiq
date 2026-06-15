import Order from "../../models/Order.js";

export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ success: false, message: "Reason is required for cancellation." });
    }

    const order = await Order.findById(req.params.id || req.params.orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.user.toString() !== req.userId) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({ success: false, message: "Order is already cancelled" });
    }

    if (order.orderStatus === "Delivered") {
      return res.status(400).json({ success: false, message: "Delivered orders cannot be cancelled" });
    }

    if (order.cancellationRequest && order.cancellationRequest.requested) {
      return res.status(400).json({ success: false, message: "Cancellation request already submitted for this order" });
    }

    // Update status to Cancellation Requested and save details
    order.orderStatus = "Cancellation Requested";
    order.cancellationRequest = {
      requested: true,
      reason: reason.trim(),
      status: "Pending",
      requestedAt: new Date()
    };

    await order.save();

    return res.json({
      success: true,
      message: "Cancellation request submitted successfully."
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    res.status(500).json({ success: false, message: error.message || "Error cancelling order" });
  }
};
