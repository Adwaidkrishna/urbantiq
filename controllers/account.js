document.addEventListener("DOMContentLoaded", function () {
    // Expose toggleOption globally so existing onclick="" attributes still work
    window.toggleOption = function (id, rowEl) {
        const pane = document.getElementById(id);
        if (!pane) return;

        const isActive = pane.classList.contains('active');

        // Close all
        document.querySelectorAll('.ac-expandable').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.ac-row').forEach(el => el.classList.remove('expanded'));

        // Toggle target
        if (!isActive) {
            pane.classList.add('active');
            if (rowEl) rowEl.classList.add('expanded');
        }
    };
});
