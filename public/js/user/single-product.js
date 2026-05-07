let selectedSize = null;
let selectedSizeStock = 0;
let isProductInitialized = false;

document.addEventListener("DOMContentLoaded", function () {
    if (isProductInitialized) return;
    isProductInitialized = true;

    const display = document.getElementById('qtyDisplay');
    const qtyPlus = document.getElementById('qtyPlus');
    const qtyMinus = document.getElementById('qtyMinus');

    if (qtyPlus && display) {
        qtyPlus.addEventListener('click', () => {
            let current = parseInt(display.textContent) || 1;
            const maxStock = selectedSizeStock || 99;
            if (current < maxStock) {
                display.textContent = current + 1;
            } else {
                if (window.AuthGuard && window.AuthGuard.showToast) {
                    window.AuthGuard.showToast("Cannot exceed available stock", "error");
                }
            }
        });
    }
    if (qtyMinus && display) {
        qtyMinus.addEventListener('click', () => {
            let current = parseInt(display.textContent) || 1;
            display.textContent = Math.max(current - 1, 1);
        });
    }


    // Extraction helper
    function getProductId() {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const id = pathParts[pathParts.length - 1];
        return id.endsWith('.html') ? id.slice(0, -5) : id;
    }

    // Image wishlist toggle
    const imgWishlistBtn = document.getElementById('imgWishlistBtn');
    if (imgWishlistBtn) {
        imgWishlistBtn.addEventListener('click', async function () {
            const allowed = await window.AuthGuard.requireAuth(window.location.href);
            if (!allowed) return;

            const productId = getProductId();

            try {
                const res = await fetch("/api/wishlist/toggle", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId })
                });
                const data = await res.json();
                if (data.success) {
                    window.AuthGuard.updateWishlistBadge();
                    const icon = document.getElementById('imgWishlistIcon');
                    if (data.added) {
                        icon.classList.replace('bi-heart', 'bi-heart-fill');
                        this.classList.add('active');
                        window.AuthGuard.showToast("Product added to wishlist!");
                    } else {
                        icon.classList.replace('bi-heart-fill', 'bi-heart');
                        this.classList.remove('active');
                        window.AuthGuard.showToast("Removed from wishlist.");
                    }
                }
            } catch (err) {
                console.error("Wishlist toggle error:", err);
            }
        });
    }

    // Add to Cart — requires login
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', async function () {
            const allowed = await window.AuthGuard.requireAuth(window.location.href);
            if (!allowed) return;

            const productId = getProductId();
            const activeVariantBtn = document.querySelector('.sp-color.active');
            const variantId = activeVariantBtn ? activeVariantBtn.dataset.id : null;
            
            const size = selectedSize;
            console.log("Final size (Add to Cart):", size);

            // Ensure we read the EXACT quantity currently displayed in the UI
            const finalQty = parseInt(document.getElementById('qtyDisplay').textContent) || 1;

            if (!variantId || !size) {
                window.AuthGuard.showToast("Please select a color and size", "error");
                return;
            }

            if (selectedSizeStock <= 0) {
                window.AuthGuard.showToast("This item is currently out of stock", "error");
                return;
            }

            if (finalQty > selectedSizeStock) {
                window.AuthGuard.showToast(`Only ${selectedSizeStock} items available in stock`, "error");
                return;
            }

            try {
                const res = await fetch("/api/cart/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        productId,
                        variantId,
                        size,
                        quantity: finalQty
                    })
                });
                const data = await res.json();

                if (data.success) {
                    window.AuthGuard.updateCartBadge();
                    window.AuthGuard.showToast("Product added to cart!");
                } else {
                    window.AuthGuard.showToast(data.message || "Failed to add to cart", "error");
                }
            } catch (err) {
                console.error("Add to cart error:", err);
                window.AuthGuard.showToast("Something went wrong. Try again.", "error");
            }
        });
    }

    // Order Now — requires login
    const orderNowBtn = document.getElementById('orderNowBtn');
    if (orderNowBtn) {
        orderNowBtn.addEventListener('click', async function (e) {
            e.preventDefault();
            const allowed = await window.AuthGuard.requireAuth(window.location.href);
            if (!allowed) return;

            const productId = getProductId();
            const activeVariantBtn = document.querySelector('.sp-color.active');
            const variantId = activeVariantBtn ? activeVariantBtn.dataset.id : null;
            
            const size = selectedSize;
            console.log("Final size (Order Now):", size);

            // Ensure we read the EXACT quantity currently displayed in the UI
            const finalQty = parseInt(document.getElementById('qtyDisplay').textContent) || 1;

            if (!variantId || !size) {
                window.AuthGuard.showToast("Please select a color and size", "error");
                return;
            }

            if (selectedSizeStock <= 0) {
                window.AuthGuard.showToast("This item is currently out of stock", "error");
                return;
            }

            if (finalQty > selectedSizeStock) {
                window.AuthGuard.showToast(`Only ${selectedSizeStock} items available in stock`, "error");
                return;
            }

            try {
                const res = await fetch("/api/cart/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    // clearCart ensures the checkout contains ONLY this item (Buy Now behavior)
                    body: JSON.stringify({ productId, variantId, size, quantity: finalQty, override: true, clearCart: true })
                });
                const data = await res.json();
                if (data.success) {
                    window.location.href = '/checkout-details';
                } else {
                    window.AuthGuard.showToast(data.message || "Something went wrong.", "error");
                }
            } catch (err) {
                window.location.href = '/checkout-details';
            }
        });
    }

    // Load dynamic product data
    loadSingleProduct();
});

async function checkWishlistStatus(productId) {
    try {
        const res = await fetch("/api/wishlist");
        const data = await res.json();
        if (data.success && data.products) {
            const isWished = data.products.some(p => p._id === productId);
            if (isWished) {
                const icon = document.getElementById('imgWishlistIcon');
                const btn = document.getElementById('imgWishlistBtn');
                if (icon) icon.classList.replace('bi-heart', 'bi-heart-fill');
                if (btn) btn.classList.add('active');
            }
        }
    } catch (err) {
        console.error("Error checking wishlist:", err);
    }
}

async function loadSingleProduct() {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const productId = pathParts[pathParts.length - 1];

    if (!productId || productId === 'product') {
        return;
    }

    try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();

        if (data.success && data.product) {
            renderProduct(data.product);
            checkWishlistStatus(productId);
            loadReviews(productId);
            loadRelatedProducts(data.product.category?._id, productId);
        } else {
            console.error("Product not found");
            const titleEl = document.querySelector('.sp-title');
            if (titleEl) titleEl.textContent = "Product Not Found";
        }
    } catch (err) {
        console.error("Error fetching product:", err);
    }
}

async function loadReviews(productId) {
    try {
        const res = await fetch(`/api/reviews/${productId}`);
        const data = await res.json();

        if (data.success && data.reviews) {
            renderReviews(data.reviews);
        }
    } catch (err) {
        console.error("Error fetching reviews:", err);
    }
}

function renderStars(rating, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = "";
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            container.innerHTML += '<i class="bi bi-star-fill"></i>';
        } else if (i === fullStars + 1 && hasHalfStar) {
            container.innerHTML += '<i class="bi bi-star-half"></i>';
        } else {
            container.innerHTML += '<i class="bi bi-star"></i>';
        }
    }
}

function renderReviews(reviews) {
    const listContainer = document.getElementById('reviewsList');
    if (!listContainer) return;

    if (reviews.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-chat-left-dots fs-1 mb-3 d-block"></i>
                <p>No reviews yet for this product. Be the first to review it from your orders!</p>
            </div>`;
        return;
    }

    listContainer.innerHTML = reviews.map(review => {
        const date = new Date(review.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
        
        let stars = "";
        for (let i = 1; i <= 5; i++) {
            stars += `<i class="bi bi-star-fill ${i <= review.rating ? 'text-warning' : 'text-light'}"></i>`;
        }

        return `
            <div class="review-item mb-4 pb-4 border-bottom">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <div class="fw-bold fs-6 mb-1">${review.user?.name || "Verified Buyer"}</div>
                        <div class="text-warning small mb-2">${stars}</div>
                    </div>
                    <span class="text-muted small">${date}</span>
                </div>
                <div class="review-comment text-secondary" style="font-size: 0.95rem; line-height: 1.6;">
                    ${review.comment || '<span class="fst-italic text-muted">No comment provided.</span>'}
                </div>
                <div class="mt-2">
                    <span class="badge bg-light text-success border border-success-subtle fw-normal" style="font-size: 0.7rem;">
                        <i class="bi bi-patch-check-fill me-1"></i> Verified Purchase
                    </span>
                </div>
            </div>`;
    }).join("");
}

function renderProduct(product) {
    // Breadcrumb
    const bName = document.getElementById("breadcrumbName");
    if (bName) bName.textContent = product.name;

    // Title & Category
    const titleEl = document.querySelector(".sp-title");
    if (titleEl) titleEl.textContent = product.name;
    const catEl = document.querySelector(".sp-category");
    if (catEl) catEl.textContent = (product.category && product.category.name) ? product.category.name : 'Fashion';

    // Price
    const priceEl = document.querySelector(".sp-price");
    const oldPriceEl = document.querySelector(".sp-price-old");
    const discountEl = document.querySelector(".sp-discount-tag");

    if (product.offerPrice && product.offerPrice < product.price) {
        if (priceEl) priceEl.textContent = `₹${product.offerPrice}`;
        if (oldPriceEl) {
            oldPriceEl.textContent = `₹${product.price}`;
            oldPriceEl.style.display = 'inline-block';
        }
        if (discountEl) {
            const discount = Math.round(((product.price - product.offerPrice) / product.price) * 100);
            discountEl.textContent = `${discount}% OFF`;
            discountEl.style.display = 'inline-block';
        }
    } else {
        if (priceEl) priceEl.textContent = `₹${product.price}`;
        if (oldPriceEl) oldPriceEl.style.display = 'none';
        if (discountEl) discountEl.style.display = 'none';
    }

    // Description
    const descEl = document.querySelector(".sp-desc");
    if (descEl) descEl.innerHTML = product.description;
    
    // Ratings Summary
    const avgRating = product.averageRating || 0;
    const reviewCount = product.reviewCount || 0;
    
    renderStars(avgRating, 'productAvgRatingStars');
    const avgText = document.getElementById('productAvgRatingText');
    if (avgText) avgText.textContent = avgRating.toFixed(1);
    const countText = document.getElementById('productReviewCountText');
    if (countText) countText.textContent = `(${reviewCount} reviews)`;

    // Main Review Summary Section
    const sumRating = document.getElementById('reviewsSummaryRating');
    if (sumRating) sumRating.textContent = avgRating.toFixed(1);
    renderStars(avgRating, 'reviewsSummaryStars');
    const sumCount = document.getElementById('reviewsSummaryCount');
    if (sumCount) sumCount.textContent = `Based on ${reviewCount} reviews`;

    // Variants (Colors, Sizes, Images)
    if (product.variants && product.variants.length > 0) {
        const defaultVariant = product.variants[0];

        // Colors
        const colorRow = document.querySelector(".sp-color-row");
        const colorLabel = document.querySelector(".sp-option-val");

        if (colorRow) {
            colorRow.innerHTML = "";
            if (colorLabel) colorLabel.textContent = defaultVariant.colorName || 'Default';

            product.variants.forEach((v, index) => {
                const btn = document.createElement("button");
                btn.className = `sp-color ${index === 0 ? 'active' : ''}`;
                btn.style.background = v.color || '#ccc';
                btn.dataset.id = v._id;
                btn.title = v.colorName || '';
                btn.setAttribute('aria-label', v.colorName || '');

                btn.addEventListener('click', () => {
                    document.querySelectorAll('.sp-color').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    if (colorLabel) colorLabel.textContent = v.colorName || 'Default';
                    renderVariantImagesAndSizes(v, product);
                });

                colorRow.appendChild(btn);
            });
        }

        renderVariantImagesAndSizes(defaultVariant, product);
    }
}

function renderVariantImagesAndSizes(variant, product = null) {
    // Images
    const mainImg = document.getElementById("mainProductImg");
    const thumbsContainer = document.querySelector(".sp-thumbs");

    if (thumbsContainer) thumbsContainer.innerHTML = "";

    let allImages = [];
    if (product && product.variants) {
        const currentImages = variant.images || [];
        const otherImages = product.variants.filter(v => v !== variant).flatMap(v => v.images || []);
        allImages = Array.from(new Set([...currentImages, ...otherImages]));
    } else {
        allImages = variant.images || [];
    }

    if (allImages.length > 0) {
        if (mainImg) mainImg.src = `/images/products/${allImages[0]}`;

        if (thumbsContainer) {
            let displayImages = allImages.slice(0, 4);
            let i = 0;
            while (displayImages.length < 4) {
                displayImages.push(allImages[i % allImages.length]);
                i++;
            }

            displayImages.forEach((img, idx) => {
                const btn = document.createElement("button");
                btn.className = `sp-thumb ${idx === 0 ? 'active' : ''}`;
                btn.dataset.src = `/images/products/${img}`;

                const imgEl = document.createElement("img");
                imgEl.src = `/images/products/${img}`;
                imgEl.alt = `View ${idx + 1}`;

                btn.appendChild(imgEl);
                btn.addEventListener('click', function () {
                    const src = this.getAttribute('data-src');
                    if (mainImg) mainImg.src = src;
                    document.querySelectorAll('.sp-thumb').forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                });
                thumbsContainer.appendChild(btn);
            });
        }
    }

    // Sizes
    const sizeRow = document.querySelector(".sp-size-row");
    if (sizeRow) {
        sizeRow.innerHTML = "";

        if (variant.sizes && variant.sizes.length > 0) {
            // First, reset the selection global if we are changing variants
            let defaultSizeFound = false;

            variant.sizes.forEach((s, idx) => {
                const btn = document.createElement("button");
                const hasStock = s.stock > 0;
                btn.className = "sp-size";
                btn.textContent = s.size;
                btn.dataset.stock = s.stock;

                if (!hasStock) {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.textDecoration = 'line-through';
                    btn.title = 'Out of Stock';
                } else {
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.sp-size').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        
                        // Update global state
                        selectedSize = s.size;
                        selectedSizeStock = s.stock;
                        
                        // Update stock label
                        const stockLabel = document.getElementById('stockLabel');
                        if (stockLabel) {
                            stockLabel.textContent = s.stock < 3 ? `Only ${s.stock} left!` : "";
                            stockLabel.style.color = '#ff3b30';
                        }
                        // Reset qty to 1 when changing size
                        const currentDisplay = document.getElementById('qtyDisplay');
                        if(currentDisplay) currentDisplay.textContent = "1";
                    });

                    // Auto-select the first available size with stock as the default
                    if (!defaultSizeFound) {
                        btn.classList.add('active');
                        selectedSize = s.size;
                        selectedSizeStock = s.stock;
                        defaultSizeFound = true;
                    }
                }

                // Initial UI state for stock label if this matches the currently active default
                if (selectedSize === s.size) {
                    const stLabel = document.getElementById('stockLabel');
                    if (stLabel) {
                        stLabel.textContent = s.stock < 3 ? `Only ${s.stock} left!` : "";
                        stLabel.style.color = '#ff3b30';
                    }
                }

                sizeRow.appendChild(btn);
            });

            // If no size was ever found with stock
            if (!defaultSizeFound) {
                selectedSize = null;
                selectedSizeStock = 0;
            }

        } else {
            sizeRow.innerHTML = "<span class='text-muted'>Out of stock</span>";
            selectedSize = null;
            selectedSizeStock = 0;
        }
    }
}

async function loadRelatedProducts(categoryId, currentProductId) {
    if (!categoryId) return;
    try {
        const res = await fetch(`/api/products?category=${categoryId}&limit=4`);
        const data = await res.json();
        if (data.success && data.products) {
            const filtered = data.products.filter(p => p._id !== currentProductId).slice(0, 4);
            renderRelatedProducts(filtered);
        }
    } catch (err) {
        console.error("Error loading related products:", err);
    }
}

function renderRelatedProducts(products) {
    const row = document.getElementById('relatedProductsRow');
    if (!row) return;

    if (products.length === 0) {
        row.innerHTML = '<p class="text-muted text-center w-100 py-3">No similar products found.</p>';
        return;
    }

    row.innerHTML = products.map(p => {
        const price = p.offerPrice && p.offerPrice < p.price ? p.offerPrice : p.price;
        const oldPrice = (p.offerPrice && p.offerPrice < p.price) ? `<span class="text-decoration-line-through text-muted ms-1 small">₹${p.price}</span>` : "";
        const image = p.variants?.[0]?.images?.[0] ? `/images/products/${p.variants[0].images[0]}` : '/images/user/phoodie.jpeg';
        
        return `
            <div class="col-6 col-md-3">
                <a href="/product/${p._id}" class="text-decoration-none text-dark">
                    <div class="card border-0 h-100 shadow-sm rounded-4 overflow-hidden product-card-hover" style="transition: transform 0.3s ease;">
                        <div class="position-relative overflow-hidden" style="height: 280px;">
                            <img src="${image}" class="card-img-top w-100 h-100" alt="${p.name}" style="object-fit: cover;">
                        </div>
                        <div class="card-body p-3">
                            <h6 class="fw-bold mb-1 text-truncate" style="font-size: 0.9rem;">${p.name}</h6>
                            <p class="text-muted small mb-2" style="font-size: 0.75rem;">${p.category?.name || 'Fashion'}</p>
                            <div class="d-flex align-items-center">
                                <span class="fw-bold text-dark">₹${price}</span>
                                ${oldPrice}
                            </div>
                        </div>
                    </div>
                </a>
            </div>
        `;
    }).join("");
}
