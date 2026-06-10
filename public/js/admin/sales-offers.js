(function () {
    const offerForm = document.getElementById('createOfferForm');
    const categorySelect = document.getElementById('offerCategory');
    const tableBody = document.getElementById('offersTableBody');
    const formTitle = document.querySelector('.admin-form-section-title');
    const submitBtn = offerForm ? offerForm.querySelector('button[type="submit"]') : null;

    let isEditMode = false;
    let editId = null;

    // Helper to format date as YYYY-MM-DD for input fields
    const formatDateForInput = (dateString) => {
        const d = new Date(dateString);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper to format date as DD MMM YYYY for display
    const formatDateForDisplay = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // POPULATE CATEGORIES
    const populateCategories = async () => {
        if (!categorySelect) return;
        try {
            console.log('Fetching categories...');
            const response = await fetch('/api/admin/categories/list');
            if (!response.ok) throw new Error('Failed to fetch categories');
            const data = await response.json();
            
            const categories = data.categories || [];
            // Clear all but first two options
            categorySelect.innerHTML = `
                <option value="">Select Category</option>
                <option value="all">All Categories</option>
            `;
            
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat._id;
                opt.textContent = cat.name;
                categorySelect.appendChild(opt);
            });
        } catch (error) {
            console.error('Populate Categories Error:', error);
        }
    };

    // FETCH ALL OFFERS
    const fetchOffers = async () => {
        if (!tableBody) return;
        try {
            console.log('Fetching offers...');
            const response = await fetch('/api/admin/offers');
            if (!response.ok) throw new Error('Failed to fetch offers');
            const offers = await response.json();
            renderOffers(offers);
        } catch (error) {
            console.error('Fetch Offers Error:', error);
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-danger">Error loading offers.</td></tr>';
        }
    };

    // RENDER OFFERS TO TABLE
    const renderOffers = (offers) => {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (!offers || offers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-muted">No promotional offers scheduled. Create one to get started!</td></tr>';
            return;
        }

        const now = new Date();

        offers.forEach(offer => {
            const row = document.createElement('tr');
            
            const discountDisplay = `${offer.discountPercentage}% OFF`;
            const categoryName = offer.category ? offer.category.name : 'All Categories';
            
            const startDate = new Date(offer.startDate);
            const endDate = new Date(offer.endDate);
            const dateDisplay = `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`;
            
            // Determine active/scheduled/expired status
            let statusText = 'Active';
            let statusClass = 'badge-active';

            if (offer.status === 'inactive') {
                statusText = 'Inactive';
                statusClass = 'badge-cancelled';
            } else if (now < startDate) {
                statusText = 'Scheduled';
                statusClass = 'badge-pending';
            } else if (now > endDate) {
                statusText = 'Expired';
                statusClass = 'badge-cancelled';
            }

            row.innerHTML = `
                <td class="fw-600">${offer.title}</td>
                <td>${categoryName}</td>
                <td><span class="fw-bold text-dark">${discountDisplay}</span></td>
                <td class="td-secondary">${dateDisplay}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-admin-outline btn-admin-icon btn-edit-offer" data-offer='${JSON.stringify(offer).replace(/'/g, "&apos;")}' title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-admin-danger btn-admin-icon btn-delete-offer" data-id="${offer._id}" title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // BIND EDIT
        tableBody.querySelectorAll('.btn-edit-offer').forEach(btn => {
            btn.addEventListener('click', function() {
                try {
                    const offerData = JSON.parse(this.dataset.offer);
                    enterEditMode(offerData);
                } catch (e) { 
                    console.error('Parse Error:', e); 
                }
            });
        });

        // BIND DELETE
        tableBody.querySelectorAll('.btn-delete-offer').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.dataset.id;
                const confirmed = await showConfirm({
                    title: 'Remove Offer?',
                    text: 'This category offer will be deleted and all product prices will revert.',
                    confirmText: 'Yes, Remove',
                    icon: 'warning',
                });
                if (confirmed) {
                    try {
                        const res = await fetch(`/api/admin/offers/${id}`, { method: 'DELETE' });
                        if (res.ok) {
                            successToast('Offer removed successfully');
                            fetchOffers();
                            if (isEditMode && editId === id) resetForm();
                        } else {
                            const data = await res.json();
                            errorToast(data.message || 'Failed to remove offer');
                        }
                    } catch (error) { 
                        console.error('Delete Error:', error); 
                        errorToast('Network error during deletion');
                    }
                }
            });
        });
    };

    // ENTER EDIT MODE
    const enterEditMode = (offer) => {
        isEditMode = true;
        editId = offer._id;
        if (formTitle) formTitle.textContent = 'Update Scheduled Offer';
        if (submitBtn) submitBtn.textContent = 'Save Changes';
        
        // Fill fields
        document.getElementById('offerTitle').value = offer.title;
        document.getElementById('offerCategory').value = offer.category ? (offer.category._id || offer.category) : 'all';
        document.getElementById('offerDiscount').value = offer.discountPercentage;
        document.getElementById('offerStatus').value = offer.status;
        document.getElementById('offerStartDate').value = formatDateForInput(offer.startDate);
        document.getElementById('offerEndDate').value = formatDateForInput(offer.endDate);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // RESET FORM
    const resetForm = () => {
        if (offerForm) offerForm.reset();
        isEditMode = false;
        editId = null;
        if (formTitle) formTitle.textContent = 'Schedule New Offer';
        if (submitBtn) submitBtn.textContent = 'Add New Offer';
    };

    // SUBMIT FORM (CREATE OR UPDATE)
    if (offerForm) {
        offerForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const offerData = {
                title: document.getElementById('offerTitle').value.trim(),
                category: document.getElementById('offerCategory').value,
                discountPercentage: Number(document.getElementById('offerDiscount').value),
                status: document.getElementById('offerStatus').value,
                startDate: document.getElementById('offerStartDate').value,
                endDate: document.getElementById('offerEndDate').value
            };

            const url = isEditMode ? `/api/admin/offers/${editId}` : '/api/admin/offers';
            const method = isEditMode ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(offerData)
                });

                const result = await response.json();

                if (response.ok) {
                    resetForm();
                    await fetchOffers(); // Refresh table
                    successToast(isEditMode ? 'Offer updated successfully!' : 'New offer scheduled!');
                } else {
                    errorToast(result.message || 'Failed to save offer. Check inputs.');
                }
            } catch (error) { 
                console.error('Submission Error:', error);
                errorToast('Connection error. Please try again.');
            }
        });
    }

    // INITIAL LOAD
    populateCategories().then(() => {
        fetchOffers();
    });
})();
