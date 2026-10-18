/*
 * Gindi Innovations — Projects page and project pages (vanilla JS).
 *
 * - Film previews: pressing play swaps the poster for a <video> with
 *   controls and starts it (a visitor's choice, never autoplay).
 * - Photo gallery (project pages): each photo opens a full-screen <dialog>
 *   with previous/next buttons, arrow keys, swipes, and Escape to close;
 *   focus returns to the button it was opened from. On the interactive
 *   project page (project-gallery.js) the six photos and the concept image
 *   are separate groups.
 */
(function () {
  'use strict';

  /* ---------- Film previews ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-video-tile]'), function (tile) {
    var button = tile.querySelector('[data-play]');
    if (!button) return;
    button.addEventListener('click', function () {
      var video = document.createElement('video');
      video.src = tile.getAttribute('data-src');
      video.controls = true;
      video.playsInline = true;
      video.setAttribute('aria-label', button.getAttribute('aria-label'));
      tile.appendChild(video);
      tile.classList.add('is-playing');
      video.focus();
      var played = video.play();
      if (played && played.catch) played.catch(function () { /* controls stay available */ });
    });
  });

  /* ---------- Photo gallery ---------- */
  // Photos: [data-lightbox-item] elements (their value is the position in
  // their group, data-lightbox-group; one group if none is given), each with
  // data-src, -srcset, -alt, -width, -height and optionally -caption.
  // Openers: [data-lightbox-open] (the position to start at, read at click
  // time) in the same group. A group of one shows no arrows or counter.
  var dialog = document.querySelector('[data-lightbox]');
  var openers = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox-open]'));
  if (!dialog || !openers.length || typeof dialog.showModal !== 'function') return;

  var image = dialog.querySelector('[data-lightbox-image]');
  var caption = dialog.querySelector('[data-lightbox-caption]');
  var count = dialog.querySelector('[data-lightbox-count]');
  var prev = dialog.querySelector('[data-lightbox-prev]');
  var next = dialog.querySelector('[data-lightbox-next]');
  var closeButton = dialog.querySelector('[data-lightbox-close]');
  var rtl = document.documentElement.dir === 'rtl';
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox-item]'));
  var photos = [];
  var total = 0;
  var current = 0;
  var opener = null;

  function groupOf(el) { return el.getAttribute('data-lightbox-group') || ''; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function show(index) {
    current = (index + total) % total;
    var source = photos[current];
    image.removeAttribute('srcset');
    image.src = source.getAttribute('data-src');
    image.srcset = source.getAttribute('data-srcset') || '';
    image.sizes = '100vw';
    image.alt = source.getAttribute('data-alt') || '';
    image.width = +source.getAttribute('data-width') || 0;
    image.height = +source.getAttribute('data-height') || 0;
    caption.textContent = source.getAttribute('data-caption') || source.getAttribute('data-alt') || '';
    count.textContent = total > 1 ? pad(current + 1) + ' / ' + pad(total) : '';
  }

  function open(index, from) {
    opener = from || null;
    var group = from ? groupOf(from) : '';
    // Photos of this group, in gallery order.
    photos = items.filter(function (el) { return groupOf(el) === group; }).sort(function (a, b) {
      return a.getAttribute('data-lightbox-item') - b.getAttribute('data-lightbox-item');
    });
    total = photos.length;
    if (!total) return;
    if (prev) prev.hidden = total < 2;
    if (next) next.hidden = total < 2;
    show(index);
    dialog.showModal();
    (total > 1 && next ? next : closeButton).focus();
  }

  openers.forEach(function (button) {
    button.addEventListener('click', function () {
      open(+button.getAttribute('data-lightbox-open'), button);
    });
  });

  if (prev) prev.addEventListener('click', function () { show(current - 1); });
  if (next) next.addEventListener('click', function () { show(current + 1); });
  closeButton.addEventListener('click', function () { dialog.close(); });

  // Click on the dark area around the photo closes the gallery.
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('keydown', function (event) {
    if (total < 2) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); show(current + (rtl ? -1 : 1)); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(current + (rtl ? 1 : -1)); }
  });

  // Escape closes the dialog natively; either way, return focus.
  dialog.addEventListener('close', function () {
    if (opener) opener.focus();
  });

  // Swipe between photos.
  var start = null;
  dialog.addEventListener('pointerdown', function (event) {
    if (event.pointerType !== 'mouse') start = { x: event.clientX, y: event.clientY };
  });
  dialog.addEventListener('pointerup', function (event) {
    if (!start || total < 2) { start = null; return; }
    var dx = event.clientX - start.x, dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    show(current + ((dx < 0) !== rtl ? 1 : -1));
  });
  dialog.addEventListener('pointercancel', function () { start = null; });
})();
