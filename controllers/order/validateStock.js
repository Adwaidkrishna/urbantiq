import { inventoryService } from "../../services/InventoryService.js";

export const validateStock = async (req, res) => {
  try {
    if (!req.body) {
        return res.status(500).json({ message: "Request body is missing on server" });
    }
    const { items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: "No items to validate" });

    // Validate using the shared service
    await inventoryService.validateStock(items);

    res.json({ success: true, message: "Stock validated" });
  } catch (error) {
    console.error("Validate Stock Error Stack:", error.stack);
    
    // We send back 400 for validation errors, 500 for other server errors
    // The service throws an error with a message that is user friendly for validation
    res.status(400).json({ 
      success: false, 
      message: error.message || "Internal validation error" 
    });
  }
};
