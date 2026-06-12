import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Wishlist from "../models/Wishlist.js";
import WalletTransaction from "../models/WalletTransaction.js";
import Review from "../models/Review.js";

// Load environment variables
dotenv.config({ path: "./.env" });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/urbantiq";

/**
 * URBANTIQ USER DATA CLEAR SCRIPT
 * This script deletes all user-related collections to reset the customer database.
 * 
 * Usage:
 * npm run clear-user-data
 */
async function clearUserData() {
  try {
    console.log("🚀 Starting process to clear all User Data...");
    console.log(`Connecting to: ${MONGO_URI}`);

    // Connect to database
    await mongoose.connect(MONGO_URI);
    console.log("✅ Successfully connected to MongoDB");

    console.log("--------------------------------------------------");
    
    // Deleting User documents
    console.log("🧹 Clearing User collection...");
    const userResult = await User.deleteMany({});
    console.log(`   Deleted ${userResult.deletedCount} users.`);

    // Deleting Cart documents
    console.log("🧹 Clearing Cart collection...");
    const cartResult = await Cart.deleteMany({});
    console.log(`   Deleted ${cartResult.deletedCount} carts.`);

    // Deleting Order documents
    console.log("🧹 Clearing Order collection...");
    const orderResult = await Order.deleteMany({});
    console.log(`   Deleted ${orderResult.deletedCount} orders.`);

    // Deleting Wishlist documents
    console.log("🧹 Clearing Wishlist collection...");
    const wishlistResult = await Wishlist.deleteMany({});
    console.log(`   Deleted ${wishlistResult.deletedCount} wishlists.`);

    // Deleting WalletTransaction documents
    console.log("🧹 Clearing WalletTransaction collection...");
    const walletResult = await WalletTransaction.deleteMany({});
    console.log(`   Deleted ${walletResult.deletedCount} wallet transactions.`);

    // Deleting Review documents
    console.log("🧹 Clearing Review collection...");
    const reviewResult = await Review.deleteMany({});
    console.log(`   Deleted ${reviewResult.deletedCount} reviews.`);

    console.log("--------------------------------------------------");
    console.log("🎉 ALL USER DATA CLEARED SUCCESSFULLY!");
    console.log("--------------------------------------------------");

  } catch (error) {
    console.error("❌ ERROR CLEARING USER DATA:");
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed.");
    process.exit(0);
  }
}

// Check for missing database URI
if (!process.env.MONGO_URI && !MONGO_URI) {
  console.error("❌ Error: MONGO_URI is missing in .env file");
  process.exit(1);
}

clearUserData();
