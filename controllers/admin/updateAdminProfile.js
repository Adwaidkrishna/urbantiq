import Admin from "../../models/Admin.js";

export const updateAdminProfile = async (req, res) => {
    const { firstName, lastName, email, phone } = req.body;
    try {
        const admin = await Admin.findById(req.adminId);
        if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

        if (firstName) admin.firstName = firstName;
        if (lastName) admin.lastName = lastName;
        if (email) admin.email = email;
        if (phone !== undefined) admin.phone = phone;

        await admin.save();
        res.json({ success: true, message: "Profile updated successfully", admin });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
