import Supplier from "../../models/Supplier.js";

export const getSupplierById = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return res.status(404).json({ message: "Supplier not found" });
  }

  res.json(supplier);
};
