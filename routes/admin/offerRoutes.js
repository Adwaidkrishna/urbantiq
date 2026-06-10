import express from "express";
import { getOffers, createOffer, updateOffer, deleteOffer } from "../../controllers/offer/index.js";
import adminAuthMiddleware from "../../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/offers", adminAuthMiddleware, getOffers);
router.post("/offers", adminAuthMiddleware, createOffer);
router.put("/offers/:id", adminAuthMiddleware, updateOffer);
router.delete("/offers/:id", adminAuthMiddleware, deleteOffer);

export default router;
