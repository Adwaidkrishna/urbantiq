(function () {
    const searchInput = document.querySelector('.search-input');
    const statusFilter = document.querySelector('.form-select-admin');

    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const query = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.admin-table tbody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', function (e) {
            const status = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.admin-table tbody tr');
            rows.forEach(row => {
                const rowStatus = row.querySelector('.status-badge').textContent.toLowerCase();
                if (status === 'all statuses' || rowStatus === status) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // Bind action buttons
    const bindActions = () => {
        document.querySelectorAll('.btn-admin-outline.btn-admin-sm').forEach(btn => {
            if (btn.textContent === 'Manage') {
                btn.addEventListener('click', () => alert('Order management details (Simulation)'));
            } else if (btn.textContent === 'Export CSV') {
                btn.addEventListener('click', () => alert('Exporting orders to CSV (Simulation)'));
            }
        });
    };

    bindActions();
})();
