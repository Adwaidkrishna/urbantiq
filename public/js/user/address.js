document.addEventListener("DOMContentLoaded", async () => {
    const addressList   = document.getElementById("addressList");
    const addrCount     = document.getElementById("addrCount");
    const saveBtn       = document.getElementById("saveAddressBtn");
    const openAddBtn    = document.getElementById("openAddModal");
    const confirmDelBtn = document.getElementById("confirmDeleteBtn");

    const modal       = new bootstrap.Modal(document.getElementById("addressModal"));
    const deleteModal = new bootstrap.Modal(document.getElementById("deleteConfirmModal"));

    let pendingDeleteId = null;

    // ── Fetch and render ──────────────────────────────────
    async function loadAddresses() {
        try {
            const res  = await fetch("/api/user-profile/addresses");
            const data = await res.json();
            renderAddresses(data.addresses || []);
        } catch (err) {
            addressList.innerHTML = `<p class="text-danger text-center">Failed to load addresses.</p>`;
        }
    }

    function renderAddresses(addresses) {
        addrCount.textContent = addresses.length
            ? `${addresses.length} saved address${addresses.length > 1 ? "es" : ""}`
            : "No saved addresses yet";

        if (addresses.length === 0) {
            addressList.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-geo-alt text-muted" style="font-size: 3rem;"></i>
                    <h5 class="mt-3 fw-bold">No Addresses Saved</h5>
                    <p class="text-muted">Add a delivery address to speed up your checkout.</p>
                </div>
            `;
            return;
        }

        addressList.innerHTML = addresses.map(addr => `
            <div class="address-card ${addr.isDefault ? 'active-default' : ''}" data-id="${addr._id}">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="d-flex align-items-center gap-2">
                        <span class="type-badge">
                            <i class="bi bi-${addr.label === 'Home' ? 'house' : addr.label === 'Work' ? 'briefcase' : 'geo-alt'} me-1"></i>
                            ${addr.label}
                        </span>
                        ${addr.isDefault ? `<span class="default-badge"><i class="bi bi-star-fill me-1" style="font-size:0.6rem;"></i>Default</span>` : ""}
                    </div>
                    <div class="d-flex gap-2 align-items-center">
                        ${!addr.isDefault ? `<button class="btn btn-link p-0 text-dark small fw-bold text-decoration-none set-default-btn" data-id="${addr._id}">Set Default</button>` : ""}
                        <button class="address-menu-btn edit-addr-btn" title="Edit" data-id="${addr._id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="address-menu-btn text-danger delete-addr-btn" title="Delete" data-id="${addr._id}">
                            <i class="bi bi-trash3"></i>
                        </button>
                    </div>
                </div>
                <span class="address-name">${addr.fullName}</span>
                <span class="address-phone">${addr.phone}</span>
                <p class="address-text">
                    ${addr.addressLine1}${addr.addressLine2 ? ", " + addr.addressLine2 : ""}<br>
                    ${addr.city}, ${addr.state} — ${addr.postalCode}<br>
                    ${addr.country}
                </p>
            </div>
        `).join("");

        // Attach events
        addressList.querySelectorAll(".edit-addr-btn").forEach(btn => {
            btn.addEventListener("click", () => openEditModal(btn.dataset.id, addresses));
        });
        addressList.querySelectorAll(".delete-addr-btn").forEach(btn => {
            btn.addEventListener("click", () => confirmDelete(btn.dataset.id));
        });
        addressList.querySelectorAll(".set-default-btn").forEach(btn => {
            btn.addEventListener("click", () => setDefault(btn.dataset.id));
        });
    }

    // ── Open Add Modal ────────────────────────────────────
    openAddBtn.addEventListener("click", () => {
        resetForm();
        document.getElementById("addressModalTitle").textContent = "Add New Address";
        document.getElementById("editAddressId").value = "";
        modal.show();
    });

    // ── Open Edit Modal ───────────────────────────────────
    function openEditModal(id, addresses) {
        const addr = addresses.find(a => a._id === id);
        if (!addr) return;
        resetForm();
        document.getElementById("addressModalTitle").textContent = "Edit Address";
        document.getElementById("editAddressId").value = addr._id;
        document.getElementById("addrFullName").value  = addr.fullName;
        document.getElementById("addrPhone").value     = addr.phone;
        document.getElementById("addrLine1").value     = addr.addressLine1;
        document.getElementById("addrLine2").value     = addr.addressLine2 || "";
        document.getElementById("addrCity").value      = addr.city;
        document.getElementById("addrState").value     = addr.state;
        document.getElementById("addrPincode").value   = addr.postalCode;
        document.getElementById("addrLabel").value     = addr.label;
        document.getElementById("addrIsDefault").checked = addr.isDefault;
        modal.show();
    }

    function resetForm() {
        ["addrFullName","addrPhone","addrLine1","addrLine2","addrCity","addrState","addrPincode"].forEach(id => {
            document.getElementById(id).value = "";
        });
        document.getElementById("addrLabel").value = "Home";
        document.getElementById("addrIsDefault").checked = false;
    }

    // ── Save (Add or Edit) ────────────────────────────────
    saveBtn.addEventListener("click", async () => {
        const editId = document.getElementById("editAddressId").value;
        const payload = {
            fullName:     document.getElementById("addrFullName").value.trim(),
            phone:        document.getElementById("addrPhone").value.trim(),
            addressLine1: document.getElementById("addrLine1").value.trim(),
            addressLine2: document.getElementById("addrLine2").value.trim(),
            city:         document.getElementById("addrCity").value.trim(),
            state:        document.getElementById("addrState").value.trim(),
            postalCode:   document.getElementById("addrPincode").value.trim(),
            label:        document.getElementById("addrLabel").value,
            isDefault:    document.getElementById("addrIsDefault").checked
        };

        if (!payload.fullName || !payload.phone || !payload.addressLine1 || !payload.city || !payload.state || !payload.postalCode) {
            window.AuthGuard?.showToast("Please fill in all required fields.", "error");
            return;
        }

        try {
            saveBtn.textContent = "Saving...";
            saveBtn.disabled = true;
            const url    = editId ? `/api/user-profile/addresses/${editId}` : "/api/user-profile/addresses";
            const method = editId ? "PUT" : "POST";
            const res    = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to save address");
            modal.hide();
            renderAddresses(data.addresses);
            window.AuthGuard?.showToast(editId ? "Address updated!" : "Address added!", "success");
        } catch (err) {
            window.AuthGuard?.showToast(err.message, "error");
        } finally {
            saveBtn.textContent = "Save Address";
            saveBtn.disabled = false;
        }
    });

    // ── Set Default ───────────────────────────────────────
    async function setDefault(id) {
        try {
            const res  = await fetch(`/api/user-profile/addresses/${id}/set-default`, { method: "PATCH" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed");
            renderAddresses(data.addresses);
            window.AuthGuard?.showToast("Default address updated.", "success");
        } catch (err) {
            window.AuthGuard?.showToast(err.message, "error");
        }
    }

    // ── Delete ────────────────────────────────────────────
    function confirmDelete(id) {
        pendingDeleteId = id;
        deleteModal.show();
    }

    confirmDelBtn.addEventListener("click", async () => {
        if (!pendingDeleteId) return;
        try {
            const res  = await fetch(`/api/user-profile/addresses/${pendingDeleteId}`, { method: "DELETE" });
            const data = await res.json();
            deleteModal.hide();
            pendingDeleteId = null;
            renderAddresses(data.addresses);
            window.AuthGuard?.showToast("Address deleted.", "success");
        } catch (err) {
            window.AuthGuard?.showToast("Failed to delete address.", "error");
        }
    });

    // ── Init ──────────────────────────────────────────────
    loadAddresses();
});
