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

    // Logout — calls the API to clear the JWT cookie, then redirects to home
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            const label = logoutBtn.querySelector("span");
            if (label) label.textContent = "Logging out...";
            try {
                await fetch("/api/auth/logout", { method: "POST" });
            } catch (e) { /* ignore network errors */ }
            // Clear the cached auth status so navbar re-evaluates on next page
            if (window.AuthGuard && window.AuthGuard.clearCache) {
                window.AuthGuard.clearCache();
            }
            window.location.href = "/";
        });
    }
});
