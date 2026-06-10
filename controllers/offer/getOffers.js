import Offer from "../../models/Offer.js";

export const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate("category", "name")
      .sort({ createdAt: -1 });
    res.status(200).json(offers);
  } catch (error) {
    console.error("Get Offers Error:", error);
    res.status(500).json({ message: error.message || "Error fetching offers" });
  }
};
