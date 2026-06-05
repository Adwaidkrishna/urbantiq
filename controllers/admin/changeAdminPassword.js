import Admin from "../../models/Admin.js";
import bcrypt from "bcryptjs";

export const changeAdminPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const admin = await Admin.findById(req.adminId);
        if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Incorrect current password" });

        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(newPassword, salt);
        await admin.save();

        res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
