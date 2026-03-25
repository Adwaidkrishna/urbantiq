(function () {
  const prodSearch = document.getElementById('product-search');
  const prodSelect = document.getElementById('select-product');
  const batchSelect = document.getElementById('select-batch');
  const batchInfo = document.getElementById('batch-info-container');
  const allocContainer = document.getElementById('variants-allocation-container');
  const variantsList = document.getElementById('variants-list');
  const submitBtn = document.getElementById('submit-btn');
  const form = document.getElementById('link-batch-form');

  let products = [];
  let unlinkedBatches = [];
  let currentBatch = null;

  async function loadData() {
    try {
      const [prodRes, batchRes] = await Promise.all([
        fetch('/api/admin/products/list'),
        fetch('/api/admin/batches/unlinked')
      ]);
      products = await prodRes.json();
      unlinkedBatches = await batchRes.json();

      renderProducts(products);
      renderBatches(unlinkedBatches);
    } catch (err) {
      console.error(err);
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
      batchSelect.innerHTML += `<option value="${b._id}">${b.batchId || '-'} : ${b.productName} (${b.quantity} qty)</option>`;
    });
  }

  prodSearch.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderProducts(products.filter(p => p.name.toLowerCase().includes(q)));
    resetAllocation();
  });

  prodSelect.addEventListener('change', () => {
    resetAllocation();
    evaluateState();
  });

  batchSelect.addEventListener('change', (e) => {
    const bId = e.target.value;
    currentBatch = unlinkedBatches.find(b => b._id === bId);
    
    if (currentBatch) {
      batchInfo.style.display = 'block';
      document.getElementById('batch-info-qty').innerText = `Total Qty: ${currentBatch.quantity}`;
      document.getElementById('batch-info-item').innerText = `Item: ${currentBatch.productName}`;
      document.getElementById('max-allocate').innerText = currentBatch.quantity;
    } else {
      batchInfo.style.display = 'none';
    }
    evaluateState();
  });

  function resetAllocation() {
    allocContainer.style.display = 'none';
    variantsList.innerHTML = '';
    document.getElementById('total-allocated').innerText = '0';
    document.getElementById('total-allocated').style.color = '#de350b';
    document.getElementById('allocation-icon').innerText = '';
    submitBtn.disabled = true;
  }

  function evaluateState() {
    const pId = prodSelect.value;
    
    if (!pId || !currentBatch) {
      resetAllocation();
      return;
    }

    const prod = products.find(p => p._id === pId);
    allocContainer.style.display = 'block';
    variantsList.innerHTML = '';
    
    let firstInputAdded = false;

    if (prod && prod.variants) {
      prod.variants.forEach(v => {
        if (v.sizes) {
          v.sizes.forEach(sz => {
            const defVal = !firstInputAdded ? currentBatch.quantity : 0;
            // Auto fill first variant
            if (!firstInputAdded) firstInputAdded = true;

            const label = `${v.colorName || v.color} - ${sz.size}`;
            variantsList.innerHTML += `
              <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                <span style="font-weight:500;">${label} <small class="text-muted">(${sz.stock || 0} in stock)</small></span>
                <input type="number" class="form-control variant-qty text-center" 
                  data-variant-id="${sz._id}" 
                  min="0" max="${currentBatch.quantity}" 
                  value="${defVal}" 
                  style="width: 80px;" />
              </div>
            `;
          });
        }
      });
    }

    document.querySelectorAll('.variant-qty').forEach(input => {
      input.addEventListener('input', checkValidation);
    });
    checkValidation(); // initial check for auto-fill
  }

  function checkValidation() {
    let sum = 0;
    document.querySelectorAll('.variant-qty').forEach(i => sum += Number(i.value || 0));
    
    const qtySpan = document.getElementById('total-allocated');
    const iconSpan = document.getElementById('allocation-icon');
    qtySpan.innerText = sum;

    if (currentBatch && sum === currentBatch.quantity) {
      qtySpan.style.color = '#00875a'; // Green
      iconSpan.innerHTML = '✅';
      submitBtn.disabled = false;
    } else {
      qtySpan.style.color = '#de350b'; // Red
      iconSpan.innerHTML = '';
      submitBtn.disabled = true;
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn.disabled || !currentBatch) return;

    submitBtn.innerText = 'LINKING...';
    submitBtn.disabled = true;

    const allocations = [];
    document.querySelectorAll('.variant-qty').forEach(i => {
      const q = Number(i.value || 0);
      if (q > 0) allocations.push({ variantId: i.dataset.variantId, quantity: q });
    });

    try {
      const res = await fetch(`/api/admin/batches/${currentBatch._id}/link`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocations })
      });
      const data = await res.json();
      
      if (res.ok) {
        alert('Batch Linked Successfully! Stock has been updated.');
        batchSelect.value = '';
        currentBatch = null;
        loadData(); // reload unlinked batches
        resetAllocation();
        batchInfo.style.display = 'none';
      } else {
        alert(data.message || 'Error linking batch');
      }
    } catch (err) {
      console.error(err);
      alert('Network Error');
    } finally {
      submitBtn.innerText = 'LINK BATCH TO STOCK';
    }
  });

  loadData();
})();
