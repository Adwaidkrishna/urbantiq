import User from "../../models/User.js";

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
