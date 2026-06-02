/**
 * alerts.js — Global premium notification helpers for URBANTIQ Admin Panel
 * Wraps SweetAlert2 to match the dark admin design system.
 * Requires SweetAlert2 to be loaded before this script.
 */

// ── Base Toast Factory ──────────────────────────────────────────────────────
const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
});

// ── Public Helpers ──────────────────────────────────────────────────────────

/**
 * Show a green success toast.
 * @param {string} message
 */
function successToast(message) {
    Toast.fire({
        icon: "success",
        title: message,
        background: "#111827",
        color: "#F9FAFB",
        iconColor: "#34D399",
        customClass: {
            timerProgressBar: "admin-swal-progress-success",
            popup: "admin-swal-toast",
        },
    });
}

/**
 * Show a red error toast.
 * @param {string} message
 */
function errorToast(message) {
    Toast.fire({
        icon: "error",
        title: message,
        background: "#111827",
        color: "#F9FAFB",
        iconColor: "#F87171",
        customClass: {
            timerProgressBar: "admin-swal-progress-error",
            popup: "admin-swal-toast",
        },
    });
}

/**
 * Show an orange warning toast.
 * @param {string} message
 */
function warningToast(message) {
    Toast.fire({
        icon: "warning",
        title: message,
        background: "#111827",
        color: "#F9FAFB",
        iconColor: "#FBBF24",
        customClass: {
            timerProgressBar: "admin-swal-progress-warning",
            popup: "admin-swal-toast",
        },
    });
}

/**
 * Show a blue info toast.
 * @param {string} message
 */
function infoToast(message) {
    Toast.fire({
        icon: "info",
        title: message,
        background: "#111827",
        color: "#F9FAFB",
        iconColor: "#60A5FA",
        customClass: {
            timerProgressBar: "admin-swal-progress-info",
            popup: "admin-swal-toast",
        },
    });
}

/**
 * Show a premium confirmation dialog.
 * @param {Object} options
 * @param {string} options.title         — Dialog heading
 * @param {string} options.text          — Supporting message
 * @param {string} [options.confirmText] — Confirm button label (default: "Yes, proceed")
 * @param {string} [options.icon]        — SweetAlert2 icon type (default: "warning")
 * @returns {Promise<boolean>} — true if the user confirmed
 */
async function showConfirm({ title, text, confirmText = "Yes, proceed", icon = "warning" } = {}) {
    const result = await Swal.fire({
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: "Cancel",
        background: "#1F2937",
        color: "#F9FAFB",
        iconColor: "#FBBF24",
        confirmButtonColor: "#EF4444",
        cancelButtonColor: "#374151",
        reverseButtons: true,
        focusCancel: true,
        customClass: {
            popup: "admin-swal-modal",
            title: "admin-swal-modal-title",
            htmlContainer: "admin-swal-modal-text",
            confirmButton: "admin-swal-confirm-btn",
            cancelButton: "admin-swal-cancel-btn",
        },
    });
    return result.isConfirmed;
}
