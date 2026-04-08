/* public/js/reset-password.js
   URBANTIQ · Reset Password Logic
*/

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("resetPasswordForm");

    const passwordInput = document.getElementById("newPassword");
    const confirmInput = document.getElementById("confirmPassword");

    const submitBtn = document.getElementById("submitBtn");

    const confirmHint = document.getElementById("confirmHint");

    const validationContainer = document.getElementById("validationContainer");

    const errorBox = document.getElementById("resetError");


    /* ─── Eye Toggle ───────────────────────── */

    const setupEyeToggle = (buttonId, inputId) => {

        const btn = document.getElementById(buttonId);
        const input = document.getElementById(inputId);

        if (!btn || !input) return;

        btn.addEventListener("click", () => {

            const icon = btn.querySelector("i");

            const isPassword = input.type === "password";

            input.type = isPassword ? "text" : "password";

            icon.classList.toggle("bi-eye", !isPassword);
            icon.classList.toggle("bi-eye-slash", isPassword);

        });

    };

    setupEyeToggle("toggleNewPassword", "newPassword");
    setupEyeToggle("toggleConfirmPassword", "confirmPassword");


    /* ─── Password Rules ───────────────────── */

    const checkRules = (value) => {

        return {

            "rule-8char": value.length >= 8,
            "rule-upper": /[A-Z]/.test(value),
            "rule-lower": /[a-z]/.test(value),
            "rule-number": /[0-9]/.test(value),
            "rule-special": /[^A-Za-z0-9]/.test(value)

        };

    };


    /* ─── Update Validation UI ─────────────── */

    const updateValidationUI = (rulesRes) => {

        let metCount = 0;

        for (const [id, met] of Object.entries(rulesRes)) {

            const el = document.getElementById(id);

            if (el) {

                el.classList.toggle("valid", met);

                if (met) metCount++;

            }

        }

        const fill = document.getElementById("strengthFill");
        const label = document.getElementById("strengthLabel");

        if (fill && label) {

            let width = "0%";
            let colorClass = "";
            let text = "";

            if (metCount > 0) {

                if (metCount <= 2) {

                    width = "33%";
                    colorClass = "strength-weak";
                    text = "Weak";

                }

                else if (metCount <= 4) {

                    width = "66%";
                    colorClass = "strength-medium";
                    text = "Medium";

                }

                else {

                    width = "100%";
                    colorClass = "strength-strong";
                    text = "Strong";

                }

            }

            fill.className = "strength-bar-fill " + colorClass;

            fill.style.width = width;

            label.textContent = text;

        }

        return metCount === 5;

    };


    /* ─── Validate Form State ─────────────── */

    const validateForm = () => {

        const passVal = passwordInput.value;

        const confVal = confirmInput.value;

        const rulesRes = checkRules(passVal);

        const rulesOk = updateValidationUI(rulesRes);

        const matches = passVal && passVal === confVal;

        if (confirmHint && confVal) {

            confirmHint.classList.add("visible");

            if (matches) {

                confirmHint.textContent = "Passwords match ✔";
                confirmHint.className = "validation-hint visible success";

            }

            else {

                confirmHint.textContent = "Passwords do not match ✖";
                confirmHint.className = "validation-hint visible error";

            }

        }

        else if (confirmHint) {

            confirmHint.classList.remove("visible");

        }

        submitBtn.disabled = !(rulesOk && matches);

        return rulesOk && matches;

    };


    /* ─── Input Listeners ─────────────────── */

    passwordInput.addEventListener("focus", () => {

        if (validationContainer)
            validationContainer.classList.add("visible");

    });

    passwordInput.addEventListener("input", validateForm);

    confirmInput.addEventListener("input", validateForm);


    /* ─── Submit Reset Password ───────────── */

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        if (!validateForm()) return;

        submitBtn.disabled = true;

        submitBtn.textContent = "Updating...";

        const email = new URLSearchParams(window.location.search).get("email");

        try {

            const res = await fetch("/api/auth/reset-password", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password: passwordInput.value,
                    confirmPassword: confirmInput.value
                })

            });

            const data = await res.json();

            if (data.success) {

                window.location.href = data.redirect;

            }

            else {

                errorBox.textContent = data.message;

                errorBox.classList.remove("d-none");

                submitBtn.disabled = false;

                submitBtn.textContent = "Update Password";

            }

        }

        catch (err) {

            console.error(err);

            errorBox.textContent = "Server error";

            errorBox.classList.remove("d-none");

            submitBtn.disabled = false;

            submitBtn.textContent = "Update Password";

        }

    });

});