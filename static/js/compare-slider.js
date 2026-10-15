/*
 * Gindi Innovations — design/reality comparison slider (vanilla JS).
 *
 * The position is the share of the frame covered by the design layer, from
 * the reading-start edge (left in English, right in Arabic). It is written
 * to --pos on the frame; CSS clips the design layer and places the divider.
 *
 * Mouse: press anywhere on the image and drag. Touch: drag the handle, or
 * swipe sideways across the image — vertical swipes scroll the page as usual
 * (touch-action: pan-y). Keyboard, on the handle: arrows (Shift for bigger
 * steps), Page Up/Down, Home/End. The handle is an ARIA slider.
 */
(function () {
  'use strict';

  var STEP = 2;
  var BIG_STEP = 10;
  var DRAG_THRESHOLD_PX = 6;

  Array.prototype.forEach.call(document.querySelectorAll('[data-compare]'), function (root) {
    var frame = root.querySelector('[data-compare-frame]');
    var handle = root.querySelector('[data-compare-handle]');
    if (!frame || !handle) return;

    var rtl = getComputedStyle(root).direction === 'rtl';
    var designLabel = root.getAttribute('data-label-design');
    var realityLabel = root.getAttribute('data-label-reality');
    var pos = 50;

    function set(value) {
      pos = Math.min(100, Math.max(0, Math.round(value * 10) / 10));
      frame.style.setProperty('--pos', pos + '%');
      var design = Math.round(pos);
      handle.setAttribute('aria-valuenow', design);
      handle.setAttribute('aria-valuetext', design + '% ' + designLabel + ', ' + (100 - design) + '% ' + realityLabel);
    }

    // Pointer x -> position (share of the design side).
    function fromPointer(clientX) {
      var r = frame.getBoundingClientRect();
      var share = (clientX - r.left) / r.width * 100;
      return rtl ? 100 - share : share;
    }

    var press = null;
    var dragging = false;

    function startDrag(event) {
      dragging = true;
      root.classList.add('is-dragging');
      try { frame.setPointerCapture(event.pointerId); } catch (e) { /* pointer already gone */ }
    }

    function endDrag() {
      press = null;
      dragging = false;
      root.classList.remove('is-dragging');
    }

    frame.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      press = { x: event.clientX, y: event.clientY, onHandle: handle.contains(event.target) };
      // Mouse, or a finger on the handle: drag at once. A finger elsewhere
      // only drags once the movement is clearly sideways.
      if (event.pointerType === 'mouse' || press.onHandle) {
        startDrag(event);
        if (!press.onHandle) set(fromPointer(event.clientX));
        if (event.pointerType === 'mouse') event.preventDefault(); // no text selection
      }
    });

    frame.addEventListener('pointermove', function (event) {
      if (!press) return;
      if (!dragging) {
        var dx = Math.abs(event.clientX - press.x), dy = Math.abs(event.clientY - press.y);
        if (dx < DRAG_THRESHOLD_PX || dx < dy) return;
        startDrag(event);
      }
      set(fromPointer(event.clientX));
    });

    frame.addEventListener('pointerup', function (event) {
      // A tap on the image moves the divider there.
      if (press && !dragging && event.pointerType !== 'mouse') {
        var moved = Math.abs(event.clientX - press.x) + Math.abs(event.clientY - press.y);
        if (moved < DRAG_THRESHOLD_PX) set(fromPointer(event.clientX));
      }
      endDrag();
    });

    // The browser took the gesture over (a vertical scroll): let it.
    frame.addEventListener('pointercancel', endDrag);
    frame.addEventListener('lostpointercapture', function () { if (dragging) endDrag(); });

    handle.addEventListener('keydown', function (event) {
      var step = event.shiftKey ? BIG_STEP : STEP;
      // Arrow keys follow the screen: Right moves the divider right.
      var toward = rtl ? -1 : 1;
      var next = {
        ArrowRight: pos + step * toward,
        ArrowLeft: pos - step * toward,
        ArrowUp: pos + step,
        ArrowDown: pos - step,
        PageUp: pos + BIG_STEP,
        PageDown: pos - BIG_STEP,
        Home: 0,
        End: 100
      }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      set(next);
    });

    set(pos);
  });
})();
