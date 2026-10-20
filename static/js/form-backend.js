/*
 * Gindi Innovations — sending forms to the site's own backend (vanilla JS).
 *
 * Loaded only when settings.CONTACT_API_URL and TURNSTILE_SITE_KEY are set
 * (templates/base.html, with the "forms-backend" JSON: url, sitekey, lang,
 * texts). Used by quote-form.js (quotation and Contact page forms) and
 * services-page.js (enquiry drawer) as window.GindiForms:
 *
 * - prepare(form): renders the form's Cloudflare Turnstile widget into its
 *   [data-turnstile] box, the first time the visitor focuses the form. The
 *   widget stays invisible unless Cloudflare needs the visitor to click.
 * - send(form, fields, onStatus): waits for the Turnstile token, posts the
 *   fields as JSON to the backend (worker/index.js) and resolves with its
 *   answer, or rejects with an Error whose message is 'verify', 'fields' or
 *   'failed'. Each token works once, so the widget is reset after every try.
 * - successText(result), texts: the status messages, in the page language.
 */
(function () {
  'use strict';

  var config;
  try {
    config = JSON.parse(document.getElementById('forms-backend').textContent);
  } catch (err) {
    return;
  }
  var states = new WeakMap();

  function randomId() {
    if (window.crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }

  // The Turnstile script loads async; wait for it (up to 15 s).
  function turnstileReady() {
    return new Promise(function (resolve, reject) {
      var waited = 0;
      (function check() {
        if (window.turnstile && typeof window.turnstile.render === 'function') return resolve(window.turnstile);
        if ((waited += 100) > 15000) return reject(new Error('failed'));
        setTimeout(check, 100);
      })();
    });
  }

  function prepare(form) {
    var state = states.get(form);
    if (state) return state;
    // id: one per request, kept across retries, so a retry never emails twice.
    state = { widget: null, token: '', waiting: [], id: randomId() };
    states.set(form, state);
    var box = form.querySelector('[data-turnstile]');
    state.ready = turnstileReady().then(function (turnstile) {
      state.widget = turnstile.render(box, {
        sitekey: config.sitekey,
        language: config.lang,
        appearance: 'interaction-only',
        size: 'flexible',
        callback: function (token) {
          state.token = token;
          state.waiting.splice(0).forEach(function (resolve) { resolve(token); });
        },
        'expired-callback': function () { state.token = ''; },
        'error-callback': function () { state.token = ''; }
      });
    });
    state.ready.catch(function () { /* reported by send() */ });
    return state;
  }

  function token(state, onStatus) {
    return state.ready.then(function () {
      if (state.token) return state.token;
      onStatus(config.texts.verifying);
      return new Promise(function (resolve, reject) {
        state.waiting.push(resolve);
        setTimeout(function () { reject(new Error('verify')); }, 60000);
      });
    });
  }

  function reset(state) {
    state.token = '';
    if (state.widget != null && window.turnstile) window.turnstile.reset(state.widget);
  }

  function send(form, fields, onStatus) {
    var state = prepare(form);
    var honeypot = form.elements.website;
    onStatus(config.texts.sending);
    return token(state, onStatus).then(function (value) {
      onStatus(config.texts.sending);
      var body = Object.assign({}, fields, {
        lang: config.lang,
        page: location.pathname,
        id: state.id,
        token: value,
        website: honeypot ? honeypot.value : ''
      });
      return fetch(config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body)
      }).catch(function () {
        throw new Error('failed');
      });
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (answer) {
        if (response.ok && answer.ok) {
          state.id = randomId(); // the next request is a new one
          return answer;
        }
        var error = new Error(answer.error === 'verify' || answer.error === 'fields' ? answer.error : 'failed');
        error.fields = answer.fields || [];
        throw error;
      });
    }).then(function (answer) {
      reset(state);
      return answer;
    }, function (error) {
      reset(state);
      throw error;
    });
  }

  window.GindiForms = {
    texts: config.texts,
    prepare: prepare,
    send: send,
    successText: function (result) {
      return config.texts.sent + (result && result.confirmed ? ' ' + config.texts.sent_copy : '');
    }
  };
})();
