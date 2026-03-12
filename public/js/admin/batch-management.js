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
        document.querySelectorAll('.btn-admin-outline.btn-admin-icon').forEach(btn => {
            btn.addEventListener('click', () => alert('View batch details (Simulation)'));
        });
    };

    bindActions();
})();
