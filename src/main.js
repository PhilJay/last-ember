import * as THREE from 'three';
import { LEVELS, PROLOGUE, BOSS_DEAD, CHOICE, ENDINGS, DIARY_TIERS } from './levels.js';
import { setVolume, initAudio, sfx, startMusic, stopMusic, toggleMute } from './audio.js';
import {
  clamp, lerp, generate, makePlatformMesh, makeShard, makeEmber, makeWisp, makeBoss,
  makePortal, makeHearth, makeKeeper, makeDecor, makeStars, makePad, makeLantern, makePowerup,
  makeSpinner, makeGeyser, makeScroll, makeProjectile, makeAnchor, makeTide, makeGhost, makeWings, POWER, GLOW,
} from './world.js';

const $ = (id) => document.getElementById(id);

// ---------- renderer ----------
const CFG = { sens: 1, invertY: false, volume: 0.5, quality: 'auto' };
try { Object.assign(CFG, JSON.parse(localStorage.getItem('lastEmber.settings') || '{}')); } catch { /* ignore bad settings */ }
const saveCfg = () => localStorage.setItem('lastEmber.settings', JSON.stringify(CFG));
const maxRatio = Math.min(devicePixelRatio, 2);
let autoRatio = maxRatio;
const wantedRatio = () => (CFG.quality === 'low' ? 1 : CFG.quality === 'high' ? maxRatio : autoRatio);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(wantedRatio());
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 700);
const hemi = new THREE.HemisphereLight(0xbcd4ff, 0x302040, 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d8, 1.5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 140 });
sun.shadow.bias = -0.0004;
scene.add(sun, sun.target);

function applyQuality() {
  renderer.setPixelRatio(wantedRatio());
  renderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

// ---------- particles ----------
const MAXP = 1600;
const pPos = new Float32Array(MAXP * 3).fill(-9999);
const pCol = new Float32Array(MAXP * 3);
const pBase = new Float32Array(MAXP * 3);
const pVel = new Float32Array(MAXP * 3);
const pLife = new Float32Array(MAXP);
const pMax = new Float32Array(MAXP).fill(1);
const pGrav = new Float32Array(MAXP);
let pHead = 0;
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage));
const points = new THREE.Points(pGeo, new THREE.PointsMaterial({
  size: 0.45, map: GLOW, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
}));
points.frustumCulled = false;
scene.add(points);
const tmpC = new THREE.Color();

function emit(x, y, z, color, n, speed, life, grav = 0) {
  tmpC.set(color);
  for (let k = 0; k < n; k++) {
    const i = pHead; pHead = (pHead + 1) % MAXP;
    const a = Math.random() * Math.PI * 2, b = Math.random() * 2 - 1, r = Math.sqrt(1 - b * b);
    const sp = speed * (0.3 + Math.random() * 0.7);
    pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z;
    pVel[i * 3] = Math.cos(a) * r * sp; pVel[i * 3 + 1] = b * sp; pVel[i * 3 + 2] = Math.sin(a) * r * sp;
    pBase[i * 3] = tmpC.r; pBase[i * 3 + 1] = tmpC.g; pBase[i * 3 + 2] = tmpC.b;
    pLife[i] = pMax[i] = life * (0.6 + Math.random() * 0.4);
    pGrav[i] = grav;
  }
}

function updateParticles(dt) {
  for (let i = 0; i < MAXP; i++) {
    if (pLife[i] <= 0) continue;
    pLife[i] -= dt;
    if (pLife[i] <= 0) { pPos[i * 3 + 1] = -9999; pCol[i * 3] = pCol[i * 3 + 1] = pCol[i * 3 + 2] = 0; continue; }
    pVel[i * 3 + 1] -= pGrav[i] * dt;
    pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
    const f = pLife[i] / pMax[i];
    pCol[i * 3] = pBase[i * 3] * f; pCol[i * 3 + 1] = pBase[i * 3 + 1] * f; pCol[i * 3 + 2] = pBase[i * 3 + 2] * f;
  }
  pGeo.attributes.position.needsUpdate = true;
  pGeo.attributes.color.needsUpdate = true;
}

// ---------- weather ----------
const WN = 420;
const wPos = new Float32Array(WN * 3);
const wGeo = new THREE.BufferGeometry();
wGeo.setAttribute('position', new THREE.BufferAttribute(wPos, 3));
const weather = new THREE.Points(wGeo, new THREE.PointsMaterial({
  size: 0.4, map: GLOW, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.85,
}));
weather.frustumCulled = false;
scene.add(weather);
const WEATHER = {
  forest: { color: 0xd8ff7a, size: 0.55, vy: 0.3, sway: 1.4 },
  ice: { color: 0xffffff, size: 0.34, vy: -2.4, sway: 0.7 },
  lava: { color: 0xff9a40, size: 0.45, vy: 1.8, sway: 0.9 },
  library: { color: 0xaee0ff, size: 0.17, vy: -16, sway: 0.2 },
  night: { color: 0xb8a8ff, size: 0.5, vy: 0.4, sway: 1.1 },
  glass: { color: 0xffc8f0, size: 0.42, vy: -0.7, sway: 1.3 },
  brass: { color: 0xffd89a, size: 0.36, vy: 1.6, sway: 0.6 },
  star: { color: 0xfff0b0, size: 0.5, vy: -0.2, sway: 0.7 },
  flood: { color: 0x8fb8ff, size: 0.17, vy: -18, sway: 0.1 },
  boss: { color: 0xd9a8ff, size: 0.5, vy: 0.3, sway: 1.1 },
};
let wCfg = WEATHER.forest;
function initWeather(theme) {
  wCfg = WEATHER[theme];
  weather.material.color.set(wCfg.color);
  weather.material.size = wCfg.size;
  for (let i = 0; i < WN; i++) {
    wPos[i * 3] = camera.position.x + (Math.random() - 0.5) * 60;
    wPos[i * 3 + 1] = camera.position.y + (Math.random() - 0.5) * 36;
    wPos[i * 3 + 2] = camera.position.z + (Math.random() - 0.5) * 60;
  }
}
function gust() { return S.wind.strength ? Math.pow(Math.max(0, Math.sin(S.clock * 0.45)), 2) : 0; }
function updateWeather(dt) {
  const g = gust(), wx = S.wind.x * g * 0.25, wz = S.wind.z * g * 0.25;
  const c = camera.position;
  for (let i = 0; i < WN; i++) {
    const k = i * 3;
    wPos[k] += (Math.sin(S.clock * 0.7 + i) * wCfg.sway + wx) * dt;
    wPos[k + 1] += wCfg.vy * dt;
    wPos[k + 2] += (Math.cos(S.clock * 0.6 + i * 1.3) * wCfg.sway + wz) * dt;
    if (wPos[k] - c.x > 30) wPos[k] -= 60; else if (wPos[k] - c.x < -30) wPos[k] += 60;
    if (wPos[k + 2] - c.z > 30) wPos[k + 2] -= 60; else if (wPos[k + 2] - c.z < -30) wPos[k + 2] += 60;
    if (wPos[k + 1] - c.y > 18) wPos[k + 1] -= 36; else if (wPos[k + 1] - c.y < -18) wPos[k + 1] += 36;
  }
  wGeo.attributes.position.needsUpdate = true;
}

// ---------- player ----------
const H = 0.9, RAD = 0.4;
const player = new THREE.Group();
const bodyMesh = new THREE.Mesh(
  new THREE.SphereGeometry(RAD, 24, 16),
  new THREE.MeshStandardMaterial({ color: 0xff8a3a, emissive: 0xff5a1a, emissiveIntensity: 1.3, roughness: 0.4 }),
);
bodyMesh.position.y = RAD;
bodyMesh.castShadow = true;
player.add(bodyMesh);
const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2a0d05 });
for (const sx of [-1, 1]) {
  const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), eyeMat);
  e.position.set(sx * 0.14, 0.5, -0.34);
  player.add(e);
}
const flame = new THREE.Group();
flame.position.y = 0.72;
const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9 });
for (let i = 0; i < 3; i++) {
  const c = new THREE.Mesh(new THREE.ConeGeometry(0.2 - i * 0.04, 0.55 + i * 0.12, 8), flameMat);
  c.position.set((i - 1) * 0.08, (0.55 + i * 0.12) / 2, 0);
  flame.add(c);
}
player.add(flame);
const plight = new THREE.PointLight(0xffa060, 2.4, 16);
plight.position.y = 0.7;
player.add(plight);
const shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 14), new THREE.MeshBasicMaterial({ color: 0x4aa8ff, transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending }));
shieldMesh.position.y = 0.45;
shieldMesh.visible = false;
player.add(shieldMesh);
const wings = makeWings();
player.add(wings);
scene.add(player);
const rope = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
  new THREE.LineBasicMaterial({ color: 0xffe0a0 }),
);
rope.frustumCulled = false;
rope.visible = false;
scene.add(rope);
let trailColor = 0xffd27a;
const ROOTS = [196, 247, 175, 220, 185, 208, 147, 262, 156, 165];

const P = {
  pos: new THREE.Vector3(), vel: new THREE.Vector3(), grounded: false, ground: null,
  coyote: 0, jumps: 0, jumpBuf: 0, inv: 0, flareCD: 0, face: 0, lastSafe: new THREE.Vector3(),
  dashT: 0, dashCD: 0, dashes: 1, dashX: 0, dashZ: -1, glideT: 1.6, gliding: false, grap: null, grapCD: 0, foot: 0, footSide: 1, fx: { shield: 0, speed: 0, moon: 0, magnet: 0 },
};

// ---------- input ----------
const PAD = { mx: 0, my: 0, jump: false };
const TOUCH = { mx: 0, my: 0, jump: false };
const keys = {};
const cam = { yaw: 0, pitch: 0.45, dist: 9, target: new THREE.Vector3() };
let dragging = false;

addEventListener('keydown', (e) => {
  initAudio();
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  keys[e.code] = true;
  if (e.code === 'KeyM') { const m = toggleMute(); $('btnMute').textContent = m ? 'Unmute' : 'Mute'; return; }
  if (S.mode === 'card' && (e.code === 'Enter' || e.code === 'Space')) { $('cardBtn').click(); return; }
  if (e.code === 'KeyP' && (S.mode === 'play' || S.mode === 'paused')) { S.mode === 'play' ? pauseGame() : resumeGame(); return; }
  if (S.mode !== 'play') return;
  if (e.code === 'Space') P.jumpBuf = 0.14;
  if (e.code === 'KeyF' || e.code === 'KeyE') doFlare();
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyQ') doDash();
  if (e.code === 'KeyG') doGrapple();
  if (e.code === 'Escape') pauseGame();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; pauseGame(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });

const canvas = renderer.domElement;
canvas.addEventListener('mousedown', (e) => {
  initAudio();
  if (S.mode !== 'play') return;
  if (document.pointerLockElement === canvas) { if (e.button === 0 || e.button === 2) doFlare(); return; }
  dragging = true;
  if (canvas.requestPointerLock) canvas.requestPointerLock();
});
addEventListener('mouseup', () => { dragging = false; });
addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('mousemove', (e) => {
  if (S.mode !== 'play') return;
  if (document.pointerLockElement !== canvas && !dragging) return;
  lookBy(e.movementX * 0.0028, e.movementY * 0.0028);
});
function lookBy(dx, dy) {
  cam.yaw -= dx * CFG.sens;
  cam.pitch = clamp(cam.pitch + dy * CFG.sens * (CFG.invertY ? -1 : 1), -0.15, 1.3);
}
const zoomBy = (d) => { cam.dist = clamp(cam.dist + d, 5, 16); };
addEventListener('wheel', (e) => {
  if (S.mode !== 'play') { if (e.ctrlKey) e.preventDefault(); return; }
  e.preventDefault();
  const px = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
  zoomBy(clamp(px * (e.ctrlKey ? 0.05 : 0.01), -1.2, 1.2));
}, { passive: false });
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && S.mode === 'play') pauseGame();
});

// ---------- game state ----------
const S = {
  mode: 'title', level: 0, time: 0, clock: 0, hearts: 3, shardsGot: 0, shardsTotal: 0, embersGot: 0, embersTotal: 0,
  heartsLost: 0, bossDead: false, path: [], plats: [], shards: [], embers: [], enemies: [], boss: null, portal: null,
  pads: [], lanterns: [], powerups: [], spinners: [], geysers: [], scrolls: [], projectiles: [], cp: null,
  wind: { x: 0, z: 0, strength: 0 }, gustOn: false, secretFound: false, shake: 0,
  anchors: [], goldens: [], gates: [], tide: null, course: null, inCourse: false, maxIdx: 0, voiceDone: new Set(),
  goldenFlame: false, ghost: null, rec: [], recT: 0, trial: false, lightT: 6, flashK: 0, skyBase: new THREE.Color(), gateCD: 0,
  anim: [], rings: [], waves: [], deathY: -30, floor: null, stars: null, isHearth: false,
  keeper: null, portalMsgCD: 0,
};
window.__g = { S, P, cam, LEVELS, loadLevel: (i) => loadLevel(i) };

const world = new THREE.Group();
scene.add(world);

function clearWorld() {
  world.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material && !o.material.map) o.material.dispose();
  });
  world.clear();
}

function loadLevel(idx) {
  clearWorld();
  const L = LEVELS[idx];
  S.level = idx;
  Object.assign(S, {
    anim: [], rings: [], waves: [], enemies: [], shards: [], embers: [], pads: [], lanterns: [], powerups: [],
    spinners: [], geysers: [], scrolls: [], projectiles: [], boss: null, keeper: null, cp: null,
    bossDead: false, shardsGot: 0, embersGot: 0, heartsLost: 0, time: 0, clock: 0, hearts: 3, isHearth: !!L.boss,
    secretFound: false, shake: 0, gustOn: false,
    anchors: [], goldens: [], gates: [], tide: null, course: null, inCourse: false, maxIdx: 0, voiceDone: new Set(),
    goldenFlame: false, ghost: null, rec: [], recT: 0, lightT: 5 + Math.random() * 5, flashK: 0, gateCD: 0,
  });
  hemi.intensity = 0.9;

  S.skyBase.set(L.sky);
  trailColor = L.glow;
  scene.background = new THREE.Color(L.sky);
  scene.fog = new THREE.FogExp2(L.sky, L.theme === 'forest' ? 0.016 : 0.012);
  hemi.color.set(new THREE.Color(L.sky).lerp(new THREE.Color(0xffffff), 0.55));
  hemi.groundColor.set(L.fog);
  sun.color.set({ lava: 0xffc890, boss: 0xd8b8ff, brass: 0xffd89a, glass: 0xffe6ff, star: 0xfff4c8, flood: 0xa8c0ff, night: 0xc8c0ff }[L.theme] || 0xfff0d8);

  const { plats, secrets, R } = generate(L, idx);
  S.path = plats;
  plats.forEach((p, i) => { p.idx = i; });
  S.plats = plats.concat(secrets);
  for (const p of S.plats) { p.mesh = makePlatformMesh(p, L); world.add(p.mesh); }
  const count = L.count;

  const lowest = Math.min(...S.plats.map((p) => p.by - (p.amp && p.axis.y ? p.amp : 0)));
  S.deathY = lowest - 12;

  const lavaY = S.deathY + 1.5;
  const floorMat = new THREE.MeshBasicMaterial({ color: L.theme === 'lava' ? 0xff5a1a : L.fog });
  S.floor = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), floorMat);
  S.floor.rotation.x = -Math.PI / 2;
  S.floor.position.y = L.theme === 'lava' ? lavaY : S.deathY - 22;
  world.add(S.floor);

  S.stars = makeStars();
  world.add(S.stars);
  world.add(makeDecor(L, S.plats, R, S.anim));

  const shuffled = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const rnd = (w) => (R() - 0.5) * w;
  const solidish = (p) => p.type === 'solid' || p.type === 'ice';
  const used = new Set();
  const blocked = new Set();

  // shards
  S.shardsTotal = L.shards;
  for (let k = 0; k < L.shards; k++) {
    const i = clamp(Math.round(((k + 1) * count) / (L.shards + 1)), 1, count - 1);
    const pl = plats[i];
    const m = makeShard(L.glow);
    world.add(m);
    S.shards.push({ mesh: m, plat: pl, off: new THREE.Vector3(rnd(pl.w * 0.4), 1.5, rnd(pl.d * 0.4)), taken: false, phase: R() * 6, bob: 0.15 });
    used.add(i);
  }

  // checkpoint lanterns
  const cpIdx = [];
  for (const target of [Math.round(count / 3), Math.round((2 * count) / 3)]) {
    for (const j of [target, target + 1, target - 1, target + 2, target - 2]) {
      if (j >= 2 && j < count && solidish(plats[j]) && !cpIdx.includes(j)) { cpIdx.push(j); break; }
    }
  }
  for (const j of cpIdx) {
    const pl = plats[j];
    const m = makeLantern();
    world.add(m);
    S.lanterns.push({ mesh: m, plat: pl, off: new THREE.Vector3(-pl.w * 0.3, 0, 0), lit: false });
    used.add(j); blocked.add(j);
  }

  // embers
  const addEmber = (pl, off, color = 0xffa040) => {
    const m = makeEmber(color);
    world.add(m);
    S.embers.push({ mesh: m, plat: pl, off, taken: false, phase: R() * 6, bob: 0.15 });
  };
  for (let i = 1; i < plats.length - (L.boss ? 0 : 1); i++) {
    const pl = plats[i];
    for (let k = 0; k < 2; k++) addEmber(pl, new THREE.Vector3(rnd(pl.w * 0.6), 0.9, rnd(pl.d * 0.6)));
  }
  for (let i = 0; i < plats.length - 1; i++) {
    const a = plats[i], b = plats[i + 1];
    addEmber(null, new THREE.Vector3((a.bx + b.bx) / 2, Math.max(a.by, b.by) + 2.4, (a.bz + b.bz) / 2), 0xffd27a);
  }

  // enemies and spitters
  const cand = shuffled(plats.map((_, i) => i).filter((i) => i >= 2 && i < count && plats[i].type !== 'moving' && plats[i].type !== 'blink' && !cpIdx.includes(i)));
  const nEnemy = Math.min(L.enemies, cand.length);
  for (let e = 0; e < nEnemy; e++) {
    const chaser = e / Math.max(1, L.enemies) < L.chase;
    spawnEnemy(plats[cand[e]], chaser ? 'chase' : 'patrol', L.speed, R() * 6);
    used.add(cand[e]); blocked.add(cand[e]);
  }
  for (let e = 0; e < (L.spitters || 0) && nEnemy + e < cand.length; e++) {
    const pl = plats[cand[nEnemy + e]];
    const sp = spawnEnemy(pl, 'spitter', 0, R() * 6);
    sp.off = new THREE.Vector3(pl.w * 0.32 * (R() < 0.5 ? 1 : -1), 0, pl.d * 0.32 * (R() < 0.5 ? 1 : -1));
    sp.fireT = 1.5 + R() * 2;
    used.add(cand[nEnemy + e]); blocked.add(cand[nEnemy + e]);
  }

  // hazards
  const pool = (filter) => shuffled(plats.map((_, i) => i).filter((i) => i >= 2 && i < count && filter(plats[i], i)));
  const hazardUsed = new Set();
  const spinnerPlats = new Set();
  for (const i of pool((p, i) => solidish(p) && Math.min(p.w, p.d) >= 3.6 && !blocked.has(i)).slice(0, L.spinners || 0)) {
    const pl = plats[i];
    const m = makeSpinner();
    world.add(m);
    S.spinners.push({ mesh: m, plat: pl, off: new THREE.Vector3(0, 0, 0), angle: R() * 6, speed: (R() < 0.5 ? 1 : -1) * (1.3 + R() * 0.4) });
    hazardUsed.add(i); spinnerPlats.add(i);
  }
  for (const i of pool((p, i) => p.type === 'solid' && !hazardUsed.has(i) && !cpIdx.includes(i)).slice(0, L.geysers || 0)) {
    const pl = plats[i];
    const m = makeGeyser();
    world.add(m);
    S.geysers.push({ mesh: m, plat: pl, off: new THREE.Vector3(rnd(pl.w * 0.5), 0, rnd(pl.d * 0.5)), phase: R() * 4.2, erupting: false });
    hazardUsed.add(i);
  }
  for (const i of pool((p, i) => solidish(p) && !hazardUsed.has(i) && !cpIdx.includes(i)).slice(0, L.pads || 0)) {
    const pl = plats[i];
    const m = makePad();
    world.add(m);
    const off = new THREE.Vector3(rnd(pl.w * 0.4), 0, rnd(pl.d * 0.4));
    S.pads.push({ mesh: m, plat: pl, off, cd: 0 });
    addEmber(pl, new THREE.Vector3(off.x, 6, off.z), 0x7affb0);
    hazardUsed.add(i);
  }

  for (const sh of S.shards) {
    const i = plats.indexOf(sh.plat);
    if (spinnerPlats.has(i)) { sh.off.set(0, 2.6, 0); }
  }

  // power-ups
  const kinds = shuffled(['shield', 'speed', 'moon', 'magnet']);
  for (let k = 0; k < (L.powerups || 0); k++) {
    const i = 1 + Math.floor(R() * (count - 1));
    const pl = plats[i];
    const kind = kinds[k % kinds.length];
    const m = makePowerup(kind);
    world.add(m);
    S.powerups.push({ mesh: m, plat: pl, off: new THREE.Vector3(rnd(pl.w * 0.5), 1.3, rnd(pl.d * 0.5)), kind, taken: false, phase: R() * 6, bob: 0.2 });
  }

  // secret platform: diary page
  for (const sp of secrets) {
    const m = makeScroll();
    world.add(m);
    S.scrolls.push({ mesh: m, plat: sp, off: new THREE.Vector3(0, 1.3, 0), taken: false, phase: 0, bob: 0.12 });
    for (let k = 0; k < 3; k++) addEmber(sp, new THREE.Vector3(Math.cos(k * 2.1) * 1.1, 0.9, Math.sin(k * 2.1) * 1.1), 0xffe9a0);
  }
  S.embersTotal = S.embers.length;

  // grapple anchors
  const nA = L.anchors || 0;
  for (let k = 0; k < nA; k++) {
    const i = clamp(Math.round(((k + 0.5) * (count - 3)) / nA) + 1, 1, count - 3);
    const a = plats[i + 1], b = plats[i + 2];
    const am = makeAnchor();
    world.add(am);
    S.anchors.push({ mesh: am, plat: null, off: new THREE.Vector3((a.bx + b.bx) / 2, Math.max(a.by, b.by) + 5.5, (a.bz + b.bz) / 2), taken: false, phase: R() * 6, bob: 0.2 });
  }

  // challenge course behind the secret gate
  if (secrets.length) {
    const sp = secrets[0];
    const lit = (g) => { g.userData.ringMat.emissiveIntensity = 2.2; g.userData.discMat.opacity = 0.6; g.userData.light.visible = false; };
    const gate = makePortal(0xffd27a);
    gate.scale.setScalar(0.75); lit(gate);
    world.add(gate);
    S.gates.push({ mesh: gate, plat: sp, off: new THREE.Vector3(1.15, 0, 1.15), kind: 'in' });
    const cL = { count: 7, gap: [2.2, 3.4], size: [3.6, 4.8], dy: [0, 0.9], lateral: 0.35, moving: 0.25, ice: 0, crumble: 0.15, blink: 0.15, lumen: 0, noSecret: true };
    const cg = generate(cL, idx * 31 + 7);
    const ox = 150, oy = 45;
    for (const p of cg.plats) {
      p.x += ox; p.bx += ox; p.y += oy; p.by += oy;
      p.mesh = makePlatformMesh(p, L);
      world.add(p.mesh);
      S.plats.push(p);
    }
    const cp = cg.plats;
    for (const ci of [2, 4]) {
      if (cp[ci].type === 'solid' || cp[ci].type === 'ice') {
        const spm = makeSpinner();
        world.add(spm);
        S.spinners.push({ mesh: spm, plat: cp[ci], off: new THREE.Vector3(0, 0, 0), angle: 0, speed: (ci === 2 ? 1 : -1) * 1.7 });
      }
    }
    const endP = cp[cp.length - 1];
    const gold = makeShard(0xffe14a);
    gold.scale.setScalar(1.6);
    world.add(gold);
    S.goldens.push({ mesh: gold, plat: endP, off: new THREE.Vector3(0, 1.8, 0), taken: false, phase: 0, bob: 0.2 });
    const back = makePortal(0xffd27a);
    back.scale.setScalar(0.75); lit(back);
    world.add(back);
    S.gates.push({ mesh: back, plat: endP, off: new THREE.Vector3(3.2, 0, 0), kind: 'out' });
    S.course = { start: cp[0], minY: Math.min(...cp.map((p) => p.by - (p.amp && p.axis.y ? p.amp : 0))) - 1 };
  }

  // rising Gloom
  if (L.tide) {
    const tm = makeTide();
    world.add(tm);
    S.tide = { y: -9, speed: L.tide, mesh: tm, paused: 0 };
  }

  // ghost of the best run
  if (S.trial) {
    const g = loadGhost(idx);
    if (g) {
      const gm = makeGhost();
      world.add(gm);
      S.ghost = { mesh: gm, t: g.t, time: g.time };
    }
  }

  // goal
  const last = plats[plats.length - 1];
  if (L.boss) {
    const hearth = makeHearth();
    hearth.position.set(last.x, last.y, last.z);
    world.add(hearth);
    S.portal = { group: hearth, plat: last, active: false };
    const boss = makeBoss();
    boss.position.set(last.x, last.y + 4.2, last.z);
    world.add(boss);
    S.boss = { mesh: boss, hp: L.bossHp || 6, maxHp: L.bossHp || 6, inv: 0, spawnT: 5, waveT: 6, burstT: 5, aimT: 3, phase: 1, dying: 0, plat: last, shake: 0, awake: false };
  } else {
    const portal = makePortal(L.glow);
    portal.position.set(last.x, last.y, last.z);
    world.add(portal);
    S.portal = { group: portal, plat: last, active: false };
  }

  // wind
  const wa = R() * Math.PI * 2;
  S.wind = { x: Math.cos(wa) * (L.wind || 0), z: Math.sin(wa) * (L.wind || 0), strength: L.wind || 0 };

  // player
  P.pos.set(0, 0, 0); P.vel.set(0, 0, 0); P.lastSafe.set(0, 0.05, 0);
  P.grounded = false; P.ground = null; P.jumps = 0; P.coyote = 0; P.inv = 0; P.flareCD = 0; P.jumpBuf = 0;
  P.dashT = 0; P.dashCD = 0; P.dashes = 1;
  for (const k in P.fx) P.fx[k] = 0;
  cam.yaw = 0; cam.pitch = 0.45;
  cam.target.set(0, 1.2, 0);
  updateMoving(0);
  syncAttached(0);
  camera.position.set(0, 6, 8);
  initWeather(L.theme);
  $('realm').textContent = L.realm;
  $('lname').textContent = L.name;
  hudCache.length = 0;
}

function spawnEnemy(plat, kind, speed, phase, lifetime = 0, from = null) {
  const m = makeWisp(kind === 'spitter');
  if (kind === 'spitter') m.scale.setScalar(1.15);
  world.add(m);
  const e = { mesh: m, plat, kind, speed, phase, alive: true, pos: new THREE.Vector3(), lifetime, t: 0, fireT: 3 };
  if (from) e.pos.copy(from);
  else e.pos.set(plat.x, plat.y + 1.4, plat.z);
  m.position.copy(e.pos);
  S.enemies.push(e);
  return e;
}

function spawnProjectile(from, dir, speed, color = 0xff4aa8) {
  const m = makeProjectile(color);
  m.position.copy(from);
  world.add(m);
  S.projectiles.push({ mesh: m, pos: from.clone(), vel: dir.clone().normalize().multiplyScalar(speed), t: 0 });
  sfx.shot();
}

// ---------- platforms ----------
function updateMoving(dt) {
  for (const p of S.plats) {
    if (p.type === 'moving') {
      const s = Math.sin(S.clock * p.spd + p.phase) * p.amp;
      const nx = p.bx + p.axis.x * s, ny = p.by + p.axis.y * s, nz = p.bz + p.axis.z * s;
      p.dx = nx - p.x; p.dy = ny - p.y; p.dz = nz - p.z;
      p.x = nx; p.y = ny; p.z = nz;
      p.mesh.position.set(nx, ny, nz);
    } else if (p.type === 'blink') {
      const t = (S.clock + p.phase) % 4.2;
      if (t < 2.6) { p.state = 'idle'; p.mesh.visible = true; }
      else if (t < 3.3) { p.state = 'idle'; p.mesh.visible = Math.floor(S.clock * 12) % 2 === 0; }
      else { p.state = 'fallen'; p.mesh.visible = false; }
    } else if (p.type === 'lumen') {
      p.lit = Math.max(0, p.lit - dt);
      for (const l of S.lanterns) if (l.lit && Math.hypot(l.plat.x - p.x, l.plat.z - p.z) < 13) p.lit = Math.max(p.lit, 2);
      p.state = p.lit > 0 ? 'idle' : 'fallen';
      const a = p.lit > 1.5 ? 1 : p.lit > 0 ? (Math.floor(S.clock * 14) % 2 ? 1 : 0.35) : 0.14;
      for (const mt of p.mesh.userData.mats) mt.opacity = a;
    } else if (p.type === 'crumble') {
      if (p.state === 'shaking') {
        p.timer -= dt;
        p.mesh.position.set(p.x + (Math.random() - 0.5) * 0.12, p.y, p.z + (Math.random() - 0.5) * 0.12);
        if (p.timer <= 0) { p.state = 'fallen'; p.timer = 3.2; p.fallV = 0; }
      } else if (p.state === 'fallen') {
        p.timer -= dt;
        p.fallV += 22 * dt;
        p.mesh.position.y -= p.fallV * dt;
        if (p.timer <= 0) { p.state = 'idle'; p.mesh.position.set(p.x, p.y, p.z); }
      }
    }
  }
}

const attachedLists = () => [S.shards, S.embers, S.powerups, S.scrolls, S.pads, S.lanterns, S.spinners, S.geysers, S.anchors, S.goldens, S.gates];
function syncAttached(t) {
  for (const list of attachedLists()) {
    for (const c of list) {
      if (c.taken) continue;
      const bob = c.bob ? Math.sin(t * 2 + (c.phase || 0)) * c.bob : 0;
      if (c.plat) c.mesh.position.set(c.plat.x + c.off.x, c.plat.y + c.off.y + bob, c.plat.z + c.off.z);
      else c.mesh.position.set(c.off.x, c.off.y + bob, c.off.z);
    }
  }
  for (const s of S.shards) if (!s.taken) s.mesh.userData.core.rotation.y = t * 2 + s.phase;
  for (const s of S.goldens) if (!s.taken) s.mesh.userData.core.rotation.y = t * 2.4;
  for (const a of S.anchors) a.mesh.userData.ring.rotation.y = t * 1.5;
  for (const s of S.powerups) if (!s.taken) { s.mesh.userData.ring.rotation.x = t * 2; s.mesh.userData.ring.rotation.y = t * 1.3; }
  for (const s of S.scrolls) if (!s.taken) s.mesh.rotation.y = t * 1.5;
}

// ---------- player physics ----------
function overlaps(p) {
  return P.pos.x + RAD > p.x - p.w / 2 && P.pos.x - RAD < p.x + p.w / 2
    && P.pos.z + RAD > p.z - p.d / 2 && P.pos.z - RAD < p.z + p.d / 2
    && P.pos.y < p.y - 0.001 && P.pos.y + H > p.y - p.th;
}
function overlapsXZ(p) {
  return P.pos.x + RAD > p.x - p.w / 2 && P.pos.x - RAD < p.x + p.w / 2
    && P.pos.z + RAD > p.z - p.d / 2 && P.pos.z - RAD < p.z + p.d / 2;
}

function resolveHoriz(axis) {
  for (const p of S.plats) {
    if (p.state === 'fallen' || !overlaps(p)) continue;
    if (p.y - P.pos.y <= 0.35 && P.vel.y <= 0.5) { P.pos.y = p.y; continue; }
    if (axis === 'x') {
      P.pos.x = P.pos.x < p.x ? p.x - p.w / 2 - RAD - 0.001 : p.x + p.w / 2 + RAD + 0.001;
      P.vel.x = 0;
    } else {
      P.pos.z = P.pos.z < p.z ? p.z - p.d / 2 - RAD - 0.001 : p.z + p.d / 2 + RAD + 0.001;
      P.vel.z = 0;
    }
  }
}

function inputDir() {
  let ix = PAD.mx + TOUCH.mx, iz = -(PAD.my + TOUCH.my);
  if (keys.KeyW || keys.ArrowUp) iz += 1;
  if (keys.KeyS || keys.ArrowDown) iz -= 1;
  if (keys.KeyD || keys.ArrowRight) ix += 1;
  if (keys.KeyA || keys.ArrowLeft) ix -= 1;
  const len = Math.hypot(ix, iz);
  if (len < 0.12) return null;
  const sc = Math.min(1, len) / len;
  ix *= sc; iz *= sc;
  const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
  return { x: fx * iz + rx * ix, z: fz * iz + rz * ix };
}

function doDash() {
  if (S.mode !== 'play' || P.dashCD > 0 || P.dashT > 0) return;
  if (!P.grounded) { if (P.dashes <= 0) return; P.dashes--; }
  const d = inputDir() || { x: -Math.sin(P.face), z: -Math.cos(P.face) };
  const dl = Math.hypot(d.x, d.z) || 1;
  P.dashX = d.x / dl; P.dashZ = d.z / dl;
  P.dashT = 0.18;
  P.dashCD = P.fx.speed > 0 ? 0.5 : 0.9;
  P.face = Math.atan2(-P.dashX, -P.dashZ);
  sfx.dash();
  emit(P.pos.x, P.pos.y + 0.4, P.pos.z, 0x7affd0, 14, 3, 0.4);
}

function stepPlayer(dt) {
  if (keys.KeyZ) cam.yaw += 2.2 * dt;
  if (keys.KeyX) cam.yaw -= 2.2 * dt;
  if (keys.Minus || keys.NumpadSubtract) zoomBy(6 * dt);
  if (keys.Equal || keys.NumpadAdd) zoomBy(-6 * dt);
  if (keys.KeyR) cam.pitch = clamp(cam.pitch + 1.4 * dt, -0.15, 1.3);
  if (keys.KeyV) cam.pitch = clamp(cam.pitch - 1.4 * dt, -0.15, 1.3);
  const fx = P.fx;
  for (const k in fx) fx[k] = Math.max(0, fx[k] - dt);
  shieldMesh.visible = fx.shield > 0;
  if (fx.shield > 0) shieldMesh.rotation.y += dt * 2;

  const d = inputDir();
  const dx = d ? d.x : 0, dz = d ? d.z : 0;
  const onIce = P.grounded && P.ground && P.ground.type === 'ice';
  const k = P.grounded ? (onIce ? 1.3 : 14) : (P.gliding ? 8 : 5);
  const SPEED = (fx.speed > 0 ? 10.4 : 7.2) * (P.gliding ? 1.15 : 1);
  const f = Math.min(1, k * dt);
  const G = fx.moon > 0 ? 11 : 26;

  P.dashCD = Math.max(0, P.dashCD - dt);
  P.grapCD = Math.max(0, P.grapCD - dt);
  const jumpHeld = keys.Space || PAD.jump || TOUCH.jump;
  if (P.grap) {
    const a = P.grap.a.mesh.position;
    const tx = a.x - P.pos.x, ty = a.y - (P.pos.y + 0.45), tz = a.z - P.pos.z;
    const dist = Math.hypot(tx, ty, tz);
    P.grap.t += dt;
    if (dist < 1.8 || P.grap.t > 1.5) {
      P.vel.set((tx / dist) * 8, 7, (tz / dist) * 8);
      P.jumps = 1; P.dashes = 1; P.glideT = 1.6; P.grap = null;
    } else {
      P.vel.set((tx / dist) * 26, (ty / dist) * 26, (tz / dist) * 26);
      P.face = Math.atan2(-tx, -tz);
      emit(P.pos.x, P.pos.y + 0.4, P.pos.z, 0xffe0a0, 1, 0.4, 0.4);
    }
  } else if (P.dashT > 0) {
    P.dashT -= dt;
    P.vel.x = P.dashX * 24; P.vel.z = P.dashZ * 24; P.vel.y = 0;
    emit(P.pos.x, P.pos.y + 0.4, P.pos.z, 0x7affd0, 2, 0.5, 0.35);
  } else {
    P.vel.x += (dx * SPEED - P.vel.x) * f;
    P.vel.z += (dz * SPEED - P.vel.z) * f;
    if (!P.grounded || onIce) {
      const g = gust();
      P.vel.x += S.wind.x * g * dt * (P.grounded ? 0.4 : 1);
      P.vel.z += S.wind.z * g * dt * (P.grounded ? 0.4 : 1);
    }
  }

  P.jumpBuf -= dt;
  if (P.jumpBuf > 0) {
    if (P.coyote > 0) {
      P.vel.y = fx.moon > 0 ? 10.6 : 9.8; P.jumps = 1; P.coyote = 0; P.jumpBuf = 0; P.grounded = false; sfx.jump();
      emit(P.pos.x, P.pos.y + 0.1, P.pos.z, 0xffd27a, 8, 2, 0.4);
    } else if (P.jumps < 2) {
      P.vel.y = fx.moon > 0 ? 10 : 9.2; P.jumps = 2; P.jumpBuf = 0; sfx.djump();
      emit(P.pos.x, P.pos.y + 0.2, P.pos.z, 0xffe9b0, 16, 3, 0.5);
    }
  }
  if (!P.grounded && P.coyote <= 0 && P.jumps === 0) P.jumps = 1;

  if (P.ground && P.ground.state !== 'fallen') {
    P.pos.x += P.ground.dx; P.pos.y += P.ground.dy; P.pos.z += P.ground.dz;
  }

  P.pos.x += P.vel.x * dt; resolveHoriz('x');
  P.pos.z += P.vel.z * dt; resolveHoriz('z');

  let gliding = false;
  if (!P.grap && P.dashT <= 0) {
    P.vel.y = Math.max(P.vel.y - G * dt, fx.moon > 0 ? -14 : -32);
    if (!P.grounded && jumpHeld && P.jumps >= 2 && P.vel.y < -1.2 && P.glideT > 0 && P.jumpBuf <= 0) {
      P.vel.y = Math.max(P.vel.y, -2.4); P.glideT -= dt; gliding = true;
      if (Math.random() < 0.5) emit(P.pos.x, P.pos.y + 0.5, P.pos.z, 0xffd27a, 1, 0.8, 0.4, -1);
    }
  }
  P.gliding = gliding;
  wings.visible = gliding;
  const prevY = P.pos.y;
  P.pos.y += P.vel.y * dt;
  let landed = null;
  for (const p of S.plats) {
    if (p.state === 'fallen' || !overlapsXZ(p)) continue;
    const bot = p.y - p.th;
    if (P.vel.y <= 0 && prevY >= p.y - 0.03 && P.pos.y <= p.y) {
      if (!landed || p.y > landed.y) landed = p;
    } else if (P.vel.y > 0 && prevY + H <= bot + 0.03 && P.pos.y + H > bot) {
      P.pos.y = bot - H; P.vel.y = 0;
    }
  }
  if (landed) {
    if (!P.grounded && P.vel.y < -6) { sfx.land(); emit(P.pos.x, landed.y + 0.05, P.pos.z, 0xcfc0a0, 8, 2, 0.4); }
    P.pos.y = landed.y; P.vel.y = 0;
    P.grounded = true; P.ground = landed; P.jumps = 0; P.coyote = 0.12; P.dashes = 1; P.glideT = 1.6;
    if (landed.idx !== undefined && landed.idx > S.maxIdx) { S.maxIdx = landed.idx; checkVoice(); }
    if (landed.type === 'crumble' && landed.state === 'idle') { landed.state = 'shaking'; landed.timer = 0.65; sfx.crumble(); }
    if (landed.type === 'solid' || landed.type === 'ice') {
      if (Math.abs(P.pos.x - landed.x) < landed.w / 2 - 0.9 && Math.abs(P.pos.z - landed.z) < landed.d / 2 - 0.9) P.lastSafe.copy(P.pos);
    }
  } else {
    P.grounded = false; P.ground = null; P.coyote -= dt;
  }

  const sp = Math.hypot(P.vel.x, P.vel.z);
  if (sp > 0.8 && P.dashT <= 0) P.face = Math.atan2(-P.vel.x, -P.vel.z);
  player.rotation.y = lerpAngle(player.rotation.y, P.face, Math.min(1, 14 * dt));
  player.position.copy(P.pos);
  const stretch = clamp(1 + Math.abs(P.vel.y) * 0.02, 1, 1.25);
  bodyMesh.scale.set(1 / Math.sqrt(stretch), stretch, 1 / Math.sqrt(stretch));
  bodyMesh.position.y = RAD * stretch;
  if (sp > 1 && P.grounded) {
    P.foot += sp * dt;
    if (P.foot > 0.75) {
      P.foot = 0; P.footSide *= -1;
      emit(P.pos.x + Math.cos(P.face) * 0.2 * P.footSide, P.pos.y + 0.05, P.pos.z - Math.sin(P.face) * 0.2 * P.footSide, trailColor, 1, 0.02, 1.8);
    }
    if (Math.random() < 0.4) emit(P.pos.x, P.pos.y + 0.2, P.pos.z, 0xff9a40, 1, 0.4, 0.5, -1.5);
  }
  if (!P.grounded && Math.random() < 0.6) emit(P.pos.x, P.pos.y + 0.3, P.pos.z, 0xffb060, 1, 0.5, 0.5, -1);

  P.inv = Math.max(0, P.inv - dt);
  P.flareCD = Math.max(0, P.flareCD - dt);
  player.visible = P.inv <= 0 || Math.floor(S.clock * 14) % 2 === 0;

  if (S.inCourse && P.pos.y < S.course.minY - 10) {
    P.pos.copy(P.lastSafe); P.pos.y += 0.3; P.vel.set(0, 0, 0); P.ground = null; P.grounded = false;
    toast('Back to the start of the trial.', 1500);
  } else if (P.pos.y < S.deathY) fallDeath();
}

function lerpAngle(a, b, t) {
  const d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return a + d * t;
}

function respawn() {
  P.pos.copy(P.lastSafe); P.pos.y += 0.3;
  P.vel.set(0, 0, 0); P.ground = null; P.grounded = false; P.inv = 1.6; P.dashT = 0; P.grap = null;
  if (S.tide && S.tide.y > P.pos.y - 3) S.tide.y = P.pos.y - 5;
  emit(P.pos.x, P.pos.y + 0.5, P.pos.z, 0xffd27a, 24, 4, 0.8);
}

function damage(fromX, fromZ) {
  if (P.inv > 0) return;
  if (P.fx.shield > 0) {
    P.fx.shield = 0; P.inv = 1.0; sfx.shield();
    emit(P.pos.x, P.pos.y + 0.5, P.pos.z, 0x4aa8ff, 30, 6, 0.7);
    S.shake = 0.25;
    return;
  }
  S.hearts--; S.heartsLost++;
  P.inv = 1.6; P.grap = null;
  S.shake = 0.4;
  voiceOnce('hit', 'Careful! You are made of light, not armor.');
  sfx.hit();
  flashRed();
  const dx = P.pos.x - fromX, dz = P.pos.z - fromZ, d = Math.hypot(dx, dz) || 1;
  P.vel.x = (dx / d) * 8; P.vel.z = (dz / d) * 8; P.vel.y = 7; P.dashT = 0;
  P.grounded = false; P.ground = null; P.coyote = 0;
  emit(P.pos.x, P.pos.y + 0.5, P.pos.z, 0xff4a2a, 18, 5, 0.7);
  if (S.hearts <= 0) gameOver();
}

function fallDeath() {
  S.hearts--; S.heartsLost++;
  sfx.hit(); flashRed();
  voiceOnce('fall', 'The dark below is hungry. Do not feed it.');
  if (S.hearts <= 0) { gameOver(); return; }
  respawn();
  toast('You fall into the dark... and rekindle.', 1800);
}

function gameOver() {
  S.mode = 'card';
  document.exitPointerLock?.();
  stopMusic();
  const hasCp = !!S.cp;
  showCard({
    top: LEVELS[S.level].name, title: 'The Flame Gutters Out',
    body: [hasCp ? 'The Gloom closes in. But the last lantern you lit still burns, and a spark that remembers the fire is hard to put out.' : 'The Gloom closes in. But a spark that remembers the fire is hard to put out.'],
    button: 'Rekindle',
    onDone: () => {
      if (hasCp) {
        S.hearts = 3;
        const cp = S.cp;
        P.lastSafe.set(cp.plat.x + cp.off.x + 1.6, cp.plat.y + 0.05, cp.plat.z + cp.off.z);
        respawn();
        if (S.tide) { S.tide.y = cp.plat.y - 9; S.tide.paused = 4; }
        for (const e of S.enemies) if (e.pos.distanceTo(P.pos) < 5) killEnemy(e);
        beginPlay(false);
      } else {
        loadLevel(S.level);
        beginPlay();
      }
    },
  });
}

// ---------- flare ----------
function doFlare() {
  if (P.flareCD > 0 || S.mode !== 'play') return;
  P.flareCD = 3;
  sfx.flare();
  const c = new THREE.Vector3(P.pos.x, P.pos.y + 0.5, P.pos.z);
  emit(c.x, c.y, c.z, 0xffc070, 70, 12, 0.9);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.08, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.position.copy(c); ring.rotation.x = Math.PI / 2;
  world.add(ring);
  S.rings.push({ mesh: ring, t: 0 });
  for (const p of S.plats) if (p.type === 'lumen' && Math.hypot(p.x - c.x, p.z - c.z) < 17 && Math.abs(p.y - c.y) < 12) p.lit = 8;
  for (const e of S.enemies) if (e.alive && e.pos.distanceTo(c) < 6.5) killEnemy(e);
  for (const pr of S.projectiles) if (pr.pos.distanceTo(c) < 7.5) { pr.t = 99; emit(pr.pos.x, pr.pos.y, pr.pos.z, 0xff4aa8, 10, 4, 0.5); }
  const b = S.boss;
  if (b && !b.dying && b.inv <= 0 && b.mesh.position.distanceTo(c) < 12) hitBoss();
}

function killEnemy(e) {
  e.alive = false;
  emit(e.pos.x, e.pos.y, e.pos.z, 0xa070ff, 30, 6, 0.8, 4);
  emit(e.pos.x, e.pos.y, e.pos.z, 0xffe0a0, 12, 4, 0.6);
  world.remove(e.mesh);
  sfx.burn();
}

function hitBoss() {
  const b = S.boss;
  b.hp--; b.inv = 1.3; b.shake = 0.6; S.shake = 0.5;
  sfx.bossHit();
  const p = b.mesh.position;
  emit(p.x, p.y, p.z, 0xff7ad9, 60, 10, 1.0);
  for (const e of S.enemies) if (e.alive && e.kind === 'minion') killEnemy(e);
  if (b.hp <= 0) {
    b.dying = 0.001;
    toast('The Gloom is melting away...', 2600);
    for (const pr of S.projectiles) pr.t = 99;
  } else {
    const ph = b.hp <= b.maxHp / 3 ? 3 : b.hp <= (2 * b.maxHp) / 3 ? 2 : 1;
    if (ph !== b.phase) { b.phase = ph; toast(ph === 2 ? 'The Cold Heart howls: shots fly in every direction!' : 'The Cold Heart is frightened, and warming!', 2400); }
    else toast(`The Cold Heart warms (${b.hp} more)`, 1500);
  }
}

// ---------- updates ----------
function collect(list, radius, fn) {
  const px = P.pos.x, py = P.pos.y + 0.45, pz = P.pos.z;
  for (const s of list) {
    if (s.taken) continue;
    const m = s.mesh.position;
    if (Math.hypot(m.x - px, m.y - py, m.z - pz) < radius) {
      s.taken = true; world.remove(s.mesh);
      fn(s, m);
    }
  }
}

function pull(list, range, speed, dt) {
  for (const s of list) {
    if (s.taken) continue;
    const m = s.mesh.position;
    const dx = P.pos.x - m.x, dy = P.pos.y + 0.45 - m.y, dz = P.pos.z - m.z;
    const d = Math.hypot(dx, dy, dz);
    if (d < range && d > 0.01) {
      if (s.plat) { s.off.copy(m); s.plat = null; }
      s.off.x += (dx / d) * speed * dt; s.off.y += (dy / d) * speed * dt; s.off.z += (dz / d) * speed * dt;
      s.bob = 0;
    }
  }
}

function updatePickups(dt) {
  if (P.fx.magnet > 0) { pull(S.embers, 9, 14, dt); pull(S.shards, 6, 10, dt); }
  collect(S.shards, 1.3, (s, m) => {
    S.shardsGot++;
    sfx.shard();
    emit(m.x, m.y, m.z, 0xffd27a, 50, 7, 1.0);
    toast(`Hearth shard ${S.shardsGot} of ${S.shardsTotal}`, 1500);
    if (S.shardsGot === S.shardsTotal) toast(S.isHearth ? 'All shards gathered. Face the Cold Heart!' : 'All shards gathered. The portal awakens!', 2600);
  });
  collect(S.embers, 1.0, (s, m) => {
    S.embersGot++;
    sfx.ember();
    emit(m.x, m.y, m.z, 0xffa040, 8, 3, 0.5);
    if (S.embersGot % 10 === 0 && S.hearts < 5) { S.hearts++; toast('10 embers: a heart is restored', 1600); }
  });
  collect(S.powerups, 1.2, (s, m) => {
    const dur = { shield: 25, speed: 10, moon: 12, magnet: 14 }[s.kind];
    P.fx[s.kind] = dur;
    sfx.power();
    emit(m.x, m.y, m.z, POWER[s.kind].color, 40, 6, 0.9);
    toast({ shield: 'Shield: blocks the next hit', speed: 'Swift: you run faster', moon: 'Moon leap: low gravity', magnet: 'Magnet: embers fly to you' }[s.kind], 2200);
  });
  collect(S.scrolls, 1.4, (s, m) => {
    sfx.scroll();
    emit(m.x, m.y, m.z, 0xffd27a, 60, 7, 1.2);
    S.secretFound = true;
    saveDiary(S.level);
    showLore(LEVELS[S.level].lore);
  });
  collect(S.goldens, 1.6, (s, m) => {
    S.goldenFlame = true;
    S.hearts = 5;
    sfx.golden();
    emit(m.x, m.y, m.z, 0xffe14a, 90, 9, 1.4);
    toast('The Golden Flame! Hearts restored, and a bonus star.', 3000);
    voiceOnce('golden', 'You walked into the Keeper\'s old trial and came back. Remarkable.');
  });
  S.gateCD -= dt;
  for (const g of S.gates) {
    const m = g.mesh.position;
    if (S.gateCD <= 0 && Math.hypot(m.x - P.pos.x, m.z - P.pos.z) < 1.0 && Math.abs(P.pos.y - m.y) < 2.5) {
      S.gateCD = 1.6;
      sfx.power();
      emit(P.pos.x, P.pos.y + 0.5, P.pos.z, 0xffd27a, 40, 6, 0.8);
      if (g.kind === 'in') {
        const st = S.course.start;
        P.pos.set(st.x, st.y + 0.3, st.z); P.lastSafe.set(st.x, st.y + 0.05, st.z);
        S.inCourse = true;
        toast('The Keeper\'s Trial: reach the Golden Flame!', 3000);
      } else {
        const dest = S.gates[0].plat;
        P.pos.set(dest.x - 1, dest.y + 0.3, dest.z - 1); P.lastSafe.set(dest.x - 1, dest.y + 0.05, dest.z - 1);
        S.inCourse = false;
      }
      P.vel.set(0, 0, 0); P.ground = null; P.grounded = false; P.grap = null;
      cam.target.copy(P.pos);
      emit(P.pos.x, P.pos.y + 0.5, P.pos.z, 0xffd27a, 40, 6, 0.8);
    }
  }
  for (const l of S.lanterns) {
    if (l.lit) continue;
    const m = l.mesh.position;
    if (Math.hypot(m.x - P.pos.x, m.z - P.pos.z) < 1.7 && Math.abs(P.pos.y - m.y) < 2.5) {
      l.lit = true;
      S.cp = l;
      l.mesh.userData.lamp.material.color.set(0xffc060);
      l.mesh.userData.halo.material.opacity = 0.9;
      sfx.lantern();
      emit(m.x, m.y + 2.3, m.z, 0xffc060, 30, 5, 0.9);
      toast('Lantern lit. You will rekindle here.', 2200);
      voiceOnce('lantern', 'A lantern. Someone wanted travelers to find their way.');
      if (S.tide) { S.tide.y = Math.min(S.tide.y, l.plat.y - 9); S.tide.paused = 6; toast('The lantern pushes the Gloom back!', 2200); }
    }
  }
  for (const l of S.lanterns) if (l.lit) l.mesh.userData.halo.material.opacity = 0.75 + Math.sin(S.clock * 6) * 0.15;
}

function updatePads(dt) {
  for (const pd of S.pads) {
    pd.cd -= dt;
    const m = pd.mesh.position;
    pd.mesh.userData.arrow.position.y = 0.8 + Math.sin(S.clock * 6) * 0.12;
    pd.mesh.scale.y = lerp(pd.mesh.scale.y, 1, Math.min(1, 10 * dt));
    if (pd.cd > 0) continue;
    if (Math.hypot(m.x - P.pos.x, m.z - P.pos.z) < 0.95 && P.pos.y - m.y > -0.2 && P.pos.y - m.y < 0.7 && P.vel.y <= 1) {
      P.vel.y = P.fx.moon > 0 ? 22 : 18.5;
      P.jumps = 1; P.grounded = false; P.ground = null; P.coyote = 0; P.dashes = 1;
      pd.cd = 0.4; pd.mesh.scale.y = 0.4;
      sfx.pad();
      emit(m.x, m.y + 0.3, m.z, 0x7affb0, 30, 5, 0.8);
    }
  }
}

function updateHazards(dt) {
  for (const sp of S.spinners) {
    sp.angle += sp.speed * dt;
    const arm = sp.mesh.userData.arm;
    arm.rotation.y = sp.angle;
    const rx = P.pos.x - sp.mesh.position.x, rz = P.pos.z - sp.mesh.position.z;
    const dx = Math.cos(sp.angle), dz = -Math.sin(sp.angle);
    const along = rx * dx + rz * dz, perp = Math.abs(rx * dz - rz * dx);
    if (Math.abs(along) < 2.9 && perp < 0.75 && P.pos.y < sp.mesh.position.y + 0.95 && P.pos.y > sp.mesh.position.y - 0.6) damage(sp.mesh.position.x, sp.mesh.position.z);
  }
  for (const g of S.geysers) {
    const t = (S.clock + g.phase) % 4.2;
    const { ring, col } = g.mesh.userData;
    const m = g.mesh.position;
    if (t < 2.4) { ring.material.opacity = 0.25; col.visible = false; g.erupting = false; }
    else if (t < 3.3) {
      ring.material.opacity = 0.5 + Math.sin(S.clock * 24) * 0.35;
      ring.scale.setScalar(1 + (t - 2.4) * 0.15);
      col.visible = false;
      if (Math.random() < 0.5) emit(m.x + (Math.random() - 0.5), m.y + 0.2, m.z + (Math.random() - 0.5), 0xff8a30, 1, 1, 0.5, -3);
    } else {
      if (!g.erupting) { g.erupting = true; if (Math.hypot(m.x - P.pos.x, m.z - P.pos.z) < 22) sfx.geyser(); }
      col.visible = true;
      col.scale.set(1 + Math.sin(S.clock * 30) * 0.08, Math.min(1, (t - 3.3) * 8), 1 + Math.sin(S.clock * 30) * 0.08);
      col.position.y = 3.5 * col.scale.y;
      ring.material.opacity = 0.9;
      if (Math.random() < 0.8) emit(m.x, m.y + 2 + Math.random() * 5, m.z, 0xffa040, 1, 1.5, 0.6, 2);
      if (Math.hypot(m.x - P.pos.x, m.z - P.pos.z) < 1.35 && P.pos.y < m.y + 7 && P.pos.y > m.y - 0.8) damage(m.x, m.z + 0.01);
    }
    if (t < 2.4) ring.scale.setScalar(1);
  }
}

function updateProjectiles(dt) {
  const pc = new THREE.Vector3(P.pos.x, P.pos.y + 0.45, P.pos.z);
  for (const pr of S.projectiles) {
    pr.t += dt;
    pr.pos.addScaledVector(pr.vel, dt);
    pr.mesh.position.copy(pr.pos);
    if (Math.random() < 0.4) emit(pr.pos.x, pr.pos.y, pr.pos.z, 0xff4aa8, 1, 0.4, 0.4);
    if (pr.t < 7 && pr.pos.distanceTo(pc) < 0.7) {
      if (P.dashT > 0) { pr.t = 99; emit(pr.pos.x, pr.pos.y, pr.pos.z, 0x7affd0, 10, 4, 0.5); }
      else { damage(pr.pos.x - pr.vel.x, pr.pos.z - pr.vel.z); pr.t = 99; }
    }
  }
  S.projectiles = S.projectiles.filter((pr) => {
    if (pr.t > 7) { world.remove(pr.mesh); return false; }
    return true;
  });
}

function updateEnemies(dt) {
  const pc = new THREE.Vector3(P.pos.x, P.pos.y + 0.45, P.pos.z);
  for (const e of S.enemies) {
    if (!e.alive) continue;
    e.t += dt;
    if (e.lifetime && e.t > e.lifetime) { killEnemy(e); continue; }
    const toP = pc.clone().sub(e.pos);
    const dist = toP.length();
    if (P.dashT > 0 && dist < 1.9) { killEnemy(e); continue; }
    if (e.kind === 'patrol') {
      const rad = Math.max(1.2, Math.min(e.plat.w, e.plat.d) / 2 - 0.6);
      const a = S.clock * 0.9 + e.phase;
      e.pos.set(e.plat.x + Math.cos(a) * rad, e.plat.y + 1.3 + Math.sin(S.clock * 2 + e.phase) * 0.25, e.plat.z + Math.sin(a) * rad);
    } else if (e.kind === 'spitter') {
      e.pos.set(e.plat.x + e.off.x, e.plat.y + 1.5 + Math.sin(S.clock * 2 + e.phase) * 0.2, e.plat.z + e.off.z);
      e.fireT -= dt;
      if (dist < 28 && e.fireT < 0.6 && Math.random() < 0.5) emit(e.pos.x, e.pos.y, e.pos.z, 0xff4aa8, 1, 1, 0.4);
      if (dist < 28 && e.fireT <= 0) {
        e.fireT = 3.2;
        spawnProjectile(e.pos, toP, 8.5);
      }
    } else {
      const aggro = e.kind === 'minion' ? 40 : 12;
      if (dist < aggro && Math.abs(toP.y) < 8) {
        toP.y += 0.4; toP.normalize();
        e.pos.addScaledVector(toP, e.speed * dt);
      } else {
        const home = new THREE.Vector3(e.plat.x, e.plat.y + 1.4, e.plat.z);
        const back = home.sub(e.pos);
        if (back.length() > 0.2) e.pos.addScaledVector(back.normalize(), 2 * dt);
      }
      e.pos.y += Math.sin(S.clock * 3 + e.phase) * dt * 0.5;
    }
    e.mesh.position.copy(e.pos);
    e.mesh.rotation.y = Math.atan2(-(pc.x - e.pos.x), -(pc.z - e.pos.z));
    const base = e.kind === 'spitter' ? 1.15 : 1;
    e.mesh.scale.setScalar(base * (1 + Math.sin(S.clock * 5 + e.phase) * 0.06));
    if (Math.random() < 0.3) emit(e.pos.x, e.pos.y, e.pos.z, 0x5a20c0, 1, 0.6, 0.6, 1);
    if (dist < 0.95) damage(e.pos.x, e.pos.z);
  }
  S.enemies = S.enemies.filter((e) => e.alive);
}

const WARM_CORE = new THREE.Color(0xff9a3c), WARM_HALO = new THREE.Color(0xffc060), WARM_RING = new THREE.Color(0xffd27a);
function updateBoss(dt) {
  const b = S.boss;
  if (!b) return;
  const m = b.mesh, u = m.userData;
  const pl = b.plat;
  const distP = Math.hypot(P.pos.x - pl.x, P.pos.z - pl.z);
  if (!b.awake && distP < 18 && P.pos.y > pl.y - 3) {
    b.awake = true;
    toast('The Cold Heart stirs. Warm it with your Flare!', 3000);
  }
  if (b.dying) {
    b.dying += dt;
    const s = Math.max(0.001, 1 - b.dying / 1.8);
    m.scale.setScalar(s);
    m.position.set(pl.x + (Math.random() - 0.5) * 0.3, pl.y + 4.2, pl.z + (Math.random() - 0.5) * 0.3);
    if (Math.random() < 0.6) emit(pl.x, pl.y + 4.2, pl.z, 0xff7ad9, 6, 8, 0.8);
    if (b.dying > 1.8) {
      world.remove(m);
      S.boss = null;
      S.bossDead = true;
      S.waves.forEach((w) => world.remove(w.mesh)); S.waves = [];
      for (const e of S.enemies) if (e.alive) killEnemy(e);
      const keeper = makeKeeper();
      keeper.position.set(pl.x + 3.2, pl.y, pl.z + 2.5);
      keeper.rotation.y = Math.PI * 0.8;
      world.add(keeper);
      S.keeper = keeper;
      emit(pl.x, pl.y + 2, pl.z, 0xffe0a0, 120, 10, 1.6);
      S.mode = 'card';
      document.exitPointerLock?.();
      showCard({ ...BOSS_DEAD, button: 'Go to the Hearth', onDone: () => { S.mode = 'play'; $('hud').style.display = 'block'; } });
    }
    return;
  }
  b.inv = Math.max(0, b.inv - dt);
  b.shake = Math.max(0, b.shake - dt);
  m.position.set(pl.x + (b.shake ? (Math.random() - 0.5) * 0.4 : 0), pl.y + 4.2 + Math.sin(S.clock * 1.3) * 0.4, pl.z);
  u.core.rotation.y += dt * 0.4;
  u.rings.forEach((r, i) => { r.rotation.x += dt * (0.4 + i * 0.3); r.rotation.y += dt * (0.3 - i * 0.2); });
  b.warm = lerp(b.warm || 0, 1 - b.hp / b.maxHp, Math.min(1, 3 * dt));
  u.mat.emissive.setHex(0x5a1280).lerp(WARM_CORE, b.warm);
  u.halo.material.color.setHex(0x9a30ff).lerp(WARM_HALO, b.warm);
  u.rings.forEach((r, i) => r.material.color.setHex(i === 1 ? 0xff7ad9 : 0xa86bff).lerp(WARM_RING, b.warm));
  u.mat.emissiveIntensity = b.inv > 0 ? 2.5 : 0.8 + Math.sin(S.clock * 3) * 0.2;
  if (!b.awake) return;

  b.spawnT -= dt;
  if (b.spawnT <= 0) {
    b.spawnT = 6;
    if (S.enemies.filter((e) => e.kind === 'minion').length < 3) {
      spawnEnemy(pl, 'minion', 3.2, Math.random() * 6, 16, m.position);
      sfx.wave();
    }
  }
  b.waveT -= dt;
  if (b.waveT <= 0) {
    b.waveT = 5.5 - (b.phase - 1) * 1.1;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 8, 64), new THREE.MeshBasicMaterial({ color: 0xff7ad9, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(pl.x, pl.y + 0.15, pl.z);
    world.add(ring);
    S.waves.push({ mesh: ring, r: 1 });
    sfx.wave();
  }
  if (b.phase >= 2) {
    b.burstT -= dt;
    if (b.burstT <= 0) {
      b.burstT = 7;
      const n = 10, off = Math.random() * 6;
      for (let i = 0; i < n; i++) {
        const a = off + (i / n) * Math.PI * 2;
        spawnProjectile(new THREE.Vector3(pl.x, pl.y + 1.0, pl.z), new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), 5.5, 0xff7ad9);
      }
    }
  }
  if (b.phase >= 3) {
    b.aimT -= dt;
    if (b.aimT <= 0) {
      b.aimT = 2.8;
      const target = new THREE.Vector3(P.pos.x, P.pos.y + 0.45, P.pos.z);
      const dir = target.clone().sub(m.position);
      for (const spread of [-0.25, 0, 0.25]) {
        const d2 = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
        spawnProjectile(m.position, d2, 9, 0xff4aa8);
      }
    }
  }
  for (const w of S.waves) {
    w.r += 7.5 * dt;
    w.mesh.scale.set(w.r, w.r, 6);
    w.mesh.material.opacity = Math.max(0, 1 - w.r / 20);
    const d = Math.hypot(P.pos.x - pl.x, P.pos.z - pl.z);
    if (Math.abs(d - w.r) < 0.8 && P.pos.y < pl.y + 0.7 && P.pos.y > pl.y - 1) damage(pl.x, pl.z);
  }
  S.waves = S.waves.filter((w) => { if (w.r > 20) { world.remove(w.mesh); return false; } return true; });
}

function updateRings(dt) {
  for (const r of S.rings) {
    r.t += dt;
    const s = 1 + (r.t / 0.45) * 7;
    r.mesh.scale.set(s, s, s);
    r.mesh.material.opacity = Math.max(0, 0.9 - r.t / 0.5);
    r.mesh.position.x = P.pos.x; r.mesh.position.z = P.pos.z; r.mesh.position.y = P.pos.y + 0.5;
  }
  S.rings = S.rings.filter((r) => { if (r.t > 0.5) { world.remove(r.mesh); return false; } return true; });
}

function updatePortal(dt) {
  const po = S.portal;
  if (!po) return;
  const g = po.group, u = g.userData, L = LEVELS[S.level];
  const should = S.shardsGot >= S.shardsTotal && (!L.boss || S.bossDead);
  if (should && !po.active) {
    po.active = true;
    sfx.portal();
    emit(po.plat.x, po.plat.y + 2, po.plat.z, L.glow, 60, 8, 1.2);
  }
  if (S.isHearth) {
    const target = po.active ? 1 : 0.001;
    u.flames.scale.setScalar(lerp(u.flames.scale.x, target, Math.min(1, 2 * dt)));
    u.light.intensity = lerp(u.light.intensity, po.active ? 6 : 0, Math.min(1, 2 * dt));
    u.flames.rotation.y += dt;
    u.flames.children.forEach((c, i) => { c.scale.y = 1 + Math.sin(S.clock * 9 + i * 1.7) * 0.12; });
    if (po.active && Math.random() < 0.5) emit(g.position.x, g.position.y + 2.2, g.position.z, 0xffb347, 1, 2, 1, -3);
  } else {
    u.ring.rotation.z += dt * (po.active ? 1.2 : 0.2);
    u.ringMat.emissiveIntensity = lerp(u.ringMat.emissiveIntensity, po.active ? 2 : 0, Math.min(1, 3 * dt));
    u.discMat.opacity = lerp(u.discMat.opacity, po.active ? 0.55 + Math.sin(S.clock * 4) * 0.12 : 0, Math.min(1, 3 * dt));
    u.light.intensity = lerp(u.light.intensity, po.active ? 4 : 0, Math.min(1, 3 * dt));
    if (po.active && Math.random() < 0.6) emit(g.position.x + (Math.random() - 0.5) * 2, g.position.y + 0.3, g.position.z + (Math.random() - 0.5) * 2, L.glow, 1, 1, 1.4, -2);
  }
  if (S.mode !== 'play') return;
  S.portalMsgCD -= dt;
  const d = Math.hypot(P.pos.x - g.position.x, P.pos.z - g.position.z);
  if (d < (S.isHearth ? 2.2 : 1.6) && P.pos.y > g.position.y - 0.3 && P.pos.y < g.position.y + 3.5) {
    if (po.active) completeLevel();
    else if (S.portalMsgCD <= 0) {
      S.portalMsgCD = 3;
      if (L.boss && S.shardsGot >= S.shardsTotal) toast('The Cold Heart still guards the Hearth.', 2200);
      else toast(`The way is sealed. ${S.shardsTotal - S.shardsGot} shard(s) missing.`, 2200);
    }
  }
}

function updateGust() {
  if (!S.wind.strength) return;
  const on = gust() > 0.25;
  if (on && !S.gustOn) toast('A gale rises! It pushes you through the air.', 2000);
  S.gustOn = on;
}

function updateAnim(dt) {
  for (const a of S.anim) {
    a.mesh.rotation.y += dt * a.spin;
    a.mesh.position.y = a.baseY + Math.sin(S.clock * 0.6 + a.bob) * 0.8;
  }
  const L = LEVELS[S.level];
  if (L.theme === 'lava') S.floor.material.color.setHSL(0.04 + Math.sin(S.clock * 1.5) * 0.01, 1, 0.45 + Math.sin(S.clock * 2.3) * 0.05);
  S.floor.position.x = camera.position.x; S.floor.position.z = camera.position.z;
  S.stars.position.copy(camera.position);
  if (S.keeper) S.keeper.position.y = S.portal.plat.y + Math.sin(S.clock * 2) * 0.05;
}

function updateCamera(dt) {
  const t = new THREE.Vector3(P.pos.x, P.pos.y + 1.1, P.pos.z);
  cam.target.lerp(t, 1 - Math.exp(-12 * dt));
  const cp = Math.cos(cam.pitch);
  camera.position.set(
    cam.target.x + Math.sin(cam.yaw) * cp * cam.dist,
    cam.target.y + Math.sin(cam.pitch) * cam.dist,
    cam.target.z + Math.cos(cam.yaw) * cp * cam.dist,
  );
  if (S.shake > 0) {
    S.shake = Math.max(0, S.shake - dt * 1.6);
    camera.position.x += (Math.random() - 0.5) * S.shake * 0.8;
    camera.position.y += (Math.random() - 0.5) * S.shake * 0.8;
  }
  const fov = P.dashT > 0 ? 80 : 65;
  if (Math.abs(camera.fov - fov) > 0.1) { camera.fov = lerp(camera.fov, fov, Math.min(1, 12 * dt)); camera.updateProjectionMatrix(); }
  camera.lookAt(cam.target);
  sun.position.set(P.pos.x + 22, P.pos.y + 40, P.pos.z + 16);
  sun.target.position.copy(P.pos);
}

// ---------- grapple ----------
const camDir = new THREE.Vector3();
function pickAnchor() {
  camera.getWorldDirection(camDir);
  let best = null, bestScore = Infinity;
  for (const a of S.anchors) {
    const v = a.mesh.position.clone().sub(new THREE.Vector3(P.pos.x, P.pos.y + 0.45, P.pos.z));
    const d = v.length();
    if (d > 24 || d < 2.5) continue;
    const dot = v.divideScalar(d).dot(camDir);
    if (dot < -0.1) continue;
    const score = d - dot * 12;
    if (score < bestScore) { bestScore = score; best = a; }
  }
  return best;
}
function doGrapple() {
  if (S.mode !== 'play' || P.grap || P.grapCD > 0) return;
  const a = pickAnchor();
  if (!a) { toast('No golden ring in reach.', 1000); return; }
  P.grap = { a, t: 0 };
  P.grapCD = 0.8; P.dashT = 0;
  sfx.grapple();
}
function updateGrapple() {
  const target = P.grap ? P.grap.a : pickAnchor();
  for (const a of S.anchors) a.mesh.userData.ring.scale.setScalar(a === target ? 1.5 + Math.sin(S.clock * 8) * 0.12 : 1);
  if (P.grap) {
    const p = rope.geometry.attributes.position;
    p.setXYZ(0, P.pos.x, P.pos.y + 0.5, P.pos.z);
    const a = P.grap.a.mesh.position;
    p.setXYZ(1, a.x, a.y, a.z);
    p.needsUpdate = true;
    rope.visible = true;
  } else rope.visible = false;
}

// ---------- rising Gloom ----------
function updateTide(dt) {
  const t = S.tide;
  if (!t) return;
  if (t.paused > 0) t.paused -= dt; else t.y += t.speed * dt;
  t.mesh.position.set(camera.position.x, t.y, camera.position.z);
  if (Math.random() < 0.9) emit(camera.position.x + (Math.random() - 0.5) * 50, t.y + 0.2, camera.position.z + (Math.random() - 0.5) * 50, 0x8a4cff, 1, 0.5, 1.2, -4);
  if (P.pos.y + 0.3 < t.y) {
    damage(P.pos.x + 0.01, P.pos.z);
    if (S.mode === 'play') P.vel.y = 9;
  }
  if (S.time < 12) voiceOnce('tide', 'It is rising, Ember. The Gloom is climbing the stair behind you. RUN.');
}

// ---------- voice ----------
let voiceTimeout = 0;
function voice(text) {
  const el = $('voice');
  el.innerHTML = `<b>CINDER</b>${text}`;
  el.style.opacity = 1;
  clearTimeout(voiceTimeout);
  voiceTimeout = setTimeout(() => { el.style.opacity = 0; }, 6500);
}
function voiceOnce(key, text) {
  if (S.trial || S.voiceDone.has(key) || S.mode !== 'play') return;
  S.voiceDone.add(key);
  voice(text);
}
function checkVoice() {
  if (S.trial) return;
  const L = LEVELS[S.level];
  (L.voice || []).forEach((v, i) => {
    if (S.maxIdx / L.count >= v.at && !S.voiceDone.has('lv' + i)) { S.voiceDone.add('lv' + i); voice(v.text); }
  });
}

// ---------- ghost ----------
function loadGhost(idx) {
  try { return JSON.parse(localStorage.getItem('lastEmber.ghost.' + idx) || 'null'); } catch { return null; }
}
function updateGhost(dt) {
  S.recT += dt;
  while (S.recT >= 0.1) {
    S.recT -= 0.1;
    S.rec.push(Math.round(P.pos.x * 20) / 20, Math.round(P.pos.y * 20) / 20, Math.round(P.pos.z * 20) / 20);
  }
  const g = S.ghost;
  if (!g) return;
  const f = S.time / 0.1, i = Math.floor(f), k = f - i, n = g.t.length / 3;
  if (i + 1 >= n) { g.mesh.visible = false; return; }
  const a = i * 3, b = a + 3;
  g.mesh.position.set(lerp(g.t[a], g.t[b], k), lerp(g.t[a + 1], g.t[b + 1], k), lerp(g.t[a + 2], g.t[b + 2], k));
}

// ---------- lightning ----------
function updateLightning(dt) {
  const th = LEVELS[S.level].theme;
  if (th !== 'library' && th !== 'night' && th !== 'flood') return;
  S.lightT -= dt;
  if (S.lightT <= 0) {
    S.lightT = 7 + Math.random() * 9;
    S.flashK = 1;
    setTimeout(() => { if (S.mode !== 'title') sfx.thunder(); }, 350 + Math.random() * 500);
  }
  if (S.flashK > 0) {
    S.flashK = Math.max(0, S.flashK - dt * 3);
    const f = Math.pow(S.flashK, 2) * (0.6 + 0.4 * Math.sin(S.clock * 60));
    hemi.intensity = 0.9 + f * 3.2;
    scene.background.copy(S.skyBase).lerp(new THREE.Color(0xdde6ff), f * 0.4);
    scene.fog.color.copy(scene.background);
  }
}

// ---------- gamepad and touch ----------
const padPrev = [];
function pollPad(dt) {
  const list = navigator.getGamepads ? [...navigator.getGamepads()] : [];
  const gp = list.find((p) => p && p.connected);
  if (!gp) { PAD.mx = PAD.my = 0; PAD.jump = false; return; }
  const dz = (v) => (Math.abs(v) < 0.2 ? 0 : v);
  PAD.mx = dz(gp.axes[0] || 0); PAD.my = dz(gp.axes[1] || 0);
  const rx = dz(gp.axes[2] || 0), ry = dz(gp.axes[3] || 0);
  if (S.mode === 'play') lookBy(rx * 2.8 * dt, ry * 2 * dt);
  const down = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);
  if (S.mode === 'play') zoomBy(((gp.buttons[7] ? gp.buttons[7].value : 0) - (gp.buttons[6] ? gp.buttons[6].value : 0)) * 6 * dt);
  const edge = (i) => { const now = down(i), was = padPrev[i]; padPrev[i] = now; return now && !was; };
  PAD.jump = down(0);
  const e0 = edge(0), e1 = edge(1), e2 = edge(2), e3 = edge(3), e4 = edge(4), e5 = edge(5), e9 = edge(9);
  if (S.mode === 'play') {
    if (e0) P.jumpBuf = 0.14;
    if (e1 || e5) doDash();
    if (e2 || e4) doFlare();
    if (e3) doGrapple();
    if (e9) pauseGame();
  } else if (S.mode === 'paused' && e9) resumeGame();
  else if (S.mode === 'card' && (e0 || e9)) $('cardBtn').click();
  else if (S.mode === 'title' && e0 && $('title').classList.contains('show')) ($('btnContinue').style.display !== 'none' ? $('btnContinue') : $('btnStart')).click();
}

const isTouch = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
let touchShown = false;
if (isTouch) {
  const stick = $('tStick'), knob = stick.firstElementChild;
  let stickId = null;
  const moveStick = (t) => {
    const r = stick.getBoundingClientRect();
    let dx = (t.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (t.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    TOUCH.mx = dx; TOUCH.my = dy;
    knob.style.transform = `translate(${dx * 40}px, ${dy * 40}px)`;
  };
  const resetStick = () => { stickId = null; TOUCH.mx = TOUCH.my = 0; knob.style.transform = ''; };
  stick.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); stickId = e.changedTouches[0].identifier; moveStick(e.changedTouches[0]); }, { passive: false });
  stick.addEventListener('touchmove', (e) => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === stickId) moveStick(t); }, { passive: false });
  for (const ev of ['touchend', 'touchcancel']) stick.addEventListener(ev, (e) => { for (const t of e.changedTouches) if (t.identifier === stickId) resetStick(); });
  const btn = (id, down, up) => {
    const el = $(id);
    el.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); down(); }, { passive: false });
    if (up) for (const ev of ['touchend', 'touchcancel']) el.addEventListener(ev, up);
  };
  btn('tJump', () => { TOUCH.jump = true; P.jumpBuf = 0.14; }, () => { TOUCH.jump = false; });
  btn('tDash', () => doDash());
  btn('tFlare', () => doFlare());
  btn('tGrap', () => doGrapple());
  btn('tPause', () => pauseGame());
  let look = null, pinch = 0;
  const pinchDist = (e) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  canvas.addEventListener('touchstart', (e) => { if (e.touches.length === 2) pinch = pinchDist(e); initAudio(); const t = e.changedTouches[0]; look = { id: t.identifier, x: t.clientX, y: t.clientY }; }, { passive: true });
  canvas.addEventListener('touchend', (e) => { if (e.touches.length < 2) pinch = 0; }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && pinch && S.mode === 'play') { const d = pinchDist(e); zoomBy((pinch - d) * 0.03); pinch = d; return; }
    if (!look || S.mode !== 'play') return;
    for (const t of e.changedTouches) if (t.identifier === look.id) {
      lookBy((t.clientX - look.x) * 0.006, (t.clientY - look.y) * 0.005);
      look.x = t.clientX; look.y = t.clientY;
    }
  }, { passive: true });
}

// ---------- HUD ----------
const hudCache = [];
function setText(i, el, text, html = false) {
  if (hudCache[i] !== text) { hudCache[i] = text; if (html) el.innerHTML = text; else el.textContent = text; }
}
const bossBar = document.createElement('div');
bossBar.style.cssText = 'position:absolute;left:50%;top:78px;width:340px;margin-left:-170px;height:12px;border:1px solid #ff7ad9aa;border-radius:6px;overflow:hidden;background:#0008;display:none';
bossBar.innerHTML = '<i style="display:block;height:100%;width:100%;background:linear-gradient(90deg,#7a2cff,#ff7ad9)"></i>';
$('hud').appendChild(bossBar);

function updateHUD() {
  setText(0, $('hearts'), '♥'.repeat(Math.max(0, S.hearts)) + '♡'.repeat(Math.max(0, 5 - S.hearts)));
  setText(1, $('shards'), `◆ ${S.shardsGot} / ${S.shardsTotal}`);
  setText(2, $('embers'), `✦ ${S.embersGot}`);
  const t = Math.floor(S.time);
  setText(3, $('time'), `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`);
  $('flare').firstElementChild.style.width = `${(1 - P.flareCD / 3) * 100}%`;
  $('glide').firstElementChild.style.width = `${(P.glideT / 1.6) * 100}%`;
  $('dash').firstElementChild.style.width = `${P.dashes > 0 || P.grounded ? (1 - P.dashCD / 0.9) * 100 : 0}%`;
  const lines = Object.keys(P.fx).filter((k) => P.fx[k] > 0)
    .map((k) => `<span style="color:#${POWER[k].color.toString(16).padStart(6, '0')}">${POWER[k].label} ${Math.ceil(P.fx[k])}</span>`);
  if (S.tide) lines.push(`<span style="color:#b48cff">GLOOM ${Math.max(0, Math.round(P.pos.y - S.tide.y))} m below</span>`);
  if (S.goldenFlame) lines.push('<span style="color:#ffe14a">GOLDEN FLAME</span>');
  const fxText = lines.join('<br>');
  setText(4, $('fx'), fxText, true);
  const b = S.boss;
  bossBar.style.display = b && b.awake ? 'block' : 'none';
  if (b) bossBar.firstElementChild.style.width = `${(Math.max(0, b.hp) / b.maxHp) * 100}%`;
}

let toastTimeout = 0;
function toast(text, ms = 2000) {
  const el = $('toast');
  el.textContent = text;
  el.style.opacity = 1;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { el.style.opacity = 0; }, ms);
}
let loreTimeout = 0;
function showLore(text) {
  const el = $('lore');
  const n = getDiary().length;
  el.innerHTML = `<b>THE KEEPER'S DIARY - PAGE ${n} OF ${LEVELS.length}</b>${text}`;
  el.style.opacity = 1;
  clearTimeout(loreTimeout);
  loreTimeout = setTimeout(() => { el.style.opacity = 0; }, 11000);
}
function flashRed() {
  const f = $('flash');
  f.style.transition = 'none'; f.style.opacity = 1;
  requestAnimationFrame(() => { f.style.transition = 'opacity .5s'; f.style.opacity = 0; });
}

// ---------- saves ----------
const getDiary = () => { try { return JSON.parse(localStorage.getItem('lastEmber.diary') || '[]'); } catch { return []; } };
function saveDiary(level) {
  const d = new Set(getDiary()); d.add(level);
  localStorage.setItem('lastEmber.diary', JSON.stringify([...d]));
}
const getBest = () => { try { return JSON.parse(localStorage.getItem('lastEmber.best') || '{}'); } catch { return {}; } };

// ---------- cards / flow ----------
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const starText = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
const getUnlocked = () => parseInt(localStorage.getItem('lastEmber.unlocked') || '0', 10);
function unlock(n) {
  const v = Math.min(n, LEVELS.length - 1);
  if (v > getUnlocked()) localStorage.setItem('lastEmber.unlocked', String(v));
}

function showCard({ top, title, body, button = 'Continue', onDone, extra, button2, onDone2 }) {
  $('cardTop').textContent = top || '';
  $('cardTitle').textContent = title || '';
  $('cardBody').innerHTML = body.map((p) => `<p>${p}</p>`).join('') + (extra ? `<small>${extra}</small>` : '');
  const btn = $('cardBtn'), b2 = $('cardBtn2');
  btn.textContent = button;
  b2.style.display = button2 ? '' : 'none';
  if (button2) b2.textContent = button2;
  $('card').classList.add('show');
  $('hud').style.display = 'none';
  $('lore').style.opacity = 0;
  $('voice').style.opacity = 0;
  S.mode = 'card';
  const close = (fn) => () => { $('card').classList.remove('show'); btn.onclick = null; b2.onclick = null; fn?.(); };
  btn.onclick = close(onDone);
  b2.onclick = close(onDone2);
}

function beginPlay(withHint = true) {
  S.mode = 'play';
  $('hud').style.display = 'block';
  $('trialTag').textContent = S.trial ? `TIME TRIAL${S.ghost ? ' · GHOST ON' : ''}` : '';
  startMusic(ROOTS[S.level], true);
  if (withHint) toast(LEVELS[S.level].hint, 5000);
}

function pauseGame() {
  if (S.mode !== 'play') return;
  S.mode = 'paused';
  for (const k in keys) keys[k] = false;
  TOUCH.jump = false;
  stopMusic();
  document.exitPointerLock?.();
  $('pauseLevel').textContent = `${LEVELS[S.level].realm} - ${LEVELS[S.level].name}${S.trial ? ' - time trial' : ''}`;
  $('pause').classList.add('show');
}
function resumeGame() {
  if (S.mode !== 'paused') return;
  $('pause').classList.remove('show');
  $('help').classList.remove('show');
  S.mode = 'play';
  startMusic(ROOTS[S.level], true);
  if (!isTouch) canvas.requestPointerLock?.();
}
function toMenu(select = false) {
  $('pause').classList.remove('show');
  $('help').classList.remove('show');
  $('card').classList.remove('show');
  showTitle();
  if (select) openSelect();
}
$('btnResume').onclick = resumeGame;
$('btnMute').onclick = () => { $('btnMute').textContent = toggleMute() ? 'Unmute' : 'Mute'; };
$('btnPauseSelect').onclick = () => toMenu(true);
let helpFrom = 'title';
function openHelp(from) {
  helpFrom = from;
  $(from).classList.remove('show');
  $('help').classList.add('show');
}
$('btnHelp').onclick = () => openHelp('title');
$('btnPauseHelp').onclick = () => openHelp('pause');
$('btnHelpBack').onclick = () => { $('help').classList.remove('show'); $(helpFrom).classList.add('show'); };
$('btnPauseMenu').onclick = () => toMenu(false);

let settingsFrom = 'title';
function openSettings(from) {
  settingsFrom = from;
  $(from).classList.remove('show');
  $('settings').classList.add('show');
}
$('btnSettings').onclick = () => openSettings('title');
$('btnPauseSettings').onclick = () => openSettings('pause');
$('btnSettingsBack').onclick = () => { $('settings').classList.remove('show'); $(settingsFrom).classList.add('show'); };
const syncSettings = () => {
  $('setSens').value = CFG.sens; $('setVol').value = CFG.volume; $('setInvert').checked = CFG.invertY; $('setQuality').value = CFG.quality;
  $('setSensVal').textContent = CFG.sens.toFixed(1) + 'x'; $('setVolVal').textContent = Math.round(CFG.volume * 100) + '%';
};
$('setSens').oninput = (e) => { CFG.sens = parseFloat(e.target.value); saveCfg(); syncSettings(); };
$('setVol').oninput = (e) => { CFG.volume = parseFloat(e.target.value); setVolume(CFG.volume); saveCfg(); syncSettings(); };
$('setInvert').onchange = (e) => { CFG.invertY = e.target.checked; saveCfg(); };
$('setQuality').onchange = (e) => { CFG.quality = e.target.value; saveCfg(); applyQuality(); };
setVolume(CFG.volume);
syncSettings();

const canFullscreen = !!document.documentElement.requestFullscreen;
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});
}
if (!canFullscreen) { $('btnFull').style.display = 'none'; $('tFull').style.display = 'none'; }
$('btnFull').onclick = toggleFullscreen;
$('tFull').addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', () => { $('btnFull').textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen'; });
$('tPause')?.addEventListener('click', pauseGame);

function startLevel(idx) {
  S.trial = false;
  loadLevel(idx);
  const L = LEVELS[idx];
  showCard({ top: L.realm, title: L.name, body: L.intro, button: 'Enter', onDone: () => beginPlay() });
}

function startTrial(idx) {
  $('select').classList.remove('show');
  $('title').classList.remove('show');
  S.trial = true;
  loadLevel(idx);
  beginPlay(false);
  toast(S.ghost ? 'Time trial: race your best ghost!' : 'Time trial: set your first ghost!', 3500);
}

function openSelect() {
  const grid = $('selectGrid');
  grid.innerHTML = '';
  grid.className = 'lvgrid';
  const best = getBest(), un = getUnlocked();
  LEVELS.forEach((L, i) => {
    const b = best[i], locked = i > un;
    const el = document.createElement('button');
    el.className = 'lv';
    el.disabled = locked;
    el.innerHTML = `<span class="num">${String(i + 1).padStart(2, '0')}</span><span class="realm">${L.realm}</span><span class="name">${L.name}</span>`
      + `<span class="stars">${locked ? 'Locked' : b ? starText(b.stars) + (b.gold ? ' ✦' : '') : '☆☆☆'}</span>`
      + `<span class="meta">${b ? fmt(b.time) : ''}${loadGhost(i) ? ' · ghost' : ''}</span>`;
    el.onclick = () => startTrial(i);
    grid.appendChild(el);
  });
  $('title').classList.remove('show');
  $('select').classList.add('show');
}
$('btnSelect').onclick = () => { initAudio(); openSelect(); };
$('btnSelectBack').onclick = () => { $('select').classList.remove('show'); $('title').classList.add('show'); };

function completeLevel() {
  S.mode = 'card';
  document.exitPointerLock?.();
  stopMusic();
  sfx.portal();
  const L = LEVELS[S.level];
  const t = Math.floor(S.time);
  const pct = S.embersGot / S.embersTotal;
  const stars = 1 + (S.time <= L.par ? 1 : 0) + (pct >= 0.75 ? 1 : 0);
  const best = getBest();
  const prev = best[S.level];
  const gold = S.goldenFlame || !!(prev && prev.gold);
  if (!prev || stars > prev.stars || (stars === prev.stars && t < prev.time)) best[S.level] = { stars, time: t, gold };
  else if (gold) prev.gold = true;
  localStorage.setItem('lastEmber.best', JSON.stringify(best));
  const g = loadGhost(S.level);
  const newBest = !g || S.time < g.time;
  if (newBest) { try { localStorage.setItem('lastEmber.ghost.' + S.level, JSON.stringify({ time: S.time, t: S.rec })); } catch { /* storage full */ } }
  const stats = `<span style="font-size:26px;color:#ffd27a;letter-spacing:6px">${starText(stars)}${S.goldenFlame ? ' ✦' : ''}</span><br>`
    + `Shards ${S.shardsGot}/${S.shardsTotal} &nbsp;·&nbsp; Embers ${S.embersGot}/${S.embersTotal} &nbsp;·&nbsp; Time ${fmt(t)} (par ${fmt(L.par)}) &nbsp;·&nbsp; Hearts lost ${S.heartsLost}`
    + `<br>Diary page ${S.secretFound || getDiary().includes(S.level) ? 'found' : 'not found yet'} &nbsp;·&nbsp; Golden Flame ${S.goldenFlame ? 'claimed' : 'not claimed'}`
    + '<br>Stars: 1 for finishing, 1 for beating par, 1 for 75% of the embers';
  if (S.trial) {
    showCard({
      top: 'Time trial', title: L.name,
      body: [newBest ? 'A new best time! Your ghost has been updated.' : 'Your best ghost is still faster. Try again?'],
      extra: stats, button: 'Level select', onDone: () => toMenu(true), button2: 'Retry', onDone2: () => startTrial(S.level),
    });
    return;
  }
  if (S.isHearth) {
    unlock(LEVELS.length - 1);
    const diary = getDiary().length;
    const finish = (kind) => {
      const tier = [...DIARY_TIERS].reverse().find((t) => diary >= t.min);
      const body = [...ENDINGS[kind].body, tier.text];
      showCard({ ...ENDINGS[kind], body, button: 'The End', extra: `${stats}<br>Diary pages found: ${diary}/${LEVELS.length}`, onDone: () => { localStorage.removeItem('lastEmber.level'); showTitle(); } });
    };
    showCard({ ...CHOICE, button: CHOICE.together, onDone: () => finish('together'), button2: CHOICE.become, onDone2: () => finish('become') });
    return;
  }
  const next = S.level + 1;
  localStorage.setItem('lastEmber.level', String(next));
  unlock(next);
  showCard({
    top: `${L.realm} complete`, title: L.name, body: S.secretFound || getDiary().includes(S.level) ? [...L.outro, `<small style="color:#ffd27a">Echo.</small> ${L.echo}`] : L.outro, button: 'Onward', extra: stats,
    onDone: () => startLevel(next),
  });
}

function showTitle() {
  S.mode = 'title';
  S.trial = false;
  stopMusic();
  $('hud').style.display = 'none';
  $('select').classList.remove('show');
  loadLevel(0);
  $('title').classList.add('show');
  const saved = parseInt(localStorage.getItem('lastEmber.level') || '0', 10);
  const cont = $('btnContinue');
  cont.style.display = saved > 0 && saved < LEVELS.length ? '' : 'none';
  $('btnStart').className = cont.style.display === 'none' ? 'primary' : '';
  cont.textContent = saved > 0 ? `Continue - ${LEVELS[Math.min(saved, LEVELS.length - 1)].name}` : 'Continue';
  $('btnSelect').style.display = getUnlocked() > 0 || Object.keys(getBest()).length ? '' : 'none';
}

$('btnStart').onclick = () => {
  initAudio();
  $('title').classList.remove('show');
  localStorage.removeItem('lastEmber.level');
  localStorage.removeItem('lastEmber.diary');
  showCard({ ...PROLOGUE, button: 'Light the way', onDone: () => startLevel(0) });
};
$('btnContinue').onclick = () => {
  initAudio();
  $('title').classList.remove('show');
  const idx = clamp(parseInt(localStorage.getItem('lastEmber.level') || '0', 10), 0, LEVELS.length - 1);
  unlock(idx);
  startLevel(idx);
};

// ---------- main loop ----------
let last = performance.now();
let slowTime = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const raw = (now - last) / 1000;
  if (CFG.quality === 'auto' && S.mode === 'play' && !document.hidden) {
    slowTime = Math.max(0, slowTime + (raw > 0.034 ? raw : -raw * 2));
    if (slowTime > 2 && autoRatio > 0.75) { autoRatio = Math.max(0.75, autoRatio - 0.25); slowTime = 0; applyQuality(); }
  }
  const dt = Math.min(raw, 0.05);
  last = now;
  pollPad(dt);
  const showTouch = isTouch && S.mode === 'play';
  if (showTouch !== touchShown) { touchShown = showTouch; $('touch').style.display = showTouch ? 'block' : 'none'; }
  if (S.mode === 'paused') { renderer.render(scene, camera); return; }
  S.clock += dt;
  updateMoving(dt);
  syncAttached(S.clock);
  if (S.mode === 'play') {
    S.time += dt;
    stepPlayer(dt);
    updatePickups(dt);
    updatePads(dt);
    updateHazards(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateBoss(dt);
    updateGrapple();
    updateTide(dt);
    updateGhost(dt);
    updateGust();
    if (!S.voiceDone.has('lumen')) {
      for (const p of S.plats) if (p.type === 'lumen' && p.lit <= 0 && Math.hypot(p.x - P.pos.x, p.z - P.pos.z) < 15) { voiceOnce('lumen', 'Strange. These bridges only exist where there is light. Use your Flare.'); break; }
    }
    updateHUD();
  } else if (S.mode === 'title') {
    cam.yaw += dt * 0.12;
    player.position.copy(P.pos);
  }
  updatePortal(dt);
  updateRings(dt);
  updateAnim(dt);
  updateLightning(dt);
  updateParticles(dt);
  updateWeather(dt);
  const f = 0.8 + Math.sin(S.clock * 12) * 0.12 + Math.sin(S.clock * 7.3) * 0.08;
  flame.scale.set(f, 0.8 + f * 0.4, f);
  updateCamera(dt);
  renderer.render(scene, camera);
}

showTitle();
$('loading').style.display = 'none';
requestAnimationFrame(frame);
