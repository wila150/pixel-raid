// 萬劍仙途 — 秘境（企劃 16 第一版）：用仙界角色進「獨立小地圖」，清怪到秘境之力 100% → 王門 → 秘境之主 → 結算
// 做法：進場把 W0 的地圖（wmap）、怪物、營地、掉落存起來，換成秘境自己的；出來再換回去。
// 秘境地形放在大地圖陣列的同一個座標範圍（IX0..IX0+IW, IY0..IY0+IH，遠離傳送陣／祭壇／NPC），其他格子全部是石頭，
// 所以碰撞、畫地形、子彈都不用改；zoneAt 在秘境裡固定回傳主題地區（畫面、怪物種類跟著換）。
"use strict";

const RIFT_IX0 = 40, RIFT_IY0 = 3, RIFT_IW = 180, RIFT_IH = 106; // 企劃 77：放大到 180×106（x 640–3520、y 48–1744）。範圍會蓋到青雲城、傳送陣、祭壇，世界那些照座標判斷的東西在秘境裡都跳過（world.js inRiftW）
const RIFT_LIVES = 3;
const riftLives = (tier) => (tier <= 10 ? 3 : tier <= 15 ? 2 : 1); // 企劃 52
const riftMobLv = (tier) => Math.max(riftLv(tier), ((save.w && save.w.lv) || 1) - 5); // 企劃 52：怪等級跟著你（最低是這層的等級）
const riftHpK = (tier) => 1 + 0.03 * tier; // 企劃 52：小怪血量小加
const RIFT_TK_HP = 1.08, RIFT_TK_HP2 = 1.15, RIFT_TK_DMG = 1.1; // 企劃 65 §8：血量 11–15 層 ×1.08、16 層起 ×1.15／層 // 企劃 65：第 11 層起每層（複利）怪血 ×1.12、傷害 ×1.1（bot 量過：企劃原本 ×1.05 太小）
const riftTierK = (tier) => { const n = Math.max(0, (tier || 0) - 10), a = Math.min(n, 5), c = n - a; return { hp: Math.pow(RIFT_TK_HP, a) * Math.pow(RIFT_TK_HP2, c), dmg: Math.pow(RIFT_TK_DMG, n) }; }; // 企劃 65 §8：血量兩段
let RIFT = null, RIFT_PEND = null, riftAskEl = null;
const riftTheme = (tier) => (tier <= 5 ? (tier % 2 ? "grass" : "forest") : tier <= 10 ? (tier % 2 ? "volcano" : "snow") : tier <= 15 ? (tier % 2 ? "swamp" : "thunder") : "sky"); // 11–15 沼澤／雷谷、16 以上仙域（企劃 16 §3-2）
const riftUnlocked = () => !!save.w && ((save.w.wp || []).includes("swamp") || save.w.lv >= 30);
const riftT2W = (tx, ty) => ({ x: (RIFT_IX0 + tx) * TS + 8, y: (RIFT_IY0 + ty) * TS + 8 });

// 秘境裡 zoneAt 固定是主題地區
const _zoneAtR = zoneAt;
zoneAt = function (x, y) { return RIFT ? RIFT.theme : _zoneAtR(x, y); };

function riftTile(z, n, v) { // 跟 buildWorld 同一套地形規則（障礙少一點，打起來順）
  if (z === "grass") return n > 0.74 && v < 0.4 ? 1 : v > 0.99 ? 2 : 0;
  if (z === "forest") return n > 0.5 && v < 0.5 ? 1 : n < 0.08 ? 4 : v > 0.988 ? 2 : 0;
  if (z === "volcano") return n > 0.7 && v < 0.5 ? 3 : v > 0.97 ? 2 : 0;
  if (z === "snow") return n > 0.68 && v < 0.45 ? 1 : n < 0.1 ? 4 : v > 0.98 ? 2 : 0;
  if (z === "swamp") return n < 0.14 ? 4 : n > 0.72 && v < 0.45 ? 1 : v > 0.985 ? 2 : 0;
  if (z === "thunder") return n > 0.7 && v < 0.5 ? 2 : v > 0.975 ? 2 : 0;
  if (z === "sky") return n > 0.76 && v < 0.4 ? 1 : v > 0.99 ? 2 : 0;
  return 0;
}
// ==RGEN== 企劃 77 §A：秘境＝房間＋走廊拼接（長廊 lane／環道 ring／廣場 arena）。純函式，回傳本地格子（0..IW-1, 0..IH-1）
const RLAY = { lane: "長廊", ring: "環道", arena: "廣場" }, RLAY_KEYS = ["lane", "ring", "arena"];
function riftGen(seed, lay, theme) {
  for (let att = 0; att < 30; att++) { const G = riftGenTry(seed + att * 7919, lay, theme); if (G) return G; }
  return null;
}
function riftGenTry(seed, lay, theme) {
  const r = mulberry32(seed), IW = RIFT_IW, IH = RIFT_IH, M = 2, N = IW * IH;
  const ri = (a, b) => a + Math.floor(r() * (b - a + 1)), pick = (a) => a[Math.floor(r() * a.length)];
  const g = new Uint8Array(N).fill(2), hall = new Uint8Array(N), rm = new Int16Array(N).fill(-1);
  // 格子切法：cols／rows 的寬高（浮點→整數邊界）
  const bounds = (tot, ws) => { const s = ws.reduce((a, b) => a + b, 0), out = [M]; let acc = M; for (const w of ws) { acc += w / s * tot; out.push(Math.round(acc)); } return out; };
  let colW, rowH, cells = [], boss = null, path = [], branchCells = [], extra = [], startCell = null, campN;
  const flipX = r() < 0.5, flipY = r() < 0.5;
  const cellKey = (c, rr) => c + "," + rr;
  if (lay === "ring") {
    colW = [1, 1, 1, 1]; rowH = [1, 1, 1];
    // 起點 (0,2) → (0,1) → (0,0) → (1,0) → (2,0) → (3,0) → (3,1) → (3,2) → (2,2) → 王 (1,1–2) → 回起點；中間 (2,1) 是石山＋一條支線
    path = [[0, 2], [0, 1], [0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [2, 2]];
    boss = { c0: 1, c1: 1, r0: 1, r1: 2 };
    branchCells = [[[2, 1], pick([[2, 0], [3, 1], [2, 2]])]];
    campN = () => ri(2, 3);
  } else if (lay === "arena") {
    colW = [26, 50, 50, 50]; rowH = [1, 1];
    const br = ri(0, 1), sr = ri(0, 1);
    boss = { c0: 3, c1: 3, r0: br, r1: br };
    // 起點在第 0 欄（整欄一格），另一列放支線
    const free = []; for (let c = 1; c <= 3; c++) for (let q = 0; q < 2; q++) if (!(c === 3 && q === br)) free.push([c, q]);
    const hp = hamPath(free, [1, sr], 5, (e) => adjBoss(e, boss), r); if (!hp) return null;
    path = [[0, sr]].concat(hp);
    branchCells = [[[0, 1 - sr], [1, 1 - sr]]];
    // 多接 1–2 條捷徑（沒有死路）
    for (let i = 0; i < hp.length; i++) for (let j = i + 2; j < hp.length; j++) if (Math.abs(hp[i][0] - hp[j][0]) + Math.abs(hp[i][1] - hp[j][1]) === 1 && r() < 0.6) extra.push([hp[i], hp[j]]);
    campN = () => 4;
  } else { // lane
    colW = [1, 1, 1, 1, 1]; rowH = [1, 1, 1];
    const br = ri(0, 1); boss = { c0: 3, c1: 4, r0: br, r1: br + 1 };
    const free = []; for (let c = 0; c <= 4; c++) for (let q = 0; q < 3; q++) if (!(c >= 3 && q >= br && q <= br + 1)) free.push([c, q]);
    let hp = null; for (let t = 0; t < 6 && !hp; t++) hp = hamPath(free, [0, ri(0, 2)], 9, (e) => adjBoss(e, boss), r);
    if (!hp) return null;
    path = hp;
    for (const f of free) if (!hp.some((h) => h[0] === f[0] && h[1] === f[1])) { const nb = hp.filter((h) => Math.abs(h[0] - f[0]) + Math.abs(h[1] - f[1]) === 1 && h !== hp[0]); if (nb.length) branchCells.push([f, pick(nb)]); }
    campN = () => ri(2, 3);
  }
  const xs = bounds(IW - 2 * M, colW), ys = bounds(IH - 2 * M, rowH), nc = colW.length, nr = rowH.length;
  const fx = (c) => (flipX ? nc - 1 - c : c), fy = (q) => (flipY ? nr - 1 - q : q);
  const rect = (c0, c1, r0, r1) => { const a = fx(c0), b = fx(c1), u = fy(r0), v = fy(r1); return { x0: xs[Math.min(a, b)], x1: xs[Math.max(a, b) + 1], y0: ys[Math.min(u, v)], y1: ys[Math.max(u, v) + 1] }; };
  const rooms = [];
  const addRoom = (kind, R, w, h, shape) => { // 在格子 R 裡放一間房（離格子邊至少 5 格 → 房間間距 ≥ 10）
    w = Math.min(w, R.x1 - R.x0 - 10); h = Math.min(h, R.y1 - R.y0 - 10);
    const cl = (v, a, b) => Math.max(a, Math.min(b, v)); // 放在格子中間附近（±3），走廊才不會太長
    const x0 = cl(Math.round((R.x0 + R.x1 - w) / 2) + ri(-3, 3), R.x0 + 5, R.x1 - 5 - w), y0 = cl(Math.round((R.y0 + R.y1 - h) / 2) + ri(-3, 3), R.y0 + 5, R.y1 - 5 - h);
    const o = { id: rooms.length, kind, x0, y0, w, h, cx: x0 + Math.floor(w / 2), cy: y0 + Math.floor(h / 2), shape, q: ri(0, 3) };
    rooms.push(o); return o;
  };
  const SZ = lay === "arena" ? [30, 36] : lay === "ring" ? [22, 30] : [22, 26];
  const fightShape = () => (lay === "arena" ? pick(["sq", "rd", "rd"]) : pick(["sq", "rd", "rd", "cross", "L"]));
  const cellRoom = {};
  const sc = path[0];
  if (lay === "arena") { const R = rect(0, 0, 0, 1), half = { x0: R.x0, x1: R.x1, y0: fy(sc[1]) === 0 ? R.y0 : Math.round((R.y0 + R.y1) / 2), y1: fy(sc[1]) === 0 ? Math.round((R.y0 + R.y1) / 2) : R.y1 }; cellRoom[cellKey(...sc)] = addRoom("start", half, 16, 16, "sq"); }
  else cellRoom[cellKey(...sc)] = addRoom("start", rect(sc[0], sc[0], sc[1], sc[1]), 16, 16, "sq");
  for (const c of path.slice(1)) cellRoom[cellKey(...c)] = addRoom("fight", rect(c[0], c[0], c[1], c[1]), ri(SZ[0], SZ[1]), ri(SZ[0], SZ[1]), fightShape());
  { const R = rect(boss.c0, boss.c1, boss.r0, boss.r1), d = Math.min(40, R.x1 - R.x0 - 10, R.y1 - R.y0 - 10); cellRoom.boss = addRoom("boss", R, d, d, "circ"); }
  const nB = lay === "lane" ? Math.min(2, branchCells.length) : 1, brs = [];
  for (const [bc, par] of branchCells.slice(0, nB)) {
    let R = rect(bc[0], bc[0], bc[1], bc[1]);
    if (lay === "arena") { const C = rect(0, 0, 0, 1), mid = Math.round((C.y0 + C.y1) / 2); R = { x0: C.x0, x1: C.x1, y0: fy(bc[1]) === 0 ? C.y0 : mid, y1: fy(bc[1]) === 0 ? mid : C.y1 }; }
    const o = addRoom("side", R, 16, 16, "sq"); brs.push([o, cellRoom[cellKey(...par)]]);
  }
  // 畫房間
  const inShape = (o, x, y) => {
    const u = (x - o.x0 + 0.5) / o.w, v = (y - o.y0 + 0.5) / o.h;
    if (u < 0 || u > 1 || v < 0 || v > 1) return false;
    if (o.shape === "circ") return (u - 0.5) ** 2 + (v - 0.5) ** 2 <= 0.25;
    if (o.shape === "cross") return Math.abs(u - 0.5) <= 0.3 || Math.abs(v - 0.5) <= 0.3;
    if (o.shape === "L") return !((o.q & 1 ? u > 0.55 : u < 0.45) && (o.q & 2 ? v > 0.55 : v < 0.45));
    if (o.shape === "rd") { const k = 0.28, cu = Math.min(Math.max(u, k), 1 - k), cv = Math.min(Math.max(v, k), 1 - k), m = Math.min(o.w, o.h) * k; return ((u - cu) * o.w) ** 2 + ((v - cv) * o.h) ** 2 <= m * m; }
    return true;
  };
  for (const o of rooms) for (let y = o.y0; y < o.y0 + o.h; y++) for (let x = o.x0; x < o.x0 + o.w; x++) if (inShape(o, x, y)) { g[y * IW + x] = 0; rm[y * IW + x] = o.id; }
  // 走廊：Z 字，轉彎在兩間房的空隙中間；寬 6–8
  let bad = false; const halls = [];
  const paint = (x0, y0, x1, y1, lo, hi, A, B) => {
    for (let y = Math.min(y0, y1) - lo; y <= Math.max(y0, y1) + hi; y++) for (let x = Math.min(x0, x1) - lo; x <= Math.max(x0, x1) + hi; x++) {
      if (x < M || y < M || x >= IW - M || y >= IH - M) { bad = true; continue; }
      const i = y * IW + x, k = rm[i];
      if (k >= 0 && k !== A.id && k !== B.id) bad = true;
      g[i] = 0; hall[i] = 1;
    }
  };
  const link = (A, B) => {
    const wd = ri(6, 8), lo = Math.floor((wd - 1) / 2), hi = wd - 1 - lo;
    const gx = Math.max(A.x0, B.x0) - Math.min(A.x0 + A.w, B.x0 + B.w), gy = Math.max(A.y0, B.y0) - Math.min(A.y0 + A.h, B.y0 + B.h);
    let mx, my;
    if (gx >= gy) { // 左右相鄰
      const [L, Rr] = A.cx < B.cx ? [A, B] : [B, A]; mx = Math.round((L.x0 + L.w + Rr.x0) / 2); my = Math.round((A.cy + B.cy) / 2);
      paint(A.cx, A.cy, mx, A.cy, lo, hi, A, B); paint(mx, A.cy, mx, B.cy, lo, hi, A, B); paint(mx, B.cy, B.cx, B.cy, lo, hi, A, B);
    } else {
      const [T, Bt] = A.cy < B.cy ? [A, B] : [B, A]; my = Math.round((T.y0 + T.h + Bt.y0) / 2); mx = Math.round((A.cx + B.cx) / 2);
      paint(A.cx, A.cy, A.cx, my, lo, hi, A, B); paint(A.cx, my, B.cx, my, lo, hi, A, B); paint(B.cx, my, B.cx, B.cy, lo, hi, A, B);
    }
    halls.push({ a: A.id, b: B.id, x: mx, y: my, len: Math.max(gx, gy) });
  };
  const chain = path.map((c) => cellRoom[cellKey(...c)]);
  for (let i = 0; i + 1 < chain.length; i++) link(chain[i], chain[i + 1]);
  link(chain[chain.length - 1], cellRoom.boss);
  if (lay === "ring") link(cellRoom.boss, chain[0]);
  for (const [a, b] of extra) link(cellRoom[cellKey(...a)], cellRoom[cellKey(...b)]);
  const nMain = halls.length;
  for (const [o, par] of brs) link(par, o);
  if (bad) return null;
  // 營地：房間裡，離房間邊 ≥4、離中心 ≥5（中心留給事件）、彼此 ≥7
  const camps = [];
  for (const o of rooms) {
    if (o.kind !== "fight") continue;
    o.camps = []; const n = campN();
    for (let t = 0; t < 300 && o.camps.length < n; t++) {
      const x = ri(o.x0 + 4, o.x0 + o.w - 5), y = ri(o.y0 + 4, o.y0 + o.h - 5);
      if (!inShape(o, x - 3, y) || !inShape(o, x + 3, y) || !inShape(o, x, y - 3) || !inShape(o, x, y + 3)) continue;
      if (Math.hypot(x - o.cx, y - o.cy) < 5 || o.camps.some((c) => Math.hypot(c.x - x, c.y - y) < 7)) continue;
      o.camps.push({ x, y }); camps.push({ x, y, room: o.id });
    }
  }
  // 障礙：只在戰鬥房裡、離房間邊和走廊 4 格外、離中心和營地 3 格外
  const sx = r() * 500, sy = r() * 500;
  const okObs = (x, y, id) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const i = (y + dy) * IW + x + dx; if (rm[i] !== id || hall[i]) return false; } return true; };
  for (const o of rooms) {
    if (o.kind !== "fight") continue;
    for (let y = o.y0; y < o.y0 + o.h; y++) for (let x = o.x0; x < o.x0 + o.w; x++) {
      const v = r(); if (rm[y * IW + x] !== o.id || !okObs(x, y, o.id)) continue;
      if (Math.hypot(x - o.cx, y - o.cy) < 4 || o.camps.some((c) => Math.hypot(c.x - x, c.y - y) < 3)) continue;
      g[y * IW + x] = riftTile(theme, vnoise(x / 6 + sx, y / 6 + sy), v);
    }
  }
  // 可達：從起點 flood fill；哪一間房有走不到的（>12% 地板），清掉那間的障礙
  const walk = (t) => t === 0 || t === 3, start = rooms[0];
  const flood = () => { const re = new Uint8Array(N), q = [start.cy * IW + start.cx]; re[q[0]] = 1; while (q.length) { const i = q.pop(); for (const n of [i - 1, i + 1, i - IW, i + IW]) if (!re[n] && walk(g[n])) { re[n] = 1; q.push(n); } } return re; };
  let re = flood();
  for (let pass = 0; pass < 2; pass++) {
    let fixed = false;
    for (const o of rooms) {
      let tot = 0, ok = 0;
      for (let y = o.y0; y < o.y0 + o.h; y++) for (let x = o.x0; x < o.x0 + o.w; x++) { const i = y * IW + x; if (rm[i] !== o.id) continue; tot++; if (re[i]) ok++; }
      const need = [{ x: o.cx, y: o.cy }].concat(o.camps || []);
      if (ok < tot * 0.88 || need.some((c) => !re[c.y * IW + c.x])) { fixed = true; for (let y = o.y0; y < o.y0 + o.h; y++) for (let x = o.x0; x < o.x0 + o.w; x++) { const i = y * IW + x; if (rm[i] === o.id && !walk(g[i])) g[i] = 0; } }
    }
    if (!fixed) break; re = flood();
  }
  for (const o of rooms) if (!re[o.cy * IW + o.cx]) return null;
  return { g, rm, hall, rooms, camps, halls, nMain, lay, flip: [flipX, flipY], start: rooms[0], boss: cellRoom.boss, side: brs.map((b) => b[0]) };
}
function adjBoss(c, b) { return (c[0] >= b.c0 && c[0] <= b.c1 && (c[1] === b.r0 - 1 || c[1] === b.r1 + 1)) || (c[1] >= b.r0 && c[1] <= b.r1 && (c[0] === b.c0 - 1 || c[0] === b.c1 + 1)); }
function hamPath(cells, start, len, endOk, r) { // 從 start 走過 len 格（相鄰、不重複），最後一格要 endOk
  const has = (c) => cells.some((d) => d[0] === c[0] && d[1] === c[1]);
  if (!has(start)) return null;
  const out = [start], used = new Set([start + ""]); let steps = 0;
  const dfs = () => {
    if (++steps > 20000) return false;
    if (out.length === len) return endOk(out[out.length - 1]);
    const c = out[out.length - 1], nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map((d) => [c[0] + d[0], c[1] + d[1]]).filter((n) => has(n) && !used.has(n + ""));
    for (let i = nb.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [nb[i], nb[j]] = [nb[j], nb[i]]; }
    for (const n of nb) { out.push(n); used.add(n + ""); if (dfs()) return true; out.pop(); used.delete(n + ""); }
    return false;
  };
  return dfs() ? out.slice() : null;
}
// ==/RGEN==
function riftBuild(R) {
  if (!RLAY[R.lay]) R.lay = "lane";
  let G = riftGen(R.seed, R.lay, R.theme);
  if (!G) { R.lay = "lane"; G = riftGen(R.seed + 1, "lane", R.theme); }
  wmap = new Uint8Array(TW * TH).fill(2);
  for (let ty = 0; ty < RIFT_IH; ty++) for (let tx = 0; tx < RIFT_IW; tx++) wmap[(RIFT_IY0 + ty) * TW + RIFT_IX0 + tx] = G.g[ty * RIFT_IW + tx];
  const T = (x, y) => riftT2W(x, y);
  R.rooms = G.rooms.map((o) => Object.assign(T(o.cx, o.cy), { id: o.id, kind: o.kind, x0: (RIFT_IX0 + o.x0) * TS, y0: (RIFT_IY0 + o.y0) * TS, x1: (RIFT_IX0 + o.x0 + o.w) * TS, y1: (RIFT_IY0 + o.y0 + o.h) * TS, camps: (o.camps || []).map((c) => T(c.x, c.y)) }));
  R.ent = T(G.start.cx, G.start.cy); R.boss = T(G.boss.cx, G.boss.cy);
  R.pts = G.camps.map((c) => T(c.x, c.y));
  R.halls = G.halls.slice(0, G.nMain).map((h) => T(h.x, h.y)); // 主線走廊中間（落單的遠程怪）
  R.branches = G.side.map((o) => Object.assign(T(o.cx, o.cy), { used: false }));
  R.chests = []; R.chestsDone = false;
  // 從入口 flood fill（R.reach 給其他檔案用）
  const reach = new Uint8Array(TW * TH), q = [Math.floor(R.ent.y / TS) * TW + Math.floor(R.ent.x / TS)]; reach[q[0]] = 1;
  while (q.length) { const i = q.pop(); for (const n of [i - 1, i + 1, i - TW, i + TW]) if (!reach[n] && (wmap[n] === 0 || wmap[n] === 3)) { reach[n] = 1; q.push(n); } }
  R.reach = reach;
  R.pts = R.pts.filter((p) => reach[Math.floor(p.y / TS) * TW + Math.floor(p.x / TS)]);
  // 小地圖快取（廣場要走過才亮：R.fogC）
  const mc = document.createElement("canvas"); mc.width = RIFT_IW; mc.height = RIFT_IH;
  const g = mc.getContext("2d"), ground = ZONES[R.theme].g[0];
  for (let ty = 0; ty < RIFT_IH; ty++) for (let tx = 0; tx < RIFT_IW; tx++) {
    const t = wmap[(RIFT_IY0 + ty) * TW + RIFT_IX0 + tx];
    g.fillStyle = t === 0 ? (R.theme === "snow" ? "#8a98ac" : ground) : t === 3 ? "#a8401a" : t === 4 ? "#2a4a7a" : t === 1 ? "#24361e" : "#141414";
    g.fillRect(tx, ty, 1, 1);
  }
  R.mini = mc;
  if (R.lay === "arena") { R.fogC = document.createElement("canvas"); R.fogC.width = RIFT_IW; R.fogC.height = RIFT_IH; const f = R.fogC.getContext("2d"); f.fillStyle = "#0a0a0a"; f.fillRect(0, 0, RIFT_IW, RIFT_IH); }
}
function riftFogTick(R) { // 廣場：走過的地方在小地圖上打開
  if (!R.fogC) return;
  const f = R.fogC.getContext("2d"), tx = W0.x / TS - RIFT_IX0, ty = W0.y / TS - RIFT_IY0;
  f.save(); f.beginPath(); f.arc(tx, ty, 16, 0, Math.PI * 2); f.clip(); f.drawImage(R.mini, 0, 0); f.restore();
}
// 事件、天命祭壇、寶箱的位置：支線盡頭（pref "branch"）或戰鬥房正中間（房間中心沒有營地）
function riftSpot(R, pref) {
  if (!R || !R.rooms) return null;
  R.spotUsed = R.spotUsed || [];
  if (pref === "branch") { const b = R.branches.find((o) => !o.used); if (b) { b.used = true; R.spotUsed.push(b); return { x: b.x, y: b.y }; } }
  const fr = R.rooms.filter((o) => o.kind === "fight" && !R.spotUsed.includes(o));
  const far = fr.filter((o) => dist(o, R.ent) > 260 && dist(o, R.boss) > 300), list = far.length ? far : fr;
  const o = list[Math.floor(Math.random() * list.length)];
  if (!o) return null;
  R.spotUsed.push(o); return { x: o.x, y: o.y };
}
// 寶箱：沒有被事件、天命祭壇用掉的支線盡頭，各放一個（進場後第一幀放，事件和祭壇已經選好位置了）
function riftChests(R) {
  R.chestsDone = true;
  for (const b of R.branches) if (!b.used) { b.used = true; R.chests.push({ x: b.x, y: b.y, open: false }); }
}
function riftChestOpen(R, c) {
  c.open = true;
  const lv = R.lv, il = Math.floor(lv / 3) + 2, Q = keyQuant(R.key), Rr = keyRar(R.key);
  const roll = () => { let it = rollItem(1, il); if (Math.random() < Rr / 100) { const b = rollItem(1, il); if (b.q > it.q) it = b; } return it; };
  const n = 1 + Math.floor(Q / 100) + (Math.random() < (Q % 100) / 100 ? 1 : 0); // 保底 1 件，物品數量加成多掉
  for (let i = 0; i < n; i++) wDropItem(roll(), c);
  if (Math.random() < 0.35) wDrop({ kind: "cur", c: randCur() }, c);
  wDrop({ kind: "stone", v: 30 + lv * 2 }, c);
  sfx("good"); burst(c.x, c.y, "#ffd84a", 30, 110, 0.6); floatText(c.x, c.y - 24, "寶箱", "#ffe066", true);
}
function riftChestDraw(c) {
  ctx.save(); ctx.translate(Math.round(c.x), Math.round(c.y));
  ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(0, 6, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#6a4020"; ctx.fillRect(-8, -4, 16, 10); ctx.fillStyle = "#3a2010"; ctx.fillRect(-8, 1, 16, 1);
  if (c.open) { ctx.fillStyle = "#4a2a14"; ctx.fillRect(-8, -9, 16, 4); }
  else { ctx.fillStyle = "#8a5428"; ctx.fillRect(-8, -8, 16, 5); ctx.fillStyle = "#ffd84a"; ctx.fillRect(-2, -4, 4, 4);
    ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.25 + 0.15 * Math.sin(time * 4); ctx.fillStyle = "#ffd84a"; ctx.fillRect(-1, -40, 2, 34); }
  ctx.restore();
}
function riftSpawn(R) {
  const mods = R.key.mods, sizeMul = (mods.includes("swarm") ? 1.4 : 1) * (R.lay === "arena" ? 1.5 : 1); // 企劃 77：廣場每營怪 +50%
  R.total = 0;
  const list = R.pts.map((p) => ({ x: p.x, y: p.y, size: Math.round((4 + Math.floor(Math.random() * 3)) * sizeMul) }));
  { const rng = ZONES[R.theme].mobs.filter((t) => WMOBS[t] && WMOBS[t].ai === "ranged"); // 走廊偶爾 2–3 隻落單的遠程怪
    if (rng.length) for (const h of R.halls || []) if (Math.random() < 0.3 && dist(h, R.ent) > 200 && dist(h, R.boss) > 250) list.push({ x: h.x, y: h.y, size: 2 + Math.floor(Math.random() * 2), only: rng }); }
  for (const p of list) {
    const camp = { x: p.x, y: p.y, z: R.theme, lv: R.lv, size: p.size, respawn: [], rift: true, only: p.only };
    W0.camps.push(camp);
    for (let i = 0; i < camp.size; i++) {
      spawnWMob(camp);
      const m = W0.mobs[W0.mobs.length - 1];
      m.noRespawn = true; m.rift = true;
      if (!R.reach[Math.floor(m.y / TS) * TW + Math.floor(m.x / TS)]) { m.x = camp.x; m.y = camp.y; m.wx = m.x; m.wy = m.y; } // 生在走不到的角落就拉回營地中心
      if (!m.elite && mods.includes("elites") && Math.random() < 0.16) { m.elite = true; m.hp *= 4; m.max *= 4; m.mod = ELITE_MODS[Math.floor(Math.random() * ELITE_MODS.length)]; }
      if (!m.elite && Math.random() < 0.04) { m.elite = true; m.hp *= 4; m.max *= 4; m.mod = ELITE_MODS[Math.floor(Math.random() * ELITE_MODS.length)]; } // 企劃 52：精英 ×1.5（8% → 約 12%）
      if (m.elite && R.tier >= 8 && !m.mod2 && typeof ELITE_NEW !== "undefined") { const q = ELITE_NEW.filter((x) => x !== m.mod); m.mod2 = q[Math.floor(Math.random() * q.length)]; } // 第 8 層以上精英必帶 2 個詞綴
      if (m.elite && R.tier >= 16 && m.mod2 && !m.mod3 && Math.random() < 0.2) { const q = ELITE_NEW.filter((x) => x !== m.mod && x !== m.mod2); m.mod3 = q[Math.floor(Math.random() * q.length)]; } // 企劃 65：16 層以上 20% 精英帶 3 個詞綴
      { const k = riftHpK(R.tier) * riftTierK(R.tier).hp; m.hp *= k; m.max *= k; } // 企劃 65：層數難度
      if (mods.includes("hp")) { m.hp *= 1.4; m.max *= 1.4; }
      if (mods.includes("fast")) m.spdMul = 1.25;
      if (mods.includes("dmg")) m.dmgMul = 1.3;
      R.total += m.elite ? 3 : 1;
    }
  }
}
// 在營地打開秘境門：原地站 3 秒
function riftOpen(k) {
  if (RIFT || RIFT_PEND) return "已經在開了";
  if (!atCamp()) return "要在安全營地才能開秘境門";
  RIFT_PEND = { id: k.id, t: 3, x: W0.x, y: W0.y };
  floatText(W0.x, W0.y - 30, "秘境門開啟中：原地不動 3 秒", "#c8a0ff", true);
  return "";
}
function riftEnter(id) {
  if (RIFT) { if (typeof errCatch === "function") errCatch(new Error("riftEnter 重複呼叫（RIFT 還在）"), "rift"); return; } // 企劃 48：再進一次會把秘境圖存成「原本的地圖」，回不去
  const key = save.keys.find((k) => k.id === id);
  if (!key) return;
  save.keys = save.keys.filter((k) => k !== key); // 鑰匙進門就用掉
  if (!RLAY[key.lay]) key.lay = typeof keyLayRoll === "function" ? keyLayRoll() : RLAY_KEYS[Math.floor(Math.random() * RLAY_KEYS.length)]; // 企劃 77：舊鑰匙沒有地形，進場時隨機一種
  const R = RIFT = { key, lay: key.lay, tier: key.tier, lv: riftMobLv(key.tier), theme: riftTheme(key.tier), lives: riftLives(key.tier), pow: 0, t: 0, seed: (Math.random() * 1e9) | 0,
    ret: { x: W0.x, y: W0.y }, armed: false, bossOn: false, bossDown: false, saveT: 10,
    saved: { wmap, mobs: W0.mobs, camps: W0.camps, drops: W0.drops, pools: W0.pools || [], grave: W0.grave } };
  W0.mobs = []; W0.camps = []; W0.drops = []; W0.pools = []; W0.grave = null; riftClearFx();
  riftBuild(R); riftSpawn(R);
  W0.healMul = key.mods.includes("noregen") ? 0.4 : 1;
  B = worldStats(); W0.maxHp = B.maxHp; W0.hp = Math.min(W0.hp, B.maxHp);
  W0.x = R.ent.x; W0.y = R.ent.y; cam.x = W0.x; cam.y = W0.y; W0.shield = 3; W0.zone = R.theme; W0.bannerT = 0;
  writeSave(); sfx("arrive"); shake = 6; flashT = 0.2; flashColor = "170,120,255";
  burst(W0.x, W0.y, "#c8a0ff", 40, 120, 0.7);
  floatText(W0.x, W0.y - 46, `第 ${R.tier} 層秘境・Lv.${R.lv}`, "#e0c8ff", true);
  notice("清怪讓秘境之力到 100%，王門就會打開", "#cfc4dc");
  if (typeof seenHint === "function") seenHint("rift", "秘境：3 條命，死掉從入口重來。走回入口的門可以撤退（撿到的都帶回）");
}
function riftClearFx() { for (const k of ["eshots", "pshots", "fires", "walls", "rings", "tornados", "voids"]) if (W0[k]) W0[k] = []; if (typeof wbZones !== "undefined") wbZones = []; }
function riftLeave(ok) {
  if (!RIFT) return;
  const R = RIFT, S = R.saved;
  wmap = S.wmap; W0.mobs = S.mobs; W0.camps = S.camps; W0.drops = S.drops; W0.pools = S.pools; W0.grave = S.grave; riftClearFx();
  W0.healMul = 1; W0.saveT = 5; RIFT = null; riftAskClose();
  W0.x = R.ret.x; W0.y = R.ret.y; cam.x = W0.x; cam.y = W0.y; W0.shield = 3;
  save.w.x = Math.round(W0.x); save.w.y = Math.round(W0.y);
  B = worldStats(); W0.maxHp = B.maxHp; W0.hp = Math.min(W0.hp, B.maxHp);
  if (ok) bankLoot("秘境");
  writeSave(); sfx("arrive");
  floatText(W0.x, W0.y - 34, ok ? (R.bossDown ? `第 ${R.tier} 層秘境完成！` : "撤離秘境：撿到的都帶回了") : "秘境崩塌了⋯⋯", ok ? "#ffe066" : "#ff8a7a", true);
}
// 秘境之主：從區域王裡抽一隻，血量縮小、等級＝鑰匙等級
function riftSpawnBoss() {
  const R = RIFT, k = RB_KEYS[Math.floor(Math.random() * RB_KEYS.length)], base = RBOSS[k], lv = R.lv, mods = R.key.mods;
  const hp = Math.round(122000 * Math.pow(lv / 50, 1.65) * 0.9 * riftTierK(R.tier).hp * (mods.includes("lordhp") ? 1.6 : 1)); // 企劃 65：層數難度 // 企劃 52：×0.5 → ×0.9 // 企劃 41：照區域王新血量內插（12.2 萬@Lv.50、23 萬@Lv.75、42 萬@Lv.110）×0.5
  const BR = Object.assign({}, base, { x: R.boss.x, y: R.boss.y, lv, hp, cool: 0, n: `秘境之主・${base.n}`, dmgMul: (base.dmgMul || 1) * riftTierK(R.tier).dmg * (mods.includes("dmg") ? 1.3 : 1),
    wake: `${base.n}從裂隙中現身！`, sleep: `${base.n}退回裂隙深處（走進王門可以再挑戰）` });
  W0.mobs.push({ type: base.type, rb: k, R: BR, rift: true, boss: true, lv, elite: false, camp: { x: BR.x, y: BR.y, z: R.theme, lv, respawn: [] }, x: BR.x, y: BR.y - 6, hp, max: hp,
    st: "chase", wt: 0, wx: 0, wy: 0, atkT: 2, flash: 0, kb: 0, ka: 0, fuse: 0, phase: 1, act: null, actT: 0, adds: 0, dash: null, seq: [] });
  wbZones = []; R.bossOn = true;
  shake = 10; flashT = 0.15; flashColor = base.col; sfx("crit");
  burst(BR.x, BR.y, `rgb(${base.col})`, 50, 160, 0.8);
  floatText(BR.x, BR.y - 40, BR.wake, `rgb(${base.col})`, true);
}
function riftBossKilled(m) {
  const R = RIFT; if (!R) return;
  R.bossDown = true; R.bossOn = false; R.pow = 100; R.armed = false; // 要先走開再走回來才問要不要離開（不然站在王的位置會馬上跳出來）
  shake = 12; flashT = 0.2; flashColor = "255,220,150"; sfx("win");
  floatText(m.x, m.y - 40, `擊敗${m.R.n}！`, "#ffe066", true);
  const lv = R.lv, il = Math.floor(lv / 3) + 2, Q = keyQuant(R.key), Rr = keyRar(R.key), mods = R.key.mods;
  const roll = (boost) => { let it = rollItem(boost, il); if (Math.random() < Rr / 100) { const b = rollItem(boost, il); if (b.q > it.q) it = b; } return it; };
  let best = null; for (let i = 0; i < 30 && !(best && best.q >= 2); i++) best = roll(1); // 保底 1 件玄品以上
  wDropItem(best, m);
  const n = 2 + Math.floor(Q / 50) + (Math.random() < (Q % 50) / 50 ? 1 : 0);
  for (let i = 0; i < n; i++) wDropItem(roll(1), m);
  if (Math.random() < 0.7) wDrop({ kind: "key", k: makeKey(R.tier) }, m); // 企劃 52：同層 70%（原本必掉）
  if (R.tier < riftCap() && Math.random() < (R.tier >= 11 ? 0.12 : 0.2) + (mods.includes("keyf") ? 0.3 : 0)) wDrop({ kind: "key", k: makeKey(R.tier + 1) }, m); // 高一層 20%（第 11 層以上 12%）
  for (let i = 0; i < (R.tier >= 6 ? 2 : 1); i++) wDrop({ kind: "gem", g: randGem(Math.random() < 0.25 ? 2 : 1) }, m);
  for (let i = 0; i < 2; i++) wDrop({ kind: "ess", k: randEss() }, m);
  if (Math.random() < 0.08 && typeof CARDS !== "undefined" && CARDS[m.type]) wDrop({ kind: "card", c: m.type }, m);
  wDrop({ kind: "stone", v: 60 + lv * 3 }, m);
  save.w.riftMax = Math.max(save.w.riftMax || 0, R.tier);
  writeSave();
  notice("王門變成出口：撿完東西走進去就回營地", "#ffe9a0");
}
// 死掉：扣一條命，未帶回的裝備照仙界規則掉一半在屍體旁
function riftDead() {
  const R = RIFT, w = save.w;
  R.lives--; R.bossOn = false; riftAskClose();
  const risky = riskyItems().sort(() => Math.random() - 0.5), lost = risky.slice(0, Math.ceil(risky.length / 2));
  lost.forEach(ungem);
  save.bag = save.bag.filter((b) => !lost.includes(b));
  for (const k of SLOT_KEYS) if (lost.includes(save.eq[k])) delete save.eq[k];
  if (w.ws) w.ws = w.ws.map((b) => (lost.includes(b) ? null : b));
  for (const it of lost) wDrop({ kind: "item", it, corpse: true }, W0);
  if (lost.length) W0.grave = { x: W0.x, y: W0.y, t: 600 };
  writeSave();
  pad.classList.add("hidden");
  const lostTxt = lost.length ? `未帶回的裝備掉了 ${lost.length} 件在倒下的地方：${lost.map((it) => `<b style="color:${RARITY[it.q].c}">${it.name}</b>`).join("、")}` : "沒有掉裝備";
  if (R.lives > 0) {
    screenEl.innerHTML = `<div class="panel"><h1>你倒下了…</h1><div class="result">秘境還剩 <b style="color:#ff8a8a">${"❤".repeat(R.lives)}</b> ${R.lives} 條命<br>${lostTxt}${lost.length ? "<br><small>跑回去撿得回來</small>" : ""}</div>
      <div class="btns"><button id="revive" class="big">從秘境入口重來</button></div></div>`;
    screenEl.classList.remove("hidden");
    document.getElementById("revive").onclick = () => { w.x = R.ent.x; w.y = R.ent.y; enterWorld(); R.armed = false; w.x = R.ret.x; w.y = R.ret.y; };
  } else {
    screenEl.innerHTML = `<div class="panel"><h1>秘境崩塌了</h1><div class="result">3 條命用完了。鑰匙沒了，留在秘境裡的東西也沒了。<br>${lostTxt}<br><small>身上剩下的裝備回到營地就算帶回</small></div>
      <div class="btns"><button id="revive" class="big">回到營地</button></div></div>`;
    screenEl.classList.remove("hidden");
    document.getElementById("revive").onclick = () => { const ret = R.ret; riftLeave(false); w.x = Math.round(ret.x); w.y = Math.round(ret.y); enterWorld(); };
  }
}
const _showWorldDeadR = showWorldDead;
showWorldDead = function () { if (!RIFT) return _showWorldDeadR.apply(this, arguments); if (state === "worldDead") riftDead(); };

// 撤退／完成的確認框（遊戲不暫停）
function riftAsk(done) {
  if (riftAskEl) return;
  riftAskEl = document.createElement("div"); riftAskEl.id = "riftAsk";
  riftAskEl.innerHTML = `<div class="exbox"><h3>${done ? "離開秘境？" : "撤離秘境？"}</h3><p>${done ? "地上還沒撿的東西會留在秘境裡。" : "撿到的東西全部帶回，但鑰匙算用掉。"}</p><div class="acts row"><button id="raStay" class="gold">留下</button><button id="raGo" class="red">${done ? "回營地" : "撤離"}</button></div></div>`;
  document.body.appendChild(riftAskEl);
  riftAskEl.querySelector("#raStay").onclick = () => { sfx("click"); riftAskClose(); if (RIFT) RIFT.armed = false; };
  riftAskEl.querySelector("#raGo").onclick = () => { sfx("click"); riftLeave(true); };
}
function riftAskClose() { if (riftAskEl) { riftAskEl.remove(); riftAskEl = null; } }

// 每幀
const _updateWorldR = updateWorld;
updateWorld = function (dt) {
  if (RIFT_PEND) { // 開門：原地 3 秒
    const P = RIFT_PEND;
    if (state !== "world" || Math.hypot(W0.x - P.x, W0.y - P.y) > 3 || W0.hurt > 0) { RIFT_PEND = null; if (W0) floatText(W0.x, W0.y - 26, "開門被打斷", "#ff8a7a"); }
    else { P.t -= dt; if (Math.random() < 0.6) particles.push({ x: W0.x + rand(-12, 12), y: W0.y + 6, vx: 0, vy: -50, life: 0.5, max: 0.5, color: "#c8a0ff", size: 2 }); if (P.t <= 0) { RIFT_PEND = null; riftEnter(P.id); } }
  }
  if (!RIFT) return _updateWorldR.apply(this, arguments);
  const R = RIFT, p = W0;
  if (p.recall > 0) { p.recall = 0; p.recallTo = null; floatText(p.x, p.y - 26, "秘境裡不能傳送：走回入口的門撤離", "#ff8a7a", true); }
  if (typeof bigMap !== "undefined") bigMap = false;
  p.saveT = 99; // 秘境裡不存位置（存檔一直是回去的營地）
  _updateWorldR.apply(this, arguments);
  if (!RIFT || state !== "world") return;
  R.t += dt;
  if (!R.chestsDone) riftChests(R);
  if ((R.fogT = (R.fogT || 0) - dt) <= 0) { R.fogT = 0.25; riftFogTick(R); }
  for (const c of R.chests) if (!c.open && dist(p, c) < 18) riftChestOpen(R, c);
  if ((R.saveT -= dt) <= 0) { R.saveT = 10; save.w.x = Math.round(R.ret.x); save.w.y = Math.round(R.ret.y); writeSave(); }
  // 王門
  if (R.pow >= 100 && !R.bossOn && !R.bossDown && dist(p, R.boss) < 22) riftSpawnBoss();
  if (R.bossOn && !W0.mobs.some((m) => m.R && !m.dead)) R.bossOn = false; // 王回去睡了（跑出場地）→ 王門再打開
  // 入口的門（撤離）、打完王的出口
  const atEnt = dist(p, R.ent) < 16, atExit = R.bossDown && dist(p, R.boss) < 18;
  if (!atEnt && !atExit && (dist(p, R.ent) > 60 && (!R.bossDown || dist(p, R.boss) > 60))) R.armed = true;
  if ((atEnt || atExit) && R.armed && !riftAskEl) { R.armed = false; riftAsk(R.bossDown); }
};
// 殺怪：秘境之力、物品數量加成
const _killMobR = killMob;
killMob = function (m) {
  const was = m.dead;
  _killMobR.apply(this, arguments);
  if (!RIFT || was || !m.dead || m.boss || WMOBS[m.type].ai === "pillar") return;
  const R = RIFT, before = R.pow;
  R.pow = Math.min(100, R.pow + (m.elite ? 3 : 1) / Math.max(1, R.total * 0.8) * 100);
  if (before < 100 && R.pow >= 100) { floatText(W0.x, W0.y - 40, "秘境之力 100%：王門打開了！", "#e0a0ff", true); sfx("arrive"); }
  const Q = keyQuant(R.key), zl = ZONE_LOOT[R.theme] || 1, il = Math.max(0, Math.floor(m.lv / 3) + Math.floor(Math.random() * 2) - 1);
  if (Math.random() < (m.elite ? 0.4 : 0.028) * zl * Q / 100) wDropItem(rollItem(m.elite ? 1 : 0, il), m);
};
// 詞綴：物理／法術護體、反震
const _hitMobR = hitMob;
hitMob = function (m, dmg, kb, from, quiet) {
  if (!RIFT || !m || !(m.rift)) return _hitMobR.apply(this, arguments);
  const ks = RIFT.key.mods, sp = !!SPELL_WT[curWeapon()];
  if ((ks.includes("physw") && !sp) || (ks.includes("spellw") && sp)) dmg *= 0.6;
  const h0 = m.hp;
  _hitMobR.call(this, m, dmg, kb, from, quiet);
  if (ks.includes("reflect") && h0 > m.hp && W0.hp > 1 && !(W0.shield > 0)) {
    const r = Math.min((h0 - Math.max(0, m.hp)) * 0.05, W0.maxHp * 0.015);
    W0.hp = Math.max(1, W0.hp - r);
    if (r >= 1 && (!RIFT.reflT || time - RIFT.reflT > 0.8)) { RIFT.reflT = time; floatText(W0.x, W0.y - 14, `反震 -${Math.round(r)}`, "#ff9a7a"); }
  }
};
const _worldStatsR = worldStats;
worldStats = function () {
  const b = _worldStatsR.apply(this, arguments);
  if (RIFT) { const ks = RIFT.key.mods; if (ks.includes("nomp")) b.mpRegen *= 0.6; if (ks.includes("lowres")) for (const e of ELES) b["res" + e] -= 0.2; }
  return b;
};
// 秘境裡：不更新戰爭迷霧、不送位置、不畫別人、不能御劍傳送
const _fogTickR = fogTick; fogTick = function () { if (!RIFT) return _fogTickR.apply(this, arguments); };
const _netSendR = netSend; netSend = function () { if (!RIFT) return _netSendR.apply(this, arguments); };
const _drawOtherR = drawOther; drawOther = function () { if (!RIFT) return _drawOtherR.apply(this, arguments); };
const _flyToR = flyTo; flyTo = function () { if (RIFT) { ovClose(); floatText(W0.x, W0.y - 26, "秘境裡不能傳送：走回入口的門撤離", "#ff8a7a", true); return; } return _flyToR.apply(this, arguments); };
const _spawnHunterR = spawnHunter; spawnHunter = function () { if (!RIFT) return _spawnHunterR.apply(this, arguments); };

// 畫門（世界座標，drawCamps 在地形之後呼叫）
function riftPortal(x, y, c, label) {
  ctx.save();
  ctx.fillStyle = `rgba(${c},0.16)`; ctx.beginPath(); ctx.ellipse(x, y, 18, 9, 0, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 3; i++) { ctx.strokeStyle = `rgba(${c},${0.45 + 0.35 * Math.sin(time * 4 + i * 2)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y, 17 - i * 5 + Math.sin(time * 3 + i) * 1.2, 8.5 - i * 2.5, time * (i % 2 ? 1 : -1) * 0.5, 0, Math.PI * 2); ctx.stroke(); }
  for (let i = 0; i < 2; i++) { const a = time * 2 + i * Math.PI; ctx.fillStyle = `rgba(${c},0.9)`; ctx.fillRect(x + Math.cos(a) * 14 - 1, y + Math.sin(a) * 7 - 12 - ((time * 20 + i * 9) % 18), 2, 2); }
  ctx.font = "bold 8px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(0,0,0,0.8)"; ctx.strokeText(label, x, y - 16); ctx.fillStyle = `rgb(${c})`; ctx.fillText(label, x, y - 16);
  ctx.restore();
}
const _drawCampsR = drawCamps;
drawCamps = function () {
  _drawCampsR.apply(this, arguments);
  if (!RIFT) return;
  const R = RIFT;
  riftPortal(R.ent.x, R.ent.y, "140,220,255", "入口（撤離）");
  for (const c of R.chests || []) if (Math.abs(c.x - cam.x) < W && Math.abs(c.y - cam.y) < H) riftChestDraw(c);
  if (R.bossDown) riftPortal(R.boss.x, R.boss.y, "255,220,120", "出口（回營地）");
  else if (R.pow >= 100 && !R.bossOn) riftPortal(R.boss.x, R.boss.y, "220,120,255", "王門");
};
// HUD：上方秘境資訊＋小地圖換成秘境地圖
const _drawWorldHudR = drawWorldHud;
drawWorldHud = function () {
  _drawWorldHudR.apply(this, arguments);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (RIFT_PEND) {
    const rw = 140, rx = W / 2 - rw / 2, ry = H * 0.62;
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(rx - 2, ry - 2, rw + 4, 12);
    ctx.fillStyle = "#c8a0ff"; ctx.fillRect(rx, ry, rw * (1 - RIFT_PEND.t / 3), 8);
    ctx.textAlign = "center"; ctx.font = "bold 11px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#fff"; ctx.fillText("秘境門開啟中…", W / 2, ry - 6);
  }
  if (!RIFT) return;
  const R = RIFT;
  // 上方資訊
  const bw = Math.min(200, W * 0.46), bx = 10 + SAFE.l, by = 10 + SAFE.t + (curQuest() ? 94 : 50) + (riskyItems().length ? 22 : 0); // 左上任務欄下面（上方中間是王血條、右上是快捷列）
  ctx.fillStyle = "rgba(14,8,24,0.78)"; ctx.fillRect(bx, by, bw, 40);
  ctx.strokeStyle = "rgba(200,160,255,0.45)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 39);
  ctx.textAlign = "left"; ctx.font = "bold 10px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#e8d8ff";
  ctx.fillText(`秘境 ${R.tier} 層・Lv.${R.lv}・${"★".repeat(keyStars(R.key))}・數量+${keyQuant(R.key)}%`, bx + 7, by + 14);
  ctx.textAlign = "left"; ctx.font = "bold 11px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#ff7a8a";
  ctx.fillText("❤".repeat(R.lives) + "♡".repeat(Math.max(0, riftLives(R.tier) - R.lives)), bx + 8, by + 32);
  const px = bx + 56, pw = bw - 64;
  ctx.fillStyle = "#2a1e3a"; ctx.fillRect(px, by + 24, pw, 9);
  ctx.fillStyle = R.pow >= 100 ? "#ffd84a" : "#b07dff"; ctx.fillRect(px, by + 24, pw * R.pow / 100, 9);
  ctx.font = "bold 8px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#fff"; ctx.textAlign = "center";
  ctx.fillText(R.bossDown ? "完成！走進出口" : R.bossOn ? "秘境之主" : R.pow >= 100 ? "王門已開（地圖紫點）" : `秘境之力 ${Math.floor(R.pow)}%`, px + pw / 2, by + 31.5);
  // 小地圖
  const mw = Math.min(104, W * 0.26), mh = mw * RIFT_IH / RIFT_IW, mx0 = W - mw - 12 - SAFE.r, my0 = 58 + SAFE.t;
  ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(mx0 - 2, my0 - 2, mw + 4, Math.max(mh, mw * TH / TW) + 20);
  ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 0.9; ctx.drawImage(R.fogC || R.mini, mx0, my0, mw, mh); ctx.globalAlpha = 1;
  const sc = mw / (RIFT_IW * TS), mp = (o) => [mx0 + (o.x - RIFT_IX0 * TS) * sc, my0 + (o.y - RIFT_IY0 * TS) * sc];
  let [a, b] = mp(R.ent); ctx.fillStyle = "#8cdcff"; ctx.fillRect(a - 2, b - 2, 4, 4);
  [a, b] = mp(R.boss); if (R.bossDown) { ctx.fillStyle = "#ffdc78"; ctx.fillRect(a - 2.5, b - 2.5, 5, 5); } else if (R.pow >= 100) { ctx.fillStyle = `rgba(220,120,255,${0.6 + 0.4 * Math.sin(time * 6)})`; ctx.fillRect(a - 3, b - 3, 6, 6); }
  for (const m of W0.mobs) if (!m.dead && (m.elite || m.boss)) { [a, b] = mp(m); ctx.fillStyle = m.boss ? "#ff2a2a" : "#ff6b4a"; ctx.fillRect(a - 1.2, b - 1.2, 2.5, 2.5); }
  for (const c of R.chests || []) if (!c.open) { [a, b] = mp(c); ctx.fillStyle = "#3a2010"; ctx.fillRect(a - 2.5, b - 2, 5, 4); ctx.fillStyle = "#ffd84a"; ctx.fillRect(a - 2, b - 1.5, 4, 1.5); } // 支線寶箱一開始就標出來
  if (W0.grave) { [a, b] = mp(W0.grave); ctx.fillStyle = "#9fe8ff"; ctx.fillRect(a - 1.5, b - 1.5, 3, 3); }
  [a, b] = mp(W0); ctx.fillStyle = "#fff"; ctx.fillRect(a - 1.5, b - 1.5, 3, 3);
  miniRect = null; // 秘境裡點小地圖不開星盤
  ctx.font = "bold 10px 'Noto Sans TC', sans-serif"; ctx.textAlign = "right"; ctx.fillStyle = "#d8c0ff";
  ctx.fillText(`秘境・${ZONES[R.theme].n}`, mx0 + mw, my0 + mh + 13);
};
const _openStarMapR = openStarMap;
openStarMap = function () { if (RIFT) { if (ovKind) ovClose(); floatText(W0.x, W0.y - 26, "秘境裡看不到星盤（右上小地圖是秘境地圖）", "#cfc4dc", true); return; } return _openStarMapR.apply(this, arguments); };

// ───────── 秘境畫面（覆蓋層 k-rift）─────────
let riftSel = null;
function riftModRow(m, k) {
  const M = MAP_MODS[m], bad = M.bad && M.bad(curWeapon()), mv = k ? keyMv(k, m) : 1;
  const val = mv !== 1 && (M.q || M.r) ? ` <small class="rmv">（掉寶加成 ×${mv.toFixed(2)}）</small>` : "";
  return `<div class="rmod ${M.t}">${M.t === "p" ? "✦" : "☠"} ${M.n}${val}${bad ? ` <b class="rbad">⚠ 不適合你的流派</b>` : ""}</div>`;
}
// 企劃 50 A：通貨用在鑰匙上（靈石版不動）
function keyCurBtns(k, camp) {
  if (k.cor) return "";
  const b = (id, c, label, ok, sub) => `<button id="${id}" class="curb" style="--cc:${CUR[c].c}" ${camp && ok && curN(c) > 0 ? "" : "disabled"}>${label}<small>${CUR[c].n} ${curN(c)}${sub ? "・" + sub : ""}</small></button>`;
  const max = KEY_MODS_MAX;
  return (k.q < 2 ? b("kcGold", "gold", "點金", true, "新詞綴一定是前綴") : "")
    + (k.q > 0 ? b("kcChaos", "chaos", "混元重骰", true, "保證有物品數量") : "")
    + (k.q === 2 ? b("kcExalt", "exalt", "淬靈加詞綴", keyModN(k) < max, keyModN(k) < max ? `詞綴 ${keyModN(k)}／${max}` : "滿 8 條了") : "")
    + (k.mods.some((m) => MAP_MODS[m].q || MAP_MODS[m].r) ? b("kcDivine", "divine", "造化重骰數值", true, "掉寶加成 ×0.7–1.3") : "");
}
function keyCurBind(k, again) {
  const on = (id, f) => { const e = document.getElementById(id); if (e) e.onclick = () => { if (!atCamp()) { again("回營地才能用通貨"); return; } f(); writeSave(); }; };
  on("kcGold", () => { if (!useCur("gold")) return; k.q++; const [a, b2] = KEY_RARITY[k.q].mods; rollKeyMods(k, a + Math.floor(Math.random() * (b2 - a + 1)), { keep: true, pre: true }); sfx("good"); again(`點金符：${KEY_RARITY[k.q].n}品鑰匙（新詞綴都是前綴）`); });
  on("kcChaos", () => { if (!useCur("chaos")) return; const [a, b2] = KEY_RARITY[k.q].mods; rollKeyMods(k, a + Math.floor(Math.random() * (b2 - a + 1)), { qty: true }); delete k.ex; sfx("good"); again("混元石：詞綴全部重骰（有物品數量）"); });
  on("kcExalt", () => { if (keyModN(k) >= KEY_MODS_MAX || !useCur("exalt")) return; const n = k.mods.length; rollKeyMods(k, n + 1, { keep: true }); sfx("arrive"); again(k.mods.length > n ? `淬靈石：多了「${MAP_MODS[k.mods[n]].n}」` : "沒有能加的詞綴了"); });
  on("kcDivine", () => { if (!useCur("divine")) return; k.mv = {}; for (const m of k.mods) if (MAP_MODS[m].q || MAP_MODS[m].r) k.mv[m] = Math.round((0.7 + Math.random() * 0.6) * 100) / 100; sfx("good"); again(`造化玉：物品數量 +${keyQuant(k)}%、品質 +${keyRar(k)}%`); });
}
const keyIlTxt = (k) => { const lv = riftMobLv(k.tier), t = tierTop(lv); return `這層掉的裝備物品等級約 ${lv}（詞綴最高 ${tierName(t)}${t < 4 ? `，物品等級 ${TIER_LV[t + 1]} 開 ${tierName(t + 1)}` : ""}）`; };
function renderRift(msg = "") {
  if (!save.w) return;
  migKeys();
  if (ovKind !== "rift" && !ovOpen("rift")) return;
  if (msg) ovMsg = msg;
  const w = save.w, keys = save.keys.slice().sort((a, b) => b.tier - a.tier || b.q - a.q), sel = save.keys.find((k) => k.id === riftSel) || keys[0] || null;
  if (sel) riftSel = sel.id;
  const open = riftUnlocked(), camp = atCamp();
  const list = keys.map((k) => `<button class="rkey${sel === k ? " sel" : ""}${keyGod(k) ? " god" : ""}" data-rk="${k.id}" style="--c:${keyGod(k) ? "#ffd84a" : KEY_RARITY[k.q].c}"><b>第 ${k.tier} 層${keyGod(k) ? "・極" : ""}</b><span>Lv.${riftMobLv(k.tier)}</span><small>${KEY_RARITY[k.q].n}・<i>${"★".repeat(keyStars(k))}</i>${keyWarn(k).length ? " ⚠" : ""}</small></button>`).join("");
  let center;
  if (RIFT) center = `<h2>秘境中</h2><p>第 ${RIFT.tier} 層・Lv.${RIFT.lv}・剩 ${RIFT.lives} 條命・秘境之力 ${Math.floor(RIFT.pow)}%</p><p class="dim">走回入口的門撤離（撿到的都帶回、鑰匙算用掉）；打倒秘境之主後王門變成出口。</p>`;
  else if (!open) center = `<h2>秘境試煉</h2><p>到<b>幽冥沼澤</b>（Lv.30）就能開秘境。</p><p class="dim">秘境是用你自己的角色進去的獨立小地圖：清怪 → 秘境之主 → 噴寶＋掉鑰匙，一路往上爬層數。</p>`;
  else if (!sel) center = `<h2>秘境試煉</h2><p>還沒有秘境鑰。</p><p class="dim">Lv.30 以上的精英怪有機會掉鑰匙；也可以先領一把免費的第 1 層。</p>`;
  else {
    const pre = sel.mods.filter((m) => MAP_MODS[m].t === "p"), suf = sel.mods.filter((m) => MAP_MODS[m].t === "s"), warn = keyWarn(sel);
    center = `<h3 style="color:${KEY_RARITY[sel.q].c}">【${KEY_RARITY[sel.q].n}】${keyName(sel)}</h3>
      <div class="dim">怪物 Lv.${riftMobLv(sel.tier)}・${ZONES[riftTheme(sel.tier)].n}・危險 <span class="rstar">${"★".repeat(keyStars(sel))}${"☆".repeat(5 - keyStars(sel))}</span></div>
      <div class="rmods">${pre.map((m) => riftModRow(m, sel)).join("")}${suf.map((m) => riftModRow(m, sel)).join("")}${!sel.mods.length ? `<div class="dim">（凡品鑰匙沒有詞綴：點金可以加詞綴）</div>` : ""}</div>
      <div class="rsum"><span>詞綴 <b>${keyModN(sel)}／${KEY_MODS_MAX}</b></span><span>物品數量 <b>+${keyQuant(sel)}%</b></span><span>物品品質 <b>+${keyRar(sel)}%</b></span></div>
      ${sel.tier > 10 ? `<div class="dim rilv">層數難度：怪血 ×${riftTierK(sel.tier).hp.toFixed(1)}・傷害 ×${riftTierK(sel.tier).dmg.toFixed(1)}（第 11 層起每層變硬，物品數量也每層 +3%）</div>` : ""}
      <div class="dim rilv">${keyIlTxt(sel)}</div>
      ${warn.length ? `<p class="warn">⚠ 這把鑰匙有對你現在的武器（${WEAPONS[curWeapon()].n}）不利的詞綴：換一組武器再進，或先打別把</p>` : ""}
      <div class="acts">
        <button id="rgo" class="gold" ${camp ? "" : "disabled"}>開啟秘境<small>${camp ? "在營地原地站 3 秒" : "要在安全營地才能開"}</small></button>
        ${sel.q < 2 ? `<button id="rup" ${save.stone >= keyCost(sel, true) ? "" : "disabled"}>點金<small>多詞綴・${keyCost(sel, true)} 靈石</small></button>` : ""}
        ${sel.q > 0 ? `<button id="rroll" ${save.stone >= keyCost(sel, false) ? "" : "disabled"}>洗練<small>重骰詞綴・${keyCost(sel, false)} 靈石</small></button>` : ""}
        <button id="rdel" class="red">丟掉</button>
      </div>
      ${sel.cor ? "" : `<div class="acts kcur">${keyCurBtns(sel, camp)}</div><p class="dim">通貨版比靈石版好：點金符加的一定是好處、混元保證有物品數量、淬靈能超過上限、造化追高數值（要在營地）</p>`}`;
  }
  const right = `<div class="winhead">規則</div>
    <p>・<b>3 條命</b>：死掉從入口重來，未帶回的裝備掉一半在屍體旁（跑回去撿得回來）。</p>
    <p>・3 條命用完：秘境崩塌，鑰匙和留在裡面的東西都沒了。</p>
    <p>・隨時可以走回<b>入口的門</b>撤離：撿到的全部帶回，鑰匙算用掉。</p>
    <p>・不用全殺：殺掉約八成，<b>秘境之力 100%</b> 王門就開。秘境之主必掉同層鑰匙，30% 掉高一層。</p>
    <p>・<span class="rp">金字前綴＝好處</span>、<span class="rs">紅字後綴＝危險</span>；危險越多掉越多。</p>
    <div class="rbest">最高通過：第 <b>${w.riftMax || 0}</b> 層　鑰匙 ${save.keys.length} / ${KEY_MAX}</div>
    ${open && !RIFT && !save.keys.some((k) => k.tier === 1) ? `<div class="acts"><button id="rfree">領取第 1 層秘境鑰（免費）</button></div>` : ""}`;
  ov.innerHTML = `<div class="col l rift"><h2>秘境鑰 <small>${save.keys.length}</small></h2><div class="rkeys">${list || `<p class="dim">（沒有鑰匙）</p>`}</div></div>
    <div class="col c rift">${center}</div><div class="col r rift">${right}</div>${ovMsg ? `<div class="toast">${ovMsg}</div>` : ""}`;
  ovMsg = "";
  const again = (m) => renderRift(m), on = (id, f) => { const e = document.getElementById(id); if (e) e.onclick = f; };
  ov.querySelectorAll("[data-rk]").forEach((b) => b.addEventListener("click", () => { sfx("click"); riftSel = b.dataset.rk; again(); }));
  on("rfree", () => { addKey(makeKey(1, 0)); sfx("good"); again("領到第 1 層秘境鑰"); });
  if (!sel || RIFT || !open) return;
  on("rgo", () => { const e = riftOpen(sel); if (e) { sfx("bad"); again(e); return; } sfx("click"); ovClose(); });
  on("rup", () => { const c = keyCost(sel, true); if (save.stone < c) return; save.stone -= c; sel.q++; const [a, b2] = KEY_RARITY[sel.q].mods; rollKeyMods(sel, a + Math.floor(Math.random() * (b2 - a + 1))); writeSave(); sfx("good"); again(`點金成功：${KEY_RARITY[sel.q].n}品鑰匙`); });
  on("rroll", () => { const c = keyCost(sel, false); if (save.stone < c) return; save.stone -= c; const [a, b2] = KEY_RARITY[sel.q].mods; rollKeyMods(sel, a + Math.floor(Math.random() * (b2 - a + 1))); writeSave(); sfx("good"); again("詞綴重骰了"); });
  keyCurBind(sel, again);
  on("rdel", () => { save.keys = save.keys.filter((k) => k !== sel); riftSel = null; writeSave(); sfx("click"); again("丟掉了"); });
}
