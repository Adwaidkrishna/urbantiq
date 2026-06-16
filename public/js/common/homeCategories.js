document.addEventListener("DOMContentLoaded", loadHomeCategories);

async function loadHomeCategories() {

    try {

        const res = await fetch("/api/categories");
        const data = await res.json();

        const container = document.getElementById("homeCategories");

        container.innerHTML = "";

        data.categories.forEach(cat => {

            const col = document.createElement("div");
            col.className = "col-6 col-md-4 col-lg-2";

            col.innerHTML = `
                <a href="/product?category=${cat._id}" class="category-card">
                    <img src="/images/categories/${cat.image}" alt="${cat.name}">
                    <div class="category-overlay">
                        <h3>${cat.name}</h3>
                    </div>
                </a>
            `;

            container.appendChild(col);

        });

        // 1. Create and append the mobile-only View All card
        const viewAllCol = document.createElement("div");
        viewAllCol.className = "col-6 col-md-4 col-lg-2 d-flex d-md-none";
        viewAllCol.innerHTML = `
            <a href="/product" class="category-card view-all-card">
                <div class="view-all-content">
                    <div class="view-all-icon">
                        <i class="bi bi-arrow-right"></i>
                    </div>
                    <span>View All</span>
                </div>
            </a>
        `;
        container.appendChild(viewAllCol);

        // 2. Create and append the Safari-specific scroll-padding anchor spacer
        const spacer = document.createElement("div");
        spacer.className = "rail-spacer d-block d-md-none";
        container.appendChild(spacer);

    } catch (error) {

        console.error("Error loading categories:", error);

    }

}
