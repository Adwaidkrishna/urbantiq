import User from "../../models/User.js";

export const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.addresses.forEach(a => {
      a.isDefault = (a._id.toString() === req.params.addressId);
    });

    await user.save();
    res.json({ message: "Default address updated", addresses: user.addresses });
  } catch (err) {
    console.error("setDefaultAddress error:", err);
    res.status(500).json({ message: "Failed to set default address" });
  }
};
