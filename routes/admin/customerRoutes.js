import express from "express";
import { getCustomersList, toggleCustomerStatus } from "../../controllers/customer/index.js";
import adminAuthMiddleware from "../../middleware/adminMiddleware.js";

const router = express.Router();

// GET all customers (paginated, searchable)
router.get("/customers", adminAuthMiddleware, getCustomersList);

// GET all customers list (legacy/compatibility mapping)
router.get("/customers-list", adminAuthMiddleware, getCustomersList);

// PATCH toggle customer account status (block/unblock)
router.patch("/customers/:id/status", adminAuthMiddleware, toggleCustomerStatus);

export default router;
