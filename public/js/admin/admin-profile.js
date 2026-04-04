// Custom Toast Notification
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.textContent = message;
    
    Object.assign(toast.style, {
        position: 'fixed',
        top: '30px',
        right: '30px',
        background: type === 'success' ? '#10b981' : '#ef4444',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        zIndex: '10000',
        fontSize: '0.875rem',
        fontWeight: '600',
        transform: 'translateX(150%)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    });

    document.body.appendChild(toast);
    
    // Trigger slide-in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
    });

    // Auto-remove
    setTimeout(() => {
        toast.style.transform = 'translateX(150%)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

(function () {
    const profileForm = document.getElementById('adminProfileForm');
    const securityForm = document.getElementById('adminSecurityForm');

    // Fetch initial profile data
    async function loadAdminProfile() {
        try {
            const res = await fetch("/api/admin/profile");
            const data = await res.json();
            
            if (data.success && data.admin) {
                document.getElementById('adminFirstName').value = data.admin.firstName || "";
                document.getElementById('adminLastName').value = data.admin.lastName || "";
                document.getElementById('adminEmail').value = data.admin.email || "";
                document.getElementById('adminPhone').value = data.admin.phone || "";

                document.querySelectorAll('.sidebar-user-name, .topbar-user-name').forEach(el => {
                    el.textContent = `${data.admin.firstName || 'Admin'} ${data.admin.lastName || ''}`.trim() || 'Admin';
                });
            }
        } catch (err) {
            console.error("Failed to load admin profile data");
        }
    }

    loadAdminProfile();

    if (profileForm) {
        profileForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const btn = document.getElementById('btnUpdateProfile');
            const originalText = btn.textContent;
            
            const payload = {
                firstName: document.getElementById('adminFirstName').value.trim(),
                lastName: document.getElementById('adminLastName').value.trim(),
                email: document.getElementById('adminEmail').value.trim(),
                phone: document.getElementById('adminPhone').value.trim()
            };

            try {
                btn.textContent = "Updating...";
                btn.disabled = true;
                
                const res = await fetch("/api/admin/profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                
                if (data.success) {
                    showToast("Profile updated successfully!", "success");
                    loadAdminProfile();
                } else {
                    showToast(data.message || "Failed to update profile", "error");
                }
            } catch (err) {
                showToast("Server error occurred", "error");
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    if (securityForm) {
        securityForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            
            const btn = document.getElementById('btnUpdatePassword');
            const currentPass = document.getElementById('currentPassword').value;
            const newPass = document.getElementById('newPassword').value;
            const confirmPass = document.getElementById('confirmPassword').value;

            if (!currentPass || !newPass || !confirmPass) {
                return showToast("Please fill all password fields.", "error");
            }

            if (newPass !== confirmPass) {
                return showToast("New passwords do not match.", "error");
            }
            
            if (newPass.length < 6) {
                return showToast("New password must be at least 6 characters.", "error");
            }

            try {
                btn.textContent = "Changing...";
                btn.disabled = true;
                
                const res = await fetch("/api/admin/profile/change-password", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
                });
                
                const data = await res.json();
                
                if (data.success) {
                    showToast("Security settings updated successfully!", "success");
                    document.getElementById('currentPassword').value = "";
                    document.getElementById('newPassword').value = "";
                    document.getElementById('confirmPassword').value = "";
                } else {
                    showToast(data.message || "Failed to change password", "error");
                }
            } catch (err) {
                showToast("Server error occurred", "error");
            } finally {
                btn.textContent = "Change Password";
                btn.disabled = false;
            }
        });
    }
})();
