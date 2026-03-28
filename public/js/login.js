document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("userLoginForm");
    const passwordInput = document.getElementById("password");
    const errorDiv = document.getElementById("loginError");

    /* =========================
       Helper functions
    ========================= */

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.classList.remove("d-none");
    }

    function hideError() {
        errorDiv.textContent = "";
        errorDiv.classList.add("d-none");
    }

    /* =========================
       Password Eye Toggle
    ========================= */

    if (passwordInput) {

        const wrapper = document.createElement("div");
        wrapper.className = "password-wrapper";

        passwordInput.parentNode.insertBefore(wrapper, passwordInput);
        wrapper.appendChild(passwordInput);

        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "eye-toggle";
        toggleBtn.innerHTML = '<i class="bi bi-eye"></i>';

        wrapper.appendChild(toggleBtn);

        toggleBtn.addEventListener("click", () => {

            const isPassword = passwordInput.type === "password";

            passwordInput.type = isPassword ? "text" : "password";

            toggleBtn.innerHTML =
                `<i class="bi bi-eye${isPassword ? "-slash" : ""}"></i>`;
        });
    }

    /* =========================
       Login Form Submit
    ========================= */

    if (loginForm) {

        loginForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            hideError();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();

            /* =========================
               Frontend Validation
            ========================= */

            if (!email) {
                showError("Email is required");
                return;
            }

            if (!email.includes("@")) {
                showError("Enter a valid email address");
                return;
            }

            if (password.length < 8) {
                showError("Password must be at least 8 characters");
                return;
            }

            /* =========================
               Button Loading State
            ========================= */

            const submitBtn = document.getElementById("userLoginBtn");
            const btnText = document.getElementById("userBtnText");
            const spinner = document.getElementById("userBtnSpinner");

            btnText.classList.add("d-none");
            spinner.classList.remove("d-none");
            submitBtn.disabled = true;

            try {

                const res = await fetch("/api/auth/login", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })

                });

                const data = await res.json();

                if (data.success) {

                    // If user was redirected here from a protected page, go back there
                    const params = new URLSearchParams(window.location.search);
                    const redirectTo = params.get("redirect");
                    window.location.href = redirectTo || data.redirect;

                } else {

                    showError(data.message);

                }

            } catch (err) {

                console.error(err);
                showError("Server error. Please try again.");

            }

            /* =========================
               Restore Button
            ========================= */

            btnText.classList.remove("d-none");
            spinner.classList.add("d-none");
            submitBtn.disabled = false;

        });

    }

});