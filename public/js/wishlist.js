document.addEventListener("DOMContentLoaded", async function () {
    const grid = document.getElementById("wishlistGrid");
    const countEl = document.getElementById("wishlistCount");
    const emptyState = document.getElementById("emptyState");
    const loading = document.getElementById("wishlistLoading");

    // Check auth status
    const status = await window.AuthGuard.fetchStatus();
    if (!status.loggedIn) {
        window.location.href = "/login?redirect=/wishlist";
        return;
    }

    async function loadWishlist() {
        try {
            const res = await fetch("/api/wishlist");
            const data = await res.json();

            if (data.success) {
                renderWishlist(data.products);
            }
        } catch (err) {
            console.error("Wishlist loading error:", err);
            grid.innerHTML = "<p class='text-center py-5'>Failed to load wishlist. Please try again.</p>";
        }
    }

    function renderWishlist(products) {
        if(loading) loading.style.display = "none";
        
        if (products.length === 0) {
            countEl.textContent = "0 items";
            grid.innerHTML = "";
            emptyState.classList.remove("d-none");
            return;
        }

        emptyState.classList.add("d-none");
        countEl.textContent = `${products.length} item${products.length > 1 ? 's' : ''}`;
        grid.innerHTML = "";

        products.forEach(p => {
            const col = document.createElement("div");
            col.className = "col-6 col-md-4 col-lg-3";
            
            const firstVariant = p.variants && p.variants.length > 0 ? p.variants[0] : null;
            const image = (firstVariant && firstVariant.images && firstVariant.images[0]) ? firstVariant.images[0] : "";
            const catName = p.category ? p.category.name : "Uncategorized";

            col.innerHTML = `
                <div class="wl-card">
                    <div class="wl-card-img">
                        <a href="/product/${p._id}">
                            <img src="/images/products/${image}" alt="${p.name}">
                        </a>
                        <button class="wl-remove-btn" data-id="${p._id}" aria-label="Remove from wishlist" title="Remove">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                    <div class="wl-card-body">
                        <div class="wl-cat">${catName}</div>
                        <h4 class="wl-name"><a href="/product/${p._id}">${p.name}</a></h4>
                        <div class="wl-price-row">
                            <span class="wl-price">₹${p.offerPrice || p.price}</span>
                            ${p.offerPrice && p.offerPrice < p.price ? `<span class="wl-price-old">₹${p.price}</span>` : ''}
                        </div>
                        <a href="/product/${p._id}" class="wl-cart-btn text-decoration-none text-center d-block">
                             View Options
                        </a>
                    </div>
                </div>
            `;
            grid.appendChild(col);
        });

        attachEvents();
    }

    function attachEvents() {
        document.querySelectorAll('.wl-remove-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const productId = btn.dataset.id;
                try {
                    const res = await fetch("/api/wishlist/toggle", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ productId })
                    });
                    if((await res.json()).success) {
                        loadWishlist(); // reload the whole grid
                    }
                } catch(err) {
                    console.error("Error removing from wishlist:", err);
                }
            });
        });
    }

    loadWishlist();
});
