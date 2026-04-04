document.addEventListener("DOMContentLoaded", function () {
    fetchWalletData();

    // Elements
    const addMoneyBtn = document.getElementById("addMoneyBtn");
    const confirmTopupBtn = document.getElementById("confirmTopupBtn");
    const topupAmountInput = document.getElementById("topupAmount");
    const addMoneyModal = new bootstrap.Modal(document.getElementById("addMoneyModal"));

    // Open Modal
    if (addMoneyBtn) {
        addMoneyBtn.addEventListener("click", (e) => {
            e.preventDefault();
            addMoneyModal.show();
        });
    }

    // Handle Top-up Submission
    if (confirmTopupBtn) {
        confirmTopupBtn.addEventListener("click", async () => {
            const amount = parseFloat(topupAmountInput.value);

            if (!amount || amount < 10) {
                AuthGuard.showToast("Please enter a valid amount (min ₹10)", "error");
                return;
            }

            confirmTopupBtn.disabled = true;
            confirmTopupBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

            try {
                // 1. Create Razorpay Order on Backend
                const orderRes = await fetch("/api/user-profile/wallet/topup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount })
                });

                const orderData = await orderRes.json();
                if (!orderRes.ok) throw new Error(orderData.message || "Failed to create order");

                // 2. Configure Razorpay Options
                const options = {
                    key: "rzp_test_SYJDs3aCK4Cn6M",
                    amount: orderData.order.amount,
                    currency: "INR",
                    name: "URBANTIQ Wallet",
                    description: "Add Money to Wallet",
                    order_id: orderData.order.id,
                    handler: async function (response) {
                        try {
                            const verifyRes = await fetch("/api/user-profile/wallet/verify", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    amount: amount
                                })
                            });

                            const verifyData = await verifyRes.json();
                            if (verifyRes.ok) {
                                addMoneyModal.hide();
                                topupAmountInput.value = "";
                                fetchWalletData(); // Refresh UI
                                AuthGuard.showToast(`Successfully added ₹${amount} to wallet`, "success");
                            } else {
                                throw new Error(verifyData.message || "Verification failed");
                            }
                        } catch (err) {
                            AuthGuard.showToast(err.message, "error");
                        }
                    },
                    modal: {
                        ondismiss: function() {
                            confirmTopupBtn.disabled = false;
                            confirmTopupBtn.textContent = "Proceed to Payment";
                        }
                    },
                    theme: { color: "#000000" }
                };

                const rzp = new Razorpay(options);
                rzp.open();

            } catch (error) {
                AuthGuard.showToast(error.message, "error");
            } finally {
                confirmTopupBtn.disabled = false;
                confirmTopupBtn.textContent = "Proceed to Payment";
            }
        });
    }

    async function fetchWalletData() {
        try {
            const response = await fetch("/api/user-profile/wallet");
            const data = await response.json();

            if (response.ok) {
                updateUI(data);
            } else {
                console.error("Failed to fetch wallet data");
            }
        } catch (error) {
            console.error("Error fetching wallet data:", error);
        }
    }

    function updateUI(data) {
        // Update Balance
        const balanceDisplay = document.querySelector(".card-center .card-balance");
        if (balanceDisplay) {
            balanceDisplay.textContent = `₹${(data.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        }

        // Update Transactions
        const transactionGroup = document.querySelector(".account-group");
        if (transactionGroup) {
            transactionGroup.innerHTML = "";

            if (!data.transactions || data.transactions.length === 0) {
                transactionGroup.innerHTML = `
                    <div class="empty-state py-5 text-center">
                        <div class="empty-icon mb-3"><i class="bi bi-wallet2 fs-1 text-muted"></i></div>
                        <p class="empty-text text-muted">No transactions yet</p>
                        <a href="/product" class="btn btn-dark rounded-pill px-4">Start Shopping</a>
                    </div>
                `;
                return;
            }

            data.transactions.forEach(tx => {
                const row = document.createElement("div");
                row.className = "transaction-row";

                const isCredit = tx.type === "CREDIT";
                const isRecharge = tx.description.toLowerCase().includes("recharge");
                const iconClass = isCredit 
                                    ? (isRecharge ? "bi bi-lightning-charge-fill" : "bi bi-arrow-counterclockwise") 
                                    : "bi bi-bag";
                
                const amountClass = isCredit ? "text-credit" : "text-debit";
                const amountPrefix = isCredit ? "+₹" : "−₹";

                const date = new Date(tx.createdAt).toLocaleDateString("en-IN", {
                    month: "short", day: "numeric", year: "numeric"
                });
                const time = new Date(tx.createdAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit", minute: "2-digit"
                });

                row.innerHTML = `
                    <div class="trans-left">
                        <div class="trans-icon-circle ${isCredit ? 'credit' : ''}">
                            <i class="${iconClass}"></i>
                        </div>
                        <div>
                            <span class="trans-title">${tx.description}</span>
                            <span class="trans-date">${date} · ${time}</span>
                        </div>
                    </div>
                    <span class="trans-amount ${amountClass}">${amountPrefix}${tx.amount.toLocaleString()}</span>
                `;
                transactionGroup.appendChild(row);
            });
        }
    }
});
