export const logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax",
        secure: false
    });

    return res.json({ success: true, message: "Logged out successfully" });
};
