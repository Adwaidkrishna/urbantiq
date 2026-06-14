import User from "../../models/User.js";

export const verifyResetOTP = async (req, res) => {
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

    if (user.otp != otp) {
        return res.json({
            success: false,
            message: "Invalid OTP"
        });
    }

    return res.json({
        success: true,
        redirect: `/reset-password?email=${email}`
    });
};
