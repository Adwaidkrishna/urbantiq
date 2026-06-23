import Order from "../../models/Order.js";

export const requestReturn = async (req, res) => {
  try {
    const { reason, itemId } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ success: false, message: "Reason is required for return request." });
    }

    if (!itemId) {
      return res.status(400).json({ success: false, message: "Item ID is required for return request." });
    }

    const order = await Order.findById(req.params.id || req.params.orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.user.toString() !== req.userId) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found in order" });
    }

    if (item.itemStatus !== "Delivered") {
      return res.status(400).json({ success: false, message: "Returns can only be requested for Delivered items" });
    }

    if (item.returnRequest && item.returnRequest.requested) {
      return res.status(400).json({ success: false, message: "Return request already submitted for this item" });
    }

    // Return request must be within the return policy window (14 days)
    const deliveryDate = order.updatedAt; // For simplicity, keep order's updatedAt or we could store item's deliveredAt. We'll use order's updatedAt as fallback
    const diffTime = Date.now() - new Date(deliveryDate).getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays > 14) {
      return res.status(400).json({ success: false, message: "Return period expired" });
    }

    item.itemStatus = "Return Requested";
    item.returnRequest = {
      requested: true,
      reason: reason.trim(),
      status: "Pending",
      requestedAt: new Date()
    };

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
      message: "Return request submitted successfully."
    });
  } catch (error) {
    console.error("Return Request Error:", error);
    res.status(500).json({ success: false, message: error.message || "Error requesting return" });
  }
};
