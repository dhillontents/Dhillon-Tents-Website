/* Dhillon Tents — navigation, quote selections and event inquiry drafts.
   The interactive layout model is maintained in planner-model.js. */

(function () {
  'use strict';

  var CONTACT = {
    phone: '+1 (416) 893-2626',
    tel: '+14168932626',
    email: 'dhillontents@gmail.com',
    whatsapp: 'https://wa.me/14168932626'
  };

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var draft = {};
  try { draft = JSON.parse(sessionStorage.getItem('dhillon:event-draft') || '{}') || {}; } catch (_) {}
  if (typeof draft !== 'object' || Array.isArray(draft)) draft = {};
  function saveDraft(values) {
    Object.keys(values).forEach(function (key) { draft[key] = values[key]; });
    try { sessionStorage.setItem('dhillon:event-draft', JSON.stringify(draft)); } catch (_) {}
  }
  var params = new URLSearchParams(window.location.search);
  ['guests','date','location'].forEach(function (key) {
    if (params.has(key)) draft[key] = params.get(key).slice(0,300);
  });
  if (draft.guests && (!Number.isFinite(Number(draft.guests)) || Number(draft.guests) < 1 || Number(draft.guests) > 5000)) delete draft.guests;
  if (draft.date && !/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) delete draft.date;
  var draftFields = ['name','phone','date','guests','eventType','location','email','notes'];
  $$('form[data-quote-form]').forEach(function (form) {
    draftFields.forEach(function (key) { var field = $('[name="'+key+'"]',form); if (field && draft[key] != null) field.value = String(draft[key]); });
    form.addEventListener('input', function (event) {
      if (draftFields.indexOf(event.target.name) !== -1) { var update = {}; update[event.target.name] = event.target.value; saveDraft(update); }
    });
  });
  ['guests','date','location'].forEach(function (key) {
    var input = $('#hp-' + (key === 'location' ? 'loc' : key));
    if (input && draft[key] != null) input.value = String(draft[key]);
  });

  /* ---------------------------------------------------------- navigation */
  var toggle = $('.nav-toggle');
  var nav = $('#site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', String(!open));
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.setAttribute('data-open', 'false');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      }
    });
  }

  var navLinks = $$('#site-nav a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
          if (byId[en.target.id]) byId[en.target.id].setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  }

  /* --------------------------------------------------------- quote state */
  var quote = {};           // id -> qty, kept for this browser tab
  try { quote = JSON.parse(sessionStorage.getItem('dhillon:quote') || '{}') || {}; } catch (_) {}
  if (typeof quote !== 'object' || Array.isArray(quote)) quote = {};
  var catalog = Object.assign({}, window.DhillonCatalog || {}); // shared across pages

  $$('[data-add]').forEach(function (btn) {
    catalog[btn.dataset.add] = {
      name: btn.dataset.name,
      image: btn.dataset.image,
      size: btn.dataset.size || ''
    };
    btn.addEventListener('click', function () {
      addToQuote(btn.dataset.add, 1);
      openDrawer();
    });
  });

  Object.keys(quote).forEach(function (id) {
    if (!Object.prototype.hasOwnProperty.call(catalog,id) || !Number.isInteger(quote[id]) || quote[id] < 1 || quote[id] > 10000) delete quote[id];
  });

  function addToQuote(id, qty) {
    if (!catalog[id]) return;
    quote[id] = Math.min(10000, (quote[id] || 0) + (qty || 1));
    renderQuote();
  }

  function setQty(id, qty) {
    if (qty <= 0) delete quote[id];
    else quote[id] = Math.min(10000, qty);
    renderQuote();
  }

  function quoteLines() {
    return Object.keys(quote).map(function (id) {
      return quote[id] + ' × ' + catalog[id].name;
    });
  }

  function renderQuote() {
    var ids = Object.keys(quote);
    $$('[data-quote-summary]').forEach(function (el) { el.textContent = ids.length ? quoteLines().join(' · ') : 'Your saved rental selections will appear here.'; });
    $$('[data-layout-summary]').forEach(function(el){el.textContent=draft.layoutSummary||'';el.hidden=!draft.layoutSummary;});
    if (Object.keys(catalog).length) {
      try { sessionStorage.setItem('dhillon:quote', JSON.stringify(quote)); } catch (_) {}
    }
    $$('.quote-count').forEach(function (el) { el.textContent = ids.length; });
    var list = $('#quote-list');
    if (!list) return;

    if (!ids.length) {
      list.innerHTML = '<p class="empty">Nothing here yet. Browse our rental collection, then add the items you would like us to quote.</p>';
      return;
    }
    list.innerHTML = ids.map(function (id) {
      var p = catalog[id];
      return '<div class="qline">' +
        '<img src="assets/' + p.image + '" alt="" width="56" height="56" loading="lazy">' +
        '<div><h3>' + p.name + '</h3>' +
        (p.size ? '<span class="card__size">' + p.size + '</span>' : '') +
        '<br><button type="button" class="qline-remove" data-remove="' + id + '">Remove</button></div>' +
        '<div class="stepper">' +
          '<button type="button" aria-label="Fewer ' + p.name + '" data-dec="' + id + '">–</button>' +
          '<input type="number" min="1" value="' + quote[id] + '" aria-label="Quantity of ' + p.name + '" data-qty="' + id + '">' +
          '<button type="button" aria-label="More ' + p.name + '" data-inc="' + id + '">+</button>' +
        '</div></div>';
    }).join('');
  }

  var drawer = $('#quote-drawer');
  var scrim = $('#scrim');

  var previousFocus;
  function openDrawer() {
    if (!drawer) return;
    previousFocus = document.activeElement;
    drawer.setAttribute('data-open', 'true');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    scrim.setAttribute('data-open', 'true');
    drawer.removeAttribute('inert');
    var h = $('.drawer__close', drawer);
    if (h) h.focus();
  }
  function closeDrawer() {
    if (!drawer || drawer.getAttribute('data-open') !== 'true') return;
    drawer.setAttribute('data-open', 'false');
    drawer.removeAttribute('aria-modal');
    if (previousFocus && previousFocus.isConnected) previousFocus.focus();
    scrim.setAttribute('data-open', 'false');
    drawer.setAttribute('inert', '');
  }

  $$('[data-open-quote]').forEach(function (b) { b.addEventListener('click', openDrawer); });
  if (scrim) scrim.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDrawer(); if (nav && nav.getAttribute('data-open') === 'true') { nav.setAttribute('data-open','false'); toggle.setAttribute('aria-expanded','false'); toggle.setAttribute('aria-label','Open menu'); toggle.focus(); } } });

  if (drawer) {
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var items = $$('button:not([disabled]),a[href],input:not([disabled])', drawer);
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    drawer.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('.drawer__close')) return closeDrawer();
      if (t.dataset.remove) return setQty(t.dataset.remove, 0);
      if (t.dataset.inc) return setQty(t.dataset.inc, (quote[t.dataset.inc] || 0) + 1);
      if (t.dataset.dec) return setQty(t.dataset.dec, (quote[t.dataset.dec] || 0) - 1);
    });
    drawer.addEventListener('change', function (e) {
      if (e.target.dataset.qty) setQty(e.target.dataset.qty, parseInt(e.target.value, 10) || 0);
    });
  }

  /* ------------------------------------------------------ rentals filter */
  var filterButtons = $$('[data-filter]');
  var searchBox = $('#rental-search');
  var cards = $$('#rental-grid [data-category]');

  function applyFilters() {
    var active = ($('[data-filter][aria-pressed="true"]') || {}).dataset;
    var cat = active ? active.filter : 'all';
    var term = (searchBox && searchBox.value || '').trim().toLowerCase();
    var shown = 0;
    cards.forEach(function (card) {
      var okCat = cat === 'all' || card.dataset.category === cat;
      var okTerm = !term || card.dataset.keywords.indexOf(term) > -1;
      var show = okCat && okTerm;
      card.hidden = !show;
      if (show) shown++;
    });
    var empty = $('#rental-empty');
    if (empty) empty.hidden = shown > 0;
  }
  filterButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      filterButtons.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); x.classList.remove('btn-blue'); x.classList.add('btn-outline'); });
      b.setAttribute('aria-pressed', 'true');
      b.classList.add('btn-blue'); b.classList.remove('btn-outline');
      applyFilters();
    });
  });
  if (searchBox) searchBox.addEventListener('input', applyFilters);

  /* ------------------------------------------------- gallery + lightbox */
  var galleryFilters = $$('[data-gallery-filter]');
  var figures = $$('#gallery-grid figure');
  galleryFilters.forEach(function (b) {
    b.addEventListener('click', function () {
      galleryFilters.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); x.classList.remove('btn-blue'); x.classList.add('btn-outline'); });
      b.setAttribute('aria-pressed', 'true');
      b.classList.add('btn-blue'); b.classList.remove('btn-outline');
      var v = b.dataset.galleryFilter;
      figures.forEach(function (f) { f.hidden = !(v === 'all' || f.dataset.type === v); });
    });
  });

  var lb = $('#lightbox');
  var lbImg = $('#lightbox-img');
  var lbCap = $('#lightbox-cap');
  var current = 0;

  function visibleFigures() { return figures.filter(function (f) { return !f.hidden; }); }
  function showAt(i) {
    var list = visibleFigures();
    if (!list.length) return;
    current = (i + list.length) % list.length;
    var fig = list[current];
    var img = $('img', fig);
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = img.alt;
  }
  figures.forEach(function (fig) {
    $('button', fig).addEventListener('click', function () {
      showAt(visibleFigures().indexOf(fig));
      if (lb.showModal) lb.showModal();
    });
  });
  if (lb) {
    $('#lb-prev').addEventListener('click', function () { showAt(current - 1); });
    $('#lb-next').addEventListener('click', function () { showAt(current + 1); });
    $('#lb-close').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') showAt(current + 1);
      if (e.key === 'ArrowLeft') showAt(current - 1);
    });
  }

  /* ------------------------------------------------------------- forms */
  function buildMessage(form) {
    var d = new FormData(form);
    var lines = quoteLines();
    var text = 'Hi Dhillon Tents! I would like a rental quote.\n\n';
    text += 'Name: ' + (d.get('name') || '').trim() + '\n';
    text += 'Event date: ' + (d.get('date') || 'To be confirmed') + '\n';
    text += 'Guests: ' + (d.get('guests') || 'To be confirmed') + '\n';
    text += 'Event type: ' + (d.get('eventType') || 'Celebration') + '\n';
    text += 'Location: ' + ((d.get('location') || '').trim() || 'To be confirmed') + '\n';
    if (d.get('phone')) text += 'Phone: ' + String(d.get('phone')).trim() + '\n';
    if (d.get('email')) text += 'Email: ' + String(d.get('email')).trim() + '\n';
    text += '\nRentals:\n' + (lines.length ? lines.join('\n') : 'Please help me choose a setup.') + '\n';
    if (draft.layoutSummary) text += '\nLayout: ' + draft.layoutSummary + '\n';
    text += '\nNotes: ' + ((d.get('notes') || '').trim() || 'None yet.') + '\n';
    text += '\nPlease confirm pricing and availability. Thank you!';
    return text;
  }

  $$('form[data-quote-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var how = (e.submitter && e.submitter.value) || 'send';
      if (!form.reportValidity()) return;
      var text = buildMessage(form);
      var status = $('[data-form-status]', form);
      if (how === 'send') {
        if (window.DhillonContact) window.DhillonContact.send(form, text);
        else if (status) {
          status.hidden = false;
          status.textContent = 'Online sending is unavailable. Please use WhatsApp or email dhillontents@gmail.com.';
        }
        return;
      }
      var destination;
      if (how === 'email') {
        destination = 'mailto:' + CONTACT.email +
          '?subject=' + encodeURIComponent('Dhillon Tents — rental quote request') +
          '&body=' + encodeURIComponent(text);
        window.location.href = destination;
      } else {
        destination = CONTACT.whatsapp + '?text=' + encodeURIComponent(text);
        window.open(destination, '_blank', 'noopener,noreferrer');
      }
      if (status) {
        status.hidden = false;
        status.textContent = 'Your draft is ready. If it did not open, ';
        var draftLink = document.createElement('a');
        draftLink.href = destination;
        draftLink.className = 'text-link';
        draftLink.textContent = how === 'email' ? 'open your email draft' : 'open your WhatsApp draft';
        status.appendChild(draftLink);
        status.appendChild(document.createTextNode('. Review it and send when you are ready. Your booking is confirmed by our team.'));
      }
    });
  });

  // keep the minimum date sensible
  var today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  $$('input[type="date"]').forEach(function (i) { i.min = today.toISOString().slice(0, 10); });

  /* Home planning handoff uses the same draft as the planner and contact page. */
  var heroPlan = $('#hero-plan-form');
  if (heroPlan) heroPlan.addEventListener('submit', function () {
    var values = {guests:$('#hp-guests').value, location:$('#hp-loc').value, date:$('#hp-date').value};
    saveDraft(values);
    // The form's real GET action handles validation and page navigation.
  });

  window.DhillonQuote = {
    applyPlanner:function(quantities,details){
      var previous={};
      try{previous=JSON.parse(sessionStorage.getItem('dhillon:planner-quote')||'{}')||{};}catch(_){}
      if(typeof previous!=='object'||Array.isArray(previous))previous={};
      Object.keys(previous).forEach(function(id){
        if(!Object.prototype.hasOwnProperty.call(catalog,id)||!Number.isInteger(previous[id])||previous[id]<0)return;
        var remaining=Math.max(0,(quote[id]||0)-previous[id]);
        if(remaining)quote[id]=remaining;else delete quote[id];
      });
      var applied={};
      Object.keys(quantities).forEach(function(id){
        if(!Object.prototype.hasOwnProperty.call(catalog,id)||!Number.isInteger(quantities[id])||quantities[id]<1)return;
        var qty=Math.min(10000,quantities[id]);
        var available=10000-(quote[id]||0);qty=Math.min(available,qty);
        if(qty){quote[id]=(quote[id]||0)+qty;applied[id]=qty;}
      });
      try{sessionStorage.setItem('dhillon:planner-quote',JSON.stringify(applied));}catch(_){}
      saveDraft(details);renderQuote();
    }
  };
  renderQuote();
})();
