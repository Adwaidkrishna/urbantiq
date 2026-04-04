import User from "../models/User.js";
import bcrypt from "bcrypt";

// @desc GET current user profile
// @route GET /api/user-profile
// @access Private
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password -otp -otpExpire");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// @desc Update user profile (name, phone)
// @route PUT /api/user-profile
// @access Private
export const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;

        await user.save();
        res.json({ success: true, message: "Profile updated successfully", user: { name: user.name, email: user.email, phone: user.phone } });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// @desc Change user password
// @route PUT /api/user-profile/change-password
// @access Private
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

        // Basic validation for new password
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ message: "Password must contain capital, small, number and symbol (min 8 chars)" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ success: true, message: "Password changed successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
