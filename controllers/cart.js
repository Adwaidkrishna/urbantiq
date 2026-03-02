document.addEventListener("DOMContentLoaded", function () {
    // Quantity selectors — each cart item has its own +/-
    document.querySelectorAll('.cart-item').forEach(item => {
        const minus = item.querySelector('[data-action="minus"]');
        const plus = item.querySelector('[data-action="plus"]');
        const val = item.querySelector('.cart-qty-val');
        let qty = 1;

        if (plus) {
            plus.addEventListener('click', () => {
                qty = Math.min(qty + 1, 99);
                val.textContent = qty;
            });
        }
        if (minus) {
            minus.addEventListener('click', () => {
                qty = Math.max(qty - 1, 1);
                val.textContent = qty;
            });
        }
    });

    // Remove item — fade & collapse
    document.querySelectorAll('.cart-remove-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const item = this.closest('.cart-item');
            item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            item.style.opacity = '0';
            item.style.transform = 'translateX(12px)';
            setTimeout(() => item.remove(), 320);
        });
    });
});
