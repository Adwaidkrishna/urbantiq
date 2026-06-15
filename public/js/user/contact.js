document.addEventListener("DOMContentLoaded", () => {
    const contactForm = document.querySelector(".contact-form-wrap form");
    if (!contactForm) return;

    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nameInput = document.getElementById("fullName");
        const emailInput = document.getElementById("email");
        const subjectInput = document.getElementById("subject");
        const messageInput = document.getElementById("message");

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const subject = subjectInput.value.trim();
        const message = messageInput.value.trim();

        if (!name || !email || !subject || !message) {
            Swal.fire({
                icon: "error",
                title: "Required Fields",
                text: "All fields are required. Please fill in all fields.",
                confirmButtonColor: "#111827"
            });
            return;
        }

        // Email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Swal.fire({
                icon: "error",
                title: "Invalid Email",
                text: "Please enter a valid email address.",
                confirmButtonColor: "#111827"
            });
            return;
        }

        const submitBtn = contactForm.querySelector("button[type='submit']");
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, email, subject, message })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                Swal.fire({
                    icon: "success",
                    title: "Message Sent",
                    text: data.message || "Your message has been sent successfully!",
                    confirmButtonColor: "#111827"
                });
                contactForm.reset();
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Submission Failed",
                    text: data.message || "Failed to submit message. Please try again.",
                    confirmButtonColor: "#111827"
                });
            }
        } catch (err) {
            console.error("Contact query submit error:", err);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "An error occurred while sending your message. Please try again later.",
                confirmButtonColor: "#111827"
            });
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
});
