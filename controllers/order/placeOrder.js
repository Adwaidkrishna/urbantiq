import { checkoutService } from "../../services/checkoutService.js";

export const placeOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const data = req.body;

    console.log(`[Checkout] Started for user ${userId}`);

    const savedOrder = await checkoutService.processCheckout(userId, data);

    console.log(`[Checkout] Transaction Committed. Order ${savedOrder._id} created for user ${userId}`);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId: savedOrder._id
    });
  } catch (error) {
    console.error(`[Checkout] Transaction Rolled Back. Error: ${error.message}`);
    res.status(400).json({ message: error.message || "Server error placing order" });
  }
};
