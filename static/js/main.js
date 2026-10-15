/*
 * Gindi Innovations — homepage interactions (vanilla JS, no dependencies).
 *
 * - Header: transparent over the hero, solid navy once scrolled.
 * - Mobile menu: accessible toggle with focus trap and Escape to close.
 * - Active section: highlights the nav link and keeps the language switch
 *   pointing at the same section in the other language.
 * - Scroll reveals and a subtle hero parallax, both skipped for
 *   prefers-reduced-motion.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobileNav = window.matchMedia('(max-width: 67.99rem)');

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  /* ---------- Header state + hero parallax (one rAF-throttled scroll handler) ---------- */
  var header = $('[data-header]');
  var parallax = $('[data-parallax]');
  var ticking = false;

  function useParallax() {
    return parallax && !reduceMotion.matches && window.matchMedia('(min-width: 48rem)').matches;
  }

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 24);
    if (useParallax() && y < window.innerHeight * 1.2) {
      parallax.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0)';
    } else if (parallax && parallax.style.transform && !useParallax()) {
      parallax.style.transform = '';
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll(); // correct state when the page loads already scrolled

  /* ---------- Mobile menu ---------- */
  var toggle = $('[data-menu-toggle]');
  var menu = $('[data-menu]');
  var toggleLabel = $('[data-menu-toggle-label]');
  var outside = $$('main, footer');

  function isOpen() {
    return toggle && toggle.getAttribute('aria-expanded') === 'true';
  }

  function setMenu(open, returnFocus) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggleLabel.textContent = open ? toggle.dataset.labelClose : toggle.dataset.labelOpen;
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('is-menu-open', open);
    header.classList.toggle('is-menu-open', open);
    outside.forEach(function (el) { el.inert = open; });
    if (open) {
      var first = $('a', menu);
      if (first) first.focus({ preventScroll: true });
    } else if (returnFocus) {
      toggle.focus();
    }
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(!isOpen(), true);
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a') && isOpen()) setMenu(false, false);
    });

    document.addEventListener('keydown', function (event) {
      if (!isOpen()) return;
      if (event.key === 'Escape') {
        setMenu(false, true);
        return;
      }
      if (event.key !== 'Tab') return;
      // Keep focus inside the open menu (toggle + menu links).
      var focusable = [toggle].concat($$('a[href], button:not([disabled])', menu));
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    var onBreakpoint = function (event) {
      if (!event.matches && isOpen()) setMenu(false, false);
    };
    if (mobileNav.addEventListener) mobileNav.addEventListener('change', onBreakpoint);
  }

  /* ---------- Active section + language switch target ---------- */
  var navLinks = $$('[data-nav-link]').filter(function (a) {
    return a.classList.contains('site-nav__link');
  });
  var langLinks = $$('[data-lang-switch]');
  var sections = navLinks
    .map(function (a) { return document.getElementById(a.hash.slice(1)); })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (a) {
      if (a.hash === '#' + id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    langLinks.forEach(function (a) {
      a.hash = id ? '#' + id : '';
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var visible = {};
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting;
      });
      var current = sections.filter(function (s) { return visible[s.id]; }).pop();
      setActive(current ? current.id : '');
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ---------- Scroll reveals ---------- */
  var revealItems = $$('[data-reveal]');

  if (!reduceMotion.matches && 'IntersectionObserver' in window && revealItems.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

    revealItems.forEach(function (el) { revealObserver.observe(el); });
    // Only now hide unrevealed content: we know we can reveal it again.
    root.classList.add('reveal-ready');
  }

  // If the user switches on reduced motion mid-visit, show everything.
  var onMotionChange = function (event) {
    if (event.matches) {
      root.classList.remove('reveal-ready');
      if (parallax) parallax.style.transform = '';
    }
  };
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMotionChange);
})();
