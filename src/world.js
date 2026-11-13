import * as THREE from 'three';

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export function mulberry(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const exit = (s, h) => s / 2 / Math.max(Math.abs(Math.cos(h)), Math.abs(Math.sin(h)));

export function generate(L, idx) {
  const R = mulberry(idx * 7919 + 101);
  const plats = [];
  const mkObj = (o) => {
    const p = Object.assign({ x: 0, y: 0, z: 0, w: 6, d: 6, th: 1.2, type: 'solid', state: 'idle', timer: 0, dx: 0, dy: 0, dz: 0, fallV: 0 }, o);
    p.bx = p.x; p.by = p.y; p.bz = p.z;
    return p;
  };
  const mk = (o) => { const p = mkObj(o); plats.push(p); return p; };
  mk({ w: 8, d: 8 });
  let x = 0, y = 0, z = 0, h = 0, prevS = 8;
  for (let i = 1; i <= L.count; i++) {
    const last = i === L.count;
    const s = last ? (L.endSize || 9) : lerp(L.size[0], L.size[1], R());
    h = clamp(h + (R() - 0.5) * L.lateral * 2, -0.9, 0.9);
    const gap = lerp(L.gap[0], L.gap[1], R());
    const dist = exit(prevS, h) + exit(s, h) + gap;
    x += Math.sin(h) * dist;
    z -= Math.cos(h) * dist;
    y = clamp(y + lerp(L.dy[0], L.dy[1], R()), -2, 40);
    let type = 'solid';
    if (!last && i >= 2) {
      const r = R();
      const a1 = L.moving, a2 = a1 + L.ice, a3 = a2 + L.crumble, a4 = a3 + (L.blink || 0), a5 = a4 + (L.lumen || 0);
      if (r < a1) type = 'moving';
      else if (r < a2) type = 'ice';
      else if (r < a3) type = 'crumble';
      else if (r < a4 && plats[plats.length - 1].type !== 'blink') type = 'blink';
      else if (r >= a4 && r < a5 && plats[plats.length - 1].type !== 'lumen') type = 'lumen';
    }
    const size = type === 'moving' ? Math.max(s, 4.4) : s;
    const p = mk({ x, y, z, w: size, d: size, type, heading: h });
    if (type === 'moving') {
      const vertical = R() < 0.3;
      p.axis = vertical ? { x: 0, y: 1, z: 0 } : { x: Math.cos(h), y: 0, z: Math.sin(h) };
      p.amp = vertical ? 0.9 : 2.3;
      p.spd = 0.8 + R() * 0.5;
      p.phase = R() * 6.28;
      const s0 = Math.sin(p.phase) * p.amp;
      p.x = p.bx + p.axis.x * s0; p.y = p.by + p.axis.y * s0; p.z = p.bz + p.axis.z * s0;
    }
    if (type === 'blink') p.phase = R() * 4.2;
    if (type === 'lumen') p.lit = 0;
    prevS = size;
  }

  const secrets = [];
  const order = [];
  if (!L.noSecret) for (let i = 3; i <= L.count - 2; i++) order.push(i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const free = (cx, cz) => plats.every((q, qi) => {
    const lim = q.w / 2 + 2.4 + 0.6 + (q.type === 'moving' ? 2.6 : 0);
    return qi === k0 || !(Math.abs(cx - q.bx) < lim && Math.abs(cz - q.bz) < lim);
  });
  let k0 = -1;
  for (const k of order) {
    k0 = k;
    const base = plats[k];
    if (base.type !== 'solid' && base.type !== 'ice') continue;
    const side = R() < 0.5 ? 1 : -1;
    let done = false;
    for (const sd of [side, -side]) {
      const dist = base.w / 2 + 2.9 + 1.7;
      const cx = base.x + Math.cos(base.heading) * dist * sd, cz = base.z + Math.sin(base.heading) * dist * sd;
      if (free(cx, cz)) {
        secrets.push(mkObj({ x: cx, y: base.y + 0.6, z: cz, w: 3.4, d: 3.4, secret: true }));
        done = true;
        break;
      }
    }
    if (done) break;
  }
  return { plats, secrets, R };
}

function makeMaterial(color, emissive = 0, ei = 0, rough = 0.8) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, emissive: emissive || 0x000000, emissiveIntensity: ei });
}

export function makePlatformMesh(P, L) {
  const g = new THREE.Group();
  let rock = L.rock, top = L.top, rough = 0.9, ei = 0.12;
  if (P.type === 'ice') { rock = 0x7fb8dd; top = 0xe9fbff; rough = 0.12; }
  if (P.type === 'crumble') { rock = 0x5a3a2a; top = 0xb9774a; ei = 0.05; }
  if (P.type === 'moving') { rock = 0x39455a; top = L.glow; ei = 0.7; }
  if (P.type === 'blink') { rock = 0x3a2f5a; top = L.glow; ei = 0.9; }
  if (P.type === 'lumen') { rock = 0xcfc8ff; top = 0xffffff; ei = 0.9; }
  if (P.secret) { top = 0xffd27a; ei = 0.5; }
  const rockMat = makeMaterial(rock, 0, 0, rough);
  const body = new THREE.Mesh(new THREE.BoxGeometry(P.w, P.th, P.d), rockMat);
  body.position.y = -P.th / 2;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(P.w + 0.12, 0.2, P.d + 0.12), makeMaterial(top, top, ei, 0.6));
  slab.position.y = -0.08;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(Math.min(P.w, P.d) * 0.48, 2.2 + Math.min(P.w, P.d) * 0.4, 6), rockMat);
  cone.rotation.x = Math.PI;
  cone.position.y = -P.th - cone.geometry.parameters.height / 2 + 0.05;
  for (const m of [body, slab, cone]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
  g.position.set(P.x, P.y, P.z);
  if (P.type === 'lumen') {
    rockMat.transparent = true; slab.material.transparent = true;
    g.userData.mats = [rockMat, slab.material];
  }
  return g;
}

function glowTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
export const GLOW = glowTex();

export function makeShard(color) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xffa030, emissiveIntensity: 1.6, roughness: 0.2 }));
  m.scale.set(0.75, 1.2, 0.75);
  g.add(m);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  halo.scale.set(3.2, 3.2, 1);
  g.add(halo);
  g.userData.core = m;
  return g;
}

export function makeEmber(color) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe0a0 }));
  g.add(m);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  halo.scale.set(1.1, 1.1, 1);
  g.add(halo);
  return g;
}

export function makeWisp(boss) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), new THREE.MeshStandardMaterial({ color: 0x120a24, emissive: 0x3a1070, emissiveIntensity: 0.9, roughness: 0.6 }));
  g.add(core);
  for (let i = 0; i < 5; i++) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.7, 6), core.material);
    const a = (i / 5) * Math.PI * 2;
    t.position.set(Math.cos(a) * 0.35, 0.45, Math.sin(a) * 0.35);
    t.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
    g.add(t);
  }
  const eyeMat = new THREE.MeshBasicMaterial({ color: boss ? 0xff7ad9 : 0xe6c8ff });
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), eyeMat);
    e.position.set(sx * 0.18, 0.08, -0.42);
    g.add(e);
  }
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0x7a2cff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6 }));
  halo.scale.set(2.6, 2.6, 1);
  g.add(halo);
  g.traverse((o) => { o.castShadow = false; });
  return g;
}

export function makeBoss() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x0c0618, emissive: 0x5a1280, emissiveIntensity: 0.9, roughness: 0.4 });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 1), mat);
  g.add(core);
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(3.2 + i * 0.5, 0.07, 8, 64), new THREE.MeshBasicMaterial({ color: i === 1 ? 0xff7ad9 : 0xa86bff }));
    r.rotation.set(i * 1.0, i * 0.6, 0);
    g.add(r); rings.push(r);
  }
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff7ad9 });
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), eyeMat);
    e.position.set(sx * 0.8, 0.3, -2.0);
    core.add(e);
  }
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0x9a30ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.7 }));
  halo.scale.set(14, 14, 1);
  g.add(halo);
  g.userData = { core, rings, mat, halo };
  return g;
}

export function makePortal(color) {
  const g = new THREE.Group();
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x555566, emissive: color, emissiveIntensity: 0, roughness: 0.3 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.16, 12, 48), ringMat);
  ring.position.y = 1.9;
  g.add(ring);
  const discMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.45, 32), discMat);
  disc.position.y = 1.9;
  g.add(disc);
  const light = new THREE.PointLight(color, 0, 20);
  light.position.y = 2;
  g.add(light);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.6, 0.3, 24), new THREE.MeshStandardMaterial({ color: 0x3a3a48, roughness: 0.7 }));
  pedestal.position.y = 0.15;
  g.add(pedestal);
  g.userData = { ringMat, discMat, light, ring };
  return g;
}

export function makeHearth() {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x4a3f44, roughness: 0.9 });
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, 1.1, 20), stone);
  bowl.position.y = 0.55;
  g.add(bowl);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.14, 8, 32), stone);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.1;
  g.add(rim);
  const flames = new THREE.Group();
  flames.position.y = 1.1;
  const fm = new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.7 - i * 0.12, 2.2 + i * 0.5, 10), fm);
    c.position.y = (2.2 + i * 0.5) / 2;
    c.position.x = Math.sin(i * 2) * 0.3;
    c.position.z = Math.cos(i * 2) * 0.3;
    flames.add(c);
  }
  g.add(flames);
  const light = new THREE.PointLight(0xffa040, 0, 40);
  light.position.y = 2.6;
  g.add(light);
  g.userData = { flames, light, fm };
  flames.scale.setScalar(0.001);
  return g;
}

export function makeKeeper() {
  const g = new THREE.Group();
  const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.5, 12), new THREE.MeshStandardMaterial({ color: 0x3a2f5a, roughness: 0.9 }));
  cloak.position.y = 0.75;
  g.add(cloak);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), new THREE.MeshStandardMaterial({ color: 0xf0d2b4, roughness: 0.8 }));
  head.position.y = 1.65;
  g.add(head);
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffe0a0 }));
  lantern.position.set(0.5, 0.8, -0.3);
  g.add(lantern);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xffb060, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  halo.scale.set(3, 3, 1);
  halo.position.copy(lantern.position);
  g.add(halo);
  const light = new THREE.PointLight(0xffb060, 1.5, 12);
  light.position.copy(lantern.position);
  g.add(light);
  return g;
}

export function makeDecor(L, plats, R, anim) {
  const g = new THREE.Group();
  const lavaY = Math.min(...plats.map((p) => p.by)) - 14;
  const n = L.theme === 'boss' ? 70 : 90;
  let placed = 0, tries = 0;
  while (placed < n && tries < n * 6) {
    tries++;
    const base = plats[Math.floor(R() * plats.length)];
    const a = R() * Math.PI * 2, d = 12 + R() * 48;
    const x = base.bx + Math.cos(a) * d, z = base.bz + Math.sin(a) * d;
    let tooClose = false;
    for (const p of plats) if (Math.hypot(p.bx - x, p.bz - z) < 11) { tooClose = true; break; }
    if (tooClose) continue;
    const o = decorPiece(L, R, lavaY, anim);
    o.position.x = x; o.position.z = z;
    o.rotation.y = R() * 6;
    g.add(o); placed++;
  }
  return g;
}

function decorPiece(L, R, lavaY, anim) {
  const g = new THREE.Group();
  const baseY = (a, b) => lerp(a, b, R());
  if (L.theme === 'forest') {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 40, 6), makeMaterial(0x4a3426));
    trunk.position.y = -20;
    g.add(trunk);
    const green = makeMaterial(0x2f7a45, 0x143a20, 0.4);
    const s = 0.8 + R() * 0.9;
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(new THREE.ConeGeometry((3.4 - i * 0.8) * s, 4 * s, 7), green);
      c.position.y = (1.5 + i * 2.4) * s;
      g.add(c);
    }
    g.position.y = baseY(-8, 2);
  } else if (L.theme === 'ice') {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(1.6), new THREE.MeshStandardMaterial({ color: 0x9be8ff, emissive: 0x2a8fb0, emissiveIntensity: 0.5, transparent: true, opacity: 0.8, roughness: 0.1 }));
    m.scale.set(1, 2.5 + R() * 4, 1);
    g.add(m);
    g.position.y = baseY(-10, 8);
  } else if (L.theme === 'lava') {
    const h = 20 + R() * 30;
    const m = new THREE.Mesh(new THREE.ConeGeometry(2.5 + R() * 2.5, h, 5), makeMaterial(0x2a1c1c, 0xff4a10, 0.25));
    m.position.y = h / 2;
    g.add(m);
    g.position.y = lavaY - 2 + R() * 6;
  } else if (L.theme === 'library') {
    if (R() < 0.45) {
      const h = 20 + R() * 25;
      const m = new THREE.Mesh(new THREE.BoxGeometry(2.5 + R() * 3, h, 1.2), makeMaterial(0x1d3a44, 0x0d4a52, 0.35));
      m.position.y = h / 2;
      g.add(m);
      g.position.y = lavaY - 2;
    } else {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 1), makeMaterial(0x0f5a5a, 0x4af0d8, 1));
      g.add(m);
      g.position.y = baseY(-6, 14);
      anim.push({ mesh: g, spin: 0.3 + R() * 0.5, bob: R() * 6, baseY: g.position.y });
    }
  } else if (L.theme === 'glass') {
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xffc8f0, emissive: 0xc060b0, emissiveIntensity: 0.5, transparent: true, opacity: 0.7, roughness: 0.1 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 40, 6), glassMat);
    trunk.position.y = -20;
    g.add(trunk);
    const s = 0.9 + R() * 1.1;
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6 * s, 0), glassMat);
    crown.position.y = 2.2 * s;
    g.add(crown);
    g.position.y = baseY(-8, 3);
  } else if (L.theme === 'brass') {
    if (R() < 0.5) {
      const h = 25 + R() * 25;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, h, 10), makeMaterial(0x6a4a2a, 0xffa030, 0.18));
      m.position.y = h / 2;
      g.add(m);
      g.position.y = lavaY - 2;
    } else {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3 + R() * 4, 0.45, 8, 28), makeMaterial(0xc89a4a, 0xffa030, 0.35));
      ring.rotation.x = 1.0 + R() * 0.5;
      g.add(ring);
      g.position.y = baseY(-8, 16);
      anim.push({ mesh: g, spin: 0.25 + R() * 0.4, bob: R() * 6, baseY: g.position.y });
    }
  } else if (L.theme === 'star') {
    if (R() < 0.6) {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7 + R() * 1.6, 0), new THREE.MeshStandardMaterial({ color: 0xfff0b0, emissive: 0xffd040, emissiveIntensity: 1.4, roughness: 0.3 }));
      g.add(m);
    } else {
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(2 + R() * 3, 0), makeMaterial(0x2a3868, 0x3a50a0, 0.3));
      m.scale.y = 0.6;
      g.add(m);
    }
    g.position.y = baseY(-14, 30);
    anim.push({ mesh: g, spin: 0.2 + R() * 0.5, bob: R() * 6, baseY: g.position.y });
  } else if (L.theme === 'flood') {
    const h = 20 + R() * 25;
    const m = new THREE.Mesh(new THREE.BoxGeometry(2 + R() * 2.5, h, 2 + R() * 2.5), makeMaterial(0x1c3c48, 0x0d5a6a, 0.3));
    m.position.y = h / 2;
    g.add(m);
    g.position.y = lavaY - 2 + R() * 4;
  } else {
    const geo = R() < 0.5 ? new THREE.OctahedronGeometry(1) : new THREE.TetrahedronGeometry(1);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x1a1030, emissive: 0x7a2cff, emissiveIntensity: 0.6, roughness: 0.3 }));
    const s = 1.5 + R() * 4;
    m.scale.set(s, s * (1 + R() * 1.5), s);
    g.add(m);
    g.position.y = baseY(-12, 24);
    anim.push({ mesh: g, spin: 0.2 + R() * 0.4, bob: R() * 6, baseY: g.position.y });
  }
  return g;
}

export function makeStars() {
  const n = 1800;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u);
    pos[i * 3] = Math.cos(t) * r * 450;
    pos[i * 3 + 1] = Math.abs(u) * 450;
    pos[i * 3 + 2] = Math.sin(t) * r * 450;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8 }));
  pts.frustumCulled = false;
  return pts;
}

const halo = (color, size, opacity = 1) => {
  const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity }));
  h.scale.set(size, size, 1);
  return h;
};

export function makePad() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.2, 20), new THREE.MeshStandardMaterial({ color: 0x2a3a30, roughness: 0.7 }));
  base.position.y = 0.1;
  g.add(base);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.06, 20), new THREE.MeshBasicMaterial({ color: 0x7affb0 }));
  top.position.y = 0.22;
  g.add(top);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 4), new THREE.MeshBasicMaterial({ color: 0xd8ffe8, transparent: true, opacity: 0.8 }));
  arrow.position.y = 0.8;
  g.add(arrow);
  const h = halo(0x7affb0, 3, 0.7);
  h.position.y = 0.4;
  g.add(h);
  g.userData = { top, arrow };
  return g;
}

export function makeLantern() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 2.1, 8), new THREE.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.6 }));
  pole.position.y = 1.05;
  g.add(pole);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), new THREE.MeshBasicMaterial({ color: 0x555566 }));
  lamp.position.y = 2.3;
  g.add(lamp);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x3a3a44 }));
  cap.position.y = 2.7;
  g.add(cap);
  const h = halo(0xffb060, 5, 0);
  h.position.y = 2.3;
  g.add(h);
  g.userData = { lamp, halo: h };
  return g;
}

export const POWER = {
  shield: { color: 0x4aa8ff, label: 'SHIELD' },
  speed: { color: 0x6aff6a, label: 'SPEED' },
  moon: { color: 0xc080ff, label: 'MOON' },
  magnet: { color: 0xffe14a, label: 'MAGNET' },
};

export function makePowerup(kind) {
  const c = POWER[kind].color;
  const g = new THREE.Group();
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 1), new THREE.MeshBasicMaterial({ color: c }));
  g.add(orb);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.04, 8, 32), new THREE.MeshBasicMaterial({ color: c }));
  g.add(ring);
  g.add(halo(c, 2.4, 0.8));
  g.userData = { ring, orb };
  return g;
}

export function makeSpinner() {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.9, 10), new THREE.MeshStandardMaterial({ color: 0x2a2024, roughness: 0.6 }));
  post.position.y = 0.45;
  g.add(post);
  const arm = new THREE.Group();
  arm.position.y = 0.55;
  const bar = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.22, 0.36), new THREE.MeshStandardMaterial({ color: 0x4a1a1a, emissive: 0xff3a1a, emissiveIntensity: 0.9 }));
  arm.add(bar);
  for (const sx of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff6a2a }));
    tip.position.x = sx * 2.7;
    arm.add(tip);
    const h = halo(0xff5a20, 2.2, 0.8);
    h.position.x = sx * 2.7;
    arm.add(h);
  }
  g.add(arm);
  g.userData = { arm };
  return g;
}

export function makeGeyser() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.15, 28), new THREE.MeshBasicMaterial({ color: 0xff7a20, transparent: true, opacity: 0.3, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  g.add(ring);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.0, 7, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xff9a40, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  col.position.y = 3.5;
  col.visible = false;
  g.add(col);
  g.userData = { ring, col };
  return g;
}

export function makeScroll() {
  const g = new THREE.Group();
  const paper = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.7, 12), new THREE.MeshStandardMaterial({ color: 0xf2dca8, emissive: 0xffc860, emissiveIntensity: 0.5 }));
  paper.rotation.z = Math.PI / 2;
  g.add(paper);
  for (const sx of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 10), new THREE.MeshStandardMaterial({ color: 0x8a4a2a }));
    cap.rotation.z = Math.PI / 2;
    cap.position.x = sx * 0.38;
    g.add(cap);
  }
  g.add(halo(0xffd27a, 3.2, 0.9));
  return g;
}

export function makeProjectile(color = 0xff4aa8) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshBasicMaterial({ color })));
  g.add(halo(color, 1.8, 0.9));
  return g;
}

export function makeAnchor() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.09, 10, 28), new THREE.MeshBasicMaterial({ color: 0xffe0a0 }));
  g.add(ring);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  g.add(core);
  g.add(halo(0xffd27a, 3.4, 0.8));
  g.userData = { ring };
  return g;
}

export function makeTide() {
  const mat = new THREE.MeshBasicMaterial({ color: 0x2b0f55, transparent: true, opacity: 0.88, depthWrite: false });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), mat);
  m.rotation.x = -Math.PI / 2;
  const top = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshBasicMaterial({ color: 0x7a2cff, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }));
  top.position.y = 0.05;
  top.rotation.x = -Math.PI / 2;
  const g = new THREE.Group();
  g.add(m, top);
  return g;
}

export function makeGhost() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10), new THREE.MeshBasicMaterial({ color: 0x7affd0, transparent: true, opacity: 0.45 })));
  g.children[0].position.y = 0.4;
  const h = halo(0x7affd0, 2.2, 0.6);
  h.position.y = 0.4;
  g.add(h);
  return g;
}

export function makeWings() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.6, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  for (const sx of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), mat);
    w.position.set(sx * 0.65, 0.55, 0.1);
    w.rotation.set(-Math.PI / 2, 0, sx * 0.35);
    g.add(w);
  }
  g.visible = false;
  return g;
}
