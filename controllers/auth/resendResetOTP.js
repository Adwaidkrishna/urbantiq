import User from "../../models/User.js";
import sendEmail from "../../utils/sendEmail.js";

export const resendResetOTP = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        const now = Date.now();

        // Check if cooldown is active
        if (user.resetResendAvailableAt && user.resetResendAvailableAt > now) {
            const remainingTime = Math.ceil((user.resetResendAvailableAt - now) / 1000);
            return res.status(429).json({
                success: false,
                message: "Please wait before requesting another OTP.",
                remainingTime
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetOtp = otp;
        user.resetOtpExpire = now + 5 * 60 * 1000;
        user.resetResendAvailableAt = now + 60 * 1000;

        await user.save();

        await sendEmail(email, otp);

        return res.json({
            success: true,
            message: "OTP sent successfully.",
            remainingTime: 60
        });

    } catch (err) {
        console.error("Resend reset OTP error:", err);
        return res.json({
            success: false,
            message: "Failed to resend OTP"
        });
    }
};
