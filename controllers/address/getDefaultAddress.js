import User from "../../models/User.js";

export const getDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("addresses name email");
    if (!user) return res.status(404).json({ message: "User not found" });

    const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0] || null;
    res.json({ address: defaultAddr, name: user.name, email: user.email });
  } catch (err) {
    console.error("getDefaultAddress error:", err);
    res.status(500).json({ message: "Failed to fetch default address" });
  }
};
