window.AuthGuard = (() => {

    let _status = null; // cached: { loggedIn, user }

    /* ── fetch once and cache ─────────────────────────────── */
    async function fetchStatus(bustCache = false) {
        if (!bustCache && _status !== null) return _status;
        try {
            const res = await fetch("/api/auth/status");
            _status = await res.json();
        } catch {
            _status = { loggedIn: false };
        }
        return _status;
    }

    /* ── clear cached status (call before logout redirect) ── */
    function clearCache() {
        _status = null;
    }

    /* ── update navbar based on auth state ───────────────── */
    async function initNavbar() {
        const status = await fetchStatus();

        /* 1. Find Login & Signup <li> items inside .navbar-nav by link text */
        let loginLi = null;
        let signupLi = null;

        document.querySelectorAll(".navbar-nav .nav-item").forEach(li => {
            const a = li.querySelector("a.nav-link");
            if (!a) return;
            const text = a.textContent.trim().toLowerCase();
            if (text === "login") loginLi = li;
            if (text === "signup") signupLi = li;
        });

        /* 2. Profile icon — the anchor with title="Profile" in the icon bar */
        const profileIcon = document.querySelector('a.icon-btn[title="Profile"]');

        if (status.loggedIn) {
            /* ── LOGGED IN: hide Login & Signup ── */
            if (loginLi) loginLi.style.display = "none";
            if (signupLi) signupLi.style.display = "none";
            
            if (profileIcon) {
                profileIcon.style.display = "";
                profileIcon.href = "/account"; // always use Express route
            }
        } else {
            /* ── GUEST: ensure Login + Signup exist, hide profile icon ── */

            // If Signup exists but Login doesn't, inject Login before Signup
            if (signupLi && !loginLi) {
                const li = document.createElement("li");
                li.className = "nav-item";
                li.innerHTML = `<a class="nav-link" href="/login">Login</a>`;
                signupLi.insertAdjacentElement("beforebegin", li);
            }

            // Fix any lingering relative href on Signup link
            if (signupLi) {
                const a = signupLi.querySelector("a");
                if (a && !a.getAttribute("href").startsWith("/")) {
                    a.setAttribute("href", "/register");
                }
                signupLi.style.display = "";
            }

            // Hide profile icon for guests
            if (profileIcon) profileIcon.style.display = "none";
        }
    }

    /* ── update cart badge count ─────────────────────────── */
    async function updateCartBadge() {
        const badge = document.querySelector(".cart-badge");
        if (!badge) return;

        const status = await fetchStatus();
        if (!status.loggedIn) {
            badge.textContent = "0";
            badge.style.display = "none";
            return;
        }

        try {
            const res = await fetch("/api/cart");
            const data = await res.json();
            if (data.success) {
                const count = data.items.length;
                badge.textContent = count;
                badge.style.display = count > 0 ? "flex" : "none";
            }
        } catch (err) {
            console.error("Cart badge update error:", err);
        }
    }

    /* ── update wishlist badge count ─────────────────────── */
    async function updateWishlistBadge() {
        const badge = document.querySelector(".wishlist-badge");
        if (!badge) return;

        const status = await fetchStatus();
        if (!status.loggedIn) {
            badge.textContent = "0";
            badge.style.display = "none";
            return;
        }

        try {
            const res = await fetch("/api/wishlist");
            const data = await res.json();
            if (data.success) {
                const count = data.products.length;
                badge.textContent = count;
                badge.style.display = count > 0 ? "flex" : "none";
            }
        } catch (err) {
            console.error("Wishlist badge update error:", err);
        }
    }

    /* ── guard a protected action ─────────────────────────── */
    async function requireAuth(redirectAfterLogin = window.location.href) {
        const status = await fetchStatus();
        if (!status.loggedIn) {
            const encoded = encodeURIComponent(redirectAfterLogin);
            window.location.href = `/login?redirect=${encoded}`;
            return false;
        }
        return true;
    }

    /* ── toast notifications ────────────────────────── */
    function showToast(message, type = 'success') {
        let container = document.querySelector(".toast-container");
        if (!container) {
            container = document.createElement("div");
            container.className = "toast-container";
            document.body.appendChild(container);
        }

        const icon = type === 'success' ? 'bi-check-circle-fill' : (type === 'error' ? 'bi-exclamation-circle-fill' : 'bi-info-circle-fill');
        const toast = document.createElement("div");
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <i class="bi ${icon}"></i> 
            <div class="toast-label">
                <span class="toast-text">${message}</span>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove with exit animation
        setTimeout(() => {
            toast.style.animation = "toast-out 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards";
            setTimeout(() => toast.remove(), 500);
        }, 3500);
    }


    /* ── auto-run navbar init on every page ──────────────── */
    document.addEventListener("DOMContentLoaded", () => {
        initNavbar();
        updateCartBadge();
        updateWishlistBadge();
    });

    return { requireAuth, fetchStatus, clearCache, updateCartBadge, updateWishlistBadge, showToast };

})();

