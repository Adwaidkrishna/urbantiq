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
            const profileRes = await fetch("/api/user-profile");
            const profileData = await profileRes.json();
            
            if (profileData.user) {
                const user = profileData.user;
                document.querySelectorAll(".profile-name").forEach(el => el.textContent = user.name);
                document.querySelectorAll(".profile-email").forEach(el => el.textContent = user.email);
                
                // Set Dynamic Profile Avatar
                const avatarImg = document.getElementById("profileAvatarImg");
                if (avatarImg && user.name) {
                    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&size=256&bold=true&font-size=0.4`;
                    avatarImg.src = avatarUrl;
                    avatarImg.onload = () => avatarImg.style.opacity = '1';
                }
                
                // Update Personal Info rows
                const nameValue = document.querySelector(".ac-row:nth-child(1) .ac-row-value");
                if (nameValue) nameValue.textContent = user.name;
                
                const emailValue = document.querySelector(".ac-row:nth-child(3) .ac-row-value");
                if (emailValue) emailValue.textContent = user.email;

                const phoneValue = document.querySelector(".ac-row:nth-child(5) .ac-row-value");
                if (phoneValue) phoneValue.textContent = user.phone || "Not set";

                // Populate Inputs
                const inputName = document.getElementById("inputName");
                if (inputName) inputName.value = user.name;

                const inputEmail = document.getElementById("inputEmail");
                if (inputEmail) inputEmail.value = user.email;

                const inputPhone = document.getElementById("inputPhone");
                if (inputPhone) inputPhone.value = user.phone || "";
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

    // Update Name
    const btnSaveName = document.getElementById("btnSaveName");
    if (btnSaveName) {
        btnSaveName.addEventListener("click", async () => {
            const newName = document.getElementById("inputName").value.trim();
            if (!newName) return showAlert("Please enter a valid name");

            try {
                btnSaveName.textContent = "Saving...";
                const res = await fetch("/api/user-profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: newName })
                });
                const data = await res.json();
                if (data.success) {
                    showAlert("Name updated successfully", "success");
                    fetchProfileData();
                    toggleOption('nameExpand');
                } else {
                    showAlert(data.message || "Failed to update name");
                }
            } catch (err) {
                showAlert("Server error");
            } finally {
                btnSaveName.textContent = "Save";
            }
        });
    }

    // Update Phone
    const btnSavePhone = document.getElementById("btnSavePhone");
    if (btnSavePhone) {
        btnSavePhone.addEventListener("click", async () => {
            const newPhone = document.getElementById("inputPhone").value.trim();
            if (!newPhone) return showAlert("Please enter a valid phone number");

            try {
                btnSavePhone.textContent = "Saving...";
                const res = await fetch("/api/user-profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phone: newPhone })
                });
                const data = await res.json();
                if (data.success) {
                    showAlert("Phone updated successfully", "success");
                    fetchProfileData();
                    toggleOption('phoneExpand');
                } else {
                    showAlert(data.message || "Failed to update phone");
                }
            } catch (err) {
                showAlert("Server error");
            } finally {
                btnSavePhone.textContent = "Save";
            }
        });
    }

    // Password Visibility Toggles
    const setupEyeToggle = (buttonId, inputId) => {
        const btn = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        if (!btn || !input) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Don't trigger the ac-row click
            const icon = btn.querySelector('i');
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            icon.classList.toggle('bi-eye', !isPassword);
            icon.classList.toggle('bi-eye-slash', isPassword);
        });
    };

    setupEyeToggle('toggleCurrentPass', 'currentPass');
    setupEyeToggle('toggleNewPass', 'newPass');
    setupEyeToggle('toggleConfirmPass', 'confirmPass');

    // iOS Real-time Validation Feedback
    const currentPass = document.getElementById("currentPass");
    const newPass = document.getElementById("newPass");
    const confirmPass = document.getElementById("confirmPass");
    const btnSavePass = document.getElementById("btnSavePass");
    
    // Feedback spans
    const fbCurrent = document.getElementById("feedbackCurrentPass");
    const fbNew = document.getElementById("feedbackNewPass");
    const fbConfirm = document.getElementById("feedbackConfirmPass");

    const validatePassForm = () => {
        let isValid = true;
        
        // Has current password?
        if (!currentPass.value) {
            isValid = false;
            currentPass.classList.remove('is-valid');
        } else {
            currentPass.classList.add('is-valid');
            currentPass.classList.remove('is-invalid');
        }

        // New password rules (same as register)
        if (newPass.value.length > 0) {
            let p = newPass.value;
            let missing = [];
            
            if (p.length < 8) missing.push("8+ chars");
            if (!/[A-Z]/.test(p)) missing.push("uppercase");
            if (!/[a-z]/.test(p)) missing.push("lowercase");
            if (!/[0-9]/.test(p)) missing.push("number");
            if (!/[^A-Za-z0-9]/.test(p)) missing.push("symbol");

            if (missing.length > 0) {
                fbNew.textContent = "Requires: " + missing.join(", ");
                fbNew.className = "ac-ios-feedback error visible";
                newPass.classList.add('is-invalid');
                newPass.classList.remove('is-valid');
                isValid = false;
            } else {
                fbNew.textContent = "Strong password.";
                fbNew.className = "ac-ios-feedback success visible";
                newPass.classList.remove('is-invalid');
                newPass.classList.add('is-valid');
            }
        } else {
            fbNew.className = "ac-ios-feedback";
            newPass.classList.remove('is-invalid', 'is-valid');
            isValid = false;
        }

        // Confirm Password Match
        if (confirmPass.value.length > 0) {
            if (confirmPass.value !== newPass.value) {
                fbConfirm.textContent = "Passwords do not match.";
                fbConfirm.className = "ac-ios-feedback error visible";
                confirmPass.classList.add('is-invalid');
                confirmPass.classList.remove('is-valid');
                isValid = false;
            } else if (newPass.value.length >= 8) {
                fbConfirm.textContent = "Passwords match.";
                fbConfirm.className = "ac-ios-feedback success visible";
                confirmPass.classList.remove('is-invalid');
                confirmPass.classList.add('is-valid');
            }
        } else {
            fbConfirm.className = "ac-ios-feedback";
            confirmPass.classList.remove('is-invalid', 'is-valid');
            isValid = false;
        }

        btnSavePass.disabled = !isValid;
    };

    if (currentPass) currentPass.addEventListener("input", validatePassForm);
    if (newPass) newPass.addEventListener("input", validatePassForm);
    if (confirmPass) confirmPass.addEventListener("input", validatePassForm);

    // Update Password Action
    if (btnSavePass) {
        btnSavePass.addEventListener("click", async () => {
            const currentPass = document.getElementById("currentPass").value;
            const newPass = document.getElementById("newPass").value;

            try {
                btnSavePass.textContent = "Updating...";
                btnSavePass.disabled = true;
                const res = await fetch("/api/user-profile/change-password", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
                });
                const data = await res.json();
                if (data.success) {
                    showAlert("Password updated successfully", "success");
                    document.getElementById("currentPass").value = "";
                    document.getElementById("newPass").value = "";
                    document.getElementById("confirmPass").value = "";
                    validatePassForm();
                    toggleOption('passExpand');
                } else {
                    showAlert(data.message || "Failed to update password");
                    btnSavePass.disabled = false;
                }
            } catch (err) {
                showAlert("Server error");
                btnSavePass.disabled = false;
            } finally {
                btnSavePass.textContent = "Update Password";
            }
        });
    }

    function showAlert(msg, type = "error") {
        if (window.AuthGuard && window.AuthGuard.showToast) {
            window.AuthGuard.showToast(msg, type);
        } else {
            alert(msg);
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
