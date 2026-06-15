import express from "express";

import {
    register,
    verifyOTP,
    resendOTP,
    login,
    forgotPassword,
    resendResetOTP,
    resetPassword,
    verifyResetOTP,
    getAuthStatus,
    logout,
    googleRedirect,
    googleCallback,
} from "../../controllers/auth/index.js";


const router = express.Router();

router.get("/google", googleRedirect);
router.get("/google/callback", googleCallback);

router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", login);
router.post("/forgot-password", forgotPassword)
router.post("/forgot-password/resend", resendResetOTP)
router.post("/verify-reset-otp", verifyResetOTP)
router.post("/reset-password", resetPassword)

// Auth status & logout
router.get("/status", getAuthStatus)
router.post("/logout", logout)


export default router;
