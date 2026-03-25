(function() {
  function initCalculator() {
    var form = document.getElementById('quote-calculator');
    if (!form) return;

    var pricePerSqm = parseFloat(form.dataset.pricePerSqm) || 15.5;
    var minPrice = parseFloat(form.dataset.minPrice) || 12;

    var widthInput = document.getElementById('calc-width');
    var heightInput = document.getElementById('calc-height');
    var qtyInput = document.getElementById('calc-qty');
    var priceDisplay = document.getElementById('calc-price');

    function calculate() {
      var w = parseFloat(widthInput.value) || 0;
      var h = parseFloat(heightInput.value) || 0;
      var qty = parseInt(qtyInput.value) || 1;
      var sqm = (w / 100) * (h / 100);
      var unitPrice = Math.max(sqm * pricePerSqm, minPrice);
      var total = unitPrice * qty;
      priceDisplay.textContent = '\u00A3' + total.toFixed(2);
    }

    [widthInput, heightInput, qtyInput].forEach(function(input) {
      if (input) input.addEventListener('input', calculate);
    });

    var finishing = document.getElementById('calc-finishing');
    if (finishing) finishing.addEventListener('change', calculate);

    calculate();
  }

  function initArtworkForm() {
    var sendBtn = document.getElementById('artwork-send-btn');
    if (!sendBtn) return;

    sendBtn.addEventListener('click', function(e) {
      e.preventDefault();

      var name = document.getElementById('upload-name');
      var email = document.getElementById('upload-email');
      var business = document.getElementById('upload-business');
      var order = document.getElementById('upload-order');
      var product = document.getElementById('upload-product');
      var width = document.getElementById('upload-width');
      var height = document.getElementById('upload-height');
      var qty = document.getElementById('upload-qty');
      var notes = document.getElementById('upload-notes');

      if (!name.value || !email.value) {
        alert('Please fill in your name and email address.');
        return;
      }

      var subject = 'Artwork Upload';
      if (order && order.value) subject += ' - ' + order.value;
      if (product && product.value) subject += ' - ' + product.value;

      var body = 'ARTWORK UPLOAD\n\n';
      body += 'Name: ' + (name ? name.value : '') + '\n';
      body += 'Email: ' + (email ? email.value : '') + '\n';
      if (business && business.value) body += 'Business: ' + business.value + '\n';
      if (order && order.value) body += 'Order/Quote Ref: ' + order.value + '\n';
      if (product && product.value) body += 'Product: ' + product.value + '\n';
      if (width && width.value && height && height.value) body += 'Size: ' + width.value + ' x ' + height.value + ' cm\n';
      if (qty && qty.value) body += 'Quantity: ' + qty.value + '\n';
      if (notes && notes.value) body += '\nNotes:\n' + notes.value + '\n';
      body += '\n---\nPlease attach your artwork file(s) to this email before sending.\n';

      var mailtoEmail = document.querySelector('meta[name="artwork-email"]');
      var toEmail = mailtoEmail ? mailtoEmail.content : 'hello@theinklab.co.uk';

      window.location.href = 'mailto:' + toEmail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }

  function initDesignGallery() {
    var cards = document.querySelectorAll('.design-gallery__card');
    var selectedPanel = document.getElementById('design-selected');
    var selectedName = document.getElementById('design-selected-name');
    if (!cards.length) return;

    cards.forEach(function(card) {
      card.addEventListener('click', function() {
        cards.forEach(function(c) { c.classList.remove('is-selected'); });
        card.classList.add('is-selected');

        var name = card.dataset.designName || 'Selected design';
        if (selectedName) selectedName.textContent = name;
        if (selectedPanel) {
          selectedPanel.style.display = 'block';
          selectedPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });
  }

  function initFaqAccordion() {
    var buttons = document.querySelectorAll('.faq__question');
    buttons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var item = btn.closest('.faq__item');
        var isOpen = item.classList.contains('is-open');
        document.querySelectorAll('.faq__item.is-open').forEach(function(openItem) {
          openItem.classList.remove('is-open');
        });
        if (!isOpen) item.classList.add('is-open');
      });
    });
  }

  function init() {
    initCalculator();
    initArtworkForm();
    initDesignGallery();
    initFaqAccordion();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
