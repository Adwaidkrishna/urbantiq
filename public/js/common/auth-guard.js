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

                const query = e.target.value.trim();
                clearTimeout(searchTimeout);
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


    /* ── search suggestions ────────────────────────────── */
    function initSearchSuggestions() {
        const searchContainers = document.querySelectorAll('.search-container');
        
        searchContainers.forEach(container => {
            const input = container.querySelector('.search-input');
            if (!input) return;

            // Create suggestions dropdown
            const suggestionsDiv = document.createElement('div');
            suggestionsDiv.className = 'search-suggestions';
            container.appendChild(suggestionsDiv);

            let searchTimeout;

            const fetchSuggestions = async (query) => {
                if (query.length < 2) {
                    suggestionsDiv.classList.remove('show');
                    return;
                }

                suggestionsDiv.innerHTML = '<div class="suggestions-loading" style="padding:16px;text-align:center;"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></div>';
                suggestionsDiv.classList.add('show');

                try {
                    const res = await fetch(`/api/search-suggestions?q=${encodeURIComponent(query)}`);
                    const data = await res.json();

                    if (!data.success || data.products.length === 0) {
                        suggestionsDiv.innerHTML = '<div class="suggestions-empty" style="padding: 12px 16px; color: #86868b; font-size: 0.9rem;">No products found</div>';
                        return;
                    }

                    suggestionsDiv.innerHTML = data.products.map(p => {
                        const img = p.image ? `/images/products/${p.image}` : '/images/placeholder.png';
                        let priceHtml = '';
                        if (p.offerPrice && p.offerPrice < p.price) {
                            priceHtml = `<span class="suggestion-price suggestion-price-discounted">₹${p.offerPrice.toLocaleString('en-IN')}</span>
                                         <span class="suggestion-price-original" style="text-decoration: line-through; font-size: 0.75rem; color: #86868b; margin-left: 6px;">₹${p.price.toLocaleString('en-IN')}</span>`;
                        } else {
                            priceHtml = `<span class="suggestion-price">₹${p.price.toLocaleString('en-IN')}</span>`;
                        }

                        return `
                            <a href="/product/${p._id}" class="suggestion-item" onmousedown="event.preventDefault()">
                                <img src="${img}" alt="${p.name}" class="suggestion-image">
                                <div class="suggestion-details">
                                    <span class="suggestion-name">${p.name}</span>
                                    <span class="suggestion-category">${p.category}</span>
                                    <div class="suggestion-price-container">
                                        ${priceHtml}
                                    </div>
                                </div>
                            </a>
                        `;
                    }).join('');

                } catch (err) {
                    console.error("Search suggestions error:", err);
                    suggestionsDiv.innerHTML = '<div class="suggestions-empty" style="padding: 12px 16px; color: #86868b; font-size: 0.9rem;">Error loading suggestions</div>';
                }
            };

            input.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    fetchSuggestions(query);
                }, 250); // debounce 250ms
            });

            input.addEventListener('focus', (e) => {
                const query = e.target.value.trim();
                if (query.length >= 2 && suggestionsDiv.innerHTML !== '') {
                    suggestionsDiv.classList.add('show');
                }
            });

            input.addEventListener('blur', () => {
                suggestionsDiv.classList.remove('show');
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    suggestionsDiv.classList.remove('show');
                    input.blur();
                } else if (e.key === 'Enter') {
                    const query = input.value.trim();
                    if (query) {
                        window.location.href = `/product?search=${encodeURIComponent(query)}`;
                    }
                }
            });

            // Search icon click fallback
            const icon = container.querySelector('.bi-search');
            if (icon) {
                icon.style.cursor = 'pointer';
                icon.addEventListener('click', () => {
                    const query = input.value.trim();
                    if (query) {
                        window.location.href = `/product?search=${encodeURIComponent(query)}`;
                    }
                });
            }

            // Close on click outside
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    suggestionsDiv.classList.remove('show');
                }
            });
        });
    }

    /* ── auto-run navbar init on every page ──────────────── */
    document.addEventListener("DOMContentLoaded", () => {
        initNavbar();
        updateCartBadge();
        updateWishlistBadge();
        initSearchSuggestions();
    });

    return { requireAuth, fetchStatus, clearCache, updateCartBadge, updateWishlistBadge, showToast, initSearchSuggestions };

})();
