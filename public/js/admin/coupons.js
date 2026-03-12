(function () {
    const form = document.querySelector('form');

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('Coupon creation submitted');
            alert('Coupon created successfully (Simulation)');
            form.reset();
        });
    }

    // Bind action buttons
    const bindActions = () => {
        document.querySelectorAll('.btn-admin-outline[title="Edit"]').forEach(btn => {
            btn.addEventListener('click', () => alert('Edit coupon functionality (Simulation)'));
        });
        document.querySelectorAll('.btn-admin-danger[title="Delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this coupon?')) {
                    alert('Coupon deleted (Simulation)');
                }
            });
        });
    };

    bindActions();
})();
