document.addEventListener("DOMContentLoaded", function () {
    // Countdown Timer Logic
    const countdownDate = new Date().getTime() + (3 * 24 * 60 * 60 * 1000); // 3 days from now

    const x = setInterval(function () {
        const now = new Date().getTime();
        const distance = countdownDate - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const daysEl = document.getElementById("days");
        const hoursEl = document.getElementById("hours");
        const minutesEl = document.getElementById("minutes");
        const secondsEl = document.getElementById("seconds");

        if (daysEl) daysEl.innerHTML = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.innerHTML = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.innerHTML = String(minutes).padStart(2, '0');
        if (secondsEl) secondsEl.innerHTML = String(seconds).padStart(2, '0');

        if (distance < 0) {
            clearInterval(x);
            const countdown = document.querySelector(".sale-countdown");
            if (countdown) countdown.innerHTML = "SALE EXPIRED";
        }
    }, 1000);

    // Coupon copy buttons — delegate using data attribute
    document.querySelectorAll('[data-coupon-code]').forEach(btn => {
        btn.addEventListener('click', function () {
            const code = this.getAttribute('data-coupon-code');
            if (!code) return;
            navigator.clipboard.writeText(code).then(() => {
                const originalText = this.innerText;
                this.innerText = 'Copied!';
                this.classList.add('copied');
                setTimeout(() => {
                    this.innerText = originalText;
                    this.classList.remove('copied');
                }, 2000);
            });
        });
    });
});
