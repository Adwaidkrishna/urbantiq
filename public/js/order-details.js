document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');

    if (orderId) {
        fetchOrderDetails(orderId);
    } else {
        document.getElementById('orderDetailsWrap').innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-exclamation-circle text-danger" style="font-size: 3rem;"></i>
                <h4 class="mt-3">Order Not Found</h4>
                <p class="text-secondary">We couldn't find the order details you're looking for.</p>
                <a href="/account-orders" class="btn btn-dark mt-2">Back to My Orders</a>
            </div>
        `;
    }

    async function fetchOrderDetails(id) {
        try {
            const res = await fetch(`/api/orders/${id}`);
            const order = await res.json();

            if (!order || order.message) {
                throw new Error(order.message || "Order not found");
            }

            renderDetails(order);
        } catch (err) {
            console.error("Error fetching order details:", err);
            document.getElementById('orderDetailsWrap').innerHTML = `<p class="text-danger p-4 text-center">${err.message || "Failed to load order details."}</p>`;
        }
    }

    function renderDetails(order) {
        // ID & Date
        document.getElementById('displayOrderId').textContent = `#ORD-${order._id.slice(-6).toUpperCase()}`;
        const orderDateObj = new Date(order.createdAt);
        const date = orderDateObj.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
        document.getElementById('displayOrderDate').textContent = `Placed on ${date}`;
        
        // Calculate Expected Delivery (+7 Days)
        const deliveryDateObj = new Date(orderDateObj);
        deliveryDateObj.setDate(deliveryDateObj.getDate() + 7);
        const expectedDateStr = deliveryDateObj.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

        // Status Timeline & Badges
        const statusEl = document.getElementById('displayOrderStatus');
        statusEl.textContent = order.orderStatus;
        statusEl.className = `status-badge ${getStatusClass(order.orderStatus)}`;

        // Generate Flipkart-Style Tracking Timeline
        generateTrackingTimeline(order.orderStatus, expectedDateStr);

        // Shipping
        document.getElementById('displayShipName').textContent = order.shippingAddress.fullName;
        document.getElementById('displayShipAddr').innerHTML = `
            ${order.shippingAddress.addressLine1}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}
        `;
        document.getElementById('displayShipPhone').textContent = order.shippingAddress.phone || "N/A";

        // Items
        const itemsContainer = document.getElementById('displayOrderItems');
        itemsContainer.innerHTML = order.items.map((item, index) => {
            const variant = item.product?.variants?.find(v => (v._id || v).toString() === (item.variant || "").toString()) || item.product?.variants?.[0];
            const img = variant?.images?.length > 0 ? `/images/products/${variant.images[0]}` : '/images/user/phoodie.jpeg';
            
            return `
                <div class="item-row">
                    <img src="${img}" class="item-thumb" alt="Product">
                    <div class="item-details">
                        <span class="item-name">${item.product?.name || '<span class="text-danger" style="font-style:italic; font-weight:normal;">Product Unavailable</span>'}</span>
                        <span class="item-meta">
                            Size: ${item.size} &nbsp;&middot;&nbsp; Qty: ${item.quantity}
                            ${variant?.color ? `
                            &nbsp;&middot;&nbsp;
                            <span class="ck-color-circle" title="${variant.colorName || 'Color'}" style="background-color: ${variant.color}; display: inline-block; width: 12px; height: 12px; border-radius: 50%; border: 1px solid #ccc; margin-left: 2px; vertical-align: middle;"></span>
                            ` : ''}
                        </span>
                    </div>
                    <span class="item-price">₹${(item.price * item.quantity).toLocaleString("en-IN")}</span>
                </div>
            `;
        }).join('');

        // Summary
        document.getElementById('displaySubtotal').textContent = `₹${order.totalPrice.toLocaleString()}`;
        document.getElementById('displayDiscount').textContent = `- ₹${order.discount.toLocaleString()}`;
        document.getElementById('displayTotal').textContent = `₹${order.finalAmount.toLocaleString()}`;

        // Actions (iOS Style Layout)
        const actionsEl = document.getElementById('orderActions');
        const lowerStatus = order.orderStatus.toLowerCase();
        const cancellableStatuses = ['pending', 'confirmed', 'processing'];
        
        if (cancellableStatuses.includes(lowerStatus)) {
            actionsEl.innerHTML = `<button class="btn-outline-red px-5" id="cancelOrderBtn">Cancel Order</button>`;
            document.getElementById('cancelOrderBtn').addEventListener('click', () => cancelOrder(order._id));
        } else if (lowerStatus === 'shipped') {
            actionsEl.innerHTML = `
                <div class="d-flex flex-column align-items-center">
                    <p class="text-secondary small mb-3">Your order is in transit and arriving soon.</p>
                    <button class="btn-outline-black px-5" disabled><i class="bi bi-truck me-2"></i> In Transit</button>
                </div>`;
        } else if (lowerStatus === 'delivered') {
            document.getElementById('invoiceSection').style.display = 'block';
            actionsEl.innerHTML = `<button class="btn-outline-black px-5" id="returnOrderBtn">Request Return</button>`;
            document.getElementById('returnOrderBtn').addEventListener('click', () => requestReturn(order._id));
        } else if (lowerStatus === 'return requested') {
            actionsEl.innerHTML = `<button class="btn-outline-black px-5" disabled><i class="bi bi-clock-history me-2"></i> Return Under Review</button>`;
        } else if (lowerStatus === 'return rejected') {
            actionsEl.innerHTML = `<div class="text-danger small mb-2"><i class="bi bi-exclamation-triangle-fill me-1"></i> Return request was rejected.</div><button class="btn-outline-black px-5" disabled>Return Rejected</button>`;
        } else {
            actionsEl.innerHTML = '';
        }
    }

    function cancelOrder(id) {
        showConfirmModal("Cancel Order", "Are you sure you want to cancel this order? This action cannot be undone.", async () => {
            try {
                const res = await fetch(`/api/orders/${id}/cancel`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" }
                });
                const data = await res.json();
                if (data._id || data.success) {
                    window.location.reload();
                } else {
                    showAlertModal("Cancellation Failed", data.message || "Failed to cancel order.", false);
                }
            } catch (err) {
                console.error("Error cancelling order:", err);
                showAlertModal("Error", "Failed to cancel order due to a network error.", false);
            }
        });
    }

    function requestReturn(id) {
        showConfirmModal("Request Return", "Are you sure you want to request a return for this order? Our team will review your request shortly.", async () => {
            try {
                const res = await fetch(`/api/orders/${id}/return-request`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" }
                });
                const data = await res.json();
                if (data.success) {
                    window.location.reload();
                } else {
                    showAlertModal("Request Failed", data.message || "Failed to submit return request.", false);
                }
            } catch (err) {
                console.error("Error requesting return:", err);
                showAlertModal("Error", "Failed to submit return request due to a network error.", false);
            }
        });
    }

    // --- Custom UI Modal Utilities ---
    
    function showConfirmModal(title, message, confirmCallback) {
        // Remove existing modal if any
        const existing = document.getElementById('customConfirmModal');
        if (existing) existing.remove();

        const modalHtml = `
        <div class="modal fade" id="customConfirmModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg" style="border-radius: 20px;">
                    <div class="modal-body p-4 p-md-5 text-center">
                        <i class="bi bi-exclamation-triangle text-danger mb-3" style="font-size: 3.5rem;"></i>
                        <h4 class="fw-bold mb-3" style="color: #111;">${title}</h4>
                        <p class="text-secondary mb-4" style="font-size: 0.95rem;">${message}</p>
                        <div class="d-flex justify-content-center gap-3">
                            <button type="button" class="btn btn-light rounded-pill px-4 fw-medium border shadow-sm" data-bs-dismiss="modal">No, Keep It</button>
                            <button type="button" class="btn btn-danger rounded-pill px-4 fw-medium shadow-sm" id="confirmActionBtn">Yes, Cancel Order</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalEl = document.getElementById('customConfirmModal');
        const modal = new bootstrap.Modal(modalEl);
        
        document.getElementById('confirmActionBtn').addEventListener('click', () => {
            modal.hide();
            confirmCallback();
        });
        
        modal.show();
    }

    function showAlertModal(title, message, isSuccess = false) {
        const existing = document.getElementById('customAlertModal');
        if (existing) existing.remove();

        const iconClass = isSuccess ? 'bi-check-circle text-success' : 'bi-x-circle text-danger';
        const modalHtml = `
        <div class="modal fade" id="customAlertModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-sm">
                <div class="modal-content border-0 shadow-lg" style="border-radius: 20px;">
                    <div class="modal-body p-4 text-center">
                        <i class="bi ${iconClass} mb-3" style="font-size: 3.5rem;"></i>
                        <h5 class="fw-bold mb-2" style="color: #111;">${title}</h5>
                        <p class="text-secondary mb-4" style="font-size: 0.9rem;">${message}</p>
                        <button type="button" class="btn btn-dark rounded-pill px-5 fw-medium shadow-sm" data-bs-dismiss="modal">OK</button>
                    </div>
                </div>
            </div>
        </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalEl = document.getElementById('customAlertModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    function getStatusClass(status) {
        switch (status.toLowerCase()) {
            case "delivered": return "badge-delivered";
            case "shipped": return "badge-processing"; // Re-using processing blue/gray
            case "processing":
            case "pending": return "badge-processing";
            case "cancelled": return "badge-cancelled";
            case "returned": return "badge-returned";
            case "return requested": return "badge-processing";
            case "return rejected": return "badge-cancelled";
            default: return "badge-processing";
        }
    }

    function generateTrackingTimeline(status, expectedDelivery) {
        const headerSection = document.getElementById('orderHeader').parentNode; // The card wrapping the header
        
        let timelineHtml = '';
        const lowerState = status.toLowerCase();

        // Calculate progress percentage mapping to nodes (Placed=0%, Confirmed=33%, Shipped=66%, Delivered=100%)
        let progress = 0;
        if (lowerState === 'pending') progress = 0;
        if (lowerState === 'confirmed' || lowerState === 'processing') progress = 33.33;
        if (lowerState === 'shipped') progress = 66.66;
        if (lowerState === 'delivered') progress = 100;

        if (lowerState === 'cancelled') {
            timelineHtml = `
            <div class="mt-4 pt-4 border-top">
                <div class="d-flex align-items-center gap-3 text-danger px-1">
                    <div class="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 44px; height: 44px; min-width:44px;">
                        <i class="bi bi-x-lg fs-5"></i>
                    </div>
                    <div>
                        <div class="fw-bold" style="font-size: 1.05rem; color: #1d1d1f;">Order Cancelled</div>
                        <div class="text-secondary small">This order has been successfully cancelled and refunded.</div>
                    </div>
                </div>
            </div>`;
        } else if (lowerState === 'returned') {
            timelineHtml = `
            <div class="mt-4 pt-4 border-top">
                <div class="d-flex align-items-center gap-3 text-warning px-1">
                    <div class="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center" style="width: 44px; height: 44px; min-width:44px;">
                        <i class="bi bi-arrow-return-left fs-5"></i>
                    </div>
                    <div>
                        <div class="fw-bold" style="font-size: 1.05rem; color: #1d1d1f;">Order Returned</div>
                        <div class="text-secondary small">Your return request has been processed and amount credited to your wallet.</div>
                    </div>
                </div>
            </div>`;
        } else if (lowerState === 'return requested') {
            timelineHtml = `
            <div class="mt-4 pt-4 border-top">
                <div class="d-flex align-items-center gap-3 text-primary px-1">
                    <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 44px; height: 44px; min-width:44px;">
                        <i class="bi bi-clock-history fs-5"></i>
                    </div>
                    <div>
                        <div class="fw-bold" style="font-size: 1.05rem; color: #1d1d1f;">Return Under Review</div>
                        <div class="text-secondary small">Your request is being reviewed by our quality team.</div>
                    </div>
                </div>
            </div>`;
        } else if (lowerState === 'return rejected') {
            timelineHtml = `
            <div class="mt-4 pt-4 border-top">
                <div class="d-flex align-items-center gap-3 text-secondary px-1">
                    <div class="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 44px; height: 44px; min-width:44px;">
                        <i class="bi bi-exclamation-circle fs-5"></i>
                    </div>
                    <div>
                        <div class="fw-bold" style="font-size: 1.05rem; color: #1d1d1f;">Return Rejected</div>
                        <div class="text-secondary small">Your return request did not meet our policy requirements.</div>
                    </div>
                </div>
            </div>`;
        } else {
            // Normal Delivery Timeline (iOS Ultra-Light Style)
            const getStepHtml = (name, icon, stepTarget, currentProgress) => {
                const isActive = currentProgress >= stepTarget;
                const activeColor = '#007aff'; // iOS System Blue
                const circleBg = isActive ? activeColor : '#fff';
                const circleBorder = isActive ? activeColor : '#d1d1d6';
                const circleIconColor = isActive ? '#fff' : '#8e8e93';
                const labelColor = isActive ? '#1d1d1f' : '#8e8e93';
                const labelWeight = isActive ? '600' : '500';

                return `
                <div class="tracking-node text-center" style="width: 80px; z-index: 2;">
                    <div class="rounded-circle d-flex align-items-center justify-content-center mx-auto" 
                         style="width: 32px; height: 32px; background: ${circleBg}; border: 1.5px solid ${circleBorder}; transition: all 0.4s ease;">
                        <i class="bi ${icon}" style="color: ${circleIconColor}; font-size: 0.9rem;"></i>
                    </div>
                    <div class="mt-2" style="font-size: 0.7rem; color: ${labelColor}; font-weight: ${labelWeight}; letter-spacing: -0.01em;">${name}</div>
                </div>`;
            };

            timelineHtml = `
            <div class="mt-5 pt-4 border-top">
                <div class="d-flex justify-content-between align-items-start mb-5 px-1">
                    <div>
                        <div class="text-muted small fw-bold text-uppercase mb-1" style="font-size: 0.65rem; letter-spacing: 0.05em;">Order Status</div>
                        <div class="fw-bold fs-5" style="color: #1d1d1f; letter-spacing: -0.02em;">
                            ${lowerState === 'delivered' ? 'Delivered' : 'In Transit'}
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="text-muted small fw-bold text-uppercase mb-1" style="font-size: 0.65rem; letter-spacing: 0.05em;">Expected Arrival</div>
                        <div class="fw-bold fs-5 text-success" style="letter-spacing: -0.02em;">${expectedDelivery}</div>
                    </div>
                </div>
                
                <div class="position-relative mt-5 mb-3 px-4">
                    <!-- Progress Tracks -->
                    <div class="position-absolute start-0 end-0 px-5" style="top: 16px; transform: translateY(-50%);">
                        <div class="bg-light w-100 rounded-pill" style="height: 3px;"></div>
                        <div class="position-absolute top-0 start-0 h-100 rounded-pill transition-all" 
                             style="width: ${progress}%; background-color: #007aff; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                    </div>
                    
                    <!-- Nodes -->
                    <div class="d-flex justify-content-between position-relative">
                        ${getStepHtml('Placed', 'bi-cart', 0, progress)}
                        ${getStepHtml('Confirmed', 'bi-shield-check', 33, progress)}
                        ${getStepHtml('Shipped', 'bi-truck', 66, progress)}
                        ${getStepHtml('Delivered', 'bi-house-heart', 100, progress)}
                    </div>
                </div>
            </div>`;
        }

        const timelineWrap = document.getElementById('trackingTimelineWrap');
        if (timelineWrap) {
            timelineWrap.innerHTML = timelineHtml;
        }
    }
});
