import "dotenv/config"
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth/authRoutes.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import adminCategoryRoutes from "./routes/admin/categoryRoutes.js";
import categoryRoutes from "./routes/public/categoryRoutes.js";
import userRoutes from "./routes/public/userRoutes.js";
import adminProductRoutes from "./routes/admin/productRoutes.js";
import productRoutes from "./routes/public/productRoutes.js";
import supplierRoutes from "./routes/admin/supplierRoutes.js";
import purchaseRoutes from "./routes/admin/purchaseRoutes.js";
import batchRoutes from "./routes/admin/batchRoutes.js";
import adminCustomerRoutes from "./routes/admin/customerRoutes.js";
import cartRoutes from "./routes/user/cartRoutes.js";
import wishlistRoutes from "./routes/user/wishlistRoutes.js";
import orderRoutes from "./routes/user/orderRoutes.js";
import paymentRoutes from "./routes/user/paymentRoutes.js";
import userProfileRoutes from "./routes/user/profileRoutes.js";
import couponRoutes from "./routes/user/couponRoutes.js";
import reviewRoutes from "./routes/user/reviewRoutes.js";
import adminOfferRoutes from "./routes/admin/offerRoutes.js";

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static("public"));

// 1. PUBLIC API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api", categoryRoutes);
app.use("/api", productRoutes);

// 2. PROTECTED USER API ROUTES
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/user-profile", userProfileRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/reviews", reviewRoutes);

// 3. PROTECTED ADMIN API & PAGE ROUTES
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminCategoryRoutes);
app.use("/api/admin", adminProductRoutes);
app.use("/api/admin/suppliers", supplierRoutes);
app.use("/api/admin", purchaseRoutes);
app.use("/api/admin", batchRoutes);
app.use("/api/admin", adminCustomerRoutes);
app.use("/api/admin", adminOfferRoutes);

// 4. USER-SIDE PAGES
app.use("/", userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});