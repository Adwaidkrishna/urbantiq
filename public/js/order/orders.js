document.addEventListener("DOMContentLoaded", () => {
    const orderListContainer = document.getElementById("orderList");

    if (orderListContainer) {
        fetchOrders();
    }

    async function fetchOrders() {
        try {
            const response = await fetch("/api/orders/my-orders");
            const orders = await response.json();

            if (orders.length === 0) {
                orderListContainer.innerHTML = `
                    <div class="text-center py-5">
                        <i class="bi bi-bag-x text-muted" style="font-size: 3rem;"></i>
                        <h4 class="mt-3">No orders yet</h4>
                        <p class="text-muted">You haven't placed any orders with us yet.</p>
                        <a href="/product" class="btn btn-dark mt-2">Start Shopping</a>
                    </div>
                `;
                return;
            }

            renderOrders(orders);
        } catch (error) {
            console.error("Error fetching orders:", error);
            orderListContainer.innerHTML = `<p class="text-danger">Failed to load orders. Please try again later.</p>`;
        }
    }

    function renderOrders(orders) {
        orderListContainer.innerHTML = ""; // Clear placeholders

        orders.forEach(order => {
            // Handle dummy products: Skip this order entirely if any of its products are null (deleted from DB)
            const hasDummyProduct = order.items.some(item => !item.product);
            if (hasDummyProduct) return;

            const orderDate = new Date(order.createdAt);
            const date = orderDate.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });

            // Calculate Delivery Date (+7 days)
            const deliveryDate = new Date(orderDate);
            deliveryDate.setDate(deliveryDate.getDate() + 7);
            const deliveryDateStr = deliveryDate.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });

            const statusClass = getStatusClass(order.orderStatus);
            const itemCount = order.items.length;
            const totalAmount = order.finalAmount.toLocaleString("en-IN");

            const card = document.createElement("div");
            card.className = "card shadow-sm border-0 rounded-4 p-4 mb-4 order-card-premium"; // Added premium CSS classes
            
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
                    <div>
                        <div class="fw-bold mb-1" style="font-size: 1.1rem; color: #111;">#ORD-${order._id.slice(-6).toUpperCase()}</div>
                        <div class="text-secondary d-flex flex-wrap gap-2" style="font-size: 0.85rem;">
                            <span><i class="bi bi-calendar3 me-1"></i> Ordered on ${date}</span>
                            ${order.orderStatus.toLowerCase() !== 'cancelled' && order.orderStatus.toLowerCase() !== 'delivered' ? 
                                `<span class="text-success fw-bold"><i class="bi bi-truck me-1"></i> Arriving by ${deliveryDateStr}</span>` : ''}
                            ${order.orderStatus.toLowerCase() === 'delivered' ? 
                                `<span class="text-success fw-bold"><i class="bi bi-check-circle me-1"></i> Delivered</span>` : ''}
                        </div>
                    </div>
                    <span class="badge rounded-pill ${statusClass}" style="font-size: 0.75rem; padding: 0.5em 1em; letter-spacing: 0.5px; text-transform: uppercase;">
                        ${order.orderStatus}
                    </span>
                </div>
                
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div class="d-flex align-items-center gap-3">
                        <div class="d-flex position-relative align-items-center">
                            ${order.items.slice(0, 3).map((item, index) => {
                                const variant = item.product?.variants?.find(v => (v._id || v).toString() === (item.variant || "").toString()) || item.product?.variants?.[0];
                                const img = variant?.images?.length > 0 ? `/images/products/${variant.images[0]}` : '/images/user/phoodie.jpeg';
                                // Add negative margin to overlap multiple images nicely
                                const ml = index > 0 ? '-15px' : '0';
                                return `<img src="${img}" alt="Item" class="rounded-3 border border-2 border-white shadow-sm" style="width: 65px; height: 65px; object-fit: cover; margin-left: ${ml}; position: relative; z-index: ${3 - index}; background: #fff;">`;
                            }).join('')}
                            ${order.items.length > 3 ? `<div class="rounded-circle bg-light border border-2 border-white d-flex align-items-center justify-content-center shadow-sm text-secondary" style="width: 45px; height: 45px; margin-left: -15px; position: relative; z-index: 0; font-size:12px; font-weight:bold;">+${order.items.length - 3}</div>` : ''}
                        </div>
                        <div class="ms-2">
                            <div class="fw-bold fs-5 text-dark mb-0">₹${totalAmount}</div>
                            <div class="text-muted small mt-0">${itemCount} ${itemCount > 1 ? 'Items' : 'Item'}</div>
                        </div>
                    </div>
                    
                    <a href="/order-details?id=${order._id}" class="btn btn-outline-dark px-4 py-2 rounded-pill fw-medium" style="font-size: 0.9rem; transition: all 0.2s;">
                        View Details <i class="bi bi-arrow-right ms-1"></i>
                    </a>
                </div>
            `;
            orderListContainer.appendChild(card);
        });
    }

    function getStatusClass(status) {
        switch (status.toLowerCase()) {
            case "delivered": return "badge-delivered";
            case "processing":
            case "pending": return "badge-processing";
            case "cancelled": return "badge-cancelled";
            default: return "badge-processing";
        }
    }
});
