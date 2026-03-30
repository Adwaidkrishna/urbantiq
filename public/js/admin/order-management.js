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
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="fw-600">#ORD-${order._id.slice(-6).toUpperCase()}</td>
                <td>${order.user?.name || 'Guest'}</td>
                <td class="td-secondary">${date}</td>
                <td>
                    <select class="form-select-admin status-select" data-id="${order._id}" style="padding: 2px 8px; font-size: 0.8rem;">
                        <option value="Pending" ${order.orderStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Confirmed" ${order.orderStatus === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="Shipped" ${order.orderStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="Delivered" ${order.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${order.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td class="td-secondary">${order.paymentMethod}</td>
                <td class="fw-600">₹${order.finalAmount.toLocaleString()}</td>
                <td>
                    <div class="action-btns justify-content-end">
                        <button class="btn-admin-outline btn-admin-sm update-status-btn" data-id="${order._id}">Update</button>
                    </div>
                </td>
            `;
            ordersTableBody.appendChild(tr);
        });

        // Add event listeners for update buttons
        document.querySelectorAll('.update-status-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.getAttribute('data-id');
                const row = this.closest('tr');
                const status = row.querySelector('.status-select').value;
                await updateStatus(id, status);
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
                alert("Order status updated!");
            } else {
                alert("Failed to update status.");
            }
        } catch (err) {
            console.error(err);
        }
    }
});
