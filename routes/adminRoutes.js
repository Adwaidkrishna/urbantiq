import express from "express";
import path from "path";
import { adminLogin } from "../controllers/adminController.js";
import adminAuthMiddleware from "../middleware/adminMiddleware.js"


const router = express.Router();

router.get("/login", (req, res) => {
    res.sendFile(path.resolve("views/admin/login.html"));
});

router.get("/dashboard", adminAuthMiddleware, (req, res) => {
    res.sendFile(path.resolve("views/admin/dashboard.html"));
});

router.post("/login", adminLogin);

export default router;