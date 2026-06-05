import User from "../../models/User.js";

export const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.json({
            success: false,
            message: "User not found"
        });
    }

    if (user.otpExpire < Date.now()) {
        return res.json({
            success: false,
            message: "OTP expired"
        });
    }

    if (user.otp !== otp) {
        return res.json({
            success: false,
            message: "Invalid OTP"
        });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpire = null;

    await user.save();

    return res.json({
        success: true,
        message: "Email verified successfully",
        redirect: "/api/auth/login"
    });
};
