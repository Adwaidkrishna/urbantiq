document.addEventListener("DOMContentLoaded", function () {
    // Move to Cart feedback
    document.querySelectorAll('.wl-cart-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const orig = this.innerHTML;
            this.innerHTML = '<i class="bi bi-check-circle"></i> Added';
            this.classList.add('wl-cart-added');
            setTimeout(() => {
                this.innerHTML = orig;
                this.classList.remove('wl-cart-added');
            }, 1800);
        });
    });

    // Remove item from wishlist
    document.querySelectorAll('.wl-remove-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const card = this.closest('[class^="col-"]');
            if (card) {
                card.style.transition = 'opacity 0.3s ease';
                card.style.opacity = '0';
                setTimeout(() => card.remove(), 320);
            }
        });
    });
});
q``