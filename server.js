import "dotenv/config"
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminCategoryRoutes from "./routes/adminCategoryRoutes.js"
import categoryRoutes from "./routes/categoryRoutes.js";
import userRoutes from "./routes/userRoutes.js";


const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static("public"));  



app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/admin/pages", express.static("views/admin/pages"));
app.use("/api/admin", adminCategoryRoutes);
app.use("/api", categoryRoutes);

// User side pages
app.use("/", userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});