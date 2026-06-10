import jwt from "jsonwebtoken";
import User from "../../models/User.js";

export const getAuthStatus = async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.json({ loggedIn: false });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("name email status");

        if (!user || user.status === "blocked") {
            res.clearCookie("token");
            return res.json({ loggedIn: false });
        }

        return res.json({
            loggedIn: true,
            user: { name: user.name, email: user.email }
        });

    } catch (err) {
        return res.json({ loggedIn: false });
    }
};
