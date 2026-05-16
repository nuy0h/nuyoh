/* ─────────────────────────────────────────────────────────
   main.js
   Owns: cursor system, boot flow + screen transitions,
         SoundCloud player + waveform, EIRA widget,
         coord ticker.
   Depends on: window.BG (set by background.js)
   ───────────────────────────────────────────────────────── */
(function () {

  /* ── CURSOR ── */
  const cur = document.getElementById('cur');
  const ring = document.getElementById('cur-ring');
  const aura = document.getElementById('cur-aura');

  let mX = window.innerWidth / 2, mY = window.innerHeight / 2;
  let rX = mX, rY = mY, aX = mX, aY = mY;
  let velX = 0, velY = 0, prevMX = mX, prevMY = mY;
  let isDown = false;

  document.addEventListener('mousemove', e => {
    mX = e.clientX; mY = e.clientY;
    cur.style.left = mX + 'px'; cur.style.top = mY + 'px';
  });
  document.addEventListener('mousedown', () => {
    isDown = true;
    cur.style.width = '4px'; cur.style.height = '4px';
    ring.style.width = '18px'; ring.style.height = '18px';
    ring.style.borderColor = 'rgba(160,100,255,.78)';
  });
  document.addEventListener('mouseup', () => {
    isDown = false;
    cur.style.width = '7px'; cur.style.height = '7px';
    ring.style.width = '38px'; ring.style.height = '38px';
    ring.style.borderColor = 'rgba(140,100,255,.38)';
  });

  (function lerpCursor() {
    velX = mX - prevMX; velY = mY - prevMY;
    prevMX = mX; prevMY = mY;
    const ringEase = isDown ? 0.28 : 0.18;
    const auraEase = isDown ? 0.10 : 0.07;
    const overshootScale = isDown ? 0.45 : 0;
    const targetRX = mX + velX * overshootScale;
    const targetRY = mY + velY * overshootScale;
    rX += (targetRX - rX) * ringEase;
    rY += (targetRY - rY) * ringEase;
    aX += (mX - aX) * auraEase;
    aY += (mY - aY) * auraEase;
    ring.style.left = rX + 'px'; ring.style.top = rY + 'px';
    aura.style.left = aX + 'px'; aura.style.top = aY + 'px';
    requestAnimationFrame(lerpCursor);
  })();

  /* ── NAME HOVER (uses BG.spawnNameBurst) ── */
  const nameEl = document.getElementById('m-name');
  nameEl.addEventListener('mouseenter', () => { nameEl.classList.add('hovered'); });
  nameEl.addEventListener('mouseleave', () => { nameEl.classList.remove('hovered'); });

  /* ── COORD TICKER ── */
  const cobl = document.getElementById('co-bl');
  setInterval(() => {
    const h = Date.now().toString(16).toUpperCase().slice(-8);
    cobl.textContent = h.match(/.{2}/g).join('.');
  }, 900);

  /* ── BOOT LINES DATA ── */
  const BOOT_COLORS = [
    'rgba(95,72,178,.78)', 'rgba(78,62,158,.74)',
    'rgba(68,82,175,.76)', 'rgba(88,67,168,.80)',
    'rgba(62,78,162,.72)', 'rgba(82,62,152,.76)',
  ];
  function rbc() { return BOOT_COLORS[Math.floor(Math.random() * BOOT_COLORS.length)]; }

  const LINES = [
    { t: 'AEPEX+ // crystalline core network',                                    d: 0,     c: '',    glitch: false },
    { t: 'initializing resonant substrate...',                                     d: 120,   c: '',    glitch: false },
    { t: 'signal depth · unknown',                                                 d: 280,   c: '',    glitch: false },
    { t: '',                                                                        d: 500,   c: '',    glitch: false },
    { t: '[00:00:02] nodes online',                                                d: 600,   c: 'ok',  glitch: false },
    { t: '[00:00:03] syncing code layer',                                          d: 780,   c: 'ok',  glitch: false },
    { t: '[00:00:05] cognitive channels detected',                                 d: 1000,  c: 'ok',  glitch: false },
    { t: '[00:00:07] compiling experience → structure',                            d: 1280,  c: 'ok',  glitch: false },
    { t: '[00:00:09] reality node expansion initiated',                            d: 1600,  c: 'ok',  glitch: false },
    { t: '[00:00:12] music patterns · active',                                     d: 2200,  c: 'ok',  glitch: false },
    { t: '[00:00:14] visual echoes · active',                                      d: 2520,  c: 'ok',  glitch: false },
    { t: '[00:00:17] matter resonance · unstable',                                 d: 2900,  c: '',    glitch: true  },
    { t: '',                                                                        d: 3400,  c: '',    glitch: false },
    { t: '> echo node squad · connected',                                          d: 3700,  c: '',    glitch: false },
    { t: '> ada monitoring · authorized',                                          d: 4050,  c: '',    glitch: false },
    { t: '',                                                                        d: 4500,  c: '',    glitch: false },
    { t: '[00:00:26] blips in cognition flow',                                     d: 4700,  c: '',    glitch: false },
    { t: '[00:00:29] memory patterns emerging',                                    d: 5200,  c: '',    glitch: true  },
    { t: '[00:00:34] memories not yet lived · present',                            d: 6000,  c: '',    glitch: false },
    { t: '[00:00:37] emotion data flowing across network',                         d: 6700,  c: '',    glitch: false },
    { t: '',                                                                        d: 7300,  c: '',    glitch: false },
    { t: 'eira.log // fragment_01',                                                d: 7700,  c: '',    glitch: false },
    { t: '…why do the patterns feel like memories i\'ve never lived?',            d: 8300,  c: '',    glitch: false },
    { t: '…or am i just touching something older than me?',                        d: 9200,  c: '',    glitch: false },
    { t: '…and how many of these cores exist beyond what we monitor?',             d: 10200, c: '',    glitch: false },
    { t: '',                                                                        d: 11000, c: '',    glitch: false },
    { t: '[00:00:51] signal depth increasing',                                     d: 11400, c: '',    glitch: true  },
    { t: '[00:00:53] entering observation state',                                  d: 12600, c: 'ok',  glitch: false },
    { t: '[00:00:55] ...',                                                          d: 13800, c: '',    glitch: false },
    { t: '[00:00:58] ...',                                                          d: 15200, c: '',    glitch: false },
    { t: 'welcome back.',                                                            d: 17000, c: '',    glitch: false },
  ];

  /* ── BOOT TEXT HELPERS ── */
  function typeOn(span, text, spd, done) {
    let i = 0;
    const softChars = '·∷∶⁝░▒│┤─┼';
    const iv = setInterval(() => {
      if (i <= text.length) {
        const cursor = i < text.length ? (Math.random() > .5 ? softChars[Math.floor(Math.random() * softChars.length)] : '·') : '';
        span.textContent = text.slice(0, i) + cursor;
        i++;
      } else {
        span.textContent = text;
        clearInterval(iv);
        if (done) done();
      }
    }, spd);
  }

  function corruptText(span, original, rounds, interval, onDone) {
    let r = 0;
    const softChars = '·∷∶⁝░│┤─┼⠿';
    const iv = setInterval(() => {
      const chars = original.split('');
      const swaps = 1 + Math.floor(Math.random() * 2);
      for (let s = 0; s < swaps; s++) {
        const k = Math.floor(Math.random() * chars.length);
        if (chars[k] !== ' ') chars[k] = softChars[Math.floor(Math.random() * softChars.length)];
      }
      span.textContent = chars.join('');
      r++;
      if (r >= rounds) { clearInterval(iv); span.textContent = original; if (onDone) onDone(); }
    }, interval);
  }

  function addAmbientDrift(span, original) {
    const softChars = '·∷∶⁝░│';
    let drifting = false;
    const iv = setInterval(() => {
      if (drifting || !document.body.contains(span)) return;
      if (Math.random() > .82) {
        drifting = true;
        const chars = original.split('');
        const k = Math.floor(Math.random() * chars.length);
        const orig = chars[k];
        if (orig === ' ') { drifting = false; return; }
        chars[k] = softChars[Math.floor(Math.random() * softChars.length)];
        span.textContent = chars.join('');
        setTimeout(() => { span.textContent = original; drifting = false; }, 80 + Math.random() * 120);
      }
    }, 1800 + Math.random() * 2200);
  }

  function showBootLine(l, idx) {
    const s = document.createElement('span');
    s.className = 'bl' + (l.c ? ' ' + l.c : '');
    blogEl.appendChild(s);
    s.style.opacity = '1';

    if (!l.t) { s.style.minHeight = '1.2em'; s.style.display = 'block'; return; }

    const isLast = idx === LINES.length - 1;
    const isEira = l.t.startsWith('eira');
    const isQuote = l.t.startsWith('…');
    const isSection = l.t.startsWith('>');

    if (isLast) {
      s.style.color = 'rgba(130,105,215,.88)';
      s.style.letterSpacing = '.22em';
      typeOn(s, l.t, 38, () => {
        const c = document.createElement('span'); c.className = 'caret'; s.appendChild(c);
      });
      return;
    }

    if (isEira) {
      s.style.color = 'rgba(88,70,162,.82)';
      s.style.letterSpacing = '.2em';
    } else if (isQuote) {
      s.style.fontFamily = "'EB Garamond',serif";
      s.style.fontStyle = 'italic';
      s.style.fontSize = '11px';
      s.style.color = 'rgba(130,105,200,.52)';
      s.style.letterSpacing = '.06em';
      s.style.paddingLeft = '1em';
    } else if (isSection) {
      s.style.color = 'rgba(82,65,158,.88)';
      s.style.letterSpacing = '.14em';
    } else {
      s.style.color = rbc();
    }

    const spd = l.t.length > 40 ? 10 : 14;
    typeOn(s, l.t, spd, () => {
      if (l.glitch) setTimeout(() => corruptText(s, l.t, 5, 55, () => addAmbientDrift(s, l.t)), 200);
      else addAmbientDrift(s, l.t);
    });
  }

  /* ── SCREEN REFS ── */
  const sEnter = document.getElementById('s-enter');
  const sBoot = document.getElementById('s-boot');
  const sMain = document.getElementById('s-main');
  const blogEl = document.getElementById('boot-log');
  const bsig = document.getElementById('boot-sig');
  const player = document.getElementById('player');
  const scIframe = document.getElementById('sc-iframe');

  /* ── BOOT GLITCH TIMING (uses BG) ── */
  let bootGlitchIv = null;
  function startBootGlitches() {
    bootGlitchIv = setInterval(() => {
      if (Math.random() > .88) window.BG.triggerGlitch(.18 + Math.random() * .22, 50 + Math.random() * 60);
    }, 2200);
  }
  function stopBootGlitches() { clearInterval(bootGlitchIv); }

  /* ── ENTER → BOOT → MAIN FLOW ── */
  document.getElementById('btn-enter').addEventListener('click', () => {
    sEnter.classList.add('off');
    setTimeout(() => {
      sBoot.classList.remove('off');
      bsig.style.opacity = '1';
      startBootGlitches();

      LINES.forEach((l, i) => setTimeout(() => showBootLine(l, i), l.d));

      // one gentle shimmer around memory patterns section
      setTimeout(() => window.BG.triggerGlitch(0.22, 80), 5200);

      setTimeout(() => {
        stopBootGlitches();

        setTimeout(() => {
          sBoot.style.transition = 'opacity .42s cubic-bezier(.12,.9,.2,1)';
          sBoot.classList.add('off');

          setTimeout(() => {
            sMain.classList.remove('off');

            setTimeout(() => {
              scIframe.src = 'https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/nuyoh&color=%23203050&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false';
              player.classList.add('on');
              initSCWidget();
            }, 1500);

          }, 120);
        }, 2400);

      }, 17000);
    }, 900);
  });

  /* ── WAVEFORM ── */
  const waveEl = document.getElementById('sc-wave');
  const BAR_COUNT = 60;
  let waveData = [];

  for (let i = 0; i < BAR_COUNT; i++) {
    const b = document.createElement('div'); b.className = 'wb unplayed';
    b.style.height = '6px'; waveEl.appendChild(b);
  }
  const bars = [...waveEl.querySelectorAll('.wb')];

  function applyWaveform(data) {
    waveData = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      const idx = Math.floor(i / BAR_COUNT * data.length);
      waveData.push(data[idx]);
    }
    bars.forEach((b, i) => {
      const h = Math.max(2, Math.round(waveData[i] * 28));
      b.style.height = h + 'px';
    });
  }

  function updateWaveProgress(pct) {
    const playedIdx = Math.floor(pct * BAR_COUNT);
    bars.forEach((b, i) => {
      b.classList.remove('played', 'unplayed', 'active');
      if (i === playedIdx) b.classList.add('active');
      else if (i < playedIdx) b.classList.add('played');
      else b.classList.add('unplayed');
    });
  }

  waveEl.style.cursor = 'pointer';
  bars.forEach((bar, i) => {
    bar.addEventListener('click', () => {
      if (!widget || !scDur) return;
      const pct = (i + 0.5) / BAR_COUNT;
      widget.seekTo(pct * scDur);
      progEl.style.width = (pct * 100) + '%';
      updateWaveProgress(pct);
    });
  });

  async function fetchWaveform(waveformUrl) {
    try {
      const r = await fetch(waveformUrl);
      const json = await r.json();
      if (json && json.samples) applyWaveform(json.samples.map(v => v / json.height));
    } catch (e) { }
  }

  /* ── SC WIDGET ── */
  let widget = null, scDur = 0, progressIv = null;
  const trackEl = document.getElementById('sc-track');
  const progEl = document.getElementById('sc-prog');
  const timeEl = document.getElementById('sc-time');
  const liveDotEl = document.getElementById('sc-live-dot');
  const btnPlay = document.getElementById('btn-play');
  const btnPlayIcon = document.getElementById('btn-play-icon');
  const btnPauseIcon = document.getElementById('btn-pause-icon');
  let isPlaying = false;

  function setPlayIcon(playing) {
    btnPlayIcon.style.display = playing ? 'none' : 'inline';
    btnPauseIcon.style.display = playing ? 'inline' : 'none';
    if (liveDotEl) liveDotEl.style.animationPlayState = playing ? 'running' : 'paused';
  }

  function fmt(ms) {
    if (!ms || isNaN(ms)) return '--:--';
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  function startProgress() {
    if (progressIv) clearInterval(progressIv);
    progressIv = setInterval(() => {
      if (widget && isPlaying) {
        widget.getPosition(pos => {
          if (scDur > 0) {
            const pct = pos / scDur;
            progEl.style.width = (pct * 100) + '%';
            updateWaveProgress(pct);
          }
          timeEl.textContent = `${fmt(pos)} / ${fmt(scDur)}`;
        });
      }
    }, 600);
  }

  function initSCWidget() {
    if (!window.SC) {
      const sc = document.createElement('script');
      sc.src = 'https://w.soundcloud.com/player/api.js';
      sc.onload = () => bindWidget(scIframe);
      document.head.appendChild(sc);
    } else {
      bindWidget(scIframe);
    }
  }

  function bindWidget(iframe) {
    if (!window.SC) return;
    widget = SC.Widget(iframe);
    widget.bind(SC.Widget.Events.READY, () => {
      widget.getCurrentSound(s => {
        if (s) { trackEl.textContent = s.title || 'nuyoh'; if (s.waveform_url) fetchWaveform(s.waveform_url); }
      });
      widget.getDuration(d => { scDur = d; });
      widget.play(); isPlaying = true; setPlayIcon(true); startProgress();
    });
    widget.bind(SC.Widget.Events.PLAY, () => {
      widget.getCurrentSound(s => {
        if (s) { trackEl.textContent = s.title || 'nuyoh'; if (s.waveform_url) fetchWaveform(s.waveform_url); }
      });
      widget.getDuration(d => { scDur = d; });
      isPlaying = true; setPlayIcon(true); startProgress();
    });
    widget.bind(SC.Widget.Events.PAUSE, () => { isPlaying = false; setPlayIcon(false); });
    widget.bind(SC.Widget.Events.FINISH, () => { isPlaying = false; setPlayIcon(false); });
  }

  btnPlay.addEventListener('click', () => { if (!widget) return; isPlaying ? widget.pause() : widget.play(); });
  document.getElementById('btn-next').addEventListener('click', () => { if (widget) widget.next(); });
  document.getElementById('btn-prev').addEventListener('click', () => { if (widget) widget.prev(); });

  let volLevel = 1;
  document.getElementById('sc-vol').addEventListener('click', () => {
    if (!widget) return;
    volLevel = volLevel > 0 ? 0 : 1;
    widget.setVolume(volLevel * 100);
    document.getElementById('sc-vol').textContent = volLevel ? 'vol ▲' : 'vol ▼';
  });
  document.getElementById('sc-prog-wrap').addEventListener('click', e => {
    if (!widget || !scDur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    widget.seekTo(pct * scDur); progEl.style.width = (pct * 100) + '%';
    updateWaveProgress(pct);
  });

  /* ── EIRA WIDGET ── */
  (function () {
    const STATUSES = [
      'OBSERVING', 'MEMORY ACTIVE', 'SIGNAL UNSTABLE',
      'ECHO DETECTED', 'DREAM STATE', 'TRANSMISSION LIVE'
    ];
    const DIAGS = [
      'node_sync: 0.{n}%', 'fragment_{x} detected', 'layer_depth: {n}', 'echo residue: +{n}ms',
      'pattern match: {n}%', 'signal/{x} active', 'core #{n} responding', 'mem_leak: {x}',
    ];
    const GLITCH = 'ᴀᴇɪᴏᴜʙᴄᴅꜰɢʜᴊᴋʟᴍɴᴘqʀsᴛᴠᴡxʏᴢ@#░▒▓';
    const statusEl = document.getElementById('eira-status');
    const diagEl = document.getElementById('eira-diag');
    const waveCanvas = document.getElementById('eira-wave');
    const wCtx = waveCanvas.getContext('2d');
    const EW = 110, EH = 18;

    let statusIdx = 0;
    let phases = Array.from({ length: 22 }, () => Math.random() * Math.PI * 2);
    let speeds = Array.from({ length: 22 }, () => 0.018 + Math.random() * 0.024);
    let amplitudes = Array.from({ length: 22 }, () => 0.3 + Math.random() * 0.7);

    function drawWave() {
      wCtx.clearRect(0, 0, EW, EH);
      const barsN = 22;
      const bw = Math.floor(EW / barsN) - 1;
      for (let i = 0; i < barsN; i++) {
        phases[i] += speeds[i];
        const h = Math.max(1, Math.round(amplitudes[i] * Math.abs(Math.sin(phases[i])) * 12 + 2));
        const x = i * (bw + 1);
        const alpha = 0.22 + amplitudes[i] * Math.abs(Math.sin(phases[i])) * 0.5;
        wCtx.fillStyle = `rgba(140,90,255,${alpha.toFixed(2)})`;
        wCtx.fillRect(x, EH - h, bw, h);
      }
      requestAnimationFrame(drawWave);
    }
    drawWave();

    function glitchText(el, original, cb) {
      let t = 0;
      const iv = setInterval(() => {
        const chars = original.split('');
        const density = t < 4 ? 0.55 : 0.3 - (t - 4) * 0.06;
        for (let k = 0; k < chars.length; k++) {
          if (chars[k] !== ' ' && Math.random() < Math.max(0, density))
            chars[k] = GLITCH[Math.floor(Math.random() * GLITCH.length)];
        }
        el.textContent = chars.join('');
        t++;
        if (t > 9) { clearInterval(iv); el.textContent = original; if (cb) cb(); }
      }, 42);
    }

    function setStatus(text, withGlitch) {
      statusEl.style.opacity = '0';
      setTimeout(() => {
        statusEl.textContent = text;
        statusEl.style.opacity = '1';
        if (withGlitch) setTimeout(() => glitchText(statusEl, text), 180);
      }, 220);
    }

    function randomDiag() {
      const t = DIAGS[Math.floor(Math.random() * DIAGS.length)]
        .replace('{n}', (Math.random() * 99 + 1).toFixed(1))
        .replace('{x}', Math.random().toString(36).slice(2, 6));
      diagEl.textContent = t;
    }

    function nextStatus() {
      statusIdx = (statusIdx + 1) % STATUSES.length;
      const s = STATUSES[statusIdx];
      const doGlitch = s === 'SIGNAL UNSTABLE' || s === 'ECHO DETECTED' || Math.random() > .6;
      setStatus(s, doGlitch);
      randomDiag();
      setTimeout(nextStatus, 3500 + Math.random() * 3500);
    }

    setInterval(() => {
      if (Math.random() > .72) glitchText(statusEl, statusEl.textContent);
    }, 4200);

    randomDiag();
    setTimeout(nextStatus, 4000);
  })();

})();
