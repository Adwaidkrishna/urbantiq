const form = document.getElementById("supplierForm");

async function loadSuppliers() {
  try {
    const res = await fetch("/api/admin/suppliers/list");
    const suppliers = await res.json();

    if (res.ok) {
      const tbody = document.querySelector(".admin-table tbody");
      tbody.innerHTML = "";
      suppliers.forEach((s) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="fw-600">${s.name}</td>
          <td>${s.contactPerson || s.name}</td>
          <td class="td-secondary">${s.companyName}</td>
          <td>${s.contactNumber}</td>
          <td><span class="status-badge badge-${s.status === 'inactive' ? 'inactive' : 'active'}">${s.status === 'inactive' ? 'Inactive' : 'Active'}</span></td>
          <td>
              <div class="action-btns justify-content-end">
                  <a href="/api/admin/edit-supplier/${s._id}" class="btn-admin-outline btn-admin-icon" title="Edit">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                  </a>
                  <button class="btn-admin-danger btn-admin-icon" title="Delete" onclick="deleteSupplier('${s._id}')">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                      </svg>
                  </button>
              </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error("Error loading suppliers:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadSuppliers);

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("contactPerson").value.trim();
  const companyName = document.getElementById("companyName").value.trim();
  const contactNumber = document.getElementById("contactNumber").value.trim();

  // Frontend validation
  if (!name || !companyName || !contactNumber) {
    alert("All fields are required");
    return;
  }

  if (!/^[0-9]{10}$/.test(contactNumber)) {
    alert("Enter valid 10 digit number");
    return;
  }

  try {
    const res = await fetch("/api/admin/suppliers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, companyName, contactNumber }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Error");
      return;
    }

    // SUCCESS FLOW
    alert("Supplier added successfully");

    form.reset();        // clear form
    loadSuppliers();     // refresh table

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
});

async function deleteSupplier(id) {
  if (!confirm("Are you sure you want to delete this supplier?")) return;
  try {
    const res = await fetch(`/api/admin/suppliers/${id}`, { method: "DELETE" });
    if (res.ok) {
      loadSuppliers();
    } else {
      const data = await res.json();
      alert(data.message || "Failed to delete");
    }
  } catch (error) {
    console.error("Delete error:", error);
    alert("Server error");
  }
}