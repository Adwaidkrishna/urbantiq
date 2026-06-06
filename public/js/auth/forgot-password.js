document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("forgotPasswordForm");
    const emailInput = document.getElementById("email");
    const errorDiv = document.getElementById("forgotError");
    const submitBtn = document.getElementById("forgotBtn");
    const btnText = document.getElementById("forgotBtnText");
    const spinner = document.getElementById("forgotBtnSpinner");

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.classList.remove("d-none");
    }

    function hideError() {
        errorDiv.textContent = "";
        errorDiv.classList.add("d-none");
    }

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        hideError();

        const email = emailInput.value.trim();

        /* Frontend validation */

        if (!email) {
            showError("Email is required");
            return;
        }

        if (!email.includes("@")) {
            showError("Enter a valid email");
            return;
        }

        /* Button loading */

        btnText.classList.add("d-none");
        spinner.classList.remove("d-none");
        submitBtn.disabled = true;

        try {

            const res = await fetch("/api/auth/forgot-password", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email
                })

            });

            const data = await res.json();

            if (data.success) {

                window.location.href = data.redirect;

            } else {

                showError(data.message);

            }

        } catch (err) {

            console.error(err);
            showError("Server error. Please try again.");

        }

        /* restore button */

        btnText.classList.remove("d-none");
        spinner.classList.add("d-none");
        submitBtn.disabled = false;

    });

});