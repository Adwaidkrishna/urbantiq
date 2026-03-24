import express from "express";
import path from "path";

import { adminLogin } from "../controllers/adminController.js";
import adminAuthMiddleware from "../middleware/adminMiddleware.js"



const router = express.Router();

router.get("/login", (req, res) => {
  res.sendFile(path.resolve("views/admin/login.html"));
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
  "inventory-management",
  "admin-profile",
  "add-product",
  "products",
  "edit-product",
];

adminPages.forEach((page) => {
  router.get(`/${page}`, adminAuthMiddleware, (req, res) => {
    res.sendFile(path.resolve(`views/admin/${page}.html`));
  });
});

// Edit category page — dynamic ID param
router.get("/edit-category/:id", adminAuthMiddleware, (req, res) => {
  res.sendFile(path.resolve("views/admin/edit-category.html"));
});

// Edit supplier page — dynamic ID param
router.get("/edit-supplier/:id", adminAuthMiddleware, (req, res) => {
  res.sendFile(path.resolve("views/admin/edit-supplier.html"));
});

router.post("/login", adminLogin);

export default router;