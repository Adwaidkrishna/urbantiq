document.addEventListener("DOMContentLoaded", () => {
    loadNewArrivals();
    loadTopSelling();
});

async function loadNewArrivals() {
    try {
        const res = await fetch("/api/products?newArrival=true&limit=4");
        const data = await res.json();
        
        const container = document.getElementById("newArrivalsGrid");
        if (!container) return;
        
        if (data.success && data.products && data.products.length > 0) {
            container.innerHTML = data.products.map(product => createHomeProductCard(product, true)).join('');
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
            container.innerHTML = data.products.map(product => createHomeProductCard(product, false)).join('');
        } else {
            container.innerHTML = '<div class="col-12"><p class="text-muted">No top selling products found.</p></div>';
        }
    } catch (error) {
        console.error("Error loading top selling products:", error);
    }
}

function createHomeProductCard(product, isNew) {
    const totalStock = product.variants ? product.variants.reduce((total, variant) => {
        return total + (variant.sizes ? variant.sizes.reduce((vTotal, size) => vTotal + (size.stock || 0), 0) : 0);
    }, 0) : 0;
    
    const isOutOfStock = totalStock === 0;
    const stockBadge = isOutOfStock ? `<span class="product-badge badge-dark">Sold Out</span>` : '';
    const newBadge = isNew && !isOutOfStock ? `<span class="product-badge badge-dark">New</span>` : '';
    
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
    const rating = product.averageRating || 0;
    for (let i = 1; i <= 5; i++) {
        if (rating >= i) {
            starsHtml += '<i class="bi bi-star-fill rating-star"></i>';
        } else if (rating >= i - 0.5) {
            starsHtml += '<i class="bi bi-star-half rating-star"></i>';
        } else {
            starsHtml += '<i class="bi bi-star rating-star"></i>';
        }
    }

    return `
        <div class="col-6 col-md-4 col-lg-3">
            <div class="product-card">
                <div class="product-img-wrap">
                    ${stockBadge || newBadge}
                    <a href="/product/${product._id}">
                        <img src="${defaultImage}" alt="${product.name}">
                    </a>
                    <div class="floating-actions">
                        <button class="action-btn wishlist-btn" title="Add to Wishlist" onclick="window.location.href='/product/${product._id}'"><i class="bi bi-heart"></i></button>
                        <button class="action-btn cart-btn" title="Add to Cart" onclick="window.location.href='/product/${product._id}'"><i class="bi bi-cart3"></i></button>
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
                        <span class="ms-1">${product.reviewCount || 0}</span>
                        <span class="review-count">(${product.salesCount || 0})</span>
                    </div>
                    <div class="product-bottom">
                        ${priceHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
}
