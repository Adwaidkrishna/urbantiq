import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  fullName:     { type: String, required: true },
  phone:        { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: "" },
  city:         { type: String, required: true },
  state:        { type: String, required: true },
  postalCode:   { type: String, required: true },
  country:      { type: String, default: "India" },
  label:        { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
  isDefault:    { type: Boolean, default: false }
}, { _id: true });

const userSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  otp: {
    type: String
  },

  otpExpire: {
    type: Date
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  wallet: {
    type: Number,
    default: 0
  },

  phone: {
    type: String,
    default: ""
  },

  addresses: {
    type: [addressSchema],
    default: []
  }

}, { timestamps: true });

export default mongoose.model("User", userSchema);