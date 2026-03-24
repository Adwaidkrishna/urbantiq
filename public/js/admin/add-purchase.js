/* ===================================================================
   add-purchase.js
   Two-step purchase flow:
     STEP 1 → POST /api/admin/purchases   (parent)
     STEP 2 → POST /api/admin/purchase-items  (child, one per item)
=================================================================== */
(function () {

  // ── State ─────────────────────────────────────────────────────────
  let itemCount = 0;
  const items   = [];   // sparse array; null = removed row

  // ── DOM refs ──────────────────────────────────────────────────────
  const supplierSelect    = document.getElementById('purchase-supplier');
  const invoiceInput      = document.getElementById('purchase-invoice');
  const dateInput         = document.getElementById('purchase-date');
  const itemsContainer    = document.getElementById('items-container');
  const addItemBtn        = document.getElementById('add-item-btn');
  const submitBtn         = document.getElementById('submit-purchase-btn');
  const grandTotalDisplay = document.getElementById('grand-total-display');
  const errorBox          = document.getElementById('purchase-error');

  // Guard: stop if we're not on the add-purchase page
  if (!supplierSelect || !itemsContainer) return;

  // ── Kick off immediately ──────────────────────────────────────────
  addItemRow();      // show one empty row right away
  loadSuppliers();   // populate supplier dropdown async

  // ── Load Suppliers ────────────────────────────────────────────────
  async function loadSuppliers() {
    try {
      const res  = await fetch('/api/admin/suppliers/list');
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        supplierSelect.innerHTML = '<option value="">No suppliers found</option>';
        return;
      }

      supplierSelect.innerHTML = '<option value="">— Select Supplier —</option>';
      data.forEach(s => {
        const opt = document.createElement('option');
        opt.value       = s._id;
        opt.textContent = s.companyName || s.name;
        supplierSelect.appendChild(opt);
      });
    } catch {
      supplierSelect.innerHTML = '<option value="">Could not load suppliers</option>';
    }
  }

  // ── Add Item Row ──────────────────────────────────────────────────
  function addItemRow() {
    const idx = itemCount++;
    items[idx] = { productName: '', quantity: 1, costPrice: 0, sellingPrice: 0 };

    const row = document.createElement('div');
    row.className   = 'purchase-item-row';
    row.dataset.idx = idx;
    row.style.cssText = [
      'display:grid',
      'grid-template-columns:2fr 1fr 1fr 1fr 1fr 44px',
      'gap:10px',
      'align-items:flex-end',
      'margin-bottom:12px',
      'padding-bottom:12px',
      'border-bottom:1px solid #F3F4F6',
    ].join(';');

    // ── Simple Product Name input cell ─────────────────────────────
    const productCell = document.createElement('div');
    const label = document.createElement('label');
    label.className   = 'form-label-admin';
    label.textContent = 'Product Name';

    const productInp = document.createElement('input');
    productInp.type = 'text';
    productInp.className = 'form-control-admin item-product-name';
    productInp.dataset.idx = idx;
    productInp.placeholder = 'Enter Product Name';

    productCell.appendChild(label);
    productCell.appendChild(productInp);

    // ── Number field helper
    function numCell(labelText, cls, opts = {}) {
      const cell  = document.createElement('div');
      const lbl   = document.createElement('label');
      lbl.className   = 'form-label-admin';
      lbl.textContent = labelText;

      const inp = document.createElement('input');
      inp.type      = 'number';
      inp.className = `form-control-admin ${cls}`;
      inp.dataset.idx = idx;
      Object.assign(inp, opts);

      cell.appendChild(lbl);
      cell.appendChild(inp);
      return { cell, inp };
    }

    const { cell: qtyCell,  inp: qtyInp  } = numCell('Quantity',          'item-qty',  { min: 1, value: 1,    placeholder: '1' });
    const { cell: costCell, inp: costInp  } = numCell('Cost Price (₹)',    'item-cost', { min: 0, step: 0.01,  placeholder: '0.00' });
    const { cell: sellCell, inp: sellInp  } = numCell('Selling Price (₹)', 'item-sell', { min: 0, step: 0.01,  placeholder: '0.00' });

    // Line total (read-only)
    const { cell: totalCell, inp: totalInp } = numCell('Line Total (₹)', 'item-total', { value: '0.00', disabled: true });
    totalInp.style.cssText = 'background:#F9FAFB; cursor:not-allowed;';

    // Remove button cell
    const removeCell = document.createElement('div');
    removeCell.style.cssText = 'display:flex; align-items:flex-end; padding-bottom:1px;';
    const removeBtn = document.createElement('button');
    removeBtn.type      = 'button';
    removeBtn.className = 'btn-admin-danger btn-admin-icon remove-item-btn';
    removeBtn.dataset.idx = idx;
    removeBtn.style.cssText = 'width:38px; height:38px;';
    removeBtn.title     = 'Remove item';
    removeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`;
    removeCell.appendChild(removeBtn);

    // Assemble row
    [productCell, qtyCell, costCell, sellCell, totalCell, removeCell].forEach(c => row.appendChild(c));
    itemsContainer.appendChild(row);

    // Wire events used to calculate total and update grand total
    const onChange = () => {
      if (!items[idx]) return;
      items[idx].productName  = productInp.value.trim();
      items[idx].quantity     = parseFloat(qtyInp.value)  || 0;
      items[idx].costPrice    = parseFloat(costInp.value) || 0;
      items[idx].sellingPrice = parseFloat(sellInp.value) || 0;
      totalInp.value = (items[idx].quantity * items[idx].costPrice).toFixed(2);
      recalcGrandTotal();
    };

    productInp.addEventListener('input', onChange);
    qtyInp.addEventListener('input',  onChange);
    costInp.addEventListener('input', onChange);
    sellInp.addEventListener('input', onChange);
    removeBtn.addEventListener('click', removeItemRow);
  }

  // ── Remove row ────────────────────────────────────────────────────
  function removeItemRow(e) {
    const idx = +e.currentTarget.dataset.idx;
    const row = itemsContainer.querySelector(`.purchase-item-row[data-idx="${idx}"]`);
    if (row) row.remove();
    items[idx] = null;
    recalcGrandTotal();
  }

  // ── Grand total ───────────────────────────────────────────────────
  function recalcGrandTotal() {
    const total = items
      .filter(Boolean)
      .reduce((sum, item) => sum + item.quantity * item.costPrice, 0);
    grandTotalDisplay.textContent = `₹${total.toFixed(2)}`;
  }

  // ── Validation ────────────────────────────────────────────────────
  function validate() {
    if (!supplierSelect.value)       return 'Please select a supplier.';
    if (!invoiceInput.value.trim())  return 'Please enter an invoice number.';
    if (!dateInput.value)            return 'Please select a purchase date.';

    const validItems = items.filter(Boolean);
    if (!validItems.length)          return 'Please add at least one item.';

    for (const item of validItems) {
      if (!item.productName)         return 'Please enter a product name for every item.';
      if (item.quantity   <= 0)      return 'Quantity must be greater than 0.';
      if (item.costPrice  <= 0)      return 'Cost price must be greater than 0.';
      if (item.sellingPrice <= 0)    return 'Selling price must be greater than 0.';
    }
    return null;
  }

  function showError(msg) {
    errorBox.textContent   = msg;
    errorBox.style.display = 'block';
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Button listeners ──────────────────────────────────────────────
  addItemBtn.addEventListener('click', addItemRow);

  submitBtn.addEventListener('click', async () => {
    errorBox.style.display = 'none';

    const err = validate();
    if (err) { showError(err); return; }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Saving…';

    try {
      // ─── STEP 1: Create purchase header ───────────────────────────
      const purchaseRes = await fetch('/api/admin/purchases', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId:    supplierSelect.value,
          invoiceNumber: invoiceInput.value.trim(),
          purchaseDate:  dateInput.value,
        }),
      });

      if (!purchaseRes.ok) {
        const d = await purchaseRes.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to create purchase.');
      }

      const purchase   = await purchaseRes.json();
      const purchaseId = purchase._id;

      // ─── STEP 2: Post each item ───────────────────────────────────
      const validItems = items.filter(Boolean);
      for (const item of validItems) {
        const itemRes = await fetch('/api/admin/purchase-items', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            purchaseId,
            productName:  item.productName,
            quantity:     item.quantity,
            costPrice:    item.costPrice,
            sellingPrice: item.sellingPrice,
          }),
        });

        if (!itemRes.ok) {
          const d = await itemRes.json().catch(() => ({}));
          throw new Error(d.message || 'Failed to add item.');
        }
      }

      alert('✅ Purchase recorded successfully! Batches have been created.');
      window.location.href = '/api/admin/purchases';

    } catch (error) {
      showError('Error: ' + error.message);
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Submit Purchase Entry';
    }
  });

})();
