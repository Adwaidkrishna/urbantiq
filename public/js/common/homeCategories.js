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

    } catch (error) {

        console.error("Error loading categories:", error);

    }

}