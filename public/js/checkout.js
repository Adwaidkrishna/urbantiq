document.addEventListener("DOMContentLoaded", function () {
    // 1. CHECKOUT DETAILS — Capture and Store Shipping Info
    const detailsBtn = document.querySelector('#continueToSummaryBtn') || document.querySelector('a.ck-action-btn[href="/checkout-summary"]');
    if (detailsBtn) {

        // Load saved addresses from account and auto-fill
        let selectedSavedAddressId = null;

        async function loadSavedAddresses() {
            try {
                const res = await fetch("/api/user-profile/addresses/default");
                const data = await res.json();

                const allRes = await fetch("/api/user-profile/addresses");
                const allData = await allRes.json();
                const addresses = allData.addresses || [];

                // Auto-fill name/email from user profile
                if (data.name) {
                    const nameEl = document.getElementById("fullName");
                    if (nameEl && !nameEl.value) nameEl.value = data.name;
                }
                if (data.email) {
                    const emailEl = document.getElementById("email");
                    if (emailEl && !emailEl.value) emailEl.value = data.email;
                }

                if (addresses.length > 0) {
                    const section = document.getElementById("savedAddrSection");
                    const listEl  = document.getElementById("savedAddrList");
                    if (section) section.style.display = "block";

                    listEl.innerHTML = addresses.map(addr => `
                        <label class="saved-addr-option d-flex align-items-start gap-3 p-3 border rounded-3 cursor-pointer ${addr.isDefault ? 'selected-addr' : ''}" 
                               style="cursor:pointer; background:${addr.isDefault ? '#f5f5f7' : '#fff'}; border-color:${addr.isDefault ? '#000 !important' : '#dee2e6'} !important;"
                               data-id="${addr._id}">
                            <input type="radio" name="savedAddr" value="${addr._id}" ${addr.isDefault ? 'checked' : ''} style="margin-top:3px; accent-color:#000;">
                            <div>
                                <div class="fw-bold small">${addr.fullName} <span class="badge bg-light text-dark ms-1" style="font-size:0.65rem;">${addr.label}</span> ${addr.isDefault ? '<span class="badge bg-dark ms-1" style="font-size:0.6rem;">Default</span>' : ''}</div>
                                <div class="text-muted small mt-1">${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}, ${addr.state} — ${addr.postalCode}</div>
                                <div class="text-muted small">${addr.phone}</div>
                            </div>
                        </label>
                    `).join("");

                    // Click to apply saved address
                    listEl.querySelectorAll(".saved-addr-option").forEach(card => {
                        card.addEventListener("click", () => {
                            const addr = addresses.find(a => a._id === card.dataset.id);
                            if (!addr) return;
                            selectedSavedAddressId = addr._id;
                            // Fill the hidden form fields
                            fillFormFromAddress(addr);
                            // Visually highlight
                            listEl.querySelectorAll(".saved-addr-option").forEach(c => {
                                c.style.background = "#fff";
                                c.style.borderColor = "#dee2e6";
                            });
                            card.style.background = "#f5f5f7";
                        });
                    });

                    // Auto-apply default
                    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
                    if (defaultAddr) {
                        selectedSavedAddressId = defaultAddr._id;
                        fillFormFromAddress(defaultAddr);
                    }

                    // "Enter a different address" — clear form and scroll
                    document.getElementById("useNewAddrBtn")?.addEventListener("click", () => {
                        selectedSavedAddressId = null;
                        clearForm();
                        document.getElementById("manualAddrForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    });
                }
            } catch (err) {
                // No addresses or not logged in — just show manual form
            }
        }

        function fillFormFromAddress(addr) {
            const fields = {
                fullName: addr.fullName,
                phone:    addr.phone,
                addr1:    addr.addressLine1,
                addr2:    addr.addressLine2 || "",
                city:     addr.city,
                state:    addr.state,
                pincode:  addr.postalCode
            };
            for (const [id, val] of Object.entries(fields)) {
                const el = document.getElementById(id);
                if (el) el.value = val;
            }
        }

        function clearForm() {
            ["fullName","phone","addr1","addr2","city","state","pincode"].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = "";
            });
        }

        // Pre-fill from localStorage if returning to page
        const savedAddr = JSON.parse(localStorage.getItem('checkoutAddress') || '{}');
        if (savedAddr.fullName) {
            document.getElementById("fullName").value = savedAddr.fullName;
            document.getElementById("email").value = savedAddr.email;
            document.getElementById("phone").value = savedAddr.phone;
            document.getElementById("addr1").value = savedAddr.addressLine1;
            document.getElementById("addr2").value = savedAddr.addressLine2 || "";
            document.getElementById("city").value = savedAddr.city;
            document.getElementById("state").value = savedAddr.state;
            document.getElementById("pincode").value = savedAddr.postalCode;
            document.getElementById("country").value = savedAddr.country;
        }

        loadSavedAddresses();

        detailsBtn.addEventListener("click", async function (e) {
            e.preventDefault();
            if (validateForm()) {
                const addressData = {
                    fullName:     document.getElementById("fullName").value.trim(),
                    email:        document.getElementById("email").value.trim(),
                    phone:        document.getElementById("phone").value.trim(),
                    addressLine1: document.getElementById("addr1").value.trim(),
                    addressLine2: document.getElementById("addr2").value.trim(),
                    city:         document.getElementById("city").value.trim(),
                    state:        document.getElementById("state").value.trim(),
                    postalCode:   document.getElementById("pincode").value.trim(),
                    country:      document.getElementById("country").value.trim()
                };
                localStorage.setItem('checkoutAddress', JSON.stringify(addressData));

                // Save to account if checkbox is checked and it's not a saved address
                const saveCheckbox = document.getElementById("setDefault");
                if (saveCheckbox?.checked && !selectedSavedAddressId) {
                    try {
                        await fetch("/api/user-profile/addresses", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ...addressData, label: "Home", isDefault: true })
                        });
                    } catch (err) {
                        // Silent fail — address save is optional
                    }
                }

                window.location.href = "/checkout-summary";
            }
        });
    }

    function validateForm() {
        const fields = [
            { id: "fullName", label: "Full Name" },
            { id: "email", label: "Email Address", pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
            { id: "phone", label: "Phone Number", pattern: /^\+?[0-9]{10,14}$/ },
            { id: "addr1", label: "Address Line 1" },
            { id: "city", label: "City" },
            { id: "state", label: "State" },
            { id: "pincode", label: "Pincode", pattern: /^[0-9]{6}$/ }
        ];

        let isValid = true;
        fields.forEach(f => {
            const input = document.getElementById(f.id);
            const value = input.value.trim();
            const parent = input.parentElement;

            // Remove existing error
            const existingError = parent.querySelector(".ck-error-msg");
            if (existingError) existingError.remove();
            input.classList.remove("ck-input-error");

            if (!value) {
                showError(input, `${f.label} is required`);
                isValid = false;
            } else if (f.pattern && !f.pattern.test(value)) {
                showError(input, `Invalid ${f.label} format`);
                isValid = false;
            }
        });

        return isValid;
    }

    function showError(input, msg) {
        input.classList.add("ck-input-error");
        const div = document.createElement("div");
        div.className = "ck-error-msg";
        div.style.color = "#ff3b30";
        div.style.fontSize = "0.75rem";
        div.style.marginTop = "4px";
        div.style.fontWeight = "600";
        div.textContent = msg;
        input.parentElement.appendChild(div);
    }

    // 2. CHECKOUT SUMMARY — Populate with stored info and cart
    const onSummaryPage = window.location.pathname.includes('checkout-summary');
    const onPaymentPage = window.location.pathname.includes('checkout-payment');

    if (onSummaryPage || onPaymentPage) {
        if (onSummaryPage) {
            const addr = JSON.parse(localStorage.getItem('checkoutAddress') || '{}');
            const summaryName = document.getElementById("summaryName");
            const summaryAddress = document.getElementById("summaryAddress");

            if (addr.fullName) {
                summaryName.textContent = addr.fullName;
                summaryAddress.innerHTML = `${addr.addressLine1}<br>${addr.city}, ${addr.state} - ${addr.postalCode}`;
            }
        }

        if (onPaymentPage) {
            fetchWalletBalance();
        }
        fetchCartSummary(onPaymentPage);
    }

    async function fetchWalletBalance() {
        try {
            const res = await fetch("/api/user-profile/wallet");
            const data = await res.json();
            const balanceDisp = document.getElementById("walletBalanceDisplay");
            if (balanceDisp) balanceDisp.textContent = `₹${(data.balance || 0).toLocaleString()}`;
            
            const walletInput = document.querySelector('input[value="wallet"]');
            const total = Number(localStorage.getItem('checkoutTotal') || 0);
            
            if (data.balance < total) {
                const walletOpt = document.getElementById("opt-wallet");
                walletOpt.classList.add("disabled");
                walletOpt.title = "Insufficient balance";
                walletInput.disabled = true;
                walletOpt.style.opacity = '0.6';
                walletOpt.style.pointerEvents = 'none';
            }
        } catch (err) {
            console.error("Error fetching wallet balance", err);
        }
    }

    async function fetchCartSummary(isPaymentPage = false) {
        try {
            const res = await fetch("/api/cart");
            const data = await res.json();
            if (data.items) {
                if (isPaymentPage) {
                    renderMiniSummary(data.items);
                } else {
                    renderSummaryItems(data.items);
                }
                updatePriceSummary(data.items);
            }
        } catch (err) { console.error("Error fetching cart summary", err); }
    }

    function renderMiniSummary(items) {
        const container = document.getElementById('miniSummaryList');
        if (!container) return;
        container.innerHTML = '';

        items.forEach(item => {
            if (!item.product) return; // Skip if product was deleted

            const variantId = item.variant?._id || item.variant;
            const variant = item.product.variants?.find(v => (v._id || v).toString() === variantId.toString());
            const imageUrl = variant && variant.images && variant.images.length > 0 ? `/images/products/${variant.images[0]}` : '/images/user/phoodie.jpeg';

            const div = document.createElement('div');
            div.className = 'ck-mini-item';
            div.innerHTML = `
                <img src="${imageUrl}" alt="${item.product.name}" class="ck-mini-img">
                <div class="ck-mini-info">
                    <div class="ck-mini-name">${item.product.name}</div>
                    <div class="ck-mini-meta">
                        Qty: ${item.quantity} · Size: ${item.size} · 
                        <span class="ck-color-circle" title="${variant.colorName || 'Color'}" style="background-color: ${variant.color}; display: inline-block; width: 10px; height: 10px; border-radius: 50%; border: 1px solid #ddd; margin-left: 4px; vertical-align: middle;"></span>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    function renderSummaryItems(items) {
        const itemsContainer = document.getElementById('summaryItemsList');
        if (!itemsContainer) return;

        itemsContainer.innerHTML = '';

        items.forEach(item => {
            if (!item.product) return; // Skip if product was deleted

            const variantId = item.variant?._id || item.variant;
            const variant = item.product.variants?.find(v => (v._id || v).toString() === variantId.toString());
            const imageUrl = variant && variant.images.length > 0 ? `/images/products/${variant.images[0]}` : '/images/user/phoodie.jpeg';
            const catName = item.product.category?.name || 'Fashion';

            // Use offerPrice if available, otherwise use regular price
            const itemPrice = (item.product.offerPrice && item.product.offerPrice < item.product.price)
                ? item.product.offerPrice
                : item.product.price;
            const itemTotalPrice = (itemPrice * item.quantity).toLocaleString();

            const div = document.createElement('div');
            div.className = 'ck-item';
            div.innerHTML = `
                <img src="${imageUrl}" alt="${item.product.name}" class="ck-item-img">
                <div class="ck-item-info">
                    <div class="ck-item-cat">${catName}</div>
                    <div class="ck-item-name">${item.product.name}</div>
                    <div class="ck-item-meta">
                        Size: <span>${item.size}</span> &nbsp;·&nbsp; 
                        Qty: <span>${item.quantity}</span> &nbsp;·&nbsp; 
                        Color: <span class="ck-color-circle" title="${variant.colorName || 'Color'}" style="background-color: ${variant.color}; display: inline-block; width: 14px; height: 14px; border-radius: 50%; border: 1px solid #ddd; vertical-align: middle; margin-bottom: 2px;"></span>
                    </div>
                </div>
                <div class="ck-item-price-col">
                    <span class="ck-item-price">₹${itemTotalPrice}</span>
                </div>
            `;
            itemsContainer.appendChild(div);
        });
    }

    function updatePriceSummary(items) {
        // Correctly calculate subtotal and discount
        let subtotal = 0;
        let totalDiscount = 0;

        items.forEach(item => {
            if (!item.product) return; // Skip if product was deleted

            const p = item.product;
            subtotal += p.price * item.quantity;
            if (p.offerPrice && p.offerPrice < p.price) {
                totalDiscount += (p.price - p.offerPrice) * item.quantity;
            }
        });

        const finalTotal = subtotal - totalDiscount;

        const subtotalEl = document.querySelector('.ck-price-list .ck-price-row:nth-child(1) span:last-child');
        if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString()}`;

        const discountEl = document.querySelector('.ck-discount-val');
        if (discountEl) discountEl.textContent = `−₹${totalDiscount.toLocaleString()}`;

        const totalValEl = document.querySelector('.ck-total-val');
        if (totalValEl) totalValEl.textContent = `₹${finalTotal.toLocaleString()}`;

        // Payment Page Specifics
        const miniSub = document.getElementById('miniSubtotal');
        if (miniSub) miniSub.textContent = `₹${subtotal.toLocaleString()}`;

        const miniDisc = document.getElementById('miniDiscount');
        if (miniDisc) miniDisc.textContent = `−₹${totalDiscount.toLocaleString()}`;

        const payAmt = document.getElementById('payNowAmount');
        if (payAmt) payAmt.textContent = `₹${finalTotal.toLocaleString()}`;

        localStorage.setItem('checkoutTotal', finalTotal);
    }

    // 3. PAYMENT OPTION SELECTION
    const options = document.querySelectorAll('.ck-payment-option');
    if (options.length) {
        const totalAmount = localStorage.getItem('checkoutTotal') || "0";
        const formattedAmt = `₹${Number(totalAmount).toLocaleString()}`;

        const totalDisplay = document.getElementById("finalPaymentTotal");
        if (totalDisplay) totalDisplay.textContent = formattedAmt;

        const payBtn = document.querySelector('a.ck-action-btn[href="/order-success"]');
        const payAmtSpan = document.getElementById("payNowAmount");

        options.forEach(opt => {
            opt.addEventListener('click', function () {
                options.forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                const radio = this.querySelector('input[type="radio"]');
                radio.checked = true;

                // Dynamic Button Text Logic
                if (payBtn) {
                    if (radio.value === 'cod') {
                        payBtn.innerHTML = `Place Order <i class="bi bi-check-circle-fill"></i>`;
                    } else if (radio.value === 'wallet') {
                        payBtn.innerHTML = `Pay using Wallet <i class="bi bi-wallet2"></i>`;
                    } else {
                        payBtn.innerHTML = `Pay <span id="payNowAmount">${formattedAmt}</span> <i class="bi bi-lock-fill"></i>`;
                    }
                }
            });
        });

        // Set Initial Button Text based on default checked option
        const initialRadio = document.querySelector('input[name="payMethod"]:checked');
        if (initialRadio && payBtn) {
            if (initialRadio.value === 'cod') {
                payBtn.innerHTML = `Place Order <i class="bi bi-check-circle-fill"></i>`;
            } else if (initialRadio.value === 'wallet') {
                payBtn.innerHTML = `Pay using Wallet <i class="bi bi-wallet2"></i>`;
            } else {
                payBtn.innerHTML = `Pay <span id="payNowAmount">${formattedAmt}</span> <i class="bi bi-lock-fill"></i>`;
            }
        }
    }

    // 4. PLACE ORDER — Final Action
    const payNowBtn = document.querySelector('a.ck-action-btn[href="/order-success"]');
    if (payNowBtn && window.location.pathname.includes('checkout-payment')) {
        payNowBtn.addEventListener("click", async function (e) {
            e.preventDefault();
            const originalBtnHtml = payNowBtn.innerHTML;

            const checkedInput = document.querySelector('input[name="payMethod"]:checked');
            if (!checkedInput) {
                AuthGuard.showToast("Please select a payment method.", "error");
                return;
            }

            const rawMethod = checkedInput.value.toLowerCase();
            const payMethod = rawMethod === 'cod' ? 'COD' : (rawMethod === 'wallet' ? 'Wallet' : 'Online');
            const address = JSON.parse(localStorage.getItem('checkoutAddress'));
            if (!address) {
                AuthGuard.showToast("Shipping address missing. Please go back.", "error");
                return;
            }

            try {
                // 1. Initial Loading State
                payNowBtn.innerHTML = `Validating... <span class="spinner-border spinner-border-sm ms-2"></span>`;
                payNowBtn.classList.add('is-loading');
                payNowBtn.style.pointerEvents = 'none';

                const cartRes = await fetch("/api/cart");
                const cartData = await cartRes.json();

                if (!cartData.items || cartData.items.length === 0) {
                    throw new Error("Your cart is empty.");
                }

                // 2. Compute price totals & map items
                let subtotal = 0;
                let finalTotal = 0;
                const orderItems = cartData.items
                    .filter(item => item.product && item.variant)
                    .map(item => {
                        const basePrice = item.product.price || 0;
                        const offerPrice = item.product.offerPrice;
                        const itemPrice = (offerPrice && offerPrice < basePrice) ? offerPrice : basePrice;
                        subtotal += basePrice * item.quantity;
                        finalTotal += itemPrice * item.quantity;
                        return {
                            product: item.product._id || item.product,
                            variant: item.variant._id || item.variant,
                            size: item.size,
                            quantity: item.quantity,
                            price: itemPrice
                        };
                    });

                const discount = subtotal - finalTotal;

                // 3. Validate stock
                const validateRes = await fetch("/api/orders/validate-stock", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ items: orderItems })
                });

                if (!validateRes.ok) {
                    const validateData = await validateRes.json();
                    throw new Error(validateData.message || "One or more items are out of stock.");
                }

                // 4. Handle based on Payment Method
                if (payMethod === 'Online') {
                    payNowBtn.innerHTML = `Initializing Payment... <span class="spinner-border spinner-border-sm ms-2"></span>`;

                    // Create Razorpay Order
                    const rzpOrderRes = await fetch("/api/payment/create-order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ amount: finalTotal })
                    });
                    const rzpOrderData = await rzpOrderRes.json();

                    if (!rzpOrderRes.ok) throw new Error(rzpOrderData.message || "Failed to initialize Razorpay order");

                    const options = {
                        key: "rzp_test_SYJDs3aCK4Cn6M", // Final Key ID
                        amount: rzpOrderData.order.amount,
                        currency: "INR",
                        name: "URBANTIQ",
                        description: "Purchase Payment",
                        order_id: rzpOrderData.order.id,
                        handler: async function (response) {
                            try {
                                payNowBtn.innerHTML = `Verifying... <span class="spinner-border spinner-border-sm ms-2"></span>`;
                                // Verify Payment on Server
                                const verifyRes = await fetch("/api/payment/verify", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(response)
                                });

                                if (!verifyRes.ok) throw new Error("Payment verification failed");

                                // Place Order in DB after successful payment
                                await finalizeOrder(orderItems, address, payMethod, subtotal, discount, finalTotal);
                            } catch (err) {
                                AuthGuard.showToast(err.message, "error");
                                resetBtn(payNowBtn, originalBtnHtml);
                            }
                        },
                        modal: {
                            ondismiss: function () {
                                resetBtn(payNowBtn, originalBtnHtml);
                            }
                        },
                        prefill: {
                            name: address.fullName,
                            email: address.email,
                            contact: address.phone
                        },
                        theme: {
                            color: "#000000"
                        }
                    };

                    const rzp = new window.Razorpay(options);
                    rzp.open();
                } else if (payMethod === 'Wallet') {
                    // Wallet Flow
                    payNowBtn.innerHTML = `Processing Wallet Payment... <span class="spinner-border spinner-border-sm ms-2"></span>`;
                    await finalizeOrder(orderItems, address, payMethod, subtotal, discount, finalTotal);
                } else {
                    // COD Flow
                    payNowBtn.innerHTML = `Placing Order... <span class="spinner-border spinner-border-sm ms-2"></span>`;
                    await finalizeOrder(orderItems, address, payMethod, subtotal, discount, finalTotal);
                }

            } catch (err) {
                console.error("Order process error:", err);
                AuthGuard.showToast(err.message || "Something went wrong. Please try again.", "error");
                resetBtn(payNowBtn, originalBtnHtml);
            }
        });

        async function finalizeOrder(items, address, payMethod, subtotal, discount, finalTotal) {
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items,
                    shippingAddress: address,
                    paymentMethod: payMethod,
                    totalPrice: subtotal,
                    discount: discount,
                    shippingCharges: 0,
                    finalAmount: finalTotal
                })
            });

            const orderResult = await response.json();
            if (response.ok) {
                localStorage.removeItem('checkoutAddress');
                localStorage.removeItem('checkoutTotal');
                setTimeout(() => {
                    window.location.href = `/order-success?id=${orderResult.orderId}`;
                }, 800);
            } else {
                throw new Error(orderResult.message || "Failed to place order");
            }
        }

        function resetBtn(btn, originalHtml) {
            btn.innerHTML = originalHtml;
            btn.classList.remove('is-loading');
            btn.style.pointerEvents = 'auto';
        }
    }
});
