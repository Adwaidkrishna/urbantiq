document.addEventListener("DOMContentLoaded", function () {
    const ordersTableBody = document.querySelector(".orders-table tbody");
    const searchInput = document.getElementById('searchOrdersInput');
    const statusFilterSelect = document.getElementById('statusFilterSelect');

    let allOrders = [];

    if (ordersTableBody) {
        fetchAdminOrders();
    }

    // Bind filters
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    if (statusFilterSelect) {
        statusFilterSelect.addEventListener('change', applyFilters);
    }

    async function fetchAdminOrders() {
        try {
            const response = await fetch("/api/orders/admin/all");
            allOrders = await response.json();
            applyFilters();
        } catch (error) {
            console.error("Error fetching orders:", error);
            if (ordersTableBody) {
                ordersTableBody.innerHTML = '<tr><td colspan="7" class="text-center p-4 text-danger">Error loading orders.</td></tr>';
            }
        }
    }

    function applyFilters() {
        if (!ordersTableBody) return;

        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const selectedStatus = statusFilterSelect ? statusFilterSelect.value : 'all';

        const filtered = allOrders.filter(order => {
            const shortId = `#ORD-${order._id.slice(-6).toUpperCase()}`;
            const matchesSearch = !query || 
                shortId.toLowerCase().includes(query) || 
                order._id.toLowerCase().includes(query) || 
                (order.user?.name && order.user.name.toLowerCase().includes(query));

            const matchesStatus = selectedStatus === 'all' || order.orderStatus === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        renderAdminOrders(filtered);
    }

    function renderAdminOrders(orders) {
        if (!ordersTableBody) return;
        ordersTableBody.innerHTML = "";

        if (orders.length === 0) {
            ordersTableBody.innerHTML = '<tr><td colspan="7" class="text-center p-5 text-muted">No orders found matching criteria.</td></tr>';
            return;
        }

        orders.forEach(order => {
            const date = new Date(order.createdAt).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
            
            // Payment badge styling
            let paymentBadge = `<span class="status-badge" style="background:#f1f5f9; color:#475569; border-radius: 9999px; padding: 4px 10px; font-size: 11px; font-weight: 600;">${order.paymentMethod}</span>`;
            if (order.paymentMethod === 'COD') {
                paymentBadge = `<span class="status-badge" style="background:#e0f2fe; color:#0369a1; border-radius: 9999px; padding: 4px 10px; font-size: 11px; font-weight: 600;">COD</span>`;
            } else if (order.paymentMethod === 'Online') {
                paymentBadge = `<span class="status-badge" style="background:#d1fae5; color:#065f46; border-radius: 9999px; padding: 4px 10px; font-size: 11px; font-weight: 600;">Online</span>`;
            } else if (order.paymentMethod === 'Wallet') {
                paymentBadge = `<span class="status-badge" style="background:#f3e8ff; color:#6b21a8; border-radius: 9999px; padding: 4px 10px; font-size: 11px; font-weight: 600;">Wallet</span>`;
            }

            let statusClass = '';
            switch(order.orderStatus) {
                case 'Pending': statusClass = 'status-pending'; break;
                case 'Confirmed': statusClass = 'status-processing'; break;
                case 'Shipped': statusClass = 'status-shipped'; break;
                case 'Delivered': statusClass = 'status-delivered'; break;
                case 'Cancelled': statusClass = 'status-cancelled'; break;
                case 'Return Requested': statusClass = 'status-returned'; break;
                case 'Returned': statusClass = 'status-returned'; break;
                case 'Return Rejected': statusClass = 'status-cancelled'; break;
                default: statusClass = 'status-pending';
            }

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <span style="background:#f1f5f9; color:#475569; padding:6px 12px; border-radius:8px; font-size:12px; font-weight: 600; border:1px solid #e2e8f0; font-family: monospace;">#ORD-${order._id.slice(-6).toUpperCase()}</span>
                </td>
                <td>
                    <div style="font-weight:600; color:#0f172a;">${order.user?.name || 'Guest'}</div>
                    <div style="font-size:11px; color:#64748b;">${order.user?.email || 'N/A'}</div>
                </td>
                <td>
                    <div style="display:flex; align-items:center; gap:6px; color:#64748b;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span>${date}</span>
                    </div>
                </td>
                <td>
                    <select class="status-badge-select status-select ${statusClass}" data-id="${order._id}">
                        <option value="Pending" ${order.orderStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Confirmed" ${order.orderStatus === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="Shipped" ${order.orderStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="Delivered" ${order.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${order.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        <option value="Return Requested" ${order.orderStatus === 'Return Requested' ? 'selected' : ''}>Return Req</option>
                        <option value="Returned" ${order.orderStatus === 'Returned' ? 'selected' : ''}>Returned</option>
                        <option value="Return Rejected" ${order.orderStatus === 'Return Rejected' ? 'selected' : ''}>Return Rej</option>
                    </select>
                </td>
                <td>${paymentBadge}</td>
                <td>
                    <span style="font-weight: 700; color: #0f172a;">₹${order.finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </td>
                <td>
                    <div class="action-btns justify-content-end">
                        <button class="btn-history" data-order='${JSON.stringify(order).replace(/'/g, "&apos;")}' data-bs-toggle="modal" data-bs-target="#orderHistoryModal" title="View Timeline">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </button>
                        <button class="btn-update-pill update-status-btn" data-id="${order._id}">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            Update
                        </button>
                    </div>
                </td>
            `;
            ordersTableBody.appendChild(tr);
        });

        // Add event listeners for update buttons
        document.querySelectorAll('.update-status-btn').forEach(btn => {
            btn.addEventListener('click', async function () {
                const id = this.getAttribute('data-id');
                const row = this.closest('tr');
                const selectEl = row.querySelector('.status-select');
                const status = selectEl.value;
                const originalHTML = this.innerHTML;

                // Disable interactions while updating
                this.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite; margin-right: 4px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg> Updating`;
                this.disabled = true;
                if (selectEl) selectEl.disabled = true;

                const success = await updateStatus(id, status);

                // Restore status
                this.innerHTML = originalHTML;
                this.disabled = false;
                if (selectEl) selectEl.disabled = false;

                if (success) {
                    successToast("Order status updated successfully!");
                    setTimeout(() => {
                        fetchAdminOrders();
                    }, 800);
                } else {
                    errorToast("Failed to update status. Check configuration rules.");
                }
            });
        });

        // Add dynamic color change for status selects
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', function() {
                this.classList.remove('status-pending', 'status-processing', 'status-shipped', 'status-delivered', 'status-cancelled', 'status-returned');
                
                let statusClass = '';
                switch(this.value) {
                    case 'Pending': statusClass = 'status-pending'; break;
                    case 'Confirmed': statusClass = 'status-processing'; break;
                    case 'Shipped': statusClass = 'status-shipped'; break;
                    case 'Delivered': statusClass = 'status-delivered'; break;
                    case 'Cancelled': statusClass = 'status-cancelled'; break;
                    case 'Return Requested': statusClass = 'status-returned'; break;
                    case 'Returned': statusClass = 'status-returned'; break;
                    case 'Return Rejected': statusClass = 'status-cancelled'; break;
                    default: statusClass = 'status-pending';
                }
                this.classList.add(statusClass);
            });
        });

        // Bind history button modal dynamic renderer
        document.querySelectorAll('.btn-history').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderData = JSON.parse(this.getAttribute('data-order'));
                const timelineContainer = document.getElementById('orderTimelineContent');
                if (!timelineContainer) return;

                const status = orderData.orderStatus;
                const date = new Date(orderData.createdAt).toLocaleDateString(undefined, { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                });

                let timelineHTML = '';

                const createItem = (title, time, isCompleted, isActive) => {
                    const dotClass = isCompleted ? 'completed' : (isActive ? 'active' : '');
                    const icon = isCompleted ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '';
                    return `
                        <div class="timeline-item">
                            <div class="timeline-dot ${dotClass}">${icon}</div>
                            <div class="timeline-content">
                                <div class="timeline-title">${title}</div>
                                <div class="timeline-time">${time}</div>
                            </div>
                        </div>
                    `;
                };

                // Populate dynamic progression
                timelineHTML += createItem("Order Placed", date, true, false);

                if (status === 'Cancelled') {
                    timelineHTML += createItem("Order Cancelled", "Cancelled by customer/administrator", false, true);
                } else if (status === 'Return Requested') {
                    timelineHTML += createItem("Confirmed", "Processed successfully", true, false);
                    timelineHTML += createItem("Shipped", "Shipped via logistics partner", true, false);
                    timelineHTML += createItem("Delivered", "Delivered to customer", true, false);
                    timelineHTML += createItem("Return Requested", "Customer initiated return request", false, true);
                } else if (status === 'Returned') {
                    timelineHTML += createItem("Confirmed", "Processed successfully", true, false);
                    timelineHTML += createItem("Shipped", "Shipped via logistics partner", true, false);
                    timelineHTML += createItem("Delivered", "Delivered to customer", true, false);
                    timelineHTML += createItem("Returned", "Product returned and wallet credited", true, false);
                } else if (status === 'Return Rejected') {
                    timelineHTML += createItem("Confirmed", "Processed successfully", true, false);
                    timelineHTML += createItem("Shipped", "Shipped via logistics partner", true, false);
                    timelineHTML += createItem("Delivered", "Delivered to customer", true, false);
                    timelineHTML += createItem("Return Request Rejected", "Administrator rejected return", false, true);
                } else {
                    const isConfirmed = ['Confirmed', 'Shipped', 'Delivered'].includes(status);
                    const isShipped = ['Shipped', 'Delivered'].includes(status);
                    const isDelivered = status === 'Delivered';

                    timelineHTML += createItem("Confirmed", isConfirmed ? "Processed successfully" : "Awaiting processing", isConfirmed, status === 'Pending');
                    timelineHTML += createItem("Shipped", isShipped ? "Shipped via logistics partner" : "Awaiting shipping carrier", isShipped, status === 'Confirmed');
                    timelineHTML += createItem("Delivered", isDelivered ? "Delivered to customer address" : "In transit to destination", isDelivered, status === 'Shipped');
                }

                timelineContainer.innerHTML = timelineHTML;
            });
        });
    }

    async function updateStatus(id, status) {
        try {
            const res = await fetch(`/api/orders/admin/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            return res.ok;
        } catch (err) {
            console.error(err);
            return false;
        }
    }
});
