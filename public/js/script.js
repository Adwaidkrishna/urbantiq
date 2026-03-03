/* public/js/script.js
   Shared interactive behaviours for URBANTIQ
   ------------------------------------------ */

document.addEventListener('DOMContentLoaded', () => {

    /* --------------------------------------------------
       1. WISHLIST BUTTON TOGGLE
       -------------------------------------------------- */
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.toggle('active');
            const icon = this.querySelector('i');
            if (this.classList.contains('active')) {
                this.style.color = '#ff3b30';
                this.style.background = 'white';
                if (icon) {
                    icon.classList.replace('bi-heart', 'bi-heart-fill');
                }
            } else {
                this.style.color = '';
                this.style.background = '';
                if (icon) {
                    icon.classList.replace('bi-heart-fill', 'bi-heart');
                }
            }
        });
    });

    /* --------------------------------------------------
       2. CART BUTTON FEEDBACK
       -------------------------------------------------- */
    document.querySelectorAll('.cart-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.replace('bi-cart3', 'bi-cart-check-fill');
                setTimeout(() => {
                    icon.classList.replace('bi-cart-check-fill', 'bi-cart3');
                }, 1000);
            }
        });
    });

    /* --------------------------------------------------
       3. ACCOUNT SIDEBAR TOGGLE (Mobile Drawer)
          Targets .sidebar-mobile-toggle, .account-sidebar,
          and .sidebar-overlay on account-* pages.
       -------------------------------------------------- */
    const sidebarToggle = document.querySelector('.sidebar-mobile-toggle');
    const sidebar = document.querySelector('.account-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (sidebarToggle && sidebar && overlay) {
        const openSidebar = () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closeSidebar = () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        };

        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.contains('active') ? closeSidebar() : openSidebar();
        });

        // Close when overlay is tapped
        overlay.addEventListener('click', closeSidebar);

        // Close on Escape key
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                closeSidebar();
            }
        });

        // Close sidebar automatically when viewport widens to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024) closeSidebar();
        });
    }

    /* --------------------------------------------------
       4. GLOBAL NAVBAR COLLAPSE (Mobile Menu)
          Only used on non-account pages where the
          .navbar-toggler opens the main nav links.
       -------------------------------------------------- */
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');

    if (navbarToggler && navbarCollapse) {
        navbarToggler.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = navbarCollapse.classList.contains('show');
            navbarCollapse.classList.toggle('show', !isOpen);
            document.documentElement.classList.toggle('nav-open', !isOpen);
        });

        // Close navbar when clicking outside
        document.addEventListener('click', e => {
            if (
                navbarCollapse.classList.contains('show') &&
                !navbarCollapse.contains(e.target) &&
                !navbarToggler.contains(e.target)
            ) {
                navbarCollapse.classList.remove('show');
                document.documentElement.classList.remove('nav-open');
            }
        });
    }

});
