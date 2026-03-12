// Get category ID from URL  e.g. /api/admin/edit-category/64abc...
const categoryId = window.location.pathname.split("/").pop();

document.addEventListener("DOMContentLoaded", () => {
    loadCategoryDetails();

    document.getElementById("editCategoryForm").addEventListener("submit", handleUpdate);
});

/* ── Load existing category data ─────────────────────────────── */
async function loadCategoryDetails() {
    try {
        const res = await fetch(`/api/admin/categories/${categoryId}`, {
            credentials: "include"
        });

        if (!res.ok) {
            showToast("Failed to load category details.", "error");
            return;
        }

        const data = await res.json();
        const cat = data.category;

        // Fill form fields
        document.getElementById("editName").value        = cat.name || "";
        document.getElementById("editDescription").value = cat.description || "";
        document.getElementById("editStatus").value      = cat.status ? "true" : "false";

        // Show current image
        if (cat.image) {
            document.getElementById("currentCategoryImg").src = `/images/categories/${cat.image}`;
        }

        // Hide loader, show form
        document.getElementById("editFormLoader").style.display = "none";
        document.getElementById("editCategoryForm").style.display = "";

    } catch (err) {
        console.error("Error loading category:", err);
        showToast("Network error loading category.", "error");
    }
}

/* ── Handle form submit ───────────────────────────────────────── */
async function handleUpdate(e) {
    e.preventDefault();

    const submitBtn = document.getElementById("editSubmitBtn");
    const name      = document.getElementById("editName").value.trim();

    if (!name) {
        showToast("Category name is required.", "error");
        return;
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = "Saving...";

    const formData = new FormData(document.getElementById("editCategoryForm"));

    try {
        const res = await fetch(`/api/admin/categories/${categoryId}`, {
            method:      "PUT",
            credentials: "include",
            body:        formData
        });

        const data = await res.json();

        if (res.ok) {
            showToast(data.message || "Category updated successfully!", "success");

            // Update the current image preview if a new image was uploaded
            if (data.category?.image) {
                document.getElementById("currentCategoryImg").src =
                    `/images/categories/${data.category.image}`;
                // Reset the new image file input and hide preview
                document.getElementById("editImage").value = "";
                document.getElementById("newImagePreview").style.display = "none";
            }

        } else {
            showToast(data.message || "Failed to update category.", "error");
        }

    } catch (err) {
        console.error("Update error:", err);
        showToast("Network error. Please try again.", "error");
    } finally {
        submitBtn.disabled    = false;
        submitBtn.textContent = "Save Changes";
    }
}

/* ── New image preview ────────────────────────────────────────── */
function previewNewImage(event) {
    const file       = event.target.files[0];
    const previewBox = document.getElementById("newImagePreview");
    const previewImg = document.getElementById("newPreviewImg");

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src              = e.target.result;
            previewBox.style.display    = "block";
        };
        reader.readAsDataURL(file);
    } else {
        previewBox.style.display = "none";
        previewImg.src           = "";
    }
}

/* ── Toast Notification ───────────────────────────────────────── */
function showToast(message, type = "success") {
    const existing = document.getElementById("admin-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id    = "admin-toast";
    toast.textContent = message;

    Object.assign(toast.style, {
        position:     "fixed",
        bottom:       "28px",
        right:        "28px",
        padding:      "14px 22px",
        borderRadius: "10px",
        fontSize:     "14px",
        fontWeight:   "500",
        color:        "#fff",
        background:   type === "success" ? "#10B981" : "#EF4444",
        boxShadow:    "0 8px 24px rgba(0,0,0,0.18)",
        zIndex:       "9999",
        opacity:      "0",
        transform:    "translateY(12px)",
        transition:   "opacity 0.25s ease, transform 0.25s ease",
    });

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.opacity   = "1";
            toast.style.transform = "translateY(0)";
        });
    });

    setTimeout(() => {
        toast.style.opacity   = "0";
        toast.style.transform = "translateY(12px)";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
