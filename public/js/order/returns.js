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

            // Filter for return-related statuses at the item level
            const returnOrders = orders.filter(order => 
                order.items.some(item => ["Return Requested", "Returned", "Return Rejected"].includes(item.itemStatus))
            );

            document.getElementById("returnsLoading")?.remove();

            // Calculate total return items
            let totalItems = 0;
            const validOrders = [];
            returnOrders.forEach(order => {
                const hasDummyProduct = order.items.some(item => !item.product);
                if (hasDummyProduct) return;

                const returnItems = order.items.filter(item => ["Return Requested", "Returned", "Return Rejected"].includes(item.itemStatus));
                if (returnItems.length > 0) {
                    totalItems += returnItems.length;
                    validOrders.push(order);
                }
            });

            if (totalItems === 0) {
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

            returnCount.textContent = `${totalItems} return${totalItems > 1 ? 's' : ''}`;
            renderReturns(validOrders);
        } catch (error) {
            console.error("Error fetching returns:", error);
            returnList.innerHTML = `<p class="text-danger">Failed to load returns. Please try again later.</p>`;
        }
    }

    function renderReturns(orders) {
        returnList.innerHTML = "";
        
        orders.forEach(order => {
            // Split into individual item cards, filter out items that aren't returns
            order.items.forEach(item => {
                if (!["Return Requested", "Returned", "Return Rejected"].includes(item.itemStatus)) return;

                const reqDateStr = item.returnRequest?.requestedAt
                    ? new Date(item.returnRequest.requestedAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                    })
                    : new Date(order.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                    });
                const variant = item.product?.variants?.find(v => (v._id || v).toString() === (item.variant || "").toString()) || item.product?.variants?.[0];
                const img = variant?.images?.length > 0 ? `/images/products/${variant.images[0]}` : '/images/user/phoodie.jpeg';
                const productName = item.product?.name || "Product Unavailable";
                const variantText = `Size ${item.size} • Qty ${item.quantity}`;
                const itemPrice = (item.price * item.quantity).toLocaleString("en-IN");

                // Determine refund method
                const refundMethod = order.paymentMethod === 'COD' ? 'Wallet' : (order.paymentMethod === 'Wallet' ? 'Wallet' : 'Original Payment Source');

                // Determine refund outcome details based on status
                let outcomeTitle = "Refund Initiated";
                let outcomeDesc = `₹${itemPrice} will be returned to ${refundMethod}.`;
                let descClass = "refund-pending";
                let badgeClass = "badge-premium-processing";
                let badgeIcon = '<i class="bi bi-hourglass-split me-1"></i>';
                let badgeLabel = "Return Pending";

                if (item.itemStatus === "Returned") {
                    outcomeTitle = "Refund Processed";
                    outcomeDesc = `₹${itemPrice} returned to ${refundMethod}.`;
                    descClass = "refund-credited";
                    badgeClass = "badge-premium-delivered";
                    badgeIcon = '<i class="bi bi-arrow-return-left me-1"></i>';
                    badgeLabel = "Returned";
                } else if (item.itemStatus === "Return Rejected") {
                    outcomeTitle = "Refund Declined";
                    outcomeDesc = "No refund issued.";
                    descClass = "refund-rejected";
                    badgeClass = "badge-premium-cancelled";
                    badgeIcon = '<i class="bi bi-x-circle-fill me-1"></i>';
                    badgeLabel = "Rejected";
                }

                const card = document.createElement("div");
                card.className = "order-card-reassurance";
                
                card.innerHTML = `
                    <div class="reassurance-header">
                        <div class="reassurance-header-left">
                            <div class="reassurance-outcome-title">${outcomeTitle}</div>
                            <div class="reassurance-outcome-desc ${descClass}">${outcomeDesc}</div>
                        </div>
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

                    <div class="reassurance-info-grid">
                        <div class="history-info-block">
                            <span class="history-info-label">Return Timeline</span>
                            <span class="history-info-value">Requested: ${reqDateStr}</span>
                        </div>
                        <div class="history-info-block">
                            <span class="history-info-label">Order Reference</span>
                            <span class="history-info-value">#ORD-${order._id.slice(-6).toUpperCase()}</span>
                        </div>
                        <div class="history-info-block">
                            <span class="history-info-label">Payment Source</span>
                            <span class="history-info-value">${order.paymentMethod}</span>
                        </div>
                    </div>

                    <div class="history-card-action">
                        <a href="/order-details?id=${order._id}" class="btn-history-outline">View Details</a>
                    </div>
                `;
                returnList.appendChild(card);
            });
        });
    }

    fetchReturns();
});
