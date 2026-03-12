document.addEventListener("DOMContentLoaded", function () {
    // Tab switching — expose globally for onclick in HTML
    window.switchTab = function (tabId, btn) {
        // Update buttons
        document.querySelectorAll('.ac-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update panes
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('d-none'));
        const pane = document.getElementById(tabId);
        if (pane) pane.classList.remove('d-none');
    };
});
