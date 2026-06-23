import { inventoryService } from "../../services/InventoryService.js";

/**
 * Reverses stock deductions for a cancelled or failed order.
 * This is primarily used for order cancellation or failure handling after checkout.
 * (During checkout, the MongoDB transaction automatically rolls back).
 */
export async function rollbackOrderStock(order, itemId = null) {
  try {
    let itemsToRollback = order.items;
    if (itemId) {
      const targetItem = order.items.id(itemId);
      if (targetItem) {
        itemsToRollback = [targetItem];
      }
    }
    await inventoryService.rollbackStock(itemsToRollback);
  } catch (error) {
    console.error("Error during stock rollback:", error);
    throw error;
  }
}
