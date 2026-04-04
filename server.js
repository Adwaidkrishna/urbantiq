import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminCategoryRoutes from "./routes/adminCategoryRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminProductRoutes from "./routes/adminProductRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import userProfileRoutes from "./routes/userProfileRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));

// ─── API Routes ────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminCategoryRoutes);
app.use("/api", categoryRoutes);
app.use("/api/admin", adminProductRoutes);
app.use("/api", productRoutes);
app.use("/api/admin/suppliers", supplierRoutes);
app.use("/api/admin", purchaseRoutes);
app.use("/api/admin", batchRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/user-profile", userProfileRoutes);

// ─── User Page Routes ──────────────────────────────────
app.use("/", userRoutes);

// ─── Centralized Error Handling ────────────────────────
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});