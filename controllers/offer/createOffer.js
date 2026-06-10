import Offer from "../../models/Offer.js";
import { applyOffers } from "./offerUtils.js";

export const createOffer = async (req, res) => {
  try {
    const { title, discountPercentage, category, startDate, endDate, status } = req.body;

    if (!title || !discountPercentage || !endDate) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const offerCategory = (category === "all" || !category) ? null : category;

    const offer = new Offer({
      title,
      discountPercentage,
      category: offerCategory,
      startDate: startDate || new Date(),
      endDate,
      status: status || "active"
    });

    const savedOffer = await offer.save();
    
    // Recalculate all products immediately
    await applyOffers(true);

    res.status(201).json({ success: true, message: "Offer created successfully", offer: savedOffer });
  } catch (error) {
    console.error("Create Offer Error:", error);
    res.status(500).json({ message: error.message || "Error creating offer" });
  }
};
