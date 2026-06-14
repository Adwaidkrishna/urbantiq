import bcrypt from "bcrypt";
import validator from "validator";
import otpGenerator from "otp-generator";
import User from "../../models/User.js";
import sendEmail from "../../utils/sendEmail.js";

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields required" });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid email" });
        }

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).{8,}$/;

        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: "Password must contain capital, small, number and symbol"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.json({
                success: false,
                message: "Email already registered"
            });
        }

        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
            digits: true
        });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            otp,
            otpExpire: Date.now() + 5 * 60 * 1000
        });

        await user.save();

        await sendEmail(email, otp);

        return res.json({
            success: true,
            redirect: `/verify-email?email=${email}`
        });

    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
};
