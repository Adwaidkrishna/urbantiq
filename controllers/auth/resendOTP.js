import User from "../../models/User.js";
import sendEmail from "../../utils/sendEmail.js";

export const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        // generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        user.otp = otp;
        user.otpExpire = Date.now() + 5 * 60 * 1000;

        await user.save();

        await sendEmail(email, otp);

        return res.json({
            success: true,
            message: "OTP sent again to your email"
        });

    } catch (error) {
        console.error(error);
        return res.json({
            success: false,
            message: "Failed to resend OTP"
        });
    }
};
