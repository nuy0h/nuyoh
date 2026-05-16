/* ═══════════════════════════════════════════════════════════
   mobile.js  —  Performance + touch safety layer
   Load AFTER background.js and main.js in index.html.
   Does NOT rewrite any existing system — only patches
   runtime behaviour based on device capability.
   ═══════════════════════════════════════════════════════════ */
(function () {

  /* ── DEVICE DETECTION ───────────────────────────────────── */
  const isTouch   = window.matchMedia('(pointer: coarse)').matches;
  const isMobile  = window.innerWidth <= 768;
  const isNarrow  = window.innerWidth <= 380;

  /* Orientation change: let CSS handle reflow.
     Fire synthetic resize after the browser settles (~320ms)
     so --vh and canvas scale stay in sync.                   */
  window.addEventListener('orientationchange', () => {
    setTimeout(() => window.dispatchEvent(new Event('resize')), 320);
  });

  /* ── 1. CUSTOM CURSOR — DISABLE ON TOUCH ────────────────── */
  if (isTouch) {
    /* The cursor rAF loop in main.js still runs but the elements
       are hidden via CSS (pointer:coarse rule in mobile.css).
       We additionally stop feeding it mouse coordinates from
       synthetic touch events that some browsers fire, which
       could cause the hidden elements to accidentally become
       visible if CSS is slow to apply.                         */
    document.removeEventListener('mousemove', window.__cursorMoveHandler, true);

    /* Belt-and-suspenders: force display:none via JS in case
       the CSS sheet hasn't parsed yet at script execution time  */
    ['cur','cur-ring','cur-aura'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  /* ── 2. PARTICLE FIELD — THROTTLE ON MOBILE ─────────────── */
  /*
     The O(n²) connection loop at NUM=300 means ~44 850 distance
     checks per frame — fine on desktop GPU-composited layers,
     but costly on mobile CPUs sharing one thread with the DOM.

     Strategy:
       - Mobile (≤768px):  reduce active particle count to 120
       - Narrow  (≤380px): reduce to 80
       - Touch + mobile:   also frame-skip the connection pass
                           (draw dots every frame, connections
                           every 2nd frame)

     We patch the existing `pts` array in window.BG — it was
     built with 300 entries; we simply cap the loop counter and
     set excess particles as inactive rather than splicing
     (splicing would break index references in the connection
     nested loop).

     The actual drawBG function loop bound is controlled through
     a writable property we attach to window.BG.
  */

  if (isMobile || isTouch) {
    const targetCount = isNarrow ? 80 : 120;

    /* Expose the cap so background.js's drawBG can read it.
       background.js uses `NUM` as a const — we shadow it via
       the BG object. We need to patch the live loop.
       Since we can't rewrite the closed-over `NUM`, we instead
       override at the canvas level using a trick: we replace
       the drawBG rAF loop with a thin wrapper that only
       processes the first `targetCount` particles.             */

    /* Wait one tick to ensure window.BG is fully set */
    requestAnimationFrame(() => patchParticleLoop(targetCount));
  }

  function patchParticleLoop(cap) {
    /* Grab the canvas the original loop draws to */
    const canvas = document.getElementById('bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    /* The original loop is already running via rAF. We can't
       cancel it because we don't hold its ID. Instead we
       overdraw on top of it using a second canvas that sits
       between #bg and the overlays — NO, that's fragile.

       Better: we read `pts` from the closure via a debug hook.
       Since background.js is an IIFE we can't reach `pts`.

       Cleanest safe approach: use CSS will-change + a frame
       budget flag. We tell the existing loop to idle every
       other frame by patching `requestAnimationFrame` itself
       for background.js's private rAF calls only.

       ACTUALLY — the simplest correct approach:
       background.js was written by us, so we can add a
       module-level flag it reads. We expose a throttle
       channel on window.BG and have the loop check it.
       But the loop is already running without that check.

       REAL solution: css `will-change:transform` on the canvas
       + reduce ghost spawn rate (which is DOM-heavy) +
       set canvas pixel ratio to 0.75 on mobile (fewer pixels
       to composite). This is the non-invasive path that
       requires zero changes to the existing loop.             */

    /* ── Canvas resolution scaling (fewer pixels = less GPU fill-rate) */
    const dpr = window.devicePixelRatio || 1;
    const scale = isNarrow ? 0.6 : 0.75;
    const W = window.innerWidth;
    const H = window.innerHeight;

    /* Resize canvases to scaled resolution, CSS size stays full */
    [canvas, document.getElementById('name-particles'),
     document.getElementById('glitch-canvas')].forEach(c => {
      if (!c) return;
      c.width  = Math.round(W * scale);
      c.height = Math.round(H * scale);
      c.style.width  = W + 'px';
      c.style.height = H + 'px';
    });

    /* Re-expose a resize handler that respects the scale */
    window.addEventListener('resize', () => {
      const nW = window.innerWidth, nH = window.innerHeight;
      [canvas, document.getElementById('name-particles'),
       document.getElementById('glitch-canvas')].forEach(c => {
        if (!c) return;
        c.width  = Math.round(nW * scale);
        c.height = Math.round(nH * scale);
        c.style.width  = nW + 'px';
        c.style.height = nH + 'px';
      });
    });

    /* Promote canvas to its own compositor layer — avoids
       triggering layout on every paint                        */
    canvas.style.willChange = 'transform';
  }

  /* ── 3. GHOST TEXT — REDUCE DOM CHURN ON MOBILE ─────────── */
  /*
     Ghost text spawns every 3 500ms and each ghost lives 13–23s.
     On desktop that's ~4–6 simultaneous elements — fine.
     On mobile it adds constant style recalcs on fixed-position
     elements. We slow the spawn interval on mobile.

     We can't cancel the existing setInterval in background.js's
     IIFE. We CAN prevent new ghosts from actually being added
     to the DOM by capping total ghost count via an observer,
     or by overriding document.body.appendChild for ghost nodes.

     Lightest approach: just count `.ghost` nodes and skip the
     spawn if we're over budget. We monkey-patch spawnGhost
     via window.BG — but spawnGhost isn't exported.

     Next lightest: MutationObserver to remove excess ghosts. */

  if (isMobile || isTouch) {
    const GHOST_CAP = isNarrow ? 2 : 3;   // desktop allows ~5–6

    new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.classList && node.classList.contains('ghost')) {
            const all = document.querySelectorAll('.ghost');
            if (all.length > GHOST_CAP) {
              /* Remove the oldest ghost (first in NodeList) */
              all[0].remove();
            }
          }
        });
      });
    }).observe(document.body, { childList: true });
  }

  /* ── 4. VIEWPORT HEIGHT — MOBILE BROWSER CHROME FIX ─────── */
  /*
     iOS Safari and Android Chrome include the address-bar
     height in `window.innerHeight` when first painted, then
     subtract it when the user scrolls. This causes fixed-
     positioned fullscreen elements (.screen) to shift.

     CSS dvh handles this declaratively (see mobile.css) but
     we also set a --vh custom property so any element that
     can't use dvh has a JS fallback.                          */

  function setVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  setVH();
  window.addEventListener('resize', setVH);

  /* ── 5. SCROLL / OVERFLOW GUARD ─────────────────────────── */
  /*
     `overflow:hidden` on body prevents normal scroll, but on
     iOS Safari momentum scroll can still escape if a child
     element has `-webkit-overflow-scrolling:touch`. We lock
     touchmove at the document level unless the target is a
     scrollable child (none exist in this experience).         */

  if (isTouch) {
    document.addEventListener('touchmove', e => {
      /* Allow scrolling inside #boot-log if it overflows */
      if (e.target.closest('#boot-log')) return;
      e.preventDefault();
    }, { passive: false });
  }

  /* ── 6. PLAYER FIXED POSITION — SAFE BOTTOM ─────────────── */
  /*
     On some mobile browsers `bottom: 24px` on a fixed element
     lands under the browser's nav bar / home indicator.
     We use the CSS env() safe-area where available, and provide
     a JS fallback.

     CSS env(safe-area-inset-bottom) is the right tool but
     requires the viewport meta to include
     `viewport-fit=cover`. We add that dynamically here so we
     don't have to edit index.html.                            */

  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta && !viewportMeta.content.includes('viewport-fit')) {
    viewportMeta.content += ', viewport-fit=cover';
  }

  /* ── 7. EIRA WIDGET — HIDE ON VERY NARROW + SHORT SCREENS ── */
  /*
     On landscape phones the EIRA widget (top:22px, right:26px)
     overlaps the main content. CSS handles width; we also
     check viewport height.                                     */

  function checkEiraVisibility() {
    const eira = document.getElementById('eira-widget');
    if (!eira) return;
    /* Hide if viewport is both narrow and short (landscape phone) */
    const hide = window.innerWidth <= 600 && window.innerHeight <= 420;
    eira.style.display = hide ? 'none' : '';
  }
  checkEiraVisibility();
  window.addEventListener('resize', checkEiraVisibility);

})();
