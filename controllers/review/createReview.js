import Review from "../../models/Review.js";
import Product from "../../models/Product.js";
import Order from "../../models/Order.js";

/**
 * POST /api/reviews
 * Body: { productId, orderId, orderItemId, rating, comment }
 */
export const createReview = async (req, res) => {
  try {
    const { productId, orderId, orderItemId, rating, comment } = req.body;
    const userId = req.userId;

    if (!productId || !orderId || !rating || !orderItemId) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or access denied." });
    }

    if (order.orderStatus !== "Delivered") {
      return res.status(400).json({ success: false, message: "Reviews can only be written for delivered orders." });
    }

    const item = order.items.id(orderItemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Specific product item not found in this order." });
    }

    if (item.reviewed) {
      return res.status(400).json({ success: false, message: "This product has already been reviewed for this order." });
    }

    await Review.create({ user: userId, product: productId, order: orderId, rating, comment });

    await Order.updateOne(
      { _id: orderId, "items._id": orderItemId },
      { $set: { "items.$.reviewed": true } }
    );

    const reviews = await Review.find({ product: productId });
    const count = reviews.length;
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / count;

    await Product.findByIdAndUpdate(productId, {
      averageRating: avgRating.toFixed(1),
      reviewCount: count
    });

    res.status(201).json({ success: true, message: "Review submitted successfully!" });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};
