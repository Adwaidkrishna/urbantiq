import User from "../../models/User.js";

export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, label, isDefault } = req.body;

    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // If this is set as default, unset all others
    if (isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    // First address is always the default
    const setDefault = isDefault || user.addresses.length === 0;

    user.addresses.push({
      fullName, phone, addressLine1,
      addressLine2: addressLine2 || "",
      city, state, postalCode,
      country: country || "India",
      label: label || "Home",
      isDefault: setDefault
    });

    await user.save();
    res.status(201).json({ message: "Address added", addresses: user.addresses });
  } catch (err) {
    console.error("addAddress error:", err);
    res.status(500).json({ message: "Failed to add address" });
  }
};
