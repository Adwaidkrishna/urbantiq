import Order from "../../models/Order.js";

export const requestReturn = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (order.orderStatus !== "Delivered") {
      return res.status(400).json({ message: "Returns can only be requested for Delivered orders" });
    }

    order.orderStatus = "Return Requested";
    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: "Return request submitted successfully",
      status: updatedOrder.orderStatus
    });
  } catch (error) {
    console.error("Return Request Error:", error);
    res.status(500).json({ message: error.message || "Error requesting return" });
  }
};
