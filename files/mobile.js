/* ═══════════════════════════════════════════════════════════
   mobile.js  —  Touch UX + performance layer
   Loads AFTER background.js and main.js.
   Patches live systems in-place without rewriting them.
   ═══════════════════════════════════════════════════════════ */
(function () {

  /* ── DETECTION ──────────────────────────────────────────── */
  const isTouch  = window.matchMedia('(pointer: coarse)').matches;
  const isMobile = window.innerWidth <= 768;
  const isNarrow = window.innerWidth <= 380;

  /* Orientation: let CSS reflow, fire resize after browser settles */
  window.addEventListener('orientationchange', () => {
    setTimeout(() => window.dispatchEvent(new Event('resize')), 320);
  });

  /* ── 1. CURSOR — disable on touch (CSS hides, JS prevents rAF waste) */
  if (isTouch) {
    ['cur', 'cur-ring', 'cur-aura'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  /* ── 2. PARTICLE THROTTLE ────────────────────────────────
     background.js now exposes BG.activeCount (default 300).
     We lower it here — the drawBG loop reads it each frame.
     No canvas resize tricks; just a number change.          */
  if (isMobile || isTouch) {
    const target = isNarrow ? 80 : 120;
    /* BG is set synchronously by background.js which loaded first */
    if (window.BG) window.BG.activeCount = target;
    /* Belt-and-suspenders: also set after one tick in case of
       any race (shouldn't happen with sync script tags)      */
    requestAnimationFrame(() => {
      if (window.BG) window.BG.activeCount = target;
    });
  }

  /* ── 3. GHOST TEXT CAP ───────────────────────────────────
     background.js spawns ghosts every 3.5s indefinitely.
     On mobile we cap live count via MutationObserver.       */
  if (isMobile || isTouch) {
    const GHOST_CAP = isNarrow ? 2 : 3;
    new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.classList && node.classList.contains('ghost')) {
            const all = document.querySelectorAll('.ghost');
            if (all.length > GHOST_CAP) all[0].remove();
          }
        });
      });
    }).observe(document.body, { childList: true });
  }

  /* ── 4. VIEWPORT HEIGHT — iOS browser chrome fix ─────────
     Sets --vh so calc(var(--vh) * 100) == true visible height */
  function setVH() {
    document.documentElement.style.setProperty(
      '--vh', (window.innerHeight * 0.01) + 'px'
    );
  }
  setVH();
  window.addEventListener('resize', setVH, { passive: true });

  /* ── 5. OVERFLOW LOCK ────────────────────────────────────
     Prevent iOS momentum scroll escaping the fixed layout.
     Boot log is the only intentionally scrollable child.   */
  if (isTouch) {
    document.addEventListener('touchmove', e => {
      if (e.target.closest('#boot-log')) return;
      e.preventDefault();
    }, { passive: false });
  }

  /* ── 6. SAFE-AREA — viewport-fit already in <meta>
     JS patch is a no-op now (meta tag handles it).          */

  /* ── 7. EIRA — hide in landscape phone ──────────────────*/
  function checkEira() {
    const eira = document.getElementById('eira-widget');
    if (!eira) return;
    eira.style.display =
      (window.innerWidth <= 600 && window.innerHeight <= 420) ? 'none' : '';
  }
  checkEira();
  window.addEventListener('resize', checkEira, { passive: true });

  /* ── 8. BOOT LOG — scrollable on mobile ─────────────────
     The log fills its container as lines type in. On mobile
     it can exceed screen height. Make it scroll.           */
  if (isMobile || isTouch) {
    const log = document.getElementById('boot-log');
    if (log) {
      log.style.overflowY     = 'auto';
      log.style.maxHeight     = 'calc(var(--vh, 1vh) * 72)';
      log.style.scrollBehavior = 'smooth';
      /* Auto-scroll to newest line as it types in */
      new MutationObserver(() => {
        log.scrollTop = log.scrollHeight;
      }).observe(log, { childList: true, subtree: true, characterData: true });
    }
  }

  /* ═══════════════════════════════════════════════════════
     PLAYER TOUCH INTERACTIONS
     All touch logic is isolated here. main.js is untouched.
     ═══════════════════════════════════════════════════════ */

  /* Helper: wait for the player to appear before attaching */
  function onPlayerReady(cb) {
    const player = document.getElementById('player');
    if (!player) return;
    if (player.classList.contains('on')) { cb(player); return; }
    const mo = new MutationObserver(() => {
      if (player.classList.contains('on')) { mo.disconnect(); cb(player); }
    });
    mo.observe(player, { attributes: true, attributeFilter: ['class'] });
  }

  /* ── 9. TAP-TO-ENABLE AUDIO GATE ────────────────────────
     iOS and Android block autoplay until a user gesture.
     The SC widget sets auto_play=true but it silently fails.
     We show a subtle tap-to-play overlay on the player that
     dismisses on first touch and nudges the widget to play. */
  if (isTouch) {
    onPlayerReady(() => {
      const scUi = document.getElementById('sc-ui');
      if (!scUi) return;

      /* Only show gate if widget hasn't started playing yet.
         We check after a 2s delay (widget needs time to init) */
      setTimeout(() => {
        /* Peek at the play icon — if ▶ is showing, audio stalled */
        const playIcon = document.getElementById('btn-play-icon');
        const isStalled = playIcon && playIcon.style.display !== 'none';
        if (!isStalled) return; /* already playing, skip gate */

        const gate = document.createElement('div');
        gate.id = 'audio-gate';
        gate.innerHTML =
          '<span class="gate-inner">tap to begin transmission</span>';
        scUi.style.position = 'relative'; /* ensure stacking */
        scUi.appendChild(gate);

        gate.addEventListener('touchend', e => {
          e.preventDefault();
          gate.style.opacity = '0';
          setTimeout(() => gate.remove(), 600);

          /* Trigger play through the SC widget via btn-play click */
          const btnPlay = document.getElementById('btn-play');
          if (btnPlay) btnPlay.click();
        }, { once: true, passive: false });

      }, 2200);
    });
  }

  /* ── 10. TOUCH SCRUBBING — PROGRESS BAR ─────────────────
     main.js only handles `click` on #sc-prog-wrap using
     e.clientX. Touch events carry coordinates differently.
     We add touchstart + touchmove handlers that mirror the
     click behaviour, using touches[0].clientX.             */
  if (isTouch) {
    onPlayerReady(() => {
      const progWrap = document.getElementById('sc-prog-wrap');
      const progEl   = document.getElementById('sc-prog');
      if (!progWrap) return;

      /* Shared seek logic — reads from touch or mouse event */
      function seekFromX(clientX) {
        const rect = progWrap.getBoundingClientRect();
        let pct = (clientX - rect.left) / rect.width;
        pct = Math.max(0, Math.min(1, pct));

        /* Update visual immediately for responsiveness */
        progEl.style.width = (pct * 100) + '%';

        /* Reach into main.js's widget via SC global.
           widget is scoped to main.js's IIFE so we use
           the SC.Widget factory to get the same instance. */
        const iframe = document.getElementById('sc-iframe');
        if (iframe && window.SC) {
          const w = SC.Widget(iframe);
          w.getDuration(dur => { if (dur) w.seekTo(pct * dur); });
        }
      }

      let isScrubbing = false;

      progWrap.addEventListener('touchstart', e => {
        isScrubbing = true;
        seekFromX(e.touches[0].clientX);
      }, { passive: true });

      progWrap.addEventListener('touchmove', e => {
        if (!isScrubbing) return;
        e.stopPropagation(); /* don't let swipe-prev/next fire */
        seekFromX(e.touches[0].clientX);
      }, { passive: true });

      progWrap.addEventListener('touchend', () => {
        isScrubbing = false;
      }, { passive: true });
    });
  }

  /* ── 11. TOUCH SCRUBBING — WAVEFORM BARS ────────────────
     60 individual bar click listeners exist in main.js.
     On mobile the bars are ~5px wide — impossible to tap.
     We add a single touchstart on the waveform container
     that calculates the position proportionally, bypassing
     the individual bar targets entirely.                   */
  if (isTouch) {
    onPlayerReady(() => {
      const waveEl = document.getElementById('sc-wave');
      if (!waveEl) return;

      waveEl.addEventListener('touchstart', e => {
        e.preventDefault();
        const rect = waveEl.getBoundingClientRect();
        let pct = (e.touches[0].clientX - rect.left) / rect.width;
        pct = Math.max(0, Math.min(1, pct));

        const iframe = document.getElementById('sc-iframe');
        if (iframe && window.SC) {
          const w = SC.Widget(iframe);
          w.getDuration(dur => {
            if (!dur) return;
            w.seekTo(pct * dur);
            /* Mirror visual update — update prog bar width */
            const progEl = document.getElementById('sc-prog');
            if (progEl) progEl.style.width = (pct * 100) + '%';
          });
        }
      }, { passive: false });
    });
  }

  /* ── 12. SWIPE-TO-SKIP — HORIZONTAL SWIPE ON PLAYER ─────
     Swipe left on #sc-ui → next track
     Swipe right on #sc-ui → prev track
     Threshold: 40px horizontal, must be more horizontal than
     vertical to avoid conflicting with page intent.         */
  if (isTouch) {
    onPlayerReady(() => {
      const scUi = document.getElementById('sc-ui');
      if (!scUi) return;

      /* Inject the swipe hint element (CSS positions + fades it) */
      const hint = document.createElement('span');
      hint.id = 'swipe-hint';
      hint.textContent = '⟨  ⟩';
      hint.setAttribute('aria-hidden', 'true');
      scUi.appendChild(hint);

      let swipeStartX = 0, swipeStartY = 0;

      scUi.addEventListener('touchstart', e => {
        swipeStartX = e.touches[0].clientX;
        swipeStartY = e.touches[0].clientY;
      }, { passive: true });

      scUi.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - swipeStartX;
        const dy = e.changedTouches[0].clientY - swipeStartY;

        /* Only fire if horizontal dominates and crosses threshold */
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

        /* Visual micro-feedback — brief translate */
        const dir = dx < 0 ? 1 : -1;
        scUi.style.transition = 'transform .12s ease';
        scUi.style.transform  = `translateX(${dir * 6}px)`;
        setTimeout(() => {
          scUi.style.transform  = '';
          scUi.style.transition = '';
        }, 160);

        if (dx < 0) {
          document.getElementById('btn-next').click();
        } else {
          document.getElementById('btn-prev').click();
        }
      }, { passive: true });
    });
  }

  /* ── 13. TRACK TITLE MARQUEE ─────────────────────────────
     Long SC track titles get clipped with ellipsis on desktop.
     On mobile the player is narrower — titles clip even sooner.
     If the title overflows its container we add a CSS class
     that triggers a scroll marquee animation (defined in
     mobile.css). We check on every track change via a
     MutationObserver on #sc-track.                          */
  if (isMobile || isTouch) {
    onPlayerReady(() => {
      const trackEl = document.getElementById('sc-track');
      if (!trackEl) return;

      function checkMarquee() {
        /* scrollWidth > clientWidth means text is clipped */
        if (trackEl.scrollWidth > trackEl.clientWidth + 2) {
          trackEl.classList.add('marquee');
        } else {
          trackEl.classList.remove('marquee');
        }
      }

      /* Check after content changes and after fonts load */
      new MutationObserver(checkMarquee).observe(trackEl, { childList: true, characterData: true, subtree: true });
      checkMarquee();
    });
  }

})();
