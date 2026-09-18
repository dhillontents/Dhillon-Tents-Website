(function () {
  'use strict';
  var pending = false;
  var previous = null;
  try { previous = JSON.parse(sessionStorage.getItem('dhillon:last-submission') || 'null'); } catch (_) {}
  window.DhillonContact = {
    send: async function (form, message) {
      if (pending) return;
      var status = form.querySelector('[data-form-status]');
      function feedback(state, text) {
        status.hidden = false;
        status.dataset.state = state;
        status.textContent = text;
      }
      if (window.location.protocol === 'file:') {
        feedback('error', 'Online sending works on our website. Please use WhatsApp or email dhillontents@gmail.com.');
        return;
      }
      var fields = new FormData(form);
      var payload = { name: String(fields.get('name') || '').trim(), email: String(fields.get('email') || '').trim(), message: message, website: String(fields.get('website') || '') };
      var fingerprint = JSON.stringify(payload);
      if (!previous || previous.fingerprint !== fingerprint || Date.now() - previous.created > 23 * 60 * 60 * 1000) {
        var random = new Uint8Array(16);
        window.crypto.getRandomValues(random);
        previous = { fingerprint: fingerprint, id: Array.from(random, function (n) { return n.toString(16).padStart(2, '0'); }).join(''), created: Date.now(), accepted: false };
      }
      if (previous.accepted) {
        feedback('success', 'This request has already been submitted. We will contact you to confirm availability and pricing.');
        return;
      }
      payload.requestId = previous.id;
      try { sessionStorage.setItem('dhillon:last-submission', JSON.stringify(previous)); } catch (_) {}
      var buttons = Array.from(form.querySelectorAll('button[type="submit"]'));
      pending = true;
      buttons.forEach(function (button) { button.disabled = true; });
      form.setAttribute('aria-busy', 'true');
      feedback('sending', 'Submitting your quote request…');
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 20000);
      try {
        var response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
        var result;
        try { result = await response.json(); } catch (_) { throw new Error('Online sending is unavailable. Your details are saved; please use WhatsApp or email dhillontents@gmail.com.'); }
        if (!response.ok || result.ok !== true) throw new Error(result.error || 'We could not submit your request. Please try again.');
        previous.accepted = true;
        try { sessionStorage.setItem('dhillon:last-submission', JSON.stringify(previous)); } catch (_) {}
        feedback('success', 'Your quote request has been submitted. We will contact you to confirm availability and pricing. This does not reserve equipment.');
      } catch (error) {
        feedback('error', error.name === 'AbortError' ? 'We could not confirm submission. Your details are saved; please retry or contact us on WhatsApp.' : (error.message || 'Connection interrupted. Your details are saved; please retry.'));
      } finally {
        clearTimeout(timer);
        pending = false;
        buttons.forEach(function (button) { button.disabled = false; });
        form.removeAttribute('aria-busy');
      }
    }
  };
})();
