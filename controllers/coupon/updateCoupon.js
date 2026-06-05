import Coupon from "../../models/Coupon.js";

export const updateCoupon = async (req, res) => {
  try {
    const { code, discountType, value, usageLimit, expiryDate, isActive } = req.body;
    console.log("Updating Coupon ID:", req.params.id, "Data:", req.body);

    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      {
        code: code.toUpperCase(),
        discountType,
        value,
        usageLimit,
        expiryDate,
        isActive: isActive !== undefined ? isActive : true
      },
      { new: true, runValidators: true }
    );

    if (!coupon) {
      console.log("Coupon not found for update");
      return res.status(404).json({ message: "Coupon not found" });
    }

    console.log("Updated Coupon Success:", coupon.code);
    res.json(coupon);
  } catch (error) {
    console.error("Update Coupon Error:", error);
    res.status(500).json({ message: error.message || "Error updating coupon" });
  }
};
