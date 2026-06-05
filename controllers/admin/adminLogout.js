export const adminLogout = (req, res) => {
    res.clearCookie("adminToken", { path: "/" });
    res.redirect("/api/admin/login");
};
