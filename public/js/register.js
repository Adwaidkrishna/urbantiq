/* public/js/register.js
   URBANTIQ · Auth & Form Behaviors
   ------------------------------------------ */

document.addEventListener('DOMContentLoaded', () => {

    // ─── UTILITIES ───────────────────────────────────────────────

    /**
     * Toggles password visibility for a specific input field
     */
    const setupEyeToggle = (buttonId, inputId) => {
        const btn = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        if (!btn || !input) return;

        btn.addEventListener('click', () => {
            const icon = btn.querySelector('i');
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            icon.classList.toggle('bi-eye', !isPassword);
            icon.classList.toggle('bi-eye-slash', isPassword);
        });
    };

    /**
     * Validation Rules Helper
     */
    const checkRules = (value) => {
        return {
            'rule-8char': value.length >= 8,
            'rule-upper': /[A-Z]/.test(value),
            'rule-lower': /[a-z]/.test(value),
            'rule-number': /[0-9]/.test(value),
            'rule-special': /[^A-Za-z0-9]/.test(value)
        };
    };

    /**
     * Updates UI based on satisfied rules
     */
    const updateValidationUI = (rulesRes) => {
        let metCount = 0;
        for (const [id, met] of Object.entries(rulesRes)) {
            const el = document.getElementById(id);
            if (el) {
                el.classList.toggle('valid', met);
                if (met) metCount++;
            }
        }

        const fill = document.getElementById('strengthFill');
        const label = document.getElementById('strengthLabel');

        if (fill && label) {
            let width = '0%';
            let colorClass = '';
            let text = '';

            if (metCount > 0) {
                if (metCount <= 2) {
                    width = '33%';
                    colorClass = 'strength-weak';
                    text = 'Weak';
                } else if (metCount <= 4) {
                    width = '66%';
                    colorClass = 'strength-medium';
                    text = 'Medium';
                } else {
                    width = '100%';
                    colorClass = 'strength-strong';
                    text = 'Strong';
                }
            }

            fill.className = 'strength-bar-fill ' + colorClass;
            fill.style.width = width;
            label.textContent = text;
            label.style.color = metCount === 0 ? '' : window.getComputedStyle(fill).backgroundColor;
        }

        return metCount === 5;
    };

    // ─── INITIALIZATION ───────────────────────────────────────────

    const regForm = document.getElementById('registerForm');
    const resetForm = document.getElementById('resetPasswordForm');
    const currentForm = regForm || resetForm;

    if (currentForm) {
        const passwordInput = document.getElementById('password') || document.getElementById('newPassword');
        const confirmInput = document.getElementById('confirmPassword');
        const submitBtn = document.getElementById('submitBtn');
        const validationContainer = document.getElementById('validationContainer');
        const confirmHint = document.getElementById('confirmHint');

        // Eye Toggles
        setupEyeToggle('togglePassword', 'password');
        setupEyeToggle('toggleNewPassword', 'newPassword');
        setupEyeToggle('toggleConfirmPassword', 'confirmPassword');

        // Show validation on focus
        if (passwordInput) {
            passwordInput.addEventListener('focus', () => {
                if (validationContainer) validationContainer.classList.add('visible');
                const strengthMeter = document.querySelector('.strength-meter');
                if (strengthMeter) strengthMeter.classList.add('visible');
            });
        }

        const validateFormState = () => {
            const passVal = passwordInput ? passwordInput.value : '';
            const confVal = confirmInput ? confirmInput.value : '';

            // Rules
            const rulesRes = checkRules(passVal);
            const allRulesMet = updateValidationUI(rulesRes);

            // Match check
            const matches = passVal && passVal === confVal;
            if (confirmHint && confVal) {
                confirmHint.classList.add('visible');
                if (matches) {
                    confirmHint.textContent = 'Passwords match ✔';
                    confirmHint.className = 'validation-hint visible success';
                } else {
                    confirmHint.textContent = 'Passwords do not match ✖';
                    confirmHint.className = 'validation-hint visible error';
                }
            } else if (confirmHint) {
                confirmHint.classList.remove('visible');
            }

            // Global buttons state
            let formValid = allRulesMet && matches;

            // For Register specifically, check name and email
            if (regForm) {
                const name = document.getElementById('name').value.trim();
                const email = document.getElementById('email').value.trim();
                if (!name || !email.includes('@')) formValid = false;
            }

            if (submitBtn) submitBtn.disabled = !formValid;

            return formValid;
        };

        // Listeners
        const inputs = [passwordInput, confirmInput];
        if (regForm) {
            inputs.push(document.getElementById('name'), document.getElementById('email'));
        }

        inputs.forEach(inp => {
            if (inp) inp.addEventListener('input', validateFormState);
        });

        // Submit Behavior
        currentForm.addEventListener('submit', async (e) => {
            if (!validateFormState()) {
                e.preventDefault();
                return;
            }

            // If it's the reset form, we just handle the redirect for now (as requested)
            if (resetForm) {
                e.preventDefault();
                submitBtn.disabled = true;
                submitBtn.textContent = 'Updating...';
                setTimeout(() => window.location.href = 'login.html', 1000);
                return;
            }

            // Register form logic
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = passwordInput.value;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending otp';

            try {
                const response = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();

                if (data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Create Account';
                    const errorBox = document.getElementById("registerError");

                    errorBox.textContent = data.message;

                    errorBox.classList.remove("d-none");
                }
            } catch (err) {
                console.error("Error:", err);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
            }
        });
    }
});