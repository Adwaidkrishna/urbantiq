document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.querySelector('.admin-table tbody');
    const totalUnitsEl = document.querySelector('.stat-card:nth-child(1) .stat-card-value');
    const outOfStockEl = document.querySelector('.stat-card:nth-child(2) .stat-card-value');
    const lowStockEl = document.querySelector('.stat-card:nth-child(3) .stat-card-value');

    const LOW_STOCK_THRESHOLD = 10;

    async function fetchInventory() {
        try {
            const response = await fetch('/api/admin/products/list');
            const products = await response.json();
            renderInventory(products);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load inventory data</td></tr>';
        }
    }

    function renderInventory(products) {
        let totalUnits = 0;
        let outOfStockCount = 0;
        let lowStockCount = 0;
        let html = '';

        if (!products || products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No products found</td></tr>';
            return;
        }

        products.forEach(product => {
            // Calculate total stock across all variants/sizes
            let productTotalStock = 0;
            product.variants?.forEach(variant => {
                variant.sizes?.forEach(size => {
                    productTotalStock += (size.stock || 0);
                });
            });

            totalUnits += productTotalStock;

            let statusBadge = '';
            let stockClass = '';

            if (productTotalStock === 0) {
                outOfStockCount++;
                statusBadge = '<span class="status-badge badge-cancelled">Out of Stock</span>';
                stockClass = 'text-danger';
            } else if (productTotalStock <= LOW_STOCK_THRESHOLD) {
                lowStockCount++;
                statusBadge = '<span class="status-badge badge-pending">Low Stock</span>';
                stockClass = 'text-warning';
            } else {
                statusBadge = '<span class="status-badge badge-active">In Stock</span>';
                stockClass = 'text-success';
            }

            const lastUpdated = new Date(product.updatedAt).toLocaleDateString();

            html += `
                <tr>
                    <td class="fw-600">${product.name}</td>
                    <td class="td-secondary">${product.category?.name || 'Uncategorized'}</td>
                    <td class="fw-600 ${stockClass}">${productTotalStock} Units</td>
                    <td>₹${product.price.toLocaleString()}</td>
                    <td>${statusBadge}</td>
                    <td class="text-end td-secondary">${lastUpdated}</td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
        
        // Update Stats Cards
        totalUnitsEl.textContent = totalUnits.toLocaleString();
        outOfStockEl.textContent = outOfStockCount;
        lowStockEl.textContent = lowStockCount;

        // Animate the numbers if possible
        animateValue(totalUnitsEl, 0, totalUnits, 1000);
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    fetchInventory();
});
