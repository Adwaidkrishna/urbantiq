import Review from "../models/Review.js";
import Product from "../models/ProductModel.js";
import Order from "../models/OrderModel.js";

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

    // 1. Validation: Check if order exists and belongs to user
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or access denied." });
    }

    // 2. Validation: Check if order status is DELIVERED
    if (order.orderStatus !== "Delivered") {
      return res.status(400).json({ success: false, message: "Reviews can only be written for delivered orders." });
    }

    // 3. Validation: Check if product exists in the order
    const item = order.items.id(orderItemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Specific product item not found in this order." });
    }

    // 4. Validation: Check if product has already been reviewed in this order
    if (item.reviewed) {
      return res.status(400).json({ success: false, message: "This product has already been reviewed for this order." });
    }

    // 5. Create the review
    await Review.create({
      user: userId,
      product: productId,
      order: orderId,
      rating,
      comment
    });

    // 6. Update the specific order item to marked as reviewed
    await Order.updateOne(
      { _id: orderId, "items._id": orderItemId },
      { $set: { "items.$.reviewed": true } }
    );

    // 7. Update product's average rating and review count
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

/**
 * GET /api/reviews/:productId
 */
export const getReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ success: false, message: "An error occurred while fetching reviews." });
  }
};
