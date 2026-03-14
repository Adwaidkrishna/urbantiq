document.addEventListener("DOMContentLoaded", function () {
    // Quantity
    let qty = 1;
    const display = document.getElementById('qtyDisplay');
    const qtyPlus = document.getElementById('qtyPlus');
    const qtyMinus = document.getElementById('qtyMinus');

    if (qtyPlus && display) {
        qtyPlus.addEventListener('click', () => {
            qty = Math.min(qty + 1, 99);
            display.textContent = qty;
        });
    }
    if (qtyMinus && display) {
        qtyMinus.addEventListener('click', () => {
            qty = Math.max(qty - 1, 1);
            display.textContent = qty;
        });
    }

    // Image wishlist toggle
    const imgWishlistBtn = document.getElementById('imgWishlistBtn');
    if (imgWishlistBtn) {
        imgWishlistBtn.addEventListener('click', function () {
            const icon = document.getElementById('imgWishlistIcon');
            const isWished = icon.classList.contains('bi-heart-fill');
            icon.classList.replace(
                isWished ? 'bi-heart-fill' : 'bi-heart',
                isWished ? 'bi-heart' : 'bi-heart-fill'
            );
            this.classList.toggle('active', !isWished);
        });
    }

    // Add to Cart feedback
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function () {
            this.classList.add('added');
            this.innerHTML = '<i class="bi bi-check-circle"></i> Added to Cart';
            setTimeout(() => {
                this.classList.remove('added');
                this.innerHTML = '<i class="bi bi-bag-plus"></i> Add to Cart';
            }, 1800);
        });
    }

    // Load dynamic product data
    loadSingleProduct();
});

async function loadSingleProduct() {
    const pathParts = window.location.pathname.split('/');
    const productId = pathParts[pathParts.length - 1];

    if (!productId || productId === 'product') {
        return; 
    }

    try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();

        if (data.success && data.product) {
            renderProduct(data.product);
        } else {
            console.error("Product not found");
            const titleEl = document.querySelector('.sp-title');
            if (titleEl) titleEl.textContent = "Product Not Found";
        }
    } catch (err) {
        console.error("Error fetching product:", err);
    }
}

function renderProduct(product) {
    // Breadcrumb
    const breadcrumbSpans = document.querySelectorAll(".sp-breadcrumb span");
    if(breadcrumbSpans.length) breadcrumbSpans[0].textContent = product.name;

    // Title & Category
    const titleEl = document.querySelector(".sp-title");
    if(titleEl) titleEl.textContent = product.name;
    const catEl = document.querySelector(".sp-category");
    if(catEl) catEl.textContent = (product.category && product.category.name) ? product.category.name : 'Uncategorized';
    
    // Price
    const priceEl = document.querySelector(".sp-price");
    const oldPriceEl = document.querySelector(".sp-price-old");
    const discountEl = document.querySelector(".sp-discount-tag");
    
    if (product.offerPrice && product.offerPrice < product.price) {
        if(priceEl) priceEl.textContent = `₹${product.offerPrice}`;
        if(oldPriceEl) {
            oldPriceEl.textContent = `₹${product.price}`;
            oldPriceEl.style.display = 'inline-block';
        }
        if(discountEl) {
            const discount = Math.round(((product.price - product.offerPrice) / product.price) * 100);
            discountEl.textContent = `${discount}% OFF`;
            discountEl.style.display = 'inline-block';
        }
    } else {
        if(priceEl) priceEl.textContent = `₹${product.price}`;
        if(oldPriceEl) oldPriceEl.style.display = 'none';
        if(discountEl) discountEl.style.display = 'none';
    }

    // Description
    const descEl = document.querySelector(".sp-desc");
    if(descEl) descEl.innerHTML = product.description;

    // Variants (Colors, Sizes, Images)
    if (product.variants && product.variants.length > 0) {
        const defaultVariant = product.variants[0];
        
        // Colors
        const colorRow = document.querySelector(".sp-color-row");
        const colorLabel = document.querySelector(".sp-option-val");
        
        if (colorRow) {
            colorRow.innerHTML = "";
            if(colorLabel) colorLabel.textContent = defaultVariant.colorName || 'Default';
            
            product.variants.forEach((v, index) => {
                const btn = document.createElement("button");
                btn.className = `sp-color ${index === 0 ? 'active' : ''}`;
                btn.style.background = v.color || '#ccc';
                btn.title = v.colorName || '';
                btn.setAttribute('aria-label', v.colorName || '');
                
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.sp-color').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    if(colorLabel) colorLabel.textContent = v.colorName || 'Default';
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
    
    // Aggregate images across all variants, prioritizing the current variant first
    let allImages = [];
    if (product && product.variants) {
        const currentImages = variant.images || [];
        const otherImages = product.variants.filter(v => v !== variant).flatMap(v => v.images || []);
        allImages = Array.from(new Set([...currentImages, ...otherImages]));
    } else {
        allImages = variant.images || [];
    }
    
    if (allImages.length > 0) {
        // Set first image as main image
        if(mainImg) mainImg.src = `/images/products/${allImages[0]}`;
        
        if (thumbsContainer) {
            // Fill array to ensure exactly 4 thumbnails always show in the grid
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
                btn.setAttribute('aria-label', `View ${idx + 1}`);
                
                const imgEl = document.createElement("img");
                imgEl.src = `/images/products/${img}`;
                imgEl.alt = `View ${idx + 1}`;
                
                btn.appendChild(imgEl);
                
                btn.addEventListener('click', function() {
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
            variant.sizes.forEach((s, idx) => {
                const btn = document.createElement("button");
                const hasStock = s.stock > 0;
                btn.className = `sp-size ${idx === 0 && hasStock ? 'active' : ''}`;
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
                    });
                }
                
                sizeRow.appendChild(btn);
            });
        } else {
            sizeRow.innerHTML = "<span class='text-muted'>Out of stock</span>";
        }
    }
}
