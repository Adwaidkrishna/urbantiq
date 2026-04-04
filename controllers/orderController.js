/**
 * controllers/orderController.js
 * ─────────────────────────────────────────────────────────
 * Thin controller — only handles req/res.
 * All business logic delegated to services.
 * ─────────────────────────────────────────────────────────
 */

import Cart from "../models/Cart.js";
import Order from "../models/Ordermodel.js";
import WalletTransaction from "../models/WalletTransaction.js";
import { deductFIFOStock, validateStockAvailability, rollbackOrderStock } from "../services/inventoryService.js";
import { processWalletDebit, processWalletCredit } from "../services/walletService.js";
import { createOrderRecord, clearUserCart, getUserOrders, getOrderByIdForUser, getAllOrders } from "../services/orderService.js";

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private
export const placeOrder = async (req, res, next) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      totalPrice,
      discount,
      shippingCharges,
      finalAmount,
    } = req.body;

    if (!items || items.length === 0) throw new Error("No items in order");
    if (!shippingAddress) throw new Error("Shipping address is required");

    // Step 1: Deduct FIFO stock + validate — returns formatted orderItems
    const orderItems = await deductFIFOStock(items);

    // Step 2: Deduct wallet balance (if wallet payment)
    if (paymentMethod === "Wallet") {
      await processWalletDebit(req.userId, finalAmount);
    }

    // Step 3: Create order record
    const savedOrder = await createOrderRecord({
      userId: req.userId,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      discount,
      shippingCharges,
      finalAmount,
    });

    // Step 4: Link wallet transaction to order (if wallet payment)
    if (paymentMethod === "Wallet") {
      await WalletTransaction.findOneAndUpdate(
        {
          user: req.userId,
          description: "Payment for Order",
          orderId: { $exists: false },
        },
        { orderId: savedOrder._id },
        { sort: { createdAt: -1 } }
      );
    }

    // Step 5: Clear cart
    await clearUserCart(req.userId);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId: savedOrder._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's order history
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await getUserOrders(req.userId);
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await getOrderByIdForUser(req.params.id, req.userId);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an order by user
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user.toString() !== req.userId)
      return res.status(401).json({ message: "Not authorized" });
    if (order.orderStatus === "Cancelled")
      return res.status(400).json({ message: "Order is already cancelled" });
    if (["Delivered", "Shipped"].includes(order.orderStatus))
      return res.status(400).json({ message: "Order cannot be cancelled at this stage" });

    // Rollback inventory
    await rollbackOrderStock(order);

    // Refund to wallet if paid
    if (order.paymentStatus === "Paid") {
      await processWalletCredit(
        order.user,
        order.finalAmount,
        `Refund for Cancelled Order: ${order._id}`,
        { orderId: order._id }
      );
    }

    order.orderStatus = "Cancelled";
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Request a return for a delivered order
// @route   PUT /api/orders/:id/return-request
// @access  Private
export const requestReturn = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user.toString() !== req.userId)
      return res.status(401).json({ message: "Not authorized" });
    if (order.orderStatus !== "Delivered")
      return res.status(400).json({ message: "Returns can only be requested for Delivered orders" });

    order.orderStatus = "Return Requested";
    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: "Return request submitted successfully",
      status: updatedOrder.orderStatus,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate stock before order placement (pre-flight)
// @route   POST /api/orders/validate-stock
// @access  Private
export const validateStock = async (req, res, next) => {
  try {
    if (!req.body) return res.status(500).json({ message: "Request body is missing" });
    const { items } = req.body;
    if (!items || items.length === 0)
      return res.status(400).json({ message: "No items to validate" });

    await validateStockAvailability(items);
    res.json({ success: true, message: "Stock validated" });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN ──────────────────────────────────────────────

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
export const getAllOrdersAdmin = async (req, res, next) => {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/admin/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    const previousStatus = order.orderStatus;

    // Admin cancellation — rollback & refund
    if (status === "Cancelled" && previousStatus !== "Cancelled") {
      await rollbackOrderStock(order);
      if (order.paymentStatus === "Paid") {
        await processWalletCredit(
          order.user,
          order.finalAmount,
          `Refund for Cancelled Order (Admin): ${order._id}`,
          { orderId: order._id }
        );
      }
    }

    // Admin marks as returned — rollback & refund
    if (status === "Returned" && previousStatus !== "Returned") {
      await rollbackOrderStock(order);
      if (order.paymentStatus === "Paid") {
        await processWalletCredit(
          order.user,
          order.finalAmount,
          `Refund for Returned Order: ${order._id}`,
          { orderId: order._id }
        );
      }
    }

    order.orderStatus = status;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
};
