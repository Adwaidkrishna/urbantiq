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

        if (!user.isVerified) {
            return res.json({
                success: false,
                message: "Please verify your email first"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({
                success: false,
                message: "Invalid password"
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
            redirect: "/api/auth/home"
        });

    } catch (error) {
        console.error(error);
        return res.json({
            success: false,
            message: "Server error"
        });
    }
};
