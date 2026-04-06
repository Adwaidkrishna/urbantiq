import Coupon from "../models/Coupon.js";

// @desc    Get all coupons (Admin)
// @route   GET /api/admin/coupons
// @access  Private/Admin
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Error fetching coupons" });
  }
};

// @desc    Create a new coupon (Admin)
// @route   POST /api/admin/coupons
// @access  Private/Admin
export const createCoupon = async (req, res) => {
  try {
    const { code, discountType, value, usageLimit, expiryDate } = req.body;

    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = new Coupon({
      code,
      discountType,
      value,
      usageLimit,
      expiryDate
    });

    const savedCoupon = await coupon.save();
    res.status(201).json(savedCoupon);
  } catch (error) {
    console.error("Create Coupon Error:", error);
    res.status(500).json({ message: error.message || "Error creating coupon" });
  }
};

// @desc    Delete a coupon (Admin)
// @route   DELETE /api/admin/coupons/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting coupon" });
  }
};

// @desc    Update a coupon (Admin)
// @route   PUT /api/admin/coupons/:id
// @access  Private/Admin
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

// @desc    Validate coupon (Private - for checkout)
// @route   POST /api/coupons/validate
// @access  Private
export const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(404).json({ message: "Invalid or expired coupon code" });
    }

    // Check expiry
    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ message: "Coupon has expired" });
    }

    // Check usage limit
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    let discount = 0;
    if (coupon.discountType === "Percentage (%)") {
      discount = (subtotal * coupon.value) / 100;
    } else {
      discount = coupon.value;
    }

    res.json({
      success: true,
      code: coupon.code,
      discount,
      discountType: coupon.discountType,
      value: coupon.value
    });
  } catch (error) {
    res.status(500).json({ message: "Error validating coupon" });
  }
};
