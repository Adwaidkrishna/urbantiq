document.addEventListener("DOMContentLoaded", function () {
    // Select the grid where products will be shown
    const productsGrid = document.getElementById("productsGrid");

    // ==========================================
    // 1. FETCH ALL PRODUCTS
    // ==========================================
    fetch('/api/admin/products/list')
        .then(response => response.json())
        .then(data => {
            // Handle both { success: true, products: [] } and raw []
            const products = Array.isArray(data) ? data : (data.products || []);
            
            if (products.length > 0) {
                renderProductsUI(products);
            } else {
                console.log("No real products found. Showing default demo products from HTML.");
            }
        })
        .catch(error => console.error("Error fetching products:", error));

    // ==========================================
    // 2. RENDER PRODUCTS TO GRID
    // ==========================================
    function renderProductsUI(products) {
        const template = document.getElementById("productCardTemplate");
        if (!template) return;

        productsGrid.innerHTML = ""; // Clear the demo products from HTML

        products.forEach(product => {
            const clone = template.content.cloneNode(true);
            
            // Calculate total stock for this product
            let totalStock = 0;
            product.variants.forEach(v => {
                v.sizes.forEach(s => totalStock += s.stock);
            });

            // Set main image
            const mainImg = product.variants[0]?.images[0] 
                ? `/images/products/${product.variants[0].images[0]}` 
                : 'https://via.placeholder.com/400?text=No+Image';

            // Fill card data
            clone.querySelector("img").src = mainImg;
            clone.querySelector(".product-name").textContent = product.name;
            clone.querySelector(".product-category").textContent = product.category?.name || 'Uncategorized';
            clone.querySelector(".offer-price").textContent = `₹${product.offerPrice || product.price}`;
            clone.querySelector(".product-stock").textContent = `Stock: ${totalStock}`;
            
            // Status label (Active / Inactive)
            const pill = clone.querySelector(".status-pill");
            pill.textContent = product.status ? 'Active' : 'Inactive';
            pill.classList.add(product.status ? 'pill-active' : 'pill-inactive');

            // Handle Edit Button Click
            clone.querySelector(".edit-btn").addEventListener("click", function() {
                window.location.href = `/api/admin/edit-product?id=${product._id}`;
            });

            // Handle Delete Button Click
            clone.querySelector(".delete-btn").addEventListener("click", function() {
                if (confirm("Are you sure you want to delete this product?")) {
                    fetch(`/api/admin/products/${product._id}`, { method: "DELETE" })
                        .then(res => {
                            if (res.ok) {
                                alert("Product deleted successfully");
                                window.location.reload();
                            } else {
                                alert("Failed to delete product");
                            }
                        });
                }
            });

            productsGrid.appendChild(clone);
        });
    }
});
