/**
 * public/js/services/cartApiService.js
 * ─────────────────────────────────────────────────────────
 * Centralizes ALL cart-related API calls.
 * ─────────────────────────────────────────────────────────
 */

const BASE = "/api/cart";

// Fetch the current user's cart
export async function fetchCart() {
  const res = await fetch(`${BASE}`);
  if (!res.ok) throw new Error("Failed to fetch cart");
  return res.json();
}

// Add an item to the cart
export async function addToCart(productId, variantId, size, quantity = 1) {
  const res = await fetch(`${BASE}/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, variantId, size, quantity }),
  });
  return res.json();
}

// Update item quantity in cart
export async function updateCartQuantity(productId, variantId, size, quantity) {
  const res = await fetch(`${BASE}/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, variantId, size, quantity }),
  });
  return res.json();
}

// Remove a specific item from the cart
export async function removeFromCart(productId, variantId, size) {
  const res = await fetch(`${BASE}/remove`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, variantId, size }),
  });
  return res.json();
}
