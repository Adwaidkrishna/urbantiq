(function () {
    const form = document.querySelector('form');

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('Purchase entry submitted');
            alert('Purchase entry recorded successfully (Simulation)');
            form.reset();
        });
    }

    const addBtn = document.querySelector('.btn-admin-outline.btn-admin-sm');
    if (addBtn) {
        addBtn.addEventListener('click', function () {
            alert('Add another item functionality (Simulation)');
        });
    }

    const removeBtns = document.querySelectorAll('.btn-admin-danger.btn-admin-icon');
    removeBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            alert('Remove item functionality (Simulation)');
        });
    });
})();
