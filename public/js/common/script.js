/* public/js/script.js
   Shared interactive behaviours for URBANTIQ
   ------------------------------------------ */

document.addEventListener('DOMContentLoaded', () => {

    /* --------------------------------------------------
       1. WISHLIST BUTTON TOGGLE (Static items)
       -------------------------------------------------- */
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.toggle('active');
            const icon = this.querySelector('i');
            if (this.classList.contains('active')) {
                this.style.color = '#ff3b30';
                this.style.background = 'white';
                if (icon) {
                    icon.classList.replace('bi-heart', 'bi-heart-fill');
                }
            } else {
                this.style.color = '';
                this.style.background = '';
                if (icon) {
                    icon.classList.replace('bi-heart-fill', 'bi-heart');
                }
            }
        });
    });

    /* --------------------------------------------------
       2. CART BUTTON FEEDBACK (Static items)
       -------------------------------------------------- */
    document.querySelectorAll('.cart-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.replace('bi-cart3', 'bi-cart-check-fill');
                setTimeout(() => {
                    icon.classList.replace('bi-cart-check-fill', 'bi-cart3');
                }, 1000);
            }
        });
    });

    /* --------------------------------------------------
       3. ACCOUNT SIDEBAR TOGGLE
       -------------------------------------------------- */
    const sidebarToggle = document.querySelector('.sidebar-mobile-toggle');
    const sidebar = document.querySelector('.account-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (sidebarToggle && sidebar && overlay) {
        const openSidebar = () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        };
        const closeSidebar = () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        };
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.contains('active') ? closeSidebar() : openSidebar();
        });
        overlay.addEventListener('click', closeSidebar);
    }

    /* --------------------------------------------------
       4. GLOBAL NAVBAR COLLAPSE
       -------------------------------------------------- */
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');

    if (navbarToggler && navbarCollapse) {
        navbarToggler.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = navbarCollapse.classList.contains('show');
            navbarCollapse.classList.toggle('show', !isOpen);
            document.documentElement.classList.toggle('nav-open', !isOpen);
        });

        document.addEventListener('click', e => {
            if (navbarCollapse.classList.contains('show') && !navbarCollapse.contains(e.target) && !navbarToggler.contains(e.target)) {
                navbarCollapse.classList.remove('show');
                document.documentElement.classList.remove('nav-open');
            }
        });
    }

    /* --------------------------------------------------
       5. DYNAMIC INTERACTION LISTENERS (AJAX Cart/Wishlist)
       -------------------------------------------------- */
    function attachDynamicListeners() {
        document.querySelectorAll('.wishlist-btn-dynamic').forEach(btn => {
            btn.addEventListener('click', async function (e) {
                e.preventDefault();
                e.stopPropagation();
                const allowed = await window.AuthGuard.requireAuth(window.location.href);
                if (!allowed) return;

                const productId = this.dataset.id;
                try {
                    const res = await fetch("/api/wishlist/toggle", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ productId })
                    });
                    const data = await res.json();
                    if (data.success) {
                        window.AuthGuard.updateWishlistBadge();
                        const icon = this.querySelector('i');
                        if (data.added) {
                            icon.classList.replace('bi-heart', 'bi-heart-fill');
                            this.style.color = '#ef4444';
                            window.AuthGuard.showToast("Product added to wishlist!");
                        } else {
                            icon.classList.replace('bi-heart-fill', 'bi-heart');
                            this.style.color = '';
                            window.AuthGuard.showToast("Removed from wishlist.");
                        }
                    }
                } catch (err) { }
            });
        });

        document.querySelectorAll('.cart-btn-dynamic').forEach(btn => {
            btn.addEventListener('click', async function (e) {
                e.preventDefault();
                e.stopPropagation();

                const allowed = await window.AuthGuard.requireAuth(window.location.href);
                if (!allowed) return;

                const productId = this.dataset.id;
                try {
                    const pRes = await fetch(`/api/products/${productId}`);
                    const pData = await pRes.json();

                    if (pData.success && pData.product && pData.product.variants) {
                        const p = pData.product;
                        const defaultVariant = p.variants[0];
                        const defaultSize = defaultVariant.sizes?.find(s => s.stock > 0);

                        if (defaultVariant && defaultSize) {
                            const addRes = await fetch("/api/cart/add", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    productId,
                                    variantId: defaultVariant._id,
                                    size: defaultSize.size,
                                    quantity: 1
                                })
                            });
                            const addData = await addRes.json();
                            if (addData.success) {
                                window.AuthGuard.updateCartBadge();
                                window.AuthGuard.showToast("Product added to cart!");
                                return;
                            }
                        }
                    }
                    window.location.href = `/product/${productId}`;
                } catch (err) {
                    window.location.href = `/product/${productId}`;
                }
            });
        });
    }

    // Expose dynamically globally so homeProducts.js can invoke it
    window.attachDynamicListeners = attachDynamicListeners;

});

