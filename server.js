import "dotenv/config"
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth/authRoutes.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import adminCategoryRoutes from "./routes/category/adminCategoryRoutes.js";
import categoryRoutes from "./routes/category/categoryRoutes.js";
import userRoutes from "./routes/user/userRoutes.js";
import adminProductRoutes from "./routes/product/adminProductRoutes.js";
import productRoutes from "./routes/product/productRoutes.js";
import supplierRoutes from "./routes/supplier/supplierRoutes.js";
import purchaseRoutes from "./routes/purchase/purchaseRoutes.js";
import batchRoutes from "./routes/batch/batchRoutes.js";
import cartRoutes from "./routes/cart/cartRoutes.js";
import wishlistRoutes from "./routes/wishlist/wishlistRoutes.js";
import orderRoutes from "./routes/order/orderRoutes.js";
import paymentRoutes from "./routes/payment/paymentRoutes.js";
import userProfileRoutes from "./routes/profile/userProfileRoutes.js";
import couponRoutes from "./routes/coupon/couponRoutes.js";
import reviewRoutes from "./routes/review/reviewRoutes.js";

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static("public"));

// ==========================================
// 1. PUBLIC API ROUTES
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api", categoryRoutes);
app.use("/api", productRoutes);

// ==========================================
// 2. PROTECTED USER API ROUTES
// (Auth guards applied inside individual route files)
// ==========================================
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/user-profile", userProfileRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/reviews", reviewRoutes);

// ==========================================
// 3. PROTECTED ADMIN API & PAGE ROUTES
// (Admin Auth guards applied inside individual route files)
// ==========================================
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminCategoryRoutes);
app.use("/api/admin", adminProductRoutes);
app.use("/api/admin/suppliers", supplierRoutes);
app.use("/api/admin", purchaseRoutes);
app.use("/api/admin", batchRoutes);

// ==========================================
// 4. USER-SIDE PAGES
// ==========================================
app.use("/", userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});