import Order from "../../models/Order.js";

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate("items.product", "name variants")
      .sort("-createdAt");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
};
