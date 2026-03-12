document.addEventListener("DOMContentLoaded", function () {
    // Payment option selection
    const options = document.querySelectorAll('.ck-payment-option');
    const cardFields = document.getElementById('cardFields');

    if (options.length && cardFields) {
        options.forEach(opt => {
            opt.addEventListener('click', function () {
                options.forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                const val = this.querySelector('input[type="radio"]').value;
                cardFields.classList.toggle('visible', val === 'card');
            });
        });
    }

    // Coupon apply (checkout-summary)
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', function () {
            const val = document.getElementById('couponInput').value.trim();
            const msg = document.getElementById('couponSuccess');
            if (val && msg) {
                msg.classList.remove('d-none');
                this.textContent = '✓ Applied';
                this.style.background = '#34c759';
            }
        });
    }
});
