(function() {
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

  function initDesignBuy() {
    var addBtn = document.getElementById('design-add-btn');
    var sizeSelect = document.getElementById('design-size');
    var selectedName = document.getElementById('design-selected-name');
    if (!addBtn || !sizeSelect) return;

    addBtn.addEventListener('click', function() {
      var opt = sizeSelect.options[sizeSelect.selectedIndex];
      var id = opt ? opt.value : null;
      if (!id) return;

      var design = selectedName ? selectedName.textContent : '';
      var sizeTitle = opt ? (opt.dataset.title || opt.textContent) : '';
      var original = addBtn.textContent;
      addBtn.disabled = true;
      addBtn.textContent = 'Adding...';

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            id: id,
            quantity: 1,
            properties: {
              'Design': design,
              'Artwork': 'To be uploaded after payment'
            }
          }]
        })
      })
      .then(function(res) {
        if (!res.ok) throw new Error('add failed');
        return fetch('/cart.js');
      })
      .then(function(res) { return res.json(); })
      .then(function(cart) {
        updateCartCount(cart.item_count);
        showCartToast(design + ' — ' + sizeTitle);
        addBtn.textContent = 'Added \u2713';
        setTimeout(function() {
          addBtn.textContent = original;
          addBtn.disabled = false;
        }, 1600);
      })
      .catch(function() {
        addBtn.textContent = original;
        addBtn.disabled = false;
        alert('Sorry, we could not add that to your basket. Please try again.');
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

  function updateCartCount(count) {
    var els = document.querySelectorAll('[data-cart-count]');
    els.forEach(function(el) {
      el.textContent = count;
      if (count > 0) {
        el.classList.remove('is-empty');
      } else {
        el.classList.add('is-empty');
      }
    });
  }

  function showCartToast(title) {
    var toast = document.getElementById('cart-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cart-toast';
      toast.className = 'cart-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = '<span class="cart-toast__check">&#10003;</span>' +
      '<span class="cart-toast__text">Added to basket' + (title ? ': ' + title : '') + '</span>' +
      '<a href="/cart" class="cart-toast__link">View basket</a>';
    toast.classList.add('is-visible');
    clearTimeout(showCartToast._timer);
    showCartToast._timer = setTimeout(function() {
      toast.classList.remove('is-visible');
    }, 4000);
  }

  function initAddToCart() {
    var buttons = document.querySelectorAll('.js-add-to-cart');
    if (!buttons.length) return;

    buttons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.dataset.variantId;
        if (!id) return;

        var original = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Adding...';

        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{
              id: id,
              quantity: 1,
              properties: { 'Artwork': 'To be uploaded after payment' }
            }]
          })
        })
        .then(function(res) {
          if (!res.ok) throw new Error('add failed');
          return fetch('/cart.js');
        })
        .then(function(res) { return res.json(); })
        .then(function(cart) {
          updateCartCount(cart.item_count);
          showCartToast(btn.dataset.variantTitle);
          btn.textContent = 'Added \u2713';
          setTimeout(function() {
            btn.textContent = original;
            btn.disabled = false;
          }, 1600);
        })
        .catch(function() {
          btn.textContent = original;
          btn.disabled = false;
          alert('Sorry, we could not add that to your basket. Please try again.');
        });
      });
    });
  }

  function init() {
    initArtworkForm();
    initDesignGallery();
    initDesignBuy();
    initFaqAccordion();
    initAddToCart();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
