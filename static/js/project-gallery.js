/*
 * Gindi Innovations — interactive project page (vanilla JS).
 * Markup: templates/partials/project_gallery.html.
 *
 * - Tabs (Completed | Concept Visualization): an ARIA tab list; arrow keys,
 *   Home and End move between tabs. Each panel keeps its own state, so each
 *   tab comes back on the image that was showing.
 * - Each panel is a gallery ([data-pg-gallery]): thumbnails choose the large
 *   image. The new image is loaded first, then fades in over the old one
 *   (FADE_MS; at once with reduced motion), and its caption, counter,
 *   selected thumbnail and full screen position change with it. If it fails
 *   to load, everything stays on the current image and a short message is
 *   announced.
 * - Completed adds markers on each photo (links to its connected views; the
 *   outgoing photo's markers hide at once, the new photo's appear with it),
 *   "Previous View" and "Overview". Previous View returns to the photo
 *   visited before, as long as there is one: an in-page history of the
 *   photos shown (thumbnails, markers and Overview add to it; going back
 *   does not; choosing the photo already shown changes nothing). The
 *   browser's own Back button is not touched.
 * - Concept Visualization adds Previous / Next (wrapping around).
 * - Full screen: the shared lightbox (projects-page.js) opens at the image
 *   shown, via the expand button's data-lightbox-open, within its own group.
 * - Sizing: --pg-above (on the section) is the large image's distance from
 *   the top of the page, so CSS can size it to the rest of the first screen
 *   (.pg-fit in project-gallery.css). Measured again on resize, on a tab
 *   change and whenever the heading changes height (fonts, wrapping).
 * Without JS the page lists every image instead (CSS: .no-js).
 */
(function () {
  'use strict';

  var FADE_MS = 280; // keep in sync with --pg-fade in project-gallery.css

  var root = document.querySelector('[data-pg]');
  if (!root) return;
  var rtl = document.documentElement.dir === 'rtl';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || root).querySelectorAll(selector));
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------- Sizing: room for the whole image in the first screen ---------- */
  function measure() {
    var frame = root.querySelector('.pg-panel.is-active .pg-frame') || root.querySelector('.pg-frame');
    if (!frame) return;
    var top = frame.getBoundingClientRect().top + window.scrollY;
    root.style.setProperty('--pg-above', Math.round(top) + 'px');
  }
  var measuring = false;
  function remeasure() {
    if (measuring) return;
    measuring = true;
    window.requestAnimationFrame(function () { measuring = false; measure(); });
  }
  measure();
  window.addEventListener('resize', remeasure);
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(root.querySelector('.pg-head'));

  /* ---------- Tabs ---------- */
  var tabs = $$('[data-pg-tab]');

  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.classList.toggle('is-active', on);
      panel.hidden = !on;
    });
    if (focus) tab.focus();
    remeasure();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab, false); });
    tab.addEventListener('keydown', function (event) {
      var step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[event.key];
      var target = null;
      if (step) target = tabs[(i + step + tabs.length) % tabs.length];
      else if (event.key === 'Home') target = tabs[0];
      else if (event.key === 'End') target = tabs[tabs.length - 1];
      if (!target) return;
      event.preventDefault();
      selectTab(target, true);
    });
  });
  if (tabs.length) selectTab(tabs[0], false);

  /* ---------- A gallery: one large image, thumbnails ---------- */
  function Gallery(gallery) {
    var frame = gallery.querySelector('[data-pg-frame]');
    var image = frame.querySelector('[data-pg-image]');
    var caption = gallery.querySelector('[data-pg-caption]');
    var count = gallery.querySelector('[data-pg-count]');
    var expand = gallery.querySelector('[data-pg-expand]');
    var status = gallery.querySelector('[data-pg-status]');
    var strip = gallery.querySelector('[data-pg-thumbs]');
    var thumbs = $$('[data-pg-thumb]', gallery);
    var self = { current: 0, total: thumbs.length, gallery: gallery, onShow: null, onLeave: null };
    var wanted = 0; // the image being loaded (the last one asked for wins)

    // Scroll the thumbnail strip (only the strip, never the page) so the
    // selected thumbnail is fully visible.
    function keepInView(thumb) {
      var s = strip.getBoundingClientRect();
      var t = thumb.getBoundingClientRect();
      var behavior = reduceMotion.matches ? 'auto' : 'smooth';
      if (t.left < s.left) strip.scrollBy({ left: t.left - s.left - 8, behavior: behavior });
      else if (t.right > s.right) strip.scrollBy({ left: t.right - s.right + 8, behavior: behavior });
    }

    function update(index) {
      self.current = index;
      var thumb = thumbs[index];
      caption.textContent = thumb.getAttribute('data-caption');
      count.textContent = pad(index + 1);
      thumbs.forEach(function (t, i) {
        if (i === index) t.setAttribute('aria-current', 'true');
        else t.removeAttribute('aria-current');
      });
      expand.setAttribute('data-lightbox-open', String(index));
      keepInView(thumb);
    }

    function load(img) {
      if (img.decode) return img.decode();
      return new Promise(function (resolve, reject) {
        img.onload = resolve;
        img.onerror = reject;
      });
    }

    // Shows image "index"; "then(previous)" runs once it is shown.
    self.select = function (index, then) {
      wanted = index;
      if (index === self.current) {
        if (self.onShow) self.onShow(index, null);
        return;
      }
      var thumb = thumbs[index];
      var next = image.cloneNode(false);
      next.removeAttribute('fetchpriority');
      next.removeAttribute('srcset');
      next.loading = 'eager';
      next.srcset = thumb.getAttribute('data-srcset');
      next.src = thumb.getAttribute('data-src');
      next.alt = thumb.getAttribute('data-alt');
      next.classList.add('is-entering');
      if (self.onLeave) self.onLeave();
      gallery.setAttribute('aria-busy', 'true');
      load(next).then(function () {
        if (wanted !== index) return; // another image was chosen meanwhile
        gallery.removeAttribute('aria-busy');
        status.textContent = '';
        var previous = self.current;
        var old = image;
        old.parentNode.insertBefore(next, old.nextSibling);
        image = next;
        update(index);
        if (self.onShow) self.onShow(index, previous);
        void next.offsetWidth; // start the fade from transparent
        next.classList.remove('is-entering');
        window.setTimeout(function () { old.remove(); }, reduceMotion.matches ? 0 : FADE_MS);
        if (then) then(previous);
      }, function () {
        if (wanted !== index) return;
        wanted = self.current;
        gallery.removeAttribute('aria-busy');
        if (self.onShow) self.onShow(self.current, null);
        status.textContent = gallery.getAttribute('data-failed');
      });
    };

    // Fetch an image ahead when a control that opens it is pointed at or focused.
    self.prefetch = function (index) {
      var thumb = thumbs[index];
      if (!thumb || thumb.getAttribute('data-prefetched')) return;
      thumb.setAttribute('data-prefetched', '1');
      var img = new Image();
      img.sizes = image.sizes;
      img.srcset = thumb.getAttribute('data-srcset');
      img.src = thumb.getAttribute('data-src');
    };

    thumbs.forEach(function (thumb, i) {
      thumb.addEventListener('click', function () { self.select(i); });
      thumb.addEventListener('pointerenter', function () { self.prefetch(i); });
      thumb.addEventListener('focus', function () { self.prefetch(i); });
    });

    self.expand = expand;
    return self;
  }

  /* ---------- Completed: markers, Previous View, Overview ---------- */
  var completedEl = root.querySelector('#pg-completed [data-pg-gallery]');
  if (completedEl) {
    var completed = Gallery(completedEl);
    var spotSets = $$('[data-pg-hotspots]', completedEl);
    var previousButton = completedEl.querySelector('[data-pg-previous]');
    var homeButton = completedEl.querySelector('[data-pg-home]');
    var visited = [];       // photos shown before the current one, oldest first
    var goingBack = false;  // the change in progress comes from Previous View

    // Only the given photo's markers are shown (none for -1, during a change).
    var showSpots = function (index) {
      spotSets.forEach(function (set) { set.hidden = +set.getAttribute('data-pg-hotspots') !== index; });
    };
    var updateTools = function () {
      previousButton.disabled = !visited.length;
      homeButton.disabled = completed.current === 0;
      if (completed.current === 0) homeButton.setAttribute('aria-current', 'true');
      else homeButton.removeAttribute('aria-current');
    };

    completed.onLeave = function () { showSpots(-1); };
    completed.onShow = function (index, previous) {
      if (previous !== null && previous !== index) {
        if (goingBack) visited.pop();
        else visited.push(previous);
      }
      goingBack = false;
      showSpots(index);
      updateTools();
    };

    // After a marker or a toolbar button (which may now be hidden or
    // disabled), focus stays in the gallery's controls.
    var focusAfter = function () {
      if (!previousButton.disabled) previousButton.focus();
      else if (!homeButton.disabled) homeButton.focus();
      else completed.expand.focus();
    };

    $$('[data-pg-goto]', completedEl).forEach(function (spot) {
      var target = +spot.getAttribute('data-pg-goto');
      spot.addEventListener('pointerenter', function () { completed.prefetch(target); });
      spot.addEventListener('focus', function () { completed.prefetch(target); });
      spot.addEventListener('click', function () { goingBack = false; completed.select(target, focusAfter); });
    });

    previousButton.addEventListener('click', function () {
      if (!visited.length) return;
      goingBack = true;
      completed.select(visited[visited.length - 1], function () {
        if (previousButton.disabled) focusAfter();
      });
    });
    previousButton.addEventListener('pointerenter', function () {
      if (visited.length) completed.prefetch(visited[visited.length - 1]);
    });

    homeButton.addEventListener('click', function () {
      goingBack = false;
      completed.select(0, focusAfter);
    });

    // Thumbnails are plain forward moves.
    $$('[data-pg-thumb]', completedEl).forEach(function (thumb) {
      thumb.addEventListener('click', function () { goingBack = false; }, true);
    });

    updateTools();
  }

  /* ---------- Concept Visualization: Previous / Next ---------- */
  var conceptEl = root.querySelector('#pg-concept [data-pg-gallery]');
  if (conceptEl) {
    var concept = Gallery(conceptEl);
    $$('[data-pg-step]', conceptEl).forEach(function (button) {
      var step = +button.getAttribute('data-pg-step');
      var target = function () { return (concept.current + step + concept.total) % concept.total; };
      button.addEventListener('click', function () { concept.select(target()); });
      button.addEventListener('pointerenter', function () { concept.prefetch(target()); });
    });
  }
})();
