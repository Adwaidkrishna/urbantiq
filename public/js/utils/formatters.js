/**
 * public/js/utils/formatters.js
 * ─────────────────────────────────────────────────────────
 * Shared formatting utilities for use across all page scripts.
 * Import only what you need in each controller.
 * ─────────────────────────────────────────────────────────
 */

// Format a number as Indian Rupees (₹1,299.00)
export function formatCurrency(amount, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// Format a date string for display
export function formatDate(
  dateStr,
  options = { day: "numeric", month: "short", year: "numeric" }
) {
  return new Date(dateStr).toLocaleDateString("en-IN", options);
}

// Format a date + time string
export function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Calculate estimated delivery date (+N days from order date)
export function estimatedDelivery(orderDateStr, daysToAdd = 7) {
  const d = new Date(orderDateStr);
  d.setDate(d.getDate() + daysToAdd);
  return formatDate(d.toISOString());
}

// Truncate long text with ellipsis
export function truncate(text, maxLength = 50) {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}
