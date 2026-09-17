/* Booqable runs directly in each document; its native cart owns dates and items. */
(function () {
  'use strict';
  var surface = document.querySelector('[data-booking-surface]');
  var feedback = document.querySelector('.booking-feedback');
  var message = document.querySelector('[data-booking-message]');
  var actions = document.querySelector('.booking-feedback__actions');
  var retry = document.querySelector('[data-booking-retry]');
  var cart = document.querySelector('.header-cart .booqable-cart-button');
  var fallback = document.querySelector('.header-cart .cart-fallback');
  var phase = 'loading';
  var deadline;
  var observer;
  function populated(element) {
    return !!(element && (element.querySelector('input,button,a,[role="button"]') || element.textContent.trim()));
  }
  function ready() {
    if (!surface) return true;
    if (surface.dataset.bookingSurface === 'cart') return populated(surface.querySelector('.booqable-embeddable-cart'));
    var dates = surface.querySelector('.booqable-datepicker');
    // Booqable initially renders clickable date containers, then inputs in its popup.
    return populated(dates) && populated(surface.querySelector('.booqable-product-list'));
  }
  function refresh() {
    var cartReady = !!(cart && cart.querySelector('a,button,[role="button"]'));
    var cartButton = cart && cart.querySelector('button');
    if (cartButton && !cartButton.getAttribute('aria-label')) cartButton.setAttribute('aria-label', 'View your booking cart');
    if (surface && surface.querySelectorAll) surface.querySelectorAll('.booqable-datepicker .from,.booqable-datepicker .till').forEach(function (control) {
      if (control.getAttribute('role')) return;
      control.setAttribute('role', 'button');
      control.setAttribute('tabindex', '0');
      control.setAttribute('aria-label', control.classList.contains('from') ? 'Select pickup date' : 'Select return date');
      control.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); control.click(); }
      });
    });
    if (fallback) fallback.hidden = cartReady;
    if (surface && ready() && phase !== 'ready') {
      phase = 'ready';
      surface.setAttribute('aria-busy', 'false');
      feedback.hidden = true;
      clearTimeout(deadline);
    }
    if (cartReady && (!surface || phase === 'ready') && observer) observer.disconnect();
  }
  function fail() {
    if (!surface || phase === 'ready') return;
    phase = 'error';
    clearTimeout(deadline);
    surface.setAttribute('aria-busy', 'false');
    feedback.hidden = false;
    message.textContent = 'The booking store could not finish loading. Try again, or contact us with your event dates.';
    actions.hidden = false;
    // Leave provider markup intact so a late response can recover naturally.
  }
  window.DhillonBooking = { fail:fail };
  if ('MutationObserver' in window) {
    observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList:true, subtree:true, characterData:true });
  }
  if (surface) deadline = setTimeout(fail, 22000);
  if (retry) retry.addEventListener('click', function () { window.location.reload(); });
  if (window.dhillonBooqableFailed) fail();
  refresh();
})();
