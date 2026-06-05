import Order from "../../models/Order.js";

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name variants categories");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns the order
    if (order.user.toString() !== req.userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order" });
  }
};
