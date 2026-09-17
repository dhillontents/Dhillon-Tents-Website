/* Progressive enhancement: content and links remain usable without animation. */
(function () {
  'use strict';
  var root = document.documentElement;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var intro = document.querySelector('.intro-overlay');
  function finishIntro() {
    root.classList.remove('intro-active');
    if (intro) intro.remove();
  }
  if (root.classList.contains('intro-active')) {
    try { sessionStorage.setItem('dhillon:intro-seen', '1'); } catch (_) {}
    if (intro) intro.addEventListener('animationend', function (e) {
      if (e.target === intro) finishIntro();
    });
    setTimeout(finishIntro, 2100);
    document.addEventListener('pointerdown', finishIntro, { once:true });
    document.addEventListener('keydown', finishIntro, { once:true });
  } else finishIntro();

  var revealElements = Array.from(document.querySelectorAll('.scroll-reveal'));
  var curtain = document.querySelector('[data-tent-reveal]');
  var observer;
  function showEverything() {
    if (observer) observer.disconnect();
    revealElements.forEach(function (el) { el.dataset.reveal = 'shown'; });
    if (curtain) curtain.dataset.tentReveal = 'shown';
    finishIntro();
  }
  if (!motion.matches && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        if (en.target === curtain) en.target.dataset.tentReveal = 'shown';
        else en.target.dataset.reveal = 'shown';
        observer.unobserve(en.target);
      });
    }, { threshold:0, rootMargin:'0px 0px -5% 0px' });
    revealElements.forEach(function (el) {
      // Never hide content already onscreen, including anchor destinations.
      if (el.getBoundingClientRect().top < window.innerHeight * .95) el.dataset.reveal = 'shown';
      else { el.dataset.reveal = 'waiting'; observer.observe(el); }
    });
    if (curtain) {
      curtain.dataset.tentReveal = 'waiting';
      observer.observe(curtain);
    }
  } else showEverything();
  if (motion.addEventListener) motion.addEventListener('change', function (e) {
    if (e.matches) showEverything();
  });
  // Keyboard navigation must not focus invisible controls inside a staged section.
  document.addEventListener('focusin', function (e) {
    var section = e.target.closest('[data-reveal="waiting"]');
    if (section) { section.dataset.reveal = 'shown'; if (observer) observer.unobserve(section); }
  });

  var header = document.querySelector('.site-header');
  var scrollQueued = false;
  function updateHeader() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 20); scrollQueued = false; }
  updateHeader();
  window.addEventListener('scroll', function () {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateHeader); }
  }, { passive:true });

  // Keep all page links native. CSS View Transitions provide the cross-page
  // animation where supported, without cancelling clicks or hiding the page
  // while a scripted navigation is pending. This also works from extracted files.
})();
