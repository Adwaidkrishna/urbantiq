document.addEventListener("DOMContentLoaded", () => {
    initHomeProductSections();
});

async function initHomeProductSections() {
    // 1. Inject skeleton placeholders
    injectSkeletons("newArrivalsGrid", 4);
    injectSkeletons("topSellingGrid", 4);
    
    // 2. Load products concurrently
    await Promise.all([
        loadNewArrivals(),
        loadTopSelling()
    ]);
    
    // 3. Attach dynamic wishlist/cart listeners (exposed by script.js)
    if (window.attachDynamicListeners) {
        window.attachDynamicListeners();
    }
}

function injectSkeletons(containerId, count) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="col-6 col-md-6 col-lg-3">
                <div class="product-card skeleton-card">
                    <div class="product-img-wrap skeleton-pulse" style="aspect-ratio: 3/4; background: #e5e5e7; opacity: 0.6;"></div>
                    <div class="product-info">
                        <div class="skeleton-pulse" style="height: 10px; width: 40%; background: #e5e5e7; margin-bottom: 8px; border-radius: 4px; opacity: 0.6;"></div>
                        <div class="skeleton-pulse" style="height: 14px; width: 85%; background: #e5e5e7; margin-bottom: 8px; border-radius: 4px; opacity: 0.6;"></div>
                        <div class="skeleton-pulse" style="height: 12px; width: 55%; background: #e5e5e7; margin-bottom: 8px; border-radius: 4px; opacity: 0.6;"></div>
                        <div class="skeleton-pulse" style="height: 14px; width: 35%; background: #e5e5e7; border-radius: 4px; opacity: 0.6;"></div>
                    </div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

async function loadNewArrivals() {
    try {
        const res = await fetch("/api/products?newArrival=true&limit=4");
        const data = await res.json();
        
        const container = document.getElementById("newArrivalsGrid");
        if (!container) return;
        
        if (data.success && data.products && data.products.length > 0) {
            container.innerHTML = data.products.map(product => createHomeProductCard(product, true, false)).join('');
        } else {
            container.innerHTML = '<div class="col-12"><p class="text-muted">No new arrivals found.</p></div>';
        }
    } catch (error) {
        console.error("Error loading new arrivals:", error);
    }
}

async function loadTopSelling() {
    try {
        const res = await fetch("/api/products?sort=Most Popular&limit=4");
        const data = await res.json();
        
        const container = document.getElementById("topSellingGrid");
        if (!container) return;
        
        if (data.success && data.products && data.products.length > 0) {
            container.innerHTML = data.products.map(product => createHomeProductCard(product, false, true)).join('');
        } else {
            container.innerHTML = '<div class="col-12"><p class="text-muted">No top selling products found.</p></div>';
        }
    } catch (error) {
        console.error("Error loading top selling products:", error);
    }
}

function createHomeProductCard(product, isNew, isBestSeller = false) {
    const totalStock = product.variants ? product.variants.reduce((total, variant) => {
        return total + (variant.sizes ? variant.sizes.reduce((vTotal, size) => vTotal + (size.stock || 0), 0) : 0);
    }, 0) : 0;
    
    const isOutOfStock = totalStock === 0;
    let badgeHtml = '';
    
    if (isOutOfStock) {
        badgeHtml = `<span class="product-badge badge-dark">Sold Out</span>`;
    } else if (isNew) {
        badgeHtml = `<span class="product-badge badge-dark">New</span>`;
    } else if (isBestSeller) {
        badgeHtml = `<span class="product-badge badge-white">Best Seller</span>`;
    }
    
    // Determine colors
    const colors = [];
    if (product.variants) {
        product.variants.forEach(v => {
            if (v.color && !colors.includes(v.color)) {
                colors.push(v.color);
            }
        });
    }

    const colorDotsHtml = colors.map(c => `<div class="color-dot" style="background-color: ${c}" title="${c}"></div>`).join('');

    let priceHtml = '';
    if (product.offerPrice && product.offerPrice < product.price) {
        priceHtml = `
            <span class="product-price text-danger">₹${product.offerPrice}</span>
            <span class="product-price-old">₹${product.price}</span>
        `;
    } else {
        priceHtml = `<span class="product-price">₹${product.price}</span>`;
    }

    const defaultImage = (product.variants?.[0]?.images?.[0]) ? `/images/products/${product.variants[0].images[0]}` : '/images/no-image.png';
    const categoryName = product.category && product.category.name ? product.category.name : 'Uncategorized';
    
    let starsHtml = '';
    const rating = product.averageRating !== undefined ? product.averageRating : 0;
    const reviews = product.reviewCount !== undefined ? product.reviewCount : 0;
    
    for (let i = 1; i <= 5; i++) {
        if (rating > 0 && rating >= i) {
            starsHtml += '<i class="bi bi-star-fill rating-star"></i>';
        } else if (rating > 0 && rating >= i - 0.5) {
            starsHtml += '<i class="bi bi-star-half rating-star"></i>';
        } else {
            starsHtml += '<i class="bi bi-star rating-star"></i>';
        }
    }

    return `
        <div class="col-6 col-md-6 col-lg-3">
            <div class="product-card">
                <div class="product-img-wrap">
                    ${badgeHtml}
                    <a href="/product/${product._id}">
                        <img src="${defaultImage}" alt="${product.name}">
                    </a>
                    <div class="floating-actions">
                        <button class="action-btn wishlist-btn-dynamic" title="Add to Wishlist" data-id="${product._id}"><i class="bi bi-heart"></i></button>
                        <button class="action-btn cart-btn-dynamic" title="Add to Cart" data-id="${product._id}"><i class="bi bi-cart3"></i></button>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-category">${categoryName}</div>
                    <h4 class="product-title">
                        <a href="/product/${product._id}">${product.name}</a>
                    </h4>
                    ${colors.length > 0 ? `<div class="product-colors">${colorDotsHtml}</div>` : ''}
                    <div class="product-rating">
                        ${starsHtml}
                        <span class="ms-1 font-semibold">${rating}</span>
                        <span class="review-count">(${reviews} reviews)</span>
                    </div>
                    <div class="product-bottom">
                        ${priceHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
}
