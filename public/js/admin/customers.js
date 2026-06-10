(function () {
    const tableBody = document.querySelector('.admin-table tbody');
    const searchInput = document.querySelector('.search-input');
    const paginationStart = document.getElementById('pagination-start');
    const paginationEnd = document.getElementById('pagination-end');
    const paginationTotal = document.getElementById('pagination-total');
    const paginationControls = document.getElementById('pagination-controls');

    if (!tableBody) return;

    // Local state
    let state = {
        currentPage: 1,
        limit: 10,
        searchQuery: '',
        customers: [],
        pagination: {}
    };

    // Debounce helper
    let debounceTimer;
    function debounce(func, delay = 300) {
        return function (...args) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Fetch data
    async function fetchCustomers() {
        try {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary spinner-border-sm" role="status"></div> Loading customers...</td></tr>';
            
            const url = `/api/admin/customers?page=${state.currentPage}&limit=${state.limit}&search=${encodeURIComponent(state.searchQuery)}`;
            
            const res = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!res.ok) {
                throw new Error(`Failed to fetch data: ${res.statusText}`);
            }
            
            const data = await res.json();
            state.customers = data.customers;
            state.pagination = data.pagination;
            
            renderCustomers();
            renderPagination();
        } catch (err) {
            console.error('Failed to fetch customers:', err);
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Failed to load customer database. Please try again.</td></tr>';
        }
    }

    // Render table rows
    function renderCustomers() {
        if (state.customers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No customers found</td></tr>';
            return;
        }

        tableBody.innerHTML = state.customers.map(cust => {
            const displayPhone = cust.phone ? cust.phone : '<span class="text-secondary small">N/A</span>';
            const statusBadgeClass = cust.status === 'blocked' ? 'badge-cancelled' : 'badge-active';
            const statusText = cust.status === 'blocked' ? 'Blocked' : 'Active';
            
            // Format wallet balance
            const walletFormatted = typeof cust.walletBalance === 'number'
                ? `₹${cust.walletBalance.toFixed(2)}`
                : '₹0.00';

            // Action button toggle: Block (red) or Unblock (green check icon/outline)
            const actionButton = cust.status === 'blocked'
                ? `<button class="btn-admin-outline btn-admin-icon btn-toggle-status" data-id="${cust._id}" data-status="active" title="Unblock Customer">
                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                   </button>`
                : `<button class="btn-admin-danger btn-admin-icon btn-toggle-status" data-id="${cust._id}" data-status="blocked" title="Block Customer">
                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line></svg>
                   </button>`;

            return `
                <tr>
                    <td class="fw-600">
                        <div class="d-flex align-items-center gap-2">
                            <div class="avatar-sm rounded-circle d-flex align-items-center justify-content-center bg-secondary text-white" style="width: 32px; height: 32px; font-size: 12px; font-weight: 600;">
                                ${cust.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span>${cust.name}</span>
                        </div>
                    </td>
                    <td>${cust.email}</td>
                    <td class="td-secondary">${displayPhone}</td>
                    <td>${cust.totalOrders} ${cust.totalOrders === 1 ? 'Order' : 'Orders'}</td>
                    <td class="fw-600 text-info">${walletFormatted}</td>
                    <td><span class="status-badge ${statusBadgeClass}">${statusText}</span></td>
                    <td>
                        <div class="action-btns justify-content-end">
                            <button class="btn-admin-outline btn-admin-icon btn-view-details" data-id="${cust._id}" title="View Details">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </button>
                            ${actionButton}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach action events
        document.querySelectorAll('.btn-toggle-status').forEach(btn => {
            btn.addEventListener('click', handleStatusToggle);
        });

        document.querySelectorAll('.btn-view-details').forEach(btn => {
            btn.addEventListener('click', handleViewDetails);
        });
    }

    // Render pagination controls
    function renderPagination() {
        const { currentPage, totalPages, totalCustomers } = state.pagination;
        
        // Update range labels
        const startIdx = totalCustomers === 0 ? 0 : (currentPage - 1) * state.limit + 1;
        const endIdx = Math.min(currentPage * state.limit, totalCustomers);
        
        paginationStart.textContent = startIdx;
        paginationEnd.textContent = endIdx;
        paginationTotal.textContent = totalCustomers;

        // Generate controls
        let html = '';

        // Previous button
        html += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <button class="page-link" data-page="${currentPage - 1}" style="background-color: #374151; color: #f3f4f6; border-color: #4b5563;">&laquo;</button>
            </li>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <li class="page-item ${currentPage === i ? 'active' : ''}">
                    <button class="page-link" data-page="${i}" style="${currentPage === i ? 'background-color: #EF4444; border-color: #EF4444; color: white;' : 'background-color: #374151; color: #f3f4f6; border-color: #4b5563;'}">${i}</button>
                </li>
            `;
        }

        // Next button
        html += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <button class="page-link" data-page="${currentPage + 1}" style="background-color: #374151; color: #f3f4f6; border-color: #4b5563;">&raquo;</button>
            </li>
        `;

        paginationControls.innerHTML = html;

        // Add page item click listeners
        paginationControls.querySelectorAll('.page-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetPage = parseInt(e.target.getAttribute('data-page'), 10);
                if (targetPage && targetPage !== currentPage && targetPage >= 1 && targetPage <= totalPages) {
                    state.currentPage = targetPage;
                    fetchCustomers();
                }
            });
        });
    }

    // Action handlers
    async function handleStatusToggle(e) {
        const btn = e.currentTarget;
        const id = btn.getAttribute('data-id');
        const nextStatus = btn.getAttribute('data-status');
        const isBlock = nextStatus === 'blocked';

        const customerName = btn.closest('tr').querySelector('.fw-600 span').textContent;

        const confirmed = await showConfirm({
            title: isBlock ? "Block Customer?" : "Unblock Customer?",
            text: isBlock 
                ? `Are you sure you want to block ${customerName}? They will not be able to log in or place orders.` 
                : `Are you sure you want to restore access to ${customerName}'s account?`,
            confirmText: isBlock ? "Yes, Block Account" : "Yes, Unblock",
            icon: isBlock ? "warning" : "info"
        });

        if (!confirmed) return;

        try {
            const res = await fetch(`/api/admin/customers/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: nextStatus })
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || "Failed to update user status");
            }

            successToast(result.message || "Status updated successfully.");
            fetchCustomers();
        } catch (error) {
            console.error("Status update error:", error);
            errorToast(error.message || "Error occurred while updating account status.");
        }
    }

    function handleViewDetails(e) {
        const btn = e.currentTarget;
        const customerName = btn.closest('tr').querySelector('.fw-600 span').textContent;
        const email = btn.closest('tr').children[1].textContent;
        const phone = btn.closest('tr').children[2].textContent;
        const totalOrders = btn.closest('tr').children[3].textContent;
        const wallet = btn.closest('tr').children[4].textContent;
        const status = btn.closest('tr').querySelector('.status-badge').textContent;

        Swal.fire({
            title: `<span style="color: #f9fafb;">${customerName}</span>`,
            html: `
                <div style="text-align: left; color: #d1d5db; font-size: 14px; line-height: 1.6;">
                    <div style="margin-bottom: 8px;"><strong>Email:</strong> ${email}</div>
                    <div style="margin-bottom: 8px;"><strong>Phone:</strong> ${phone}</div>
                    <div style="margin-bottom: 8px;"><strong>Total Orders:</strong> ${totalOrders}</div>
                    <div style="margin-bottom: 8px;"><strong>Wallet Balance:</strong> <span style="color: #34d399; font-weight: 600;">${wallet}</span></div>
                    <div style="margin-bottom: 8px;"><strong>Account Status:</strong> <span style="color: ${status === 'Blocked' ? '#f87171' : '#34d399'}">${status}</span></div>
                </div>
            `,
            background: "#1f2937",
            confirmButtonColor: "#EF4444",
            confirmButtonText: "Close"
        });
    }

    // Search bar event
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            state.searchQuery = e.target.value;
            state.currentPage = 1; // Reset to page 1 on new search
            fetchCustomers();
        }, 300));
    }

    // Initial load
    fetchCustomers();
})();
