import Supplier from "../../models/Supplier.js";

export const updateSupplier = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return res.status(404).json({ message: "Supplier not found" });
  }

  const { name, companyName, contactNumber, status } = req.body;

  supplier.name = name || supplier.name;
  supplier.companyName = companyName || supplier.companyName;
  supplier.contactNumber = contactNumber || supplier.contactNumber;
  supplier.status = status || supplier.status;

  const updated = await supplier.save();
  res.json(updated);
};
