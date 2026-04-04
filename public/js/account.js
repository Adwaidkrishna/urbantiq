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

    // Fetch Profile and Wallet Data
    fetchProfileData();

    async function fetchProfileData() {
        try {
            const authRes = await fetch("/api/auth/status");
            const authData = await authRes.json();
            
            if (authData.loggedIn) {
                document.querySelector(".profile-name").textContent = authData.user.name;
                document.querySelector(".profile-email").textContent = authData.user.email;
                
                // Update Name and Email rows
                const nameValue = document.querySelector(".ac-row:nth-child(1) .ac-row-value");
                if (nameValue) nameValue.textContent = authData.user.name;
                
                const emailValue = document.querySelector(".ac-row:nth-child(3) .ac-row-value");
                if (emailValue) emailValue.textContent = authData.user.email;
            }

            const walletRes = await fetch("/api/user-profile/wallet");
            const walletData = await walletRes.json();
            
            const walletValue = document.querySelector('a[href="/account-wallet"] .ac-row-value');
            if (walletValue) {
                walletValue.textContent = `₹${(walletData.balance || 0).toLocaleString()}`;
            }
        } catch (err) {
            console.error("Error fetching account data", err);
        }
    }

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
