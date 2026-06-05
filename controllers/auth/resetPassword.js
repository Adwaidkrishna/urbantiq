import bcrypt from "bcrypt";
import User from "../../models/User.js";

export const resetPassword = async (req, res) => {
    const { email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.json({
            success: false,
            message: "Passwords do not match"
        });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.json({
            success: false,
            message: "User not found"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.otp = null;
    user.otpExpire = null;

    await user.save();

    return res.json({
        success: true,
        redirect: "/api/auth/login"
    });
};
