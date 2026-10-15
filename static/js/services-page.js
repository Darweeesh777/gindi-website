/*
 * Gindi Innovations — Services page (vanilla JS).
 *
 * Accordion: one service open at a time (the first by default). The URL
 * hash picks the open one, so /services/#space-planning opens Space
 * Planning — on load and when the hash changes. Headers are real buttons
 * (aria-expanded); Up/Down/Home/End move between them.
 *
 * Enquiry drawer: [data-enquire] links (which go to the homepage contact
 * section without JS) open a <dialog> with the service prefilled. While no
 * form destination is configured the form cannot be submitted — and nothing
 * pretends it was.
 */
(function () {
  'use strict';

  /* ---------- Accordion ---------- */
  var accordion = document.querySelector('[data-accordion]');
  var items = accordion ? Array.prototype.slice.call(accordion.querySelectorAll('[data-accordion-item]')) : [];
  var triggers = items.map(function (item) { return item.querySelector('[data-accordion-trigger]'); });

  function setOpen(item, open) {
    item.classList.toggle('is-open', open);
    item.querySelector('[data-accordion-trigger]').setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function openOnly(target) {
    items.forEach(function (item) { setOpen(item, item === target); });
  }

  function openFromHash(scroll) {
    var id = decodeURIComponent(location.hash.slice(1));
    var target = id && items.filter(function (item) { return item.id === id; })[0];
    if (!target) return false;
    // Lay out the final state at once, then bring the item into view.
    accordion.classList.add('is-settling');
    openOnly(target);
    if (scroll) target.scrollIntoView({ block: 'start', behavior: 'instant' });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { accordion.classList.remove('is-settling'); });
    });
    return true;
  }

  if (items.length) {
    triggers.forEach(function (trigger, i) {
      trigger.addEventListener('click', function () {
        var item = items[i];
        if (item.classList.contains('is-open')) setOpen(item, false);
        else openOnly(item);
      });
      trigger.addEventListener('keydown', function (event) {
        var next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: triggers.length - 1 }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        triggers[(next + triggers.length) % triggers.length].focus();
      });
    });
    openFromHash(true);
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
