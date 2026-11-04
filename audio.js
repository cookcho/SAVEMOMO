/* SAVE MOMO — 배경음악·효과음 (Web Audio로 코드에서 직접 만듦, 음원 파일 없음)
   - 음악: 챕터마다 조성·빠르기·악기가 다른 곡을 시드로 만들어 반복. 선 긋는 동안은 잔잔하게, 버티는 동안은 드럼을 더함
   - 효과음: 짧은 소리를 그때그때 합성
   - 첫 터치 전에는 소리를 낼 수 없음(브라우저 정책) → 첫 터치에 켬 */
const AU = (() => {
  const st = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_){ return d; } };
  const sv = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_){} };
  let ctx = null, comp, musicBus, sfxBus, noiseBuf, amb = null;
  let musicOn = st('momo_music', true), sfxOn = st('momo_sfx', true);
  const MUSIC_VOL = 0.55, SFX_VOL = 0.85;

  function init(){
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? MUSIC_VOL : 0; musicBus.connect(comp);
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? SFX_VOL : 0; sfxBus.connect(comp);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    setInterval(tickScheduler, 25);
    return true;
  }
  const unlock = () => { if (init() && ctx.state !== 'running') ctx.resume(); if (pendingSong) { const s = pendingSong; pendingSong = null; play(s.theme, s.state); } };
  ['pointerdown', 'keydown', 'touchstart'].forEach(e => addEventListener(e, unlock, { capture: true, passive: true }));
  // 화면을 벗어나면 소리를 멈춤
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const now = () => ctx.currentTime;
  // 소리 하나: 오실레이터 → (필터) → 엔벨로프 → 출력
  function tone({ type = 'sine', f, f2, t = now(), a = 0.005, d = 0.3, v = 0.3, dest = sfxBus, lp, lpEnd, bp, q = 1, detune = 0, vib = 0 }){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + d);
    if (vib){ const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.5; lg.gain.value = f * vib; l.connect(lg); lg.connect(o.frequency); l.start(t + 0.12); l.stop(t + a + d + 0.05); }
    let node = o;
    if (lp || bp){ const fl = ctx.createBiquadFilter(); fl.type = lp ? 'lowpass' : 'bandpass'; fl.frequency.setValueAtTime(lp || bp, t); fl.Q.value = q; if (lpEnd) fl.frequency.exponentialRampToValueAtTime(lpEnd, t + d); o.connect(fl); node = fl; }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    node.connect(g); g.connect(dest); o.start(t); o.stop(t + a + d + 0.05);
  }
  function noise({ t = now(), d = 0.2, v = 0.3, type = 'bandpass', f = 2000, f2, q = 1, a = 0.003, dest = sfxBus }){
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true; fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    s.connect(fl); fl.connect(g); g.connect(dest); s.start(t, Math.random()); s.stop(t + a + d + 0.05);
  }

  // ---------- 악기 ----------
  const INST = {
    marimba: (t, m, v, dur) => { const f = mtof(m); tone({ f, t, d: 0.45, v: 0.32 * v, dest: musicBus }); tone({ f: f * 4, t, d: 0.06, v: 0.08 * v, dest: musicBus }); },
    bell: (t, m, v) => { const f = mtof(m); tone({ f, t, d: 1.1, v: 0.18 * v, dest: musicBus }); tone({ f: f * 2.76, t, d: 0.35, v: 0.06 * v, dest: musicBus }); tone({ f: f * 5.4, t, d: 0.12, v: 0.03 * v, dest: musicBus }); },
    pluck: (t, m, v) => tone({ type: 'sawtooth', f: mtof(m), t, d: 0.35, v: 0.14 * v, lp: 3200, lpEnd: 500, dest: musicBus }),
    flute: (t, m, v, dur) => { tone({ type: 'sine', f: mtof(m), t, a: 0.04, d: Math.max(0.15, dur * 0.95), v: 0.2 * v, vib: 0.006, dest: musicBus }); tone({ type: 'triangle', f: mtof(m + 12), t, a: 0.04, d: Math.max(0.1, dur * 0.6), v: 0.025 * v, dest: musicBus }); },
    epiano: (t, m, v) => { const f = mtof(m); tone({ f, t, d: 1.0, v: 0.2 * v, dest: musicBus }); tone({ f: f * 2, t, d: 0.4, v: 0.05 * v, dest: musicBus }); tone({ type: 'triangle', f: f * 7, t, d: 0.05, v: 0.02 * v, dest: musicBus }); },
    steel: (t, m, v) => { const f = mtof(m); tone({ f, t, d: 0.6, v: 0.2 * v, dest: musicBus }); tone({ f: f * 2.0, t, d: 0.25, v: 0.07 * v, dest: musicBus }); tone({ f: f * 3.0, t, d: 0.1, v: 0.04 * v, dest: musicBus }); },
    uke: (t, m, v) => { tone({ type: 'triangle', f: mtof(m), t, d: 0.5, v: 0.16 * v, dest: musicBus }); tone({ type: 'sawtooth', f: mtof(m), t, d: 0.12, v: 0.05 * v, lp: 2500, lpEnd: 600, dest: musicBus }); },
    bloop: (t, m, v) => tone({ f: mtof(m) * 0.6, f2: mtof(m), t, d: 0.18, v: 0.24 * v, dest: musicBus }),
    pad: (t, m, v, dur) => { for (const dt of [-7, 7]) tone({ type: 'sawtooth', f: mtof(m), t, a: 0.35, d: dur, v: 0.03 * v, lp: 900, detune: dt, dest: musicBus }); },
    bass: (t, m, v, dur) => { tone({ type: 'triangle', f: mtof(m), t, d: Math.min(0.45, dur), v: 0.3 * v, lp: 700, dest: musicBus }); tone({ f: mtof(m - 12), t, d: Math.min(0.3, dur), v: 0.15 * v, dest: musicBus }); },
    kick: (t, v) => tone({ f: 140, f2: 42, t, d: 0.16, v: 0.5 * v, dest: musicBus }),
    snare: (t, v) => { noise({ t, d: 0.12, v: 0.16 * v, f: 1900, q: 0.8, dest: musicBus }); tone({ type: 'triangle', f: 190, f2: 140, t, d: 0.06, v: 0.1 * v, dest: musicBus }); },
    hat: (t, v) => noise({ t, d: 0.035, v: 0.06 * v, type: 'highpass', f: 7500, dest: musicBus }),
    shaker: (t, v) => noise({ t, a: 0.012, d: 0.05, v: 0.05 * v, f: 6000, q: 2, dest: musicBus }),
    block: (t, v) => tone({ f: 1100, t, d: 0.05, v: 0.12 * v, dest: musicBus }),
  };

  // ---------- 곡 정의 ----------
  // scale: 장/단조 음계(반음), prog: 마디별 화음(음계 도수 0=I), lead/comp/bass 악기, comp: arp|stab|pad|strum, drums: 상태별 16칸 패턴
  const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10];
  const THEMES = {
    title:  { root: 60, scale: MAJ, bpm: 118, prog: [0, 5, 3, 4, 0, 5, 1, 4], lead: 'marimba', lead2: 'bell', comp: 'arp', compI: 'pluck', bass: 'bass', bassP: 'pulse', seed: 11 },
    living: { root: 60, scale: MAJ, bpm: 96,  prog: [0, 3, 0, 4, 5, 3, 1, 4], lead: 'marimba', comp: 'arp', compI: 'bell', bass: 'bass', bassP: 'root', seed: 21 },
    yard:   { root: 67, scale: MAJ, bpm: 112, prog: [0, 4, 5, 3, 0, 4, 3, 4], lead: 'flute', comp: 'stab', compI: 'pluck', bass: 'bass', bassP: 'walk', seed: 33 },
    roof:   { root: 57, scale: MIN, bpm: 88,  prog: [0, 5, 2, 6, 0, 5, 3, 4], lead: 'bell', comp: 'pad', compI: 'pad', bass: 'bass', bassP: 'root', seed: 47 },
    park:   { root: 62, scale: MAJ, bpm: 104, prog: [0, 3, 4, 0, 5, 3, 4, 4], lead: 'flute', comp: 'arp', compI: 'marimba', bass: 'bass', bassP: 'walk', seed: 59 },
    beach:  { root: 65, scale: MAJ, bpm: 100, prog: [0, 0, 3, 4, 0, 5, 3, 4], lead: 'steel', comp: 'strum', compI: 'uke', bass: 'bass', bassP: 'island', seed: 61 },
    alley:  { root: 62, scale: MIN, bpm: 80,  prog: [0, 5, 3, 4, 0, 5, 6, 4], lead: 'epiano', comp: 'pad', compI: 'pad', bass: 'bass', bassP: 'root', seed: 73, rain: true },
    bath:   { root: 63, scale: MAJ, bpm: 108, prog: [0, 3, 1, 4, 0, 3, 4, 0], lead: 'bloop', lead2: 'bell', comp: 'arp', compI: 'marimba', bass: 'bass', bassP: 'pulse', seed: 89 },
  };
  const DRUMS = {
    draw:  { shaker: '..x...x...x...x.' },
    sim:   { kick: 'x.......x.x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
    title: { kick: 'x.......x.......', snare: '....x.......x...', shaker: '..x...x...x...x.' },
  };
  const RHY = [[0, 4, 8, 12], [0, 3, 6, 8, 12], [0, 2, 4, 8, 10, 12], [0, 6, 8, 14], [0, 8], [0, 2, 4, 6, 8, 12], [0, 4, 6, 8]];
  function rng(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const deg2m = (th, d, oct = 0) => { const n = th.scale.length, o = Math.floor(d / n), i = ((d % n) + n) % n; return th.root + th.scale[i] + 12 * (o + oct); };
  // 8마디 선율: A A' B A'' 구조. 박 머리는 화음 구성음, 나머지는 이웃음으로 이어감
  function compose(th){
    const R = rng(th.seed), bars = [];
    let d = 4;
    const motif = [];
    for (let b = 0; b < 2; b++){
      const r = RHY[Math.floor(R() * RHY.length)], notes = [];
      for (const s of r){
        const ch = th.prog[b], strong = s % 8 === 0;
        if (strong){ const opts = [ch, ch + 2, ch + 4, ch + 7]; d = opts.reduce((best, x) => Math.abs(x - d) < Math.abs(best - d) ? x : best, opts[0]); if (R() < 0.3) d = opts[Math.floor(R() * 3)] + (R() < 0.5 ? 0 : 7); }
        else d += [-2, -1, -1, 1, 1, 2][Math.floor(R() * 6)];
        d = Math.max(0, Math.min(11, d)); notes.push([s, d]);
      }
      motif.push(notes);
    }
    for (let b = 0; b < 8; b++){
      const src = motif[b % 2].map(([s, x]) => [s, x]), ch = th.prog[b];
      if (b >= 4 && b < 6){ for (const n of src) n[1] = Math.max(0, Math.min(11, n[1] + 2)); } // B: 3도 위
      if (b === 7){ src.length = Math.min(src.length, 2); src[src.length - 1][1] = ch; } // 마지막 마디는 쉬어 가며 정리
      // 첫 박은 이번 마디 화음에 맞춤
      const opts = [ch, ch + 2, ch + 4, ch + 7]; src[0][1] = opts.reduce((best, x) => Math.abs(x - src[0][1]) < Math.abs(best - src[0][1]) ? x : best, opts[0]);
      bars.push(src);
    }
    return bars;
  }

  // ---------- 순차 재생기(앞당겨 예약) ----------
  let song = null, pendingSong = null, nextT = 0, step = 0, state = 'draw';
  function play(theme, st2 = 'draw'){
    if (!ctx){ pendingSong = { theme, state: st2 }; return; }
    state = st2;
    if (song && song.name === theme) return;
    const th = THEMES[theme] || THEMES.living;
    song = { name: theme, th, mel: compose(th) }; step = 0; nextT = now() + 0.08;
    setAmbience(th.rain ? 'rain' : null);
  }
  function setState(s){ state = s; }
  function stop(){ song = null; }
  function tickScheduler(){
    if (!ctx || !song || ctx.state !== 'running') return;
    const th = song.th, sd = 60 / th.bpm / 4;
    while (nextT < now() + 0.12){
      if (musicOn) scheduleStep(th, step, nextT, sd);
      nextT += sd * (step % 2 ? 0.92 : 1.08); // 살짝 흔들리는 박(스윙)
      step++;
    }
  }
  function scheduleStep(th, k, t, sd){
    const s = k % 16, bar = Math.floor(k / 16) % 8, ch = th.prog[bar], loopN = Math.floor(k / 128);
    const calm = state === 'draw', energy = state === 'sim' ? 1 : 0.8;
    // 선율 (선 긋는 동안은 두 번에 한 번만 → 덜 방해되게)
    if (!(calm && loopN % 2 === 1 && th !== THEMES.title)){
      const mel = song.mel[bar], i = mel.findIndex(n => n[0] === s);
      if (i >= 0){ const nx = mel[i + 1] ? mel[i + 1][0] : 16, dur = (nx - s) * sd; INST[th.lead](t, deg2m(th, mel[i][1], th.root >= 64 ? 0 : 1), (s % 4 === 0 ? 1 : 0.8) * energy, dur);
        if (th.lead2 && s === 0 && !calm) INST[th.lead2](t, deg2m(th, mel[i][1], th.root >= 64 ? 1 : 2), 0.5); }
    }
    // 반주
    const tones = [ch, ch + 2, ch + 4].map(x => deg2m(th, x, 0));
    if (th.comp === 'arp' && s % 2 === 0){ const ar = [0, 1, 2, 1]; INST[th.compI](t, tones[ar[(s / 2) % 4]] + (s >= 8 ? 12 : 0), 0.45, sd * 2); }
    if (th.comp === 'stab' && (s === 4 || s === 12)) tones.forEach(m => INST[th.compI](t, m + 12, 0.4, sd * 2));
    if (th.comp === 'strum' && [0, 3, 6, 10, 12].includes(s)) tones.forEach((m, j) => INST[th.compI](t + j * 0.012, m + 12, s === 0 ? 0.6 : 0.4, sd * 2));
    if (th.comp === 'pad' && s === 0) tones.forEach(m => INST.pad(t, m + 12, 1, sd * 16));
    // 베이스
    const r = deg2m(th, ch, -1), fifth = deg2m(th, ch + 4, -1);
    if (th.bassP === 'root' && (s === 0 || s === 10)) INST.bass(t, r, 1, sd * 6);
    if (th.bassP === 'pulse' && s % 4 === 0) INST.bass(t, s === 8 ? fifth : r, 0.9, sd * 3);
    if (th.bassP === 'walk' && s % 4 === 0) INST.bass(t, [r, deg2m(th, ch + 2, -1), fifth, deg2m(th, ch + 5, -1)][s / 4], 0.9, sd * 3);
    if (th.bassP === 'island' && [0, 6, 8, 14].includes(s)) INST.bass(t, s >= 8 ? fifth : r, 0.9, sd * 2);
    // 드럼
    const pat = th === THEMES.title ? DRUMS.title : DRUMS[state] || DRUMS.draw;
    for (const [inst, p] of Object.entries(pat)) if (p[s] === 'x') INST[inst](t, inst === 'hat' && s % 4 ? 0.6 : 1);
    if (state === 'sim' && th.bpm < 92 && s === 14) INST.block(t, 0.6);
  }

  // ---------- 주변 소리: 빗소리, 드론 웅웅 ----------
  let ambNodes = {};
  function loopNoise(type, f, q, v){
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true; fl.type = type; fl.frequency.value = f; fl.Q.value = q; g.gain.value = 0;
    s.connect(fl); fl.connect(g); g.connect(sfxBus); s.start(); g.gain.setTargetAtTime(v, now(), 0.4);
    return { s, g };
  }
  function setAmbience(kind){
    if (!ctx) return;
    if (kind === 'rain' && !ambNodes.rain) ambNodes.rain = loopNoise('bandpass', 1600, 0.7, 0.016);
    if (kind !== 'rain' && ambNodes.rain){ const r = ambNodes.rain; r.g.gain.setTargetAtTime(0, now(), 0.3); setTimeout(() => { try { r.s.stop(); } catch (_){} }, 1500); ambNodes.rain = null; }
  }
  let buzz = null;
  function ensureBuzz(){
    if (buzz) return buzz;
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), l = ctx.createOscillator(), lg = ctx.createGain(), trem = ctx.createGain(), fl = ctx.createBiquadFilter(), g = ctx.createGain(), g2 = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = 118; o2.type = 'sawtooth'; o2.frequency.value = 66;
    // 프로펠러 떨림: trem 이득을 0.65±0.35로 흔들고, 실제 크기는 g·g2가 정함
    trem.gain.value = 0.65; l.frequency.value = 26; lg.gain.value = 0.35; l.connect(lg); lg.connect(trem.gain);
    fl.type = 'lowpass'; fl.frequency.value = 700; g.gain.value = 0; g2.gain.value = 0;
    o.connect(g); o2.connect(g2); g.connect(trem); g2.connect(trem); trem.connect(fl); fl.connect(sfxBus); o.start(); o2.start(); l.start();
    buzz = { g, g2, o };
    return buzz;
  }
  // 게임이 매 프레임 알려 줌: 드론 수(모모 근처 가중), 헤비 드론 수, 비구름 여부
  let lastUpd = 0;
  function update({ drones = 0, tanks = 0, rain = false, active = false }){
    if (!ctx || ctx.state !== 'running') return;
    const t = now(); if (t - lastUpd < 0.1) return; lastUpd = t;
    const b = ensureBuzz();
    b.g.gain.setTargetAtTime(active ? Math.min(0.05, Math.sqrt(drones) * 0.012) : 0, t, 0.15);
    b.g2.gain.setTargetAtTime(active ? Math.min(0.06, Math.sqrt(tanks) * 0.03) : 0, t, 0.15);
    b.o.frequency.setTargetAtTime(110 + Math.min(40, drones * 2), t, 0.3);
    if (song && !song.th.rain) setAmbience(active && rain ? 'rain' : null);
  }

  // ---------- 효과음 ----------
  const lastT = {};
  const gap = (k, s) => { const t = performance.now(); if (lastT[k] && t - lastT[k] < s * 1000) return false; lastT[k] = t; return true; };
  const R = (a, b) => a + Math.random() * (b - a);
  const SFX = {
    click: () => { tone({ f: 880, f2: 1320, d: 0.07, v: 0.16 }); },
    back: () => { tone({ f: 660, f2: 440, d: 0.08, v: 0.14 }); },
    drawStart: () => { tone({ f: 520, f2: 780, d: 0.08, v: 0.12 }); },
    pin: () => { tone({ type: 'square', f: 1400, d: 0.03, v: 0.06, lp: 3000 }); tone({ f: 2100, t: now() + 0.03, d: 0.1, v: 0.1 }); },
    inkOut: () => { tone({ f: 600, f2: 300, d: 0.18, v: 0.16 }); },
    blocked: () => { if (gap('blocked', 0.4)) tone({ type: 'square', f: 180, d: 0.08, v: 0.06, lp: 900 }); },
    drop: () => { tone({ f: 220, f2: 70, d: 0.22, v: 0.4 }); noise({ d: 0.15, v: 0.1, type: 'lowpass', f: 800 }); },
    hit: (o = {}) => { if (!gap('hit', 0.09)) return; const big = o.big; tone({ type: 'triangle', f: big ? 160 : R(260, 340), f2: big ? 70 : 140, d: big ? 0.22 : 0.1, v: big ? 0.34 : 0.18 }); noise({ d: 0.05, v: big ? 0.12 : 0.06, f: big ? 900 : 1800, q: 1.2 }); if (big) tone({ f: 900, f2: 1400, t: now() + 0.02, d: 0.12, v: 0.08 }); },
    pop: () => { if (!gap('pop', 0.04)) return; noise({ d: 0.06, v: 0.35, f: 2500, q: 0.7 }); tone({ f: 700, f2: 220, d: 0.08, v: 0.2 }); noise({ t: now() + 0.05, d: 0.35, v: 0.12, type: 'lowpass', f: 2400, f2: 400 }); },
    splat: () => { if (gap('splat', 0.12)) noise({ d: 0.12, v: 0.08, type: 'lowpass', f: 1800, f2: 500 }); },
    quack: () => { if (!gap('quack', 0.5)) return; const t = now(); [0, 0.16].forEach(dt => tone({ type: 'sawtooth', f: 520, f2: 380, t: t + dt, d: 0.12, v: 0.2, bp: 1200, q: 3 })); },
    squirt: () => { if (gap('squirt', 0.25)) noise({ d: 0.35, v: 0.12, type: 'bandpass', f: 3500, f2: 1500, q: 1.5 }); },
    woof: (o = {}) => { if (!gap('woof', 0.35)) return; const big = o.big, t = now(); tone({ type: 'sawtooth', f: big ? 150 : 300, f2: big ? 95 : 190, t, d: big ? 0.2 : 0.12, v: 0.3, bp: big ? 500 : 900, q: 2 }); noise({ t, d: 0.08, v: 0.08, f: big ? 600 : 1100, q: 2 }); },
    meow: () => { if (!gap('meow', 0.7)) return; const t = now(), o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(620, t); o.frequency.linearRampToValueAtTime(820, t + 0.12); o.frequency.linearRampToValueAtTime(540, t + 0.38);
      fl.type = 'bandpass'; fl.Q.value = 4; fl.frequency.setValueAtTime(900, t); fl.frequency.linearRampToValueAtTime(1800, t + 0.14); fl.frequency.linearRampToValueAtTime(1100, t + 0.38);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.28, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      o.connect(fl); fl.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.45); },
    tick: (o = {}) => { tone({ f: o.last ? 1320 : 990, d: 0.06, v: o.last ? 0.24 : 0.16 }); tone({ type: 'square', f: 2000, d: 0.015, v: 0.03, lp: 4000 }); },
    win: () => { const t = now(), seq = [72, 76, 79, 84]; seq.forEach((m, i) => { tone({ type: 'triangle', f: mtof(m), t: t + i * 0.09, d: 0.25, v: 0.22 }); tone({ f: mtof(m + 12), t: t + i * 0.09, d: 0.3, v: 0.08 }); });
      [76, 79, 84].forEach(m => tone({ type: 'triangle', f: mtof(m), t: t + 0.4, d: 0.7, v: 0.14 })); noise({ t, d: 0.2, v: 0.12, f: 5000, q: 0.6 }); },
    popper: () => { noise({ d: 0.08, v: 0.25, f: 3000, q: 0.6 }); noise({ t: now() + 0.05, d: 0.5, v: 0.05, type: 'highpass', f: 6000 }); },
    fail: () => { const t = now(); [0, 0.22, 0.44].forEach((dt, i) => tone({ type: 'sawtooth', f: mtof(67 - i * 2), f2: mtof(66 - i * 2), t: t + dt, d: i === 2 ? 0.6 : 0.2, v: 0.12, lp: 1400, vib: i === 2 ? 0.02 : 0 })); },
    star: (o = {}) => { const m = 79 + (o.i || 0) * 4; tone({ f: mtof(m), d: 0.35, v: 0.2 }); tone({ f: mtof(m + 12), d: 0.2, v: 0.08 }); tone({ f: mtof(m + 19), t: now() + 0.05, d: 0.15, v: 0.05 }); },
    coin: () => { const t = now(); tone({ type: 'square', f: 988, t, d: 0.07, v: 0.08, lp: 4000 }); tone({ type: 'square', f: 1319, t: t + 0.07, d: 0.25, v: 0.08, lp: 4000 }); },
    equip: () => { tone({ f: 660, f2: 990, d: 0.12, v: 0.16 }); tone({ f: 1320, t: now() + 0.08, d: 0.15, v: 0.08 }); },
    nope: () => { tone({ type: 'square', f: 220, d: 0.09, v: 0.07, lp: 1200 }); tone({ type: 'square', f: 180, t: now() + 0.1, d: 0.12, v: 0.07, lp: 1200 }); },
    lock: () => { tone({ type: 'triangle', f: 180, f2: 120, d: 0.15, v: 0.3 }); noise({ d: 0.06, v: 0.12, f: 1500, q: 2 }); },
    item: () => { tone({ f: 784, d: 0.1, v: 0.14 }); tone({ f: 1175, t: now() + 0.07, d: 0.18, v: 0.12 }); },
  };
  function sfx(name, o){ if (!sfxOn || !ctx || ctx.state !== 'running' || !SFX[name]) return; try { SFX[name](o); } catch (_){} }

  // 선 긋는 소리: 연필이 사각사각(손가락 속도에 따라 커짐)
  let scratch = null;
  function drawing(speed){
    if (!ctx || ctx.state !== 'running' || !sfxOn){ return; }
    if (!scratch){ const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; s.loop = true; fl.type = 'bandpass'; fl.frequency.value = 3200; fl.Q.value = 1.2; g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(sfxBus); s.start(); scratch = { s, g, fl }; }
    const t = now(), v = Math.min(0.09, speed * 0.012);
    scratch.g.gain.setTargetAtTime(v, t, 0.03); scratch.fl.frequency.setTargetAtTime(2600 + Math.min(2000, speed * 200), t, 0.05);
  }
  function drawingStop(){ if (scratch) scratch.g.gain.setTargetAtTime(0, now(), 0.05); }

  function setMusic(v){ musicOn = v; sv('momo_music', v); if (ctx) musicBus.gain.setTargetAtTime(v ? MUSIC_VOL : 0, now(), 0.1); }
  function setSfx(v){ sfxOn = v; sv('momo_sfx', v); if (ctx){ sfxBus.gain.setTargetAtTime(v ? SFX_VOL : 0, now(), 0.05); } }
  // 결과 창 같은 순간에 음악을 잠깐 낮춤
  function duck(sec = 1.2, to = 0.35){ if (!ctx || !musicOn) return; const t = now(); musicBus.gain.cancelScheduledValues(t); musicBus.gain.setTargetAtTime(MUSIC_VOL * to, t, 0.05); musicBus.gain.setTargetAtTime(MUSIC_VOL, t + sec, 0.4); }
  return { _dbg: () => ({ ctx, comp }), play, setState, stop, sfx, update, drawing, drawingStop, setMusic, setSfx, duck, get musicOn(){ return musicOn; }, get sfxOn(){ return sfxOn; } };
})();
