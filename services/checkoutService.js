import mongoose from "mongoose";
import { inventoryService } from "./InventoryService.js";
import { walletService } from "./walletService.js";
import { orderService } from "./orderService.js";
import { couponService } from "./couponService.js";
import Order from "../models/Order.js";

export const checkoutService = {
  /**
   * Orchestrates the checkout process within a MongoDB transaction.
   * Ensures ACID compliance: if any step fails, everything rolls back.
   */
  async processCheckout(userId, data) {
    const { 
      items, 
      shippingAddress, 
      paymentMethod, 
      totalPrice, 
      discount, 
      shippingCharges, 
      finalAmount, 
      couponCode, 
      transactionId 
    } = data;

    // --- 1. Pre-transaction validations (Reads) ---
    if (!items || items.length === 0) throw new Error("No items in order");
    if (!shippingAddress) throw new Error("Shipping address is required");

    // Format items for validation and order
    const orderItems = items.map(item => ({
      product: item.product?._id || item.product,
      variant: item.variant?._id || item.variant,
      size: item.size,
      quantity: Number(item.quantity),
      price: item.price
    }));

    // Validate Stock first (Reads only)
    await inventoryService.validateStock(orderItems);

    // Validate Coupon
    if (couponCode) {
      await couponService.validateCouponForCheckout(couponCode, userId, Order);
    }

    // Prepare Order Data
    const orderData = {
      user: userId,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      discount,
      shippingCharges,
      finalAmount,
      couponCode,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid"
    };

    if (transactionId) {
      orderData.transactionId = transactionId;
    }

    // Pre-validate order model so we don't start a transaction for a bad model
    const orderForValidation = new Order(orderData);
    const validationError = orderForValidation.validateSync();
    if (validationError) {
      throw new Error(`Order validation failed: ${validationError.message}`);
    }

    let finalOrder = null;

    // --- 2. Start Transaction (Mutations) ---
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // Step A: Deduct Stock (Throws if insufficient due to concurrency)
        await inventoryService.deductStock(orderItems, session);

        // Step B: Update Coupon Usage
        if (couponCode) {
          await couponService.incrementCouponUsage(couponCode, session);
        }

        // Step C: Handle Wallet Payment
        let walletTx = null;
        if (paymentMethod === "Wallet") {
          walletTx = await walletService.debitWallet(userId, finalAmount, session);
        }

        // Step D: Create Order
        finalOrder = await orderService.createOrder(orderData, session);

        // Step E: Link Wallet Transaction to Order
        if (paymentMethod === "Wallet" && walletTx) {
          walletTx.orderId = finalOrder._id;
          await walletTx.save({ session });
        }

        // Step F: Clear Cart
        await orderService.clearCart(userId, session);
      });
    } catch (error) {
      // Re-throw to be caught by the controller
      throw error;
    } finally {
      // Always end session
      await session.endSession();
    }

    return finalOrder;
  }
};
