import User from "../../models/User.js";

export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("addresses");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
};
