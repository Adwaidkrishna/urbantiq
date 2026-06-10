import Offer from "../../models/Offer.js";
import { applyOffers } from "./offerUtils.js";

export const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, discountPercentage, category, startDate, endDate, status } = req.body;

    const existingOffer = await Offer.findById(id);
    if (!existingOffer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    const offerCategory = (category === "all" || category === "") ? null : (category || existingOffer.category);

    const updatedOffer = await Offer.findByIdAndUpdate(
      id,
      {
        title,
        discountPercentage,
        category: offerCategory,
        startDate: startDate || existingOffer.startDate,
        endDate: endDate || existingOffer.endDate,
        status: status || existingOffer.status
      },
      { new: true }
    );

    // Recalculate all products immediately
    await applyOffers(true);

    res.status(200).json({ success: true, message: "Offer updated successfully", offer: updatedOffer });
  } catch (error) {
    console.error("Update Offer Error:", error);
    res.status(500).json({ message: error.message || "Error updating offer" });
  }
};
