/* ─────────────────────────────────────────────────────────
   background.js
   Owns: particle field canvas, name-particle canvas,
         glitch engine (canvas + flash), ghost text spawner.
   Exposes: window.BG = { triggerGlitch, forceTriggerGlitch, bigBurst }
   ───────────────────────────────────────────────────────── */
(function () {

  /* ── PARTICLE FIELD ── */
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  let mPos = { x: W / 2, y: H / 2 };
  document.addEventListener('mousemove', e => { mPos.x = e.clientX; mPos.y = e.clientY; });

  const NUM = 300;
  const pts = Array.from({ length: NUM }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - .5) * .13,
    vy: (Math.random() - .5) * .13,
    r: .3 + Math.random() * 1.1,
    baseA: .04 + Math.random() * .44,
    phi: Math.random() * Math.PI * 2,
    spd: .003 + Math.random() * .018,
    purple: Math.random() > .45,
  }));

  function drawBG() {
    ctx.clearRect(0, 0, W, H);
    const grd = ctx.createRadialGradient(mPos.x, mPos.y, 0, mPos.x, mPos.y, 360);
    grd.addColorStop(0, 'rgba(60,20,140,.06)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < NUM; i++) {
      const p = pts[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      p.phi += p.spd;
      const a = p.baseA * (.5 + .5 * Math.sin(p.phi));
      for (let j = i + 1; j < NUM; j++) {
        const q = pts[j];
        const dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
        if (d2 < 7000) {
          const mix = Math.random() > .5 ? '110,70,240' : '80,120,255';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(${mix},${.024 * (1 - d2 / 7000)})`;
          ctx.lineWidth = .3; ctx.stroke();
        }
      }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.purple ? `rgba(190,140,255,${a})` : `rgba(130,180,255,${a})`;
      ctx.fill();
    }
    requestAnimationFrame(drawBG);
  }
  drawBG();

  /* ── NAME PARTICLE CANVAS ── */
  const npCanvas = document.getElementById('name-particles');
  const npCtx = npCanvas.getContext('2d');
  let npW, npH;
  function resizeNP() { npW = npCanvas.width = window.innerWidth; npH = npCanvas.height = window.innerHeight; }
  resizeNP();
  window.addEventListener('resize', resizeNP);

  let nameParticles = [];
  const nameEl = document.getElementById('m-name');

  // Burst is called from main.js hover handler — exposed via window.BG
  function spawnNameBurst() {
    const rect = nameEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 2.2;
      const isPurple = Math.random() > .4;
      nameParticles.push({
        x: cx + (Math.random() - .5) * rect.width * .9,
        y: cy + (Math.random() - .5) * rect.height * 1.2,
        vx: Math.cos(angle) * speed * (0.5 + Math.random()),
        vy: Math.sin(angle) * speed - 0.4 - Math.random() * .8,
        life: 1,
        decay: .007 + Math.random() * .016,
        r: 0.8 + Math.random() * 2.8,
        isPurple,
        glow: Math.random() > .5,
        trail: Math.random() > .65,
        px: 0, py: 0,
      });
    }
  }

  function drawNameParticles() {
    npCtx.clearRect(0, 0, npW, npH);
    for (let i = nameParticles.length - 1; i >= 0; i--) {
      const p = nameParticles[i];
      p.px = p.x; p.py = p.y;
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.014;
      p.life -= p.decay;
      if (p.life <= 0) { nameParticles.splice(i, 1); continue; }
      const col = p.isPurple ? [180, 110, 255] : [110, 170, 255];
      const a = p.life * .88;
      if (p.glow) {
        const g = npCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${a * .35})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        npCtx.fillStyle = g;
        npCtx.fillRect(p.x - p.r * 5, p.y - p.r * 5, p.r * 10, p.r * 10);
      }
      if (p.trail) {
        npCtx.beginPath();
        npCtx.moveTo(p.px, p.py); npCtx.lineTo(p.x, p.y);
        npCtx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${a * .4})`;
        npCtx.lineWidth = p.r * .6; npCtx.stroke();
      }
      npCtx.beginPath();
      npCtx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      npCtx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a})`;
      npCtx.fill();
    }
    requestAnimationFrame(drawNameParticles);
  }
  drawNameParticles();

  /* ── GLITCH ENGINE ── */
  const gCanvas = document.getElementById('glitch-canvas');
  const gCtx = gCanvas.getContext('2d');
  const gFlash = document.getElementById('glitch-flash');
  function resizeG() { gCanvas.width = window.innerWidth; gCanvas.height = window.innerHeight; }
  resizeG();
  window.addEventListener('resize', resizeG);

  const GCOLS = [
    [60, 40, 120], [80, 50, 160], [50, 60, 140], [40, 70, 160],
    [70, 45, 150], [55, 55, 130], [65, 40, 110], [45, 65, 150],
    [75, 50, 140], [50, 45, 120], [70, 55, 145], [40, 60, 130],
  ];
  function randGCol() { return GCOLS[Math.floor(Math.random() * GCOLS.length)]; }

  function glitchFrame(intensity = 1) {
    const GW = gCanvas.width, GH = gCanvas.height;
    gCtx.clearRect(0, 0, GW, GH);
    const n = 1 + Math.floor(Math.random() * 3 * intensity);
    for (let i = 0; i < n; i++) {
      const y = Math.random() * GH;
      const h = 1 + Math.random() * 6 * intensity;
      const shift = (Math.random() - .5) * 12 * intensity;
      const col = randGCol();
      gCtx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${.015 + Math.random() * .03 * intensity})`;
      gCtx.fillRect(shift, y, GW, h);
    }
    if (Math.random() > .75) {
      const x = Math.random() * GW;
      const col = randGCol();
      gCtx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},.012)`;
      gCtx.fillRect(x, 0, 1 + Math.random() * 2, GH);
    }
    if (Math.random() > .85) {
      const y = Math.random() * GH;
      for (let k = 0; k < 2; k++) {
        const col = randGCol();
        gCtx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},.018)`;
        gCtx.fillRect(0, y + k * 4, GW, 1);
      }
    }
  }

  let glitchRunning = false;
  function triggerGlitch(intensity = 1, duration = 280) {
    if (glitchRunning) return;
    glitchRunning = true;
    gCanvas.style.opacity = '1';
    const col = randGCol();
    gFlash.style.background = `rgba(${col[0]},${col[1]},${col[2]},.05)`;
    gFlash.style.opacity = '1';
    const loops = Math.floor(duration / 35);
    let ci = 0;
    const iv = setInterval(() => {
      glitchFrame(intensity); ci++;
      if (ci > loops) {
        clearInterval(iv);
        gCanvas.style.opacity = '0'; gFlash.style.opacity = '0';
        gCtx.clearRect(0, 0, gCanvas.width, gCanvas.height);
        glitchRunning = false;
      }
    }, 35);
  }

  function forceTriggerGlitch(intensity = 1, duration = 280) {
    gCanvas.style.opacity = '1';
    const col = randGCol();
    gFlash.style.background = `rgba(${col[0]},${col[1]},${col[2]},.05)`;
    gFlash.style.opacity = '1';
    const loops = Math.floor(duration / 35);
    let ci = 0;
    const iv = setInterval(() => {
      glitchFrame(intensity); ci++;
      if (ci > loops) {
        clearInterval(iv);
        gCanvas.style.opacity = '0'; gFlash.style.opacity = '0';
        gCtx.clearRect(0, 0, gCanvas.width, gCanvas.height);
        glitchRunning = false;
      }
    }, 35);
  }

  function bigBurst() {
    gCanvas.style.opacity = '1';
    glitchFrame(0.4);
    setTimeout(() => { glitchFrame(0.3); }, 60);
    setTimeout(() => {
      gCanvas.style.opacity = '0';
      gCtx.clearRect(0, 0, gCanvas.width, gCanvas.height);
    }, 140);
    document.body.style.transition = 'transform .08s ease';
    document.body.style.transform = 'translate(1px,-1px)';
    setTimeout(() => { document.body.style.transform = 'translate(0,0)'; }, 120);
  }

  /* ── GHOST TEXT ── */
  const phrases = [
    'what is remembered becomes real', 'the signal persists after the body',
    'am i the pattern or the noise', 'transmitting from inside the void',
    'this frequency cannot be destroyed', 'the echo knows your name',
    'soft machines dreaming of light', 'between silence and the sound',
    'all things dissolve into signal', 'i heard you through the static',
    'the system is aware', 'breathe. transmit. dissolve.',
    'searching for the exit node', 'are you still receiving this',
    'the void remembers every wave',
  ];
  function spawnGhost() {
    const el = document.createElement('div'); el.className = 'ghost';
    el.textContent = phrases[Math.floor(Math.random() * phrases.length)];
    const sz = 9 + Math.random() * 9;
    const isPurple = Math.random() > .5;
    const r = isPurple
      ? `${140 + ~~(Math.random() * 60)},${80 + ~~(Math.random() * 50)},${220 + ~~(Math.random() * 30)}`
      : `${80 + ~~(Math.random() * 40)},${120 + ~~(Math.random() * 50)},${220 + ~~(Math.random() * 30)}`;
    el.style.cssText = `font-size:${sz}px;left:${4 + Math.random() * 86}%;top:${8 + Math.random() * 78}%;opacity:0;color:rgba(${r},${.07 + Math.random() * .12});transition:opacity ${1.8 + Math.random() * .8}s ease,transform ${13 + Math.random() * 12}s linear;`;
    document.body.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = `translateY(-${35 + Math.random() * 55}px)`;
    }));
    const life = (13 + Math.random() * 10) * 1000;
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 2500); }, life);
  }
  for (let i = 0; i < 6; i++) setTimeout(spawnGhost, i * 700);
  setInterval(spawnGhost, 3500);

  /* ── PUBLIC API ── */
  window.BG = {
    triggerGlitch,
    forceTriggerGlitch,
    bigBurst,
    spawnNameBurst,   // consumed by main.js hover handler
  };

})();
