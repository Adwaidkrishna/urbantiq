(function () {
    const couponForm = document.getElementById('createCouponForm');
    const tableBody = document.querySelector('.admin-table tbody');
    const formTitle = document.querySelector('.admin-form-section-title');
    const submitBtn = couponForm ? couponForm.querySelector('button[type="submit"]') : null;

    let isEditMode = false;
    let editId = null;

    // FETCH ALL COUPONS
    const fetchCoupons = async () => {
        try {
            console.log('Fetching coupons...');
            const response = await fetch('/api/coupons/admin/all');
            if (!response.ok) throw new Error('Failed to fetch coupons');
            const coupons = await response.json();
            renderCoupons(coupons);
        } catch (error) {
            console.error('Fetch Coupons Error:', error);
        }
    };

    // RENDER COUPONS TO TABLE
    const renderCoupons = (coupons) => {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (!coupons || coupons.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-muted">No coupons found. Create one to get started!</td></tr>';
            return;
        }

        coupons.forEach(coupon => {
            const row = document.createElement('tr');
            
            // Format dynamic values
            const discountDisplay = `${coupon.value}% OFF`;
            const usageDisplay = `${coupon.usedCount}/${coupon.usageLimit}`;
            
            // Format date
            const expiryDate = new Date(coupon.expiryDate);
            const isExpired = expiryDate < new Date();
            const dateDisplay = expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            
            const statusClass = isExpired ? 'badge-cancelled' : 'badge-active';
            const statusText = isExpired ? 'Expired' : 'Active';

            row.innerHTML = `
                <td class="fw-600">${coupon.code}</td>
                <td><span class="fw-bold text-dark">${discountDisplay}</span></td>
                <td>${usageDisplay}</td>
                <td class="td-secondary">${dateDisplay}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-btns justify-content-end">
                        <button class="btn-admin-outline btn-admin-icon btn-edit-coupon" data-coupon='${JSON.stringify(coupon).replace(/'/g, "&apos;")}' title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-admin-outline btn-admin-icon btn-copy-coupon" data-code="${coupon.code}" title="Copy Code">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                        <button class="btn-admin-danger btn-admin-icon btn-delete-coupon" data-id="${coupon._id}" title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // BIND EDIT
        tableBody.querySelectorAll('.btn-edit-coupon').forEach(btn => {
            btn.addEventListener('click', function() {
                try {
                    const couponData = JSON.parse(this.dataset.coupon);
                    enterEditMode(couponData);
                } catch (e) { console.error('Parse Error:', e); }
            });
        });

        // BIND DELETE
        tableBody.querySelectorAll('.btn-delete-coupon').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.dataset.id;
                if (confirm('Delete this coupon permanently?')) {
                    try {
                        const res = await fetch(`/api/coupons/admin/${id}`, { method: 'DELETE' });
                        if (res.ok) {
                            fetchCoupons();
                            if (isEditMode && editId === id) resetForm();
                        }
                    } catch (error) { console.error('Delete Error:', error); }
                }
            });
        });

        // BIND COPY
        tableBody.querySelectorAll('.btn-copy-coupon').forEach(btn => {
            btn.addEventListener('click', function() {
                const code = this.dataset.code;
                navigator.clipboard.writeText(code).then(() => {
                    const originalHTML = this.innerHTML;
                    this.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="green" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                    setTimeout(() => this.innerHTML = originalHTML, 1000);
                });
            });
        });
    };

    // ENTER EDIT MODE
    const enterEditMode = (coupon) => {
        isEditMode = true;
        editId = coupon._id;
        if (formTitle) formTitle.textContent = 'Update Coupon';
        if (submitBtn) submitBtn.textContent = 'Save Changes';
        
        // Fill fields
        const codeField = document.getElementById('couponCode');
        const valueField = document.getElementById('discountValue');
        const limitField = document.getElementById('usageLimit');
        const dateField = document.getElementById('expiryDate');

        if (codeField) codeField.value = coupon.code;
        if (valueField) valueField.value = coupon.value;
        if (limitField) limitField.value = coupon.usageLimit;
        
        if (dateField) {
            // Ensure YYYY-MM-DD format for date input
            const d = new Date(coupon.expiryDate);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            dateField.value = `${year}-${month}-${day}`;
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // RESET FORM
    const resetForm = () => {
        if (couponForm) couponForm.reset();
        isEditMode = false;
        editId = null;
        if (formTitle) formTitle.textContent = 'Generate New Coupon';
        if (submitBtn) submitBtn.textContent = 'Create Coupon';
    };

    // SUBMIT FORM (CREATE OR UPDATE)
    if (couponForm) {
        couponForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            console.log('Submitting coupon form...');

            const couponData = {
                code: document.getElementById('couponCode').value.trim().toUpperCase(),
                discountType: document.getElementById('discountType').value,
                value: Number(document.getElementById('discountValue').value),
                usageLimit: Number(document.getElementById('usageLimit').value),
                expiryDate: document.getElementById('expiryDate').value,
                isActive: true
            };

            const url = isEditMode ? `/api/coupons/admin/${editId}` : '/api/coupons/admin';
            const method = isEditMode ? 'PUT' : 'POST';

            try {
                const isCurrentlyUpdating = isEditMode; // CAPTURE STATE
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(couponData)
                });

                const result = await response.json();

                if (response.ok) {
                    console.log('Success:', result);
                    resetForm();
                    await fetchCoupons(); // Refresh table
                    alert(isCurrentlyUpdating ? 'Coupon updated successfully!' : 'New coupon created!');
                } else {
                    console.error('Error result:', result);
                    alert(result.message || 'Validation failed. Please check your inputs.');
                }
            } catch (error) { 
                console.error('Submission Fatal Error:', error);
                alert('Connection error. Please try again.');
            }
        });
    }

    // INITIAL DATA LOAD
    fetchCoupons();
})();
