document.addEventListener("DOMContentLoaded", async () => {
    const returnList = document.getElementById("returnList");
    const returnCount = document.getElementById("returnCount");

    // Fetch auth status
    const status = await window.AuthGuard.fetchStatus();
    if (!status.loggedIn) {
        window.location.href = "/login?redirect=/account-returns";
        return;
    }

    async function fetchReturns() {
        try {
            const response = await fetch("/api/orders/my-orders");
            const orders = await response.json();

            // Filter for return-related statuses
            const returnOrders = orders.filter(order => 
                ["Return Requested", "Returned", "Return Rejected"].includes(order.orderStatus)
            );

            document.getElementById("returnsLoading")?.remove();

            if (returnOrders.length === 0) {
                returnCount.textContent = "0 returns";
                returnList.innerHTML = `
                    <div class="text-center py-5">
                        <i class="bi bi-arrow-counterclockwise text-muted" style="font-size: 3rem;"></i>
                        <h4 class="mt-3">No returns yet</h4>
                        <p class="text-muted">You haven't requested any returns.</p>
                        <a href="/account-orders" class="btn btn-dark mt-2">View My Orders</a>
                    </div>
                `;
                return;
            }

            returnCount.textContent = `${returnOrders.length} return${returnOrders.length > 1 ? 's' : ''}`;
            renderReturns(returnOrders);
        } catch (error) {
            console.error("Error fetching returns:", error);
            returnList.innerHTML = `<p class="text-danger">Failed to load returns. Please try again later.</p>`;
        }
    }

    function renderReturns(orders) {
        returnList.innerHTML = "";
        
        orders.forEach(order => {
            const hasDummyProduct = order.items.some(item => !item.product);
            if (hasDummyProduct) return;

            const date = new Date(order.updatedAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric"
            });

            // For simplicity, we show the first item of the order as the representative return
            const item = order.items[0];
            const variant = item.product?.variants?.find(v => (v._id || v).toString() === (item.variant || "").toString()) || item.product?.variants?.[0];
            const img = variant?.images?.length > 0 ? `/images/products/${variant.images[0]}` : '/images/user/phoodie.jpeg';

            const card = document.createElement("div");
            card.className = "ac-section-card mb-4";
            card.innerHTML = `
                <div class="order-card-top">
                    <div class="order-meta">
                        <span class="order-id">Order #ORD-${order._id.slice(-6).toUpperCase()}</span>
                        <div class="small mt-1">Requested on ${date}</div>
                    </div>
                    <span class="status-badge ${getStatusClass(order.orderStatus)}">${order.orderStatus}</span>
                </div>

                <div class="mt-4 pt-3 border-top">
                    <div class="item-row d-flex align-items-center gap-3">
                        <img src="${img}" class="item-thumb rounded" style="width: 70px; height: 70px; object-fit: cover;" alt="Product">
                        <div class="item-details">
                            <span class="item-name fw-bold d-block">${item.product.name}</span>
                            <span class="item-meta text-muted small">Qty: ${item.quantity} | Size: ${item.size}</span>
                        </div>
                    </div>
                </div>

                <div class="mt-4">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="text-muted small fw-bold text-uppercase">Refund Summary</span>
                        <span class="status-badge bg-transparent text-muted small" style="padding:0">
                            ${order.orderStatus === 'Returned' ? 'Refunded' : 'Pending Approval'}
                        </span>
                    </div>
                    <div class="summary-line d-flex justify-content-between mb-1">
                        <span class="text-muted">Total Amount</span>
                        <span class="fw-bold">₹${order.finalAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div class="summary-line d-flex justify-content-between">
                        <span class="text-muted">Refund Method</span>
                        <span>${order.paymentMethod === 'COD' ? 'URBANTIQ Wallet' : order.paymentMethod}</span>
                    </div>
                </div>

                <div class="mt-4 d-grid">
                    <a href="/order-details?id=${order._id}" class="btn btn-outline-dark rounded-pill py-2">View Details</a>
                </div>
            `;
            returnList.appendChild(card);
        });
    }

    function getStatusClass(status) {
        if (status === "Return Requested") return "badge-processing";
        if (status === "Returned") return "badge-delivered";
        if (status === "Return Rejected") return "badge-cancelled";
        return "badge-processing";
    }

    fetchReturns();
});
