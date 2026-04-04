/**
 * public/js/services/orderApiService.js
 * ─────────────────────────────────────────────────────────
 * Centralizes ALL order-related API calls.
 * Import this in any page controller that needs order data.
 * ─────────────────────────────────────────────────────────
 */

const BASE = "/api/orders";

// Fetch the logged-in user's full order history
export async function fetchMyOrders() {
  const res = await fetch(`${BASE}/my-orders`);
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

// Fetch a single order by its MongoDB ID
export async function fetchOrderById(id) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error("Order not found");
  return res.json();
}

// Pre-flight stock check before checkout
export async function validateStock(items) {
  const res = await fetch(`${BASE}/validate-stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  return res.json();
}

// Place a new order
export async function placeOrder(orderPayload) {
  const res = await fetch(`${BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderPayload),
  });
  return res.json();
}

// Cancel an existing order
export async function cancelOrder(orderId) {
  const res = await fetch(`${BASE}/${orderId}/cancel`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}

// Submit a return request for a delivered order
export async function requestReturn(orderId) {
  const res = await fetch(`${BASE}/${orderId}/return-request`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}
