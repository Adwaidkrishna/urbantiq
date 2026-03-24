import express from "express";
import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../controllers/SupplierController.js";

import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// CREATE
router.post("/", adminMiddleware, createSupplier);

// GET ALL
router.get("/list", adminMiddleware, getSuppliers);

// GET ONE
router.get("/:id", adminMiddleware, getSupplierById);

// UPDATE
router.put("/:id", adminMiddleware, updateSupplier);

// DELETE
router.delete("/:id", adminMiddleware, deleteSupplier);

export default router;