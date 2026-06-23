document.addEventListener("DOMContentLoaded", () => {
    const orderListContainer = document.getElementById("orderList");

    if (orderListContainer) {
        fetchOrders();
    }

    async function fetchOrders() {
        try {
            // Centered premium loading indicator
            orderListContainer.innerHTML = `
                <div class="premium-loading-container">
                    <div class="premium-loading-pulse"></div>
                    <div class="premium-loading-text">Loading your orders...</div>
                </div>
            `;

            const response = await fetch("/api/orders/my-orders");
            const orders = await response.json();

            // Handle empty orders state
            if (orders.length === 0) {
                orderListContainer.innerHTML = `
                    <div class="premium-empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                            <path d="M3 6h18"/>
                            <path d="M16 10a4 4 0 0 1-8 0"/>
                        </svg>
                        <h3>No Orders Yet</h3>
                        <p>Explore timeless essentials curated for modern lifestyles.</p>
                        <a href="/product" class="premium-empty-cta">Continue Shopping</a>
                    </div>
                `;
                return;
            }

            renderOrders(orders);
        } catch (error) {
            console.error("Error fetching orders:", error);
            orderListContainer.innerHTML = `<p class="text-danger py-4 text-center">Failed to load orders. Please try again later.</p>`;
        }
    }

    function renderOrders(orders) {
        orderListContainer.innerHTML = ""; // Clear loader

        orders.forEach(order => {
            // Handle dummy products: Skip this order entirely if any of its products are null
            const hasDummyProduct = order.items.some(item => !item.product);
            if (hasDummyProduct) return;

            const orderDate = new Date(order.createdAt);
            const shortDateStr = orderDate.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short"
            });

            // Calculate Delivery Date (+7 days)
            const deliveryDate = new Date(orderDate);
            deliveryDate.setDate(deliveryDate.getDate() + 7);
            const deliveryDateStr = deliveryDate.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short"
            });

            // Split into individual item cards for a premium fashion retail experience
            order.items.forEach(item => {
                const variant = item.product?.variants?.find(v => (v._id || v).toString() === (item.variant || "").toString()) || item.product?.variants?.[0];
                const img = variant?.images?.length > 0 ? `/images/products/${variant.images[0]}` : '/images/user/phoodie.jpeg';
                const productName = item.product?.name || "Product Unavailable";
                const variantText = `Size ${item.size} • Qty ${item.quantity}`;
                const itemPrice = (item.price * item.quantity).toLocaleString("en-IN");
                
                const itemStatus = item.itemStatus || "Pending";
                const lowerStatus = itemStatus.toLowerCase();

                // 1. Get Apple-like state info (ETA, status text description, pill styling)
                const stateInfo = getAppleStateInfo(itemStatus, deliveryDateStr, shortDateStr);

                let cardHeaderHtml = `
                    <div class="active-card-header">
                        <div class="active-card-header-left">
                            <div class="active-card-eta-title">${stateInfo.title}</div>
                            <div class="active-card-state-desc">${stateInfo.subtext}</div>
                        </div>
                        <span class="active-card-status-pill ${stateInfo.pillClass}">
                            ● ${stateInfo.pillText}
                        </span>
                    </div>
                `;

                // 2. Product Information Section (Zara-inspired hierarchy: Name -> Price -> Size/Qty)
                let productSectionHtml = `
                    <div class="active-card-product-section">
                        <a href="/order-details?id=${order._id}">
                            <img src="${img}" alt="${productName}" class="active-product-image">
                        </a>
                        <div class="active-product-details">
                            <h3 class="active-product-name">${productName}</h3>
                            <div class="active-product-price">₹${itemPrice}</div>
                            <span class="active-product-variant">${variantText}</span>
                        </div>
                    </div>
                `;

                // 3. Dynamic Timeline progress
                let progressHtml = getProgressTimelineHtml(itemStatus);

                // 4. Footer Section: Metadata and Actions
                let primaryBtnText = "Track Order";
                let primaryBtnMobileText = "Track";
                let secondaryBtnText = "View Details";
                let secondaryBtnMobileText = "Details";
                
                let primaryBtnUrl = `/order-details?id=${order._id}&itemId=${item._id}#trackingTimelineWrap`;
                let secondaryBtnUrl = `/order-details?id=${order._id}&itemId=${item._id}`;
                let isBuyAgain = false;

                if (["delivered", "cancelled", "returned", "return rejected", "return requested"].includes(lowerStatus)) {
                    isBuyAgain = true;
                    primaryBtnText = "Buy Again";
                    primaryBtnMobileText = "Buy Again";
                    secondaryBtnText = "View Details";
                    secondaryBtnMobileText = "Details";
                    primaryBtnUrl = "#";
                }

                let actionButtonsHtml = "";
                if (isBuyAgain) {
                    actionButtonsHtml = `
                        <!-- Desktop Action -->
                        <button class="active-action-link d-none d-md-inline buy-again-btn bg-transparent border-0 p-0 text-start" 
                                data-product-id="${item.product._id}" 
                                data-variant-id="${variant?._id || ''}" 
                                data-size="${item.size}">
                            Buy Again →
                        </button>
                        <a href="${secondaryBtnUrl}" class="active-action-link d-none d-md-inline">
                            ${secondaryBtnText} →
                        </a>
                        
                        <!-- Mobile Action -->
                        <button class="active-action-btn-mobile active-action-btn-mobile-primary d-inline-flex d-md-none buy-again-btn"
                                data-product-id="${item.product._id}" 
                                data-variant-id="${variant?._id || ''}" 
                                data-size="${item.size}">
                            Buy Again
                        </button>
                        <a href="${secondaryBtnUrl}" class="active-action-btn-mobile active-action-btn-mobile-secondary d-inline-flex d-md-none">
                            ${secondaryBtnMobileText}
                        </a>
                    `;
                } else {
                    actionButtonsHtml = `
                        <!-- Desktop Action -->
                        <a href="${primaryBtnUrl}" class="active-action-link d-none d-md-inline">
                            ${primaryBtnText} →
                        </a>
                        <a href="${secondaryBtnUrl}" class="active-action-link d-none d-md-inline">
                            ${secondaryBtnText} →
                        </a>
                        
                        <!-- Mobile Action -->
                        <a href="${primaryBtnUrl}" class="active-action-btn-mobile active-action-btn-mobile-primary d-inline-flex d-md-none">
                            ${primaryBtnMobileText}
                        </a>
                        <a href="${secondaryBtnUrl}" class="active-action-btn-mobile active-action-btn-mobile-secondary d-inline-flex d-md-none">
                            ${secondaryBtnMobileText}
                        </a>
                    `;
                }

                let footerHtml = `
                    <!-- Desktop Footer (visible on d-md-flex, hidden on mobile) -->
                    <div class="active-card-footer d-none d-md-flex">
                        <div class="active-card-meta">
                            <span class="active-card-meta-id">Order #ORD-${order._id.slice(-6).toUpperCase()}</span>
                            <span class="active-card-meta-date">Ordered ${shortDateStr}</span>
                        </div>
                        <div class="active-card-actions">
                            ${actionButtonsHtml}
                        </div>
                    </div>
                    
                    <!-- Mobile Footer (visible on mobile, hidden on d-md-none) -->
                    <div class="order-footer-mobile d-flex d-md-none">
                        <div class="order-meta-mobile">
                            <span class="order-id">Order #ORD-${order._id.slice(-6).toUpperCase()}</span>
                            <span class="order-date">Ordered ${shortDateStr}</span>
                        </div>
                        <a href="/order-details?id=${order._id}&itemId=${item._id}" class="order-details-mobile-link">
                            View Details →
                        </a>
                    </div>
                `;

                const card = document.createElement("div");
                card.className = "order-card-active";
                card.innerHTML = `
                    ${cardHeaderHtml}
                    ${productSectionHtml}
                    ${progressHtml}
                    ${footerHtml}
                `;

                orderListContainer.appendChild(card);
            });
        });

        // Add Event Listeners for Buy Again buttons (AJAX toast alert)
        document.querySelectorAll('.buy-again-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const productId = btn.dataset.productId;
                const variantId = btn.dataset.variantId;
                const size = btn.dataset.size;

                btn.disabled = true;
                const originalText = btn.innerHTML;
                btn.innerHTML = `Adding...`;

                try {
                    const response = await fetch("/api/cart/add", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            productId,
                            variantId,
                            size,
                            quantity: 1
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        showIosToast("Added to Cart");
                    } else {
                        showIosToast(data.message || "Failed to add to cart", false);
                    }
                } catch (error) {
                    console.error("Error adding to cart:", error);
                    showIosToast("Network error occurred", false);
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            });
        });
    }

    function getAppleStateInfo(status, deliveryDateStr, shortDateStr) {
        const lowerStatus = status.toLowerCase();
        let title = `Arriving by ${deliveryDateStr}`;
        let subtext = "";
        let pillText = status;
        let pillClass = "badge-premium-processing";

        if (lowerStatus === 'pending') {
            title = `Arriving by ${deliveryDateStr}`;
            subtext = "Your package is awaiting confirmation.";
            pillText = "Pending";
            pillClass = "badge-premium-processing";
        } else if (lowerStatus === 'confirmed') {
            title = `Arriving by ${deliveryDateStr}`;
            subtext = "Your order has been confirmed.";
            pillText = "Confirmed";
            pillClass = "badge-premium-processing";
        } else if (lowerStatus === 'processing') {
            title = `Arriving by ${deliveryDateStr}`;
            subtext = "Your package is being prepared.";
            pillText = "Processing";
            pillClass = "badge-premium-processing";
        } else if (lowerStatus === 'shipped') {
            title = `Arriving by ${deliveryDateStr}`;
            subtext = "Your package is in transit.";
            pillText = "Shipped";
            pillClass = "badge-premium-shipped";
        } else if (lowerStatus === 'delivered') {
            title = `Delivered on ${deliveryDateStr}`;
            subtext = "Your package has been safely delivered.";
            pillText = "Delivered";
            pillClass = "badge-premium-delivered";
        } else if (lowerStatus === 'cancelled') {
            title = "Order Cancelled";
            subtext = "This transaction was cancelled.";
            pillText = "Cancelled";
            pillClass = "badge-premium-cancelled";
        } else if (lowerStatus === 'cancellation requested') {
            title = "Cancellation Pending";
            subtext = "Cancellation request is under review.";
            pillText = "Pending";
            pillClass = "badge-premium-processing";
        } else if (lowerStatus === 'return requested') {
            title = "Return Pending";
            subtext = "Return request is under review.";
            pillText = "Return Pending";
            pillClass = "badge-premium-returned";
        } else if (lowerStatus === 'returned') {
            title = "Returned & Refunded";
            subtext = "Refund has been processed.";
            pillText = "Returned";
            pillClass = "badge-premium-returned";
        } else if (lowerStatus === 'return rejected') {
            title = "Return Rejected";
            subtext = "Return request was declined.";
            pillText = "Declined";
            pillClass = "badge-premium-cancelled";
        }

        return { title, subtext, pillText, pillClass };
    }

    function getProgressTimelineHtml(status) {
        const lowerStatus = status.toLowerCase();
        let step = 1;
        let activeLabel = "Ordered";
        
        if (lowerStatus === 'pending') {
            step = 1;
            activeLabel = "Ordered";
        } else if (lowerStatus === 'confirmed' || lowerStatus === 'processing') {
            step = 2;
            activeLabel = "Packed";
        } else if (lowerStatus === 'shipped') {
            step = 3;
            activeLabel = "Shipped";
        } else {
            // Hide timeline entirely for non-active states (delivered, cancelled, returned)
            return "";
        }

        // Calculate line fill percentage
        const fillWidth = ((step - 1) / 3) * 100;

        return `
            <div class="active-progress-container">
                <div class="active-progress-line-bg"></div>
                <div class="active-progress-line-fill" style="width: ${fillWidth}%;"></div>
                <div class="active-progress-steps">
                    <div class="active-progress-dot ${step >= 1 ? 'completed' : ''}"></div>
                    <div class="active-progress-dot ${step >= 2 ? 'completed' : ''}"></div>
                    <div class="active-progress-dot ${step >= 3 ? 'completed' : ''}"></div>
                    <div class="active-progress-dot ${step >= 4 ? 'completed' : ''}"></div>
                </div>
                <div class="active-progress-current-label">${activeLabel}</div>
            </div>
        `;
    }

    // iOS style bottom toast notifier
    function showIosToast(message, isSuccess = true) {
        const container = document.getElementById("ios-toast-container");
        if (!container) return;

        // Clear existing toasts first to prevent clutter
        container.innerHTML = "";

        const toast = document.createElement("div");
        toast.className = "ios-toast";
        
        let actionHtml = '';
        let icon = isSuccess 
            ? '<i class="bi bi-check-circle-fill text-success" style="font-size:1.1rem; line-height:1;"></i>' 
            : '<i class="bi bi-exclamation-circle-fill text-danger" style="font-size:1.1rem; line-height:1;"></i>';
        
        if (isSuccess) {
            actionHtml = `<a href="/cart" class="ios-toast-action">View Cart</a>`;
        }

        toast.innerHTML = `
            <div class="ios-toast-message">
                ${icon}
                <span style="font-size: 14px; margin-left: 2px;">${message}</span>
            </div>
            ${actionHtml}
        `;

        container.appendChild(toast);

        // Slide out and destroy toast after 3 seconds
        setTimeout(() => {
            toast.classList.add("fade-out");
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
});
