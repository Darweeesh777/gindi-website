/*
 * Gindi Innovations — the Geometric G reveal in the Gindi Innovations section
 * (GSAP + ScrollTrigger).
 *
 * The page scrolls normally. A faint outline of the emblem is there from the
 * start; one scrubbed timeline then runs while the image area moves into
 * place (see range() below), in fractions:
 *   0.00-0.38  the stroke traces the emblem over the faint outline: the main
 *              contour from the crown down, then the upper arm, and the
 *              keystone last;
 *   0.30-0.58  the photograph rises into the emblem's body; its openings stay
 *              empty and the outline stays around it;
 *   0.55-1.00  the openings fill gradually while an arch window — the emblem's
 *              outer silhouette — opens out to the whole arched frame, and the
 *              outline fades.
 * The photograph never moves or scales: only the mask changes. The window
 * grows by its radius and side length, never by stretching the emblem.
 * Scrolling up plays it backwards.
 *
 * gsap.matchMedia builds it when motion is allowed and reverts it (resetting
 * the SVG) when not. GindiEmblemReveal.destroy() removes it all.
 */
(function () {
  'use strict';

  var figure = document.querySelector('[data-emblem-reveal]');
  if (!figure) return;

  if (!window.gsap || !window.ScrollTrigger) {
    figure.classList.add('is-reveal-off'); // CSS shows the completed image
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  var FRAME_W = 300;                 // SVG units across the frame (apps/core/emblem.py)
  var FRAME_H = 400;
  var STROKE_PX = 1.25;
  var RISE_SOFTNESS = 0.15;          // height of the soft edge as the photo rises
  var MIN_RANGE = 0.4;               // preferred shortest scroll range, in viewport heights
  var BASE_DRAWN_AT = 0.1;           // progress at which the stroke reaches the emblem's base
  var SCRUB = 1.5;                   // seconds the reveal takes to catch up with the scroll

  function numbers(attr) { return figure.getAttribute(attr).split(' ').map(Number); }
  var WINDOW_START = numbers('data-window-start'); // cx, cy, r, bottom
  var WINDOW_END = numbers('data-window-end');

  var photo = figure.querySelector('[data-emblem-photo]');
  var image = figure.querySelector('[data-emblem-image]');
  var header = document.querySelector('[data-header]');
  var ghost = figure.querySelector('[data-emblem-ghost]');
  var outline = figure.querySelector('[data-emblem-outline]');
  var rise = figure.querySelectorAll('[data-emblem-rise]');
  var windowShape = figure.querySelector('[data-emblem-window]');
  var draws = {
    main: figure.querySelector('[data-emblem-draw="main"]'),
    arm: figure.querySelector('[data-emblem-draw="arm"]'),
    keystone: figure.querySelector('[data-emblem-draw="keystone"]')
  };
  // The emblem's placement, from transform="translate(x y) scale(s)".
  var place = /translate\(([\d.]+) ([\d.]+)\) scale\(([\d.]+)\)/.exec(outline.getAttribute('transform')).map(Number);
  var EMBLEM_BASE = place[2] + 357 * place[3];   // frame units
  var initialWindow = windowShape.getAttribute('d');

  var INITIAL = { main: 0, arm: 0, keystone: 0, rise: -RISE_SOFTNESS, holes: 0, outline: 1, open: 0 };
  var state = {};

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(v) { return Math.min(1, Math.max(0, v)); }
  function n(v) { return Math.round(v * 1000) / 1000; }

  // Same shape as emblem.arch(): semicircle on straight sides.
  function arch(cx, cy, r, bottom) {
    return 'M ' + n(cx - r) + ' ' + n(bottom) + ' V ' + n(cy) +
      ' A ' + n(r) + ' ' + n(r) + ' 0 0 1 ' + n(cx + r) + ' ' + n(cy) + ' V ' + n(bottom) + ' Z';
  }

  // Scroll range, as positions of the frame's top in the viewport (px).
  // Ends when the frame sits just below the header (fully visible when it
  // fits, otherwise centred below it). Starts as the emblem's base comes into
  // view, or earlier to make the range at least MIN_RANGE — but never so early
  // that the base is still off screen when the stroke reaches it.
  function range() {
    var vh = window.innerHeight;
    var top = header ? header.offsetHeight : 0;
    var h = figure.offsetHeight;
    var slack = vh - top - h;
    var end = top + (slack >= 32 ? 16 : slack / 2);
    var baseInView = vh * 0.97 - h * EMBLEM_BASE / FRAME_H;
    var earliest = (baseInView - BASE_DRAWN_AT * end) / (1 - BASE_DRAWN_AT);
    var start = Math.max(baseInView, Math.min(end + vh * MIN_RANGE, earliest));
    return { start: Math.round(start), end: Math.round(end) };
  }

  // Keep the strokes ~1.25px whatever the frame's rendered width.
  function measure() {
    var width = STROKE_PX * FRAME_W / (figure.clientWidth || FRAME_W) / place[3];
    ghost.setAttribute('stroke-width', n(width));
    outline.setAttribute('stroke-width', n(width));
  }

  function render() {
    Object.keys(draws).forEach(function (key) {
      draws[key].style.strokeDashoffset = 1 - state[key];
      // A zero-length dash still paints its round cap: hide paths not yet begun.
      draws[key].style.visibility = state[key] > 0 ? 'visible' : 'hidden';
    });
    ghost.style.opacity = state.outline;
    outline.style.opacity = state.outline;
    rise[0].setAttribute('offset', clamp01(state.rise));
    rise[1].setAttribute('offset', clamp01(state.rise + RISE_SOFTNESS));
    windowShape.setAttribute('opacity', state.holes);
    var t = state.open;
    windowShape.setAttribute('d', arch(
      lerp(WINDOW_START[0], WINDOW_END[0], t), lerp(WINDOW_START[1], WINDOW_END[1], t),
      lerp(WINDOW_START[2], WINDOW_END[2], t), lerp(WINDOW_START[3], WINDOW_END[3], t)));
  }

  function reset() {
    Object.keys(draws).forEach(function (key) {
      draws[key].style.strokeDashoffset = '';
      draws[key].style.visibility = '';
    });
    [ghost, outline].forEach(function (g) {
      g.style.opacity = '';
      g.setAttribute('stroke-width', '1.1');
    });
    rise[0].setAttribute('offset', 0);
    rise[1].setAttribute('offset', 0);
    windowShape.setAttribute('opacity', 0);
    windowShape.setAttribute('d', initialWindow);
  }

  // The SVG draws the file the <img> has already chosen and loaded.
  function usePhoto() {
    function set() {
      if (photo.currentSrc) image.setAttribute('href', photo.currentSrc);
    }
    if (photo.complete && photo.naturalWidth) set();
    else photo.addEventListener('load', set, { once: true });
  }

  function build() {
    Object.keys(INITIAL).forEach(function (key) { state[key] = INITIAL[key]; });

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate: render,
      scrollTrigger: {
        trigger: figure,
        start: function () { return 'top ' + range().start + 'px'; },
        end: function () { return 'top ' + range().end + 'px'; },
        // Even after a fast scroll past either end, the reveal eases to its
        // first or last frame rather than jumping.
        scrub: SCRUB,
        onRefresh: measure
      }
    });

    // Contours: main body, then the details.
    tl.to(state, { main: 1, duration: 0.30, ease: 'power1.inOut' }, 0)
      .to(state, { arm: 1, duration: 0.20, ease: 'power1.inOut' }, 0.14)
      .to(state, { keystone: 1, duration: 0.12, ease: 'power1.inOut' }, 0.26)
    // The photograph rises into the body.
      .to(state, { rise: 1, duration: 0.28, ease: 'sine.inOut' }, 0.30)
    // The openings fill as the window opens to the frame; the outline steps back.
      .to(state, { holes: 1, duration: 0.25, ease: 'sine.inOut' }, 0.55)
      .to(state, { open: 1, duration: 0.42, ease: 'power2.inOut' }, 0.58)
      .to(state, { outline: 0, duration: 0.20, ease: 'sine.in' }, 0.62);
    tl.duration(1);

    measure();
    render();
  }

  var mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    build();
    usePhoto();
    return reset;
  });

  // Web fonts change the page height: recalculate positions once they load.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  // Arriving with a section in the URL (/#about from another page): each
  // refresh measures from the top and restores the scroll position, which
  // cuts the browser's smooth scroll to the section short. Until the visitor
  // scrolls, put the section back in place after every refresh.
  var hashTarget = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (hashTarget) {
    // Next frame: after ScrollTrigger has restored its saved position.
    var keepHash = function () {
      requestAnimationFrame(function () { hashTarget.scrollIntoView({ block: 'start', behavior: 'instant' }); });
    };
    var release = function () {
      ScrollTrigger.removeEventListener('refresh', keepHash);
      ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (type) {
        window.removeEventListener(type, release, true);
      });
    };
    ScrollTrigger.addEventListener('refresh', keepHash);
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (type) {
      window.addEventListener(type, release, true);
    });
  }

  window.GindiEmblemReveal = {
    destroy: function () { mm.revert(); }
  };
})();
