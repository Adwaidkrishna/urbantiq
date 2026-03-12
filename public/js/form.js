document.addEventListener("DOMContentLoaded", function () {

    const otpFields = document.querySelectorAll(".otp-field");
    const form = document.querySelector(".auth-form");
    const otpHidden = document.getElementById("otpValue");
    const emailHidden = document.getElementById("emailHidden");

    /* -----------------------------------------
       1. GET EMAIL FROM URL
       Example: /verify-email?email=user@gmail.com
    ----------------------------------------- */
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");

    if (emailHidden && email) {
        emailHidden.value = email;
    }

    /* -----------------------------------------
       2. OTP INPUT BEHAVIOR
       - Only numbers allowed
       - Auto focus next field
       - Backspace moves to previous field
    ----------------------------------------- */
    otpFields.forEach((field, index) => {

        field.addEventListener("input", function () {

            // allow only numbers
            this.value = this.value.replace(/[^0-9]/g, "");

            // move to next box
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

    /* -----------------------------------------
       3. COMBINE OTP BEFORE SUBMIT
    ----------------------------------------- */
    if (form) {
        form.addEventListener("submit", function () {

            let otp = "";

            otpFields.forEach(field => {
                otp += field.value;
            });

            if (otpHidden) {
                otpHidden.value = otp;
            }

        });
    }

    const resendEmail = document.getElementById("resendEmail");

    if (resendEmail && email) {
        resendEmail.value = email;
    }

    const error = params.get("error");

    const errorBox = document.getElementById("otpError");

    if (errorBox) {
        if (error === "expired") {
            errorBox.textContent = "OTP expired. Please request a new code.";
        } else if (error === "invalid") {
            errorBox.textContent = "Invalid OTP. Please try again.";
        }
    }

});

const params = new URLSearchParams(window.location.search);
const error = params.get("error");

const errorBox = document.getElementById("otpError");

if(errorBox){

 if(error === "invalid"){
  errorBox.textContent = "Invalid OTP. Please try again.";
 }

 if(error === "expired"){
  errorBox.textContent = "OTP expired. Please request a new code.";
 }

}