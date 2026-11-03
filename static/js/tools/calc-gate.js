/*
 * The name-and-number form that opens the free calculators
 * (partials/calc_gate.html; loaded only with the form backend configured).
 *
 * The visitor gives a name and a number once; form-backend.js sends them to the
 * Worker (worker/index.js, form "calculator"), which emails the studio through
 * Resend, and the calculator opens. This browser then remembers (localStorage),
 * so other calculators open directly.
 *
 * Or the visitor skips: the Worker records a "click", naming the calculator and
 * nothing about the visitor (form "click"). This tab remembers the skip for that
 * calculator (sessionStorage), so a reload neither asks nor counts again;
 * another calculator, or a later visit, asks again.
 *
 * It never breaks the tool: with no backend, or if this script fails, the
 * calculator is simply open; a skip opens it after SKIP_WAIT at the latest,
 * whether or not the click could be recorded.
 */
(function () {
  'use strict';
  var KEY = 'gindi-calc-lead';
  var SKIP_WAIT = 4000;
  var gate = document.querySelector('[data-calc-gate]');
  var calc = document.querySelector('[data-calc]');
  var api = window.GindiForms;
  if (!gate || !calc || !api) return;

  var tool = calc.getAttribute('data-calc');
  var SKIP_KEY = KEY + '-skipped-' + tool;
  try {
    if (localStorage.getItem(KEY) === '1' || sessionStorage.getItem(SKIP_KEY) === '1') return;
  } catch (err) { /* storage unavailable: asked on each calculator */ }

  var form = gate.querySelector('form');
  var status = gate.querySelector('[data-gate-status]');
  var submit = gate.querySelector('[type="submit"]');
  var skip = gate.querySelector('[data-gate-skip]');
  var attempted = false, sending = false;

  // Arabic-Indic and Persian digits to Western, as the other forms do.
  function westernDigits(text) {
    return text
      .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); })
      .replace(/[۰-۹]/g, function (d) { return String(d.charCodeAt(0) - 0x06F0); });
  }

  function val(name) { return form.elements[name].value.trim(); }

  function problem(name) {
    var v = val(name);
    if (name === 'name') return v ? '' : gate.getAttribute('data-error-name');
    if (!v) return gate.getAttribute('data-error-phone');
    var phone = westernDigits(v), digits = phone.replace(/\D/g, '');
    return /^\+?[\d\s().\-]+$/.test(phone) && digits.length >= 8 && digits.length <= 15 ? '' : gate.getAttribute('data-error-phone-invalid');
  }

  function showError(name, message) {
    var wrap = form.querySelector('[data-field="' + name + '"]');
    var error = wrap.querySelector('[data-error]');
    error.textContent = message;
    error.hidden = !message;
    wrap.classList.toggle('is-invalid', !!message);
    if (message) form.elements[name].setAttribute('aria-invalid', 'true');
    else form.elements[name].removeAttribute('aria-invalid');
  }

  // Shows every message; returns the first field with a problem, or ''.
  function validate() {
    var first = '';
    ['name', 'phone'].forEach(function (name) {
      var message = problem(name);
      showError(name, message);
      if (message && !first) first = name;
    });
    return first;
  }

  function open() {
    gate.hidden = true;
    calc.hidden = false;
    calc.setAttribute('tabindex', '-1');
    calc.focus({ preventScroll: true });
  }

  function setBusy(busy) {
    sending = busy;
    form.setAttribute('aria-busy', busy ? 'true' : 'false');
    submit.disabled = busy;
    skip.disabled = busy;
  }

  calc.hidden = true;
  gate.hidden = false;
  // The security check starts now, so a skip usually finds its token ready.
  api.prepare(form);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (sending) return;
    attempted = true;
    var first = validate();
    if (first) {
      form.elements[first].focus();
      return;
    }
    setBusy(true);
    api.send(form, {
      form: 'calculator',
      tool: tool,
      name: val('name'),
      phone: westernDigits(val('phone'))
    }, function (text) { status.textContent = text; }).then(function () {
      try { localStorage.setItem(KEY, '1'); } catch (err) { /* asked again next time */ }
      status.textContent = '';
      open();
    }, function (error) {
      if (error.message === 'fields') {
        error.fields.forEach(function (name) { if (form.elements[name]) showError(name, problem(name) || api.texts.invalid); });
        status.textContent = api.texts.invalid;
        return;
      }
      status.textContent = error.message === 'verify' ? api.texts.verify_failed : gate.getAttribute('data-gate-failed');
    }).then(function () { setBusy(false); });
  });

  form.addEventListener('input', function (event) {
    if (attempted && event.target.name && event.target.name !== 'website') showError(event.target.name, problem(event.target.name));
  });

  skip.addEventListener('click', function () {
    if (sending) return;
    setBusy(true);
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      try { sessionStorage.setItem(SKIP_KEY, '1'); } catch (err) { /* asked again on a reload */ }
      setBusy(false);
      open();
    }
    // Its own id: a failed try at the form above must not make this look like a retry of it.
    var id = window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
    api.send(form, { form: 'click', tool: tool, id: id }, function () {}).then(finish, finish);
    setTimeout(finish, SKIP_WAIT);
  });
})();
