document.addEventListener("DOMContentLoaded", () => {

    loadCategories();

});


async function loadCategories() {

    try {

        const res = await fetch("/api/admin/categories/list", { credentials: "include" });//???????????????
        const data = await res.json();

        const table = document.getElementById("categoryTable");

        table.innerHTML = ""; // clear old rows

        data.categories.forEach(cat => {

            const tr = document.createElement("tr");


            // IMAGE
            const imgTd = document.createElement("td");
            const img = document.createElement("img");

            img.src = `/images/categories/${cat.image}`;
            img.style.width = "44px";
            img.style.height = "44px";
            img.style.objectFit = "cover";
            img.style.borderRadius = "8px";

            imgTd.appendChild(img);


            // NAME
            const nameTd = document.createElement("td");
            nameTd.className = "fw-600";
            nameTd.textContent = cat.name;


            // PRODUCT COUNT
            const productTd = document.createElement("td");
            productTd.className = "td-secondary";
            productTd.textContent = "0 Products";


            // STATUS
            const statusTd = document.createElement("td");
            const badge = document.createElement("span");

            badge.className = cat.status
                ? "status-badge badge-active"
                : "status-badge badge-inactive";

            badge.textContent = cat.status ? "Active" : "Inactive";

            statusTd.appendChild(badge);


            // ACTION BUTTONS
            const actionTd = document.createElement("td");
            actionTd.className = "text-end";

            actionTd.innerHTML = `
            <div class="action-btns justify-content-end">
                <button class="btn-admin-outline btn-admin-icon" title="Edit" onclick="window.location.href='/api/admin/edit-category/${cat._id}'">✏️</button>
                <button class="btn-admin-danger btn-admin-icon" title="Delete" onclick="deleteCategory('${cat._id}')">🗑️</button>
            </div>
            `;


            tr.appendChild(imgTd);
            tr.appendChild(nameTd);
            tr.appendChild(productTd);
            tr.appendChild(statusTd);
            tr.appendChild(actionTd);

            table.appendChild(tr);

        });

    } catch (error) {

        console.error("Error loading categories:", error);

    }

}

async function deleteCategory(id) {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
        const res = await fetch(`/api/admin/categories/${id}`, {
            method: "DELETE",
            credentials: "include"
        });
        const data = await res.json();

        if (res.ok) {
            showToast(data.message || "Category deleted.", "success");
            loadCategories();
        } else {
            showToast(data.message || "Failed to delete.", "error");
        }
    } catch (err) {
        console.error("Delete error:", err);
        showToast("Network error. Please try again.", "error");
    }
}

document.addEventListener('DOMContentLoaded', () => {

    const categoryForm = document.getElementById('categoryForm');
    const submitBtn = categoryForm.querySelector('button[type="submit"]');

    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Basic client-side validation
        const name = categoryForm.querySelector('[name="name"]').value.trim();
        const image = categoryForm.querySelector('[name="image"]').files[0];

        if (!name) {
            showToast('Please enter a category name.', 'error');
            return;
        }
        if (!image) {
            showToast('Please select a category image.', 'error');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding...';

        const formData = new FormData(categoryForm);

        try {
            const response = await fetch('/api/admin/categories', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                showToast(data.message || 'Category created successfully!', 'success');
                categoryForm.reset();
                // Reset image preview
                document.getElementById('categoryImagePreview').style.display = 'none';
                document.getElementById('categoryPreviewImg').src = '';
                // Refresh the category table
                loadCategories();
            } else {
                showToast(data.message || 'Failed to create category.', 'error');
            }

        } catch (error) {
            console.error('Category creation error:', error);
            showToast('Network error. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Category';
        }
    });

});

/* ── Toast Notification ─────────────────────────────────────── */
function showToast(message, type = 'success') {
    // Remove any existing toast
    const existing = document.getElementById('admin-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.textContent = message;
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        padding: '14px 22px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#fff',
        background: type === 'success' ? '#10B981' : '#EF4444',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        zIndex: '9999',
        opacity: '0',
        transform: 'translateY(12px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
    });

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });
    });

    // Auto-dismiss after 3s
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}