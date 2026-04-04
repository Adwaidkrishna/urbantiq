/**
 * public/js/utils/dom.js
 * ─────────────────────────────────────────────────────────
 * Reusable DOM helper utilities for page controllers.
 * ─────────────────────────────────────────────────────────
 */

// Show an inline loading spinner inside a container element
export function showLoading(el, message = "Loading...") {
  if (!el) return;
  el.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-dark" role="status">
        <span class="visually-hidden">${message}</span>
      </div>
      <p class="mt-3 text-muted small">${message}</p>
    </div>
  `;
}

// Show an error message inside a container element
export function showError(el, message = "Something went wrong. Please try again.") {
  if (!el) return;
  el.innerHTML = `
    <div class="text-center py-5">
      <i class="bi bi-exclamation-triangle text-danger" style="font-size: 2.5rem;"></i>
      <p class="mt-3 text-danger">${message}</p>
    </div>
  `;
}

// Show an empty state message inside a container element
export function showEmptyState(el, { icon = "bi-inbox", title = "Nothing here", text = "", link = null, linkText = "Go back" } = {}) {
  if (!el) return;
  el.innerHTML = `
    <div class="text-center py-5">
      <i class="bi ${icon} text-muted" style="font-size: 3rem;"></i>
      <h4 class="mt-3">${title}</h4>
      ${text ? `<p class="text-muted">${text}</p>` : ""}
      ${link ? `<a href="${link}" class="btn btn-dark mt-2 rounded-pill px-4">${linkText}</a>` : ""}
    </div>
  `;
}

// Show a temporary toast notification
export function showToast(message, type = "success") {
  const colors = {
    success: "#28a745",
    error: "#dc3545",
    info: "#007bff",
    warning: "#ffc107",
  };

  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    background: ${colors[type] || colors.success}; color: white;
    padding: 14px 22px; border-radius: 12px; font-weight: 600;
    font-size: 0.9rem; box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    animation: fadeInUp 0.3s ease; max-width: 320px;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.4s ease";
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}
