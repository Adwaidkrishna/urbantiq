document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("adminLoginForm");

    const emailInput = document.getElementById("adminEmail");
    const passwordInput = document.getElementById("adminPassword");

    const btnText = document.getElementById("btnText");
    const spinner = document.getElementById("btnSpinner");


    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        btnText.textContent = "Logging in...";
        spinner.classList.remove("d-none");

        try {

            const response = await fetch("/api/admin/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })

            });

            const data = await response.json();

            if (response.ok) {

                window.location.href = "/api/admin/dashboard";

            } else {

                alert(data.message || "Login failed");

            }

        } catch (error) {

            alert("Server error");

        } finally {

            btnText.textContent = "Login to Dashboard";
            spinner.classList.add("d-none");

        }

    });

});