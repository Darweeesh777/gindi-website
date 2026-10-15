/*
 * Gindi Innovations — featured projects carousel (vanilla JS, no dependencies).
 *
 * Thumbnails, arrows, keyboard arrows on the thumbnails and horizontal swipes
 * on the image all select a project; the name, work description, link, image,
 * active thumbnail and counter change together. Manual only, no autoplay;
 * previous/next wrap round.
 *
 * Images: only the first loads with the page; when the section comes near,
 * the others are fetched in the background. A selected project switches once
 * its image is decoded (at most DECODE_WAIT_MS), and then everything changes
 * in the same frame: the image fades, and the name, description and button
 * fade up, staggered (CSS). Rapid clicks simply retarget: only the latest
 * selection is shown.
 */
(function () {
  'use strict';

  var root = document.querySelector('[data-carousel]');
  if (!root) return;

  var panels = Array.prototype.slice.call(root.querySelectorAll('[data-panel]'));
  var slides = Array.prototype.slice.call(root.querySelectorAll('[data-slide]'));
  var thumbs = Array.prototype.slice.call(root.querySelectorAll('[data-thumb]'));
  var strip = root.querySelector('[data-thumbs]');
  var stage = root.querySelector('[data-stage]');
  var counter = root.querySelector('[data-counter]');
  var status = root.querySelector('[data-status]');
  var count = slides.length;
  if (count < 2) return;

  var FADE_MS = 400;        // matches .featured__slide in sections.css
  var DECODE_WAIT_MS = 700; // switch anyway if the image takes longer
  var SWIPE_PX = 40;

  var current = 0;          // the selection last requested (what arrows step from)
  var request = 0;          // id of the latest selection
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var rtl = document.documentElement.dir === 'rtl';

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function imageOf(slide) { return slide.querySelector('img'); }

  // A failed image falls back to the branded placeholder beneath it.
  slides.forEach(function (slide) {
    var img = imageOf(slide);
    if (!img) return;
    img.addEventListener('error', function () { slide.classList.add('is-broken'); });
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) slide.classList.add('is-broken');
  });

  function whenReady(slide) {
    var img = imageOf(slide);
    if (!img || slide.classList.contains('is-broken')) return Promise.resolve();
    img.loading = 'eager';
    var ready = img.decode ? img.decode() : new Promise(function (resolve) {
      if (img.complete) resolve(); else img.addEventListener('load', resolve, { once: true });
    });
    var timeout = new Promise(function (resolve) { setTimeout(resolve, DECODE_WAIT_MS); });
    return Promise.race([ready.catch(function () {}), timeout]);
  }

  // Keep the active thumbnail inside the strip's visible area (never scrolls the page).
  function revealThumb(thumb) {
    if (!strip) return;
    var s = strip.getBoundingClientRect();
    var t = thumb.getBoundingClientRect();
    var delta = t.left < s.left ? t.left - s.left - 8 : (t.right > s.right ? t.right - s.right + 8 : 0);
    if (delta) strip.scrollBy({ left: delta, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  }

  function updateText(index) {
    panels.forEach(function (panel, i) {
      var active = i === index;
      panel.classList.toggle('is-active', active);
      panel.inert = !active;
      if (active) panel.removeAttribute('aria-hidden');
      else panel.setAttribute('aria-hidden', 'true');
    });
    thumbs.forEach(function (thumb, i) {
      thumb.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
    if (counter) counter.textContent = pad(index + 1);
    if (status && thumbs[index]) {
      status.textContent = thumbs[index].querySelector('.visually-hidden').textContent;
    }
    if (thumbs[index]) revealThumb(thumbs[index]);
  }

  function go(index) {
    index = (index + count) % count;
    if (index === current) return;
    current = index;
    var id = ++request;
    var next = slides[index];
    next.hidden = false;
    whenReady(next).then(function () {
      if (id !== request) return; // a newer selection took over
      // Text, button, thumbnail, counter and image change together.
      updateText(index);
      slides.forEach(function (slide, i) { slide.classList.toggle('is-active', i === index); });
      // After the fade, take the others out of the frame again.
      setTimeout(function () {
        if (id !== request) return;
        slides.forEach(function (slide, i) { if (i !== index) slide.hidden = true; });
      }, reduceMotion.matches ? 0 : FADE_MS + 50);
    });
  }

  function step(delta) { go(current + delta); }

  thumbs.forEach(function (thumb, i) {
    thumb.addEventListener('click', function () { go(i); });
  });

  var prev = root.querySelector('[data-prev]');
  var next = root.querySelector('[data-next]');
  if (prev) prev.addEventListener('click', function () { step(-1); });
  if (next) next.addEventListener('click', function () { step(1); });

  // Arrow keys / Home / End on a thumbnail move the selection and the focus.
  if (strip) {
    strip.addEventListener('keydown', function (event) {
      var delta = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      var target = null;
      if (delta) target = current + (rtl ? -delta : delta);
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = count - 1;
      if (target === null) return;
      event.preventDefault();
      go(target);
      thumbs[current].focus();
    });
  }

  // Horizontal swipes on the image; vertical movement is left to the page
  // (touch-action: pan-y in CSS).
  if (stage && window.PointerEvent) {
    var start = null;
    stage.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'mouse') return;
      start = { x: event.clientX, y: event.clientY };
    });
    stage.addEventListener('pointerup', function (event) {
      if (!start) return;
      var dx = event.clientX - start.x, dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      // Swiping towards the reading start shows the next project.
      step((dx < 0) !== rtl ? 1 : -1);
    });
    stage.addEventListener('pointercancel', function () { start = null; });
  }

  // Fetch the other images in the background once the section is near.
  function prefetch() {
    slides.forEach(function (slide) {
      var img = imageOf(slide);
      if (!img || slide.classList.contains('is-active')) return;
      var copy = new Image();
      copy.sizes = img.sizes;
      copy.srcset = img.getAttribute('srcset') || '';
      copy.src = img.getAttribute('src');
    });
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) {
        observer.disconnect();
        prefetch();
      }
    }, { rootMargin: '200px 0px' });
    observer.observe(root);
  }
})();
