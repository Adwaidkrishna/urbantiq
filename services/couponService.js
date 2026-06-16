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
  }
};
