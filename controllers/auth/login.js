import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.password) {
            return res.json({
                success: false,
                message: "This account was registered using Google. Please log in with Google."
            });
        }

        if (user.status === "blocked") {
            return res.json({
                success: false,
                message: "Your account has been blocked. Please contact support."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({
                success: false,
                message: "Invalid password"
            });
        }

        if (!user.isVerified) {
            // Check if user already has a valid (non-expired) OTP
            if (user.otp && user.otpExpire > Date.now()) {
                return res.status(200).json({
                    success: false,
                    requiresVerification: true,
                    redirect: `/verify-email?email=${email}`,
                    message: "A verification code has already been sent. Please check your email."
                });
            }

            // OTP expired or missing — tell user to resend from verify page
            return res.json({
                success: false,
                requiresVerification: true,
                redirect: `/verify-email?email=${email}`,
                message: "Your verification code has expired. Please resend a new code."
            });
        }

        /* ---------- GENERATE TOKEN ---------- */
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        /* ---------- SEND COOKIE ---------- */
        res.cookie("token", token, {
            httpOnly: true, // hacker injects JavaScript (XSS attack), they cannot steal the token.
            secure: false, // cookie works only on HTTPS if true
            sameSite: "lax", // CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
            success: true,
            message: "Login successful",
            redirect: "/"
        });

    } catch (error) {
        console.error(error);
        return res.json({
            success: false,
            message: "Server error"
        });
    }
};
