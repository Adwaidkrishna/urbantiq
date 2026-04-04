import Admin from "../models/adminModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const adminLogin = async (req, res) => {

    const { email, password } = req.body;

    try {

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({ message: "Admin not found" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("adminToken", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ message: "Admin login successful" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }

};

export const adminLogout = (req, res) => {
    res.clearCookie("adminToken", { path: "/" });
    res.redirect("/api/admin/login");
};

export const getAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId).select("-password");
        if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });
        res.json({ success: true, admin });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

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