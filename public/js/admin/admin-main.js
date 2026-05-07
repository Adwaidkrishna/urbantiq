/**
 * admin-main.js — Global script for URBANTIQ Admin Panel
 * Handles topbar search, admin profile sync, and common interactions.
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. GLOBAL PROFILE SYNC
    fetchAdminProfile();

    // 2. GLOBAL SEARCH LOGIC
    const searchInput = document.getElementById("globalSearchInput");
    const searchDropdown = document.getElementById("globalSearchResults");

    if (searchInput && searchDropdown) {
        let debounceTimer;

        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.trim();
            clearTimeout(debounceTimer);

            if (query.length < 2) {
                searchDropdown.classList.remove("show");
                return;
            }

            debounceTimer = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/admin/global-search?query=${encodeURIComponent(query)}`);
                    const data = await response.json();

                    if (data.success) {
                        renderSearchResults(data.results);
                    }
                } catch (err) {
                    console.error("Search failed", err);
                }
            }, 300);
        });

        // Hide dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                searchDropdown.classList.remove("show");
            }
        });

        // Show dropdown when focused if query exists
        searchInput.addEventListener("focus", () => {
            if (searchInput.value.trim().length >= 2) {
                searchDropdown.classList.add("show");
            }
        });
    }

    function renderSearchResults(results) {
        if (!searchDropdown) return;
        
        if (results.length === 0) {
            searchDropdown.innerHTML = `<div class="p-3 text-center text-muted fs-13">No matches found for "${searchInput.value}"</div>`;
            searchDropdown.classList.add("show");
            return;
        }

        searchDropdown.innerHTML = results.map(res => `
            <a href="${res.link}" class="search-result-item">
                <div class="result-info">
                    <span class="result-type-badge result-type-${res.type}">${res.type}</span>
                    <span class="result-title">${res.title}</span>
                    <span class="result-subtitle">ID: #${res.id.toString().slice(-6).toUpperCase()}</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-muted"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </a>
        `).join("");
        
        searchDropdown.classList.add("show");
    }
});

async function fetchAdminProfile() {
    try {
        const res = await fetch("/api/admin/profile");
        const data = await res.json();
        if (data.success && data.admin) {
            const admin = data.admin;
            const fullName = `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.email;
            document.querySelectorAll(".topbar-user-name").forEach(el => el.textContent = fullName);
            const initials = fullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
            document.querySelectorAll(".topbar-user-avatar, .sidebar-user-avatar").forEach(el => el.textContent = initials);
            document.querySelectorAll(".sidebar-user-name").forEach(el => el.textContent = fullName);
        }
    } catch (_) {}
}
