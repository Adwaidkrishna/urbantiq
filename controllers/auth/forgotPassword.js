import User from "../../models/User.js";
import sendEmail from "../../utils/sendEmail.js";

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);

        user.otp = otp;
        user.otpExpire = Date.now() + 5 * 60 * 1000;

        await user.save();

        await sendEmail(email, otp);

        return res.json({
            success: true,
            redirect: `/verify-reset-otp?email=${email}`
        });

    } catch (err) {
        console.log(err);
        return res.json({
            success: false,
            message: "Server error"
        });
    }
};
