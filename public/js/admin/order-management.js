document.addEventListener("DOMContentLoaded", function () {
    const ordersTableBody = document.querySelector(".admin-table tbody");
    if (ordersTableBody) {
        fetchAdminOrders();
    }

    async function fetchAdminOrders() {
        try {
            const response = await fetch("/api/orders/admin/all");
            const orders = await response.json();
            renderAdminOrders(orders);
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    }

    function renderAdminOrders(orders) {
        ordersTableBody.innerHTML = "";
        orders.forEach(order => {
            const date = new Date(order.createdAt).toLocaleDateString();
            
            // Payment badge styling
            let paymentBadge = `<span class="status-badge" style="background:#E5E7EB; color:#374151;">${order.paymentMethod}</span>`;
            if (order.paymentMethod === 'COD') {
                paymentBadge = `<span class="status-badge" style="background:#DBEAFE; color:#1E40AF;">COD</span>`;
            } else if (order.paymentMethod === 'Online') {
                paymentBadge = `<span class="status-badge" style="background:#D1FAE5; color:#065F46;">Online</span>`;
            } else if (order.paymentMethod === 'Wallet') {
                paymentBadge = `<span class="status-badge" style="background:#F3E8FF; color:#6B21A8;">Wallet</span>`;
            }

            // Status select colors
            let selectBg = "#FFFFFF";
            let selectColor = "#111827";
            switch(order.orderStatus) {
                case 'Pending': selectBg = "#FEF3C7"; selectColor = "#92400E"; break;
                case 'Confirmed': selectBg = "#E0E7FF"; selectColor = "#3730A3"; break;
                case 'Shipped': selectBg = "#FEF08A"; selectColor = "#854D0E"; break;
                case 'Delivered': selectBg = "#D1FAE5"; selectColor = "#065F46"; break;
                case 'Cancelled': selectBg = "#FEE2E2"; selectColor = "#991B1B"; break;
                case 'Returned': selectBg = "#F3E8FF"; selectColor = "#6B21A8"; break;
            }

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="fw-600">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="background:#F3F4F6; padding:4px 8px; border-radius:6px; font-size:11px; letter-spacing:0.5px; border:1px solid #E5E7EB;">#ORD-${order._id.slice(-6).toUpperCase()}</span>
                    </div>
                </td>
                <td>
                    <div style="font-weight:600; color:#111827;">${order.user?.name || 'Guest'}</div>
                </td>
                <td class="td-secondary">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        ${date}
                    </div>
                </td>
                <td>
                    <select class="form-select-admin status-select" data-id="${order._id}" style="padding: 4px 12px; font-size: 0.8rem; font-weight: 600; border-radius: 20px; background-color: ${selectBg}; color: ${selectColor}; border: 1px solid transparent; width: 140px; cursor: pointer; transition: all 0.2s;">
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
                <td class="fw-600" style="color:#059669;">₹${order.finalAmount.toLocaleString()}</td>
                <td>
                    <div class="action-btns justify-content-end">
                        <button class="btn-admin-primary btn-admin-sm update-status-btn" data-id="${order._id}" style="border-radius: 8px; padding: 8px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); transition: all 0.2s ease-in-out; display: inline-flex; align-items: center; gap: 6px; font-weight: 600; letter-spacing: 0.3px; background: linear-gradient(135deg, #111827 0%, #374151 100%); border: none;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
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
                const status = row.querySelector('.status-select').value;
                const originalHTML = this.innerHTML;
                this.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg> Updating...`;
                this.disabled = true;
                const success = await updateStatus(id, status);
                this.innerHTML = originalHTML;
                this.disabled = false;
                if (success) {
                    this.parentElement.innerHTML = `<span class="text-success small fw-bold" style="display:flex; align-items:center; gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Success!</span>`;
                    setTimeout(() => {
                        fetchAdminOrders();
                    }, 1000);
                }
            });
        });

        // Add dynamic color change for the select dropdown
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', function() {
                let selectBg = "#FFFFFF";
                let selectColor = "#111827";
                switch(this.value) {
                    case 'Pending': selectBg = "#FEF3C7"; selectColor = "#92400E"; break;
                    case 'Confirmed': selectBg = "#E0E7FF"; selectColor = "#3730A3"; break;
                    case 'Shipped': selectBg = "#FEF08A"; selectColor = "#854D0E"; break;
                    case 'Delivered': selectBg = "#D1FAE5"; selectColor = "#065F46"; break;
                    case 'Cancelled': selectBg = "#FEE2E2"; selectColor = "#991B1B"; break;
                    case 'Returned': selectBg = "#F3E8FF"; selectColor = "#6B21A8"; break;
                }
                this.style.backgroundColor = selectBg;
                this.style.color = selectColor;
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
            if (res.ok) {
                return true;
            } else {
                const data = await res.json();
                console.error("Status update error:", data.message);
                return false;
            }
        } catch (err) {
            console.error(err);
            return false;
        }
    }
});
