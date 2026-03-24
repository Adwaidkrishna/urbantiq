document.addEventListener('DOMContentLoaded', () => {
    const editSupplierForm = document.getElementById('editSupplierForm');
    const editFormLoader = document.getElementById('editFormLoader');
    const editName = document.getElementById('editName');
    const editCompanyName = document.getElementById('editCompanyName');
    const editContactNumber = document.getElementById('editContactNumber');
    const editStatus = document.getElementById('editStatus');
    const editSubmitBtn = document.getElementById('editSubmitBtn');

    // Extract supplier ID from URL. Format: /api/admin/edit-supplier/:id
    const pathParts = window.location.pathname.split('/');
    const supplierId = pathParts[pathParts.length - 1];

    if (!supplierId || supplierId === 'edit-supplier') {
        alert('Invalid Supplier ID');
        window.location.href = '/api/admin/suppliers';
        return;
    }

    const fetchSupplierDetails = async () => {
        try {
            const response = await fetch(`/api/admin/suppliers/${supplierId}`);
            if (!response.ok) throw new Error('Supplier not found');
            const supplier = await response.json();

            // Populate form
            editName.value = supplier.name || '';
            editCompanyName.value = supplier.companyName || '';
            editContactNumber.value = supplier.contactNumber || '';
            editStatus.value = supplier.status || 'active';

            // Show form
            editFormLoader.style.display = 'none';
            editSupplierForm.style.display = 'flex';

        } catch (error) {
            console.error('Error fetching supplier details:', error);
            alert('Failed to load supplier details');
            window.location.href = '/api/admin/suppliers';
        }
    };

    // Initialize fetch
    fetchSupplierDetails();

    // Handle form submission
    editSupplierForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const originalBtnText = editSubmitBtn.innerHTML;
        editSubmitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        editSubmitBtn.disabled = true;

        try {
            const formData = {
                name: editName.value.trim(),
                companyName: editCompanyName.value.trim(),
                contactNumber: editContactNumber.value.trim(),
                status: editStatus.value
            };

            const response = await fetch(`/api/admin/suppliers/${supplierId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to update supplier');
            }

            alert('Supplier updated successfully');
            window.location.href = '/api/admin/suppliers';

        } catch (error) {
            console.error('Error updating supplier:', error);
            alert(error.message || 'An error occurred while updating the supplier');
            editSubmitBtn.innerHTML = originalBtnText;
            editSubmitBtn.disabled = false;
        }
    });
});
