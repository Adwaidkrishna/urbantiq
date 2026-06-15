import User from "../../models/User.js";
import jwt from "jsonwebtoken";

export const verifyResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email) {
            return res.json({
                success: false,
                message: "Email is required"
            });
        }

        if (!otp) {
            return res.json({
                success: false,
                message: "OTP is required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        // Explicitly check if resetOtp exists in DB
        if (!user.resetOtp || !user.resetOtpExpire) {
            return res.json({
                success: false,
                message: "No password reset request found. Please request a new OTP."
            });
        }

        // Validate expiration
        if (new Date(user.resetOtpExpire).getTime() < Date.now()) {
            return res.json({
                success: false,
                message: "OTP expired"
            });
        }

        // Validate match (using strict comparison after trim/tostring conversion)
        if (user.resetOtp !== otp.toString().trim()) {
            return res.json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // OTP verified successfully - invalidate immediately to prevent replay attacks
        user.resetOtp = undefined;
        user.resetOtpExpire = undefined;
        await user.save();

        // Generate a temporary JWT reset token
        const resetToken = jwt.sign(
            { userId: user._id, purpose: "password-reset" },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
        );

        return res.json({
            success: true,
            resetToken,
            redirect: "/reset-password"
        });

    } catch (error) {
        console.error("Verify reset OTP error:", error);
        return res.json({
            success: false,
            message: "Server error during verification"
        });
    }
};
