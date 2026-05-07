import Supplier from "../models/SupplierModel.js";

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

    const supplier = await Supplier.create({
      name,
      companyName,
      contactNumber,
    });

    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const getSuppliers = async (req, res) => {
  const suppliers = await Supplier.find().sort({ createdAt: -1 });
  res.json(suppliers);
};

export const getSupplierById = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return res.status(404).json({ message: "Supplier not found" });
  }

  res.json(supplier);
};

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

export const deleteSupplier = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return res.status(404).json({ message: "Supplier not found" });
  }

  await supplier.deleteOne();

  res.json({ message: "Supplier deleted" });
};