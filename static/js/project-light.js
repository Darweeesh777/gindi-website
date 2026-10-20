/*
 * "Follow the Light" project page (templates/core/project_light.html).
 *
 * 1. The line of light. One continuous path through the hero and the two
 *    paired sections, drawn from the photographs' real positions (and redrawn
 *    whenever the story changes size, e.g. as photographs load): see route().
 *    On narrow screens it runs beside each photograph and crosses over the
 *    gap above the next one. Scroll position
 *    sets how much of it is lit: a reference line in the viewport moves down
 *    the page and the lit end follows it (horizontal runs take their share of
 *    the scroll, so the bright point never jumps). Scrolling up reverses it.
 *    Nothing intercepts the scroll. As the light runs along a photograph's
 *    top edge, the photograph rises from dim to its natural brightness
 *    (--lit, used by the CSS) and stays lit while the light is past it; the
 *    hero photograph starts clearly visible (82%) and brightens fully.
 *    With reduced motion, the line is drawn whole and every photograph lit.
 * 2. The carousel: buttons, keys (arrows, Home, End), mouse dragging (touch
 *    and trackpads scroll natively), group links, counter and progress.
 *    Photos open in the full-screen gallery (projects-page.js).
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var rtl = document.documentElement.dir === 'rtl';
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- 1. The line of light ---------- */
  var stage = document.querySelector('[data-light]');
  var svg = stage && stage.querySelector('[data-light-svg]');
  var moments = stage ? Array.prototype.slice.call(stage.querySelectorAll('[data-moment]')) : [];

  if (stage && svg && moments.length) {
    var frames = moments.map(function (m) { return m.querySelector('[data-moment-frame]'); });
    var paths = {}, head = null, samples = null, marks = [], total = 0, frame = 0;

    function el(name, attrs) {
      var node = document.createElementNS(NS, name);
      Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
      return node;
    }

    // Build the SVG once: track, halo, glow, core, and the bright point.
    var defs = el('defs', {});
    var grad = el('radialGradient', { id: 'villa-head-glow' });
    grad.appendChild(el('stop', { offset: '0', 'stop-color': '#ffd27a', 'stop-opacity': '0.75' }));
    grad.appendChild(el('stop', { offset: '0.35', 'stop-color': '#c8892b', 'stop-opacity': '0.32' }));
    grad.appendChild(el('stop', { offset: '1', 'stop-color': '#c8892b', 'stop-opacity': '0' }));
    defs.appendChild(grad);
    svg.appendChild(defs);
    ['track', 'halo', 'glow', 'core'].forEach(function (name) {
      paths[name] = svg.appendChild(el('path', { 'class': 'villa-line__' + name }));
    });
    head = svg.appendChild(el('g', { 'class': 'villa-line__head' }));
    head.appendChild(el('circle', { r: '26', fill: 'url(#villa-head-glow)' }));
    head.appendChild(el('circle', { r: '3.2', 'class': 'villa-line__head-core' }));

    // Corner points of the route (an orthogonal polyline), from the photographs' boxes.
    // Wide screens: from the hero photograph's top edge, down its inner side (between it and
    // the text) and on into the space below; in each pair, between the sections, across to the
    // upper photograph's inner side, down the gutter beside it and its text, along the top
    // edge of the lower photograph and down its outer side. The line keeps a fixed distance
    // (--villa-line-gap) from the photographs and crosses no text.
    function route() {
      var box = stage.getBoundingClientRect();
      var gap = parseFloat(getComputedStyle(stage).getPropertyValue('--villa-line-gap')) * 16 || 20;
      function rel(node) {
        var r = node.getBoundingClientRect();
        return { left: r.left - box.left, right: r.right - box.left, top: r.top - box.top, bottom: r.bottom - box.top,
                 cx: (r.left + r.right) / 2 - box.left, h: r.height, w: r.width };
      }
      var rects = frames.map(rel);
      var centre = box.width / 2;
      var wide = window.matchMedia('(min-width: 64rem)').matches;
      var pts = [], marks = [];
      function at(p) { pts.push(p); return p; }
      if (wide) {
        var hero = rects[0];
        var heroInner = hero.cx > centre ? hero.left - gap : hero.right + gap;
        var heroStart = at([hero.cx, hero.top - gap]);
        at([heroInner, hero.top - gap]);
        marks.push([heroStart, at([heroInner, hero.bottom])]);
        var prevX = heroInner;
        for (var i = 1; i < rects.length; i += 2) {
          var a = rects[i], b = rects[i + 1];
          var sectionTop = rel(frames[i].closest('section')).top;
          var innerA = a.cx < centre ? a.right + gap : a.left - gap;
          var y = (sectionTop + a.top - gap) / 2;      // between the sections
          at([prevX, y]);
          at([innerA, y]);
          var startA = at([innerA, a.top]);
          if (!b) { marks.push([startA, at([innerA, a.bottom])]); prevX = innerA; break; }
          var lane = b.top - gap;
          marks.push([startA, at([innerA, Math.min(a.top + a.h * 0.55, lane)])]);
          var outerB = b.cx > centre ? b.right + gap : b.left - gap;
          var startB = at([innerA, lane]);
          marks.push([startB, at([outerB, lane])]);
          at([outerB, b.bottom + gap]);
          prevX = outerB;
        }
        at([prevX, pts[pts.length - 1][1] + 64]);
      } else {
        // One column: alternate sides; the line crosses over the gap above each photograph.
        rects.forEach(function (r, i) {
          var leftFirst = (i % 2 === 0) !== rtl;
          var from = leftFirst ? r.right + gap : r.left - gap;
          var to = leftFirst ? r.left - gap : r.right + gap;
          var top = r.top - gap;
          if (i === 0) at([from, Math.max(0, top - 32)]);
          var start = at([i === 0 ? from : pts[pts.length - 1][0], top]);
          marks.push([start, at([to, top])]);
          if (i === rects.length - 1) at([to, r.bottom + gap + 56]);
        });
      }
      return { pts: pts, marks: marks, width: box.width, height: box.height };
    }

    // Rounded corners: straight runs joined by quadratic curves; samples every few px
    // (length, x, y and a scroll coordinate) and the length at each corner point.
    function build(r) {
      var pts = r.pts.filter(function (p, i) {
        var q = r.pts[i - 1];
        return !q || Math.abs(p[0] - q[0]) > 0.5 || Math.abs(p[1] - q[1]) > 0.5;
      });
      // Corner lengths are looked up by position (the filter drops repeated points).
      function find(p) {
        for (var k = 0; k < pts.length; k++) if (Math.abs(pts[k][0] - p[0]) < 1 && Math.abs(pts[k][1] - p[1]) < 1) return k;
        return 0;
      }
      var radius = 16;
      var d = 'M' + pts[0][0] + ' ' + pts[0][1];
      var list = [{ len: 0, x: pts[0][0], y: pts[0][1], h: 0 }];
      var len = 0, hsum = 0, x0 = pts[0][0], y0 = pts[0][1];
      var lenAt = [0];
      function lineTo(x, y) {
        var dx = x - x0, dy = y - y0, l = Math.hypot(dx, dy), n = Math.max(1, Math.ceil(l / 4));
        for (var k = 1; k <= n; k++) {
          var px = x0 + dx * k / n, py = y0 + dy * k / n;
          hsum += Math.abs(dx) / n; len += l / n;
          list.push({ len: len, x: px, y: py, h: hsum });
        }
        d += 'L' + x + ' ' + y; x0 = x; y0 = y;
      }
      function quadTo(cx, cy, x, y) {
        var n = 8, px = x0, py = y0, sx = x0, sy = y0;
        for (var k = 1; k <= n; k++) {
          var t = k / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
          var qx = a * sx + b * cx + c * x, qy = a * sy + b * cy + c * y;
          len += Math.hypot(qx - px, qy - py); hsum += Math.abs(qx - px);
          list.push({ len: len, x: qx, y: qy, h: hsum });
          px = qx; py = qy;
        }
        d += 'Q' + cx + ' ' + cy + ' ' + x + ' ' + y; x0 = x; y0 = y;
      }
      for (var i = 1; i < pts.length; i++) {
        var p = pts[i], prev = pts[i - 1], nextP = pts[i + 1];
        if (!nextP) { lineTo(p[0], p[1]); lenAt[i] = len; break; }
        var inL = Math.hypot(p[0] - prev[0], p[1] - prev[1]), outL = Math.hypot(nextP[0] - p[0], nextP[1] - p[1]);
        var rr = Math.min(radius, inL / 2, outL / 2);
        var ix = (p[0] - prev[0]) / inL, iy = (p[1] - prev[1]) / inL, ox = (nextP[0] - p[0]) / outL, oy = (nextP[1] - p[1]) / outL;
        lineTo(p[0] - ix * rr, p[1] - iy * rr);
        lenAt[i] = len + rr;
        quadTo(p[0], p[1], p[0] + ox * rr, p[1] + oy * rr);
      }
      // Scroll coordinate: vertical travel plus 60% of horizontal travel (never decreasing).
      list.forEach(function (s) { s.v = s.y + 0.6 * s.h; });
      return {
        d: d, list: list, total: len,
        marks: r.marks.map(function (m) { return [lenAt[find(m[0])] || 0, lenAt[find(m[1])] || 0]; }),
        width: r.width, height: r.height,
      };
    }

    function layout() {
      var b = build(route());
      svg.setAttribute('viewBox', '0 0 ' + b.width + ' ' + b.height);
      Object.keys(paths).forEach(function (k) {
        paths[k].setAttribute('d', b.d);
        paths[k].setAttribute('pathLength', b.total);
      });
      samples = b.list; total = b.total;
      marks = b.marks.map(function (m) { return { start: m[0], end: Math.max(m[1], m[0] + 1) }; });
      update();
    }

    function lengthFor(v) {
      var lo = 0, hi = samples.length - 1;
      if (v <= samples[0].v) return 0;
      if (v >= samples[hi].v) return total;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (samples[mid].v < v) lo = mid; else hi = mid; }
      var a = samples[lo], b = samples[hi], t = (v - a.v) / ((b.v - a.v) || 1);
      return a.len + (b.len - a.len) * t;
    }

    function pointAt(l) {
      var lo = 0, hi = samples.length - 1;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (samples[mid].len < l) lo = mid; else hi = mid; }
      var a = samples[lo], b = samples[hi], t = (l - a.len) / ((b.len - a.len) || 1);
      return [a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t];
    }

    function setLit(lit) {
      ['halo', 'glow', 'core'].forEach(function (k) {
        paths[k].setAttribute('stroke-dasharray', lit >= total ? 'none' : lit + ' ' + (total + 1));
      });
    }

    function update() {
      frame = 0;
      if (!samples) return;
      if (reduceMotion.matches) {
        setLit(total);
        head.style.display = 'none';
        moments.forEach(function (m) { m.style.setProperty('--lit', '1'); });
        return;
      }
      head.style.display = '';
      // The reference line, 62% down the viewport, in the stage's coordinates; mapped
      // over the path's vertical extent onto the scroll coordinate.
      var box = stage.getBoundingClientRect();
      var ref = window.innerHeight * 0.62 - box.top;
      var first = samples[0], last = samples[samples.length - 1];
      var f = (ref - first.y) / ((last.y - first.y) || 1);
      var lit = lengthFor(first.v + Math.max(0, Math.min(1, f)) * (last.v - first.v));
      setLit(lit);
      var p = pointAt(lit);
      head.setAttribute('transform', 'translate(' + p[0] + ' ' + p[1] + ')');
      head.style.opacity = lit <= 0.5 ? '0' : '1';
      marks.forEach(function (m, i) {
        var t = Math.max(0, Math.min(1, (lit - m.start) / (m.end - m.start)));
        t = t * t * (3 - 2 * t);
        // The hero photograph is already clearly visible on arrival, and brightens fully.
        if (i === 0) t = 0.82 + 0.18 * t;
        moments[i].style.setProperty('--lit', t.toFixed(3));
      });
    }

    function schedule() { if (!frame) frame = requestAnimationFrame(update); }

    window.addEventListener('scroll', schedule, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(function () { layout(); }).observe(stage);
    else window.addEventListener('resize', layout);
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', update);
    // Lazy photographs set their own size from width/height, so the layout is final now.
    layout();
  }

  /* ---------- 2. The carousel ---------- */
  var section = document.querySelector('[data-carousel]');
  var track = section && section.querySelector('[data-carousel-track]');
  if (!track) return;

  var slides = Array.prototype.slice.call(track.querySelectorAll('[data-slide]'));
  var prev = section.querySelector('[data-carousel-prev]');
  var next = section.querySelector('[data-carousel-next]');
  var count = section.querySelector('[data-carousel-count]');
  var groupLabel = section.querySelector('[data-carousel-group]');
  var mark = section.querySelector('[data-carousel-mark]');
  var progress = mark && mark.parentNode;
  var live = section.querySelector('[data-carousel-live]');
  var groupButtons = Array.prototype.slice.call(section.querySelectorAll('[data-carousel-goto]'));
  var current = -1;
  var pending = 0;

  section.querySelector('[data-carousel-nav]').hidden = false;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // The slide whose start edge is nearest the track's start (after its padding).
  function nearest() {
    var box = track.getBoundingClientRect();
    var pad0 = parseFloat(getComputedStyle(track).paddingInlineStart) || 0;
    var start = rtl ? box.right - pad0 : box.left + pad0;
    var best = 0, bestD = Infinity;
    slides.forEach(function (s, i) {
      var r = s.getBoundingClientRect();
      var d = Math.abs((rtl ? r.right : r.left) - start);
      if (d < bestD) { bestD = d; best = i; }
    });
    // At the end of the track, the last slide counts as reached.
    var max = track.scrollWidth - track.clientWidth;
    if (Math.abs(track.scrollLeft) >= max - 2) best = slides.length - 1;
    return best;
  }

  function setCurrent(i) {
    if (i === current) return;
    if (current >= 0) slides[current].classList.remove('is-current');
    current = i;
    var s = slides[i];
    s.classList.add('is-current');
    count.textContent = pad(i + 1);
    groupLabel.textContent = s.getAttribute('data-group-label');
    if (progress) progress.style.setProperty('--p', slides.length > 1 ? i / (slides.length - 1) : 0);
    prev.disabled = i === 0;
    next.disabled = i === slides.length - 1;
    var group = s.getAttribute('data-group');
    groupButtons.forEach(function (b) {
      if (b.getAttribute('data-group') === group) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  }

  function announce(i) {
    var s = slides[i];
    var caption = s.querySelector('.explore__caption-text');
    live.textContent = s.getAttribute('data-group-label') + ', ' + (caption ? caption.textContent : '') + ' — ' + pad(i + 1) + ' / ' + slides.length;
  }

  // How far the track must scroll to bring slide i to its start.
  function deltaFor(i) {
    var box = track.getBoundingClientRect();
    var pad0 = parseFloat(getComputedStyle(track).paddingInlineStart) || 0;
    var r = slides[i].getBoundingClientRect();
    return rtl ? r.right - (box.right - pad0) : r.left - (box.left + pad0);
  }

  function goTo(i, speak) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    // Scroll the track only (scrollIntoView could also move the page).
    track.scrollBy({ left: deltaFor(i), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    setCurrent(i);
    if (speak) announce(i);
  }

  prev.addEventListener('click', function () { goTo(current - 1, true); });
  next.addEventListener('click', function () { goTo(current + 1, true); });
  groupButtons.forEach(function (b) {
    b.addEventListener('click', function () { goTo(+b.getAttribute('data-carousel-goto'), true); });
  });

  track.addEventListener('keydown', function (event) {
    var step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[event.key];
    var to = null;
    if (step) to = current + step;
    else if (event.key === 'Home') to = 0;
    else if (event.key === 'End') to = slides.length - 1;
    if (to === null) return;
    event.preventDefault();
    goTo(to, true);
  });

  track.addEventListener('scroll', function () {
    if (!pending) pending = requestAnimationFrame(function () { pending = 0; setCurrent(nearest()); });
  }, { passive: true });

  // Mouse and trackpad: CSS snapping is off (see the CSS), so settle on the nearest
  // photo when a scroll ends. Touch keeps the browser's own snapping.
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var settleTimer = 0;
  function settle() {
    if (!fine.matches || drag) return;
    var i = nearest();
    var d = deltaFor(i);
    var max = track.scrollWidth - track.clientWidth;
    if (Math.abs(d) > 2 && Math.abs(track.scrollLeft) < max - 2) track.scrollBy({ left: d, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  }
  if ('onscrollend' in window) track.addEventListener('scrollend', settle);
  else track.addEventListener('scroll', function () { clearTimeout(settleTimer); settleTimer = setTimeout(settle, 160); }, { passive: true });

  // Mouse dragging (touch and trackpads already scroll natively).
  var drag = null, suppressClick = false;
  track.addEventListener('pointerdown', function (event) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = { x: event.clientX, left: track.scrollLeft, moved: false, id: event.pointerId };
  });
  track.addEventListener('pointermove', function (event) {
    if (!drag || event.pointerId !== drag.id) return;
    var dx = event.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 6) {
      drag.moved = true;
      track.classList.add('is-dragging');
      track.setPointerCapture(drag.id);
    }
    if (drag.moved) track.scrollLeft = drag.left - dx;
  });
  function endDrag() {
    if (!drag) return;
    var moved = drag.moved;
    drag = null;
    if (!moved) return;
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 0);
    // Release the drag, then settle on the nearest photograph.
    var to = nearest();
    track.classList.remove('is-dragging');
    goTo(to, false);
  }
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  // A drag is not a click: do not open the photo it ended on.
  track.addEventListener('click', function (event) {
    if (suppressClick) { event.preventDefault(); event.stopPropagation(); }
  }, true);

  setCurrent(0);
})();
