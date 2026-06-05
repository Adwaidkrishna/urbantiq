import User from "../../models/User.js";

export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const addrIndex = user.addresses.findIndex(a => a._id.toString() === req.params.addressId);
    if (addrIndex === -1) return res.status(404).json({ message: "Address not found" });

    const wasDefault = user.addresses[addrIndex].isDefault;
    user.addresses.splice(addrIndex, 1);

    // If the deleted one was default, promote the first remaining
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({ message: "Address deleted", addresses: user.addresses });
  } catch (err) {
    console.error("deleteAddress error:", err);
    res.status(500).json({ message: "Failed to delete address" });
  }
};
