import Coupon from "../models/Coupon.js";

/**
 * Service to handle coupon business logic.
 */
export const couponService = {
  /**
   * Fetches active and usable coupons based on system rules.
   * - isActive = true
   * - startDate <= current date
   * - expiryDate >= current date
   * - usedCount < usageLimit
   * - status = "ACTIVE"
   * Sorted by highest discount value first, earliest expiry date second.
   * Limited to a maximum of 3 coupons.
   */
  getActiveCoupons: async () => {
    const now = new Date();
    return await Coupon.find({
      isActive: true,
      status: "ACTIVE",
      startDate: { $lte: now },
      expiryDate: { $gte: now },
      $expr: { $lt: ["$usedCount", "$usageLimit"] }
    })
    .sort({ value: -1, expiryDate: 1 })
    .limit(3);
  },

  /**
   * Validates if a coupon can be applied during checkout.
   * Checks expiration, usage limit, and if the user has already used it.
   */
  async validateCouponForCheckout(couponCode, userId, Order) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!coupon) throw new Error("Applied coupon is no longer valid.");
    if (new Date() > new Date(coupon.expiryDate)) throw new Error("Applied coupon has expired.");
    if (coupon.usedCount >= coupon.usageLimit) throw new Error("Coupon usage limit reached.");

    // Check if user has already used this coupon
    const alreadyUsed = await Order.findOne({
      user: userId,
      couponCode: couponCode.toUpperCase(),
      orderStatus: { $ne: "Cancelled" }
    });
    if (alreadyUsed) {
      throw new Error("You have already used this coupon code.");
    }
    
    return coupon;
  },

  /**
   * Increments the used count of a coupon inside a transaction.
   */
  async incrementCouponUsage(couponCode, session) {
    const updateResult = await Coupon.updateOne(
      { 
        code: couponCode.toUpperCase(), 
        $expr: { $lt: ["$usedCount", "$usageLimit"] } 
      }, 
      { $inc: { usedCount: 1 } },
      { session }
    );
    
    if (updateResult.modifiedCount === 0) {
      throw new Error("Concurrency Error: Coupon usage limit reached during checkout.");
    }
  }
};
