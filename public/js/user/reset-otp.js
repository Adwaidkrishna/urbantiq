document.addEventListener("DOMContentLoaded", () => {

    const otpFields = document.querySelectorAll(".otp-field");
    const form = document.getElementById("otpForm");
    const errorDiv = document.getElementById("otpError");

    /* OTP auto move */

    otpFields.forEach((field, index) => {

        field.addEventListener("input", (e) => {

            if (e.target.value.length === 1 && index < otpFields.length - 1) {
                otpFields[index + 1].focus();
            }

        });

        field.addEventListener("keydown", (e) => {

            if (e.key === "Backspace" && !field.value && index > 0) {
                otpFields[index - 1].focus();
            }

        });

    });

    /* Submit OTP */

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        let otp = "";

        otpFields.forEach(input => {
            otp += input.value;
        });

        if (otp.length !== 6) {

            errorDiv.textContent = "Enter complete OTP";
            errorDiv.classList.remove("d-none");
            return;

        }

        /* Get email from URL */

        const email = new URLSearchParams(window.location.search).get("email");

        try {

            const res = await fetch("/api/auth/verify-reset-otp", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    otp
                })

            });

            const data = await res.json();

            if (data.success) {

                window.location.href = data.redirect;

            } else {

                errorDiv.textContent = data.message;
                errorDiv.classList.remove("d-none");

            }

        } catch (err) {

            errorDiv.textContent = "Server error";
            errorDiv.classList.remove("d-none");

        }

    });

});