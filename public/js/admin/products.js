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
                productsGrid.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <div class="no-products-state">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="mb-3">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                            </svg>
                            <h3 class="text-muted h5">No products found</h3>
                            <p class="text-muted small">Try adding some original products to see them here.</p>
                            <a href="/api/admin/add-product" class="btn btn-sm btn-outline-primary mt-2">Add First Product</a>
                        </div>
                    </div>
                `;
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
