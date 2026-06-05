import User from "../../models/User.js";
import bcrypt from "bcrypt";

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.password) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });
        }

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
