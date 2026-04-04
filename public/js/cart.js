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
            const res = await fetch("/api/cart");
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
        loading.style.display = "none";
        
        if (items.length === 0) {
            metaEl.textContent = "No items in your cart";
            container.classList.remove("col-lg-8");
            container.classList.add("col-12");
            container.innerHTML = `
                <div class="cart-empty-state">
                    <img src="/images/site/empty-cart-stroke.png" alt="Empty Cart" class="empty-cart-img">
                    <h2 class="empty-title">Your cart is empty</h2>
                    <p class="empty-text">Looks like you haven't added anything yet. Explore our latest collections and find your style.</p>
                    <a href="/product" class="btn-start-shopping">Start Shopping</a>
                </div>
            `;
            summaryCol.style.display = "none";
            return;
        }

        container.classList.remove("col-12");
        container.classList.add("col-lg-8");

        metaEl.textContent = `${items.length} item${items.length > 1 ? 's' : ''} in your cart`;
        summaryCol.style.display = "block";
        container.innerHTML = "";

        let subtotal = 0;
        let totalDiscount = 0;

        items.forEach(item => {
            const p = item.product;
            if(!p) return;

            // Find variant details — compare as strings to avoid object-ref mismatch
            const variantIdStr = item.variant ? item.variant.toString() : "";
            const variant = p.variants.find(v => v._id.toString() === variantIdStr);
            const variantName = variant ? variant.colorName : "Unknown";
            const image = (variant && variant.images && variant.images[0]) ? variant.images[0] : "";
            
            const itemPrice = p.offerPrice && p.offerPrice < p.price ? p.offerPrice : p.price;
            const discount = (p.offerPrice && p.offerPrice < p.price) ? (p.price - p.offerPrice) * item.quantity : 0;
            
            subtotal += p.price * item.quantity;
            totalDiscount += discount;

            const div = document.createElement("div");
            div.className = "cart-item";
            div.innerHTML = `
                <a href="/product/${p._id}" class="cart-item-img-wrap">
                    <img src="/images/products/${image}" alt="${p.name}">
                </a>
                <div class="cart-item-details">
                    <div class="cart-item-top">
                        <div>
                            <div class="cart-item-cat">${p.category ? p.category.name : 'Uncategorized'}</div>
                            <h4 class="cart-item-name">
                                <a href="/product/${p._id}">${p.name}</a>
                            </h4>
                            <div class="cart-item-meta">Size: <span>${item.size}</span> &nbsp;·&nbsp; Colour: <span>${variantName}</span></div>
                        </div>
                        <button class="cart-remove-btn" data-id="${item._id}" title="Remove item" aria-label="Remove">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                    <div class="cart-item-bottom">
                        <div class="cart-item-price-wrap">
                            <span class="cart-item-price">₹${itemPrice}</span>
                            ${p.offerPrice < p.price ? `<span class="cart-item-price-old">₹${p.price}</span>` : ''}
                        </div>
                        <div class="cart-qty-wrap">
                            <button class="cart-qty-btn" data-action="minus" data-id="${item._id}" aria-label="Decrease">
                                <i class="bi bi-dash"></i>
                            </button>
                            <span class="cart-qty-val">${item.quantity}</span>
                            <button class="cart-qty-btn" data-action="plus" data-id="${item._id}" aria-label="Increase">
                                <i class="bi bi-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });

        updateSummary(subtotal, totalDiscount, items.length);
        attachEvents();
    }

    function updateSummary(subtotal, discount, count) {
        const total = subtotal - discount + 25; // +25 platform fee
        
        document.getElementById("summaryCount").textContent = `Subtotal (${count} item${count > 1 ? 's' : ''})`;
        document.getElementById("summarySubtotal").textContent = `₹${subtotal}`;
        document.getElementById("summaryDiscount").textContent = `−₹${discount}`;
        document.getElementById("summaryTotal").textContent = `₹${total}`;
        document.getElementById("summarySavings").textContent = `₹${discount}`;
        
        const savingsTag = document.getElementById("summarySavingsTag");
        if(discount > 0) {
            savingsTag.style.display = "block";
        } else {
            savingsTag.style.display = "none";
        }
    }

    function attachEvents() {
        // Quantity Plus
        document.querySelectorAll('.cart-qty-btn[data-action="plus"]').forEach(btn => {
            btn.addEventListener('click', () => updateQuantity(btn.dataset.id, 1));
        });

        // Quantity Minus
        document.querySelectorAll('.cart-qty-btn[data-action="minus"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const current = parseInt(btn.nextElementSibling.textContent);
                if(current > 1) updateQuantity(btn.dataset.id, -1);
            });
        });

        // Remove
        document.querySelectorAll('.cart-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => removeItem(btn.dataset.id));
        });
    }

    async function updateQuantity(itemId, delta) {
        try {
            // Optimistic UI could be here, but let's keep it simple first
            const res = await fetch("/api/cart");
            const data = await res.json();
            const item = data.items.find(i => i._id === itemId);
            if(!item) return;

            const newQty = item.quantity + delta;
            if(newQty < 1) return;

            const updateRes = await fetch("/api/cart/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId, quantity: newQty })
            });
            if((await updateRes.json()).success) {
                loadCart();
            }
        } catch(err) {
            console.error("Update qty error:", err);
        }
    }

    async function removeItem(itemId) {
        try {
            const res = await fetch(`/api/cart/remove/${itemId}`, {
                method: "DELETE"
            });
            if((await res.json()).success) {
                loadCart();
            }
        } catch(err) {
            console.error("Remove item error:", err);
        }
    }

    loadCart();
});
