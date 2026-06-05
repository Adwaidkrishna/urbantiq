import User from "../../models/User.js";

export const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const addr = user.addresses.id(req.params.addressId);
    if (!addr) return res.status(404).json({ message: "Address not found" });

    const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, label, isDefault } = req.body;

    // If setting this as default, unset the others
    if (isDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }

    addr.fullName     = fullName     || addr.fullName;
    addr.phone        = phone        || addr.phone;
    addr.addressLine1 = addressLine1 || addr.addressLine1;
    addr.addressLine2 = addressLine2 ?? addr.addressLine2;
    addr.city         = city         || addr.city;
    addr.state        = state        || addr.state;
    addr.postalCode   = postalCode   || addr.postalCode;
    addr.country      = country      || addr.country;
    addr.label        = label        || addr.label;
    addr.isDefault    = isDefault    ?? addr.isDefault;

    await user.save();
    res.json({ message: "Address updated", addresses: user.addresses });
  } catch (err) {
    console.error("updateAddress error:", err);
    res.status(500).json({ message: "Failed to update address" });
  }
};
