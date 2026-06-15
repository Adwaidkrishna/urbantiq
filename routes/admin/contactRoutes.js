import express from "express";
import { getContacts } from "../../controllers/contact/index.js";
import adminAuthMiddleware from "../../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/contacts", adminAuthMiddleware, getContacts);

export default router;
