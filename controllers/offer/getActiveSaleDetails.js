import Offer from "../../models/Offer.js";
import Coupon from "../../models/Coupon.js";

/**
 * Controller to fetch active sale details (earliest offer end date and active coupons).
 * Serves public requests for the User-Side Sale Page.
 */
export const getActiveSaleDetails = async (req, res) => {
  try {
    const now = new Date();

    // 1. Fetch active offers to compute the countdown timer target date
    const activeOffers = await Offer.find({
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    let endDate = null;
    if (activeOffers.length > 0) {
      // Get the soonest ending active offer's end date
      const endTimes = activeOffers.map(o => new Date(o.endDate).getTime());
      endDate = new Date(Math.min(...endTimes));
    }

    // 2. Fetch active coupons
    const activeCoupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gt: now },
      $expr: { $lt: ["$usedCount", "$usageLimit"] }
    });

    res.status(200).json({
      success: true,
      endDate,
      coupons: activeCoupons
    });
  } catch (error) {
    console.error("Error in getActiveSaleDetails:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error fetching active sale details"
    });
  }
};
