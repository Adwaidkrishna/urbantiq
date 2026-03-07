document.addEventListener("DOMContentLoaded", function () {

    const otpFields = document.querySelectorAll(".otp-field");
    const form = document.getElementById("otpForm");
    const emailInput = document.getElementById("emailInput");

    const errorBox = document.getElementById("otpError");
    const successBox = document.getElementById("otpSuccess");

    const resendBtn = document.getElementById("resendBtn");
    const infoBox = document.getElementById("otpInfo");


    /* ---------------- GET EMAIL FROM URL ---------------- */

    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");

    if (emailInput) {
        emailInput.value = email;
    }

    /* ---------------- OTP INPUT LOGIC ---------------- */

    otpFields.forEach((field, index) => {

        field.addEventListener("input", function () {

            // allow only numbers
            this.value = this.value.replace(/[^0-9]/g, "");

            // hide previous error when typing
            if (errorBox) errorBox.classList.add("d-none");

            if (this.value.length === 1 && index < otpFields.length - 1) {
                otpFields[index + 1].focus();
            }

        });

        field.addEventListener("keydown", function (e) {

            if (e.key === "Backspace" && this.value === "" && index > 0) {
                otpFields[index - 1].focus();
            }

        });

    });


    /* ---------------- FORM SUBMIT ---------------- */

    form.addEventListener("submit", async function (e) {

        e.preventDefault();

        let otp = "";

        otpFields.forEach(field => {
            otp += field.value;
        });

        try {

            const response = await fetch("/api/auth/verify-otp", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    otp: otp
                })

            });

            const data = await response.json();


            /* -------- SUCCESS -------- */

            if (data.success) {

                if (successBox) {

                    successBox.textContent =
                        data.message || "Email verified successfully! Redirecting to login...";

                    successBox.classList.remove("d-none");

                }

                // disable form interaction
                form.style.pointerEvents = "none";

                // redirect after 2 seconds
                setTimeout(() => {

                    window.location.href = data.redirect;

                }, 1000);

            }


            /* -------- ERROR -------- */

            else {

                if (errorBox) {

                    errorBox.textContent = data.message || "Invalid OTP";

                    errorBox.classList.remove("d-none");

                }

            }

        }

        catch (error) {

            console.error("OTP verification error:", error);

            if (errorBox) {

                errorBox.textContent = "Server error. Please try again.";

                errorBox.classList.remove("d-none");

            }

        }

    });

    if (resendBtn) {

        resendBtn.addEventListener("click", async function (e) {

            e.preventDefault();

            try {

                const res = await fetch("/api/auth/resend-otp", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: email
                    })

                });

                const data = await res.json();

                if (data.success) {

                    if (infoBox) {
                        infoBox.textContent = data.message || "OTP resent successfully";
                        infoBox.classList.remove("d-none");
                    }

                } else {

                    if (errorBox) {
                        errorBox.textContent = data.message;
                        errorBox.classList.remove("d-none");
                    }

                }

            } catch (err) {

                console.error(err);

                if (errorBox) {
                    errorBox.textContent = "Failed to resend OTP";
                    errorBox.classList.remove("d-none");
                }

            }

        });

    }

});