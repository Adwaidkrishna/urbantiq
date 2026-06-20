document.addEventListener("DOMContentLoaded", function () {
    let currentWishlist = [];
    let currentPage = 1;
    let isLoading = false;
    const urlParams = new URLSearchParams(window.location.search);

    // Pre-populate search query from URL parameters if present
    const searchParam = urlParams.get('search');
    const searchInput = document.querySelector('.search-input');
    if (searchParam && searchInput) {
        searchInput.value = searchParam;
    }

    // ======================================================
    // SKELETON UTILITIES
    // ======================================================

    /**
     * Build a single skeleton card column — mirrors the real card's DOM
     * structure and CSS classes exactly so no layout shift occurs.
     */
    function buildSkeletonCard() {
        // col-6 col-md-6 col-lg-3  — same as template
        const col = document.createElement('div');
        col.className = 'col-6 col-md-6 col-lg-3';
        col.setAttribute('aria-hidden', 'true');

        col.innerHTML = `
            <div class="p-skeleton-card">
                <div class="p-skel-img"></div>
                <div class="p-skel-body">
                    <div class="p-skel-block p-skel-cat"></div>
                    <div class="p-skel-block p-skel-name"></div>
                    <div class="p-skel-block p-skel-stars"></div>
                    <div class="p-skel-block p-skel-price"></div>
                </div>
            </div>
        `;
        return col;
    }

    /**
     * Inject N skeleton cards into the product grid immediately.
     */
    function showSkeletons(count = 12) {
        const grid = document.getElementById('productGrid');
        if (!grid) return;

        // Use a DocumentFragment — single DOM write, zero reflows during build
        const frag = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
            frag.appendChild(buildSkeletonCard());
        }
        grid.innerHTML = ''; // clear any prior state
        grid.appendChild(frag);
    }

    /**
     * Remove skeleton cards from the grid.
     */
    function clearSkeletons() {
        const grid = document.getElementById('productGrid');
        if (!grid) return;
        grid.querySelectorAll('.p-skeleton-card, [aria-hidden="true"]').forEach(el => {
            el.parentElement?.remove();
        });
    }

    // ======================================================
    // EMPTY / ERROR STATES
    // ======================================================

    function showEmptyState(grid) {
        grid.innerHTML = `
            <div class="col-12">
                <div class="p-empty-state">
                    <span class="p-empty-icon"><i class="bi bi-bag-x"></i></span>
                    <p class="p-empty-title">No products found</p>
                    <p class="p-empty-desc">Try adjusting your filters or search terms to find what you're looking for.</p>
                </div>
            </div>
        `;
    }

    function showErrorState(grid) {
        grid.innerHTML = `
            <div class="col-12">
                <div class="p-error-state">
                    <span class="p-error-icon"><i class="bi bi-wifi-off"></i></span>
                    <p class="p-error-title">Something went wrong</p>
                    <p class="p-error-desc">We couldn't load the products. Check your connection and try again.</p>
                    <button class="p-retry-btn" id="retryProductsBtn">
                        <i class="bi bi-arrow-clockwise"></i> Try Again
                    </button>
                </div>
            </div>
        `;
        // Retry button re-triggers the current filter state
        document.getElementById('retryProductsBtn')?.addEventListener('click', () => loadProducts());
    }

    // ======================================================
    // DUAL PRICE SLIDER
    // ======================================================
    const minInput = document.getElementById('priceSliderMin');
    const maxInput = document.getElementById('priceSliderMax');
    const sliderTrack = document.getElementById('sliderTrack');
    const priceDisplay = document.getElementById('priceDisplay');

    function updateSlider() {
        if (!minInput || !maxInput || !sliderTrack || !priceDisplay) return;

        let minVal = parseInt(minInput.value);
        let maxVal = parseInt(maxInput.value);

        if (minVal > maxVal) {
            if (this === minInput) {
                minInput.value = maxVal;
                minVal = maxVal;
            } else {
                maxInput.value = minVal;
                maxVal = minVal;
            }
        }

        priceDisplay.textContent = `₹${minVal.toLocaleString('en-IN')} – ₹${maxVal.toLocaleString('en-IN')}`;

        const minPercent = (minVal / minInput.max) * 100;
        const maxPercent = (maxVal / maxInput.max) * 100;
        sliderTrack.style.background = `linear-gradient(to right, #e5e5e7 ${minPercent}%, #1d1d1f ${minPercent}%, #1d1d1f ${maxPercent}%, #e5e5e7 ${maxPercent}%)`;
    }

    if (minInput && maxInput) {
        minInput.addEventListener('input', updateSlider);
        maxInput.addEventListener('input', updateSlider);
        minInput.addEventListener('change', () => loadProducts(true));
        maxInput.addEventListener('change', () => loadProducts(true));

        minInput.addEventListener('input', () => {
            minInput.style.zIndex = "5";
            maxInput.style.zIndex = "4";
        });
        maxInput.addEventListener('input', () => {
            maxInput.style.zIndex = "5";
            minInput.style.zIndex = "4";
        });

        updateSlider();
    }

    // ======================================================
    // COLOR SWATCH TOGGLE
    // ======================================================
    document.querySelectorAll('.color-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            loadProducts(true);
        });
    });

    // ======================================================
    // SIZE PILL TOGGLE
    // ======================================================
    document.querySelectorAll('.size-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            loadProducts(true);
        });
    });

    // ======================================================
    // MOBILE DRAWER
    // ======================================================
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const filterSidebar = document.getElementById('filterSidebar');
    const filterOverlay = document.getElementById('filterOverlay');

    function openFilter() {
        if (filterSidebar) filterSidebar.classList.add('open');
        if (filterOverlay) filterOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeFilter() {
        if (filterSidebar) filterSidebar.classList.remove('open');
        if (filterOverlay) filterOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (filterToggleBtn) filterToggleBtn.addEventListener('click', openFilter);
    if (filterOverlay) filterOverlay.addEventListener('click', closeFilter);

    const btnSidebarApply = document.getElementById('btnSidebarApply');
    if (btnSidebarApply) {
        btnSidebarApply.addEventListener('click', () => {
            loadProducts();
            closeFilter();
        });
    }

    const btnSidebarClear = document.getElementById('btnSidebarClear');
    if (btnSidebarClear) btnSidebarClear.addEventListener('click', resetAllFilters);

    const clearFiltersLink = document.getElementById('clearFiltersLink');
    if (clearFiltersLink) clearFiltersLink.addEventListener('click', resetAllFilters);

    // ======================================================
    // RESET ALL FILTERS
    // ======================================================
    function resetAllFilters() {
        document.querySelectorAll('#categoryFilterList input[type="checkbox"]').forEach(cb => cb.checked = false);

        if (minInput && maxInput) {
            minInput.value = 0;
            maxInput.value = 5000;
            updateSlider();
        }

        document.querySelectorAll('#sizeFilterList .size-pill').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('#colorFilterList .color-swatch').forEach(btn => btn.classList.remove('active'));

        const allAvailabilityRadio = document.querySelector('input[name="availabilityFilter"][value="all"]');
        if (allAvailabilityRadio) allAvailabilityRadio.checked = true;

        document.querySelectorAll('input[name="ratingFilter"]').forEach(radio => radio.checked = false);

        const newArrivalCb = document.getElementById('filterNewArrival');
        if (newArrivalCb) newArrivalCb.checked = false;
        const bestSellerCb = document.getElementById('filterBestSeller');
        if (bestSellerCb) bestSellerCb.checked = false;

        document.querySelectorAll('input[name="discountFilter"]').forEach(radio => radio.checked = false);

        loadProducts(true);
    }

    // ======================================================
    // PRODUCT LOADER — OPTIMIZED PARALLEL FETCH
    // ======================================================
    async function loadProducts(resetPage = false) {
        // Debounce: prevent concurrent calls from stacking
        if (isLoading) return;
        isLoading = true;

        if (resetPage) currentPage = 1;

        const productGrid = document.getElementById("productGrid");
        if (!productGrid) { isLoading = false; return; }

        // Show skeletons immediately — instant perceived performance
        showSkeletons(12);

        // Build query params
        const params = new URLSearchParams();

        const searchInputEl = document.querySelector('.search-input');
        if (searchInputEl && searchInputEl.value) {
            params.append('search', searchInputEl.value.trim());
        }

        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) params.append('sort', sortSelect.value);

        const priceSliderMax = document.getElementById('priceSliderMax');
        if (priceSliderMax) params.append('maxPrice', priceSliderMax.value);

        const checkedCategories = Array.from(
            document.querySelectorAll('#categoryFilterList input[type="checkbox"]:checked')
        ).map(cb => cb.value);
        if (checkedCategories.length > 0) params.append('categories', checkedCategories.join(','));

        const activeSizes = Array.from(
            document.querySelectorAll('#sizeFilterList .size-pill.active')
        ).map(btn => btn.value);
        if (activeSizes.length > 0) params.append('sizes', activeSizes.join(','));

        const activeColors = Array.from(
            document.querySelectorAll('#colorFilterList .color-swatch.active')
        ).map(btn => btn.value);
        if (activeColors.length > 0) params.append('colors', activeColors.join(','));

        if (document.getElementById('filterNewArrival')?.checked) {
            params.append('newArrival', 'true');
        }

        const ratingFilter = document.querySelector('input[name="ratingFilter"]:checked');
        if (ratingFilter) params.append('rating', ratingFilter.value);

        try {
            // ── KEY OPTIMISATION ─────────────────────────────────────────────────
            // Fire wishlist and products fetches IN PARALLEL using Promise.all.
            // Previously these were awaited sequentially, adding a full extra
            // round-trip before any product could render.
            // ─────────────────────────────────────────────────────────────────────
            const authStatus = await window.AuthGuard.fetchStatus();

            const [wlData, productsData] = await Promise.all([
                // Wishlist: only fetch if logged in, otherwise resolve immediately
                authStatus.loggedIn
                    ? fetch("/api/wishlist").then(r => r.json()).catch(() => ({ success: false, products: [] }))
                    : Promise.resolve({ success: false, products: [] }),

                // Products: main data fetch
                fetch(`/api/products?${params.toString()}`).then(r => r.json())
            ]);

            // Update wishlist cache
            if (wlData.success && Array.isArray(wlData.products)) {
                currentWishlist = wlData.products.map(p => p._id);
            }

            if (!productsData.success) {
                clearSkeletons();
                showErrorState(productGrid);
                isLoading = false;
                return;
            }

            let filteredProducts = productsData.products;

            // Client-side minPrice filter
            if (minInput) {
                const minPrice = parseInt(minInput.value) || 0;
                filteredProducts = filteredProducts.filter(p => {
                    const actualPrice = p.offerPrice || p.price;
                    return actualPrice >= minPrice;
                });
            }

            // Client-side stock availability filter
            const availabilityFilter = document.querySelector('input[name="availabilityFilter"]:checked')?.value;
            if (availabilityFilter === "inStock") {
                filteredProducts = filteredProducts.filter(p =>
                    p.variants?.some(v => v.sizes?.some(s => s.stock > 0))
                );
            } else if (availabilityFilter === "outOfStock") {
                filteredProducts = filteredProducts.filter(p =>
                    !p.variants?.some(v => v.sizes?.some(s => s.stock > 0))
                );
            }

            // Client-side Best Sellers filter
            const filterBestSeller = document.getElementById('filterBestSeller');
            if (filterBestSeller && filterBestSeller.checked) {
                filteredProducts = filteredProducts.filter(p => p.salesCount && p.salesCount > 0);
            }

            // Client-side Discount filter
            const discountFilter = document.querySelector('input[name="discountFilter"]:checked')?.value;
            if (discountFilter) {
                const minDiscount = parseInt(discountFilter);
                filteredProducts = filteredProducts.filter(p => {
                    const discountPercent = p.offerPrice && p.offerPrice < p.price
                        ? Math.round(((p.price - p.offerPrice) / p.price) * 100)
                        : 0;
                    return discountPercent >= minDiscount;
                });
            }

            // Client-side pagination
            const itemsPerPage = 16;
            const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
            if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

            const startIndex = (currentPage - 1) * itemsPerPage;
            const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

            // Render — skeletons are replaced here
            renderProducts(paginatedProducts);
            renderPagination(totalPages, currentPage);

        } catch (err) {
            console.error("Error loading products:", err);
            clearSkeletons();
            showErrorState(productGrid);
        } finally {
            isLoading = false;
        }
    }

    // ======================================================
    // RENDER PRODUCTS — with staggered fade-in
    // ======================================================
    function renderProducts(products) {
        const productGrid = document.getElementById("productGrid");
        const template = document.getElementById("userProductTemplate");
        if (!productGrid || !template) return;

        // Clear skeletons before rendering real content
        productGrid.innerHTML = '';

        if (!products.length) {
            showEmptyState(productGrid);
            return;
        }

        // Build all cards in a single DocumentFragment — one DOM write
        const frag = document.createDocumentFragment();

        products.forEach((p, idx) => {
            const clone = template.content.cloneNode(true);
            const mainImg = (p.variants?.[0]?.images?.[0])
                ? `/images/products/${p.variants[0].images[0]}`
                : '/images/no-image.png';

            clone.querySelector(".p-card-link").href = `/product/${p._id}`;
            clone.querySelector("img").src = mainImg;
            clone.querySelector("img").alt = p.name;
            clone.querySelector(".p-cat").textContent = p.category?.name || 'Uncategorized';
            clone.querySelector(".p-name").textContent = p.name;

            // Rating
            const ratingDiv = clone.querySelector(".p-rating");
            if (ratingDiv) {
                const rating = p.averageRating ?? 0;
                const reviews = p.reviewCount ?? 0;
                let starsHtml = '';
                for (let i = 1; i <= 5; i++) {
                    if (rating > 0 && rating >= i) {
                        starsHtml += '<i class="bi bi-star-fill"></i>';
                    } else if (rating > 0 && rating >= i - 0.5) {
                        starsHtml += '<i class="bi bi-star-half"></i>';
                    } else {
                        starsHtml += '<i class="bi bi-star text-muted"></i>';
                    }
                }
                ratingDiv.innerHTML = `${starsHtml} <span class="ms-1 font-semibold">${rating.toFixed(1)}</span> <span class="p-reviews ms-1">(${reviews})</span>`;
            }

            // Price
            const priceDiv = clone.querySelector(".p-price");
            if (p.offerPrice && p.offerPrice < p.price) {
                priceDiv.innerHTML = `
                    <span class="text-danger">₹${p.offerPrice.toLocaleString('en-IN')}</span>
                    <span class="text-muted text-decoration-line-through ms-2" style="font-size: 0.85rem; font-weight: 500;">₹${p.price.toLocaleString('en-IN')}</span>
                `;
            } else {
                priceDiv.textContent = `₹${p.price.toLocaleString('en-IN')}`;
            }

            // Wishlist state
            const wlBtn = clone.querySelector(".wishlist-btn");
            if (currentWishlist.includes(p._id)) {
                wlBtn.querySelector("i").classList.replace('bi-heart', 'bi-heart-fill');
                wlBtn.classList.add('active');
            }

            // "New" badge
            const isNew = (new Date() - new Date(p.createdAt)) < 14 * 24 * 60 * 60 * 1000;
            if (isNew) {
                const badge = clone.querySelector(".p-badge");
                if (badge) {
                    badge.textContent = "New";
                    badge.classList.remove("d-none");
                }
            }

            // ── Staggered fade-in ────────────────────────────────────────────────
            // Apply a per-card animation delay via CSS custom property.
            // Cap at 300ms so late cards don't feel sluggish.
            const wrap = clone.querySelector('.p-card-anchor-wrap');
            if (wrap) {
                const delay = Math.min(idx * 30, 300);
                wrap.style.setProperty('--p-card-delay', `${delay}ms`);
            }

            // Wishlist Button
            wlBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const allowed = await window.AuthGuard.requireAuth(window.location.href);
                if (!allowed) return;

                try {
                    const res = await fetch("/api/wishlist/toggle", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ productId: p._id })
                    });
                    const data = await res.json();
                    if (data.success) {
                        window.AuthGuard.updateWishlistBadge();
                        const icon = wlBtn.querySelector("i");
                        if (data.added) {
                            icon.classList.replace('bi-heart', 'bi-heart-fill');
                            wlBtn.classList.add('active');
                            window.AuthGuard.showToast("Product added to wishlist!");
                        } else {
                            icon.classList.replace('bi-heart-fill', 'bi-heart');
                            wlBtn.classList.remove('active');
                            window.AuthGuard.showToast("Removed from wishlist.");
                        }
                    }
                } catch (err) { console.error(err); }
            });

            // Cart Button
            clone.querySelector(".cart-btn").addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const allowed = await window.AuthGuard.requireAuth(window.location.href);
                if (!allowed) return;

                const defaultVariant = p.variants?.[0];
                const defaultSize = defaultVariant?.sizes?.find(s => s.stock > 0);

                if (!defaultVariant || !defaultSize) {
                    window.location.href = `/product/${p._id}`;
                    return;
                }

                try {
                    const res = await fetch("/api/cart/add", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            productId: p._id,
                            variantId: defaultVariant._id,
                            size: defaultSize.size,
                            quantity: 1
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        window.AuthGuard.updateCartBadge();
                        window.AuthGuard.showToast("Product added to cart!");
                    } else {
                        window.location.href = `/product/${p._id}`;
                    }
                } catch (err) {
                    window.location.href = `/product/${p._id}`;
                }
            });

            frag.appendChild(clone);
        });

        productGrid.appendChild(frag);
    }

    // ======================================================
    // FILTER DELEGATION LISTENERS
    // ======================================================
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.addEventListener('change', () => loadProducts(true));

    const categoryFilterList = document.getElementById('categoryFilterList');
    if (categoryFilterList) categoryFilterList.addEventListener('change', () => loadProducts(true));

    const availabilityFilterList = document.getElementById('availabilityFilterList');
    if (availabilityFilterList) availabilityFilterList.addEventListener('change', () => loadProducts(true));

    const ratingFilterList = document.getElementById('ratingFilterList');
    if (ratingFilterList) ratingFilterList.addEventListener('change', () => loadProducts(true));

    const collectionFilterList = document.getElementById('collectionFilterList');
    if (collectionFilterList) collectionFilterList.addEventListener('change', () => loadProducts(true));

    const discountFilterList = document.getElementById('discountFilterList');
    if (discountFilterList) discountFilterList.addEventListener('change', () => loadProducts(true));

    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => loadProducts(true), 400);
        });
    }

    // ======================================================
    // PAGINATION
    // ======================================================
    function renderPagination(totalPages, activePage) {
        const container = document.getElementById("productPagination");
        if (!container) return;

        if (totalPages <= 1) {
            container.innerHTML = "";
            return;
        }

        let html = `
            <button class="p-page prev-btn" ${activePage === 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                <i class="bi bi-chevron-left"></i>
            </button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            html += `
                <button class="p-page page-num-btn ${i === activePage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }

        html += `
            <button class="p-page p-page-next next-btn" ${activePage === totalPages ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                Next <i class="bi bi-chevron-right ms-1"></i>
            </button>
        `;

        container.innerHTML = html;

        const prevBtn = container.querySelector(".prev-btn");
        if (prevBtn && activePage > 1) {
            prevBtn.addEventListener("click", () => {
                currentPage = activePage - 1;
                loadProducts();
                scrollToGridTop();
            });
        }

        const nextBtn = container.querySelector(".next-btn");
        if (nextBtn && activePage < totalPages) {
            nextBtn.addEventListener("click", () => {
                currentPage = activePage + 1;
                loadProducts();
                scrollToGridTop();
            });
        }

        container.querySelectorAll(".page-num-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const targetPage = parseInt(e.target.dataset.page);
                if (targetPage !== activePage) {
                    currentPage = targetPage;
                    loadProducts();
                    scrollToGridTop();
                }
            });
        });
    }

    function scrollToGridTop() {
        const titleRow = document.querySelector(".shop-title-row");
        if (titleRow) {
            titleRow.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    // ======================================================
    // CATEGORY FILTER LOADER
    // ======================================================
    async function loadFilterCategories() {
        try {
            const categoryId = urlParams.get('category');
            const res = await fetch("/api/categories");
            const data = await res.json();
            const list = document.getElementById("categoryFilterList");
            if (!list) return;

            const frag = document.createDocumentFragment();
            data.categories.forEach(cat => {
                const isChecked = categoryId && cat._id.toString() === categoryId.toString();
                const li = document.createElement("li");
                li.innerHTML = `
                    <label class="filter-check">
                        <input type="checkbox" value="${cat._id}" ${isChecked ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        ${cat.name}
                    </label>
                `;
                frag.appendChild(li);
            });
            list.innerHTML = '';
            list.appendChild(frag);
        } catch (err) {
            console.error("Category load error:", err);
        }
    }

    // ======================================================
    // BOOTSTRAP — Show skeletons immediately, then fire
    // categories, THEN products (must be chained so DOM is ready)
    // ======================================================
    showSkeletons(12);

    loadFilterCategories().then(() => {
        loadProducts();
    });
});