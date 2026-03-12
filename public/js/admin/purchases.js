(function () {
    const searchInput = document.querySelector('.search-input');

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

    // Bind action buttons
    const bindActions = () => {
        document.querySelectorAll('.btn-admin-outline[title="View"]').forEach(btn => {
            btn.addEventListener('click', () => alert('View purchase details (Simulation)'));
        });
        document.querySelectorAll('.btn-admin-danger[title="Delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this purchase entry?')) {
                    alert('Purchase entry deleted (Simulation)');
                }
            });
        });
    };

    bindActions();
})();
