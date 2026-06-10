import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;
    const isApiRequest = req.originalUrl.startsWith("/api/");

    if (!token) {
        if (isApiRequest) {
            return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
        }
        return res.redirect("/login");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;

        // Fetch user status from database
        const user = await User.findById(req.userId).select("status");

        if (!user) {
            res.clearCookie("token");
            if (isApiRequest) {
                return res.status(401).json({ success: false, message: "User not found. Please log in again." });
            }
            return res.redirect("/login");
        }

        if (user.status === "blocked") {
            res.clearCookie("token");
            if (isApiRequest) {
                return res.status(403).json({ success: false, message: "Your account has been blocked. Please contact support." });
            }
            return res.redirect("/login?error=Your account has been blocked. Please contact support.");
        }

        next();
    } catch (error) {
        if (isApiRequest) {
            return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
        }
        return res.redirect("/login");
    }
};

export default authMiddleware;