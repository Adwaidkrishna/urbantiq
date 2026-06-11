import User from "../../models/User.js";
import mongoose from "mongoose";

export const toggleCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid customer ID format" });
    }

    if (!status || !["active", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Status must be either 'active' or 'blocked'" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select("-password -otp -otpExpire");

    if (!updatedUser) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({
      message: `Customer account successfully ${status === 'blocked' ? 'blocked' : 'unblocked'}.`,
      customer: updatedUser
    });

  } catch (error) {
    console.error("Error in toggleCustomerStatus controller:", error);
    res.status(500).json({ message: "Internal server error while updating customer status" });
  }
};
