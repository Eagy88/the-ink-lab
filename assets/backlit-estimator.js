(function () {
  'use strict';

  function money(pence) {
    return '£' + (pence / 100).toFixed(2);
  }

  function route(root, path) {
    return (root || '/').replace(/\/?$/, '/') + path.replace(/^\//, '');
  }

  function initBacklitEstimator(section) {
    if (!section || section.dataset.initialized || !window.BacklitPricing) return;
    section.dataset.initialized = 'true';

    var get = function (name) { return section.querySelector('[data-be-' + name + ']'); };
    var form = get('form');
    var sizeSelect = get('size');
    var customDims = get('custom-dims');
    var widthInput = get('width');
    var heightInput = get('height');
    var finishSelect = get('finish');
    var qtyInput = get('qty');
    var artworkInput = get('artwork');
    var totalPrice = get('total');
    var unitPrice = get('unit');
    var qtyNote = get('qty-note');
    var quoteMessage = get('quote');
    var action = get('action');
    var button = get('submit');
    var status = get('status');
    var standardVariants = JSON.parse(get('standard-variants').textContent || '[]');
    var customVariants = JSON.parse(get('custom-variants').textContent || '[]');
    var enabled = section.dataset.orderingEnabled === 'true';
    var liquidCurrency = section.dataset.presentmentCurrency;
    var currencyOkay = (!liquidCurrency || liquidCurrency === 'GBP') &&
      (!window.Shopify || !Shopify.currency || Shopify.currency.active === 'GBP');
    var pending = false;
    var itemAdded = false;
    var current = null;

    function setDisabled(disabled) {
      Array.prototype.forEach.call(form.querySelectorAll('input, select, button'), function (field) {
        field.disabled = disabled;
      });
      button.disabled = disabled;
    }

    function showInvalid(message) {
      current = null;
      totalPrice.textContent = '—';
      unitPrice.textContent = message;
      qtyNote.textContent = '';
      quoteMessage.hidden = true;
      action.hidden = false;
      button.disabled = true;
    }

    function findVariant(result) {
      var variants = result.custom ? customVariants : standardVariants;
      return variants.find(function (variant) {
        if (!variant.available || Number(variant.price) !== result.unitPence) return false;
        if (result.custom) return variant.option1 === result.band;
        return variant.option1 === sizeSelect.value && variant.option2 === finishSelect.value;
      });
    }

    function calculate() {
      if (pending) return;
      var option = sizeSelect.options[sizeSelect.selectedIndex];
      var custom = option.dataset.custom === 'true';
      customDims.hidden = !custom;
      var width = custom ? Number(widthInput.value) : Number(option.dataset.width);
      var height = custom ? Number(heightInput.value) : Number(option.dataset.height);
      var result = window.BacklitPricing.calculate({
        size: sizeSelect.value,
        custom: custom,
        width: width,
        height: height,
        finish: finishSelect.value,
        quantity: Number(qtyInput.value),
        discountsActive: section.dataset.discountsActive === 'true'
      });

      status.textContent = '';
      if (!result.valid) return showInvalid(result.message);
      if (result.quote) {
        current = null;
        totalPrice.textContent = 'Quote';
        unitPrice.textContent = '';
        qtyNote.textContent = result.message;
        quoteMessage.hidden = false;
        action.hidden = true;
        return;
      }

      quoteMessage.hidden = true;
      action.hidden = false;
      totalPrice.textContent = money(result.totalPence);
      unitPrice.textContent = money(result.unitPence) + ' each before discounts';
      qtyNote.textContent = result.discountPercent
        ? result.discountPercent + '% estimated discount: ' + money(result.estimatedTotalPence) +
          '. Final discounts are calculated in the basket.'
        : '';

      result.width = width;
      result.height = height;
      result.quantity = Number(qtyInput.value);
      result.sizeLabel = custom ? 'Custom' : sizeSelect.value;
      result.finish = finishSelect.value;
      result.variant = findVariant(result);
      current = result;

      if (!currencyOkay) {
        button.disabled = true;
        status.textContent = 'Online ordering for this item is available in GBP only.';
      } else if (!enabled) {
        button.disabled = true;
        status.textContent = 'Online ordering is not enabled yet. Please request a quote.';
      } else if ((result.custom ? customVariants : standardVariants).length === 0) {
        button.disabled = true;
        status.textContent = 'The ordering product is pending setup. Please request a quote.';
      } else if (!result.variant) {
        button.disabled = true;
        status.textContent = 'This option is not configured at the displayed price. Please request a quote.';
      } else {
        button.disabled = pending;
      }
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!enabled || !currencyOkay || !current || !current.variant || pending) return;
      pending = true;
      itemAdded = false;
      setDisabled(true);
      status.textContent = 'Adding to basket…';

      fetch(route(section.dataset.rootUrl, 'cart/add.js'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          items: [{
            id: current.variant.id,
            quantity: current.quantity,
            properties: {
              Width: current.width + 'mm',
              Height: current.height + 'mm',
              Size: current.sizeLabel,
              Finish: current.finish,
              Artwork: artworkInput.value.trim() || 'To be supplied after ordering'
            }
          }]
        })
      }).then(function (response) {
        return response.json().then(function (body) {
          if (!response.ok) throw new Error(body.description || body.message || 'Could not add this item.');
          itemAdded = true;
          return fetch(route(section.dataset.rootUrl, 'cart.js'), { headers: { Accept: 'application/json' } });
        });
      }).then(function (response) {
        if (!response.ok) throw new Error('Item added, but the basket count could not be refreshed.');
        return response.json();
      }).then(function (cart) {
        document.querySelectorAll('[data-cart-count]').forEach(function (badge) {
          badge.textContent = cart.item_count;
          badge.classList.toggle('is-empty', cart.item_count === 0);
        });
        pending = false;
        setDisabled(false);
        calculate();
        status.innerHTML = 'Added to basket. <a href="' + section.dataset.cartUrl + '">View basket</a>.';
      }).catch(function (error) {
        if (itemAdded) {
          pending = false;
          setDisabled(false);
          calculate();
          status.innerHTML = 'Added to basket. <a href="' + section.dataset.cartUrl +
            '">View basket</a>. The basket count could not be refreshed.';
          return;
        }
        pending = false;
        setDisabled(false);
        calculate();
        status.textContent = error.message;
      });
    });

    [sizeSelect, finishSelect].forEach(function (field) {
      field.addEventListener('change', calculate);
    });
    [widthInput, heightInput, qtyInput].forEach(function (field) {
      field.addEventListener('input', calculate);
    });
    calculate();
  }

  function initAll(root) {
    if (root && root.matches && root.matches('[data-backlit-estimator]')) initBacklitEstimator(root);
    (root || document).querySelectorAll('[data-backlit-estimator]').forEach(initBacklitEstimator);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(document); });
  } else {
    initAll(document);
  }
  document.addEventListener('shopify:section:load', function (event) { initAll(event.target); });
})();