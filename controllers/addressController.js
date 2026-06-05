import User from "../models/User.js";


export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("addresses");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
};


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
