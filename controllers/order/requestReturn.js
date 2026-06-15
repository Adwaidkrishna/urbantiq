import Order from "../../models/Order.js";

export const requestReturn = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ success: false, message: "Reason is required for return request." });
    }

    const order = await Order.findById(req.params.id || req.params.orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.user.toString() !== req.userId) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    if (order.orderStatus !== "Delivered") {
      return res.status(400).json({ success: false, message: "Returns can only be requested for Delivered orders" });
    }

    if (order.returnRequest && order.returnRequest.requested) {
      return res.status(400).json({ success: false, message: "Return request already submitted for this order" });
    }

    // Return request must be within the return policy window (14 days)
    const deliveryDate = order.updatedAt;
    const diffTime = Date.now() - new Date(deliveryDate).getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays > 14) {
      return res.status(400).json({ success: false, message: "Return period expired" });
    }

    order.orderStatus = "Return Requested";
    order.returnRequest = {
      requested: true,
      reason: reason.trim(),
      status: "Pending",
      requestedAt: new Date()
    };

    await order.save();

    return res.json({
      success: true,
      message: "Return request submitted successfully."
    });
  } catch (error) {
    console.error("Return Request Error:", error);
    res.status(500).json({ success: false, message: error.message || "Error requesting return" });
  }
};
