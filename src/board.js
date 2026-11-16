// H.E.R.M.E.S whiteboard: draws the whole board (1 SVG unit = 1 mm on the real 1200 x 1700 mm board).
// Modes (location.hash): #board (default), #map (board map), #panels (one page per panel).
/* global rough, GEOM */
'use strict';

const BOARD = { w: 1700, h: 1200 };
const INK = { k: '#1e1e1e', b: '#1864ab', r: '#c92a2a', g: '#2b8a3e', grey: '#9aa0a6' };

// ---------------------------------------------------------------- panel layout (mm on the board)
const PANELS = [
  { id: 'A', x: 0, y: 0, w: 900, h: 370, title: 'System overview' },
  { id: 'E', x: 900, y: 0, w: 320, h: 370, title: 'Power and charging' },
  { id: 'G', x: 1220, y: 0, w: 480, h: 370, title: 'Gesture vocabulary' },
  { id: 'D1', x: 0, y: 370, w: 550, h: 480, title: 'Pod (snap-on vibration pod)' },
  { id: 'D2', x: 550, y: 370, w: 550, h: 480, title: 'Desk dock (charges 6 pods)' },
  { id: 'D3', x: 1100, y: 370, w: 300, h: 240, title: 'Vest mount (x6)' },
  { id: 'D5', x: 1400, y: 370, w: 300, h: 240, title: 'Hub + Pi 5' },
  { id: 'D4', x: 1100, y: 610, w: 600, h: 240, title: 'Gloves (L + R)' },
  { id: 'B', x: 0, y: 850, w: 600, h: 350, title: 'What is part of what' },
  { id: 'C', x: 600, y: 850, w: 600, h: 350, title: 'Component list' },
  { id: 'F', x: 1200, y: 850, w: 500, h: 350, title: 'Software map' },
];
const PANEL = Object.fromEntries(PANELS.map(p => [p.id, p]));

// ---------------------------------------------------------------- primitives
let svg, rc, seed = 7;
const NS = 'http://www.w3.org/2000/svg';
function o(c, extra) {
  return Object.assign({ stroke: INK[c] || c, strokeWidth: 1.5, roughness: 0.7, bowing: 0.5, seed: seed++ }, extra || {});
}
const add = el => { svg.appendChild(el); return el; };
const line = (x1, y1, x2, y2, c = 'k', e) => add(rc.line(x1, y1, x2, y2, o(c, e)));
const rect = (x, y, w, h, c = 'k', e) => add(rc.rectangle(x, y, w, h, o(c, e)));
const circ = (cx, cy, d, c = 'k', e) => add(rc.circle(cx, cy, d, o(c, e)));
const path = (pts, c = 'k', e) => add(rc.linearPath(pts, o(c, e)));
const poly = (pts, c = 'k', e) => add(rc.polygon(pts, o(c, e)));
const dash = { strokeLineDash: [6, 5] };
const fillOf = c => ({ fill: INK[c], fillStyle: 'hachure', hachureGap: 4, fillWeight: 0.8 });

function text(x, y, s, size = 13, c = 'k', anchor = 'start', weight) {
  const t = document.createElementNS(NS, 'text');
  t.setAttribute('x', x); t.setAttribute('y', y);
  t.setAttribute('font-size', size); t.setAttribute('fill', INK[c] || c);
  t.setAttribute('text-anchor', anchor);
  if (weight) t.setAttribute('font-weight', weight);
  String(s).split('\n').forEach((ln, i) => {
    const sp = document.createElementNS(NS, 'tspan');
    sp.setAttribute('x', x); if (i) sp.setAttribute('dy', size * 1.12);
    sp.textContent = ln; t.appendChild(sp);
  });
  return add(t);
}
// wrap a string to lines of <= n chars, breaking at ' · ' first, then spaces
function wrap(s, n) {
  const out = [];
  for (const chunk of s.split('\n')) {
    let cur = '';
    for (const w of chunk.split(' ')) {
      if ((cur + ' ' + w).trim().length > n && cur) { out.push(cur.trim()); cur = w; } else cur += ' ' + w;
    }
    if (cur.trim()) out.push(cur.trim());
  }
  return out.join('\n');
}
function arrow(x1, y1, x2, y2, c = 'k', e, both) {
  line(x1, y1, x2, y2, c, e);
  const head = (xa, ya, xb, yb) => {
    const a = Math.atan2(yb - ya, xb - xa), L = 9;
    line(xb, yb, xb - L * Math.cos(a - 0.45), yb - L * Math.sin(a - 0.45), c);
    line(xb, yb, xb - L * Math.cos(a + 0.45), yb - L * Math.sin(a + 0.45), c);
  };
  head(x1, y1, x2, y2); if (both) head(x2, y2, x1, y1);
}
const DIM = { strokeWidth: 1, disableMultiStroke: true, roughness: 0.4 };
function dimH(x1, x2, y, label, c = 'k', size = 11) {
  line(x1, y, x2, y, c, DIM);
  line(x1, y - 5, x1, y + 5, c, DIM); line(x2, y - 5, x2, y + 5, c, DIM);
  text((x1 + x2) / 2, y - 3, label, size, c, 'middle');
}
function dimV(x, y1, y2, label, c = 'k', size = 11, side = -1) {
  line(x, y1, x, y2, c, DIM);
  line(x - 5, y1, x + 5, y1, c, DIM); line(x - 5, y2, x + 5, y2, c, DIM);
  text(x + side * 4, (y1 + y2) / 2 + 4, label, size, c, side < 0 ? 'end' : 'start');
}
function box(x, y, w, h, label, c = 'k', size = 12, e) {
  rect(x, y, w, h, c, e);
  const lines = String(label).split('\n').length;
  text(x + w / 2, y + h / 2 - (lines - 1) * size * 0.56 + size * 0.36, label, size, c, 'middle');
}
const viewTitle = (x, y, s) => text(x, y, s, 11, 'grey');

// ---------------------------------------------------------------- geometry views
function bboxOf(shapes) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of shapes) {
    const pts = s.poly || [[s.circle[0] - s.circle[2], s.circle[1] - s.circle[2]], [s.circle[0] + s.circle[2], s.circle[1] + s.circle[2]]];
    for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}
// place model shapes with their bbox top-left at screen (x, y); returns the transform + screen bbox
function place(shapes, x, y, s, bb) {
  bb = bb || bboxOf(shapes);
  const T = ([u, v]) => [x + (u - bb.x0) * s, y + (bb.y1 - v) * s];
  return { T, s, bb, X0: x, Y0: y, X1: x + bb.w * s, Y1: y + bb.h * s };
}
function draw(shapes, T, s, c = 'k', e) {
  for (const sh of shapes) {
    if (sh.circle) { const [cx, cy] = T(sh.circle); circ(cx, cy, 2 * sh.circle[2] * s, c, e); }
    else poly(sh.poly.slice(0, -1).map(T), c, e);
  }
}
function view(shapes, x, y, s, title, c = 'k', e) {
  const v = place(shapes, x, y, s); draw(shapes, v.T, s, c, e);
  if (title) viewTitle(x, y - 6, title);
  return v;
}

// isometric (viewer toward +x, -y, +z); rings = list of equal-length 3D point loops, lofted in order
function iso(ox, oy, s) { return p => [ox + (p[0] + p[1]) * 0.866 * s, oy + ((p[0] - p[1]) * 0.5 - p[2]) * s]; }
const V = [1, -1, 1];
const sub = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a.reduce((t, v, i) => t + v * b[i], 0);
const mean = pts => pts[0].map((_, i) => pts.reduce((t, p) => t + p[i], 0) / pts.length);
function loft(rings, P, c = 'k', e) {
  const C = mean(rings.flat()), n = rings[0].length, K = rings.length;
  const lat = [];   // lat[k][i]: lateral face between ring k, k+1 and vertices i, i+1 visible?
  for (let k = 0; k < K - 1; k++) {
    lat.push([]);
    for (let i = 0; i < n; i++) {
      const A = rings[k][i], B = rings[k][(i + 1) % n], Ap = rings[k + 1][i];
      let nn = cross(sub(B, A), sub(Ap, A));
      if (dot(nn, sub(mean([A, B, Ap]), C)) < 0) nn = nn.map(v => -v);
      lat[k].push(dot(nn, V) > 1e-9);
    }
  }
  const cap = k => {   // end cap normal, pointing away from the solid
    const r = rings[k], other = mean(rings[k === 0 ? 1 : K - 2]);
    let nn = cross(sub(r[1], r[0]), sub(r[2], r[0]));
    if (dot(nn, sub(mean(r), other)) < 0) nn = nn.map(v => -v);
    return dot(nn, V) > 1e-9;
  };
  const capVis = [cap(0), cap(K - 1)];
  for (let k = 0; k < K; k++) for (let i = 0; i < n; i++) {
    const vis = (k === 0 && capVis[0]) || (k === K - 1 && capVis[1]) || (k > 0 && lat[k - 1][i]) || (k < K - 1 && lat[k][i]);
    if (vis) line(...P(rings[k][i]), ...P(rings[k][(i + 1) % n]), c, e);
  }
  for (let k = 0; k < K - 1; k++) for (let i = 0; i < n; i++)
    if (lat[k][i] || lat[k][(i + n - 1) % n]) line(...P(rings[k][i]), ...P(rings[k + 1][i]), c, e);
}
const ring2 = (poly2, z, sx = 1, sy = 1) => poly2.slice(0, -1).map(([x, y]) => [x * sx, y * sy, z]);
const rectRing = (x0, y0, x1, y1, z) => [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]];
const boxIso = (x0, y0, z0, x1, y1, z1, P, c, e) => loft([rectRing(x0, y0, x1, y1, z0), rectRing(x0, y0, x1, y1, z1)], P, c, e);

// ---------------------------------------------------------------- panel frames
function frame(p, mapMode) {
  rect(p.x + 4, p.y + 4, p.w - 8, p.h - 8, 'k', { strokeWidth: 2.2, roughness: 0.9 });
  text(p.x + 16, p.y + 34, `${p.id}  ${p.title}`, mapMode ? 30 : 24, 'k', 'start', 'bold');
  text(p.x + p.w - 14, p.y + 26, `${p.w / 10} × ${p.h / 10} cm`, 11, 'grey', 'end');
}
const at = (id, dx, dy) => [PANEL[id].x + dx, PANEL[id].y + dy];

// ================================================================= A. system overview
function panelA() {
  const [X, Y] = at('A', 0, 0);
  // marker legend
  const lg = [['k', 'black = structure'], ['b', 'blue = data / radio'], ['r', 'red = power'], ['g', 'green = magnets / mechanical']];
  lg.forEach(([c, s], i) => { line(X + 280 + i * 125, Y + 28, X + 300 + i * 125, Y + 28, c, { strokeWidth: 3 }); text(X + 304 + i * 125, Y + 32, s, 11, c); });

  // operator, seen from the BACK: wearer's left is on the left of the drawing
  const ox = X + 150, oy = Y + 80;
  text(ox, Y + 62, 'OPERATOR (seen from the back)', 14, 'k', 'middle', 'bold');
  circ(ox, oy + 20, 36);                                               // head
  line(ox, oy + 38, ox, oy + 50);                                      // neck
  line(ox, oy + 160, ox, oy + 172);                                    // hips
  line(ox, oy + 172, ox - 32, oy + 240); line(ox, oy + 172, ox + 32, oy + 240);   // legs
  path([[ox - 45, oy + 56], [ox - 85, oy + 112], [ox - 100, oy + 150]]);          // left arm (wearer's left)
  path([[ox + 45, oy + 56], [ox + 85, oy + 112], [ox + 100, oy + 150]]);          // right arm
  rect(ox - 45, oy + 50, 90, 110);                                     // vest
  text(ox, oy + 66, 'vest', 11, 'k', 'middle');
  // 1/2 sleeves (on the upper arms), 3/4 shoulders, 5/6 torso
  const pods = [[-68, 86, 1], [68, 86, 2], [-26, 66, 3], [26, 66, 4], [-24, 138, 5], [24, 138, 6]];
  for (const [dx, dy, n] of pods) { poly(hex(ox + dx, oy + dy, 10), 'k'); text(ox + dx, oy + dy + 4, n, 11, 'k', 'middle'); }
  rect(ox - 122, oy + 145, 28, 26); text(ox - 108, oy + 190, 'L glove', 12, 'k', 'middle');
  rect(ox + 94, oy + 145, 28, 26); text(ox + 108, oy + 190, 'R glove', 12, 'k', 'middle');
  text(ox - 140, oy + 205, '4 flex + IMU', 11, 'k', 'start');
  text(ox + 82, oy + 205, '4 FSR', 11, 'k', 'start');
  text(X + 20, Y + 340, 'pods: 1 L sleeve · 2 R sleeve · 3 L shoulder\n4 R shoulder · 5 L torso · 6 R torso', 11);

  // Pi 5 + hub + power bank ride on the vest
  rect(ox - 30, oy + 80, 34, 22, 'k'); text(ox - 13, oy + 95, 'Pi', 10, 'k', 'middle');
  rect(ox + 8, oy + 84, 13, 13, 'b');
  rect(ox - 20, oy + 112, 40, 12, 'r', fillOf('r'));
  line(ox - 13, oy + 102, ox - 13, oy + 112, 'r');
  // BLE to the hub on the vest
  arrow(ox - 108, oy + 145, ox + 8, oy + 96, 'b', dash);
  arrow(ox + 108, oy + 145, ox + 21, oy + 96, 'b', dash);
  arrow(ox + 21, oy + 88, ox + 58, oy + 86, 'b', dash);
  text(X + 210, Y + 92, 'BLE to the hub on the vest:', 12, 'b');
  text(X + 210, Y + 106, 'gloves 50 Hz · L 48 B · R 9 B', 12, 'b');
  text(X + 210, Y + 120, 'pods ≤ 20 Hz on change + 10 Hz keepalive · 2 B', 12, 'b');

  // zoom: what sits on the vest
  const zx = X + 300, zy = Y + 134;
  rect(zx, zy, 300, 128, 'k', Object.assign({ strokeWidth: 1 }, dash));
  line(ox + 4, oy + 90, zx, zy + 60, 'k', Object.assign({ strokeWidth: 0.8 }, dash));
  text(zx + 8, zy + 16, 'ON THE VEST (zoom)', 11, 'grey');
  box(zx + 10, zy + 28, 56, 34, 'hub\nXIAO', 'b', 12);
  text(zx + 10, zy + 76, 'BLE central (8 links)', 10.5, 'b');
  line(zx + 66, zy + 45, zx + 140, zy + 45, 'k', { strokeWidth: 2.5 });
  text(zx + 72, zy + 39, 'USB 921 600', 10, 'b');
  box(zx + 140, zy + 20, 150, 58, 'Raspberry Pi 5\nROS 2 nodes', 'k', 13);
  rect(zx + 140, zy + 96, 150, 20, 'r');
  text(zx + 215, zy + 110, 'USB-C power bank 5 V 5 A', 10.5, 'r', 'middle');
  line(zx + 215, zy + 78, zx + 215, zy + 96, 'r', { strokeWidth: 2 });
  text(zx + 10, zy + 98, '↑ hermes.hub.v1 JSON lines', 10, 'b');
  text(zx + 10, zy + 112, '↓ V1,<seq>,m1..m6 @ 20 Hz', 10, 'b');
  const px = zx + 140, py = zy + 20;

  // dock + charging
  const dx = X + 300, dy = Y + 316;
  poly([[dx, dy + 30], [dx + 170, dy + 30], [dx + 170, dy + 4], [dx, dy + 16]]);
  for (let i = 0; i < 6; i++) poly(hex(dx + 16 + i * 28, dy + 15 - i * 1.8, 8, 0.5), 'g');
  text(dx + 85, dy - 8, 'desk dock: 6 pockets · pods snap in by magnet', 11, 'k', 'middle');
  arrow(dx + 215, dy + 22, dx + 174, dy + 22, 'r');
  text(dx + 219, dy + 26, 'USB-C 5 V', 12, 'r');

  // ROS 2 over Wi-Fi to robots
  const rx = X + 640, ry = Y + 190;
  arrow(px + 150, py + 30, rx - 8, ry + 20, 'b', dash, true);
  text(X + 610, Y + 104, 'ROS 2 over Wi-Fi', 13, 'b');
  text(X + 610, Y + 122, '/hermes/swarm_intent 10 Hz →\n← /hermes/robot_state_beacon', 11, 'b');
  for (let i = 0; i < 3; i++) {
    const bx = rx + i * 85;
    rect(bx, ry, 76, 46); circ(bx + 15, ry + 52, 15); circ(bx + 61, ry + 52, 15);
    text(bx + 38, ry + 28, `ROSbot r${i + 1}`, 12, 'k', 'middle');
  }
  text(rx, ry + 82, 'each robot: own agent node → /cmd_vel 20 Hz', 11);
  // OptiTrack
  const cx = X + 745, cy = Y + 70;
  for (let i = 0; i < 3; i++) { rect(cx + i * 46, cy, 30, 18); line(cx + i * 46 + 30, cy + 9, cx + i * 46 + 38, cy + 3); }
  text(cx + 66, cy - 8, 'OptiTrack cameras', 12, 'k', 'middle');
  arrow(cx + 50, cy + 24, cx + 20, ry - 6, 'b', dash);
  text(cx + 62, Y + 140, 'NatNet poses\n→ pose beacons', 11, 'b');

  // status legend
  text(X + 590, Y + 300, 'BUILT: ROS 2 nodes · ROSbots · OptiTrack ·\nv1 glove carrier boards', 12);
  text(X + 590, Y + 330, 'DESIGNED, NOT BUILT: pods · dock · vest mounts', 12);
  text(X + 590, Y + 346, 'COMPILED, NEVER FLASHED: hub / pod / glove\nBLE firmware', 12);
}
function hex(cx, cy, r, sy = 0.62) {
  return [[cx + r, cy], [cx + r / 2, cy - r * sy * 1.6], [cx - r / 2, cy - r * sy * 1.6], [cx - r, cy], [cx - r / 2, cy + r * sy * 1.6], [cx + r / 2, cy + r * sy * 1.6]];
}

// ================================================================= B. tree
function tree(x, y, rows, dy = 17, ind = 22, size = 13) {
  rows.forEach(([d, s, c], i) => {
    const tx = x + d * ind, ty = y + i * dy;
    text(tx, ty, s, size, c || 'k', 'start', d === 0 ? 'bold' : undefined);
    if (d > 0) {
      let p = i - 1; while (rows[p][0] !== d - 1) p--;
      const lx = x + (d - 1) * ind + 6;
      line(lx, y + p * dy + 4, lx, ty - 4, 'grey', { strokeWidth: 1, roughness: 0.3 });
      line(lx, ty - 4, tx - 3, ty - 4, 'grey', { strokeWidth: 1, roughness: 0.3 });
    }
  });
}
function panelB() {
  const [X, Y] = at('B', 0, 0);
  text(X + 300, Y + 62, 'H.E.R.M.E.S system', 16, 'k', 'middle', 'bold');
  line(X + 150, Y + 70, X + 450, Y + 70, 'k', { strokeWidth: 1 });
  tree(X + 20, Y + 88, [
    [0, 'Operator wearables'],
    [1, 'Left glove'],
    [2, 'enclosure v1 (base + lid)'],
    [2, 'carrier PCB v1, 60 × 56'],
    [3, 'XIAO nRF52840 Sense (IMU on)', 'b'],
    [3, '4 flex sensors + 4 × 68 kΩ'],
    [3, 'LiPo 500 mAh', 'r'],
    [1, 'Right glove: same carrier'],
    [2, 'XIAO Sense (IMU off) · 4 FSR402 + 4 × 10 kΩ'],
    [1, 'Vest → 6 vest mounts → 6 pods'],
    [2, 'Pod'],
    [3, 'case: base + snap lid'],
    [3, 'backpack PCB: MOSFET · diode · 100 kΩ'],
    [3, 'XIAO nRF52840 · coin motor', 'b'],
    [3, 'LiPo 150 mAh', 'r'],
    [3, 'underside: magnet · 2 brass pads · key groove', 'g'],
  ], 14.5, 20, 12.5);
  tree(X + 330, Y + 88, [
    [0, 'Desk dock'],
    [1, 'desk bar (one print)'],
    [1, '6 pockets'],
    [2, 'pin board 30 × 30'],
    [3, '2 pogo pins', 'r'],
    [2, 'magnet under 0.5 skin', 'g'],
    [2, 'key rib', 'g'],
    [1, 'USB-C board (Adafruit 6050)', 'r'],
    [0, 'Base station'],
    [1, 'Raspberry Pi 5 (ROS 2)'],
    [1, 'hub: XIAO nRF52840 on USB', 'b'],
    [0, 'Swarm'],
    [1, '3 ROSbots r1–r3 (agent each)'],
    [1, 'OptiTrack (NatNet poses)', 'b'],
  ], 14.5, 20, 12.5);
}

// ================================================================= C. components
function table(x, y, cols, rows, size = 11.5, rh = 15) {
  let cx = x; const xs = cols.map(([, w]) => { const r = cx; cx += w; return r; });
  cols.forEach(([h], i) => text(xs[i], y, h, size, 'grey'));
  line(x, y + 5, cx, y + 5, 'k', { strokeWidth: 1, roughness: 0.3 });
  rows.forEach((r, j) => {
    const ty = y + (j + 1) * rh + 3;
    if (typeof r === 'string') { text(x, ty, r, size + 1, 'k', 'start', 'bold'); return; }
    r.forEach((s, i) => text(xs[i], ty, s, size, (r.c && i === 0) ? r.c : 'k'));
  });
}
function panelC() {
  const [X, Y] = at('C', 0, 0);
  const cols = [['part', 114], ['qty', 40], ['role', 80], ['español', 56]];
  table(X + 12, Y + 60, cols, [
    'POD (per pod / ×6)',
    ['XIAO nRF52840', '1 / 6', 'BLE · charger', 'micro'],
    ['SI2302 MOSFET', '1 / 6', 'motor switch', 'transistor'],
    ['1N4148W diode', '1 / 6', 'flyback', 'diodo'],
    ['100 kΩ 0805', '1 / 6', 'gate pull-down', 'resistencia'],
    ['coin motor 10 × 3', '1 / 6', 'vibration', 'motor'],
    ['LiPo 150 mAh', '1 / 6', 'power', 'batería'],
    ['magnet 10 × 3', '1 / 6', 'holds pod', 'imán'],
    ['brass pad Ø4', '2 / 12', 'charge contact', 'latón'],
    ['backpack PCB', '1 / 6', 'carries parts', 'circuito'],
    ['case base + lid', '1 / 6', 'shell', 'carcasa'],
    'VEST',
    ['vest mount', '6', 'pod cradle', 'soporte'],
    ['magnet 10 × 3', '6', 'holds pod', 'imán'],
    ['velcro strap 20', '6', 'to the vest', 'velcro'],
  ], 11.5, 15);
  table(X + 306, Y + 60, cols, [
    'DOCK',
    ['desk bar print', '1', 'holds 6 pods', 'base'],
    ['pogo pin 7911', '12', 'spring contact', 'contacto'],
    ['pin board 30 × 30', '6', 'holds 2 pins', 'circuito'],
    ['magnet 10 × 3', '6', 'pulls pod in', 'imán'],
    ['USB-C board 6050', '1', '5 V in', 'conector'],
    ['M2 × 6 screw', '14', 'board mounts', 'tornillo'],
    'GLOVES (per glove / ×2)',
    ['XIAO Sense [VERIFY]', '1 / 2', 'BLE · IMU', 'micro'],
    ['carrier PCB v1', '1 / 2', 'sockets', 'circuito'],
    ['flex (L) / FSR402 (R)', '4 / 8', 'finger input', 'sensor'],
    ['68 k (L) / 10 k (R)', '4 / 8', 'divider', 'resistencia'],
    ['LiPo 500 mAh', '1 / 2', 'power', 'batería'],
    'BASE STATION',
    ['Raspberry Pi 5', '1', 'ROS 2', 'ordenador'],
    ['XIAO nRF52840 hub', '1', 'BLE central', 'micro'],
  ], 11.5, 15);
  text(X + 306, Y + 320, '[VERIFY] shopping list orders 1 Sense; 2 gloves need 2', 10.5, 'grey');
  text(X + 12, Y + 320, 'magnets: 6 pod + 6 dock + 6 vest = 18', 10.5, 'g');
}

// ================================================================= D1. pod
function panelD1() {
  const G = GEOM.pod, K = G.consts, [X, Y] = at('D1', 0, 0), s = 2;
  // orthographic, third-angle: top above front, side to the right of front
  const top = view(G.top, X + 40, Y + 86, s);
  viewTitle(top.X1 + 8, top.Y0 - 10, 'TOP 2:1');
  text(top.X1 + 6, top.T([0, 0])[1] + 4, '→ +x\nkey side', 10.5);
  dimH(top.X0, top.X1, top.Y0 - 14, '52');
  dimV(top.X0 - 12, top.Y0, top.Y1, '32');
  const front = view(G.front, X + 40, top.Y1 + 34, s, 'FRONT');
  dimV(front.X0 - 12, front.Y0, front.Y1, '19');
  const ySplit = front.T([0, K.SPLIT])[1];
  line(front.X0, ySplit, front.X1, ySplit, 'k', Object.assign({ strokeWidth: 1 }, dash));
  text(front.X1 + 4, ySplit + 4, 'split z 8', 10.5);
  const side = view(G.side, front.X1 + 60, front.Y0, s, 'SIDE');
  dimH(side.X0, side.X1, side.Y1 + 14, '32');

  // bottom face (what touches the dock)
  const bot = place(G.bottom, X + 290, Y + 86, s, bboxOf(G.top));
  viewTitle(X + 290, Y + 64, 'BOTTOM 2:1 (dock side)');
  for (const sh of G.bottom) {
    if (sh.circle) {
      const [cx, cy] = bot.T(sh.circle), isMag = sh.circle[2] > 4;
      circ(cx, cy, 2 * sh.circle[2] * s, isMag ? 'g' : 'r', fillOf(isMag ? 'g' : 'r'));
    } else draw([sh], bot.T, s, sh === G.bottom[0] ? 'k' : 'g');
  }
  text(bot.T([0, 0])[0], bot.Y1 + 16, 'magnet Ø10.2', 10.5, 'g', 'middle');
  text(bot.T([-11, 0])[0], bot.Y0 - 4, '− pad Ø4', 10.5, 'r', 'middle');
  text(bot.T([11, 0])[0], bot.Y0 - 4, '+5 V pad', 10.5, 'r', 'middle');
  text(bot.X1 + 4, bot.T([0, 0])[1] + 4, 'key\ngroove', 10.5, 'g');
  dimH(bot.T([-11, 0])[0], bot.T([11, 0])[0], bot.Y1 + 34, '22', 'r', 10.5);

  // isometric: hex prism with a chamfered lid (rings read off the top / front / side silhouettes)
  const P = iso(X + 470, Y + 165, 1.9), hx = G.top[0].poly;
  loft([ring2(hx, 0, 0.94, 0.9), ring2(hx, 1.5), ring2(hx, 13.9), ring2(hx, 19, 18.6 / 26, 9.8 / 16)], P);
  viewTitle(X + 440, Y + 64, 'ISO SKETCH');

  // assembled section y = 0 (real slice) with the parts drawn in
  const ss = 3.4, sb = place(G.sec_base.concat(G.sec_lid), X + 290, Y + 262, ss);
  viewTitle(X + 290, Y + 252, 'SECTION through pads + magnet (y = 0) 3.4:1');
  draw(G.sec_base, sb.T, ss, 'k', { strokeWidth: 1.2 });
  draw(G.sec_lid, sb.T, ss, 'k', { strokeWidth: 1.2 });
  const R = (x0, z0, x1, z1, c, f) => { const [a, b] = sb.T([x0, z1]), [cc, d] = sb.T([x1, z0]); rect(a, b, cc - a, d - b, c, f ? fillOf(c) : undefined); };
  R(-16, 3.9, 16, 8.4, 'r', 1); R(-15, 8.8, 15, 10.4, 'k'); R(-15, 10.5, 6, 12.1, 'b', 1); R(6.3, 13.7, 16.3, 16.7, 'g', 1);
  R(-5, 0.1, 5, 3.1, 'g', 1);
  const lb = (z, s2, c) => text(sb.X1 + 6, sb.T([0, z])[1] + 4, s2, 10.5, c);
  lb(15.2, 'motor', 'g'); lb(12.6, 'XIAO', 'b'); lb(9.1, 'backpack', 'k'); lb(5.6, 'LiPo', 'r'); lb(1.6, 'magnet', 'g');
  text(X + 290, sb.Y1 + 18, 'USB-C toward −x · motor beside the XIAO', 10.5);

  // exploded stack (z from cad3)
  const ex = X + 40, eb = Y + 452, es = 2.6, gap = 10;
  viewTitle(ex, Y + 268, 'EXPLODED STACK 2.6:1 (z = mm above the bottom)');
  const layers = [
    ['base: floor + lip', 0, 3.6, -26, 26, 'k'],
    ['foam tape 0.3', 3.6, 3.9, -16, 16, 'k'],
    ['LiPo 150 mAh 32×18×4.5', 3.9, 8.4, -16, 16, 'r'],
    ['backpack PCB 30×20', 8.8, 10.4, -15, 15, 'k'],
    ['XIAO nRF52840', 10.5, 12.1, -15, 6, 'b'],
    ['motor 10×3 (in lid ring)', 13.7, 16.7, 6.3, 16.3, 'g'],
    ['lid (snap fit)', 8, 19, -26, 26, 'k'],
  ];
  let yb = eb;
  layers.forEach(([name, z0, z1, x0, x1, c], i) => {
    const h = Math.max((z1 - z0) * es, 4), x = ex + (x0 + 26) * es, w = (x1 - x0) * es;
    yb -= h;
    if (i === 0) {          // base tray, magnet + pads in pockets under the floor
      path([[x, yb - 8], [x, yb + h], [x + w, yb + h], [x + w, yb - 8]]);
      line(x, yb, x + w, yb);
      rect(ex + 21 * es, yb + h - 3.1 * es, 10.2 * es, 3.1 * es, 'g', fillOf('g'));
      rect(ex + 13 * es, yb + h - 1.5, 4 * es, 3, 'r', fillOf('r')); rect(ex + 35 * es, yb + h - 1.5, 4 * es, 3, 'r', fillOf('r'));
    } else if (name.startsWith('lid')) {
      const lp = [[-26, 8], [-26, 13.9], [-18.7, 19], [18.6, 19], [26, 13.9], [26, 8]].map(([u, v]) => [ex + (u + 26) * es, yb + (19 - v) * es]);
      path(lp);
    } else rect(x, yb, w, h, c, c === 'k' ? undefined : fillOf(c));
    text(ex + 52 * es + 12, yb + h / 2 + 4, `${name} · z ${z0}–${z1}`, 11, c);
    yb -= gap;
  });
  text(ex, eb + 18, 'magnet + 2 brass pads sit in pockets under the floor', 10.5, 'g');
}

// ================================================================= D2. dock
// leaders: vertical only; labels sorted by anchor x get rows in that order with text to the LEFT of the
// leader, so no leader ever crosses another leader or a label.
function leaders(items, T, yRow0, step, up, size = 10) {
  items.slice().sort((a, b) => a.at[0] - b.at[0]).forEach((it, k) => {
    const [ax, ay] = T(it.at), y = yRow0 + (up ? -1 : 1) * k * step;
    line(ax, ay, ax, y + (up ? 3 : -9), it.c, { strokeWidth: 0.8, roughness: 0.3 });
    text(ax - 3, y, it.s, size, it.c, 'end');
  });
}
function panelD2() {
  const G = GEOM.dock, K = G.consts, P = GEOM.pod, [X, Y] = at('D2', 0, 0);
  // top face (square onto the slope)
  const pockets = G.face.slice(1).filter(f => bboxOf([f]).w > 20);
  const face = view(G.face.slice(0, 1).concat(pockets), X + 20, Y + 64, 1, 'TOP FACE 1:1 (square onto the 20° slope)');
  dimH(face.X0, face.X1, face.Y1 + 12, `${bboxOf([G.face[0]]).w.toFixed(0)} along the face · pockets 37 apart`);
  // side
  const side = view(G.side, X + 268, Y + 76, 1.3, 'SIDE 1.3:1');
  dimH(side.X0, side.X1, side.Y1 + 12, '72'); dimV(side.X1 + 10, side.Y0, side.Y1, '34.2', 'k', 10.5, 1);
  text(side.T([-20, 22])[0] - 6, side.T([0, 22])[1], '20°', 12, 'k', 'end');

  // underside, seen from below (front edge at the top), 1:1
  const flip = sh => sh.circle ? { circle: [sh.circle[0], -sh.circle[1], sh.circle[2]] } : { poly: sh.poly.map(([x, y]) => [x, -y]) };
  const und = G.under.map(flip), ub = { x0: -114, x1: 114, y0: -36, y1: 36, w: 228, h: 72 };
  const u = place(und, X + 20, Y + 172, 1, ub);
  viewTitle(X + 20, Y + 166, 'UNDERSIDE 1:1 (seen from below, front edge at the top) — hollow, 3 mm walls');
  und.forEach((sh, i) => draw([sh], u.T, 1, i < 2 ? 'k' : 'grey', { strokeWidth: i < 2 ? 1.5 : 0.8 }));
  const D = ([x, y]) => u.T([x, -y]);
  for (const b of G.pinboards) poly(b.map(D), 'k', { strokeWidth: 1.2 });
  for (const m of G.m2) circ(...D(m), 4, 'k');
  for (const pg of G.pogo) circ(...D(pg), 3.5, 'r', fillOf('r'));
  const ub2 = G.usb.board, [ua, ub_] = [D([ub2[0], ub2[3]]), D([ub2[2], ub2[1]])];
  rect(ua[0], ua[1], ub_[0] - ua[0], ub_[1] - ua[1], 'r');
  rect(...D([-4.5, 36]), 9, 4, 'r', fillOf('r'));
  // daisy chain: +5 V on the back pogo row, GND on the front row [VERIFY route]
  const yP = G.pogo[1][1], yG = G.pogo[0][1], xs = G.pogo.filter((_, i) => i % 2 === 0).map(p => p[0]);
  const xl = Math.min(...xs), xr = Math.max(...xs);
  path([D([-3, ub2[1]]), D([-3, yP]), D([xl, yP])], 'r'); line(...D([-3, yP]), ...D([xr, yP]), 'r');
  path([D([3, ub2[1]]), D([3, yP + 2]), D([5, yP + 2]), D([5, yG])], 'k', { strokeWidth: 1 });
  line(...D([xl, yG]), ...D([xr, yG]), 'k', { strokeWidth: 1 });
  text(X + 20, u.Y1 + 13, 'red dots: pogo pin tails · USB-C board 20.4 × 14.7 on the back ledge [VERIFY dims]', 10, 'r');
  text(X + 20, u.Y1 + 25, 'daisy-chain: +5 V (red) on the back pogo row, GND (black) on the front row · route [VERIFY]', 10, 'k');

  // pocket plan 2:1, same orientation as the top face
  const turn = sh => sh.circle ? { circle: [-sh.circle[1], sh.circle[0], sh.circle[2]] } : { poly: sh.poly.map(([a, b]) => [-b, a]) };
  const below = G.pocket_below.map(turn), above = G.pocket_plan.map(turn), pp = 2.0, qx = X + 440, qy = Y + 84;
  const plan = place(below, qx, qy, pp, { x0: -22, x1: 22, y0: -32, y1: 32, w: 44, h: 64 });
  viewTitle(qx - 34, qy - 8, 'POCKET PLAN 2:1 (as top face)');
  const gem = above.filter(s2 => s2.poly && bboxOf([s2]).h > 40 && bboxOf([s2]).h < 60);
  draw(gem.length ? gem : above, plan.T, pp, 'k');
  for (const sh of below) if (sh.circle) {
    const [cx, cy] = plan.T(sh.circle), r = sh.circle[2], pogo = r < 4 && Math.abs(sh.circle[1]) > 5;
    circ(cx, cy, 2 * r * pp, r > 4 ? 'g' : (pogo ? 'r' : 'k'), r > 4 ? fillOf('g') : (pogo ? fillOf('r') : undefined));
  }
  const kr = plan.T([-8, 16.5]), kr2 = plan.T([8, 14.5]);
  rect(kr[0], kr[1], kr2[0] - kr[0], kr2[1] - kr[1], 'g', fillOf('g'));
  text(qx - 34, plan.Y1 + 14, 'red: pogo pins ±11 · black: M2\ngreen: magnet, key rib (back)', 10);

  // ---- docking sequence: pocket section along the pod axis (slot frame u, w), dock hatched, pod dashed
  const ss = 2.4, win = { x0: -30, x1: 30, y0: -10, y1: 34, w: 60, h: 44 }, top = Y + 318;
  text(X + 14, top - 26, 'DOCKING SEQUENCE 2.4:1 (cut along the pod axis) — dock = hatched, pod = dashed outline', 11, 'k', 'start', 'bold');
  const podOutline = P.front[0].poly;
  const step = (i, dw, pinTip, caption) => {
    const sx = X + 14 + i * 180, v = place(G.pocket_sec, sx, top, ss, win), T = v.T;
    text(sx, top - 8, caption, 10.5, 'k', 'start', 'bold');
    draw(G.pocket_sec, T, ss, 'k', { strokeWidth: 1.2, fill: INK.grey, fillStyle: 'hachure', hachureGap: 5, fillWeight: 0.5 });
    const R = (u0, w0, u1, w1, c, f, e) => { const [a, b] = T([u0, w1]), [cc, d] = T([u1, w0]); rect(a, b, cc - a, d - b, c, Object.assign(f ? fillOf(c) : {}, e || {})); };
    R(-15, -K.BOARD_DEPTH - K.BT, 15, -K.BOARD_DEPTH, 'k');                       // pin board
    R(-5, -3.5, 5, -0.5, 'g', 1);                                                  // dock magnet
    for (const s of [-1, 1]) R(s * K.CONTACT_X - 0.69, -K.BOARD_DEPTH, s * K.CONTACT_X + 0.69, pinTip, 'r', 1);
    // pod: dashed outline, magnet, pads, key groove
    poly(podOutline.slice(0, -1).map(([x, z]) => T([x, z + dw])), 'k', Object.assign({ strokeWidth: 1.3 }, dash));
    R(-5, 0.1 + dw, 5, 3.1 + dw, 'g', 1);
    for (const s of [-1, 1]) R(s * K.CONTACT_X - 2, dw, s * K.CONTACT_X + 2, 0.5 + dw, 'r', 1);
    R(15.5 - 1.3, dw, 15.5 + 1.3, 1.0 + dw, 'k', 0, { strokeWidth: 0.8 });
    return { T, sx, R };
  };
  const s1 = step(0, 10, K.POGO_PROUD, '1  pod above the pocket');
  text(s1.sx + 4, top + win.h * ss + 14, 'pins up: tip 0.7 proud\n(stroke 1.40)', 10, 'r');
  const s2 = step(1, 0.6, K.POGO_PROUD, '2  magnets pull it in');
  for (const ux of [-3, 3]) arrow(...s2.T([ux, 9]), ...s2.T([ux, 4.2]), 'g');
  text(s2.sx + 4, top + win.h * ss + 14, 'key rib enters the groove\nmagnets ≈ 870 gf vs pins\n≈ 187 gf → 4.6 × [VERIFY]', 10, 'g');
  const s3 = step(2, 0, 0.05, '3  seated: 5 V flows');
  s3.R(-15, 8.8, 15, 10.4, 'k'); s3.R(-15, 10.5, 6, 12.1, 'b', 1);                // backpack + XIAO
  // 5 V path: pin board -> pogo pin -> brass pad -> wire beside the battery -> XIAO VBUS
  path([s3.T([11, -7.6]), s3.T([11, 0.3])], 'r', { strokeWidth: 3 });
  path([s3.T([11, 0.3]), s3.T([9.5, 4]), s3.T([9.5, 9.6]), s3.T([6.4, 11.3])], 'r', Object.assign({ strokeWidth: 2.2 }, dash));
  arrow(...s3.T([7.6, 10.6]), ...s3.T([6.3, 11.3]), 'r');
  leaders([{ at: [-13, -7.6], s: 'pin board', c: 'k' }, { at: [-2, -2], s: 'dock magnet', c: 'g' },
    { at: [10.4, -4], s: 'pogo pin, pressed ~0.65', c: 'r' }, { at: [16.3, 0.35], s: 'key rib in groove', c: 'g' }],
  s3.T, top + win.h * ss + 11, 10.5, false);
  leaders([{ at: [-9, 12.1], s: 'XIAO (VBUS → charger)', c: 'b' }, { at: [-2, 3.1], s: 'pod magnet', c: 'g' },
    { at: [12.8, 0.5], s: 'brass pad → 5 V path', c: 'r' }], s3.T, s3.T([0, 19])[1] - 6, 10.5, true);
}

// ================================================================= D3. vest mount
function panelD3() {
  const G = GEOM.mount, [X, Y] = at('D3', 0, 0), s = 1.3;
  const tp = view(G.top, X + 30, Y + 68, s);
  viewTitle(tp.X1 + 6, tp.Y0 - 8, 'TOP 1.3:1');
  draw(G.rim, tp.T, s, 'k', { strokeWidth: 1 });
  for (const sh of G.face.slice(1)) {
    if (sh.circle) { const [cx, cy] = tp.T(sh.circle); circ(cx, cy, 2 * sh.circle[2] * s, sh.circle[2] > 4 ? 'g' : 'k', sh.circle[2] > 4 ? fillOf('g') : undefined); }
    else draw([sh], tp.T, s, 'k');
  }
  dimH(tp.X0, tp.X1, tp.Y0 - 10, '76', 'k', 10.5);
  dimV(tp.X0 - 8, tp.Y0, tp.Y1, '44', 'k', 10.5);
  const fr = view(G.front, X + 30, tp.Y1 + 20, s);
  dimV(fr.X0 - 8, fr.Y0, fr.Y1, '8.1', 'k', 10.5);
  viewTitle(fr.X0 + 60, fr.Y0 - 4, 'FRONT');
  const P = iso(X + 200, Y + 95, 0.9), oc = G.top[0].poly;
  loft([ring2(oc, 0), ring2(oc, 2.05)], P);
  loft([ring2(oc, 2.05, 29.35 / 38, 18.85 / 22), ring2(oc, 8.15, 27.7 / 38, 17.5 / 22)], P);
  text(X + 170, Y + 140, 'magnet Ø10.2 flush\nkey rib · thumb notch\n6 sewing holes\n2 strap slots (20 mm)', 10.5, 'g');
}

// ================================================================= D4. gloves (L + R)
function hand(cx, wy, s, mirror, ink) {   // back of the hand; wy = wrist line; returns finger tips (index..pinky)
  const mx = x => cx + (mirror ? -x : x) * s, my = y => wy - y * s;
  // palm 80 wide, 75 knuckle-to-wrist (glove PCB spec); fingers schematic
  const palm = [[-38, 0], [-40, 60], [-36, 75], [36, 75], [40, 60], [38, 0]];
  path(palm.map(([x, y]) => [mx(x), my(y)]), ink);
  const fingers = [[-27, 62], [-9, 70], [9, 66], [26, 52]], tips = [];   // index .. pinky (x from the thumb side)
  fingers.forEach(([fx, L]) => {
    path([[mx(fx - 7), my(75)], [mx(fx - 7), my(75 + L)], [mx(fx + 7), my(75 + L)], [mx(fx + 7), my(75)]], ink);
    tips.push([mx(fx), my(75 + L)]);
  });
  path([[mx(-38), my(28)], [mx(-62), my(55)], [mx(-58), my(62)], [mx(-36), my(48)]], ink);   // thumb
  line(mx(-44), my(-2), mx(44), my(-2), 'k', { strokeWidth: 3 }); line(mx(-44), my(-14), mx(44), my(-14), 'k', { strokeWidth: 3 });  // wrist strap
  return { tips, fingers, mx, my, thumb: [mx(-60), my(58)] };
}
function panelD4() {
  const [X, Y] = at('D4', 0, 0), s = 0.75;
  // LEFT hand (back view: thumb on the right) and RIGHT hand (thumb on the left)
  const both = [['LEFT (back of hand)', X + 75, false], ['RIGHT (back of hand)', X + 225, true]];
  both.forEach(([ttl, cx, isRight]) => {
    const wy = Y + 190, h = hand(cx, wy, s, !isRight, 'k');
    text(cx, Y + 56, ttl, 11, 'k', 'middle', 'bold');
    // carrier box 65 x 61 on the back of the hand
    rect(Math.min(h.mx(-32.5), h.mx(32.5)), h.my(67), 65 * s, 61 * s, 'k', { strokeWidth: 2 });
    text(cx, h.my(38), 'box', 10, 'k', 'middle');
    // battery on the wrist strap + 2-wire tether to J5
    rect(Math.min(h.mx(-14), h.mx(14)), h.my(-3), 28 * s, 10 * s, 'r', fillOf('r'));
    line(cx - 3, h.my(-3), cx - 3, h.my(6), 'r'); line(cx + 3, h.my(-3), cx + 3, h.my(6), 'k', { strokeWidth: 1 });
    h.fingers.forEach(([fx, L], i) => {
      const x = h.mx(fx);
      line(x, h.my(67), x, h.my(isRight ? 75 + L - 6 : 75 + L - 8), 'b', { strokeWidth: 0.9 });   // sensor cable
      if (!isRight) rect(x - 3, h.my(75 + L - 4), 6, (L - 4) * s, 'g', { strokeWidth: 0.9 });     // splint along the finger
      else circ(x, h.my(75 + L - 5), 8, 'b', fillOf('b'));                                     // FSR pad at the tip
      void i;
    });
    if (!isRight) text(cx, Y + 210, 'flex sensor in a splint\nalong each finger', 9.5, 'g', 'middle');
    else { text(h.thumb[0] - 2, h.thumb[1] - 8, 'thumb =\ncontact', 9.5, 'g', 'end'); text(cx, Y + 210, 'FSR pad at each fingertip,\npressed by the thumb', 9.5, 'b', 'middle'); }
  });
  text(X + 14, Y + 231, 'battery on the wrist strap, 2-wire tether (red); box on the back of the hand (glove PCB spec)', 9.5, 'r');

  // inside the box: carrier board v1, 2:1 (KiCad coordinates, board 100..160 x 100..156)
  const bx = X + 282, by = Y + 84, k2 = 2, B = (x, y) => [bx + (x - 100) * k2, by + (y - 100) * k2];
  text(bx, Y + 56, 'INSIDE THE BOX: carrier v1 60 × 56, 2:1', 11, 'grey');
  path([B(110, 100), B(150, 100), B(160, 110), B(160, 150), B(146, 156), B(107, 156), B(100, 150), B(100, 110), B(110, 100)], 'k');
  ['index', 'middle', 'ring', 'pinky'].forEach((f, i) => {
    const x = 112 + 12 * i;
    rect(...B(x - 3, 101), 6 * k2, 5 * k2, 'k');
    text(B(x, 0)[0], B(0, 100)[1] - 3, `J${i + 1}`, 9.5, 'k', 'middle');
    text(B(x, 0)[0], by - 13, `A${3 - i}`, 9.5, 'b', 'middle');
    circ(...B(x - 2.5, 115.5), 3, 'k'); circ(...B(x - 2.5, 119.5), 3, 'k'); circ(...B(x - 0.5, 123.5), 5, 'k');
  });
  text(B(161, 0)[0] + 2, B(0, 117)[1], 'dividers\nR1–R8,\nC1–C4', 9, 'k');
  text(B(161, 0)[0] + 2, B(0, 102)[1], 'J1 index …\nJ4 pinky', 9, 'b');
  rect(...B(117.5, 130.1), 21 * k2, 17.8 * k2, 'b', fillOf('b'));
  rect(...B(138.5, 136), 3 * k2, 6 * k2, 'k');
  text(B(116.5, 0)[0], B(0, 133.5)[1], 'XIAO\nSense', 9.5, 'b', 'end');
  text(B(142, 0)[0] + 2, B(0, 133)[1], 'USB-C', 9, 'k');
  rect(...B(108, 140), 8 * k2, 4 * k2, 'r'); text(B(105, 0)[0], B(0, 150)[1] + 2, 'J5 battery', 9, 'r');
  for (const [hx, hy] of [[103, 108], [157, 108], [103, 146], [157, 146]]) circ(...B(hx, hy), 4.4, 'k');

  // L vs R table
  const tx = X + 446;
  text(tx, Y + 62, 'L vs R', 11, 'k', 'start', 'bold');
  const rows = [['', 'LEFT', 'RIGHT'], ['sensors', '4 flex', '4 FSR402'], ['divider', '68 k', '10 k'], ['in', 'R1–R4', 'R5–R8'],
    ['IMU', 'deadman,', 'off now;'], ['', 'shake ESTOP', 'B: wrist drive'], ['box h', '25.6', '22.6']];
  rows.forEach((r, i) => r.forEach((c, j) => text(tx + [0, 38, 92][j], Y + 82 + i * 15, c, 10, i === 0 ? 'grey' : 'k')));
  line(tx, Y + 86, tx + 146, Y + 86, 'grey', { strokeWidth: 0.8, roughness: 0.3 });
}

// ================================================================= D5. hub + Pi
function panelD5() {
  const [X, Y] = at('D5', 0, 0);
  // placement: Pi 5 + hub + USB-C power bank ride on the vest
  text(X + 14, Y + 58, 'WHERE', 10.5, 'grey');
  const ox = X + 46, oy = Y + 70;
  circ(ox, oy, 18);                                                          // head
  rect(ox - 16, oy + 10, 32, 38);                                            // vest
  line(ox - 16, oy + 14, ox - 32, oy + 44); line(ox + 16, oy + 14, ox + 32, oy + 44);   // arms
  rect(ox - 37, oy + 44, 9, 9); rect(ox + 28, oy + 44, 9, 9);              // gloves
  line(ox - 7, oy + 48, ox - 10, oy + 68); line(ox + 7, oy + 48, ox + 10, oy + 68);     // legs
  circ(ox - 24, oy + 28, 6); circ(ox + 24, oy + 28, 6);                      // sleeve pods
  rect(ox - 12, oy + 18, 16, 11, 'k'); rect(ox + 5, oy + 20, 7, 7, 'b');     // Pi + hub on the vest
  arrow(ox - 31, oy + 44, ox + 4, oy + 26, 'b', dash);                       // left glove -> hub
  arrow(ox + 31, oy + 44, ox + 12, oy + 28, 'b', dash);                      // right glove -> hub
  arrow(ox + 24, oy + 22, ox + 12, oy + 22, 'b', dash);                      // sleeve pod -> hub
  const rbx = X + 90, rby = Y + 74;                                         // a ROSbot
  rect(rbx, rby, 22, 13); circ(rbx + 5, rby + 15, 6); circ(rbx + 17, rby + 15, 6);
  arrow(ox + 2, oy + 16, rbx - 3, rby + 6, 'b', dash);
  text(rbx + 11, rby + 32, 'ROSbots', 9, 'k', 'middle');
  text(X + 66, Y + 74, 'Wi-Fi', 9, 'b');
  rect(ox - 11, oy + 34, 20, 9, 'r', fillOf('r'));                         // power bank on the vest
  line(ox - 4, oy + 29, ox - 4, oy + 34, 'r');
  line(ox + 9, oy + 39, X + 84, Y + 131, 'r', { strokeWidth: 0.8 });
  text(X + 14, Y + 152, 'Pi 5 + hub + USB-C power bank on the vest', 9.5, 'k');
  text(X + 14, Y + 163, 'BLE: gloves + pods → hub', 9.5, 'b');
  text(X + 86, Y + 138, 'bank 5 V 5 A', 9, 'r');

  // Pi 5 outline 85 x 56 at 1.1:1, only the ports that matter
  const s = 1.0, px = X + 150, py = Y + 62, W = 85 * s, H = 56 * s;
  rect(px, py, W, H); text(px + W / 2 - 8, py + H / 2 + 2, 'Pi 5', 13, 'k', 'middle');
  dimH(px, px + W, py - 6, '85', 'k', 9.5); dimV(px - 16, py, py + H, '56', 'k', 9.5);
  for (let i = 0; i < 2; i++) rect(px + W - 4, py + 6 + i * 16, 10, 13, 'k');      // USB-A pairs
  rect(px + W - 4, py + H - 18, 10, 14, 'k');                                       // Ethernet
  rect(px + 6, py + H - 4, 10, 6, 'r');                                              // USB-C power
  text(px, py + H + 14, 'USB-C power in (power bank)', 9, 'r');
  text(px, py + H + 26, 'Ethernet unused (Wi-Fi)', 9, 'k');
  // hub on a USB-A port, 2:1
  const hx = X + 196, hy = Y + 160, hs = 2;
  path([[px + W + 6, py + 12], [px + W + 20, py + 12], [px + W + 20, hy + 8.9 * hs], [hx + 21 * hs + 4, hy + 8.9 * hs]], 'k', { strokeWidth: 2.2 });
  rect(hx, hy, 21 * hs, 17.8 * hs, 'b'); rect(hx + 21 * hs - 2, hy + 8.9 * hs - 5, 6, 10, 'k');
  text(hx + 21 * hs / 2, hy + 8.9 * hs + 3, 'XIAO', 10, 'b', 'middle');
  text(hx + 21 * hs + 6, hy + 8.9 * hs + 16, 'USB-C', 8.5, 'k');
  text(hx, hy + 17.8 * hs + 12, 'hub 21 × 17.8', 9, 'b');

  // runs here
  text(X + 14, Y + 176, 'RUNS HERE', 10.5, 'grey');
  text(X + 14, Y + 188, 'hub XIAO: hub firmware (BLE\ncentral, 8 links → JSON over USB)', 9.5, 'b');
  text(X + 14, Y + 212, 'Pi 5 (ROS 2): vest_serial_bridge,\ngesture_pipeline, swarm_control,\nhaptic_vest, optitrack_pose_beacon', 9.5, 'k');
}

// ================================================================= E. power
function panelE() {
  const [X, Y] = at('E', 0, 0);
  text(X + 18, Y + 54, 'DOCK → POD CHARGING (follow the snake)', 11, 'grey');
  const chain = ['USB-C 5 V', 'Adafruit 6050\n(5.1 k CC)', '6 pin boards\n(daisy-chain)', 'pod brass pads\n(+5 V at +x)', '2 pogo pins\nper pocket',
    '', 'wires in floor\ngrooves', 'XIAO VBUS', 'charger 50 mA\n→ LiPo 150 mAh'];
  const bw = 88, bh = 32, gx = 14, gy = 16, x0 = X + 18, y0 = Y + 64;
  const pos = i => [x0 + (i % 3) * (bw + gx), y0 + Math.floor(i / 3) * (bh + gy)];
  chain.forEach((s, i) => { if (s) { const [x, y] = pos(i); box(x, y, bw, bh, s, 'r', 10.5); } });
  const mid = (i, side) => { const [x, y] = pos(i); return side === 'r' ? [x + bw, y + bh / 2] : side === 'l' ? [x, y + bh / 2] : side === 'b' ? [x + bw / 2, y + bh] : [x + bw / 2, y]; };
  arrow(...mid(0, 'r'), ...mid(1, 'l'), 'r'); arrow(...mid(1, 'r'), ...mid(2, 'l'), 'r');
  arrow(...mid(2, 'b'), mid(2, 'b')[0], pos(4)[1] + bh / 2, 'r');
  line(mid(2, 'b')[0], pos(4)[1] + bh / 2, ...mid(4, 'r'), 'r');
  arrow(...mid(4, 'l'), ...mid(3, 'r'), 'r');
  arrow(...mid(3, 'b'), ...mid(6, 't'), 'r');
  arrow(...mid(6, 'r'), ...mid(7, 'l'), 'r'); arrow(...mid(7, 'r'), ...mid(8, 'l'), 'r');

  // pod motor driver
  const sx = X + 50, y0m = Y + 222, xm = sx + 70, xd = sx + 115;
  text(X + 18, y0m - 12, 'POD MOTOR DRIVER', 11, 'grey');
  text(X + 18, y0m + 4, 'BAT+', 11, 'r'); line(sx, y0m, xd, y0m, 'r');
  line(xm, y0m, xm, y0m + 14); circ(xm, y0m + 29, 30); text(xm, y0m + 33, 'M', 12, 'k', 'middle');
  line(xm, y0m + 44, xm, y0m + 62);
  line(xd, y0m, xd, y0m + 22); poly([[xd - 8, y0m + 38], [xd + 8, y0m + 38], [xd, y0m + 24]]); line(xd - 8, y0m + 23, xd + 8, y0m + 23);
  line(xd, y0m + 38, xd, y0m + 62); line(xd, y0m + 62, xm, y0m + 62);
  line(xm, y0m + 62, xm, y0m + 72);
  box(xm - 18, y0m + 72, 36, 30, 'Q1', 'k', 11);
  text(xm + 21, y0m + 80, 'D', 10); text(xm + 21, y0m + 102, 'S', 10); text(xm - 22, y0m + 84, 'G', 10, 'k', 'end');
  line(xm, y0m + 102, xm, y0m + 116);
  line(xm - 10, y0m + 116, xm + 10, y0m + 116); line(xm - 6, y0m + 120, xm + 6, y0m + 120); line(xm - 2, y0m + 124, xm + 2, y0m + 124);
  line(X + 18, y0m + 87, xm - 18, y0m + 87, 'b'); text(X + 18, y0m + 82, 'D0 PWM', 11, 'b');
  line(sx + 8, y0m + 87, sx + 8, y0m + 96); path([[sx + 8, y0m + 96], [sx + 13, y0m + 99], [sx + 3, y0m + 103], [sx + 13, y0m + 107], [sx + 8, y0m + 110]]);
  line(sx + 8, y0m + 110, sx + 8, y0m + 118); line(sx + 2, y0m + 118, sx + 14, y0m + 118);
  text(sx - 2, y0m + 106, '100 k', 10, 'k', 'end');
  text(xd + 16, y0m + 14, wrap('diode 1N4148W across the motor, stripe → BAT+', 22), 10);
  text(xd + 16, y0m + 76, wrap('Q1 = SI2302 MOSFET, source to GND, gate held low by 100 k', 22), 10);
  text(X + 18, Y + 362, 'glove: LiPo 500 mAh → XIAO Sense, charged on its own USB-C at 100 mA', 10.5, 'r');
}

// ================================================================= F. software
function panelF() {
  const [X, Y] = at('F', 0, 0);
  const B = (x, y, w, h, s, c = 'k', size = 10.5) => box(X + x, Y + y, w, h, s, c, size);
  const A = (x1, y1, x2, y2, c = 'b', e, both) => arrow(X + x1, Y + y1, X + x2, Y + y2, c, e, both);
  const Tt = (x, y, s, size = 10, c = 'b', anchor) => text(X + x, Y + y, s, size, c, anchor);
  // firmware -> hub
  B(14, 46, 86, 28, 'glove_left\n48 B @ 50 Hz', 'b', 10); B(14, 80, 86, 28, 'glove_right\n9 B @ 50 Hz', 'b', 10);
  B(14, 114, 86, 28, 'pod ×6: 2 B\nstop after 300 ms', 'b', 9.5);
  B(150, 48, 120, 32, 'hub fw (BLE central)', 'b');
  A(100, 60, 150, 62); A(100, 94, 150, 70); A(150, 76, 100, 128);
  Tt(300, 58, 'ROS 2 side: unchanged', 11, 'k');
  Tt(14, 160, 'firmware: Arduino + Bluefruit,\nshared lib hv_common', 9.5, 'grey');
  Tt(14, 190, 'hub → Pi: hermes.hub.v1,\n.status, .devices (1/s)\nPi → hub: V1,<seq>,m1..m6', 9.5);
  // ROS node chain
  B(150, 106, 120, 32, 'vest_serial_bridge_node', 'k', 10);
  A(210, 80, 210, 106, 'b', undefined, true); Tt(276, 98, 'USB 921 600');
  B(150, 168, 120, 32, 'gesture_pipeline_node', 'k', 10);
  B(150, 228, 120, 32, 'swarm_control_node', 'k', 10);
  B(150, 290, 120, 32, 'robot agent ×3 (ROSbots)', 'k', 10);
  A(210, 138, 210, 168); Tt(276, 158, '/hermes/raw_input');
  A(210, 200, 210, 228); Tt(276, 214, '/hermes/command_packets');
  A(210, 260, 210, 290); Tt(276, 282, '/hermes/swarm_intent 10 Hz');
  Tt(276, 310, '→ /cmd_vel 20 Hz');
  // haptic feedback back to the vest
  B(380, 228, 106, 32, 'haptic_vest_node', 'k', 10);
  A(270, 244, 380, 244);
  path([[X + 420, Y + 228], [X + 420, Y + 122]], 'b', dash); A(420, 122, 270, 122, 'b', dash);
  Tt(424, 170, 'vest_serial_tx\n20 Hz', 9.5);
  // OptiTrack pose beacons -> swarm_control_node and haptic_vest_node
  B(14, 240, 100, 30, 'optitrack_pose_\nbeacon_node', 'k', 9.5);
  A(114, 248, 150, 248);
  path([[X + 64, Y + 270], [X + 64, Y + 336], [X + 433, Y + 336]], 'b'); A(433, 336, 433, 260);
  Tt(14, 232, '/hermes/robot_state_beacon', 9.5);
}

// ================================================================= G. gestures
function panelG() {
  const [X, Y] = at('G', 0, 0);
  const cw = [74, 200, 200], x0 = X + 12, y0 = Y + 58, size = 10;
  ['mode', 'CURRENT (fix/gesture-bugs)', 'OPTION B (in development)'].forEach((h, i) =>
    text(x0 + cw.slice(0, i).reduce((a, b) => a + b, 0), y0, h, 12, i === 2 ? 'b' : 'k', 'start', 'bold'));
  const rows = [
    ['OPEN\nDRIVE', 'left hand tilt drives · M tap soft stop, M 2× resume · R tap yaw toggle · R hold precision',
      'I hold + right wrist tilt drives (30° full, 4° dead zone) · M hold + roll: speed 0–4 · R hold + roll: aggression 1–4 · P tap yaw'],
    ['POINT\nSELECT', 'I/M/R/P tap: group A–D, 2×: E–G · P 2× confirm group · group edit: tap r1–r4, hold r5 / r6',
      'I/M/R/P tap: toggle r1–r4 · I/M hold: toggle r5 / r6 · R hold: all ⇄ none'],
    ['FIST\nFORM-\nATION', 'tap: LINE, COLUMN, WEDGE, CIRCLE · 2×: ECHELON_L, ECHELON_R, GRID, DIAMOND · hold: I orient, M apply, R spacing, P break',
      'tap: LINE, COLUMN, WEDGE, CIRCLE · I hold + roll: menu of 9 · M: spacing 0.70–1.60 m · R: heading 45°/step · P hold: confirm'],
    ['TWO\nBEHAV-\nIOR', 'tap: PATROL, FOLLOW_PATH, HOLD_ANCHOR, RETURN_HOME · I/M 2×: PATROL_PERIMETER, FOLLOW_PATH_LOOP · R/P hold: FOLLOW_ME, DISPERSE_SCAN',
      'tap: PATROL, FOLLOW_PATH, HOLD_ANCHOR, RETURN_HOME · I hold + roll: menu of 8 · P hold: confirm'],
    ['THREE\nPARAMS', 'I/M tap: speed −/+ · R/P tap: spacing −/+ · R/P 2×: aggression −/+ · hold = min / max', 'removed: speed, spacing and aggression become dials'],
    ['SAFETY\nany mode', 'left palm-up = deadman off · left shake = ESTOP', 'palm-up gate · knock = PAUSE · two-hand shake = ESTOP · P hold 600 ms = confirm / RESUME'],
  ];
  let y = y0 + 8;
  rows.forEach(r => {
    const cells = [r[0], wrap(r[1], 43), wrap(r[2], 43)];
    const n = Math.max(...cells.map(c => c.split('\n').length));
    line(x0, y, x0 + cw[0] + cw[1] + cw[2] - 10, y, 'grey', { strokeWidth: 1, roughness: 0.3 });
    let cx = x0;
    cells.forEach((c, i) => { text(cx, y + size + 4, c, size, i === 2 ? 'b' : 'k', 'start', i === 0 ? 'bold' : undefined); cx += cw[i]; });
    y += n * size * 1.12 + 9;
  });
  text(x0, Y + 360, 'I M R P = right index / middle / ring / pinky FSR · 2× = double tap · roll = right wrist (B) · B: taxonomy:=b', 9.5, 'grey');
}

// ---------------------------------------------------------------- board map
function boardMap() {
  for (let x = 0; x <= BOARD.w; x += 100) { line(x, 0, x, BOARD.h, 'grey', { strokeWidth: 0.6, roughness: 0 }); text(x + 3, 14, x / 10, 11, 'grey'); }
  for (let y = 0; y <= BOARD.h; y += 100) { line(0, y, BOARD.w, y, 'grey', { strokeWidth: 0.6, roughness: 0 }); text(3, y - 3, y / 10, 11, 'grey'); }
  const order = { A: 1, E: 2, G: 3, D1: 4, D2: 5, D3: 6, D5: 7, D4: 8, B: 9, C: 10, F: 11 };
  for (const p of PANELS) {
    frame(p, true);
    text(p.x + p.w / 2, p.y + p.h / 2 + 4, `${p.w / 10} × ${p.h / 10} cm`, 26, 'k', 'middle');
    text(p.x + p.w / 2, p.y + p.h / 2 + 34, `top-left at (${p.x / 10}, ${p.y / 10}) cm · draw #${order[p.id]}`, 15, 'grey', 'middle');
  }
}

// ---------------------------------------------------------------- main
function makeSvg(parent, vb, wmm, hmm) {
  const el = document.createElementNS(NS, 'svg');
  el.setAttribute('viewBox', vb); el.setAttribute('width', wmm + 'mm'); el.setAttribute('height', hmm + 'mm');
  parent.appendChild(el); return el;
}
function render() {
  const mode = window.MODE || (location.hash || '#board').slice(1);
  const root = document.getElementById('root');
  document.body.className = mode;
  if (mode === 'map') {
    svg = makeSvg(root, `0 0 ${BOARD.w} ${BOARD.h}`, 566.7, 400); rc = rough.svg(svg);
    boardMap(); return;
  }
  svg = makeSvg(root, `0 0 ${BOARD.w} ${BOARD.h}`, 850, 600); rc = rough.svg(svg);
  const bg = document.createElementNS(NS, 'rect'); bg.setAttribute('width', BOARD.w); bg.setAttribute('height', BOARD.h); bg.setAttribute('fill', '#fff'); svg.appendChild(bg);
  PANELS.forEach(p => frame(p));
  panelA(); panelB(); panelC(); panelD1(); panelD2(); panelD3();
  panelD4(); panelD5();
  panelE(); panelF(); panelG();
  if (mode === 'panels') {           // one landscape A4-ish page per panel, cut from the same drawing
    const whole = svg; whole.remove();
    for (const p of PANELS) {
      const pg = document.createElement('div'); pg.className = 'page'; root.appendChild(pg);
      const r = Math.min(277 / p.w, 190 / p.h);
      const s2 = makeSvg(pg, `${p.x} ${p.y} ${p.w} ${p.h}`, p.w * r, p.h * r);
      s2.innerHTML = whole.innerHTML;
    }
  }
}
window.addEventListener('DOMContentLoaded', render);
