document.addEventListener("DOMContentLoaded", function () {
    // Price slider
    const slider = document.getElementById('priceSlider');
    const display = document.getElementById('priceDisplay');
    if (slider && display) {
        slider.addEventListener('input', () => {
            display.textContent = '₹' + parseInt(slider.value).toLocaleString('en-IN');
        });
    }

    // Color swatch toggle
    document.querySelectorAll('.color-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Size pill toggle
    document.querySelectorAll('.size-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.size-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Mobile filter drawer
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

    // Pagination
    document.querySelectorAll('.p-page:not(.p-page-next)').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.p-page').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Wishlist heart toggle
    document.querySelectorAll('.p-action-btn .bi-heart').forEach(icon => {
        icon.parentElement.addEventListener('click', function (e) {
            e.preventDefault();
            const i = this.querySelector('i');
            if (i && i.classList.contains('bi-heart')) {
                i.classList.replace('bi-heart', 'bi-heart-fill');
                this.style.color = '#ef4444';
            } else if (i) {
                i.classList.replace('bi-heart-fill', 'bi-heart');
                this.style.color = '';
            }
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {
    let currentWishlist = [];

    async function loadProducts() {
        const productGrid = document.getElementById("productGrid");
        if (!productGrid) return;

        try {
            // Load wishlist first if logged in
            const status = await window.AuthGuard.fetchStatus();
            if (status.loggedIn) {
                const wlRes = await fetch("/api/wishlist");
                const wlData = await wlRes.json();
                if (wlData.success) currentWishlist = wlData.products.map(p => p._id);
            }

            const res = await fetch("/api/products");
            const data = await res.json();

            if (data.success) {
                renderProducts(data.products);
            }
        } catch (err) {
            console.error("Error loading products:", err);
        }
    }

    function renderProducts(products) {
        const productGrid = document.getElementById("productGrid");
        const template = document.getElementById("userProductTemplate");
        if (!productGrid || !template) return;

        productGrid.innerHTML = products.length ? "" : '<div class="col-12 text-center py-5">No products found</div>';

        products.forEach(p => {
            const clone = template.content.cloneNode(true);
            const mainImg = (p.variants?.[0]?.images?.[0]) ? `/images/products/${p.variants[0].images[0]}` : '/images/user/phoodie.jpeg';

            // Set data
            clone.querySelector(".p-card-link").href = `/product/${p._id}`;
            clone.querySelector("img").src = mainImg;
            clone.querySelector("img").alt = p.name;
            clone.querySelector(".p-cat").textContent = p.category?.name || 'Uncategorized';
            clone.querySelector(".p-name").textContent = p.name;
            clone.querySelector(".p-price").textContent = `₹${p.offerPrice || p.price}`;

            // Initial wishlist state
            const wlBtn = clone.querySelector(".wishlist-btn");
            if (currentWishlist.includes(p._id)) {
                wlBtn.querySelector("i").classList.replace('bi-heart', 'bi-heart-fill');
                wlBtn.classList.add('active');
            }

            // Optional: Show "New" badge if created recently
            const isNew = (new Date() - new Date(p.createdAt)) < 7 * 24 * 60 * 60 * 1000;
            if (isNew) {
                const badge = clone.querySelector(".p-badge");
                if (badge) {
                    badge.textContent = "New";
                    badge.classList.remove("d-none");
                }
            }

            // Listeners
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

            clone.querySelector(".cart-btn").addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const allowed = await window.AuthGuard.requireAuth(window.location.href);
                if (!allowed) return;

                // Pick first variant and first size with stock
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

    // Call loaders
    loadFilterCategories();
    loadProducts();

});

async function loadFilterCategories() {

    try {

        const res = await fetch("/api/categories");
        const data = await res.json();

        const list = document.getElementById("categoryFilterList");

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