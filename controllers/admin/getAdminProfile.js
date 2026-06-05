import Admin from "../../models/Admin.js";

export const getAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId).select("-password");
        if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });
        res.json({ success: true, admin });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
