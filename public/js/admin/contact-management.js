document.addEventListener("DOMContentLoaded", () => {
    let contactsList = [];

    // Sorting checkbox
    const sortCheckbox = document.getElementById("sortOldestFirst");
    if (sortCheckbox) {
        sortCheckbox.addEventListener("change", () => {
            sortAndRender();
        });
    }

    async function fetchContacts() {
        const tbody = document.getElementById("contactQueriesTable");
        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 td-secondary">
                    Loading messages...
                </td>
            </tr>
        `;

        try {
            const res = await fetch("/api/admin/contacts");
            const data = await res.json();

            if (res.ok && data.success) {
                contactsList = data.contacts || [];
                sortAndRender();
            } else {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-4 text-danger fw-600">
                            Failed to load messages: ${data.message || "Unknown error"}
                        </td>
                    </tr>
                `;
            }
        } catch (err) {
            console.error("Fetch contact queries error:", err);
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-danger fw-600">
                        An error occurred while loading messages.
                    </td>
                </tr>
            `;
        }
    }

    function sortAndRender() {
        const sorted = [...contactsList];
        const isOldestFirst = sortCheckbox && sortCheckbox.checked;

        sorted.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return isOldestFirst ? dateA - dateB : dateB - dateA;
        });

        renderContacts(sorted);
    }

    function renderContacts(contacts) {
        const tbody = document.getElementById("contactQueriesTable");
        if (!tbody) return;

        if (!contacts || contacts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 td-secondary">
                        No messages found.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = "";
        contacts.forEach(c => {
            const tr = document.createElement("tr");

            // Format date
            const dateStr = new Date(c.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });

            tr.innerHTML = `
                <td class="fw-600">${escapeHtml(c.name)}</td>
                <td><a href="mailto:${escapeHtml(c.email)}" class="text-decoration-none text-dark fw-500">${escapeHtml(c.email)}</a></td>
                <td class="fw-600" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(c.subject)}">${escapeHtml(c.subject)}</td>
                <td style="max-width: 350px; overflow: hidden; text-overflow: ellipsis; white-space: normal;" title="${escapeHtml(c.message)}">${escapeHtml(c.message)}</td>
                <td class="td-secondary">${dateStr}</td>
            `;

            tbody.appendChild(tr);
        });
    }

    function escapeHtml(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Initial load
    fetchContacts();
});
