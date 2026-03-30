import mongoose from "mongoose";
import Order from "../models/Ordermodel.js";
import Cart from "../models/Cart.js";
import Product from "../models/ProductModel.js";
import PurchaseItem from "../models/PurchaseItemModel.js";

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private
export const placeOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, totalPrice, discount, shippingCharges, finalAmount } = req.body;

    // Step 2: Validate input
    if (!items || items.length === 0) throw new Error("No items in order");
    if (!shippingAddress) throw new Error("Shipping address is required");

    const orderItems = [];

    for (const item of items) {
      const productId = item.product?._id || item.product;
      const variantId = item.variant?._id || item.variant;
      const sizeStr = item.size;
      const requestedQty = Number(item.quantity);

      if (!productId || !variantId || !sizeStr || requestedQty <= 0) {
        throw new Error("Invalid product variant or quantity data");
      }

      // Step 3: Validate stock
      const product = await Product.findById(productId);
      if (!product) throw new Error(`Product ${productId} not found`);

      const variant = product.variants.find(v => v._id.toString() === variantId.toString());
      if (!variant) throw new Error(`Variant not found for product ${product.name}`);

      const sizeObj = variant.sizes.find(s => s.size === sizeStr);
      if (!sizeObj || sizeObj.stock < requestedQty) {
        throw new Error(`Out of stock: ${product.name} (${sizeStr}) only has ${sizeObj ? sizeObj.stock : 0} left.`);
      }

      // Step 4: Apply FIFO batch deduction
      const batches = await PurchaseItem.find({
        status: "LINKED",
        allocations: {
          $elemMatch: {
            variantId: new mongoose.Types.ObjectId(variantId),
            size: sizeStr,
            remainingQuantity: { $gt: 0 }
          }
        }
      }).sort({ createdAt: 1 });

      let remainingQtyToDeduct = requestedQty;

      for (const batch of batches) {
        if (remainingQtyToDeduct <= 0) break;

        const alloc = batch.allocations.find(a =>
          a.variantId.toString() === variantId.toString() &&
          a.size === sizeStr &&
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

          if (batchUpdate.modifiedCount === 0) {
            throw new Error(`Concurrency mismatch: Batch allocation failed for ${product.name}.`);
          }

          remainingQtyToDeduct -= deductAmount;
        }
      }

      // Step 5: Final stock check
      if (remainingQtyToDeduct > 0) {
        throw new Error(`Out of Stock: Sync issue for ${product.name} (${sizeStr}). FIFO batches insufficient.`);
      }

      // Step 6: Update ProductVariant stock
      const productUpdate = await Product.updateOne(
        { _id: productId },
        { $inc: { "variants.$[v].sizes.$[s].stock": -requestedQty } },
        { 
          arrayFilters: [
            { "v._id": new mongoose.Types.ObjectId(variantId) },
            { "s.size": sizeStr }
          ]
        }
      );

      if (productUpdate.modifiedCount === 0) {
        throw new Error(`Failed to update master stock for ${product.name}.`);
      }

      orderItems.push({
        product: productId,
        variant: variantId,
        size: sizeStr,
        quantity: requestedQty,
        price: item.price
      });
    }

    // Step 7: Create order
    const order = new Order({
      user: req.userId,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      discount,
      shippingCharges,
      finalAmount,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid"
    });

    const savedOrder = await order.save();
    
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

// @desc    Get user's order history
// @route   GET /api/orders/my-orders
// @access  Private
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

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name images categories");

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

// @desc    Cancel an order by user
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({ message: "Order is already cancelled" });
    }

    if (order.orderStatus === "Delivered" || order.orderStatus === "Shipped") {
      return res.status(400).json({ message: "Order cannot be cancelled at this stage" });
    }

    // Rollback Inventory
    await rollbackOrderStock(order);

    // Update status
    order.orderStatus = "Cancelled";
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    console.error("Cancel Order Error:", error);
    res.status(500).json({ message: error.message || "Error cancelling order" });
  }
};

// --- ADMIN FUNCTIONS ---

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "name email")
      .sort("-createdAt");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching all orders" });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/admin/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const previousStatus = order.orderStatus;

    // Handle cancellation rollback for admin
    if (status === "Cancelled" && previousStatus !== "Cancelled") {
       await rollbackOrderStock(order);
    }

    order.orderStatus = status;
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    console.error("Admin Status Update Error:", error);
    res.status(500).json({ message: error.message || "Error updating order status" });
  }
};

/**
 * Shared Helper: RESTORE STOCK TO PRODUCT AND BATCHES
 */
async function rollbackOrderStock(order) {
  for (const item of order.items) {
    // 1. Update Master Product Stock
    await Product.updateOne(
      { _id: new mongoose.Types.ObjectId(item.product) },
      { $inc: { "variants.$[v].sizes.$[s].stock": item.quantity } },
      {
        arrayFilters: [
          { "v._id": new mongoose.Types.ObjectId(item.variant) },
          { "s.size": item.size }
        ]
      }
    );

    // 2. Rollback Batches (FIFO reversed)
    // Find batches that are missing stock (remaining < initial quantity)
    // We restore to the NEWEST batches first (reverse of placement deduction)
    const batches = await PurchaseItem.find({
      status: "LINKED",
      "allocations.variantId": new mongoose.Types.ObjectId(item.variant),
      "allocations.size": item.size
    }).sort({ createdAt: -1 });

    let qtyToRestore = item.quantity;

    for (const batch of batches) {
      if (qtyToRestore <= 0) break;

      const alloc = batch.allocations.find(a => 
        a.variantId.toString() === item.variant.toString() && a.size === item.size
      );

      if (alloc && alloc.remainingQuantity < alloc.quantity) {
        const spaceInBatch = alloc.quantity - alloc.remainingQuantity;
        const addAmount = Math.min(spaceInBatch, qtyToRestore);

        await PurchaseItem.updateOne(
          { _id: batch._id, "allocations._id": alloc._id },
          { $inc: { "allocations.$.remainingQuantity": addAmount } }
        );

        qtyToRestore -= addAmount;
      }
    }
  }
}

// @desc    Validate stock before order placement (Pre-flight check)
// @route   POST /api/orders/validate-stock
// @access  Private
export const validateStock = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: "No items to validate" });

    for (const item of items) {
      const productId = item.product?._id || item.product;
      const variantId = item.variant?._id || item.variant;
      const sizeStr = item.size;
      const qty = Number(item.quantity);

      const product = await Product.findById(productId);
      if (!product) return res.status(400).json({ message: `Product not found` });

      const variant = product.variants.find(v => v._id.toString() === variantId.toString());
      const sizeObj = variant?.sizes.find(s => s.size === sizeStr);

      if (!sizeObj || sizeObj.stock < qty) {
        return res.status(400).json({ 
          success: false, 
          message: `Out of stock: ${product.name} (${sizeStr}) only has ${sizeObj ? sizeObj.stock : 0} left.` 
        });
      }

      // Check Batch (FIFO) availability
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

      console.log(`Pre-check: Found ${batches.length} batches for Variant ${variantId} Size ${sizeStr}`);
      
      if (batches.length === 0) {
          // Diagnostic: Let's see what batches DO exist for this product variant at all
          const anyBatches = await PurchaseItem.find({ "allocations.variantId": new mongoose.Types.ObjectId(variantId) });
          console.log(`Diagnostic: Total batches (Linked or Unlinked) for this variant: ${anyBatches.length}`);
          if (anyBatches.length > 0) {
              console.log(`Sample Batch Status: ${anyBatches[0].status}`);
              console.log(`Sample Batch Allocations:`, JSON.stringify(anyBatches[0].allocations));
          }
      }

      const availableInBatches = batches.reduce((acc, batch) => {
        const alloc = batch.allocations.find(a => a.variantId.toString() === variantId.toString() && a.size === sizeStr);
        return acc + (alloc ? alloc.remainingQuantity : 0);
      }, 0);

      if (availableInBatches < qty) {
        return res.status(400).json({ 
          success: false, 
          message: `Inventory sync issue: ${product.name} batches insufficient.` 
        });
      }
    }

    res.json({ success: true, message: "Stock validated" });
  } catch (error) {
    console.error("Validate Stock Error:", error);
    res.status(500).json({ message: "Internal validation error" });
  }
};
