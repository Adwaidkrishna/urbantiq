(function () {
    const tableBody = document.querySelector('.admin-table tbody');

    if (!tableBody) return;

    async function fetchCustomers() {
        try {
            const res = await fetch('/api/admin/customers-list');
            const customers = await res.json();
            renderCustomers(customers);
        } catch (err) {
            console.error('Failed to fetch customers:', err);
        }
    }

    function renderCustomers(customers) {
        if (customers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No customers found</td></tr>';
            return;
        }
        tableBody.innerHTML = customers.map(cust => `
            <tr>
                <td class="fw-600">${cust.name}</td>
                <td>${cust.email}</td>
                <td class="td-secondary">N/A</td>
                <td>0 Orders</td>
                <td><span class="status-badge ${cust.isVerified ? 'badge-active' : 'badge-inactive'}">${cust.isVerified ? 'Verified' : 'Unverified'}</span></td>
                <td>
                    <div class="action-btns justify-content-end">
                        <button class="btn-admin-outline btn-admin-icon" title="View"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
                        <button class="btn-admin-danger btn-admin-icon" title="Block"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line></svg></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    fetchCustomers();
})();
