document.addEventListener("DOMContentLoaded", function () {
    const otpFields = document.querySelectorAll('.otp-field');

    // OTP auto-advance on input
    otpFields.forEach((field, index) => {
        field.addEventListener('input', function () {
            if (this.value.length >= 1) {
                if (index + 1 < otpFields.length) {
                    otpFields[index + 1].focus();
                }
            }
        });

        // Handle backspace — go to previous field
        field.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && field.value === '') {
                if (index > 0) {
                    otpFields[index - 1].focus();
                }
            }
        });
    });
});

