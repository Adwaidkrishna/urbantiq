import express from "express";
import path from "path";

import {
    register,
    verifyOTP,
    resendOTP,
    login,
    forgotPassword,
    resetPassword,
    verifyResetOTP,
} from "../controllers/authController.js";


const router = express.Router();

router.get("/forgot-password", (req, res) => {
    res.sendFile(path.resolve("views/user/forgot-password.html"))
})

router.get("/verify-reset-otp", (req, res) => {
    res.sendFile(path.resolve("views/user/verify-reset-otp.html"))
})

router.get("/reset-password", (req, res) => {
    res.sendFile(path.resolve("views/user/reset-password.html"))
})

router.get("/register", (req, res) => {
    res.sendFile(path.resolve("views/user/register.html"));
});

router.get("/verify-email", (req, res) => {
    res.sendFile(path.resolve("views/user/verify-email.html"));
});

router.get("/login", (req, res) => {
    res.sendFile(path.resolve("views/user/login.html"));
});

router.get("/home", (req, res) => {
    res.sendFile(path.resolve("views/user/home.html"));
});


router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", login);
router.post("/forgot-password", forgotPassword)
router.post("/verify-reset-otp", verifyResetOTP)
router.post("/reset-password", resetPassword)


export default router;

