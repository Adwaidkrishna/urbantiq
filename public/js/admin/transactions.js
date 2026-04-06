(function () {
    const tableBody = document.querySelector('.admin-table tbody');
    const searchInput = document.querySelector('.search-input');

    const fetchTransactions = async () => {
        try {
            const response = await fetch('/api/orders/admin/transactions');
            const data = await response.json();
            
            if (response.ok) {
                renderTransactions(data);
            } else {
                console.error("Failed to fetch transactions:", data.message);
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        }
    };

    const renderTransactions = (transactions) => {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (transactions.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4">No transactions found.</td></tr>';
            return;
        }

        transactions.forEach(txn => {
            const row = document.createElement('tr');
            
            // Format status badge
            let statusClass = 'badge-pending';
            let statusText = txn.paymentStatus || 'Pending';
            
            if (statusText === 'Paid') {
                statusClass = 'badge-delivered'; // Reusing existing CSS class for green
                statusText = 'Completed';
            } else if (statusText === 'Failed') {
                statusClass = 'badge-cancelled'; // Reusing existing CSS class for red
            }

            const date = new Date(txn.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // If transactionId is missing, use a shortened order ID as a fallback for the UI
            const displayTxnId = txn.transactionId || `TXN-${txn._id.toString().slice(-6).toUpperCase()}`;
            const displayOrderId = `#ORD-${txn._id.toString().slice(-4).toUpperCase()}`;

            row.innerHTML = `
                <td class="fw-600">${displayTxnId}</td>
                <td class="td-secondary">${displayOrderId}</td>
                <td>${txn.paymentMethod}</td>
                <td class="fw-600">₹${txn.finalAmount.toFixed(2)}</td>
                <td class="td-secondary">${date}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            `;
            tableBody.appendChild(row);
        });
    };

    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const query = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.admin-table tbody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }

    // Initial fetch
    fetchTransactions();
})();
