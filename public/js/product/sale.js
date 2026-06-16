document.addEventListener("DOMContentLoaded", function () {
    let countdownInterval = null;

    // Load active sale details (timer date & coupons)
    async function loadSaleDetails() {
        try {
            const res = await fetch("/api/active-sale");
            const data = await res.json();

            if (data.success) {
                // 1. Initialize Countdown Timer
                let targetTime = null;
                if (data.endDate) {
                    targetTime = new Date(data.endDate).getTime();
                } else {
                    // Fallback to 3 days from now for visual demonstration if no active offers exist
                    console.warn("No active offers found in DB. Falling back to a 3-day visual timer.");
                    targetTime = new Date().getTime() + (3 * 24 * 60 * 60 * 1000);
                }
                startCountdown(targetTime);

                // 2. Render Coupons
                renderCoupons(data.coupons || []);
            } else {
                useDefaultCoupons();
                startCountdown(new Date().getTime() + (3 * 24 * 60 * 60 * 1000));
            }
        } catch (error) {
            console.error("Error loading sale details:", error);
            useDefaultCoupons();
            startCountdown(new Date().getTime() + (3 * 24 * 60 * 60 * 1000));
        }
    }

    // Start Countdown Timer
    function startCountdown(targetTime) {
        if (countdownInterval) clearInterval(countdownInterval);

        function updateTimer() {
            const now = new Date().getTime();
            const distance = targetTime - now;

            const daysEl = document.getElementById("days");
            const hoursEl = document.getElementById("hours");
            const minutesEl = document.getElementById("minutes");
            const secondsEl = document.getElementById("seconds");

            if (distance < 0) {
                clearInterval(countdownInterval);
                const countdownSection = document.querySelector(".sale-countdown");
                if (countdownSection) {
                    countdownSection.innerHTML = '<h3 class="text-white fw-bold">SALE EXPIRED</h3>';
                }
                if (daysEl) daysEl.innerText = "00";
                if (hoursEl) hoursEl.innerText = "00";
                if (minutesEl) minutesEl.innerText = "00";
                if (secondsEl) secondsEl.innerText = "00";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (daysEl) daysEl.innerText = String(days).padStart(2, '0');
            if (hoursEl) hoursEl.innerText = String(hours).padStart(2, '0');
            if (minutesEl) minutesEl.innerText = String(minutes).padStart(2, '0');
            if (secondsEl) secondsEl.innerText = String(seconds).padStart(2, '0');
        }

        updateTimer();
        countdownInterval = setInterval(updateTimer, 1000);
    }

    // Render Coupons dynamically
    function renderCoupons(coupons) {
        const couponGrid = document.getElementById("couponGrid");
        if (!couponGrid) return;

        couponGrid.innerHTML = "";

        if (coupons.length === 0) {
            couponGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="no-coupons-wrap p-4" style="background: #fbfbfd; border-radius: 16px; border: 1px dashed #d2d2d7; max-width: 500px; margin: 0 auto;">
                        <i class="bi bi-ticket-perforated text-muted mb-3" style="font-size: 2.2rem; display: block;"></i>
                        <p class="text-muted m-0 fw-600">No active offers available right now. Check back soon.</p>
                    </div>
                </div>
            `;
            return;
        }

        coupons.forEach(c => {
            const formattedDate = new Date(c.expiryDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            const discountInfo = c.discountType === "Percentage (%)" ? `${c.value}% OFF` : `₹${c.value} OFF`;
            const minPurchaseVal = c.minPurchase || 0;
            const minPurchaseText = minPurchaseVal > 0 
                ? `On orders above ₹${minPurchaseVal}`
                : `No minimum purchase`;
            const description = c.discountType === "Percentage (%)"
                ? `Get ${c.value}% off. ${minPurchaseText}.`
                : `Get flat ₹${c.value} off. ${minPurchaseText}.`;

            const col = document.createElement("div");
            col.className = "col-md-4";
            col.innerHTML = `
                <div class="coupon-card">
                    <div class="coupon-info">
                        <span class="coupon-code text-uppercase">${c.code}</span>
                        <p class="coupon-desc fw-bold text-dark mb-1">${discountInfo}</p>
                        <p class="coupon-desc text-muted mb-2">${description}</p>
                        <p class="coupon-desc text-muted small mb-0" style="font-size: 0.72rem;">
                            <i class="bi bi-clock me-1"></i>Expires: ${formattedDate}
                        </p>
                    </div>
                    <button class="copy-btn" data-coupon-code="${c.code}">Copy</button>
                </div>
            `;
            couponGrid.appendChild(col);
        });

        bindCopyButtons();
    }

    // Bind copy functionality to buttons
    function bindCopyButtons() {
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const code = this.getAttribute('data-coupon-code');
                if (!code) return;
                navigator.clipboard.writeText(code).then(() => {
                    const originalText = this.innerText;
                    this.innerText = 'Copied!';
                    this.classList.add('copied');
                    if (window.AuthGuard && window.AuthGuard.showToast) {
                        window.AuthGuard.showToast(`Coupon ${code} copied to clipboard!`);
                    }
                    setTimeout(() => {
                        this.innerText = originalText;
                        this.classList.remove('copied');
                    }, 2000);
                });
            });
        });
    }

    // Load Discounted Products dynamically
    async function loadSaleProducts() {
        const grid = document.getElementById("saleProductsGrid");
        const template = document.getElementById("saleProductTemplate");
        if (!grid || !template) return;

        // Collect search filter if present
        const searchInput = document.querySelector('.search-input');
        const searchVal = searchInput ? searchInput.value.trim() : "";
        const queryUrl = `/api/products?onSale=true${searchVal ? `&search=${encodeURIComponent(searchVal)}` : ""}`;

        try {
            const res = await fetch(queryUrl);
            const data = await res.json();

            if (data.success && data.products) {
                renderSaleProducts(data.products);
            } else {
                grid.innerHTML = '<div class="col-12 text-center py-5 text-muted">No discounted products found.</div>';
            }
        } catch (error) {
            console.error("Error loading sale products:", error);
            grid.innerHTML = '<div class="col-12 text-center py-5 text-muted">Error loading products.</div>';
        }
    }

    // Render sale products to grid
    function renderSaleProducts(products) {
        const grid = document.getElementById("saleProductsGrid");
        const template = document.getElementById("saleProductTemplate");
        if (!grid || !template) return;

        grid.innerHTML = products.length ? "" : '<div class="col-12 text-center py-5 text-muted">No discounted products found</div>';

        products.forEach(p => {
            const clone = template.content.cloneNode(true);

            // Determine image path (fallback if no variant images)
            const mainImg = (p.variants?.[0]?.images?.[0]) ? `/images/products/${p.variants[0].images[0]}` : '/images/user/phoodie.jpeg';

            // Calculate discount percentage
            const price = p.price;
            const offerPrice = p.offerPrice || p.price;
            const discountPercentage = Math.round(((price - offerPrice) / price) * 100);

            // Populate Elements
            const badge = clone.querySelector(".discount-badge");
            if (badge) {
                if (discountPercentage > 0) {
                    badge.textContent = `${discountPercentage}% OFF`;
                } else {
                    badge.style.display = "none";
                }
            }

            const img = clone.querySelector(".sale-img-wrap img");
            if (img) {
                img.src = mainImg;
                img.alt = p.name;
            }

            const pLink = clone.querySelector(".p-link");
            if (pLink) pLink.href = `/product/${p._id}`;

            const cat = clone.querySelector(".sale-cat");
            if (cat) cat.textContent = p.category?.name || 'Clearance';

            const name = clone.querySelector(".sale-name");
            if (name) {
                name.textContent = p.name;
                name.href = `/product/${p._id}`;
            }

            const priceNew = clone.querySelector(".price-new");
            if (priceNew) priceNew.textContent = `₹${offerPrice}`;

            const priceOld = clone.querySelector(".price-old");
            if (priceOld) {
                if (discountPercentage > 0) {
                    priceOld.textContent = `₹${price}`;
                } else {
                    priceOld.style.display = "none";
                }
            }

            // Wire Up Add to Cart Button
            const cartBtn = clone.querySelector(".add-to-cart-sale");
            if (cartBtn) {
                cartBtn.addEventListener("click", async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Guard auth
                    const allowed = await window.AuthGuard.requireAuth(window.location.href);
                    if (!allowed) return;

                    // Choose variant and size in stock
                    const defaultVariant = p.variants?.[0];
                    const defaultSize = defaultVariant?.sizes?.find(s => s.stock > 0);

                    if (!defaultVariant || !defaultSize) {
                        // Redirect to details if stock or size not simple
                        window.location.href = `/product/${p._id}`;
                        return;
                    }

                    try {
                        const addRes = await fetch("/api/cart/add", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                productId: p._id,
                                variantId: defaultVariant._id,
                                size: defaultSize.size,
                                quantity: 1
                            })
                        });
                        const addData = await addRes.json();
                        if (addData.success) {
                            window.AuthGuard.updateCartBadge();
                            window.AuthGuard.showToast("Product added to cart!");
                        } else {
                            window.AuthGuard.showToast(addData.message || "Failed to add to cart", "error");
                        }
                    } catch (err) {
                        console.error(err);
                        window.location.href = `/product/${p._id}`;
                    }
                });
            }

            grid.appendChild(clone);
        });
    }

    // Set up search bar input listener for real-time filtering
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(loadSaleProducts, 500);
        });
    }

    // Run loaders
    loadSaleDetails();
    loadSaleProducts();
});
