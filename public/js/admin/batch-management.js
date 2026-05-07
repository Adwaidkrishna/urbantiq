(function () {
  // Elements
  const prodSearch = document.getElementById('product-search');
  const prodSelect = document.getElementById('select-product');
  const batchSelect = document.getElementById('select-batch');
  const variantTableArea = document.getElementById('variant-table-area');
  const variantTableBody = document.getElementById('variant-table-body');
  const nextBtn1 = document.getElementById('next-step-1');
  const selectedCountEl = document.getElementById('selected-count');
  const totalStockEl = document.getElementById('total-stock');
  const selectAllCheck = document.getElementById('select-all-variants');

  // Navigation
  const stepNodes = [document.getElementById('step-node-1'), document.getElementById('step-node-2'), document.getElementById('step-node-3')];
  const stepViews = [document.getElementById('step-view-1'), document.getElementById('step-view-2'), document.getElementById('step-view-3')];
  const nextBtn2 = document.getElementById('next-step-2');
  const prevBtn2 = document.getElementById('prev-step-2');
  const prevBtn3 = document.getElementById('prev-step-3');
  const submitBtn = document.getElementById('submit-btn');

  let products = [];
  let unlinkedBatches = [];
  let state = {
    productId: '',
    selectedVariants: [], // [{variantId, sizeId, stock, quantity}]
    batchId: '',
    batchObj: null
  };

  async function loadData() {
    try {
      const [pRes, bRes] = await Promise.all([
        fetch('/api/admin/products/list'),
        fetch('/api/admin/batches/unlinked')
      ]);
      products = await pRes.json();
      unlinkedBatches = await bRes.json();
      renderProducts(products);
      renderBatches(unlinkedBatches);
    } catch (e) {
      console.error(e);
    }
  }

  function renderProducts(list) {
    prodSelect.innerHTML = '<option value="">-- Select Product --</option>';
    list.forEach(p => {
      prodSelect.innerHTML += `<option value="${p._id}">${p.name}</option>`;
    });
  }

  function renderBatches(list) {
    batchSelect.innerHTML = '<option value="">-- Select Batch --</option>';
    list.forEach(b => {
      batchSelect.innerHTML += `<option value="${b._id}" data-batch='${JSON.stringify(b)}'>${b.batchId || '-'} : ${b.productName} (${b.quantity} units)</option>`;
    });
  }

  // Navigation Logic
  const navigateToStep = (idx) => {
    stepViews.forEach((v, i) => {
      v.classList.toggle('d-none', i !== idx);
      if (i < idx) { stepNodes[i].classList.add('completed'); stepNodes[i].classList.remove('active'); }
      else if (i === idx) { stepNodes[i].classList.add('active'); stepNodes[i].classList.remove('completed'); }
      else { stepNodes[i].classList.remove('active', 'completed'); }
    });
    
    if (idx === 2) updateFinalVerification();
  };

  function updateFinalVerification() {
    document.getElementById('final-batch-name').innerText = state.batchObj ? state.batchObj.batchId : '-';
    document.getElementById('final-variant-count').innerText = state.selectedVariants.length;
  }

  // Step 1: Product & Variant Selection
  prodSearch.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderProducts(products.filter(p => p.name.toLowerCase().includes(q)));
  });

  prodSelect.addEventListener('change', () => {
    const pId = prodSelect.value;
    state.productId = pId;
    if (pId) {
      const product = products.find(p => p._id === pId);
      renderVariantTable(product);
      variantTableArea.classList.remove('d-none');
    } else {
      variantTableArea.classList.add('d-none');
      nextBtn1.disabled = true;
    }
  });

  function renderVariantTable(product) {
    variantTableBody.innerHTML = '';
    selectAllCheck.checked = false;
    
    if (!product.variants) return;

    product.variants.forEach(variant => {
      variant.sizes.forEach(sz => {
        const row = document.createElement('tr');
        row.className = 'variant-row';
        const stock = sz.stock || 0;
        const stockClass = stock <= 0 ? 'stock-none' : (stock < 10 ? 'stock-low' : 'stock-ok');

        row.innerHTML = `
          <td><input type="checkbox" class="var-check form-check-input" data-vid="${variant._id}" data-sid="${sz._id}" data-size="${sz.size}" data-stock="${stock}"></td>
          <td>${variant.colorName || variant.color}</td>
          <td><span class="fw-bold">${sz.size}</span></td>
          <td class="text-center">
            <span class="stock-badge ${stockClass}">${stock} in stock</span>
          </td>
          <td class="text-end" style="width: 140px;">
            <input type="number" class="qty-input form-control form-control-sm text-end d-none" placeholder="Qty" min="1">
          </td>
        `;

        const check = row.querySelector('.var-check');
        const input = row.querySelector('.qty-input');

        check.onchange = () => {
          row.classList.toggle('selected', check.checked);
          input.classList.toggle('d-none', !check.checked);
          if (!check.checked) input.value = '';
          updateAggregation();
        };

        input.oninput = () => updateAggregation();

        variantTableBody.appendChild(row);
      });
    });
  }

  selectAllCheck.onchange = () => {
    const checks = variantTableBody.querySelectorAll('.var-check');
    checks.forEach(c => {
      const input = c.closest('tr').querySelector('.qty-input');
      c.checked = selectAllCheck.checked;
      c.closest('tr').classList.toggle('selected', c.checked);
      input.classList.toggle('d-none', !c.checked);
      if (!c.checked) input.value = '';
    });
    updateAggregation();
  };

  function updateAggregation() {
    state.selectedVariants = [];
    let totalToLink = 0;
    const checks = variantTableBody.querySelectorAll('.var-check:checked');
    
    checks.forEach(c => {
      const input = c.closest('tr').querySelector('.qty-input');
      const qty = parseInt(input.value) || 0;
      state.selectedVariants.push({
        variantId: c.dataset.vid,
        sizeId: c.dataset.sid,
        size: c.dataset.size,
        quantity: qty
      });
      totalToLink += qty;
    });

    selectedCountEl.innerText = state.selectedVariants.length;
    totalStockEl.innerText = totalToLink;
    
    nextBtn1.disabled = state.selectedVariants.length === 0;
  }

  nextBtn1.addEventListener('click', () => navigateToStep(1));

  // Step 2: Batch Selection
  batchSelect.addEventListener('change', () => {
    state.batchId = batchSelect.value;
    if (state.batchId) {
      state.batchObj = JSON.parse(batchSelect.options[batchSelect.selectedIndex].dataset.batch);
      nextBtn2.disabled = false;
    } else {
      nextBtn2.disabled = true;
    }
  });

  nextBtn2.addEventListener('click', () => {
    const totalAllocated = state.selectedVariants.reduce((sum, v) => sum + v.quantity, 0);
    if (totalAllocated !== state.batchObj.quantity) {
      alert(`Error: Total allocated quantity (${totalAllocated}) must match batch quantity (${state.batchObj.quantity})`);
      return;
    }
    navigateToStep(2);
  });

  prevBtn2.addEventListener('click', () => navigateToStep(0));
  prevBtn3.addEventListener('click', () => navigateToStep(1));

  // Step 3: Submission
  submitBtn.addEventListener('click', async () => {
    if (state.selectedVariants.length === 0 || !state.batchId) return;

    submitBtn.innerText = 'LINKING...';
    submitBtn.disabled = true;

    try {
      const res = await fetch(`/api/admin/batches/${state.batchId}/link`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocations: state.selectedVariants })
      });

      if (res.ok) {
        alert('Batch implementation successful!');
        window.location.reload();
      } else {
        const d = await res.json();
        alert(d.message || 'Error linking batch');
        submitBtn.innerText = 'Confirm & Implement Batch';
        submitBtn.disabled = false;
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
      submitBtn.innerText = 'Confirm & Implement Batch';
      submitBtn.disabled = false;
    }
  });

  loadData();
})();
