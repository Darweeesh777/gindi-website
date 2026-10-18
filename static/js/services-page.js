/*
 * Gindi Innovations — Services page (vanilla JS).
 *
 * Service cards: each card's id is its service slug and its details are a
 * native <details> (they open and close without JS). A link to
 * /services/#<slug> scrolls to that card, below the sticky header, and
 * opens its details — on load and when the hash changes.
 *
 * Enquiry drawer: [data-enquire] links (which go to the homepage contact
 * section without JS) open a <dialog> with the service prefilled. While no
 * form destination is configured the form cannot be submitted — and nothing
 * pretends it was.
 */
(function () {
  'use strict';

  /* ---------- Service cards ---------- */
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-service-card]'));

  function openFromHash(smooth) {
    var id = decodeURIComponent(location.hash.slice(1));
    var card = id && cards.filter(function (c) { return c.id === id; })[0];
    if (!card) return;
    var details = card.querySelector('[data-service-details]');
    if (details) details.open = true;
    // scroll-margin (services-cards.css) keeps it below the header.
    card.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'instant' });
  }

  if (cards.length) {
    openFromHash(false);
    window.addEventListener('hashchange', function () { openFromHash(true); });
  }

  /* ---------- Enquiry drawer ---------- */
  var drawer = document.querySelector('[data-drawer]');
  if (!drawer || typeof drawer.showModal !== 'function') return;

  var select = drawer.querySelector('[data-drawer-select]');
  var serviceLabel = drawer.querySelector('[data-drawer-service]');
  var form = drawer.querySelector('form');
  var opener = null;

  var whatsapp = drawer.querySelector('[data-whatsapp]');

  // The heading and the WhatsApp message follow the selected service.
  function syncLabel() {
    var option = select.options[select.selectedIndex];
    serviceLabel.textContent = option.text;
    if (whatsapp) {
      var message = option.value
        ? whatsapp.getAttribute('data-message-service').replace('{service}', option.text)
        : whatsapp.getAttribute('data-message-general');
      whatsapp.href = 'https://wa.me/' + whatsapp.getAttribute('data-whatsapp') + '?text=' + encodeURIComponent(message);
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-enquire]'), function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      opener = link;
      select.value = link.getAttribute('data-enquire') || '';
      syncLabel();
      drawer.showModal();
      drawer.querySelector('input, select, textarea').focus();
    });
  });

  select.addEventListener('change', syncLabel);
  drawer.querySelector('[data-drawer-close]').addEventListener('click', function () { drawer.close(); });
  drawer.addEventListener('click', function (event) {
    if (event.target === drawer) drawer.close(); // the dimmed area outside the panel
  });
  drawer.addEventListener('close', function () {
    if (opener) opener.focus();
  });

  // Not connected yet: never submit, never fake a confirmation.
  if (form.hasAttribute('data-not-connected')) {
    form.addEventListener('submit', function (event) { event.preventDefault(); });
  }
})();
