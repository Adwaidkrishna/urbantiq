document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.querySelector('.admin-table tbody');
    const totalUnitsEl = document.querySelector('.stat-card:nth-child(1) .stat-card-value');
    const outOfStockEl = document.querySelector('.stat-card:nth-child(2) .stat-card-value');
    const lowStockEl = document.querySelector('.stat-card:nth-child(3) .stat-card-value');

    // Thresholds
    const LOW_STOCK_THRESHOLD = 10;

    async function fetchInventory() {
        try {
            const response = await fetch('/api/admin/products/list');
            const data = await response.json();
            
            const products = Array.isArray(data) ? data : (data.products || []);
            renderInventory(products);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load inventory data</td></tr>';
            }
        }
    }

    function renderInventory(products) {
        let totalUnits = 0;
        let outOfStockCount = 0;
        let lowStockCount = 0;
        let html = '';

        if (!products || products.length === 0) {
            if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No products found</td></tr>';
            updateStats(0, 0, 0);
            return;
        }

        products.forEach(product => {
            // 1. Calculate the TOTAL stock across all size variants for this product
            let productTotalStock = 0;
            if (product.variants && Array.isArray(product.variants)) {
                product.variants.forEach(variant => {
                    if (variant.sizes && Array.isArray(variant.sizes)) {
                        variant.sizes.forEach(size => {
                            productTotalStock += (Number(size.stock) || 0);
                        });
                    }
                });
            }

            // 2. Global stats tracking
            totalUnits += productTotalStock;

            let statusBadge = '';
            let stockClass = '';

            // 3. Logic for Out of Stock vs Low Stock
            if (productTotalStock === 0) {
                outOfStockCount++; // Flag this product as Out of Stock
                statusBadge = '<span class="status-badge badge-cancelled">Out of Stock</span>';
                stockClass = 'text-danger';
            } else if (productTotalStock <= LOW_STOCK_THRESHOLD) {
                lowStockCount++; // Flag this product as Low Stock
                statusBadge = '<span class="status-badge badge-pending">Low Stock</span>';
                stockClass = 'text-warning';
            } else {
                statusBadge = '<span class="status-badge badge-active">In Stock</span>';
                stockClass = 'text-success';
            }

            const lastUpdated = product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'N/A';
            const price = Number(product.price || 0);
            const displayPrice = `₹${price.toLocaleString('en-IN')}`;

            // Create a breakdown tooltip-like string
            let breakdown = '';
            product.variants?.forEach(v => {
                v.sizes?.forEach(s => {
                    if (s.stock > 0) {
                        breakdown += `${v.colorName || v.color} (${s.size}): ${s.stock}\n`;
                    }
                });
            });

            html += `
                <tr title="${breakdown || 'No stock allocated'}">
                    <td class="fw-600">${product.name || 'Unknown Item'}</td>
                    <td class="td-secondary">${product.category?.name || 'Uncategorized'}</td>
                    <td class="fw-600 ${stockClass}">
                        ${productTotalStock} Units
                        <div style="font-size: 0.75rem; color: #666; font-weight: 400; margin-top: 2px;">
                            ${product.variants?.length || 0} Colors / ${product.variants?.[0]?.sizes?.length || 0} Sizes
                        </div>
                    </td>
                    <td>${displayPrice}</td>
                    <td>${statusBadge}</td>
                    <td class="text-end td-secondary">${lastUpdated}</td>
                </tr>
            `;
        });

        if (tableBody) tableBody.innerHTML = html;
        updateStats(totalUnits, outOfStockCount, lowStockCount);
    }

    function updateStats(total, out, low) {
        if (totalUnitsEl) animateValue(totalUnitsEl, 0, total, 1000);
        if (outOfStockEl) outOfStockEl.textContent = out;
        if (lowStockEl) lowStockEl.textContent = low;

        // Apply visual warning to Out of Stock card if count > 0
        if (outOfStockEl && out > 0) {
            outOfStockEl.style.color = '#de350b'; // Red
        }
        // Apply visual warning to Low Stock card if count > 0
        if (lowStockEl && low > 0) {
            lowStockEl.style.color = '#ff991f'; // Orange/Yellow
        }
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
