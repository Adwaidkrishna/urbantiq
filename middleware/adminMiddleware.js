import jwt from "jsonwebtoken";

const adminAuthMiddleware = (req, res, next) => {

    const token = req.cookies.adminToken;

    if (!token) {
        return res.status(401).json({ message: "Admin not authenticated" });
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.adminId = decoded.id;

        next();

    } catch (error) {

        res.status(401).json({ message: "Invalid admin token" });

    }

};

export default adminAuthMiddleware;