import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category"
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  { timestamps: true }
);

const Offer = mongoose.models.Offer || mongoose.model("Offer", offerSchema);

export default Offer;
