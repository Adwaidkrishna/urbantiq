document.addEventListener("DOMContentLoaded", function () {
    // Price slider
    const slider = document.getElementById('priceSlider');
    const display = document.getElementById('priceDisplay');
    if (slider && display) {
        slider.addEventListener('input', () => {
            display.textContent = '₹' + parseInt(slider.value).toLocaleString('en-IN');
        });
    }

    // Color swatch toggle
    document.querySelectorAll('.color-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Size pill toggle
    document.querySelectorAll('.size-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.size-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Mobile filter drawer
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const filterSidebar = document.getElementById('filterSidebar');
    const filterOverlay = document.getElementById('filterOverlay');

    function openFilter() {
        if (filterSidebar) filterSidebar.classList.add('open');
        if (filterOverlay) filterOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeFilter() {
        if (filterSidebar) filterSidebar.classList.remove('open');
        if (filterOverlay) filterOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (filterToggleBtn) filterToggleBtn.addEventListener('click', openFilter);
    if (filterOverlay) filterOverlay.addEventListener('click', closeFilter);

    // Pagination
    document.querySelectorAll('.p-page:not(.p-page-next)').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.p-page').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Wishlist heart toggle
    document.querySelectorAll('.p-action-btn .bi-heart').forEach(icon => {
        icon.parentElement.addEventListener('click', function (e) {
            e.preventDefault();
            const i = this.querySelector('i');
            if (i && i.classList.contains('bi-heart')) {
                i.classList.replace('bi-heart', 'bi-heart-fill');
                this.style.color = '#ef4444';
            } else if (i) {
                i.classList.replace('bi-heart-fill', 'bi-heart');
                this.style.color = '';
            }
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {

    loadFilterCategories();

});

async function loadFilterCategories() {

    try {

        const res = await fetch("/api/categories");
        const data = await res.json();

        const list = document.getElementById("categoryFilterList");

        list.innerHTML = "";

        data.categories.forEach(cat => {

            const li = document.createElement("li");

            li.innerHTML = `
                <label class="filter-check">
                    <input type="checkbox" value="${cat._id}">
                    <span class="checkmark"></span>
                    ${cat.name}
                </label>
            `;

            list.appendChild(li);

        });

    } catch (err) {

        console.error("Category load error:", err);

    }

}