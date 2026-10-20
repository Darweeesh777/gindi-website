/*
 * The Gindi Gate — the Projects page's entrance (templates/core/projects.html).
 *
 * Animation state:
 *
 *   closed ──(fresh downward gesture in the hero, or "Explore")──▶ opening ──▶ open
 *   open ──(fresh upward gesture at the very top, page at rest)──▶ closing ──▶ closed
 *
 * Gestures are tracked apart from the animation. A gesture is one physical
 * action: a wheel / trackpad stream until it has been quiet for WHEEL_IDLE ms
 * (momentum keeps arriving in a steady stream, so its tail belongs to the
 * same gesture), one touch sequence (touchstart to the last touchend), or one
 * key press (key-repeat and other keys while it is held are the same press).
 * Each gesture is judged once, by its first movement:
 *   - it opens or closes the gate → the whole gesture is held (preventDefault),
 *     momentum included, so it cannot carry on into the next stage;
 *   - otherwise → the whole gesture is the browser's own (never held), so
 *     returning from the projects with momentum can never close the gate.
 * While the gate is opening or closing, gestures in the hero are held, so
 * rapid direction changes cannot start a conflicting animation.
 *
 * Nothing else is touched: zoom (ctrl/cmd + wheel, pinch), form controls, the
 * header and its menu, links and buttons (Space / Enter), scrollbars. Page
 * scrolling is never disabled. Arriving at an anchor or at a restored position
 * below the hero opens the gate at once, with no lock; with reduced motion
 * (and without JavaScript) the gate is shown open and still (CSS).
 * "Explore" opens the gate if needed, then goes to the projects.
 */
(function () {
  'use strict';

  var gate = document.querySelector('[data-gate]');
  if (!gate) return;
  var target = document.getElementById('projects-list');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var OPEN_MS = 1100;      // the gate parts and the introduction arrives (CSS)
  var CLOSE_MS = 900;      // the introduction leaves, the gate closes, the headline returns
  var WHEEL_IDLE = 280;    // a pause this long ends a wheel / trackpad gesture
  var SETTLE_MS = 200;     // the page must have stopped scrolling this long before closing
  var SWIPE_MIN = 18;      // px of finger travel that make a deliberate swipe
  var TOP = 2;             // "at the top": within this many px of it

  var state = 'closed';
  var timer = 0;
  var goAfterOpen = false;
  var lastScroll = 0;
  var wheel = null;        // the current wheel gesture: {last, decided, held}
  var touch = null;        // the current touch sequence
  var keyHeld = null;      // the key of the current key press
  var keyHeldBack = false; // ...and whether it is held

  /* ---------- State ---------- */
  function setState(next) {
    state = next;
    gate.setAttribute('data-gate-state', next);
    gate.classList.toggle('is-opening', next === 'opening');
    gate.classList.toggle('is-open', next === 'open');
    gate.classList.toggle('is-closing', next === 'closing');
    // The section is named by the headline that is showing.
    gate.setAttribute('aria-labelledby', next === 'opening' || next === 'open' || next === 'static' ? 'pgate-intro-title' : 'pgate-title');
  }

  function animating() { return state === 'opening' || state === 'closing'; }

  function open(instant) {
    if (state !== 'closed') return false;
    clearTimeout(timer);
    if (instant) {
      gate.classList.add('is-instant');
      setState('open');
      requestAnimationFrame(function () { requestAnimationFrame(function () { gate.classList.remove('is-instant'); }); });
      return true;
    }
    setState('opening');
    timer = setTimeout(function () {
      setState('open');
      if (goAfterOpen) { goAfterOpen = false; goToProjects(); }
    }, OPEN_MS);
    return true;
  }

  function close() {
    if (state !== 'open') return false;
    clearTimeout(timer);
    setState('closing');
    timer = setTimeout(function () { setState('closed'); }, CLOSE_MS);
    return true;
  }

  function goToProjects() {
    if (!target) return;
    target.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
    // Explore was chosen: continue from the projects (as a link to them would).
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }

  /* ---------- Where the page is ---------- */
  function atTop() { return window.scrollY <= TOP; }
  function inHero() { return window.scrollY < gate.offsetHeight * 0.5; }
  function settled() { return Date.now() - lastScroll >= SETTLE_MS; }

  /*
   * A fresh gesture's first movement (dir 1: down, -1: up): act, and say
   * whether the gesture is to be held from now on.
   */
  function decide(dir) {
    if (animating()) return inHero();
    if (dir > 0 && state === 'closed' && inHero()) return open(false);
    if (dir < 0 && state === 'open' && atTop() && settled()) return close();
    return false;
  }

  function ignored(el) {
    return !!(el && el.closest && el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [data-header], dialog'));
  }

  /* ---------- Wheel and trackpad ---------- */
  function onWheel(event) {
    if (state === 'static' || event.ctrlKey || event.metaKey || ignored(event.target)) return;
    var now = Date.now();
    if (!wheel || now - wheel.last >= WHEEL_IDLE) wheel = { last: now, decided: false, held: false };
    wheel.last = now;
    if (!wheel.decided) {
      var dy = event.deltaY || (event.deltaX === 0 ? event.deltaZ : 0) || 0;
      if (dy === 0) return;                       // sideways: not a decision
      wheel.decided = true;
      wheel.held = decide(dy > 0 ? 1 : -1);
    }
    if (wheel.held) event.preventDefault();
  }

  /* ---------- Touch ---------- */
  function onTouchStart(event) {
    if (event.touches.length !== 1) { if (touch) touch.multi = true; return; }   // pinch: never held
    touch = { y: event.touches[0].clientY, top: atTop(), settled: settled(), decided: false, held: false, multi: false };
  }

  function onTouchMove(event) {
    if (!touch || touch.multi || state === 'static' || event.touches.length !== 1 || ignored(event.target)) return;
    if (touch.decided) { if (touch.held) event.preventDefault(); return; }
    var dy = touch.y - event.touches[0].clientY;  // > 0: the finger moves up = the page would scroll down
    if (Math.abs(dy) < 4) return;
    var dir = dy > 0 ? 1 : -1;
    // Would this swipe act? Then keep the page still from its first pixels.
    var acts = animating() ? inHero()
      : dir > 0 ? state === 'closed' && inHero()
      : state === 'open' && touch.top && touch.settled;
    if (!acts) { touch.decided = true; return; }
    event.preventDefault();
    if (Math.abs(dy) >= SWIPE_MIN) {
      touch.decided = true;
      touch.held = animating() ? true : dir > 0 ? open(false) : close();
    }
  }

  function onTouchEnd(event) {
    if (!event.touches.length) touch = null;
  }

  /* ---------- Keyboard ---------- */
  function keyDir(event) {
    switch (event.key) {
      case 'ArrowDown': case 'PageDown': case 'End': return 1;
      case 'ArrowUp': case 'PageUp': case 'Home': return -1;
      case ' ': case 'Spacebar': return event.shiftKey ? -1 : 1;
      default: return 0;
    }
  }

  function onKeyDown(event) {
    if (state === 'static' || event.altKey || event.ctrlKey || event.metaKey) return;
    var dir = keyDir(event);
    if (!dir) return;
    var el = event.target;
    if (ignored(el)) return;
    if ((event.key === ' ' || event.key === 'Spacebar') && el.closest && el.closest('a, button, summary, [role="button"]')) return;
    if (event.repeat || keyHeld !== null) {   // the same press: held if it acted
      if (keyHeldBack) event.preventDefault();
      return;
    }
    keyHeld = event.key;
    keyHeldBack = decide(dir);
    if (keyHeldBack) event.preventDefault();
  }

  function onKeyUp(event) {
    if (event.key === keyHeld) { keyHeld = null; keyHeldBack = false; }
  }

  function onBlur() { keyHeld = null; keyHeldBack = false; touch = null; }

  /* ---------- Scrolling the page by other means ---------- */
  function onScroll() {
    lastScroll = Date.now();
    // Scrollbar, find in page, a link: the visitor is moving on, so the gate counts as open — no lock, no jump.
    if (state === 'closed' && !inHero()) open(true);
  }

  /* ---------- Explore / the cue ---------- */
  function onGo(event) {
    if (state === 'open' || state === 'static') return;   // the link does its own job
    event.preventDefault();
    if (state === 'closed') { goAfterOpen = true; open(false); }
    else if (state === 'opening') goAfterOpen = true;
    else {                                                  // closing: go at once
      clearTimeout(timer);
      gate.classList.add('is-instant');
      setState('open');
      requestAnimationFrame(function () { gate.classList.remove('is-instant'); });
      goToProjects();
    }
  }

  /* ---------- Start ---------- */
  if (reduce.matches) {
    // The open gate, still (CSS); the page scrolls normally from the first gesture.
    setState('static');
    return;
  }
  setState('closed');
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('touchcancel', onTouchEnd, { passive: true });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  window.addEventListener('scroll', onScroll, { passive: true });
  Array.prototype.forEach.call(document.querySelectorAll('[data-gate-go]'), function (a) { a.addEventListener('click', onGo); });

  // Arriving at an anchor, or at a position the browser restored: no entrance.
  function checkArrival() {
    if (state === 'closed' && (location.hash.length > 1 || !inHero() || window.scrollY > 8)) open(true);
  }
  checkArrival();
  window.addEventListener('load', checkArrival, { once: true });
})();
