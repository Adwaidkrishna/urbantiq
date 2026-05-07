import express from "express";
import path from "path";

import { adminLogin, adminLogout, getAdminProfile, updateAdminProfile, changeAdminPassword } from "../controllers/adminController.js";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { getSalesReport } from "../controllers/salesController.js";
import { globalSearch } from "../controllers/searchController.js";
import adminAuthMiddleware from "../middleware/adminMiddleware.js"



const router = express.Router();

router.get("/login", (req, res) => {
  res.sendFile(path.resolve("public/views/admin/login.html"));
});

// Each admin route serves its own standalone HTML page
const adminPages = [
  "dashboard",
  "order-management",
  "customers",
  "coupons",
  "categories",
  "sales-offers",
  "sales-report",
  "transactions",
  "purchases",
  "add-purchase",
  "batch-management",
  "suppliers",
  "inventory",
  "admin-profile",
  "add-product",
  "products",
  "edit-product",
];

adminPages.forEach((page) => {
  router.get(`/${page}`, adminAuthMiddleware, (req, res) => {
    res.sendFile(path.resolve(`public/views/admin/${page}.html`));
  });
});

// Edit category page — dynamic ID param
router.get("/edit-category/:id", adminAuthMiddleware, (req, res) => {
  res.sendFile(path.resolve("public/views/admin/edit-category.html"));
});

// Edit supplier page — dynamic ID param
router.get("/edit-supplier/:id", adminAuthMiddleware, (req, res) => {
  res.sendFile(path.resolve("public/views/admin/edit-supplier.html"));
});

// Dashboard API
router.get("/dashboard/stats", adminAuthMiddleware, getDashboardStats);
router.get("/sales-report-data", adminAuthMiddleware, getSalesReport);
router.get("/global-search", adminAuthMiddleware, globalSearch);

router.post("/login", adminLogin);
router.get("/logout", adminLogout);

// Admin Profile API routes
router.get("/profile", adminAuthMiddleware, getAdminProfile);
router.put("/profile", adminAuthMiddleware, updateAdminProfile);
router.put("/profile/change-password", adminAuthMiddleware, changeAdminPassword);

export default router;