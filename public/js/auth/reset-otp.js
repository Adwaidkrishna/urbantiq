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

                // Save token in sessionStorage
                sessionStorage.setItem("passwordResetToken", data.resetToken);

                // Redirect to reset password page
                window.location.href = `${data.redirect}?email=${encodeURIComponent(email)}`;

            } else {

                errorDiv.textContent = data.message;
                errorDiv.classList.remove("d-none");

            }

        } catch (err) {

            errorDiv.textContent = "Server error";
            errorDiv.classList.remove("d-none");

        }

    });

    /* ---------------- RESEND COOLDOWN TIMER ---------------- */

    const resendBtn = document.getElementById("resendBtn");
    const infoBox = document.getElementById("otpInfo");
    const COOLDOWN_KEY = "forgotResendCooldownEnd";
    let cooldownInterval = null;

    function startCooldown(seconds) {
        const endTime = Date.now() + (seconds * 1000);
        localStorage.setItem(COOLDOWN_KEY, endTime.toString());

        if (resendBtn) {
            resendBtn.style.pointerEvents = "none";
            resendBtn.style.opacity = "0.6";
        }

        // Clear any existing interval
        if (cooldownInterval) clearInterval(cooldownInterval);

        cooldownInterval = setInterval(() => {
            const remaining = Math.ceil((endTime - Date.now()) / 1000);

            if (remaining <= 0) {
                clearInterval(cooldownInterval);
                cooldownInterval = null;
                localStorage.removeItem(COOLDOWN_KEY);
                if (resendBtn) {
                    resendBtn.style.pointerEvents = "auto";
                    resendBtn.style.opacity = "1";
                    resendBtn.textContent = "Resend Code";
                }
            } else {
                const mins = String(Math.floor(remaining / 60)).padStart(2, "0");
                const secs = String(remaining % 60).padStart(2, "0");
                if (resendBtn) {
                    resendBtn.textContent = `Resend OTP in ${mins}:${secs}`;
                }
            }
        }, 1000);
    }

    // Restore cooldown on page load
    (function restoreCooldown() {
        const savedEnd = localStorage.getItem(COOLDOWN_KEY);
        if (savedEnd) {
            const remaining = Math.ceil((parseInt(savedEnd, 10) - Date.now()) / 1000);
            if (remaining > 0) {
                startCooldown(remaining);
            } else {
                localStorage.removeItem(COOLDOWN_KEY);
            }
        }
    })();

    /* ---------------- RESEND BUTTON CLICK ---------------- */

    if (resendBtn) {

        resendBtn.addEventListener("click", async function (e) {

            e.preventDefault();

            const email = new URLSearchParams(window.location.search).get("email");

            if (!email) {
                errorDiv.textContent = "Email address is missing.";
                errorDiv.classList.remove("d-none");
                return;
            }

            try {

                const res = await fetch("/api/auth/forgot-password/resend", {

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
                        infoBox.textContent = data.message || "OTP sent successfully.";
                        infoBox.classList.remove("d-none");
                    }
                    errorDiv.classList.add("d-none");

                    // Start cooldown timer
                    startCooldown(data.remainingTime || 60);

                } else if (res.status === 429) {

                    // Rate limited — use server's remaining time
                    errorDiv.textContent = data.message;
                    errorDiv.classList.remove("d-none");

                    startCooldown(data.remainingTime || 60);

                } else {

                    errorDiv.textContent = data.message;
                    errorDiv.classList.remove("d-none");

                }

            } catch (err) {

                console.error(err);
                errorDiv.textContent = "Failed to resend OTP";
                errorDiv.classList.remove("d-none");

            }

        });

    }

});