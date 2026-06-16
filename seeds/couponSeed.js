import mongoose from "mongoose";
import dotenv from "dotenv";
import Coupon from "../models/Coupon.js";

dotenv.config({ path: "./.env" });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/urbantiq";

const coupons = [
  {
    code: "VIP50",
    discountType: "Percentage (%)",
    value: 50,
    usageLimit: 10,
    usedCount: 0,
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Active since yesterday
    expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Expires in 10 days
    isActive: true,
    status: "ACTIVE",
    minPurchase: 3000
  },
  {
    code: "URBAN30",
    discountType: "Percentage (%)",
    value: 30,
    usageLimit: 100,
    usedCount: 0,
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Active since yesterday
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
    isActive: true,
    status: "ACTIVE",
    minPurchase: 1500
  },
  {
    code: "FLAT150",
    discountType: "Flat Amount",
    value: 150,
    usageLimit: 50,
    usedCount: 0,
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Active since yesterday
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Expires in 3 days
    isActive: true,
    status: "ACTIVE",
    minPurchase: 1000
  },
  {
    code: "FUTURE20",
    discountType: "Percentage (%)",
    value: 20,
    usageLimit: 100,
    usedCount: 0,
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Active in 2 days (Future coupon)
    expiryDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    isActive: true,
    status: "ACTIVE",
    minPurchase: 1000
  },
  {
    code: "EXPIRED25",
    discountType: "Percentage (%)",
    value: 25,
    usageLimit: 100,
    usedCount: 0,
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
    isActive: true,
    status: "ACTIVE",
    minPurchase: 1000
  },
  {
    code: "LIMIT15",
    discountType: "Percentage (%)",
    value: 15,
    usageLimit: 5,
    usedCount: 5, // Usage limit reached
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    isActive: true,
    status: "ACTIVE",
    minPurchase: 500
  },
  {
    code: "INACTIVE10",
    discountType: "Percentage (%)",
    value: 10,
    usageLimit: 50,
    usedCount: 0,
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    isActive: false, // Inactive
    status: "ACTIVE",
    minPurchase: 500
  },
  {
    code: "STATUS_INACTIVE",
    discountType: "Percentage (%)",
    value: 15,
    usageLimit: 50,
    usedCount: 0,
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    isActive: true,
    status: "INACTIVE", // Status Inactive
    minPurchase: 500
  }
];

async function seedCoupons() {
  try {
    console.log("Connecting to Database...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    console.log("Clearing existing coupons...");
    await Coupon.deleteMany({});
    console.log("Cleared.");

    console.log("Inserting new coupons...");
    await Coupon.insertMany(coupons);
    console.log("Seeded Coupons successfully!");

  } catch (error) {
    console.error("Error seeding coupons:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
    process.exit();
  }
}

seedCoupons();
