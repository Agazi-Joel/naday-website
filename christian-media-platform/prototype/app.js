/* Selah prototype — light interactivity, no framework, no build step.
   Everything here is mock behavior to demonstrate the experience. */
(function () {
  'use strict';

  /* ---- mobile nav ---- */
  var burger = document.querySelector('.nav-burger');
  var links = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', function () { links.classList.toggle('open'); });
  }

  /* ---- persistent audio player (mock) ---- */
  var player = document.getElementById('player');
  var pTitle = document.getElementById('p-title');
  var pSub = document.getElementById('p-sub');
  var pArt = document.getElementById('p-art');
  var pMain = document.getElementById('p-play');
  var pFill = document.getElementById('p-fill');
  var pTime = document.getElementById('p-time');
  var timer = null, elapsed = 0, total = 0, playing = false;

  function fmt(s) {
    var m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + (r < 10 ? '0' : '') + r;
  }
  function render() {
    if (!pFill) return;
    pFill.style.width = total ? (elapsed / total * 100) + '%' : '0%';
    if (pTime) pTime.textContent = fmt(elapsed) + ' / ' + fmt(total);
    if (pMain) pMain.textContent = playing ? '❚❚' : '▶';
  }
  function tick() {
    if (!playing) return;
    elapsed += 1;
    if (elapsed >= total) { elapsed = total; playing = false; clearInterval(timer); }
    render();
  }
  function loadTrack(title, sub, glyph, mins) {
    if (!player) return;
    pTitle.textContent = title;
    pSub.textContent = sub;
    if (pArt) pArt.textContent = glyph || '♪';
    total = (mins || 24) * 60;
    elapsed = Math.floor(total * 0.34);
    playing = true;
    player.classList.add('show');
    clearInterval(timer); timer = setInterval(tick, 1000);
    render();
  }
  // any element with data-play="Title|Subtitle|glyph|minutes"
  document.querySelectorAll('[data-play]').forEach(function (el) {
    el.addEventListener('click', function () {
      var p = (el.getAttribute('data-play') || '').split('|');
      loadTrack(p[0] || 'Episode', p[1] || 'Selah', p[2] || '♪', parseInt(p[3], 10) || 24);
    });
  });
  if (pMain) {
    pMain.addEventListener('click', function () {
      playing = !playing;
      if (playing) { clearInterval(timer); timer = setInterval(tick, 1000); }
      render();
    });
  }
  // scrub
  var track = document.getElementById('p-track');
  if (track) {
    track.addEventListener('click', function (e) {
      var r = track.getBoundingClientRect();
      elapsed = Math.floor((e.clientX - r.left) / r.width * total);
      render();
    });
  }
  var speed = document.getElementById('p-speed');
  if (speed) {
    var speeds = ['1.0×', '1.25×', '1.5×', '2.0×', '0.75×'], si = 0;
    speed.addEventListener('click', function () { si = (si + 1) % speeds.length; speed.textContent = speeds[si]; });
  }

  /* ---- reader theme + type size ---- */
  var page = document.getElementById('reader-page');
  document.querySelectorAll('[data-theme]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!page) return;
      page.classList.remove('sepia', 'light', 'dark');
      page.classList.add(b.getAttribute('data-theme'));
      b.parentNode.querySelectorAll('[data-theme]').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
    });
  });
  var size = 1.14;
  document.querySelectorAll('[data-type]').forEach(function (b) {
    b.addEventListener('click', function () {
      size += b.getAttribute('data-type') === 'up' ? 0.08 : -0.08;
      size = Math.max(0.9, Math.min(1.5, size));
      if (page) page.style.fontSize = size.toFixed(2) + 'rem';
    });
  });

  /* ---- gift amount selector ---- */
  var amounts = document.querySelectorAll('.amount');
  var giftSummary = document.getElementById('gift-summary');
  amounts.forEach(function (a) {
    a.addEventListener('click', function () {
      amounts.forEach(function (x) { x.classList.remove('on'); });
      a.classList.add('on');
      if (giftSummary) {
        var n = a.getAttribute('data-bibles');
        giftSummary.textContent = 'You’ll fund ' + n + ' Bible' + (n === '1' ? '' : 's') + ' — thank you.';
      }
    });
  });
  var giftBtn = document.getElementById('gift-btn');
  if (giftBtn) {
    giftBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var on = document.querySelector('.amount.on');
      var n = on ? on.getAttribute('data-bibles') : '1';
      alert('Prototype — no real charge.\n\nThank you! You funded ' + n + ' Bible' + (n === '1' ? '' : 's') + '.\n(In production this is a Stripe / nonprofit-donation flow — see docs/07-monetization.md.)');
    });
  }

  /* ---- question submission (mock) ---- */
  var qForm = document.getElementById('q-form');
  if (qForm) {
    qForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var box = document.getElementById('q-confirm');
      qForm.style.display = 'none';
      if (box) box.style.display = 'block';
      window.scrollTo({ top: box.offsetTop - 90, behavior: 'smooth' });
    });
  }
})();
