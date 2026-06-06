document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');
    const orderIdDisplay = document.getElementById('orderIdDisplay');
    const deliveryMsg = document.getElementById('deliveryMsg');
    
    if (orderId && orderIdDisplay) {
        orderIdDisplay.textContent = `#ORD-${orderId.slice(-6).toUpperCase()}`;
    }

    // Dynamic Delivery Date (e.g., 4 days from today)
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    const dateArr = new Date();
    dateArr.setDate(dateArr.getDate() + 4);
    const deliveryDateStr = dateArr.toLocaleDateString('en-IN', options);
    
    if(deliveryMsg) {
        deliveryMsg.innerHTML = `Your package is expected to arrive by <span class="fw-700">${deliveryDateStr}</span>.`;
    }

    // CONFETTI CELEBRATION!
    if (window.confetti) {
        const count = 200;
        const defaults = { origin: { y: 0.7 } };

        function fire(particleRatio, opts) {
            confetti(Object.assign({}, defaults, opts, {
                particleCount: Math.floor(count * particleRatio)
            }));
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }
});
