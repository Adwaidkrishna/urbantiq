import Supplier from "../../models/Supplier.js";

export const getSuppliers = async (req, res) => {
  const suppliers = await Supplier.find().sort({ createdAt: -1 });
  res.json(suppliers);
};
