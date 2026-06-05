import mongoose from "mongoose";
import Order from "../../models/Order.js";
import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";
import PurchaseItem from "../../models/PurchaseItem.js";
import User from "../../models/User.js";
import WalletTransaction from "../../models/WalletTransaction.js";
import Coupon from "../../models/Coupon.js";

export const placeOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, totalPrice, discount, shippingCharges, finalAmount, couponCode, transactionId } = req.body;

    // Step 2: Validate input
    if (!items || items.length === 0) throw new Error("No items in order");
    if (!shippingAddress) throw new Error("Shipping address is required");

    // Optional: Validate Coupon one last time
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!coupon) throw new Error("Applied coupon is no longer valid.");
      if (new Date() > new Date(coupon.expiryDate)) throw new Error("Applied coupon has expired.");
      if (coupon.usedCount >= coupon.usageLimit) throw new Error("Coupon usage limit reached.");

      // Check if user has already used this coupon
      const alreadyUsed = await Order.findOne({
        user: req.userId,
        couponCode: couponCode.toUpperCase(),
        orderStatus: { $ne: "Cancelled" }
      });
      if (alreadyUsed) {
        throw new Error("You have already used this coupon code.");
      }
    }

    const orderItems = [];

    // --- PHASE 1: Data validation & Pre-checks (No DB mutations yet) ---
    for (const item of items) {
      const productId = item.product?._id || item.product;
      const variantId = item.variant?._id || item.variant;
      const sizeStr = item.size;
      const requestedQty = Number(item.quantity);

      if (!productId || !variantId || !sizeStr || requestedQty <= 0) {
        throw new Error("Invalid product variant or quantity data");
      }

      // Validate stock
      const product = await Product.findById(productId);
      if (!product) throw new Error(`Product ${productId} not found`);

      const variant = product.variants.find(v => v._id.toString() === variantId.toString());
      if (!variant) throw new Error(`Variant not found for product ${product.name}`);

      const sizeObj = variant.sizes.find(s => s.size === sizeStr);
      if (!sizeObj || sizeObj.stock < requestedQty) {
        throw new Error(`Out of stock: ${product.name} (${sizeStr}) only has ${sizeObj ? sizeObj.stock : 0} left.`);
      }

      // Check FIFO batch availability without modifying
      const batches = await PurchaseItem.find({
        status: "LINKED",
        allocations: {
          $elemMatch: {
            variantId: new mongoose.Types.ObjectId(variantId),
            size: sizeStr,
            remainingQuantity: { $gt: 0 }
          }
        }
      });

      const availableInBatches = batches.reduce((acc, batch) => {
        const alloc = batch.allocations.find(a => a.variantId.toString() === variantId.toString() && a.size === sizeStr);
        return acc + (alloc ? alloc.remainingQuantity : 0);
      }, 0);

      if (availableInBatches < requestedQty) {
        throw new Error(`Out of Stock: Sync issue for ${product.name} (${sizeStr}). FIFO batches insufficient.`);
      }

      orderItems.push({
        product: productId,
        variant: variantId,
        size: sizeStr,
        quantity: requestedQty,
        price: item.price
      });
    }

    // --- PHASE 2: Create Order Instance and Validate Schema ---
    const orderData = {
      user: req.userId,
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

    const order = new Order(orderData);

    const validationError = order.validateSync();
    if (validationError) {
      throw new Error(`Order validation failed: ${validationError.message}`);
    }

    // --- PHASE 3: Mutate DB (Stock reduction & Payment) ---
    if (couponCode) {
      await Coupon.updateOne({ code: couponCode.toUpperCase() }, { $inc: { usedCount: 1 } });
    }

    for (const item of orderItems) {
      const requestedQty = Number(item.quantity);

      // Apply FIFO batch deduction
      const batches = await PurchaseItem.find({
        status: "LINKED",
        allocations: {
          $elemMatch: {
            variantId: new mongoose.Types.ObjectId(item.variant),
            size: item.size,
            remainingQuantity: { $gt: 0 }
          }
        }
      }).sort({ createdAt: 1 });

      let remainingQtyToDeduct = requestedQty;

      for (const batch of batches) {
        if (remainingQtyToDeduct <= 0) break;

        const alloc = batch.allocations.find(a =>
          a.variantId.toString() === item.variant.toString() &&
          a.size === item.size &&
          a.remainingQuantity > 0
        );

        if (alloc) {
          const deductAmount = Math.min(alloc.remainingQuantity, remainingQtyToDeduct);

          const batchUpdate = await PurchaseItem.updateOne(
            {
              _id: batch._id,
              allocations: { $elemMatch: { _id: alloc._id, remainingQuantity: { $gte: deductAmount } } }
            },
            { $inc: { "allocations.$.remainingQuantity": -deductAmount } }
          );

          if (batchUpdate.modifiedCount > 0) {
            remainingQtyToDeduct -= deductAmount;
          }
        }
      }

      // Update ProductVariant stock
      await Product.updateOne(
        { _id: item.product },
        { $inc: { "variants.$[v].sizes.$[s].stock": -requestedQty } },
        {
          arrayFilters: [
            { "v._id": new mongoose.Types.ObjectId(item.variant) },
            { "s.size": item.size }
          ]
        }
      );
    }

    // Handle Wallet Payment Deduction
    if (paymentMethod === "Wallet") {
      const user = await User.findById(req.userId);
      if (!user) throw new Error("User not found");
      if (user.wallet < finalAmount) {
        throw new Error(`Insufficient wallet balance. You need ₹${finalAmount - user.wallet} more.`);
      }

      user.wallet -= finalAmount;
      await user.save();

      const transaction = new WalletTransaction({
        user: req.userId,
        amount: finalAmount,
        type: "DEBIT",
        description: `Payment for Order`,
      });
      await transaction.save();
    }

    // Step 9: Save order (Stock is already validated and reduced above)
    const savedOrder = await order.save();

    // Link transaction to order if it was a wallet payment
    if (paymentMethod === "Wallet") {
        await WalletTransaction.findOneAndUpdate(
            { user: req.userId, description: "Payment for Order", orderId: { $exists: false } },
            { orderId: savedOrder._id },
            { sort: { createdAt: -1 } }
        );
    }

    // Clear user cart
    await Cart.findOneAndUpdate({ user: req.userId }, { items: [] });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId: savedOrder._id
    });

  } catch (error) {
    console.error("Place Order Error:", error.message);
    res.status(400).json({ message: error.message || "Server error placing order" });
  }
};
