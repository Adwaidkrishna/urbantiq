import Order from "../models/Order.js";
import Cart from "../models/Cart.js";

export const orderService = {
  /**
   * Creates an order with the given session.
   */
  async createOrder(orderData, session) {
    const order = new Order(orderData);
    
    const validationError = order.validateSync();
    if (validationError) {
      throw new Error(`Order validation failed: ${validationError.message}`);
    }

    // Save with transaction session
    const savedOrder = await order.save({ session });
    return savedOrder;
  },

  /**
   * Empties the user's cart using the given session.
   */
  async clearCart(userId, session) {
    await Cart.findOneAndUpdate(
      { user: userId }, 
      { items: [] },
      { session }
    );
  }
};
