/**
 * inventory.js — URBANTIQ Admin
 * Handles live inventory tracking, searching, filtering, and variant breakdown.
 */

document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.getElementById('inventoryTableBody');
    const totalUnitsEl = document.getElementById('totalStockUnits');
    const outOfStockEl = document.getElementById('outOfStockCount');
    const lowStockEl = document.getElementById('lowStockCount');
    const totalProductsEl = document.getElementById('totalProductsCount');
    const searchInput = document.getElementById('inventorySearch');
    const statusFilter = document.getElementById('statusFilter');

    // State
    let allProducts = [];
    const LOW_STOCK_THRESHOLD = 5;

    async function fetchInventory() {
        try {
            const response = await fetch('/api/admin/products/list');
            const data = await response.json();
            
            allProducts = Array.isArray(data) ? data : (data.products || []);
            
            performRender();
            
            ["cardTotalUnits", "cardOutOfStock", "cardLowStock", "cardTotalProducts"].forEach(id => {
                document.getElementById(id)?.classList.remove('skeleton');
            });

        } catch (error) {
            console.error('Error fetching inventory:', error);
            document.getElementById('inventoryError').style.display = 'block';
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-danger">Failed to load inventory data</td></tr>';
            }
        }
    }

    function performRender() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = statusFilter.value;

        const filtered = allProducts.filter(p => {
            const matchesSearch = p.name?.toLowerCase().includes(searchTerm) || 
                                 p.category?.name?.toLowerCase().includes(searchTerm);
            
            if (!matchesSearch) return false;

            let productTotalStock = 0;
            p.variants?.forEach(v => v.sizes?.forEach(s => productTotalStock += (Number(s.stock) || 0)));

            if (filterValue === 'all') return true;
            if (filterValue === 'out-of-stock') return productTotalStock === 0;
            if (filterValue === 'low-stock') return productTotalStock > 0 && productTotalStock <= LOW_STOCK_THRESHOLD;
            if (filterValue === 'in-stock') return productTotalStock > LOW_STOCK_THRESHOLD;

            return true;
        });

        renderInventory(filtered);
    }

    function renderInventory(products) {
        if (!tableBody) return;

        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-muted">No matching products found</td></tr>';
            return;
        }

        let totalUnits = 0;
        let outOfStockCount = 0;
        let lowStockCount = 0;

        allProducts.forEach(p => {
            let pStock = 0;
            p.variants?.forEach(v => v.sizes?.forEach(s => pStock += (Number(s.stock) || 0)));
            totalUnits += pStock;
            if (pStock === 0) outOfStockCount++;
            else if (pStock <= LOW_STOCK_THRESHOLD) lowStockCount++;
        });

        updateStats(totalUnits, outOfStockCount, lowStockCount, allProducts.length);

        let finalHtml = '';
        products.forEach(product => {
            let pStock = 0;
            product.variants?.forEach(v => v.sizes?.forEach(s => pStock += (Number(s.stock) || 0)));

            let badge = '';
            let stockColor = '';

            if (pStock === 0) {
                badge = '<span class="status-badge badge-out-of-stock">Out of Stock</span>';
                stockColor = 'text-danger';
            } else if (pStock <= LOW_STOCK_THRESHOLD) {
                badge = '<span class="status-badge badge-low-stock">Low Stock</span>';
                stockColor = 'text-warning';
            } else {
                badge = '<span class="status-badge badge-active">In Stock</span>';
                stockColor = 'text-success';
            }

            const lastUpdated = product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
            }) : 'N/A';
            
            const variantSummary = `${product.variants?.length || 0} Colors / ${product.variants?.[0]?.sizes?.length || 0} Sizes`;
            
            const mainImg = product.variants?.[0]?.images?.[0] 
                ? `/images/products/${product.variants[0].images[0]}` 
                : '/images/user/phoodie.jpeg';

            // ── Main Row ──
            finalHtml += `
                <tr class="main-row" data-id="${product._id}">
                    <td>
                        <div class="product-item-cell">
                            <img src="${mainImg}" class="product-img-tiny" alt="">
                            <div>
                                <div class="fw-600">${product.name}</div>
                                <div class="text-muted" style="font-size: 0.75rem;">ID: #${product._id.toString().slice(-6).toUpperCase()}</div>
                            </div>
                        </div>
                    </td>
                    <td><span class="td-secondary">${product.category?.name || 'Uncategorized'}</span></td>
                    <td>
                        <div class="fw-600 ${stockColor}">${pStock} Units</div>
                        <div class="text-muted" style="font-size: 0.75rem;">${variantSummary}</div>
                    </td>
                    <td class="fw-600">₹${Number(product.price).toLocaleString('en-IN')}</td>
                    <td>${badge}</td>
                    <td class="text-end td-secondary">
                        <div class="d-flex align-items-center justify-content-end gap-2">
                            ${lastUpdated}
                            <svg class="expand-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.3s;"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                    </td>
                </tr>
            `;

            // ── Variant Detail Row ──
            const variantCards = product.variants?.map(v => {
                const sizesHtml = v.sizes?.map(s => {
                    const sStock = Number(s.stock) || 0;
                    const stockClass = sStock === 0 ? 'out' : (sStock <= 2 ? 'low' : '');
                    return `
                        <div class="size-stock-badge">
                            <span class="size-label">${s.size}</span>
                            <span class="stock-value ${stockClass}">${sStock}</span>
                        </div>
                    `;
                }).join('') || '<div class="text-muted fs-12">No sizes</div>';

                return `
                    <div class="variant-card">
                        <div class="variant-color-strip">
                            <div class="color-circle" style="background: ${v.color}"></div>
                            <span>${v.colorName || v.color}</span>
                        </div>
                        <div class="size-badge-list">
                            ${sizesHtml}
                        </div>
                    </div>
                `;
            }).join('');

            finalHtml += `
                <tr class="variant-detail-row" id="detail-${product._id}">
                    <td colspan="6">
                        <div class="variant-wrapper">
                            <div class="variant-header">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                                Detailed Variant Inventory
                            </div>
                            <div class="variant-grid">
                                ${variantCards || '<div class="text-muted">No variants defined</div>'}
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = finalHtml;
        attachToggleListeners();
    }

    function attachToggleListeners() {
        document.querySelectorAll('.main-row').forEach(row => {
            row.addEventListener('click', function() {
                const id = this.dataset.id;
                const detailRow = document.getElementById(`detail-${id}`);
                const icon = this.querySelector('.expand-icon');
                
                if (detailRow.classList.contains('show')) {
                    detailRow.classList.remove('show');
                    if (icon) icon.style.transform = 'rotate(0deg)';
                } else {
                    // Optional: close other open rows
                    // document.querySelectorAll('.variant-detail-row').forEach(r => r.classList.remove('show'));
                    // document.querySelectorAll('.expand-icon').forEach(i => i.style.transform = 'rotate(0deg)');
                    
                    detailRow.classList.add('show');
                    if (icon) icon.style.transform = 'rotate(180deg)';
                }
            });
        });
    }

    function updateStats(total, out, low, totalProducts) {
        if (totalUnitsEl) animateValue(totalUnitsEl, parseInt(totalUnitsEl.textContent) || 0, total, 800);
        if (outOfStockEl) outOfStockEl.textContent = out;
        if (lowStockEl) lowStockEl.textContent = low;
        if (totalProductsEl) animateValue(totalProductsEl, parseInt(totalProductsEl.textContent) || 0, totalProducts, 800);

        if (outOfStockEl) outOfStockEl.className = `stat-card-value ${out > 0 ? 'text-danger' : ''}`;
        if (lowStockEl) lowStockEl.className = `stat-card-value ${low > 0 ? 'text-warning' : ''}`;
    }

    function animateValue(obj, start, end, duration) {
        if (start === end) {
            obj.innerHTML = end.toLocaleString();
            return;
        }
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

    searchInput.addEventListener('input', performRender);
    statusFilter.addEventListener('change', performRender);

    fetchInventory();
    fetchAdminProfile();
});

async function fetchAdminProfile() {
    try {
        const res = await fetch("/api/admin/profile");
        const data = await res.json();
        if (data.success && data.admin) {
            const admin = data.admin;
            const fullName = [admin.firstName, admin.lastName].filter(Boolean).join(" ") || admin.email;
            document.querySelectorAll(".topbar-user-name").forEach(el => el.textContent = fullName);
            const initials = fullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
            document.querySelectorAll(".topbar-user-avatar, .sidebar-user-avatar").forEach(el => el.textContent = initials);
            document.querySelectorAll(".sidebar-user-name").forEach(el => el.textContent = fullName);
        }
    } catch (_) {}
}
