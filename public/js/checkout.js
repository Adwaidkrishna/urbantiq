document.addEventListener("DOMContentLoaded", function () {
    // 1. CHECKOUT DETAILS — Capture and Store Shipping Info
    const detailsBtn = document.querySelector('a.ck-action-btn[href="/checkout-summary"]');
    if (detailsBtn) {
        // Pre-fill if exists
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

        detailsBtn.addEventListener("click", function (e) {
            e.preventDefault();
            if (validateForm()) {
                const addressData = {
                    fullName: document.getElementById("fullName").value.trim(),
                    email: document.getElementById("email").value.trim(),
                    phone: document.getElementById("phone").value.trim(),
                    addressLine1: document.getElementById("addr1").value.trim(),
                    addressLine2: document.getElementById("addr2").value.trim(),
                    city: document.getElementById("city").value.trim(),
                    state: document.getElementById("state").value.trim(),
                    postalCode: document.getElementById("pincode").value.trim(),
                    country: document.getElementById("country").value.trim()
                };
                localStorage.setItem('checkoutAddress', JSON.stringify(addressData));
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

        fetchCartSummary(onPaymentPage);
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
            // Fix: Added /images/products/ prefix for correct image rendering
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
            payNowBtn.innerHTML = `Placing Order... <span class="spinner-border spinner-border-sm ms-2"></span>`;
            payNowBtn.classList.add('is-loading');
            payNowBtn.style.pointerEvents = 'none';

            const checkedInput = document.querySelector('input[name="payMethod"]:checked');
            if (!checkedInput) {
                payNowBtn.innerHTML = originalBtnHtml;
                payNowBtn.classList.remove('is-loading');
                payNowBtn.style.pointerEvents = 'auto';
                alert("Please select a payment method.");
                return;
            }
            // Map frontend values to DB enum values: "COD" or "Online"
            const rawMethod = checkedInput.value.toLowerCase();
            const payMethod = rawMethod === 'cod' ? 'COD' : 'Online';
            const address = JSON.parse(localStorage.getItem('checkoutAddress'));
            if (!address) {
                alert("Shipping address missing. Please go back and fill your details.");
                return;
            }
            const total = localStorage.getItem('checkoutTotal');

            try {
                const cartRes = await fetch("/api/cart");
                const cartData = await cartRes.json();

                if (!cartData.items || cartData.items.length === 0) {
                    alert("Your cart is empty.");
                    return;
                }

                // Compute price totals from cart
                let subtotal = 0;
                let finalTotal = 0;
                cartData.items.forEach(item => {
                    if (!item.product) return; // Skip deleted products
                    const basePrice = item.product.price || 0;
                    const offerPrice = item.product.offerPrice;
                    const itemPrice = (offerPrice && offerPrice < basePrice) ? offerPrice : basePrice;
                    subtotal += basePrice * item.quantity;
                    finalTotal += itemPrice * item.quantity;
                });
                const discount = subtotal - finalTotal;

                // Map items with correct price field, filtering out deleted products
                const orderItems = cartData.items
                    .filter(item => item.product) // Skip deleted products
                    .map(item => {
                        const basePrice = item.product.price || 0;
                        const offerPrice = item.product.offerPrice;
                        const itemPrice = (offerPrice && offerPrice < basePrice) ? offerPrice : basePrice;
                        return {
                            product: item.product._id || item.product,
                            variant: item.variant._id || item.variant,
                            size: item.size,
                            quantity: item.quantity,
                            price: itemPrice
                        };
                    });

                if (orderItems.length === 0) {
                    payNowBtn.innerHTML = originalBtnHtml;
                    payNowBtn.classList.remove('is-loading');
                    payNowBtn.style.pointerEvents = 'auto';
                    alert("Your cart is empty or contains unavailable items.");
                    return;
                }

                // ─── VALIDATE STOCK BEFORE PLACING ORDER ──────────────────────────
                const validateRes = await fetch("/api/orders/validate-stock", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ items: orderItems })
                });

                const validateData = await validateRes.json();
                if (!validateRes.ok) {
                    payNowBtn.innerHTML = originalBtnHtml;
                    payNowBtn.classList.remove('is-loading');
                    payNowBtn.style.pointerEvents = 'auto';
                    alert(validateData.message || "One or more items are out of stock.");
                    return;
                }

                const response = await fetch("/api/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items: orderItems,
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
                    // Add a tiny delay to show the "success" feel
                    setTimeout(() => {
                        window.location.href = `/order-success?id=${orderResult.orderId}`;
                    }, 800);
                } else {
                    payNowBtn.innerHTML = originalBtnHtml;
                    payNowBtn.classList.remove('is-loading');
                    payNowBtn.style.pointerEvents = 'auto';
                    alert(orderResult.message || "Failed to place order");
                }
            } catch (err) {
                payNowBtn.innerHTML = originalBtnHtml;
                payNowBtn.classList.remove('is-loading');
                payNowBtn.style.pointerEvents = 'auto';
                console.error("Order placement error:", err);
                alert("Error placing order. Please try again.");
            }
        });
    }
});
