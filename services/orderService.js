/**
 * services/orderService.js
 * ─────────────────────────────────────────────────────────
 * Handles order record creation and cart management
 * ─────────────────────────────────────────────────────────
 */

import Order from "../models/Ordermodel.js";
import Cart from "../models/Cart.js";

// ─────────────────────────────────────────────────────────
// Create and persist an order document
// ─────────────────────────────────────────────────────────
export async function createOrderRecord({
  userId,
  items,
  shippingAddress,
  paymentMethod,
  totalPrice,
  discount,
  shippingCharges,
  finalAmount,
}) {
  const order = new Order({
    user: userId,
    items,
    shippingAddress,
    paymentMethod,
    totalPrice,
    discount,
    shippingCharges,
    finalAmount,
    paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
  });
  return await order.save();
}

// ─────────────────────────────────────────────────────────
// Clear all items from a user's cart after order placement
// ─────────────────────────────────────────────────────────
export async function clearUserCart(userId) {
  return await Cart.findOneAndUpdate({ user: userId }, { items: [] });
}

// ─────────────────────────────────────────────────────────
// Fetch all orders for a user (with product population)
// ─────────────────────────────────────────────────────────
export async function getUserOrders(userId) {
  return await Order.find({ user: userId })
    .populate("items.product", "name variants")
    .sort("-createdAt");
}

// ─────────────────────────────────────────────────────────
// Fetch a single order by ID (with ownership check)
// ─────────────────────────────────────────────────────────
export async function getOrderByIdForUser(orderId, userId) {
  const order = await Order.findById(orderId).populate(
    "items.product",
    "name variants categories"
  );
  if (!order) throw new Error("Order not found");
  if (order.user.toString() !== userId.toString())
    throw new Error("Not authorized to view this order");
  return order;
}

// ─────────────────────────────────────────────────────────
// Fetch all orders (admin)
// ─────────────────────────────────────────────────────────
export async function getAllOrders() {
  return await Order.find({})
    .populate("user", "name email")
    .sort("-createdAt");
}
