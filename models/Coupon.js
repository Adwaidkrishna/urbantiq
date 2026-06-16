import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ["Percentage (%)", "Flat Amount"],
    default: "Percentage (%)",
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  usageLimit: {
    type: Number,
    required: true
  },
  usedCount: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE"],
    default: "ACTIVE"
  },
  minPurchase: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model("Coupon", couponSchema);
