import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";

export const resetPassword = async (req, res) => {
    try {
        const { email, password, confirmPassword, token } = req.body;

        if (!token) {
            return res.json({
                success: false,
                message: "Reset token is required. Please verify your OTP first."
            });
        }

        if (password !== confirmPassword) {
            return res.json({
                success: false,
                message: "Passwords do not match"
            });
        }

        // Verify the JWT reset token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.json({
                success: false,
                message: "Invalid or expired reset token. Please restart the forgot password flow."
            });
        }

        // Assert token purpose
        if (decoded.purpose !== "password-reset") {
            return res.json({
                success: false,
                message: "Unauthorized token purpose."
            });
        }

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        // Additional sanity check to ensure the email matches the token user
        if (user.email !== email) {
            return res.json({
                success: false,
                message: "Token does not match the requested email address."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        user.resetOtp = undefined;
        user.resetOtpExpire = undefined;
        user.resetResendAvailableAt = undefined;

        await user.save();

        return res.json({
            success: true,
            redirect: "/login"
        });

    } catch (error) {
        console.error("Reset password error:", error);
        return res.json({
            success: false,
            message: "Server error during password reset"
        });
    }
};
