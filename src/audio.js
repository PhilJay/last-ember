let ctx = null;
let master = null;
let musicTimer = null;
let scale = [0, 3, 5, 7, 10];
let base = 220;
let volume = 0.5;
let muted = false;

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : volume;
  master.connect(ctx.destination);
}

function tone(freq, dur, type = 'sine', vol = 0.15, slideTo = null, delay = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  jump: () => tone(300, 0.15, 'square', 0.05, 560),
  djump: () => tone(420, 0.18, 'square', 0.05, 800),
  ember: () => tone(880, 0.08, 'sine', 0.08, 1320),
  shard: () => { tone(660, 0.3, 'triangle', 0.15); tone(990, 0.4, 'triangle', 0.12, null, 0.08); tone(1320, 0.5, 'triangle', 0.1, null, 0.16); },
  hit: () => tone(180, 0.35, 'sawtooth', 0.15, 50),
  flare: () => { tone(200, 0.5, 'sawtooth', 0.1, 900); tone(100, 0.5, 'sine', 0.2, 400); },
  burn: () => tone(500, 0.25, 'square', 0.06, 90),
  land: () => tone(120, 0.08, 'sine', 0.1, 70),
  crumble: () => tone(90, 0.3, 'sawtooth', 0.05, 40),
  portal: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.6, 'triangle', 0.14, null, i * 0.12)),
  bossHit: () => { tone(80, 0.6, 'sawtooth', 0.2, 30); tone(240, 0.3, 'square', 0.08, 60); },
  wave: () => tone(70, 0.8, 'sine', 0.2, 140),
  pad: () => { tone(200, 0.3, 'sine', 0.15, 700); tone(400, 0.3, 'triangle', 0.08, 1400); },
  dash: () => tone(900, 0.18, 'sawtooth', 0.05, 200),
  power: () => [440, 554, 659, 880].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, null, i * 0.07)),
  lantern: () => { tone(330, 0.6, 'sine', 0.12); tone(495, 0.8, 'sine', 0.1, null, 0.15); },
  scroll: () => [392, 494, 587, 784, 988].forEach((f, i) => tone(f, 0.5, 'sine', 0.1, null, i * 0.1)),
  shield: () => tone(300, 0.4, 'triangle', 0.15, 80),
  geyser: () => tone(90, 0.6, 'sawtooth', 0.12, 200),
  shot: () => tone(600, 0.15, 'square', 0.04, 250),
  grapple: () => { tone(300, 0.25, 'sawtooth', 0.06, 1200); tone(1200, 0.1, 'square', 0.04, 600, 0.2); },
  thunder: () => { tone(70, 1.6, 'sawtooth', 0.12, 25, 0.35); tone(45, 2, 'sine', 0.2, 20, 0.35); },
  golden: () => [523, 659, 784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.6, 'triangle', 0.12, null, i * 0.09)),
};

export function startMusic(rootHz, minor = true) {
  stopMusic();
  base = rootHz;
  scale = minor ? [0, 3, 5, 7, 10, 12, 15] : [0, 2, 4, 7, 9, 12, 14];
  let step = 0;
  const play = () => {
    if (!ctx) return;
    const deg = scale[Math.floor(Math.random() * scale.length)];
    const f = base * Math.pow(2, deg / 12);
    tone(f, 1.6, 'sine', 0.05);
    if (step % 4 === 0) tone(base / 2, 2.4, 'triangle', 0.06);
    step++;
  };
  play();
  musicTimer = setInterval(play, 520);
}

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}

export function setVolume(v) {
  volume = v;
  if (master && !muted) master.gain.value = v;
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : volume;
  return muted;
}
