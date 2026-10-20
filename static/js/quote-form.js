/*
 * Gindi Innovations — quotation and enquiry forms (vanilla JS).
 *
 * Runs every [data-quote-form] on the page: the quotation form in the
 * <dialog> from partials/quote_drawer.html (opened by [data-quote] links such
 * as "Get Quotation"; without JS they keep their own href) and the project
 * enquiry form on the Contact page. Each form sits in a [data-quote-root]
 * that names its destinations (data-quote-email, data-quote-whatsapp) and its
 * texts (data-quote-texts: the id of a JSON script in the page).
 *
 * - Property Type options follow Project Type; "Other" (in any list, or as
 *   the project type) asks the visitor to specify it.
 * - Preferred Contact Method "Email" makes the email address required: the
 *   quotation form reveals the field then; the Contact page shows it always
 *   (data-quote-email-always) and switches its label from optional to
 *   required.
 * - Which fields are required comes from the form itself (the required
 *   attribute); the format checks (phone, area, email, link) are shared.
 * - Both send buttons validate first (inline messages, first problem
 *   focused), then build one formatted message from every filled field.
 *   "Submit via Email" opens the visitor's email app (mailto:) addressed to
 *   the studio; "Submit via WhatsApp" opens WhatsApp with the message ready.
 *   Either way the visitor sends it themselves, so the page only says the app
 *   should open — never that the request was sent.
 * - With the site's own backend configured (form-backend.js), the first
 *   button is "Send Request" (data-quote-send="server") instead: the request
 *   goes straight to the studio and the form clears once the backend
 *   confirms it. "Submit via WhatsApp" stays as it is.
 * - Values stay in the form after an error or a send. The quotation form
 *   (data-quote-draft) also keeps them in sessionStorage (this tab only), so
 *   they survive a trip to another app or a reload; the Contact page stores
 *   nothing.
 */
(function () {
  'use strict';

  var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  var STORAGE_KEY = 'gindi-quote-draft';
  var rtl = document.documentElement.getAttribute('dir') === 'rtl';

  // Arabic-Indic and Persian digits (and the Arabic decimal comma) to Western.
  function westernDigits(text) {
    return text
      .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); })
      .replace(/[۰-۹]/g, function (d) { return String(d.charCodeAt(0) - 0x06F0); })
      .replace(/٫/g, '.');
  }

  // Keeps numbers, addresses and links readable inside Arabic text.
  function ltr(text) { return rtl && text ? '⁦' + text + '⁩' : text; }

  // Through a link click: the email app / WhatsApp opens from the visitor's
  // own click, and this page stays where it is.
  function openExternal(url, newTab) {
    var link = document.createElement('a');
    link.href = url;
    if (newTab) {
      link.target = '_blank';
      link.rel = 'noopener';
    }
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function setup(form, root, T) {
    var projectSel = form.querySelector('[data-quote-project]');
    var propertySel = form.querySelector('[data-quote-property]');
    var propertyField = form.querySelector('[data-quote-property-field]');
    var otherField = form.querySelector('[data-quote-other]');
    var emailField = form.querySelector('[data-quote-email]');
    var emailAlways = emailField.hasAttribute('data-quote-email-always');
    var emailReq = emailField.querySelector('[data-quote-req]');
    var status = form.querySelector('[data-quote-status]');
    var studioEmail = root.getAttribute('data-quote-email');
    var studioWhatsApp = root.getAttribute('data-quote-whatsapp');
    var keepDraft = root.hasAttribute('data-quote-draft');
    // Every field with a message, in page order (validation and focus order).
    var FIELDS = Array.prototype.map.call(form.querySelectorAll('[data-field]'), function (el) {
      return el.getAttribute('data-field');
    });
    var attempted = false;

    /* ---------- Values ---------- */
    function control(name) { return form.elements[name]; }

    function controls(name) {
      var c = control(name);
      return c && typeof c.length === 'number' && !c.tagName ? Array.prototype.slice.call(c) : [c];
    }

    function val(name) {
      var c = control(name);
      if (!c) return '';
      return String(c.value || '').trim();
    }

    function isRequired(name) {
      var c = controls(name)[0];
      return !!c && c.required;
    }

    function project(value) {
      return T.projects.filter(function (p) { return p.value === value; })[0] || null;
    }

    function labelOf(list, value) {
      var item = list.filter(function (o) { return o.value === value; })[0];
      return item ? item.label : '';
    }

    /* ---------- Conditional fields ---------- */
    function fillProperties(keep) {
      var p = project(projectSel.value);
      propertySel.innerHTML = '';
      var placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = p ? T.choose : T.property_first;
      propertySel.appendChild(placeholder);
      if (p) {
        p.properties.forEach(function (o) {
          var option = document.createElement('option');
          option.value = o.value;
          option.textContent = o.label;
          propertySel.appendChild(option);
        });
      }
      // Project type "Other": no list, only the text field.
      propertyField.hidden = !!p && !p.properties.length;
      propertySel.disabled = !p || !p.properties.length;
      // A choice that does not belong to the new project type is cleared.
      propertySel.value = keep && p && labelOf(p.properties, keep) ? keep : '';
      syncOther();
    }

    function syncOther() {
      var p = project(projectSel.value);
      var show = !!p && (!p.properties.length || propertySel.value === 'other');
      otherField.hidden = !show;
      control('property_other').required = show;
      if (!show) showError('property_other', '');
    }

    function syncEmail() {
      var needed = val('contact') === 'email';
      if (!emailAlways) emailField.hidden = !needed;
      control('email').required = needed;
      if (emailReq) emailReq.textContent = emailReq.getAttribute(needed ? 'data-required' : 'data-optional');
      if (!needed && !emailAlways) showError('email', '');
    }

    /* ---------- Validation ---------- */
    function problem(name) {
      var v = val(name);
      var E = T.errors;
      switch (name) {
        case 'phone': {
          if (!v) return E.phone;
          var phone = westernDigits(v);
          var digits = phone.replace(/\D/g, '');
          return /^\+?[\d\s().\-]+$/.test(phone) && digits.length >= 8 && digits.length <= 15 ? '' : E.phone_invalid;
        }
        case 'property_type': {
          var p = project(val('project_type'));
          return !p || !p.properties.length || v ? '' : E.property_type;
        }
        case 'property_other': return otherField.hidden || v ? '' : E.property_other;
        case 'area': {
          if (!v) return isRequired('area') ? E.area : '';
          var area = westernDigits(v).replace(/,/g, '.');
          return /^\d+(\.\d+)?$/.test(area) && Number(area) > 0 ? '' : E.area_invalid;
        }
        case 'map': {
          if (!v) return '';
          try {
            var url = new URL(v);
            return /^https?:$/.test(url.protocol) && url.hostname ? '' : E.map_invalid;
          } catch (err) {
            return E.map_invalid;
          }
        }
        case 'email': {
          if (emailField.hidden) return '';
          if (!v) return isRequired('email') ? E.email : '';
          return EMAIL.test(v) ? '' : E.email_invalid;
        }
      }
      // Everything else: required or not, as the form says.
      return v || !isRequired(name) ? '' : (E[name] || '');
    }

    function showError(name, message) {
      var wrap = form.querySelector('[data-field="' + name + '"]');
      var error = wrap && wrap.querySelector('[data-error]');
      if (!error) return;
      error.textContent = message;
      error.hidden = !message;
      wrap.classList.toggle('is-invalid', !!message);
      controls(name).forEach(function (c) {
        if (message) c.setAttribute('aria-invalid', 'true');
        else c.removeAttribute('aria-invalid');
      });
    }

    // Shows every message; returns the first field with a problem, or ''.
    function validate() {
      var first = '';
      FIELDS.forEach(function (name) {
        var message = problem(name);
        showError(name, message);
        if (message && !first) first = name;
      });
      return first;
    }

    /* ---------- The request message ---------- */
    // [key, label, value] for every filled field, in page order. For the
    // message text, numbers and links are kept left-to-right in Arabic.
    function entries(forText) {
      var M = T.message;
      var dir = forText ? ltr : function (text) { return text; };
      var p = project(val('project_type'));
      var property = '';
      if (p && p.properties.length) {
        property = labelOf(p.properties, val('property_type'));
        if (val('property_type') === 'other') property += ' — ' + val('property_other');
      } else if (p) {
        property = val('property_other');
      }
      var area = westernDigits(val('area')).replace(/,/g, '.');
      var list = [];
      function add(key, value) { if (value && M[key]) list.push([key, M[key], value]); }
      add('name', val('name'));
      add('phone', dir(westernDigits(val('phone'))));
      add('occupation', val('occupation'));
      add('project_type', p ? p.label : '');
      add('property_type', property);
      add('area', area ? dir(area) + ' ' + M.area_unit : '');
      add('location', val('location').replace(/\s*\n\s*/g, ', '));
      add('city', val('city'));
      add('district', val('district'));
      add('address', val('address').replace(/\s*\n\s*/g, ', '));
      add('map', dir(val('map')));
      add('contact', T.contact_methods[val('contact')] || '');
      if (!emailField.hidden) add('email', dir(val('email')));
      return list;
    }

    function message() {
      var M = T.message;
      var lines = [M.heading, ''];
      entries(true).forEach(function (entry) { lines.push(entry[1] + ': ' + entry[2]); });
      // The visitor's own description, as written, after the details.
      if (val('message') && M.message) lines.push('', M.message + ':', val('message'));
      return lines.join('\n');
    }

    // For the backend: who and how as fields, everything else as labelled rows.
    var OWN_FIELDS = ['name', 'phone', 'email', 'contact'];
    function request() {
      return {
        form: root.getAttribute('data-form-kind') || 'quote',
        name: val('name'),
        phone: westernDigits(val('phone')),
        email: emailField.hidden ? '' : val('email'),
        contact: val('contact'),
        message: val('message'),
        details: entries(false).filter(function (entry) { return OWN_FIELDS.indexOf(entry[0]) < 0; })
          .map(function (entry) { return [entry[1], entry[2]]; })
      };
    }

    /* ---------- Draft (quotation form only; this tab only) ---------- */
    function save() {
      if (!keepDraft) return;
      try {
        var draft = {};
        Array.prototype.forEach.call(form.elements, function (c) {
          if (!c.name) return;
          if (c.type === 'radio') { if (c.checked) draft[c.name] = c.value; }
          else draft[c.name] = c.value;
        });
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch (err) { /* storage unavailable: values still stay while the page is open */ }
    }

    function restore() {
      if (!keepDraft) return;
      var draft = null;
      try { draft = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null'); } catch (err) { draft = null; }
      if (!draft) return;
      ['name', 'phone', 'occupation', 'area', 'city', 'district', 'address', 'map', 'email', 'property_other'].forEach(function (name) {
        if (typeof draft[name] === 'string' && control(name)) control(name).value = draft[name];
      });
      if (project(draft.project_type)) projectSel.value = draft.project_type;
      fillProperties(draft.property_type);
      controls('contact').forEach(function (radio) { radio.checked = radio.value === draft.contact; });
      syncEmail();
    }

    function clearDraft() {
      try { sessionStorage.removeItem(STORAGE_KEY); } catch (err) { /* nothing stored */ }
    }

    /* ---------- Sending ---------- */
    var buttons = Array.prototype.slice.call(form.querySelectorAll('[data-quote-send]'));
    var sending = false;

    function setBusy(busy) {
      sending = busy;
      form.setAttribute('aria-busy', busy ? 'true' : 'false');
      buttons.forEach(function (button) {
        if (busy) {
          button.setAttribute('data-was-disabled', button.disabled ? 'true' : 'false');
          button.disabled = true;
        } else {
          button.disabled = button.getAttribute('data-was-disabled') === 'true';
        }
      });
    }

    // Straight to the studio (form-backend.js). The form clears only once the
    // backend confirms; on any problem the values stay for another try.
    function sendToBackend() {
      var api = window.GindiForms;
      if (!api || sending) return;
      setBusy(true);
      api.send(form, request(), function (text) { status.textContent = text; }).then(function (result) {
        form.reset();
        clearDraft();
        fillProperties('');
        syncEmail();
        attempted = false;
        FIELDS.forEach(function (name) { showError(name, ''); });
        status.textContent = api.successText(result);
      }, function (error) {
        if (error.message === 'fields') {
          error.fields.forEach(function (name) { showError(name, problem(name) || T.check); });
          status.textContent = T.check;
        } else {
          status.textContent = error.message === 'verify' ? api.texts.verify_failed : api.texts.failed;
        }
      }).then(function () { setBusy(false); });
    }

    function send(how) {
      if (sending) return;
      attempted = true;
      var first = validate();
      if (first) {
        status.textContent = T.check;
        var target = controls(first)[0];
        if (target) target.focus();
        return;
      }
      if (how === 'server') {
        sendToBackend();
        return;
      }
      var body = message();
      save();
      if (how === 'email') {
        if (!studioEmail) return;
        var subject = T.subject.replace('{name}', val('name'));
        // CRLF line breaks, as mailto bodies expect (RFC 6068).
        openExternal('mailto:' + studioEmail + '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(body.replace(/\n/g, '\r\n')), false);
        status.textContent = T.opened_email;
      } else {
        if (!studioWhatsApp) return;
        openExternal('https://wa.me/' + studioWhatsApp + '?text=' + encodeURIComponent(body), true);
        status.textContent = T.opened_whatsapp;
      }
    }

    /* ---------- Wiring ---------- */
    projectSel.addEventListener('change', function () { fillProperties(''); });
    propertySel.addEventListener('change', syncOther);
    controls('contact').forEach(function (radio) { radio.addEventListener('change', syncEmail); });

    function recheck(event) {
      save();
      if (!attempted || !event.target.name) return;
      var name = event.target.name;
      showError(name, problem(name));
      // Fields whose rules depend on this one.
      if (name === 'project_type') { showError('property_type', problem('property_type')); showError('property_other', problem('property_other')); }
      if (name === 'property_type') showError('property_other', problem('property_other'));
      if (name === 'contact') showError('email', problem('email'));
    }
    form.addEventListener('input', recheck);
    form.addEventListener('change', recheck);
    form.addEventListener('submit', function (event) { event.preventDefault(); });

    buttons.forEach(function (button) {
      button.addEventListener('click', function () { send(button.getAttribute('data-quote-send')); });
    });
    // The security check starts when the visitor begins filling the form.
    if (window.GindiForms && form.querySelector('[data-quote-send="server"]')) {
      form.addEventListener('focusin', function () { window.GindiForms.prepare(form); }, { once: true });
    }

    fillProperties('');
    syncEmail();
    restore();
    // The Design Studio's "Discuss this design" link: its selection as the message.
    var design = new URLSearchParams(location.search).get('design');
    if (design && control('message') && !val('message')) control('message').value = design.slice(0, 2000);

    return {
      clearStatus: function () { status.textContent = ''; },
      focusFirst: function () { control('name').focus(); }
    };
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-quote-form]'), function (form) {
    var root = form.closest('[data-quote-root]');
    var dataEl = root && document.getElementById(root.getAttribute('data-quote-texts'));
    if (!dataEl) return;
    var api = setup(form, root, JSON.parse(dataEl.textContent));

    // The quotation form lives in a dialog, opened by [data-quote] links.
    if (root.tagName !== 'DIALOG' || typeof root.showModal !== 'function') return; // links keep their fallback
    var drawer = root;
    var opener = null;
    Array.prototype.forEach.call(document.querySelectorAll('[data-quote]'), function (link) {
      link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', function (event) {
        event.preventDefault();
        opener = link;
        api.clearStatus();
        drawer.showModal();
        api.focusFirst();
      });
    });

    drawer.querySelector('[data-quote-close]').addEventListener('click', function () { drawer.close(); });
    drawer.addEventListener('click', function (event) {
      if (event.target === drawer) drawer.close(); // the dimmed area outside the panel
    });
    drawer.addEventListener('close', function () {
      if (opener) opener.focus();
    });
  });
})();
