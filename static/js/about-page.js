/*
 * Gindi Innovations — About page motion (vanilla JS, no dependencies).
 *
 * Reveals (IntersectionObserver, once each, never replayed):
 *   - each chapter when ~20% of it is in view ([data-chapter]);
 *   - the detail photos and the closing section ([data-reveal-group]);
 *   - each timeline step when it reaches 85% of the viewport height, with an
 *     80ms stagger (max 320ms) when several arrive together.
 * Chapter line (requestAnimationFrame on scroll/resize): progress 0 when the
 * top of Chapter 01 reaches 75% of the viewport height, 1 when the bottom of
 * Chapter 03 does; clamped, applied as scaleY. A chapter's keystone marker is
 * active once its heading has crossed 75% of the viewport height.
 *
 * The "before reveal" states only exist under html.ab-motion, added at the
 * end of setup — if anything fails, or motion is reduced, all content and the
 * line simply show, static.
 */
(function () {
  'use strict';

  var story = document.querySelector('[data-story]');
  if (!story || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var root = document.documentElement;
  var chapters = Array.prototype.slice.call(document.querySelectorAll('[data-chapter]'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('[data-reveal-group]'));
  var steps = Array.prototype.slice.call(document.querySelectorAll('[data-step]'));
  var line = story.querySelector('[data-story-line]');
  var markers = chapters.map(function (chapter) {
    return { marker: chapter.querySelector('[data-marker]'), anchor: chapter.querySelector('[data-marker-anchor]') };
  });
  var LINE_AT = 0.75;

  function reveal(el) { el.classList.add('is-revealed'); }

  /* ---------- Reveals ---------- */
  var sectionObserver = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2 });
  chapters.concat(groups).forEach(function (el) { sectionObserver.observe(el); });

  var stepObserver = new IntersectionObserver(function (entries, observer) {
    var arriving = entries.filter(function (entry) { return entry.isIntersecting; });
    arriving.forEach(function (entry, i) {
      entry.target.style.setProperty('--step-delay', Math.min(i * 80, 320) + 'ms');
      reveal(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -15% 0px' }); // the bottom 15% doesn't count: "reaches 85%"
  steps.forEach(function (step) { stepObserver.observe(step); });

  /* ---------- Chapter line and markers ---------- */
  var first = chapters[0];
  var last = chapters[chapters.length - 1];
  var ticking = false;

  function update() {
    ticking = false;
    var at = window.innerHeight * LINE_AT;
    var top = first.getBoundingClientRect().top;
    var bottom = last.getBoundingClientRect().bottom;
    var progress = (at - top) / Math.max(1, bottom - top);
    progress = Math.min(1, Math.max(0, progress));
    if (line) line.style.transform = 'scaleY(' + progress.toFixed(4) + ')';
    markers.forEach(function (m) {
      if (m.marker && m.anchor) m.marker.classList.toggle('is-active', m.anchor.getBoundingClientRect().top <= at);
    });
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();

  // Ready: from here on, unrevealed content may be hidden until it reveals.
  root.classList.add('ab-motion');
})();
