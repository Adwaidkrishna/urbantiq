import express from "express";
import path from "path";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Root route serves home page
router.get("/", (req, res) => {
  res.sendFile(path.resolve("views/user/home.html"));
});

// List of public pages that don't require authentication
const publicPages = [
  "home",
  "about",
  "contact",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "otp",
  "verify-email",
  "verify-reset-otp",
  "sale",
  "product",
];

// List of protected pages that require authentication
const protectedPages = [
  "cart",
  "wishlist",
  "account",
  "account-activity",
  "account-address",
  "account-cancel",
  "account-cancellations",
  "account-orders",
  "account-returns",
  "account-wallet",
  "checkout-details",
  "checkout-payment",
  "checkout-summary",
  "order-details",
  "order-success",
];

// Route for public pages
publicPages.forEach((page) => {
  router.get(`/${page}`, (req, res) => {
    res.sendFile(path.resolve(`views/user/${page}.html`));
  });
});

// Route for protected pages with authMiddleware
protectedPages.forEach((page) => {
  router.get(`/${page}`, authMiddleware, (req, res) => {
    res.sendFile(path.resolve(`views/user/${page}.html`));
  });
});

// Dynamic route for single product details
router.get("/product/:id", (req, res) => {
  res.sendFile(path.resolve("views/user/single-product.html"));
});

export default router;