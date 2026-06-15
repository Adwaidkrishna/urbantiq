import express from "express";
import path from "path";

import { adminLogin, adminLogout, getAdminProfile, updateAdminProfile, changeAdminPassword } from "../../controllers/admin/index.js";
import { getDashboardStats } from "../../controllers/dashboard/index.js";
import { getSalesReport } from "../../controllers/sales/index.js";
import { globalSearch } from "../../controllers/search/index.js";
import { cancelReview, returnReview } from "../../controllers/order/index.js";
import adminAuthMiddleware from "../../middleware/adminMiddleware.js";



const router = express.Router();

router.get("/login", (req, res) => {
  res.sendFile(path.resolve("public/views/admin/login.html"));
});

// Each admin route serves its own standalone HTML page
const adminPages = [
  "dashboard",
  "order-management",
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
  "contact-management",
];

adminPages.forEach((page) => {
  router.get(`/${page}`, adminAuthMiddleware, (req, res) => {
    res.sendFile(path.resolve(`public/views/admin/${page}.html`));
  });
});

// Explicit route for customers page vs JSON API resolution
router.get("/customers", adminAuthMiddleware, (req, res, next) => {
  if (req.headers.accept && req.headers.accept.includes("json")) {
    return next();
  }
  res.sendFile(path.resolve("public/views/admin/customers.html"));
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

// Order Cancellation and Return Review routes
router.patch("/orders/:orderId/cancel-review", adminAuthMiddleware, cancelReview);
router.patch("/orders/:orderId/return-review", adminAuthMiddleware, returnReview);

export default router;
