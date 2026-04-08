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
       5. HOME PAGE PRODUCT LOADERS (New & Top)
       -------------------------------------------------- */
    async function initHomeProducts() {
        const arrivalGrid = document.getElementById("newArrivalsGrid");
        const sellingGrid = document.getElementById("topSellingGrid");
        if (!arrivalGrid && !sellingGrid) return;

        try {
            const res = await fetch("/api/products");
            const data = await res.json();

            if (data.success && data.products) {
                // Populate New Arrivals (Latest 4)
                if (arrivalGrid) {
                    const arrivals = data.products.slice(0, 4);
                    renderHomeProductGrid(arrivalGrid, arrivals);
                }
                // Populate Top Selling (Next 4)
                if (sellingGrid) {
                    const topSelling = data.products.slice(4, 8);
                    renderHomeProductGrid(sellingGrid, topSelling);
                }
                attachDynamicListeners();
            }
        } catch (error) {
            console.error("Home products error:", error);
        }
    }

    function renderHomeProductGrid(container, products) {
        container.innerHTML = "";
        products.forEach(p => {
            const mainImg = (p.variants?.[0]?.images?.[0]) ? `/images/products/${p.variants[0].images[0]}` : '/images/user/phoodie.jpeg';
            const col = document.createElement("div");
            col.className = "col-6 col-md-4 col-lg-3";
            
            let colorHtml = "";
            if(p.variants) {
                p.variants.slice(0, 3).forEach(v => {
                    colorHtml += `<span class="color-dot" style="background: ${v.color};" title="${v.colorName || ''}"></span>`;
                });
            }

            col.innerHTML = `
                <div class="product-card">
                    <div class="product-img-wrap">
                        ${ (new Date() - new Date(p.createdAt)) < 7*24*60*60*1000 ? '<span class="product-badge badge-dark">New</span>' : '' }
                        <div class="floating-actions">
                            <button class="action-btn wishlist-btn-dynamic" data-id="${p._id}"><i class="bi bi-heart"></i></button>
                            <button class="action-btn cart-btn-dynamic" data-id="${p._id}"><i class="bi bi-cart3"></i></button>
                        </div>
                        <a href="/product/${p._id}">
                            <img src="${mainImg}" alt="${p.name}">
                        </a>
                    </div>
                    <div class="product-info">
                        <div class="product-category">${p.category?.name || 'Men'}</div>
                        <h4 class="product-title"><a href="/product/${p._id}">${p.name}</a></h4>
                        <div class="product-rating">
                            <i class="bi bi-star-fill rating-star"></i>
                            <span>4.8</span>
                            <span class="review-count">(234)</span>
                        </div>
                        <div class="product-colors">${colorHtml}</div>
                        <div class="product-bottom">
                            <div class="product-price">₹${p.offerPrice || p.price}</div>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(col);
        });
    }

    function attachDynamicListeners() {
        document.querySelectorAll('.wishlist-btn-dynamic').forEach(btn => {
            btn.addEventListener('click', async function(e) {
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
                    if(data.success) {
                        window.AuthGuard.updateWishlistBadge();
                        const icon = this.querySelector('i');
                        if(data.added) {
                            icon.classList.replace('bi-heart', 'bi-heart-fill');
                            this.style.color = '#ef4444';
                            window.AuthGuard.showToast("Product added to wishlist!");
                        } else {
                            icon.classList.replace('bi-heart-fill', 'bi-heart');
                            this.style.color = '';
                            window.AuthGuard.showToast("Removed from wishlist.");
                        }
                    }
                } catch(err) { }
            });
        });

        document.querySelectorAll('.cart-btn-dynamic').forEach(btn => {
            btn.addEventListener('click', async function(e) {
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
                } catch(err) {
                    window.location.href = `/product/${productId}`;
                }
            });
        });
    }

    initHomeProducts();

});
