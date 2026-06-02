(function () {
    const form = document.querySelector('form');

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('Offer scheduling submitted');
            successToast('Offer scheduled successfully');
            form.reset();
        });
    }

    // Bind action buttons
    const bindActions = () => {
        document.querySelectorAll('.btn-admin-outline.btn-admin-icon').forEach(btn => {
            btn.addEventListener('click', () => infoToast('Edit offer functionality coming soon'));
        });
        document.querySelectorAll('.btn-admin-danger.btn-admin-icon').forEach(btn => {
            btn.addEventListener('click', async () => {
                const confirmed = await showConfirm({
                    title: 'Remove Offer?',
                    text: 'This offer will be removed permanently.',
                    confirmText: 'Yes, Remove',
                    icon: 'warning',
                });
                if (confirmed) {
                    successToast('Offer removed');
                }
            });
        });
    };

    bindActions();
})();
