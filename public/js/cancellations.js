document.addEventListener("DOMContentLoaded", async () => {
    const cancellationList = document.getElementById("cancellationList");
    const cancellationCount = document.getElementById("cancellationCount");

    // Fetch auth status
    const status = await window.AuthGuard.fetchStatus();
    if (!status.loggedIn) {
        window.location.href = "/login?redirect=/account-cancellations";
        return;
    }

    async function fetchCancellations() {
        try {
            const response = await fetch("/api/orders/my-orders");
            const orders = await response.json();

            // Filter for cancelled orders
            const cancelledOrders = orders.filter(order => order.orderStatus === "Cancelled");

            document.getElementById("cancellationLoading")?.remove();

            if (cancelledOrders.length === 0) {
                cancellationCount.textContent = "0 cancelled orders";
                cancellationList.innerHTML = `
                    <div class="text-center py-5">
                        <i class="bi bi-x-circle text-muted" style="font-size: 3rem;"></i>
                        <h4 class="mt-3">No cancelled orders</h4>
                        <p class="text-muted">You have not cancelled any of your orders.</p>
                        <a href="/account-orders" class="btn btn-dark mt-2">View My Orders</a>
                    </div>
                `;
                return;
            }

            cancellationCount.textContent = `${cancelledOrders.length} cancelled order${cancelledOrders.length > 1 ? 's' : ''}`;
            renderCancellations(cancelledOrders);
        } catch (error) {
            console.error("Error fetching cancellations:", error);
            cancellationList.innerHTML = `<p class="text-danger">Failed to load cancellations. Please try again later.</p>`;
        }
    }

    function renderCancellations(orders) {
        cancellationList.innerHTML = "";
        
        orders.forEach(order => {
            const hasDummyProduct = order.items.some(item => !item.product);
            if (hasDummyProduct) return;

            const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric"
            });
            const cancelDate = new Date(order.updatedAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric"
            });

            // Representative first item
            const item = order.items[0];
            const variant = item.product?.variants?.find(v => (v._id || v).toString() === (item.variant || "").toString()) || item.product?.variants?.[0];
            const img = variant?.images?.length > 0 ? `/images/products/${variant.images[0]}` : '/images/user/phoodie.jpeg';

            const card = document.createElement("div");
            card.className = "cx-card mb-4 p-4 border rounded-4";
            card.style.background = "#fff";
            
            card.innerHTML = `
                <div class="cx-card-header d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
                    <div class="cx-header-left">
                        <div class="cx-order-id fw-bold">#ORD-${order._id.slice(-6).toUpperCase()}</div>
                        <div class="cx-header-meta text-muted small mt-1">
                            <span>Ordered ${orderDate}</span>
                            <span class="mx-1">·</span>
                            <span>Cancelled ${cancelDate}</span>
                        </div>
                    </div>
                    <span class="badge rounded-pill bg-danger-subtle text-danger px-3 py-2" style="font-size: 0.75rem; text-transform: uppercase;">
                        <i class="bi bi-x-circle-fill me-1"></i> Cancelled
                    </span>
                </div>

                <div class="row g-3 align-items-center">
                    <div class="col-auto">
                        <img src="${img}" alt="Product" class="rounded" style="width: 85px; height: 85px; object-fit: cover;">
                    </div>
                    <div class="col">
                        <div class="fw-bold mb-1">${item.product.name}</div>
                        <div class="text-muted small">
                            ${order.items.length > 1 ? `<span class="badge bg-light text-dark me-2">+${order.items.length - 1} more items</span>` : ''}
                            Size: ${item.size} | Qty: ${item.quantity}
                        </div>
                        <div class="text-muted small mt-1">Payment: ${order.paymentMethod}</div>
                    </div>
                    <div class="col-auto text-end">
                        <div class="fw-bold fs-5 mb-1">₹${order.finalAmount.toLocaleString("en-IN")}</div>
                        <div class="small ${order.paymentStatus === 'Paid' ? 'text-success fw-bold' : 'text-muted'}">
                            ${order.paymentStatus === 'Paid' ? '<i class="bi bi-check-circle-fill me-1"></i> Refund Credited' : 'No Refund Applicable'}
                        </div>
                    </div>
                </div>

                <div class="mt-4 d-grid">
                    <a href="/order-details?id=${order._id}" class="btn btn-outline-dark rounded-pill py-2">View Order Details</a>
                </div>
            `;
            cancellationList.appendChild(card);
        });
    }

    fetchCancellations();
});
