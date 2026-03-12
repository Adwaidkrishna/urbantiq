(function () {
    const form = document.querySelector('form');

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('Offer scheduling submitted');
            alert('Offer scheduled successfully (Simulation)');
            form.reset();
        });
    }

    // Bind action buttons
    const bindActions = () => {
        document.querySelectorAll('.btn-admin-outline.btn-admin-icon').forEach(btn => {
            btn.addEventListener('click', () => alert('Edit offer functionality (Simulation)'));
        });
        document.querySelectorAll('.btn-admin-danger.btn-admin-icon').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Are you sure you want to remove this offer?')) {
                    alert('Offer removed (Simulation)');
                }
            });
        });
    };

    bindActions();
})();
