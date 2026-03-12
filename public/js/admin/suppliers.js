(function () {
    const enlistForm = document.querySelector('form');

    if (enlistForm) {
        enlistForm.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('Supplier enlistment submitted');
            alert('Supplier enlisted successfully (Simulation)');
            enlistForm.reset();
        });
    }

    // Bind action buttons
    const bindActions = () => {
        document.querySelectorAll('.btn-admin-outline[title="Edit"]').forEach(btn => {
            btn.addEventListener('click', () => alert('Edit supplier functionality (Simulation)'));
        });
        document.querySelectorAll('.btn-admin-danger[title="Delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this supplier?')) {
                    alert('Supplier deleted (Simulation)');
                }
            });
        });
    };

    bindActions();
})();
