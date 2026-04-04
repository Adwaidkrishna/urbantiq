import express from "express";
import { getWallet, createWalletOrder, verifyWalletPayment } from "../controllers/walletController.js";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress
} from "../controllers/addressController.js";
import { getProfile, updateProfile, changePassword } from "../controllers/profileController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Profile routes
router.get("/", authMiddleware, getProfile);
router.put("/", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);

// Wallet routes
router.get("/wallet", authMiddleware, getWallet);
router.post("/wallet/topup", authMiddleware, createWalletOrder);
router.post("/wallet/verify", authMiddleware, verifyWalletPayment);

// Address routes
router.get("/addresses/default", authMiddleware, getDefaultAddress);
router.get("/addresses", authMiddleware, getAddresses);
router.post("/addresses", authMiddleware, addAddress);
router.put("/addresses/:addressId", authMiddleware, updateAddress);
router.delete("/addresses/:addressId", authMiddleware, deleteAddress);
router.patch("/addresses/:addressId/set-default", authMiddleware, setDefaultAddress);

export default router;
