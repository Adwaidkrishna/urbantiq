document.addEventListener("DOMContentLoaded", async function () {
    const container = document.getElementById("cartItemsContainer");
    const metaEl = document.getElementById("cartMeta");
    const summaryCol = document.getElementById("cartSummaryCol");
    const loading = document.getElementById("cartLoading");

    // Check auth status
    const status = await window.AuthGuard.fetchStatus();
    if (!status.loggedIn) {
        window.location.href = "/login?redirect=/cart";
        return;
    }

    async function loadCart() {
        try {
            const res = await fetch(`/api/cart?t=${Date.now()}`);
            const data = await res.json();

            if (data.success) {
                renderCart(data.items);
            }
        } catch (err) {
            console.error("Cart loading error:", err);
            container.innerHTML = "<p class='text-center py-5'>Failed to load cart. Please try again.</p>";
        }
    }

    function renderCart(items) {
        if (!loading) return; // defensive
        loading.style.display = "none";

        if (!items || items.length === 0) {
            metaEl.textContent = "Your cart is currently empty";
            if (container) {
                container.classList.remove("col-lg-8");
                container.classList.add("col-12");
                container.innerHTML = `
                    <div class="cart-empty-state">
                        <div class="empty-cart-content">
                            <img src="/images/site/empty-cart-stroke.png" alt="Empty Cart" class="empty-cart-img">
                            <h2 class="empty-title">Your cart is empty</h2>
                            <p class="empty-text">Looks like you haven't added anything to your cart yet. Browse our collections to find something you like!</p>
                            <a href="/product" class="btn-start-shopping">Start Shopping</a>
                        </div>
                    </div>
                `;
            }
            if (summaryCol) summaryCol.style.display = "none";
            return;
        }

        if (container) {
            container.classList.remove("col-12");
            container.classList.add("col-lg-8");
            container.innerHTML = "";
        }

        if (metaEl) metaEl.textContent = `${items.length} item${items.length > 1 ? 's' : ''} in your cart`;
        if (summaryCol) summaryCol.style.display = "block";

        let subtotal = 0;
        let totalDiscount = 0;
        let validItemCount = 0;

        items.forEach(item => {
            const p = item.product;
            if (!p) return;
            validItemCount++;

            const variantIdStr = item.variant ? item.variant.toString() : "";
            const variant = p.variants ? p.variants.find(v => v._id.toString() === variantIdStr) : null;
            const variantName = variant ? variant.colorName : "Unknown";
            const image = (variant && variant.images && variant.images.length > 0) ? variant.images[0] : (p.images && p.images[0]) || "default.jpg";

            const itemPrice = p.offerPrice && p.offerPrice < p.price ? p.offerPrice : p.price;
            const discount = (p.offerPrice && p.offerPrice < p.price) ? (p.price - p.offerPrice) * item.quantity : 0;

            subtotal += p.price * item.quantity;
            totalDiscount += discount;

            const div = document.createElement("div");
            div.className = "cart-item";
            div.innerHTML = `
                <div class="cart-item-main">
                    <button class="cart-remove-btn" data-id="${item._id}" title="Remove item">
                        <i class="bi bi-trash3"></i>
                    </button>
                    <a href="/product/${p._id}" class="cart-item-img-wrap">
                        <img src="/images/products/${image}" alt="${p.name}">
                    </a>
                    <div class="cart-item-details">
                        <div class="cart-item-header">
                            <div>
                                <div class="cart-item-cat">${p.category ? p.category.name : 'Fashion'}</div>
                                <h4 class="cart-item-name">
                                    <a href="/product/${p._id}">${p.name}</a>
                                </h4>
                                <div class="cart-item-meta">
                                    Size: <span>${item.size}</span> &nbsp;·&nbsp; Color: <span>${variantName}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="cart-item-footer">
                            <div class="cart-qty-control">
                                <button class="cart-qty-btn" data-action="minus" data-id="${item._id}">
                                    <i class="bi bi-dash"></i>
                                </button>
                                <span class="cart-qty-val">${item.quantity}</span>
                                <button class="cart-qty-btn" data-action="plus" data-id="${item._id}">
                                    <i class="bi bi-plus"></i>
                                </button>
                            </div>
                            <div class="cart-item-pricing">
                                ${p.offerPrice < p.price ? `<span class="cart-item-price-old">₹${p.price.toLocaleString()}</span>` : ''}
                                <span class="cart-item-price">₹${itemPrice.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            if (container) container.appendChild(div);
        });

        if (validItemCount === 0) {
            // Recurse to empty state if no valid products found
            renderCart([]);
            return;
        }

        updateSummary(subtotal, totalDiscount, validItemCount);
        attachEvents();
    }

    function updateSummary(subtotal, discount, count) {
        const total = subtotal - discount + 25;

        const summaryCount = document.getElementById("summaryCount");
        const summarySubtotal = document.getElementById("summarySubtotal");
        const summaryDiscount = document.getElementById("summaryDiscount");
        const summaryTotal = document.getElementById("summaryTotal");
        const summarySavings = document.getElementById("summarySavings");

        if (summaryCount) summaryCount.textContent = `Subtotal (${count} item${count > 1 ? 's' : ''})`;
        if (summarySubtotal) summarySubtotal.textContent = `₹${subtotal.toLocaleString()}`;
        if (summaryDiscount) summaryDiscount.textContent = `−₹${discount.toLocaleString()}`;
        if (summaryTotal) summaryTotal.textContent = `₹${total.toLocaleString()}`;
        if (summarySavings) summarySavings.textContent = `₹${discount.toLocaleString()}`;

        const savingsTag = document.getElementById("summarySavingsTag");
        if (savingsTag) {
            savingsTag.style.display = discount > 0 ? "flex" : "none";
        }
    }

    function attachEvents() {
        document.querySelectorAll('.cart-qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                const delta = action === 'plus' ? 1 : -1;
                updateQuantity(btn.dataset.id, delta);
            });
        });

        document.querySelectorAll('.cart-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => removeItem(btn.dataset.id));
        });

        const checkoutBtn = document.querySelector('.cart-checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.replaceWith(checkoutBtn.cloneNode(true)); // remove old listeners
            const newCheckoutBtn = document.querySelector('.cart-checkout-btn');
            newCheckoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const res = await fetch("/api/cart/validate-stock");
                    const data = await res.json();
                    if (data.success) {
                        window.location.href = "/checkout-details";
                    } else {
                        let errorMsg = data.message;
                        if (data.problematicItems && data.problematicItems.length > 0) {
                            errorMsg += ":\n" + data.problematicItems.map(item => `- ${item.productName} (Available: ${item.availableStock})`).join("\n");
                        }
                        if (typeof Swal !== 'undefined') {
                            Swal.fire({ title: "Stock Issue", text: errorMsg, icon: "error", confirmButtonColor: "#000" });
                        } else { alert(errorMsg); }
                    }
                } catch (err) { alert("Checkout validation failed."); }
            });
        }
    }

    async function updateQuantity(itemId, delta) {
        try {
            const res = await fetch("/api/cart");
            const data = await res.json();
            const item = (data.items || []).find(i => i._id === itemId);
            if (!item) return;

            const newQty = item.quantity + delta;
            if (newQty < 1) return;

            const updateRes = await fetch("/api/cart/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId, quantity: newQty })
            });
            const result = await updateRes.json();
            if (result.success) {
                loadCart();
            } else if (typeof Swal !== 'undefined') {
                Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: result.message, showConfirmButton: false, timer: 3000 });
            } else { alert(result.message); }
        } catch (err) { console.error("Update qty error:", err); }
    }

    async function removeItem(itemId) {
        try {
            const res = await fetch(`/api/cart/remove/${itemId}`, { method: "DELETE" });
            if ((await res.json()).success) loadCart();
        } catch (err) { console.error("Remove item error:", err); }
    }

    loadCart();
});
