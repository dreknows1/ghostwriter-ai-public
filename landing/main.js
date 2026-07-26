/* SongGhost landing — behaviour.
   Everything here is progressive enhancement: with JS off the page is a
   complete, readable document with poster images instead of video. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var saveData = (navigator.connection && navigator.connection.saveData) === true;

  // Stands down the inline failsafe in index.html.
  document.documentElement.dataset.reveals = 'ready';

  /* ── Year ─────────────────────────────────────────────────────── */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ── Reveals ──────────────────────────────────────────────────────
     Fire once on enter and disconnect. Nothing is scroll-linked, so there
     is no per-frame work and no layout thrash. Delays are staggered per
     section rather than per element so a group arrives together. */
  var reveals = document.querySelectorAll('[data-reveal]');

  function showAll() {
    for (var i = 0; i < reveals.length; i++) reveals[i].classList.add('is-in');
  }

  if (reduced.matches || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });

    reveals.forEach(function (el) {
      var explicit = el.getAttribute('data-reveal-delay');
      if (explicit) {
        el.style.setProperty('--d', explicit);
      } else {
        // Stagger siblings within their own group.
        var group = el.parentElement ? el.parentElement.children : [];
        var n = 0;
        for (var i = 0; i < group.length; i++) {
          if (group[i] === el) break;
          if (group[i].hasAttribute && group[i].hasAttribute('data-reveal')) n++;
        }
        el.style.setProperty('--d', String(Math.min(n, 5)));
      }
      io.observe(el);
    });
  }

  /* ── Video ────────────────────────────────────────────────────────
     Sources are attached only when a clip is close to the viewport, and
     never at all under reduced-motion or Save-Data — in those cases the
     poster is the finished state, which is why every <video> ships one. */
  var films = document.querySelectorAll('video[data-src]');

  /* A 9:16 cut exists for the hero so phones get a shot framed for their
     screen instead of a letterboxed landscape one. The <source media> attribute
     is unreliable across browsers, so the choice is made here, once, before
     any bytes are requested. */
  var narrow = window.matchMedia('(max-width: 760px)').matches;

  function attach(video) {
    if (video.dataset.loaded) return;
    video.dataset.loaded = '1';

    var d = video.dataset;
    var mp4 = (narrow && d.srcNarrow) || d.src;
    var webm = (narrow && d.srcNarrowWebm) || d.srcWebm;
    var poster = (narrow && d.posterNarrow) || null;
    if (poster) video.poster = poster;

    if (webm) {
      var s1 = document.createElement('source');
      s1.type = 'video/webm';
      s1.src = webm;
      video.appendChild(s1);
    }
    var s2 = document.createElement('source');
    s2.type = 'video/mp4';
    s2.src = mp4;
    video.appendChild(s2);

    video.load();
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay refused; poster stands */ });
  }

  if (!reduced.matches && !saveData) {
    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          attach(entry.target);
          obs.unobserve(entry.target);
        });
      }, { rootMargin: '300px 0px' });
      films.forEach(function (v) { vio.observe(v); });
    } else {
      films.forEach(attach);
    }

    // Don't burn battery decoding video in a background tab.
    document.addEventListener('visibilitychange', function () {
      films.forEach(function (v) {
        if (!v.dataset.loaded) return;
        if (document.hidden) { v.pause(); }
        else { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      });
    });
  }

  /* ── The typed prompt ─────────────────────────────────────────────
     The third prompt writes itself once, when it scrolls into view — the
     one moment on the page where the product's core action is literally
     depicted. Under reduced motion it simply appears, finished. */
  var typed = document.querySelector('.prompt__typed');
  if (typed) {
    var full = typed.getAttribute('data-type') || '';
    var caret = typed.parentElement.querySelector('.caret');

    var finish = function () {
      typed.textContent = full;
      if (caret) caret.style.display = 'none';
    };

    if (reduced.matches || !('IntersectionObserver' in window)) {
      finish();
    } else {
      var tio = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          obs.disconnect();
          var i = 0;
          (function step() {
            typed.textContent = full.slice(0, i);
            if (i++ >= full.length) {
              // Let the caret blink a beat, then retire it.
              setTimeout(function () { if (caret) caret.style.display = 'none'; }, 2200);
              return;
            }
            // Vary the cadence slightly so it reads as typing, not a ticker.
            setTimeout(step, 34 + Math.random() * 46);
          })();
        });
      }, { threshold: 0.6 });
      tio.observe(typed.closest('.prompt'));
    }
  }

  /* ── Masthead ─────────────────────────────────────────────────────
     A sentinel beats a scroll listener: no handler runs while scrolling. */
  var masthead = document.getElementById('masthead');
  if (masthead && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;';
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      masthead.dataset.stuck = String(!entries[0].isIntersecting);
    }, { threshold: 0 }).observe(sentinel);
  }
})();
