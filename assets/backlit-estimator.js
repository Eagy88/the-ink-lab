function initBacklitEstimator() {
  const sizeSelect = document.getElementById('be-size');
  if (!sizeSelect || sizeSelect.dataset.initialized) return;
  sizeSelect.dataset.initialized = 'true';
  const customDims = document.getElementById('be-custom-dims');
  const widthInput = document.getElementById('be-width');
  const heightInput = document.getElementById('be-height');
  const finishSelect = document.getElementById('be-finish');
  const qtyInput = document.getElementById('be-qty');
  
  const totalPriceEl = document.getElementById('be-total-price');
  const unitPriceEl = document.getElementById('be-unit-price');
  const qtyNoteEl = document.getElementById('be-qty-note');
  const quoteMsgEl = document.getElementById('be-quote-msg');
  const actionWrapEl = document.getElementById('be-action-wrap');

  function invalid(message) {
    totalPriceEl.textContent = '--';
    unitPriceEl.textContent = message;
    qtyNoteEl.textContent = '';
    quoteMsgEl.style.display = 'none';
    actionWrapEl.style.display = 'none';
  }

  function calculate() {
    let width = 0;
    let height = 0;
    let isCustom = false;
    let unitBasePrice = 0;

    const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];

    if (selectedOption.dataset.custom) {
      isCustom = true;
      customDims.style.display = 'grid';
      width = Number(widthInput.value);
      height = Number(heightInput.value);
    } else {
      isCustom = false;
      customDims.style.display = 'none';
      width = parseInt(selectedOption.dataset.w, 10);
      height = parseInt(selectedOption.dataset.h, 10);
      unitBasePrice = parseFloat(selectedOption.dataset.price);
    }

    const qty = Number(qtyInput.value);
    if (!Number.isSafeInteger(qty) || qty < 1) {
      invalid('Enter a whole-number quantity of at least 1.');
      return;
    }

    if (qty >= 50) {
      quoteMsgEl.style.display = 'block';
      actionWrapEl.style.display = 'none';
      totalPriceEl.textContent = 'Quote';
      unitPriceEl.textContent = '';
      qtyNoteEl.textContent = 'Trade quantities require a custom quote.';
      return;
    } else {
      quoteMsgEl.style.display = 'none';
      actionWrapEl.style.display = 'flex';
    }

    if (isCustom) {
      if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) {
        invalid('Enter positive whole-number dimensions in mm.');
        return;
      }
      const area = (width / 1000) * (height / 1000);
      // Work in pence: round up to the next £5-minus-1p price point.
      const calculatedBaseCents = Math.ceil((area * 4499 + 1) / 500) * 500 - 1;
      unitBasePrice = Math.max(1499, calculatedBaseCents) / 100;
    }

    const area = (width / 1000) * (height / 1000);
    let finishPrice = 0;
    const finishType = finishSelect.value;
    
    if (finishType === 'matt' || finishType === 'gloss') {
      finishPrice = Math.round((area * 8) * 100) / 100;
    }

    const unitCents = Math.round(unitBasePrice * 100) + Math.round(finishPrice * 100);
    if (!Number.isSafeInteger(unitCents) || !Number.isSafeInteger(unitCents * qty)) {
      invalid('These dimensions need a quote. Please contact us.');
      return;
    }

    let discount = 0;
    let note = '';
    if (qty >= 2 && qty <= 4) {
      discount = 5;
      note = '5% quantity discount included in estimate';
    } else if (qty >= 5 && qty <= 9) {
      discount = 10;
      note = '10% quantity discount included in estimate';
    } else if (qty >= 10 && qty <= 24) {
      discount = 15;
      note = '15% quantity discount included in estimate';
    } else if (qty >= 25 && qty <= 49) {
      discount = 20;
      note = '20% quantity discount included in estimate';
    }

    qtyNoteEl.textContent = note;

    const discountedCents = Math.round(unitCents * (100 - discount) / 100);
    const discountedUnit = discountedCents / 100;
    const total = (discountedCents * qty / 100).toFixed(2);

    totalPriceEl.textContent = '£' + total;
    unitPriceEl.textContent = '£' + discountedUnit.toFixed(2) + ' each';
  }

  sizeSelect.addEventListener('change', calculate);
  widthInput.addEventListener('input', calculate);
  heightInput.addEventListener('input', calculate);
  finishSelect.addEventListener('change', calculate);
  qtyInput.addEventListener('input', calculate);

  // Initial calculation
  calculate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBacklitEstimator);
} else {
  initBacklitEstimator();
}
document.addEventListener('shopify:section:load', initBacklitEstimator);