/*
 * The free calculators' page: tells the studio it was opened, and shows the
 * name-and-number form that opens the calculator (partials/calc_gate.html;
 * loaded only with the form backend configured).
 *
 * Every opening sends a "click" (worker/index.js, form "click"), naming the
 * calculator and nothing about the visitor, once per calculator in this tab
 * (sessionStorage), so a reload does not send another. It has its own unseen
 * form and security check ([data-calc-click]), so it needs nothing from the visitor
 * and never waits for, or gets in the way of, anything else on the page.
 *
 * A name and a number are required to open the calculator (form "calculator").
 * The visitor gives them once: this browser then remembers (localStorage), so
 * other calculators open directly. If they cannot be sent, the visitor can try
 * again, and the calculator stays closed until they are.
 *
 * With no backend, or if this script fails, the calculator is simply open.
 */
(function () {
  'use strict';
  var KEY = 'gindi-calc-lead';
  var gate = document.querySelector('[data-calc-gate]');
  var calc = document.querySelector('[data-calc]');
  var pinger = document.querySelector('[data-calc-click]');
  var api = window.GindiForms;
  if (!gate || !calc || !pinger || !api) return;

  var tool = calc.getAttribute('data-calc');
  var CLICK_KEY = 'gindi-calc-clicked-' + tool;

  function stored(storage, key) {
    try { return window[storage].getItem(key) === '1'; } catch (err) { return false; }
  }

  function store(storage, key) {
    try { window[storage].setItem(key, '1'); } catch (err) { /* asked or counted again next time */ }
  }

  if (!stored('sessionStorage', CLICK_KEY)) {
    var id = window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
    api.send(pinger, { form: 'click', tool: tool, id: id }, function () {}).then(function () {
      store('sessionStorage', CLICK_KEY);
    }, function () { /* not counted; the next opening tries again */ });
  }

  if (stored('localStorage', KEY)) return;

  var form = gate.querySelector('form');
  var status = gate.querySelector('[data-gate-status]');
  var submit = gate.querySelector('[type="submit"]');
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
  }

  calc.hidden = true;
  gate.hidden = false;

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
      store('localStorage', KEY);
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
  // The security check starts when the visitor begins filling the form.
  form.addEventListener('focusin', function () { api.prepare(form); }, { once: true });
})();
