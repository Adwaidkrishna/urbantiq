(function () {
    const searchInput = document.querySelector('.search-input');
    const tbody = document.querySelector('.admin-table tbody');

    // ── Load purchases on init ─────────────────────────────────────────
    async function loadPurchases() {
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Loading purchases...</td></tr>';
        
        try {
            const res = await fetch('/api/admin/purchases-list');
            if (!res.ok) throw new Error('Failed to fetch');
            
            const data = await res.json();
            
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No purchases found</td></tr>';
                return;
            }

            tbody.innerHTML = '';
            
            data.forEach(item => {
                // Determine supplier name handling populated models
                const pInfo = item.purchaseId || {};
                const sInfo = pInfo.supplierId || {};
                const supplierName = sInfo.companyName || sInfo.name || 'Unknown Supplier';

                const invoiceStr = pInfo.invoiceNumber || '—';
                const dateStr = pInfo.purchaseDate 
                    ? new Date(pInfo.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="fw-600">${invoiceStr}</td>
                    <td>${supplierName}</td>
                    <td class="fw-600" style="color:#2563EB;">${item.productName || 'Unknown'}</td>
                    <td>${item.quantity || 0}</td>
                    <td class="td-secondary">₹${(item.costPrice || 0).toFixed(2)}</td>
                    <td class="td-secondary">₹${(item.sellingPrice || 0).toFixed(2)}</td>
                    <td class="fw-600">₹${(item.total || 0).toFixed(2)}</td>
                    <td class="td-secondary" style="font-family:monospace;">${item.batchId || '—'}</td>
                    <td class="td-secondary">${dateStr}</td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error(error);
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:red;">Failed to load data</td></tr>';
        }
    }

    // ── Search filtering ──────────────────────────────────────────────
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const query = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.admin-table tbody tr');
            rows.forEach(row => {
                // Ensure empty message row isn't hidden if there's no query, but hide otherwise
                if (row.children.length === 1) return;
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }

    loadPurchases();
})();
