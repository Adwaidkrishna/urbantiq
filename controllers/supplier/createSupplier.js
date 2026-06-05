import Supplier from "../../models/Supplier.js";

export const createSupplier = async (req, res) => {
  try {
    const { name, companyName, contactNumber } = req.body;

    if (!name || !companyName || !contactNumber) {
      return res.status(400).json({ message: "All fields required" });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(contactNumber)) {
      return res.status(400).json({ message: "Invalid contact number" });
    }

    const supplier = await Supplier.create({ name, companyName, contactNumber });
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
