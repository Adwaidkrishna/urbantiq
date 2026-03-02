document.addEventListener("DOMContentLoaded", function () {
    // Thumbnail image swap via data-src
    document.querySelectorAll('.sp-thumb[data-src]').forEach(thumb => {
        thumb.addEventListener('click', function () {
            const mainImg = document.getElementById('mainProductImg');
            if (mainImg) mainImg.src = this.getAttribute('data-src');
            document.querySelectorAll('.sp-thumb').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Size selection
    document.querySelectorAll('.sp-size').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sp-size').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Color selection
    document.querySelectorAll('.sp-color').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sp-color').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

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
});
