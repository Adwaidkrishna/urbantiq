(function () {
    const profileForm = document.querySelector('form:first-of-type');
    const securityForm = document.querySelector('form:last-of-type');

    if (profileForm) {
        profileForm.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('Profile update submitted');
            alert('Profile updated successfully (Simulation)');
        });
    }

    if (securityForm) {
        securityForm.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('Security update submitted');
            alert('Security settings updated successfully (Simulation)');
        });
    }

    const changeAvatarBtn = document.querySelector('.btn-admin-outline.btn-admin-sm');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', function () {
            console.log('Change avatar clicked');
            alert('Avatar change functionality not implemented yet');
        });
    }
})();
