/*
 * Gindi Innovations — "From Vision to Reality" project switcher (vanilla JS).
 *
 * The arrows and dots switch the whole project: the slide in the frame, the
 * project name, the counter and the active dot. One project is shown at a
 * time; the others are hidden (so not focusable or read). Previous/next wrap
 * around; there is no autoplay and no swipe (sideways drags on the frame
 * belong to the comparison handle, static/js/compare-slider.js).
 *
 * On a switch the new pair fades in over the old one (FADE_MS; at once with
 * prefers-reduced-motion) once both of its images have loaded, and the handle
 * returns to the middle. The frame keeps its size and the images never move.
 * The neighbouring pairs are fetched ahead. If either image of a pair fails,
 * neither is shown: the slide shows a short notice instead.
 */
(function () {
  'use strict';

  var FADE_MS = 400; // keep in sync with --vision-fade in sections.css
  var LOAD_TIMEOUT_MS = 6000;

  var section = document.getElementById('vision');
  var root = section && section.querySelector('[data-compare]');
  if (!root) return;

  var slides = Array.prototype.slice.call(root.querySelectorAll('[data-vision-slide]'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function images(slide) {
    return Array.prototype.slice.call(slide.querySelectorAll('img'));
  }

  function isLoaded(img) {
    return img.complete && img.naturalWidth > 0;
  }

  // Either image failing hides both (CSS: .is-broken), never half a pair.
  function markBroken(slide) {
    slide.classList.add('is-broken');
    slide.querySelector('[data-vision-error]').hidden = false;
    if (slide.classList.contains('is-active')) root.classList.add('is-broken');
  }

  slides.forEach(function (slide) {
    images(slide).forEach(function (img) {
      img.addEventListener('error', function () { markBroken(slide); });
      if (img.complete && img.naturalWidth === 0) markBroken(slide); // failed before this script ran
      img.addEventListener('load', function () {
        if (images(slide).every(isLoaded)) slide.classList.remove('is-pending');
      });
    });
  });

  if (slides.length < 2) return;

  var names = Array.prototype.slice.call(section.querySelectorAll('[data-vision-name]'));
  var status = section.querySelector('[data-vision-status]');
  var counter = section.querySelector('[data-vision-current]');
  var dots = Array.prototype.slice.call(section.querySelectorAll('[data-vision-dot]'));
  var current = 0;
  var busy = false;
  var queued = null;

  function wrap(index) {
    return (index + slides.length) % slides.length;
  }

  // Fetch a pair now instead of when it would scroll into view.
  function fetchPair(slide) {
    images(slide).forEach(function (img) { img.loading = 'eager'; });
  }

  function preloadNeighbours() {
    fetchPair(slides[wrap(current + 1)]);
    fetchPair(slides[wrap(current - 1)]);
  }

  // Resolves once both images have loaded or either has failed; after
  // LOAD_TIMEOUT_MS it goes ahead anyway, with the images kept hidden
  // (.is-pending) until both are there.
  function whenReady(slide) {
    fetchPair(slide);
    var imgs = images(slide);
    if (slide.classList.contains('is-broken') || imgs.every(isLoaded)) return Promise.resolve();
    slide.classList.add('is-pending');
    return new Promise(function (resolve) {
      var timer = window.setTimeout(resolve, LOAD_TIMEOUT_MS);
      var check = function () {
        if (slide.classList.contains('is-broken') || imgs.every(isLoaded)) {
          window.clearTimeout(timer);
          resolve();
        }
      };
      imgs.forEach(function (img) {
        img.addEventListener('load', check);
        img.addEventListener('error', check);
      });
    });
  }

  function updateNav(index) {
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    counter.textContent = pad(index + 1);
    names.forEach(function (el, i) {
      el.classList.toggle('is-active', i === index);
      if (i === index) el.removeAttribute('aria-hidden');
      else el.setAttribute('aria-hidden', 'true');
    });
    status.textContent = pad(index + 1) + ' / ' + pad(slides.length) + ': ' + names[index].textContent;
    dots.forEach(function (dot, i) {
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  function go(index) {
    index = wrap(index);
    if (busy) {
      queued = index;
      return;
    }
    if (index === current) return;
    busy = true;
    var from = slides[current];
    var to = slides[index];
    current = index;

    whenReady(to).then(function () {
      updateNav(index); // name, counter and dot change with the images
      var fade = reduceMotion.matches ? 0 : FADE_MS;
      // The old pair keeps its own clip while the new one fades in over it.
      from.style.setProperty('--pos', getComputedStyle(root.querySelector('[data-compare-frame]')).getPropertyValue('--pos'));
      from.inert = true;
      from.classList.remove('is-active');
      from.classList.add('is-leaving');
      to.classList.add('is-entering');
      to.hidden = false;
      to.inert = false;
      to.classList.add('is-active');
      root.classList.toggle('is-broken', to.classList.contains('is-broken'));
      root.dispatchEvent(new CustomEvent('compare:reset')); // handle back to the middle
      void to.offsetWidth; // start the fade from transparent
      to.classList.remove('is-entering');

      window.setTimeout(function () {
        from.hidden = true;
        from.classList.remove('is-leaving');
        from.style.removeProperty('--pos');
        busy = false;
        preloadNeighbours();
        if (queued !== null) {
          var next = queued;
          queued = null;
          go(next);
        }
      }, fade);
    });
  }

  section.querySelector('[data-vision-prev]').addEventListener('click', function () { go(current - 1); });
  section.querySelector('[data-vision-next]').addEventListener('click', function () { go(current + 1); });
  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () { go(i); });
  });

  // Fetch the neighbouring pairs once the section is near.
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        observer.disconnect();
        preloadNeighbours();
      }
    }, { rootMargin: '400px 0px' });
    observer.observe(section);
  } else {
    preloadNeighbours();
  }
})();
