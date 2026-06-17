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

            // Filter for cancelled or cancellation pending orders
            const cancelledOrders = orders.filter(order => 
                ["Cancelled", "Cancellation Requested"].includes(order.orderStatus)
            );

            document.getElementById("cancellationLoading")?.remove();

            // Calculate total cancelled items
            let totalItems = 0;
            const validOrders = [];
            cancelledOrders.forEach(order => {
                const hasDummyProduct = order.items.some(item => !item.product);
                if (hasDummyProduct) return;
                totalItems += order.items.length;
                validOrders.push(order);
            });

            if (totalItems === 0) {
                cancellationCount.textContent = "0 cancelled items";
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

            cancellationCount.textContent = `${totalItems} cancelled item${totalItems > 1 ? 's' : ''}`;
            renderCancellations(validOrders);
        } catch (error) {
            console.error("Error fetching cancellations:", error);
            cancellationList.innerHTML = `<p class="text-danger">Failed to load cancellations. Please try again later.</p>`;
        }
    }

    function renderCancellations(orders) {
        cancellationList.innerHTML = "";
        
        orders.forEach(order => {
            const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric"
            });
            const cancelDate = order.cancellationRequest?.requestedAt
                ? new Date(order.cancellationRequest.requestedAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric"
                })
                : new Date(order.updatedAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric"
                });

            const reason = order.cancellationRequest?.reason || "Customer Request";

            // Determine refund status
            let refundText = "Not Applicable";
            let refundClass = "text-muted";
            if (order.paymentMethod === "Wallet" || order.paymentMethod === "Online") {
                if (order.paymentStatus === "Refunded") {
                    refundText = order.paymentMethod === "Wallet" ? "Refunded to Wallet" : "Refunded to Source";
                    refundClass = "refund-credited";
                } else if (order.paymentStatus === "Paid") {
                    refundText = "Refund Pending";
                    refundClass = "refund-pending";
                } else {
                    refundText = "No Refund Applicable";
                    refundClass = "text-muted";
                }
            }

            // Split into individual item cards
            order.items.forEach(item => {
                const variant = item.product?.variants?.find(v => (v._id || v).toString() === (item.variant || "").toString()) || item.product?.variants?.[0];
                const img = variant?.images?.length > 0 ? `/images/products/${variant.images[0]}` : '/images/user/phoodie.jpeg';
                const productName = item.product?.name || "Product Unavailable";
                const variantText = `Size ${item.size} • Qty ${item.quantity}`;
                const itemPrice = (item.price * item.quantity).toLocaleString("en-IN");

                // Badge styling
                const isPending = order.orderStatus === "Cancellation Requested";
                const badgeLabel = isPending ? "Pending" : "Cancelled";
                const badgeIcon = isPending ? '<i class="bi bi-hourglass-split me-1"></i>' : '<i class="bi bi-x-circle-fill me-1"></i>';
                const badgeClass = isPending ? "badge-premium-processing" : "badge-premium-cancelled";

                const card = document.createElement("div");
                card.className = "order-card-archive";
                
                card.innerHTML = `
                    <div class="history-card-header-row border-bottom pb-3 mb-3">
                        <div class="history-card-id-label">#ORD-${order._id.slice(-6).toUpperCase()}</div>
                        <span class="history-card-badge-pill ${badgeClass}">
                            ${badgeIcon}${badgeLabel}
                        </span>
                    </div>

                    <div class="history-card-product-section">
                        <img src="${img}" alt="${productName}" class="history-product-image">
                        <div class="history-product-details">
                            <div class="history-product-info">
                                <h3 class="history-product-name">${productName}</h3>
                                <span class="history-product-variant">${variantText}</span>
                            </div>
                            <div class="history-product-price">₹${itemPrice}</div>
                        </div>
                    </div>

                    <div class="history-info-grid">
                        <div class="history-info-block">
                            <span class="history-info-label">Reason</span>
                            <span class="history-info-value text-capitalize">${reason}</span>
                        </div>
                        <div class="history-info-block">
                            <span class="history-info-label">Refund Status</span>
                            <span class="history-info-value ${refundClass}">${refundText}</span>
                        </div>
                        <div class="history-info-block">
                            <span class="history-info-label">History</span>
                            <span class="history-info-value">Ordered: ${orderDate}</span>
                            <span class="history-info-value mt-1">Cancelled: ${cancelDate}</span>
                        </div>
                    </div>

                    <div class="history-card-action">
                        <a href="/order-details?id=${order._id}" class="btn-history-outline">View Details</a>
                    </div>
                `;
                cancellationList.appendChild(card);
            });
        });
    }

    fetchCancellations();
});
