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
    
    if (deliveryMsg) {
        deliveryMsg.innerHTML = `Your package is expected to arrive by <span class="fw-700">${deliveryDateStr}</span>.`;
    }
});
