import Coupon from "../../models/Coupon.js";
import Order from "../../models/Order.js";

export const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(404).json({ message: "Invalid or expired coupon code" });
    }

    const alreadyUsed = await Order.findOne({
      user: req.userId,
      couponCode: code.toUpperCase(),
      orderStatus: { $ne: "Cancelled" }
    });

    if (alreadyUsed) {
      return res.status(400).json({ message: "You have already used this coupon code" });
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ message: "Coupon has expired" });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    let discount = 0;
    if (coupon.discountType === "Percentage (%)") {
      discount = (subtotal * coupon.value) / 100;
    } else {
      discount = coupon.value;
    }

    res.json({ success: true, code: coupon.code, discount, discountType: coupon.discountType, value: coupon.value });
  } catch (error) {
    res.status(500).json({ message: "Error validating coupon" });
  }
};
