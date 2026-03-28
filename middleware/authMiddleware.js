import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
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
        next();
    } catch (error) {
        if (isApiRequest) {
            return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
        }
        return res.redirect("/login");
    }
};

export default authMiddleware;