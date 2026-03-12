(function () {
    const form = document.querySelector('form');

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('Stock update submitted');
            alert('Stock level updated successfully (Simulation)');
            form.reset();
        });
    }
})();
