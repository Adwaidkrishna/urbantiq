import express from "express";
import {
  getUnlinkedBatches,
  linkBatch,
} from "../controllers/batchController.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// GET unlinked batches
router.get("/batches/unlinked", adminMiddleware, getUnlinkedBatches);

// PUT link batch to product variant
router.put("/batches/:id/link", adminMiddleware, linkBatch);

export default router;
