import User from "../../models/User.js";

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password -otp -otpExpire");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
