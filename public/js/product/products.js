document.addEventListener("DOMContentLoaded", function () {
    let currentWishlist = [];

    // ====== DUAL PRICE SLIDER ======
    const minInput = document.getElementById('priceSliderMin');
    const maxInput = document.getElementById('priceSliderMax');
    const sliderTrack = document.getElementById('sliderTrack');
    const priceDisplay = document.getElementById('priceDisplay');

    function updateSlider() {
        if (!minInput || !maxInput || !sliderTrack || !priceDisplay) return;
        
        let minVal = parseInt(minInput.value);
        let maxVal = parseInt(maxInput.value);

        // Prevent crossing
        if (minVal > maxVal) {
            if (this === minInput) {
                minInput.value = maxVal;
                minVal = maxVal;
            } else {
                maxInput.value = minVal;
                maxVal = minVal;
            }
        }

        // Display selected price
        priceDisplay.textContent = `₹${minVal.toLocaleString('en-IN')} – ₹${maxVal.toLocaleString('en-IN')}`;

        // Color the track
        const minPercent = (minVal / minInput.max) * 100;
        const maxPercent = (maxVal / maxInput.max) * 100;
        sliderTrack.style.background = `linear-gradient(to right, #e5e5e7 ${minPercent}%, #1d1d1f ${minPercent}%, #1d1d1f ${maxPercent}%, #e5e5e7 ${maxPercent}%)`;
    }

    if (minInput && maxInput) {
        minInput.addEventListener('input', updateSlider);
        maxInput.addEventListener('input', updateSlider);
        minInput.addEventListener('change', loadProducts);
        maxInput.addEventListener('change', loadProducts);

        // Adjust z-index dynamically for easier overlapping thumb dragging
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

    // ====== COLOR SWATCH TOGGLE ======
    document.querySelectorAll('.color-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            loadProducts();
        });
    });

    // ====== SIZE PILL TOGGLE ======
    document.querySelectorAll('.size-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            loadProducts();
        });
    });

    // ====== MOBILE DRAWER ACCORDION / NAVIGATION ======
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

    // Apply Button (Mobile Drawer)
    const btnSidebarApply = document.getElementById('btnSidebarApply');
    if (btnSidebarApply) {
        btnSidebarApply.addEventListener('click', () => {
            loadProducts();
            closeFilter();
        });
    }

    // Clear All Buttons / Links
    const btnSidebarClear = document.getElementById('btnSidebarClear');
    if (btnSidebarClear) btnSidebarClear.addEventListener('click', resetAllFilters);

    const clearFiltersLink = document.getElementById('clearFiltersLink');
    if (clearFiltersLink) clearFiltersLink.addEventListener('click', resetAllFilters);

    // ====== RESET ALL FILTERS ======
    function resetAllFilters() {
        // 1. Categories
        document.querySelectorAll('#categoryFilterList input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });

        // 2. Price Range
        if (minInput && maxInput) {
            minInput.value = 0;
            maxInput.value = 5000;
            updateSlider();
        }

        // 3. Sizes
        document.querySelectorAll('#sizeFilterList .size-pill').forEach(btn => {
            btn.classList.remove('active');
        });

        // 4. Colors
        document.querySelectorAll('#colorFilterList .color-swatch').forEach(btn => {
            btn.classList.remove('active');
        });

        // 5. Availability
        const allAvailabilityRadio = document.querySelector('input[name="availabilityFilter"][value="all"]');
        if (allAvailabilityRadio) {
            allAvailabilityRadio.checked = true;
        }

        // 6. Customer Ratings
        document.querySelectorAll('input[name="ratingFilter"]').forEach(radio => {
            radio.checked = false;
        });

        // 7. Collections
        const newArrivalCb = document.getElementById('filterNewArrival');
        if (newArrivalCb) newArrivalCb.checked = false;
        const bestSellerCb = document.getElementById('filterBestSeller');
        if (bestSellerCb) bestSellerCb.checked = false;

        // 8. Discount
        document.querySelectorAll('input[name="discountFilter"]').forEach(radio => {
            radio.checked = false;
        });

        // Reload products
        loadProducts();
    }

    // ====== PRODUCT LOADER & FILTER SYSTEM ======
    async function loadProducts() {
        const productGrid = document.getElementById("productGrid");
        if (!productGrid) return;

        // Build query string for API
        const params = new URLSearchParams();
        
        const searchInput = document.querySelector('.search-input');
        if (searchInput && searchInput.value) {
            params.append('search', searchInput.value.trim());
        }

        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            params.append('sort', sortSelect.value);
        }

        const priceSliderMax = document.getElementById('priceSliderMax');
        if (priceSliderMax) {
            params.append('maxPrice', priceSliderMax.value);
        }

        const checkedCategories = Array.from(document.querySelectorAll('#categoryFilterList input[type="checkbox"]:checked')).map(cb => cb.value);
        if (checkedCategories.length > 0) {
            params.append('categories', checkedCategories.join(','));
        }

        const activeSizes = Array.from(document.querySelectorAll('#sizeFilterList .size-pill.active')).map(btn => btn.value);
        if (activeSizes.length > 0) {
            params.append('sizes', activeSizes.join(','));
        }

        const activeColors = Array.from(document.querySelectorAll('#colorFilterList .color-swatch.active')).map(btn => btn.value);
        if (activeColors.length > 0) {
            params.append('colors', activeColors.join(','));
        }

        if (document.getElementById('filterNewArrival')?.checked) {
            params.append('newArrival', 'true');
        }
        
        const ratingFilter = document.querySelector('input[name="ratingFilter"]:checked');
        if (ratingFilter) {
            params.append('rating', ratingFilter.value);
        }

        try {
            // Load wishlist first if logged in
            const status = await window.AuthGuard.fetchStatus();
            if (status.loggedIn) {
                const wlRes = await fetch("/api/wishlist");
                const wlData = await wlRes.json();
                if (wlData.success) currentWishlist = wlData.products.map(p => p._id);
            }

            const res = await fetch(`/api/products?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                let filteredProducts = data.products;

                // 1. Client-side minPrice filter
                if (minInput) {
                    const minPrice = parseInt(minInput.value) || 0;
                    filteredProducts = filteredProducts.filter(p => {
                        const actualPrice = p.offerPrice || p.price;
                        return actualPrice >= minPrice;
                    });
                }

                // 2. Client-side stock availability filter
                const availabilityFilter = document.querySelector('input[name="availabilityFilter"]:checked')?.value;
                if (availabilityFilter === "inStock") {
                    filteredProducts = filteredProducts.filter(p => {
                        return p.variants?.some(v => v.sizes?.some(s => s.stock > 0));
                    });
                } else if (availabilityFilter === "outOfStock") {
                    filteredProducts = filteredProducts.filter(p => {
                        return !p.variants?.some(v => v.sizes?.some(s => s.stock > 0));
                    });
                }

                // 3. Client-side Best Sellers filter (within Collections)
                const filterBestSeller = document.getElementById('filterBestSeller');
                if (filterBestSeller && filterBestSeller.checked) {
                    filteredProducts = filteredProducts.filter(p => p.salesCount && p.salesCount > 0);
                }

                // 4. Client-side Discount filter
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

                renderProducts(filteredProducts);
            }
        } catch (err) {
            console.error("Error loading products:", err);
        }
    }

    function renderProducts(products) {
        const productGrid = document.getElementById("productGrid");
        const template = document.getElementById("userProductTemplate");
        if (!productGrid || !template) return;

        productGrid.innerHTML = products.length ? "" : '<div class="col-12 text-center py-5"><p class="text-muted">No products found matching these filters.</p></div>';

        products.forEach(p => {
            const clone = template.content.cloneNode(true);
            const mainImg = (p.variants?.[0]?.images?.[0]) ? `/images/products/${p.variants[0].images[0]}` : '/images/no-image.png';

            // Set data
            clone.querySelector(".p-card-link").href = `/product/${p._id}`;
            clone.querySelector("img").src = mainImg;
            clone.querySelector("img").alt = p.name;
            clone.querySelector(".p-cat").textContent = p.category?.name || 'Uncategorized';
            clone.querySelector(".p-name").textContent = p.name;

            // Rating rendering
            const ratingDiv = clone.querySelector(".p-rating");
            if (ratingDiv) {
                const rating = p.averageRating !== undefined ? p.averageRating : 0;
                const reviews = p.reviewCount !== undefined ? p.reviewCount : 0;
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

            // Price rendering
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

            // Optional "New" badge (e.g. products created in last 14 days)
            const isNew = (new Date() - new Date(p.createdAt)) < 14 * 24 * 60 * 60 * 1000;
            if (isNew) {
                const badge = clone.querySelector(".p-badge");
                if (badge) {
                    badge.textContent = "New";
                    badge.classList.remove("d-none");
                }
            }

            // Wishlist Button Listener
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

            // Cart Button Listener
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

            productGrid.appendChild(clone);
        });
    }

    // ====== ATTACH FILTER DELEGATION LISTENERS ======
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.addEventListener('change', loadProducts);

    const categoryFilterList = document.getElementById('categoryFilterList');
    if (categoryFilterList) categoryFilterList.addEventListener('change', loadProducts);

    const availabilityFilterList = document.getElementById('availabilityFilterList');
    if (availabilityFilterList) availabilityFilterList.addEventListener('change', loadProducts);

    const ratingFilterList = document.getElementById('ratingFilterList');
    if (ratingFilterList) ratingFilterList.addEventListener('change', loadProducts);

    const collectionFilterList = document.getElementById('collectionFilterList');
    if (collectionFilterList) collectionFilterList.addEventListener('change', loadProducts);

    const discountFilterList = document.getElementById('discountFilterList');
    if (discountFilterList) discountFilterList.addEventListener('change', loadProducts);

    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(loadProducts, 400);
        });
    }

    // Pagination (if static pages exist)
    document.querySelectorAll('.p-page:not(.p-page-next)').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.p-page').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // ====== CATEGORY BINDER & FETCH ======
    async function loadFilterCategories() {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            const list = document.getElementById("categoryFilterList");
            if (!list) return;

            list.innerHTML = "";
            data.categories.forEach(cat => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <label class="filter-check">
                        <input type="checkbox" value="${cat._id}">
                        <span class="checkmark"></span>
                        ${cat.name}
                    </label>
                `;
                list.appendChild(li);
            });
        } catch (err) {
            console.error("Category load error:", err);
        }
    }

    // Initial triggers
    loadFilterCategories().then(() => {
        loadProducts();
    });
});