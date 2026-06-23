import Order from "../../models/Order.js";

export const cancelOrder = async (req, res) => {
  try {
    const { reason, itemId } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ success: false, message: "Reason is required for cancellation." });
    }

    if (!itemId) {
      return res.status(400).json({ success: false, message: "Item ID is required for cancellation." });
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

    if (item.itemStatus === "Cancelled") {
      return res.status(400).json({ success: false, message: "Item is already cancelled" });
    }

    if (item.itemStatus === "Delivered") {
      return res.status(400).json({ success: false, message: "Delivered items cannot be cancelled" });
    }

    if (item.cancellationRequest && item.cancellationRequest.requested) {
      return res.status(400).json({ success: false, message: "Cancellation request already submitted for this item" });
    }

    // Update item status to Cancellation Requested and save details
    item.itemStatus = "Cancellation Requested";
    item.cancellationRequest = {
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
      message: "Cancellation request submitted successfully."
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    res.status(500).json({ success: false, message: error.message || "Error cancelling order" });
  }
};
