import Offer from "../../models/Offer.js";
import { applyOffers } from "./offerUtils.js";

export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const existingOffer = await Offer.findById(id);
    if (!existingOffer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    await Offer.findByIdAndDelete(id);

    // Recalculate all products immediately (reverting products to original price/custom offer)
    await applyOffers(true);

    res.status(200).json({ success: true, message: "Offer deleted successfully" });
  } catch (error) {
    console.error("Delete Offer Error:", error);
    res.status(500).json({ message: error.message || "Error deleting offer" });
  }
};
