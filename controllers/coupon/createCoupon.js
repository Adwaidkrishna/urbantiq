import Coupon from "../../models/Coupon.js";

export const createCoupon = async (req, res) => {
  try {
    const { code, discountType, value, usageLimit, expiryDate } = req.body;

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = new Coupon({ code, discountType, value, usageLimit, expiryDate });
    const savedCoupon = await coupon.save();
    res.status(201).json(savedCoupon);
  } catch (error) {
    console.error("Create Coupon Error:", error);
    res.status(500).json({ message: error.message || "Error creating coupon" });
  }
};
