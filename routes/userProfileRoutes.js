import express from "express";
import { getWallet, createWalletOrder, verifyWalletPayment } from "../controllers/walletController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/wallet", authMiddleware, getWallet);
router.post("/wallet/topup", authMiddleware, createWalletOrder);
router.post("/wallet/verify", authMiddleware, verifyWalletPayment);

export default router;
