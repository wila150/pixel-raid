// 御劍渡劫（pixel-raid）— 仙界大世界：一張可以自由探索的地圖（城鎮、四個野外地區、傳送陣、世界王祭壇）
// 玩法：自己放技能打怪 → 升等配點 → 撿裝備變強 → 往北走打更強的怪 → 火山祭壇挑戰焚天石魔
"use strict";

const TS = 16, TW = 150, TH = 112; // 一格 16 單位，地圖 2400×1792
const TOWN = { x: 1200, y: 1520, r: 120 };
const ZONES = {
  town: { n: "青雲城", lv: [0, 0], g: ["#4a4458", "#433e52"] },
  grass: { n: "靈草原", lv: [1, 6], g: ["#2f4a2c", "#2b4429"], mobs: ["imp", "imp", "wolf"] },
  forest: { n: "幽暗森林", lv: [6, 12], g: ["#1d3326", "#1a2e22"], mobs: ["wolf", "treant", "treant", "imp"] },
  waste: { n: "亂石荒原", lv: [11, 17], g: ["#4a4034", "#443a2f"], mobs: ["golem", "bomber", "wolf"] },
  volcano: { n: "焚天火山", lv: [16, 24], g: ["#3a2424", "#342020"], mobs: ["crow", "lava", "bomber"] },
};
function zoneAt(x, y) {
  if (Math.hypot(x - TOWN.x, y - TOWN.y) < TOWN.r + 10) return "town";
  if (y < 480) return "volcano";
  if (y > 1120) return "grass";
  return x < 1150 ? "forest" : "waste";
}
const WAYPOINTS = [
  { id: "town", n: "青雲城", x: 1200, y: 1500 },
  { id: "grass", n: "靈草原", x: 620, y: 1420 },
  { id: "forest", n: "幽暗森林", x: 520, y: 800 },
  { id: "waste", n: "亂石荒原", x: 1820, y: 820 },
  { id: "volcano", n: "焚天火山", x: 1200, y: 380 },
];
const ALTAR = { x: 1200, y: 150 };

// ───────── 怪物 ─────────
const TREANT = sprite([
  "...gggg...",
  "..gGGGGg..",
  ".gGGgGGGg.",
  ".gGEGGEGg.",
  "..gGGGGg..",
  "...kBBk...",
  "..kBkkBk..",
  ".kB.kk.Bk.",
], { k: "#1b1424", G: "#3f8a4a", g: "#2c6236", E: "#ffe066", B: "#6a4a2a" });
const BOMBER = sprite([
  "..kkkk..",
  ".kSSSSk.",
  "kSOSSOSk",
  "kSSOOSSk",
  "kSOOOOSk",
  ".kSSSSk.",
  "..k..k..",
], { k: "#1b1424", S: "#6a6070", O: "#ff8a2e" });
const CROW = sprite([
  "k.......k",
  "kRk...kRk",
  ".kRRkRRk.",
  "..kREEk..",
  "...kRRk..",
  "...kYk...",
], { k: "#1b1424", R: "#d8402a", E: "#ffe066", Y: "#ffb030" });
const LAVA = sprite([
  "...kkkkkk...",
  "..kRRRRRRk..",
  ".kRrRRRRrRk.",
  ".kRYkRRkYRk.",
  "kkRRRRRRRRkk",
  "kRRkROORkRRk",
  "kRRkOOOOkRRk",
  ".kk.kRRk.kk.",
  "....kk.kk...",
], { k: "#1b1424", R: "#7a2a1e", r: "#b04a2a", Y: "#ffe066", O: "#ffb030" });
const WMOBS = {
  imp: { n: "小妖", img: () => MOB, hp: 30, spd: 34, dmg: 6, r: 6, exp: 4, ai: "melee" },
  wolf: { n: "狼妖", img: () => WOLF, hp: 42, spd: 64, dmg: 7, r: 6, exp: 6, ai: "melee" },
  treant: { n: "樹妖", img: () => TREANT, hp: 40, spd: 24, dmg: 7, r: 7, exp: 7, ai: "ranged", range: 95, shot: 85 },
  golem: { n: "石甲妖", img: () => GOLEM, hp: 140, spd: 22, dmg: 16, r: 8, exp: 14, ai: "melee", armor: 0.3, heavy: true },
  bomber: { n: "爆石靈", img: () => BOMBER, hp: 32, spd: 58, dmg: 26, r: 6, exp: 10, ai: "bomber" },
  crow: { n: "火鴉", img: () => CROW, hp: 55, spd: 72, dmg: 9, r: 6, exp: 14, ai: "ranged", range: 115, shot: 120 },
  lava: { n: "熔岩獸", img: () => LAVA, hp: 230, spd: 30, dmg: 22, r: 9, exp: 26, ai: "melee", armor: 0.3, heavy: true },
  hunter: { n: "獵寶妖", img: () => WOLF, hp: 70, spd: 70, dmg: 12, r: 7, exp: 30, ai: "melee" }, // 身上寶物多時會來追殺
};
const ZONE_LOOT = { town: 1, grass: 1, forest: 1.3, waste: 1.6, volcano: 2 }; // 越深的地方掉越多

// ───────── 地圖生成（固定種子，每次都一樣）─────────
let wmap = null; // Uint8Array：0 空地、1 樹、2 石、3 熔岩、4 水、5 城牆、6 房子
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (a, b) => hash(a * 57 + b * 131 + 7);
  const s = (t) => t * t * (3 - 2 * t);
  const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
  return a + (b - a) * s(xf) + (c - a) * s(yf) + (a - b - c + d) * s(xf) * s(yf);
}
function buildWorld() {
  wmap = new Uint8Array(TW * TH);
  for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
    const x = tx * TS + 8, y = ty * TS + 8, z = zoneAt(x, y), v = hash(tx * 7.13 + ty * 91.7), n = vnoise(tx / 7, ty / 7);
    let t = 0;
    if (tx === 0 || ty === 0 || tx === TW - 1 || ty === TH - 1) t = 2;
    else if (z === "grass") t = n > 0.72 && v < 0.4 ? 1 : v > 0.988 ? 2 : 0;
    else if (z === "forest") t = n > 0.42 && v < 0.55 ? 1 : n < 0.1 ? 4 : v > 0.985 ? 2 : 0;
    else if (z === "waste") t = v > 0.95 || (n > 0.78 && v < 0.35) ? 2 : 0;
    else if (z === "volcano") t = n > 0.68 && v < 0.5 ? 3 : v > 0.96 ? 2 : 0;
    wmap[ty * TW + tx] = t;
  }
  // 城牆（四個城門）＋房子
  for (let a = 0; a < Math.PI * 2; a += 0.01) {
    const gate = [0, Math.PI / 2, Math.PI, Math.PI * 1.5].some((g) => Math.abs(((a - g + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.16);
    if (gate) continue;
    setT(TOWN.x + Math.cos(a) * TOWN.r, TOWN.y + Math.sin(a) * TOWN.r * 0.8, 5);
  }
  for (const [bx, by, bw, bh] of [[-86, -60, 3, 1], [38, -60, 3, 1], [-86, 54, 3, 1], [38, 54, 3, 1]])
    for (let i = 0; i < bw; i++) for (let j = 0; j < bh; j++) setT(TOWN.x + bx + i * TS, TOWN.y + by + j * TS, 6);
  // 路：從城門通往各傳送陣、祭壇
  const roads = [[TOWN, WAYPOINTS[1]], [TOWN, WAYPOINTS[2]], [TOWN, WAYPOINTS[3]], [TOWN, WAYPOINTS[4]], [WAYPOINTS[4], ALTAR], [WAYPOINTS[2], WAYPOINTS[4]], [WAYPOINTS[3], WAYPOINTS[4]]];
  for (const [a, b] of roads) carve(a, b, 2);
  for (const p of [...WAYPOINTS, ALTAR]) clearAround(p.x, p.y, 3);
}
function setT(x, y, t) { const tx = Math.floor(x / TS), ty = Math.floor(y / TS); if (tx >= 0 && ty >= 0 && tx < TW && ty < TH) wmap[ty * TW + tx] = t; }
function clearAround(x, y, r) { for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) { const t = tileAt(x + i * TS, y + j * TS); if (t !== 5 && t !== 6) setT(x + i * TS, y + j * TS, 0); } }
function carve(a, b, w) {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  for (let s = 0; s <= d; s += 8) {
    const x = a.x + (b.x - a.x) * (s / d) + Math.sin(s / 90) * 30, y = a.y + (b.y - a.y) * (s / d);
    for (let i = -w; i <= w; i++) for (let j = -w; j <= w; j++) { const t = tileAt(x + i * TS, y + j * TS); if (t !== 5 && t !== 6) setT(x + i * TS, y + j * TS, 0); }
  }
}
const tileAt = (x, y) => { const tx = Math.floor(x / TS), ty = Math.floor(y / TS); return tx < 0 || ty < 0 || tx >= TW || ty >= TH ? 2 : wmap[ty * TW + tx]; };
const solid = (x, y) => { const t = tileAt(x, y); return t !== 0 && t !== 3; }; // 熔岩可以走，但會燙
const blockedCircle = (x, y, r) => solid(x - r, y - r) || solid(x + r, y - r) || solid(x - r, y + r) || solid(x + r, y + r);
function moveBody(o, dx, dy, r) {
  if (!blockedCircle(o.x + dx, o.y, r)) o.x += dx;
  if (!blockedCircle(o.x, o.y + dy, r)) o.y += dy;
}

// ───────── 角色 ─────────
const AP = {
  str: { n: "力量", d: "攻擊 +3%" },
  vit: { n: "體魄", d: "生命 +12" },
  agi: { n: "身法", d: "移動 +1.5%、爆擊 +0.5%" },
  wis: { n: "悟性", d: "真氣 +6、回氣 +4%" },
};
const blankW = () => ({ lv: 1, exp: 0, x: 1200, y: 1530, wp: ["town"], ap: { str: 0, vit: 0, agi: 0, wis: 0 }, free: 0, potions: 3 });
const expNext = (lv) => Math.round(30 * Math.pow(lv, 1.6));
let W0 = null; // 大世界執行中的資料
let inWorld = false;
function worldStats() {
  const w = save.w, a = w.ap;
  const b = bonus();
  b.maxHp = Math.round(b.maxHp + (w.lv - 1) * 12 + a.vit * 12);
  b.atk *= (1 + (w.lv - 1) * 0.1) * (1 + a.str * 0.03);
  b.spdMul *= 1 + a.agi * 0.015;
  b.crit += a.agi * 0.005;
  b.maxMp = 60 + w.lv * 2 + a.wis * 6;
  b.mpRegen = (4 + w.lv * 0.1) * (1 + a.wis * 0.04);
  b.potMax = 3 + Math.floor(w.lv / 8) + (save.tr.furnace || 0);
  return b;
}
// 三種武器各自的招式：名字、冷卻、耗真氣
const WSKILLS = {
  sword: { attack: ["劍擊", 0.3, 0], spin: ["劍氣斬", 0.7, 10], ult: ["掌心雷", 2.5, 22] },
  staff: { attack: ["法球", 0.42, 0], spin: ["火雨", 1.1, 14], ult: ["冰環", 3, 24] },
  bow: { attack: ["連射", 0.2, 0], spin: ["散射", 0.8, 10], ult: ["穿雲箭", 2, 18] },
  blade: { attack: ["重斬", 0.55, 0], spin: ["旋風斬", 1.2, 12], ult: ["裂地斬", 2.5, 20] },
  fist: { attack: ["連拳", 0.15, 0], spin: ["衝拳", 0.9, 8], ult: ["震地", 2.5, 20] },
  fan: { attack: ["風刃", 0.45, 0], spin: ["旋風", 1.5, 14], ult: ["清風", 4, 26] },
};
// 傳說武器：U 換成專屬招式
const WUQ = { thunder: ["九霄天雷", 3, 28], phoenix: ["朱雀環", 3, 28], sunbow: ["箭雨", 3, 26], moon: ["月輪", 3, 28], tiger: ["百裂拳", 2.5, 24], qiankun: ["乾坤吸", 4, 26] };
const curUq = () => { const it = save.eq.sword; return it && it.u && WUQ[it.u] ? it.u : null; };
let WSKILL = {};
function applyWeapon() {
  const ws = WSKILLS[curWeapon()];
  WSKILL = { roll: { cd: 1.1, mp: 0 }, potion: { cd: 1, mp: 0 } };
  for (const k in ws) WSKILL[k] = { n: ws[k][0], cd: ws[k][1], mp: ws[k][2] };
  const u = curUq(); if (u) WSKILL.ult = { n: WUQ[u][0], cd: WUQ[u][1], mp: WUQ[u][2], uq: u };
  const cdm = Math.max(0.4, 1 - 0.07 * gemLv("haste")), mpm = Math.max(0.3, 1 - 0.1 * gemLv("thrift")); // 寶石：疾風、省元
  for (const k of ["attack", "spin", "ult"]) { WSKILL[k].cd *= cdm; WSKILL[k].mp = Math.round(WSKILL[k].mp * mpm); }
}
applyWeapon();
const PAD_KEYS = { attack: "J", spin: "K", roll: "空白", ult: "U", potion: "H" };
const padOrig = {};
pad.querySelectorAll(".btn").forEach((b) => { padOrig[b.dataset.act] = b.innerHTML; });
function setPadLabels(world) {
  pad.querySelectorAll(".btn").forEach((b) => {
    if (!world) { b.innerHTML = padOrig[b.dataset.act]; return; }
    applyWeapon();
    const k = PAD_KEYS[b.dataset.act], n = WSKILL[b.dataset.act].n || { roll: "閃身", potion: "丹藥" }[b.dataset.act];
    b.innerHTML = `${n}<small>${k}</small>${b.dataset.act === "potion" ? '<b class="count">3</b>' : ""}${b.dataset.act !== "attack" ? '<i class="cd"></i>' : ""}`;
  });
}

function enterWorld() {
  if (!wmap) buildWorld();
  if (!save.w) save.w = blankW();
  if (!save.eq.sword) { const it = rollItem(0, 0, "sword"); it.q = 0; it.u = null; it.wt = "sword"; it.aff = {}; nameItem(it); save.eq.sword = it; writeSave(); }
  if (!save.gems) { save.gems = {}; addGem("multi:1"); addGem("power:1"); writeSave(); W0gift = true; }
  mode = "normal";
  inWorld = true;
  B = worldStats();
  run = { x: 0, y: 0, swords: 0, perks: {}, shield: 0, rows: [], fromWorld: true };
  const w = save.w;
  if (blockedCircle(w.x, w.y, 5)) { w.x = 1200; w.y = 1530; }
  if (!W0) {
    W0 = { camps: [], mobs: [], pshots: [], eshots: [], fires: [], rings: [], tornados: [], spinT: 0, spinTick: 0, drops: [], npcCool: null, zone: "", bannerT: 0, saveT: 5, combatT: 0, lastAggro: 0 };
    makeCamps();
  }
  Object.assign(W0, { x: w.x, y: w.y, hp: B.maxHp, maxHp: B.maxHp, mp: B.maxMp, face: -Math.PI / 2, flip: false, walk: 0, iframe: 1, hurt: 0, swing: 0,
    roll: 0, rollDir: 0, cds: { attack: 0, spin: 0, ult: 0, roll: 0, potion: 0 }, regenAcc: 0, lavaT: 0 });
  if (W0.keepHp) { W0.hp = Math.min(B.maxHp, W0.keepHp); W0.keepHp = 0; }
  particles = []; floaters = []; shake = 0; flashT = 0; hitstop = 0;
  cam = { x: W0.x, y: W0.y, zoom: 1 };
  state = "world";
  screenEl.classList.add("hidden");
  pad.classList.remove("hidden");
  setPadLabels(true);
  if (W0gift) { W0gift = false; floatText(W0.x, W0.y - 56, "得到 2 顆技能寶石！", "#ffb347", true); floatText(W0.x, W0.y - 40, "打開背包鑲到武器上", "#ffb347"); }
  last = performance.now();
}
let W0gift = false;
function worldReturn() { // 從裝備、秘境等畫面回到大世界
  if (!inWorld) { renderTitle(); return; }
  B = worldStats();
  W0.maxHp = B.maxHp; W0.hp = Math.min(W0.hp, B.maxHp);
  state = "world";
  screenEl.classList.add("hidden");
  pad.classList.remove("hidden");
  setPadLabels(true);
  last = performance.now();
}

// 怪物營地：分散在各地區，死了會重生
function makeCamps() {
  const r = mulberry32(20261106);
  const want = { grass: 16, forest: 16, waste: 14, volcano: 12 };
  for (const z in want) {
    let n = 0, tries = 0;
    while (n < want[z] && tries++ < 4000) {
      const x = 40 + r() * (TW * TS - 80), y = 40 + r() * (TH * TS - 80);
      if (zoneAt(x, y) !== z || Math.hypot(x - TOWN.x, y - TOWN.y) < 230 || blockedCircle(x, y, 12)) continue;
      if (W0.camps.some((c) => Math.hypot(c.x - x, c.y - y) < 120)) continue;
      const lo = ZONES[z].lv[0], hi = ZONES[z].lv[1];
      const far = clamp((Math.hypot(x - TOWN.x, y - TOWN.y) - 230) / 1300, 0, 1);
      const zf = z === "grass" ? clamp((Math.hypot(x - TOWN.x, y - TOWN.y) - 230) / 700, 0, 1) : z === "volcano" ? clamp((480 - y) / 400, 0, 1) : far;
      const camp = { x, y, z, lv: Math.round(lo + (hi - lo) * zf), size: 3 + Math.floor(r() * 3), respawn: [] };
      W0.camps.push(camp);
      for (let i = 0; i < camp.size; i++) spawnWMob(camp);
      n++;
    }
  }
}
function spawnWMob(camp) {
  const types = ZONES[camp.z].mobs, type = types[Math.floor(Math.random() * types.length)], d = WMOBS[type];
  const lv = Math.max(1, camp.lv + Math.floor(Math.random() * 3) - 1), elite = Math.random() < 0.08;
  const hp = d.hp * (1 + 0.3 * (lv - 1)) * (elite ? 3 : 1);
  let x = camp.x, y = camp.y;
  for (let i = 0; i < 10; i++) { const tx = camp.x + rand(-40, 40), ty = camp.y + rand(-40, 40); if (!blockedCircle(tx, ty, d.r)) { x = tx; y = ty; break; } }
  W0.mobs.push({ type, lv, elite, camp, x, y, hp, max: hp, st: "idle", wt: rand(0, 2), wx: x, wy: y, atkT: 0, flash: 0, kb: 0, ka: 0, fuse: 0 });
}

// ───────── 傷害 ─────────
const wDmg = (base) => base * B.atk * (B.zen ? 1 + Math.floor(W0.combatT / 10) * 0.05 : 1) * (1 + 0.1 * gemLv("power"));
let chainLock = false; // 連鎖寶石引的雷不會再引雷
function hitMob(m, dmg, kb = 0, from = null, quiet = false) {
  if (m.dead) return;
  const d = WMOBS[m.type], crit = Math.random() < B.crit;
  if (crit) dmg *= B.critDmg;
  if (crit && B.uq.thunder && Math.random() < 0.3) { dmg += wDmg(20); bolts.push({ x: m.x, y: m.y, life: 0.25 }); }
  if (d.armor && !B.ignoreDef) dmg *= 1 - d.armor;
  dmg = Math.max(1, Math.round(dmg * rand(0.9, 1.1)));
  m.hp -= dmg; m.flash = 0.08;
  if (m.st === "idle" || m.st === "home") m.st = "chase";
  if (kb && from && !m.elite) { m.kb = kb; m.ka = angTo(from, m); }
  const lch = B.leech + 0.005 * gemLv("blood");
  if (lch > 0) W0.regenAcc += dmg * lch;
  const gf = gemLv("frost"); if (gf && Math.random() < 0.15 + gf * 0.1) m.slowT = Math.max(m.slowT || 0, 1.5);
  const gc = gemLv("chain");
  if (gc && !chainLock && Math.random() < 0.08 + gc * 0.05) {
    let o = null, bd = 70; for (const n of W0.mobs) if (n !== m && !n.dead) { const dd = dist(n, m); if (dd < bd) { bd = dd; o = n; } }
    if (o) { bolts.push({ x: o.x, y: o.y, life: 0.2 }); chainLock = true; hitMob(o, dmg * 0.6, 0, null, true); chainLock = false; }
  }
  W0.mp = Math.min(B.maxMp, W0.mp + (quiet ? 0 : 1));
  floatText(m.x, m.y - 10, crit ? `${dmg}!` : `${dmg}`, crit ? "#ffd84a" : "#ffffff", crit);
  if (!quiet) { sfx(crit ? "crit" : "hit"); hitstop = Math.max(hitstop, crit ? 0.05 : 0.025); }
  burst(m.x, m.y, crit ? "#ffd84a" : "#ffb070", crit ? 10 : 5, 60);
  fxHit(m.x + rand(-2, 2), m.y - 2 + rand(-2, 2), crit, WPN_FX[curWeapon()]);
  if (m.hp <= 0) killMob(m);
}
function killMob(m) {
  m.dead = true;
  const gb = gemLv("burst"); if (gb) { W0.fires.push({ x: m.x, y: m.y, t: 0.08, r: 26 + gb * 2, dmg: 6 + gb * 4, c: "#ff8a3d" }); }
  const d = WMOBS[m.type], w = save.w;
  burst(m.x, m.y, m.elite ? "#6fb8ff" : "#b07dff", m.elite ? 30 : 12, 90);
  fxPuff(m.x, m.y, m.elite || m.hunter);
  // 經驗：打比自己弱很多的怪，經驗變少
  let exp = d.exp * (1 + 0.3 * (m.lv - 1)) * (m.elite ? 3 : 1);
  if (m.lv < w.lv - 5) exp *= 0.3;
  exp = Math.max(1, Math.round(exp));
  gainExp(exp);
  questEvent(m.elite ? "elite" : "kill", m.camp.z);
  save.xiuwei += Math.max(1, Math.round(exp / 6));
  // 掉寶
  const il = Math.max(0, Math.floor(m.lv / 3) + Math.floor(Math.random() * 2) - 1);
  const zl = ZONE_LOOT[m.camp.z] || 1;
  if (m.hunter) { for (let i = 0; i < 3; i++) wDrop({ kind: "item", it: rollItem(1, il + 1) }, m); wDrop({ kind: "stone", v: 10 + m.lv }, m); floatText(m.x, m.y - 20, "獵寶妖被斬了！", "#ffe066", true); }
  else if (Math.random() < (m.elite ? 0.6 : 0.045) * zl) wDrop({ kind: "item", it: rollItem(m.elite || zl >= 2 ? 1 : 0, il) }, m);
  if (m.hunter) { wDrop({ kind: "gem", g: randGem(1) }, m); wDrop({ kind: "gem", g: randGem(1) }, m); }
  else if (Math.random() < (m.elite ? 0.25 : 0.012 * zl)) wDrop({ kind: "gem", g: randGem(1) }, m);
  if (Math.random() < (m.elite ? 0.8 : 0.15)) wDrop({ kind: "stone", v: Math.round((1 + Math.floor(m.lv / 3) + (m.elite ? 4 : 0)) * zl) }, m);
  if (Math.random() < 0.03) wDrop({ kind: "potion" }, m);
  if (m.elite && Math.random() < 0.15) wDrop({ kind: "key", k: makeKey(Math.max(1, Math.ceil(m.lv / 4))) }, m);
  if (!m.hunter) m.camp.respawn.push(22 + Math.random() * 10);
}
function wDrop(o, at) { o.x = at.x + rand(-12, 12); o.y = at.y + rand(-8, 8); o.t = 0; W0.drops.push(o); }
function gainExp(n) {
  const w = save.w;
  w.exp += n;
  floatText(W0.x + 10, W0.y - 22, `+${n} 經驗`, "#9fe8ff");
  while (w.exp >= expNext(w.lv)) {
    w.exp -= expNext(w.lv); w.lv++; w.free += 4;
    B = worldStats(); W0.maxHp = B.maxHp; W0.hp = B.maxHp; W0.mp = B.maxMp;
    floatText(W0.x, W0.y - 34, `升級！Lv.${w.lv}（能力點 +4）`, "#ffe066", true);
    sfx("arrive"); burst(W0.x, W0.y, "#ffe066", 40, 120, 0.8); flashT = 0.2; flashColor = "255,240,180";
  }
  writeSave();
}
function hurtW(dmg, from) {
  const p = W0;
  if (p.iframe > 0 || state !== "world") return;
  dmg = dmg * B.dmgTaken * (B.uq.vajra && p.hp < p.maxHp * 0.3 ? 0.5 : 1);
  dmg = Math.max(1, Math.round(dmg));
  p.hp -= dmg; p.iframe = 0.45; p.hurt = 0.2;
  floatText(p.x, p.y - 14, `-${dmg}`, "#ff6b6b");
  sfx("hurt"); shake = Math.max(shake, 5); flashT = 0.1; flashColor = "255,40,40";
  if (from && B.thorns > 0 && from.hp !== undefined) hitMob(from, dmg * B.thorns * 3, 0, null, true);
  if (from) { const a = angTo(from, p); moveBody(p, Math.cos(a) * 8, Math.sin(a) * 8, 5); }
  if (p.hp <= 0) { p.hp = 0; state = "worldDead"; sfx("lose"); setTimeout(showWorldDead, 900); }
}
function showWorldDead() {
  const w = save.w, lose = Math.round(w.exp * 0.1);
  const lost = riskyItems(); lost.forEach(ungem);
  save.bag = save.bag.filter((b) => !b.risk);
  for (const k of SLOT_KEYS) if (save.eq[k] && save.eq[k].risk) delete save.eq[k];
  w.exp -= lose; w.x = 1200; w.y = 1530; writeSave();
  pad.classList.add("hidden");
  screenEl.innerHTML = `<div class="panel"><h1>你倒下了…</h1>
    <div class="result">損失經驗 ${lose}<br>${lost.length ? `還沒帶回的 ${lost.length} 件裝備掉光了：${lost.map((it) => `<b style="color:${RARITY[it.q].c}">${it.name}</b>`).join("、")}` : "沒有掉裝備（都已經帶回了）"}<br><small>野外撿到的裝備要回城、走傳送陣，或用回城符才算帶回</small></div>
    <div class="btns"><button id="revive" class="big">在青雲城復活</button><button id="home" class="big alt">回主畫面</button></div></div>`;
  screenEl.classList.remove("hidden");
  document.getElementById("revive").onclick = () => { W0.x = 1200; W0.y = 1530; enterWorld(); };
  document.getElementById("home").onclick = renderTitle;
}

// ───────── 每幀更新 ─────────
function updateWorld(dt) {
  updateWFx(dt);
  const p = W0, w = save.w;
  for (const k in p.cds) p.cds[k] = Math.max(0, p.cds[k] - dt);
  p.iframe = Math.max(0, p.iframe - dt); p.hurt = Math.max(0, p.hurt - dt); p.swing = Math.max(0, p.swing - dt);
  p.mp = Math.min(B.maxMp, p.mp + B.mpRegen * dt);
  p.regenAcc += B.regen * dt;
  if (p.regenAcc >= 1) { const h = Math.min(Math.floor(p.regenAcc), p.maxHp - p.hp); p.hp += h; p.regenAcc -= Math.floor(p.regenAcc); }

  // 移動
  let mx = 0, my = 0;
  if (keys.has("a") || keys.has("arrowleft")) mx -= 1;
  if (keys.has("d") || keys.has("arrowright")) mx += 1;
  if (keys.has("w") || keys.has("arrowup")) my -= 1;
  if (keys.has("s") || keys.has("arrowdown")) my += 1;
  if (stick.id !== null) { const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = Math.hypot(dx, dy); if (d > 8) { mx = dx / Math.max(d, 50); my = dy / Math.max(d, 50); } }
  const ml = Math.hypot(mx, my);
  if (ml > 1) { mx /= ml; my /= ml; }
  if (ml > 0.1) { p.face = Math.atan2(my, mx); p.walk += dt * 10; }
  if (Math.cos(p.face) < -0.2) p.flip = true; else if (Math.cos(p.face) > 0.2) p.flip = false;
  if (p.roll > 0) {
    p.roll -= dt;
    moveBody(p, Math.cos(p.rollDir) * 250 * dt, Math.sin(p.rollDir) * 250 * dt, 5);
    if (p.dashHit) for (const m of W0.mobs) if (!m.dead && !p.dashHit.has(m) && dist(m, p) < 14 + WMOBS[m.type].r) { p.dashHit.add(m); hitMob(m, wDmg(16), 90, p); }
    if (p.roll <= 0) p.dashHit = null;
    if (Math.random() < 0.6) particles.push({ x: p.x, y: p.y + 5, vx: 0, vy: -10, life: 0.3, max: 0.3, color: "#8fa7ff", size: 2 });
  } else {
    const spd = 85 * B.spdMul * (p.swing > 0 ? 0.6 : 1);
    moveBody(p, mx * spd * dt, my * spd * dt, 5);
  }
  // 熔岩會燙
  if (tileAt(p.x, p.y) === 3) { p.lavaT -= dt; if (p.lavaT <= 0) { p.lavaT = 0.5; p.iframe = 0; hurtW(4 + w.lv * 0.6); } }

  const near = (max) => { let best = null, bd = max; for (const m of W0.mobs) { if (m.dead) continue; const d = dist(m, p); if (d < bd) { bd = d; best = m; } } return best; };
  const useSkill = (k) => { if (p.cds[k] > 0 || p.mp < WSKILL[k].mp || p.roll > 0) return false; p.cds[k] = WSKILL[k].cd * (k === "roll" ? B.rollCd : 1); p.mp -= WSKILL[k].mp; return true; };
  const wt = curWeapon();
  const arcHit = (range, half, base, kb) => {
    for (const m of W0.mobs) {
      if (m.dead) continue;
      const d = dist(m, p), diff = Math.abs(((angTo(p, m) - p.face + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (d < range + WMOBS[m.type].r && diff < half) hitMob(m, wDmg(base), kb, p);
    }
  };
  const gp = gemLv("pierce");
  const shoot = (a, o) => { if (gp) { o.pierce = true; o.dmg *= 1 + gp * 0.05; } W0.pshots.push(Object.assign({ x: p.x, y: p.y - 3, vx: Math.cos(a) * o.v, vy: Math.sin(a) * o.v, a, hit: new Set() }, o)); };
  if ((act("attack", "j", "z") || (keys.has("j") && p.cds.attack <= 0)) && useSkill("attack")) {
    if (wt === "sword") { // 劍擊：前方扇形
      const t = near(50); if (t) p.face = angTo(p, t);
      p.swing = p.swingMax = 0.18; p.swingR = 22; sfx("dash");
      for (const m of W0.mobs) {
        if (m.dead) continue;
        const d = dist(m, p), diff = Math.abs(((angTo(p, m) - p.face + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (d < 30 + WMOBS[m.type].r && diff < 1.1) hitMob(m, wDmg(10), 80, p);
      }
    } else if (wt === "staff") { // 法球：遠程、打到第一隻就消失
      const t = near(150); if (t) p.face = angTo(p, t);
      shoot(p.face, { v: 170, life: 0.9, dmg: 12, kind: "orb", pierce: false, kb: 40 }); sfx("volley");
    } else if (wt === "bow") { // 連射：快、傷害低
      const t = near(170); if (t) p.face = angTo(p, t);
      shoot(p.face + rand(-0.05, 0.05), { v: 300, life: 0.6, dmg: 6, kind: "arrow", pierce: false, kb: 15 }); sfx("dash");
    } else if (wt === "blade") { // 重斬：慢但很寬
      const t = near(55); if (t) p.face = angTo(p, t);
      p.swing = p.swingMax = 0.25; p.swingR = 34; sfx("break"); shake = Math.max(shake, 2);
      arcHit(38, 1.5, 18, 110);
    } else if (wt === "fist") { // 連拳：超快、超近
      const t = near(40); if (t) p.face = angTo(p, t);
      p.swing = p.swingMax = 0.08; p.swingR = 14; sfx("hit");
      arcHit(22, 0.8, 5, 30);
    } else { // 風刃：飛出去再飛回來，穿透
      const t = near(150); if (t) p.face = angTo(p, t);
      shoot(p.face, { v: 200, life: 1.0, dmg: 8, kind: "wind", pierce: true, kb: 20, back: 0.5 }); sfx("dash");
    }
  }
  const doSpin = () => {
    const t = near(160); if (t) p.face = angTo(p, t);
    if (wt === "sword") { // 劍氣斬：三道穿透劍氣
      for (let i = -1; i <= 1; i++) shoot(p.face + i * 0.22, { v: 230, life: 0.6, dmg: 14, kind: "sword", pierce: true, kb: 50 });
      sfx("volley");
    } else if (wt === "staff") { // 火雨：在目標位置落下、範圍爆炸
      const tx = t ? t.x : p.x + Math.cos(p.face) * 60, ty = t ? t.y : p.y + Math.sin(p.face) * 60;
      W0.fires.push({ x: tx, y: ty, t: 0.45, r: 34, dmg: 30 }); sfx("dash");
    } else if (wt === "bow") { // 散射：五支箭
      for (let i = -2; i <= 2; i++) shoot(p.face + i * 0.18, { v: 280, life: 0.55, dmg: 9, kind: "arrow", pierce: false, kb: 30 });
      sfx("volley");
    } else if (wt === "blade") { // 旋風斬：身邊轉三圈
      W0.spinT = 0.6; W0.spinTick = 0; sfx("volley");
    } else if (wt === "fist") { // 衝拳：往前衝、一路打
      p.roll = 0.18; p.rollDir = p.face; p.iframe = Math.max(p.iframe, 0.25); p.dashHit = new Set(); sfx("dash");
    } else { // 旋風：慢慢往前飄、一直打
      W0.tornados.push({ x: p.x + Math.cos(p.face) * 14, y: p.y + Math.sin(p.face) * 14, vx: Math.cos(p.face) * 45, vy: Math.sin(p.face) * 45, t: 1.6, tick: 0 }); sfx("volley");
    }
  };
  if (act("spin", "k", "x") && useSkill("spin")) {
    doSpin(); fxCast(WPN_FX[wt]);
    const gm = gemLv("multi"); if (gm && Math.random() < 0.25 + gm * 0.1) W0.recastT = 0.2; // 連發寶石
  }
  if (W0.recastT > 0 && (W0.recastT -= dt) <= 0) { W0.recastT = 0; doSpin(); floatText(p.x, p.y - 20, "連發！", "#ffb347"); }
  if (act("ult", "u", "i") && p.cds.ult <= 0 && p.mp >= WSKILL.ult.mp) {
    if (WSKILL.ult.uq) { if (useSkill("ult")) uniqueUlt(WSKILL.ult.uq, near); }
    else if (wt === "sword") { // 掌心雷：劈最近的怪和牠旁邊的
      const t = near(150);
      if (t && useSkill("ult")) {
        bolts.push({ x: t.x, y: t.y, life: 0.3 });
        for (const m of W0.mobs) if (!m.dead && dist(m, t) < 38) hitMob(m, wDmg(26), 40, t, true);
        sfx("crit"); shake = Math.max(shake, 6); flashT = 0.08; flashColor = "200,220,255";
        burst(t.x, t.y, "#cfe0ff", 26, 120, 0.6);
      } else if (!t) floatText(p.x, p.y - 20, "附近沒有目標", "#cfc4dc");
    } else if (wt === "staff" && useSkill("ult")) { // 冰環：身邊一圈傷害＋減速
      for (const m of W0.mobs) if (!m.dead && dist(m, p) < 60) { hitMob(m, wDmg(18), 70, p, true); m.slowT = 3; }
      W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.35, r: 60 });
      sfx("crit"); shake = Math.max(shake, 5); burst(p.x, p.y, "#bfefff", 30, 140, 0.5);
    } else if (wt === "bow" && useSkill("ult")) { // 穿雲箭：一支大箭穿透一整排
      const t = near(220); if (t) p.face = angTo(p, t);
      shoot(p.face, { v: 380, life: 0.8, dmg: 34, kind: "big", pierce: true, kb: 90 });
      sfx("crit"); shake = Math.max(shake, 4);
    } else if (wt === "blade" && useSkill("ult")) { // 裂地斬：往前一路炸開
      const t = near(120); if (t) p.face = angTo(p, t);
      for (let i = 1; i <= 5; i++) W0.fires.push({ x: p.x + Math.cos(p.face) * i * 22, y: p.y + Math.sin(p.face) * i * 22, t: 0.05 + i * 0.07, r: 18, dmg: 22, c: "#d8c8a0" });
      sfx("crit"); shake = Math.max(shake, 6);
    } else if (wt === "fist" && useSkill("ult")) { // 震地
      for (const m of W0.mobs) if (!m.dead && dist(m, p) < 50) { hitMob(m, wDmg(24), 140, p, true); m.slowT = 1.2; }
      W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.3, r: 50, c: "255,210,140" });
      sfx("break"); shake = Math.max(shake, 8); burst(p.x, p.y, "#d8b080", 30, 140, 0.5);
    } else if (wt === "fan" && useSkill("ult")) { // 清風：回血＋把怪吹開
      const heal = Math.min(Math.round(p.maxHp * 0.25), p.maxHp - p.hp); p.hp += heal;
      if (heal) floatText(p.x, p.y - 16, `+${heal}`, "#7dff8a");
      for (const m of W0.mobs) if (!m.dead && dist(m, p) < 55) hitMob(m, wDmg(8), 160, p, true);
      W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.4, r: 55, c: "160,255,190" });
      sfx("heal"); burst(p.x, p.y, "#a0ffbe", 24, 100, 0.6);
    }
  }
  if (act("roll", " ", "l", "shift") && useSkill("roll")) { p.roll = 0.22; p.rollDir = ml > 0.1 ? Math.atan2(my, mx) : p.face; p.iframe = Math.max(p.iframe, 0.3); sfx("dash"); }
  if (act("potion", "h", "c") && w.potions > 0 && p.hp < p.maxHp && useSkill("potion")) {
    w.potions--; const heal = Math.min(Math.round(p.maxHp * 0.4 * B.potionMul), p.maxHp - p.hp); p.hp += heal;
    floatText(p.x, p.y - 16, `+${heal}`, "#7dff8a"); burst(p.x, p.y, "#7dff8a", 12, 40); sfx("heal"); writeSave();
  }

  // 劍氣飛行
  for (const s of W0.pshots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.back !== undefined && s.life < s.back && !s.turned) { s.turned = true; s.hit.clear(); }
    if (s.turned) { const a = angTo(s, p); s.vx = Math.cos(a) * 220; s.vy = Math.sin(a) * 220; s.a += dt * 20; if (dist(s, p) < 8) s.life = 0; }
    else if (s.kind === "wind") s.a += dt * 20;
    if (solid(s.x, s.y) && !s.turned) { if (s.back !== undefined) { s.turned = true; s.hit.clear(); } else s.life = 0; }
    for (const m of W0.mobs) if (s.life > 0 && !m.dead && !s.hit.has(m) && Math.hypot(m.x - s.x, m.y - s.y) < WMOBS[m.type].r + (s.kind === "big" ? 7 : 4)) {
      s.hit.add(m); hitMob(m, wDmg(s.dmg), s.kb, p, true);
      if (!s.pierce) { s.life = 0; burst(s.x, s.y, s.kind === "orb" ? "#c9a2ff" : "#ffe9a0", 5, 40); }
    }
  }
  W0.pshots = W0.pshots.filter((s) => s.life > 0);
  for (const f of W0.fires) { // 火雨落地
    f.t -= dt;
    if (f.t <= 0) {
      for (const m of W0.mobs) if (!m.dead && dist(m, f) < f.r + WMOBS[m.type].r) hitMob(m, wDmg(f.dmg), 40, f, true);
      fxBoom(f.x, f.y, f.r * 1.1, f.c === "#ff8a3d" || !f.c ? "255,150,60" : f.c === "#d8c8a0" ? "230,200,150" : "255,235,170");
      if (f.c) { burst(f.x, f.y, f.c, 14, 90, 0.4); shake = Math.max(shake, 3); if (Math.random() < 0.4) sfx("break"); }
      else { burst(f.x, f.y, "#ff8a2e", 36, 130, 0.6); burst(f.x, f.y, "#ffd84a", 16, 80, 0.4); shake = Math.max(shake, 5); sfx("break"); }
    }
  }
  W0.fires = W0.fires.filter((f) => f.t > 0);
  for (const r of W0.rings) r.t += dt;
  W0.rings = W0.rings.filter((r) => r.t < r.max);
  if (W0.spinT > 0) { // 旋風斬
    W0.spinT -= dt; W0.spinTick -= dt;
    if (W0.spinTick <= 0) { W0.spinTick = 0.2; for (const m of W0.mobs) if (!m.dead && dist(m, p) < 40 + WMOBS[m.type].r) hitMob(m, wDmg(12), 60, p, true); sfx("dash"); }
  }
  for (const t of W0.tornados) {
    t.t -= dt; t.tick -= dt;
    moveBody(t, t.vx * dt, t.vy * dt, 3);
    for (const m of W0.mobs) if (!m.dead && dist(m, t) < 40) { const a = angTo(m, t); moveBody(m, Math.cos(a) * 40 * dt, Math.sin(a) * 40 * dt, WMOBS[m.type].r); }
    if (t.tick <= 0) { t.tick = 0.25; for (const m of W0.mobs) if (!m.dead && dist(m, t) < 22 + WMOBS[m.type].r) hitMob(m, wDmg(6), 0, t, true); }
    if (Math.random() < 0.7) particles.push({ x: t.x + rand(-6, 6), y: t.y + rand(-4, 4), vx: rand(-30, 30), vy: -50, life: 0.35, max: 0.35, color: "#c8f0e0", size: 2 });
  }
  W0.tornados = W0.tornados.filter((t) => t.t > 0);

  // 怪物：只更新玩家附近的
  let aggro = false;
  const inTown = zoneAt(p.x, p.y) === "town";
  for (const m of W0.mobs) {
    if (m.dead || Math.abs(m.x - p.x) > 420 || Math.abs(m.y - p.y) > 420) continue;
    const d = WMOBS[m.type], dp = dist(m, p); let spd = d.spd * B.slow * (m.elite ? 1.1 : 1);
    m.flash = Math.max(0, m.flash - dt); m.atkT -= dt;
    if (m.slowT > 0) { m.slowT -= dt; spd *= 0.45; }
    if (m.kb > 0) { moveBody(m, Math.cos(m.ka) * m.kb * dt * 3, Math.sin(m.ka) * m.kb * dt * 3, d.r); m.kb = Math.max(0, m.kb - dt * 400); continue; }
    const homeD = Math.hypot(m.x - m.camp.x, m.y - m.camp.y);
    if (m.st === "idle") {
      if (dp < 75 && !inTown) m.st = "chase";
      m.wt -= dt;
      if (m.wt <= 0) { m.wt = rand(1.5, 4); m.wx = m.camp.x + rand(-50, 50); m.wy = m.camp.y + rand(-50, 50); }
      const a = Math.atan2(m.wy - m.y, m.wx - m.x);
      if (Math.hypot(m.wx - m.x, m.wy - m.y) > 4) moveBody(m, Math.cos(a) * spd * 0.35 * dt, Math.sin(a) * spd * 0.35 * dt, d.r);
    } else if (m.st === "home") { // 追太遠就回營地、回滿血
      m.wind = 0; if (m.atkT > 5) m.atkT = 0;
      const a = Math.atan2(m.camp.y - m.y, m.camp.x - m.x);
      moveBody(m, Math.cos(a) * spd * 1.2 * dt, Math.sin(a) * spd * 1.2 * dt, d.r);
      m.hp = Math.min(m.max, m.hp + m.max * 0.3 * dt);
      if (homeD < 20) m.st = "idle";
    } else {
      aggro = true;
      if (m.hunter && inTown) { m.dead = true; floatText(m.x, m.y - 12, "獵寶妖跑掉了", "#cfc4dc"); continue; }
      if (!m.hunter && (homeD > 280 || inTown)) { m.st = "home"; continue; }
      const a = angTo(m, p);
      if (d.ai === "ranged") {
        const want = d.range * 0.75;
        const dir = dp > want + 10 ? 1 : dp < want - 15 ? -0.7 : 0;
        moveBody(m, Math.cos(a) * spd * dir * dt, Math.sin(a) * spd * dir * dt, d.r);
        if (dp < d.range && m.atkT <= 0 && !(m.wind > 0)) { m.wind = m.windMax = 0.35; m.atkT = 99; }
        if (m.wind > 0 && (m.wind -= dt) <= 0) {
          m.wind = 0; m.atkT = 1.8;
          W0.eshots.push({ x: m.x, y: m.y - 3, vx: Math.cos(a) * d.shot, vy: Math.sin(a) * d.shot, life: 2, dmg: d.dmg * (1 + 0.15 * (m.lv - 1)) * (m.elite ? 1.5 : 1), c: m.type === "crow" ? "#ff7a2e" : "#9fe07a" });
        }
      } else if (d.ai === "bomber") {
        if (m.fuse > 0) {
          m.fuse -= dt;
          if (m.fuse <= 0) { // 爆炸
            burst(m.x, m.y, "#ff8a2e", 30, 140, 0.6); shake = Math.max(shake, 8); sfx("break");
            if (dist(m, p) < 30) hurtW(d.dmg * (1 + 0.15 * (m.lv - 1)) * (m.elite ? 1.5 : 1));
            m.hp = 0; killMob(m);
          }
        } else {
          moveBody(m, Math.cos(a) * spd * dt, Math.sin(a) * spd * dt, d.r);
          if (dp < 18) { m.fuse = 0.7; floatText(m.x, m.y - 12, "！", "#ff5a4a", true); }
        }
      } else {
        // 近戰：先蓄力（地上出現紅色範圍）再出手，可以閃身躲開
        if (m.wind > 0) {
          m.wind -= dt;
          if (m.wind <= 0) {
            const dmg = d.dmg * (1 + 0.15 * (m.lv - 1)) * (m.elite ? 1.5 : 1);
            if (d.heavy) { // 重擊：砸地一圈
              const cx = m.x + Math.cos(m.wa) * 8, cy = m.y + Math.sin(m.wa) * 8;
              fxBoom(cx, cy, 28, "255,170,90"); shake = Math.max(shake, 4); sfx("break");
              if (Math.hypot(p.x - cx, p.y - cy) < 28) hurtW(dmg, m);
            } else { // 撲咬：往前衝一下
              moveBody(m, Math.cos(m.wa) * 12, Math.sin(m.wa) * 12, d.r); m.lunge = 0.15;
              const diff = Math.abs(((angTo(m, p) - m.wa + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
              if (dist(m, p) < d.r + 13 && diff < 1.1) hurtW(dmg, m);
            }
            m.atkT = d.heavy ? 1.6 : 1.1;
          }
        } else {
          if (dp > d.r + 4) moveBody(m, Math.cos(a) * spd * dt, Math.sin(a) * spd * dt, d.r);
          if (dp < d.r + (d.heavy ? 20 : 15) && m.atkT <= 0) { m.wind = m.windMax = d.heavy ? 0.7 : m.elite ? 0.38 : 0.45; m.wa = a; }
        }
        if (m.lunge > 0) m.lunge -= dt;
      }
    }
  }
  // 怪物重生
  for (const c of W0.camps) {
    for (let i = c.respawn.length - 1; i >= 0; i--) { c.respawn[i] -= dt; if (c.respawn[i] <= 0) { c.respawn.splice(i, 1); spawnWMob(c); } }
  }
  W0.mobs = W0.mobs.filter((m) => !m.dead);
  // 敵人的子彈
  for (const s of W0.eshots) {
    s.x += s.vx * B.slow * dt; s.y += s.vy * B.slow * dt; s.life -= dt;
    if (solid(s.x, s.y)) s.life = 0;
    if (Math.hypot(s.x - p.x, s.y - p.y) < 6 && p.iframe <= 0) { s.life = 0; hurtW(s.dmg); }
  }
  W0.eshots = W0.eshots.filter((s) => s.life > 0);
  W0.combatT = aggro ? W0.combatT + dt : 0;

  // 撿東西
  for (const o of W0.drops) {
    o.t += dt;
    const d = dist(o, p), mag = 26 * (1 + B.magnet);
    if (o.kind !== "item" && o.kind !== "key" && o.kind !== "gem" && d < mag) { const a = angTo(o, p); o.x += Math.cos(a) * 180 * dt; o.y += Math.sin(a) * 180 * dt; }
    if (d < 10) {
      o.got = true;
      if (o.kind === "item") { if (W0.zone !== "town") o.it.risk = 1; grantLoot(o.it, p.x, p.y - 6); }
      else if (o.kind === "stone") { save.stone += o.v; floatText(p.x, p.y - 16, `靈石 +${o.v}`, "#9fe8ff"); sfx("good"); }
      else if (o.kind === "potion") { w.potions = Math.min(B.potMax, w.potions + 1); floatText(p.x, p.y - 16, "丹藥 +1", "#7dff8a"); sfx("heal"); }
      else if (o.kind === "gem") { addGem(o.g); floatText(p.x, p.y - 16, `◆ ${gemName(o.g)}`, GEMS[o.g.split(":")[0]].c, true); sfx("arrive"); }
      else if (o.kind === "key") { addKey(o.k); floatText(p.x, p.y - 16, `秘境鑰 第 ${o.k.tier} 層`, "#9fe8ff", true); sfx("arrive"); }
      writeSave();
    }
  }
  W0.drops = W0.drops.filter((o) => !o.got && o.t < 120);

  // 地區切換提示、傳送陣解鎖
  const z = zoneAt(p.x, p.y);
  if (z !== W0.zone) { W0.zone = z; W0.bannerT = 2.5; if (z === "town") { w.potions = Math.max(w.potions, B.potMax); bankLoot("回到青雲城"); } }
  W0.bannerT = Math.max(0, W0.bannerT - dt);
  for (const wp of WAYPOINTS) if (!w.wp.includes(wp.id) && dist(wp, p) < 40) { w.wp.push(wp.id); floatText(p.x, p.y - 30, `解鎖傳送陣：${wp.n}`, "#9fe8ff", true); sfx("arrive"); writeSave(); }

  // NPC、傳送陣、祭壇：走過去自動打開
  const spots = worldSpots();
  const hitSpot = spots.find((s) => dist(s, p) < (s.r || 16));
  if (!hitSpot) W0.npcCool = null;
  else if (W0.npcCool !== hitSpot.id) { W0.npcCool = hitSpot.id; openSpot(hitSpot); return; }

  if (pressed.has("q")) quickSwap();
  spawnHunter(dt);
  if (pressed.has("t")) openTeleport();
  if (W0.recall > 0) { // 回城符：原地不動 3 秒
    if (ml > 0.1 || p.hurt > 0) { W0.recall = 0; floatText(p.x, p.y - 26, "回城被打斷", "#ff8a7a"); }
    else {
      W0.recall -= dt;
      if (Math.random() < 0.5) particles.push({ x: p.x + rand(-8, 8), y: p.y + 4, vx: 0, vy: -40, life: 0.5, max: 0.5, color: "#9fe8ff", size: 2 });
      if (W0.recall <= 0) { W0.recall = 0; bankLoot("回城符"); W0.x = 1200; W0.y = 1530; cam.x = W0.x; cam.y = W0.y; burst(W0.x, W0.y, "#9fe8ff", 30, 100); sfx("arrive"); }
    }
  }
  checkQuest();
  W0.saveT -= dt;
  if (W0.saveT <= 0) { W0.saveT = 5; w.x = Math.round(p.x); w.y = Math.round(p.y); writeSave(); }
}

// ───────── NPC 與選單 ─────────
const NPCS = [
  { id: "alch", n: "丹師", x: 1262, y: 1480, pal: { W: "#7fd88a", w: "#4a9a5a", B: "#2a6a3a" }, d: "回滿生命真氣、補滿丹藥" },
  { id: "rift", n: "秘境使者", x: 1138, y: 1566, pal: { W: "#a96be0", w: "#7a3fb8", B: "#4a2a7a" }, d: "用秘境鑰進秘境刷寶" },
];
const NPC_IMG = {};
for (const n of NPCS) NPC_IMG[n.id] = sprite([...HERO_TOP, "...kwk.kwk..", "...kk...kk.."], Object.assign({}, HERO_PAL, n.pal));
function worldSpots() {
  return [
    ...NPCS.map((n) => ({ ...n, kind: "npc" })),
    ...WAYPOINTS.filter((wp) => save.w.wp.includes(wp.id)).map((wp) => ({ id: "wp-" + wp.id, kind: "wp", x: wp.x, y: wp.y, r: 12, wp })),
    { id: "altar", kind: "altar", x: ALTAR.x, y: ALTAR.y, r: 20 },
  ];
}
function openSpot(s) {
  pausedFrom = "world"; state = "pick";
  keys.clear(); stick.id = null;
  pad.classList.add("hidden");
  const w = save.w;
  let body = "", btns = "";
  if (s.id === "rift") { worldReturnTo(); keySel = null; renderMaps(); return; }
  if (s.id === "alch") {
    W0.hp = W0.maxHp; W0.mp = B.maxMp; w.potions = Math.max(w.potions, B.potMax); writeSave();
    body = `生命、真氣都回滿了，丹藥補到 ${w.potions} 顆。`;
  } else if (s.kind === "wp") { openTeleport(); return; } else if (false) {
    body = "";
    btns = WAYPOINTS.filter((wp) => w.wp.includes(wp.id) && wp.id !== s.wp.id).map((wp) => `<button class="big alt tp" data-wp="${wp.id}">${wp.n}<small>Lv.${ZONES[wp.id].lv.join("–")}</small></button>`).join("");
    if (!btns) body = "還沒有解鎖其他傳送陣。走到各地區的傳送陣就會解鎖。";
  } else if (s.kind === "altar") {
    body = `焚天石魔的祭壇。<br>建議 Lv.18 以上（你現在 Lv.${w.lv}）。<br>打贏會掉一堆高級裝備。`;
    btns = `<button id="fight" class="big">挑戰焚天石魔</button>`;
  }
  screenEl.innerHTML = `<div class="panel"><h1 class="pick-title">${s.n || (s.kind === "wp" ? `傳送陣・${s.wp.n}` : "祭壇")}</h1>
    <div class="result">${body}</div><div class="btns">${btns}<button id="close" class="big alt">離開</button></div></div>`;
  screenEl.classList.remove("hidden");
  document.getElementById("close").onclick = worldReturn;
  screenEl.querySelectorAll(".tp").forEach((b) => b.addEventListener("click", () => {
    const wp = WAYPOINTS.find((x) => x.id === b.dataset.wp);
    W0.x = wp.x; W0.y = wp.y + 22; W0.npcCool = "wp-" + wp.id; cam.x = W0.x; cam.y = W0.y;
    burst(W0.x, W0.y, "#9fe8ff", 30, 100); sfx("arrive");
    worldReturn();
  }));
  const f = document.getElementById("fight");
  if (f) f.onclick = startWorldBoss;
}
function worldReturnTo() { /* renderEquip／renderMaps 的「返回」會看 inWorld 回到大世界 */ }
function renderAP() {
  const w = save.w;
  B = worldStats();
  screenEl.innerHTML = `<div class="panel wide equip"><h1 class="pick-title">角色</h1>
    <div class="cpline">Lv.${w.lv}　能力點 <b>${w.free}</b>　戰力 <b>${totalCP()}</b></div>
    <div class="cpline small">招式跟著武器走：現在拿${WEAPONS[curWeapon()].n}（${WEAPONS[curWeapon()].d}）</div>
    <div class="cards">${Object.keys(AP).map((k) => `<button class="card ap" data-k="${k}" ${w.free ? "" : "disabled"}><b>${AP[k].n} ${w.ap[k]}</b><span class="desc">每點 ${AP[k].d}</span><i>＋1</i></button>`).join("")}</div>
    <div class="cpline small">生命 ${B.maxHp}　攻擊 ×${B.atk.toFixed(2)}　真氣 ${B.maxMp}　爆擊 ${Math.round(B.crit * 100)}%</div>
    <div class="btns"><button id="apReset" class="big alt">重新配點（−${20 * w.lv} 靈石）</button><button id="close" class="big">離開</button></div></div>`;
  screenEl.classList.remove("hidden");
  screenEl.querySelectorAll(".ap").forEach((b) => b.addEventListener("click", () => { if (!w.free) return; w.free--; w.ap[b.dataset.k]++; writeSave(); sfx("good"); renderAP(); }));
  document.getElementById("apReset").onclick = () => {
    const c = 20 * w.lv; if (save.stone < c) { sfx("bad"); return; }
    save.stone -= c; for (const k in w.ap) { w.free += w.ap[k]; w.ap[k] = 0; } writeSave(); renderAP();
  };
  document.getElementById("close").onclick = worldReturn;
}
// 世界王：進入原本的打王場地，數值用大世界的等級和裝備
function startWorldBoss() {
  const w = save.w;
  W0.keepHp = W0.hp;
  B = worldStats();
  B.bossHp = Math.round(2600 * (1 + 0.08 * (w.lv - 18)));
  B.bossDmg = 1 + 0.04 * w.lv;
  run = { x: 0, y: 0, swords: 0, perks: {}, shield: 0, rows: [], fromWorld: true };
  loot = [];
  setPadLabels(false);
  startBoss(w.lv * 5 + B.swordsAff);
}

// ───────── 畫面 ─────────
function renderWorld() {
  const p = W0;
  cam.x += (p.x - cam.x) * 0.15; cam.y += (p.y - cam.y) * 0.15;
  const Z = 1.35, k = SCALE * DPR * Z;
  const sx = shake > 0 ? rand(-shake, shake) * DPR : 0, sy = shake > 0 ? rand(-shake, shake) * DPR : 0;
  const ox = Math.round(W * DPR / 2 - cam.x * k + sx), oy = Math.round(H * DPR / 2 - cam.y * k + sy);
  ctx.setTransform(k, 0, 0, k, ox, oy);
  ctx.imageSmoothingEnabled = false;
  const hw = W / (2 * SCALE * Z) + 20, hh = H / (2 * SCALE * Z) + 20;
  const t0x = Math.max(0, Math.floor((cam.x - hw) / TS)), t1x = Math.min(TW - 1, Math.ceil((cam.x + hw) / TS));
  const t0y = Math.max(0, Math.floor((cam.y - hh) / TS)), t1y = Math.min(TH - 1, Math.ceil((cam.y + hh) / TS));
  // 地面
  for (let ty = t0y; ty <= t1y; ty++) for (let tx = t0x; tx <= t1x; tx++) {
    const x = tx * TS, y = ty * TS, z = zoneAt(x + 8, y + 8), t = wmap[ty * TW + tx], v = hash(tx * 3.1 + ty * 17.3);
    ctx.fillStyle = ZONES[z].g[(tx + ty) % 2]; ctx.fillRect(x, y, TS, TS);
    if (t === 0) drawDeco(x, y, z, v);
    if (t === 3) { ctx.fillStyle = `rgba(255,${100 + Math.sin(time * 3 + tx) * 40},30,0.85)`; ctx.fillRect(x, y, TS, TS); ctx.fillStyle = "rgba(255,230,120,0.5)"; ctx.fillRect(x + v * 10, y + 4, 3, 2); }
    else if (t === 4) { ctx.fillStyle = "#2a4a7a"; ctx.fillRect(x, y, TS, TS); ctx.fillStyle = "rgba(160,200,255,0.3)"; ctx.fillRect(x + ((time * 6 + v * 16) % 14), y + 6, 3, 1); }
    else if (t === 5) drawWallTile(x, y);
    else if (t === 6) drawHouseTile(x, y, tx, ty);
  }
  // 傳送陣、祭壇
  for (const wp of WAYPOINTS) {
    const on = save.w.wp.includes(wp.id);
    ctx.strokeStyle = on ? `rgba(120,220,255,${0.6 + Math.sin(time * 3) * 0.3})` : "rgba(150,150,170,0.4)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(wp.x, wp.y, 12, 6, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(wp.x, wp.y, 7, 3.5, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = "#4a2a2a"; ctx.beginPath(); ctx.ellipse(ALTAR.x, ALTAR.y, 26, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `rgba(255,80,40,${0.5 + Math.sin(time * 4) * 0.3})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(ALTAR.x, ALTAR.y, 20, 10, 0, 0, Math.PI * 2); ctx.stroke();
  drawFxUnder();
  // 掉落物
  for (const o of W0.drops) {
    if (Math.abs(o.x - cam.x) > hw || Math.abs(o.y - cam.y) > hh) continue;
    if (o.kind === "item") {
      const c = RARITY[o.it.q].c, hgt = 12 + o.it.q * 9;
      ctx.globalAlpha = 0.25 + 0.15 * Math.sin(time * 4 + o.x); ctx.fillStyle = c; ctx.fillRect(o.x - 1.5, o.y - hgt, 3, hgt); ctx.globalAlpha = 1;
      ctx.fillStyle = "#1b1424"; ctx.fillRect(o.x - 3, o.y - 3, 6, 6); ctx.fillStyle = c; ctx.fillRect(o.x - 2, o.y - 2, 4, 4);
      ctx.font = "bold 6px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
      const tw = ctx.measureText(o.it.name).width;
      ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(o.x - tw / 2 - 2, o.y - hgt - 8, tw + 4, 8);
      ctx.fillStyle = c; ctx.fillText(o.it.name, o.x, o.y - hgt - 2);
    } else if (o.kind === "stone") { ctx.fillStyle = "#9fe8ff"; ctx.fillRect(o.x - 2, o.y - 2, 4, 4); }
    else if (o.kind === "potion") { ctx.fillStyle = "#ff6b8a"; ctx.fillRect(o.x - 2, o.y - 3, 4, 5); ctx.fillStyle = "#fff"; ctx.fillRect(o.x - 1, o.y - 4, 2, 1); }
    else if (o.kind === "key") { ctx.fillStyle = "#9fe8ff"; ctx.fillRect(o.x - 3, o.y - 1, 6, 2); ctx.fillRect(o.x + 2, o.y - 3, 2, 6); }
    else if (o.kind === "gem") { // 寶石：菱形＋光柱
      const c = GEMS[o.g.split(":")[0]].c, by = o.y - 2 + Math.sin(time * 4 + o.x) * 1.5;
      ctx.globalAlpha = 0.3; ctx.fillStyle = c; ctx.fillRect(o.x - 1, o.y - 18, 2, 18); ctx.globalAlpha = 1;
      ctx.fillStyle = "#1b1424"; ctx.beginPath(); ctx.moveTo(o.x, by - 5); ctx.lineTo(o.x + 4, by); ctx.lineTo(o.x, by + 5); ctx.lineTo(o.x - 4, by); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(o.x, by - 4); ctx.lineTo(o.x + 3, by); ctx.lineTo(o.x, by + 4); ctx.lineTo(o.x - 3, by); ctx.fill();
    }
  }
  // 依 y 排序畫：樹、石頭、怪、NPC、玩家
  const objs = [];
  for (let ty = t0y; ty <= t1y + 1 && ty < TH; ty++) for (let tx = t0x; tx <= t1x; tx++) { const t = wmap[ty * TW + tx]; if (t === 1 || t === 2) objs.push({ y: ty * TS + 14, t, tx, ty }); }
  for (const m of W0.mobs) if (Math.abs(m.x - cam.x) < hw && Math.abs(m.y - cam.y) < hh) objs.push({ y: m.y, m });
  for (const n of NPCS) if (Math.abs(n.x - cam.x) < hw && Math.abs(n.y - cam.y) < hh) objs.push({ y: n.y, n });
  objs.push({ y: p.y, me: true });
  objs.sort((a, b) => a.y - b.y);
  for (const o of objs) {
    if (o.t === 1) {
      const x = o.tx * TS, y = o.ty * TS, z = zoneAt(x, y), img = TREE_IMG[z] || TREE_IMG.grass;
      ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.beginPath(); ctx.ellipse(x + 8, y + 15, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(img, x - 1, y - 1);
    } else if (o.t === 2) {
      const x = o.tx * TS, y = o.ty * TS, z = zoneAt(x, y);
      ctx.drawImage(z === "volcano" || z === "waste" ? ROCK_RED : ROCK_IMG, x, y + 3);
    } else if (o.m) drawWMob(o.m);
    else if (o.n) {
      const n = o.n;
      ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(n.x, n.y + 6, 6, 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(NPC_IMG[n.id], Math.round(n.x - 6), Math.round(n.y - 8 + Math.sin(time * 2 + n.x) * 0.6));
      ctx.font = "bold 7px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
      ctx.fillStyle = "#1b1424"; ctx.fillText(n.n, n.x + 0.5, n.y - 11.5); ctx.fillStyle = "#ffe066"; ctx.fillText(n.n, n.x, n.y - 12);
    } else if (o.me && state !== "worldDead") {
      if (p.iframe <= 0 || Math.floor(time * 20) % 2 || p.roll > 0) {
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(p.x, p.y + 7, 6, 2, 0, 0, Math.PI * 2); ctx.fill();
        const wt = curWeapon(), behind = Math.sin(p.face) < -0.3;
        drawHeroAura(p);
        if (behind) drawHeldWeapon(p, wt);
        ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y)); if (p.flip) ctx.scale(-1, 1);
        ctx.drawImage(heroImg(Math.floor(p.walk) % 2), -6, -9); ctx.restore();
        if (!behind) drawHeldWeapon(p, wt);
        drawSlash(p, wt);
      }
    }
  }
  for (const s of W0.pshots) {
    if (s.kind === "sword") { // 劍氣：月牙＋拖尾
      drawTrail(s, "160,210,255", 5);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.translate(s.x, s.y); ctx.rotate(s.a);
      ctx.strokeStyle = "rgba(160,210,255,0.6)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-4, 0, 8, -1.1, 1.1); ctx.stroke();
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(-4, 0, 8, -1, 1); ctx.stroke(); ctx.restore();
    }
    else if (s.kind === "orb") { drawTrail(s, "201,162,255", 4); glow(s.x, s.y, 9, "201,162,255", 0.7); ctx.fillStyle = "#f0e0ff"; ctx.beginPath(); ctx.arc(s.x, s.y, 2.2, 0, Math.PI * 2); ctx.fill(); }
    else if (s.kind === "wind") { drawTrail(s, "160,255,200", 3); ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.translate(s.x, s.y); ctx.rotate(s.a); ctx.strokeStyle = "rgba(160,255,200,0.9)"; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI * 2 / 3); ctx.beginPath(); ctx.arc(0, 0, 6, 0, 1.4); ctx.stroke(); } ctx.restore(); }
    else if (s.kind === "fireball") { drawTrail(s, "255,130,40", 6); glow(s.x, s.y, 10, "255,140,50", 0.8); ctx.fillStyle = "#ffe066"; ctx.beginPath(); ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2); ctx.fill(); }
    else if (s.kind === "big") { drawTrail(s, "255,230,120", 6); glow(s.x, s.y, 12, "255,230,120", 0.6); drawArrow(s, 1.8); }
    else if (s.kind === "arrow") { drawTrail(s, "255,240,200", 1.5); drawArrow(s, 1); }
    else { const L = s.kind === "big" ? 14 : 7; ctx.strokeStyle = s.kind === "big" ? "#ffe066" : "#f3eada"; ctx.lineWidth = s.kind === "big" ? 3 : 1.2;
      ctx.beginPath(); ctx.moveTo(s.x - Math.cos(s.a) * L, s.y - Math.sin(s.a) * L); ctx.lineTo(s.x, s.y); ctx.stroke(); }
  }
  for (const f of W0.fires) {
    if (f.c === "#ffe9a0") { const fy = f.y - f.t * 300; ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = "rgba(255,235,170,0.9)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(f.x - 3, fy - 14); ctx.lineTo(f.x, fy); ctx.stroke(); ctx.restore(); continue; }
    if (f.c) continue;
    ctx.strokeStyle = `rgba(255,120,40,${0.4 + 0.4 * Math.sin(time * 30)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    const my = f.y - f.t * 160, mx = f.x + f.t * 40; // 隕火從右上斜斜落下
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = "rgba(255,140,40,0.5)"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(mx + 10, my - 30); ctx.lineTo(mx, my); ctx.stroke(); ctx.restore();
    glow(mx, my, 9, "255,150,50", 0.9); ctx.fillStyle = "#fff0a0"; ctx.beginPath(); ctx.arc(mx, my, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  if (W0.spinT > 0) { // 旋風斬：兩圈刀光
    ctx.save(); ctx.globalCompositeOperation = "lighter"; const a0 = time * 25;
    for (let i = 0; i < 2; i++) { ctx.strokeStyle = i ? "rgba(255,255,255,0.9)" : "rgba(255,220,170,0.45)"; ctx.lineWidth = i ? 1.5 : 8; ctx.beginPath(); ctx.arc(p.x, p.y - 2, 34, a0, a0 + 2.6); ctx.stroke(); ctx.beginPath(); ctx.arc(p.x, p.y - 2, 34, a0 + Math.PI, a0 + Math.PI + 2.6); ctx.stroke(); }
    ctx.restore();
  }
  for (const t of W0.tornados) { // 旋風：五層由寬到窄＋捲起的葉子
    glow(t.x, t.y - 8, 16, "160,255,200", 0.25);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 5; i++) { ctx.strokeStyle = `rgba(190,255,220,${0.8 - i * 0.1})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(t.x + Math.sin(time * 8 + i) * 1.5, t.y - i * 4, 4 + i * 2.2, 1.5 + i * 0.6, 0, time * 12 + i, time * 12 + i + 4.5); ctx.stroke(); }
    ctx.restore();
    for (let i = 0; i < 3; i++) { const a = time * 9 + i * 2.1; ctx.fillStyle = "#6fd08a"; ctx.fillRect(t.x + Math.cos(a) * (6 + i * 3), t.y - 4 - i * 5 + Math.sin(a) * 2, 2, 1); }
  }
  for (const r of W0.rings) { // 衝擊波：光環＋地面的扁圈
    const q = r.t / r.max, c = r.c || "191,239,255";
    glow(r.x, r.y, r.r * q, c, 0.35 * (1 - q));
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = `rgba(${c},${1 - q})`; ctx.lineWidth = 4 * (1 - q) + 1; ctx.beginPath(); ctx.arc(r.x, r.y, r.r * q, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(r.x, r.y + 4, r.r * q * 1.1, r.r * q * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  for (const m of W0.mobs) if (!m.dead && m.slowT > 0) { ctx.fillStyle = "rgba(160,220,255,0.35)"; ctx.fillRect(m.x - 5, m.y - 2, 10, 3); }
  for (const s of W0.eshots) { ctx.fillStyle = s.c; ctx.fillRect(s.x - 2.5, s.y - 2.5, 5, 5); ctx.fillStyle = "#fff6c0"; ctx.fillRect(s.x - 1, s.y - 1, 2, 2); }
  drawFxOver();
  drawFx();
  drawWorldHud();
}
function drawWMob(m) {
  const d = WMOBS[m.type], img = d.img(), sc = m.hunter ? 1.7 : m.elite ? 1.4 : 1;
  if (m.wind > 0) drawTelegraph(m, d);
  ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.beginPath(); ctx.ellipse(m.x, m.y + d.r * 0.8, d.r * sc, d.r * 0.3 * sc, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  const wq = m.wind > 0 ? 1 - m.wind / m.windMax : 0, step = Math.sin(time * 12 + m.x) ; // 走路一跳一跳、蓄力時抖動
  ctx.translate(Math.round(m.x + (wq ? rand(-1, 1) * wq : 0)), Math.round(m.y - Math.abs(step) * (m.st === "chase" ? 1.2 : 0.5)));
  if (wq) ctx.scale(1 + wq * 0.15, 1 - wq * 0.12); else if (m.lunge > 0) ctx.scale(1.15, 0.9);
  if (m.x > W0.x) ctx.scale(-1, 1);
  if ((m.fuse > 0 || wq > 0.5) && Math.floor(time * 16) % 2) ctx.globalCompositeOperation = "lighter";
  ctx.drawImage(img, -img.width * sc / 2, -img.height * sc / 2, img.width * sc, img.height * sc);
  if (m.flash > 0) { ctx.globalCompositeOperation = "lighter"; ctx.drawImage(img, -img.width * sc / 2, -img.height * sc / 2, img.width * sc, img.height * sc); }
  ctx.restore();
  if (m.hunter) { ctx.strokeStyle = `rgba(255,70,50,${0.6 + 0.4 * Math.sin(time * 10)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(m.x, m.y + d.r * 0.8, d.r * 2, d.r * 0.6, 0, 0, Math.PI * 2); ctx.stroke(); }
  else if (m.elite) { ctx.strokeStyle = "rgba(111,184,255,0.7)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(m.x, m.y + d.r * 0.8, d.r * 1.6, d.r * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); }
  if (m.hp < m.max || m.elite) {
    const bw = m.elite ? 26 : 18;
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(m.x - bw / 2, m.y - d.r * sc - 7, bw, 3);
    ctx.fillStyle = m.elite ? "#6fb8ff" : "#ff6a3a"; ctx.fillRect(m.x - bw / 2, m.y - d.r * sc - 7, bw * Math.max(0, m.hp / m.max), 3);
  }
  if (!(m.elite || m.st === "chase" || dist(m, W0) < 60)) return; // 名字只顯示精英、追你的、附近的
  ctx.font = "bold 5px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
  const gap = m.lv - save.w.lv;
  ctx.fillStyle = m.elite ? "#6fb8ff" : gap >= 4 ? "#ff6b6b" : gap <= -5 ? "#a99bb8" : "#f3eada";
  ctx.fillStyle = m.hunter ? "#ff6b6b" : ctx.fillStyle;
  ctx.fillText(`${m.elite && !m.hunter ? "精英 " : ""}${d.n} Lv.${m.lv}`, m.x, m.y - d.r * sc - 9);
}
function drawWorldHud() {
  const p = W0, w = save.w;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // 小地圖（右上，在按鈕列下面）
  const mw = Math.min(104, W * 0.26), mh = mw * (TH / TW), mx0 = W - mw - 12, my0 = W <= 600 ? 112 : 66, sc = mw / (TW * TS);
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(mx0 - 2, my0 - 2, mw + 4, mh + 4);
  for (let j = 0; j < 14; j++) for (let i = 0; i < 20; i++) {
    const z = zoneAt((i + 0.5) / 20 * TW * TS, (j + 0.5) / 14 * TH * TS);
    ctx.fillStyle = ZONES[z].g[0]; ctx.fillRect(mx0 + i * mw / 20, my0 + j * mh / 14, mw / 20 + 0.5, mh / 14 + 0.5);
  }
  for (const wp of WAYPOINTS) { ctx.fillStyle = w.wp.includes(wp.id) ? "#9fe8ff" : "#555"; ctx.fillRect(mx0 + wp.x * sc - 1.5, my0 + wp.y * sc - 1.5, 3, 3); }
  ctx.fillStyle = "#ff4a2a"; ctx.fillRect(mx0 + ALTAR.x * sc - 2, my0 + ALTAR.y * sc - 2, 4, 4);
  const qt = questTarget();
  if (qt) { ctx.strokeStyle = "#ffe066"; ctx.lineWidth = 1; ctx.strokeRect(mx0 + qt.x * sc - 3, my0 + qt.y * sc - 3, 6, 6); }
  ctx.fillStyle = "#fff"; ctx.fillRect(mx0 + p.x * sc - 1.5, my0 + p.y * sc - 1.5, 3, 3);
  ctx.font = "bold 10px 'Noto Sans TC', sans-serif"; ctx.textAlign = "right"; ctx.fillStyle = "#cfc4dc";
  ctx.fillText(ZONES[W0.zone || "town"].n, mx0 + mw, my0 + mh + 13);
  // 左上：頭像、等級、生命、真氣
  const x0 = 10, y0 = 10;
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(x0, y0, 40, 40);
  ctx.strokeStyle = "#ffcf6b"; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, 40, 40);
  ctx.imageSmoothingEnabled = false; ctx.drawImage(HERO, 0, 0, 12, 10, x0 + 4, y0 + 6, 32, 27);
  ctx.fillStyle = "#1b1424"; ctx.fillRect(x0, y0 + 32, 40, 10);
  ctx.textAlign = "center"; ctx.font = "bold 9px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#ffe066"; ctx.fillText(`Lv.${w.lv}`, x0 + 20, y0 + 40);
  const bx = x0 + 46, bw = Math.min(130, W * 0.3);
  const bar = (y, f, c, label) => {
    ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(bx - 2, y - 2, bw + 4, 13);
    ctx.fillStyle = c; ctx.fillRect(bx, y, bw * clamp(f, 0, 1), 9);
    ctx.fillStyle = "#fff"; ctx.font = "bold 9px 'Noto Sans TC', sans-serif"; ctx.textAlign = "left"; ctx.fillText(label, bx + 3, y + 8);
  };
  ctx.font = "bold 11px 'Noto Sans TC', sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#fff";
  ctx.fillText(`${REALMS[realmIdx()].n}期修士　戰力 ${totalCP()}`, bx, y0 + 8);
  bar(y0 + 14, p.hp / p.maxHp, p.hp / p.maxHp < 0.3 ? "#ff5a4a" : "#d83a3a", `${Math.ceil(p.hp)}/${p.maxHp}`);
  bar(y0 + 29, p.mp / B.maxMp, "#3a7ad8", `${Math.floor(p.mp)}/${B.maxMp}`);
  // 任務欄
  const q = curQuest();
  if (q) {
    const qy = y0 + 50, qw = Math.min(190, W * 0.46);
    ctx.fillStyle = "rgba(10,8,18,0.7)"; ctx.fillRect(x0, qy, qw, 38);
    ctx.fillStyle = "#ffcf6b"; ctx.fillRect(x0, qy, 3, 38);
    ctx.font = "bold 10px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#ffcf6b"; ctx.fillText(q.main ? "主線" : "懸賞", x0 + 8, qy + 12);
    ctx.fillStyle = "#fff"; ctx.fillText(q.t, x0 + 34, qy + 12);
    const f = clamp(questProg() / q.n, 0, 1);
    ctx.fillStyle = "#2a2238"; ctx.fillRect(x0 + 8, qy + 20, qw - 16, 6);
    ctx.fillStyle = "#b07dff"; ctx.fillRect(x0 + 8, qy + 20, (qw - 16) * f, 6);
    ctx.font = "9px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#cfc4dc"; ctx.fillText(`${Math.min(questProg(), q.n)} / ${q.n}`, x0 + 8, qy + 35);
  }
  const rn = riskyItems().length;
  if (rn) {
    const ry = y0 + (q ? 94 : 50);
    ctx.fillStyle = "rgba(60,20,10,0.75)"; ctx.fillRect(x0, ry, Math.min(190, W * 0.46), 18);
    ctx.font = "bold 10px 'Noto Sans TC', sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#ffb070";
    ctx.fillText(`⚠ 未帶回 ${rn} 件（死了會掉）`, x0 + 6, ry + 12.5);
  }
  if (W0.recall > 0) {
    const rw = 140, rx = W / 2 - rw / 2, ry = H * 0.62;
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(rx - 2, ry - 2, rw + 4, 12);
    ctx.fillStyle = "#9fe8ff"; ctx.fillRect(rx, ry, rw * (1 - W0.recall / 3), 8);
    ctx.textAlign = "center"; ctx.font = "bold 11px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#fff"; ctx.fillText("回城中…", W / 2, ry - 6);
  }
  // 經驗條（最下面一整條）
  const ef = w.exp / expNext(w.lv);
  ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0, H - 6, W, 6);
  ctx.fillStyle = "#e0c040"; ctx.fillRect(0, H - 5, W * ef, 4);
  ctx.textAlign = "center"; ctx.font = "bold 9px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#ffe9a0";
  ctx.fillText(`經驗 ${Math.floor(ef * 100)}%　丹藥 ${w.potions}　靈石 ${save.stone}`, W / 2, H - 10);
  // 地區名稱
  if (W0.bannerT > 0) {
    const z = ZONES[W0.zone];
    ctx.globalAlpha = Math.min(1, W0.bannerT * 2);
    ctx.textAlign = "center"; ctx.font = "900 22px 'Noto Sans TC', sans-serif";
    ctx.fillStyle = "#1b1424"; ctx.fillText(z.n, W / 2 + 2, H * 0.3 + 2); ctx.fillStyle = "#ffe0b0"; ctx.fillText(z.n, W / 2, H * 0.3);
    ctx.font = "bold 13px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#cfc4dc";
    ctx.fillText(W0.zone === "town" ? "安全區・補滿丹藥、帶回裝備" : `妖獸 Lv.${z.lv[0]}–${z.lv[1]}`, W / 2, H * 0.3 + 22);
    ctx.globalAlpha = 1;
  }
  if (time < 6 && w.lv === 1 && w.exp === 0) {
    ctx.textAlign = "center"; ctx.font = "bold 13px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#fff";
    ctx.fillText("左邊拖曳移動，右下按鈕出招（電腦：WASD＋J／K／U／空白／H）", W / 2, H * 0.62);
    ctx.fillText("照左上角的任務走，越北邊的妖獸越強", W / 2, H * 0.62 + 20);
  }
  // 搖桿
  if (stick.id === null && TOUCH) {
    ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(80, H - 90, 50, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.beginPath(); ctx.arc(80, H - 90, 22, 0, Math.PI * 2); ctx.fill();
  }
  if (stick.id !== null) {
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(stick.ox, stick.oy, 50, 0, Math.PI * 2); ctx.stroke();
    const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = Math.hypot(dx, dy), kk = d > 50 ? 50 / d : 1;
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.arc(stick.ox + dx * kk, stick.oy + dy * kk, 22, 0, Math.PI * 2); ctx.fill();
  }
  // 按鈕冷卻
  for (const k of ["spin", "ult", "roll", "potion"]) {
    const el = pad.querySelector(`[data-act="${k}"] .cd`);
    if (el) el.style.transform = `scaleY(${p.cds[k] / (WSKILL[k].cd * (k === "roll" ? B.rollCd : 1))})`;
    const btn = pad.querySelector(`[data-act="${k}"]`);
    if (btn) btn.style.opacity = p.mp < WSKILL[k].mp ? 0.45 : 1;
  }
  const cnt = pad.querySelector(".count"); if (cnt) cnt.textContent = w.potions;
  if (flashT > 0) { ctx.fillStyle = `rgba(${flashColor},${Math.min(0.5, flashT * 2.5)})`; ctx.fillRect(0, 0, W, H); }
}

const TOUCH = window.matchMedia("(pointer: coarse)").matches;

// ───────── 任務：主線一路帶到世界王，做完之後是無限懸賞 ─────────
const QUESTS = [
  { t: "出城往北，斬妖 8 隻", k: "kill", z: "grass", n: 8, item: 1, wt: "staff" },
  { t: "找到靈草原傳送陣", k: "wp", id: "grass", n: 1, item: 1, wt: "bow" },
  { t: "升到 Lv.5（右上角配點）", k: "lv", n: 5, item: 1 },
  { t: "斬殺一隻精英妖獸", k: "elite", n: 1, item: 1 },
  { t: "幽暗森林斬妖 15 隻", k: "kill", z: "forest", n: 15 },
  { t: "找到幽暗森林傳送陣", k: "wp", id: "forest", n: 1 },
  { t: "升到 Lv.11", k: "lv", n: 11, item: 1 },
  { t: "亂石荒原斬妖 20 隻", k: "kill", z: "waste", n: 20 },
  { t: "找到亂石荒原傳送陣", k: "wp", id: "waste", n: 1 },
  { t: "升到 Lv.16", k: "lv", n: 16, item: 1 },
  { t: "焚天火山斬妖 20 隻", k: "kill", z: "volcano", n: 20 },
  { t: "找到焚天火山傳送陣", k: "wp", id: "volcano", n: 1 },
  { t: "火山北邊祭壇：打倒焚天石魔", k: "boss", n: 1, item: 2 },
];
function curQuest() {
  const w = save.w;
  if (!w) return null;
  w.q = w.q || 0; w.qp = w.qp || 0;
  if (w.q < QUESTS.length) return { ...QUESTS[w.q], main: true };
  // 懸賞：在適合自己等級的地區斬妖
  const z = ["volcano", "waste", "forest", "grass"].find((k) => w.lv >= ZONES[k].lv[0]) || "grass";
  if (!w.bounty) w.bounty = { z, n: 25 };
  return { t: `${ZONES[w.bounty.z].n}斬妖 ${w.bounty.n} 隻`, k: "kill", z: w.bounty.z, n: w.bounty.n, main: false };
}
function questProg() {
  const q = curQuest(), w = save.w;
  if (!q) return 0;
  if (q.k === "lv") return w.lv;
  if (q.k === "wp") return w.wp.includes(q.id) ? 1 : 0;
  return w.qp;
}
function questEvent(k, z) {
  const q = curQuest();
  if (!q) return;
  if (q.k === k && (!q.z || q.z === z)) save.w.qp++;
  else if (k === "elite" && q.k === "kill" && q.z === z) save.w.qp++; // 精英也算一隻
}
function questTarget() { // 小地圖上標任務地點
  const q = curQuest();
  if (!q) return null;
  if (q.k === "wp") return WAYPOINTS.find((p) => p.id === q.id);
  if (q.k === "boss") return ALTAR;
  if (q.z) return WAYPOINTS.find((p) => p.id === q.z);
  return null;
}
function checkQuest() {
  const q = curQuest(), w = save.w;
  if (!q || questProg() < q.n) return;
  const exp = Math.round(expNext(w.lv) * (q.main ? 0.35 : 0.5)), st = 10 + w.lv * 2;
  w.q < QUESTS.length ? w.q++ : (w.bounty = null);
  w.qp = 0;
  save.stone += st;
  floatText(W0.x, W0.y - 46, `任務完成！靈石 +${st}`, "#ffe066", true);
  sfx("win");
  if (q.item !== undefined || !q.main) { const it = rollItem(q.item || 0, Math.floor(w.lv / 3) + 1, q.wt || null); if (q.wt && it.q === 3) { it.q = 1; it.u = null; it.wt = q.wt; nameItem(it); } grantLoot(it, W0.x, W0.y - 6); if (q.wt) floatText(W0.x, W0.y - 60, `得到${WEAPONS[q.wt].n}！到背包換上就能用${WEAPONS[q.wt].job}的招式`, "#ffcf6b", true); }
  if (!q.main && Math.random() < 0.5) { const g = randGem(1); addGem(g); floatText(W0.x, W0.y - 74, `◆ ${gemName(g)}`, GEMS[g.split(":")[0]].c, true); }
  gainExp(exp);
}

// 獵寶妖：在野外身上帶著 2 件以上沒帶回的裝備，每隔一陣子就派一隻來追（越深越強）
function spawnHunter(dt) {
  const z = W0.zone, n = riskyItems().length;
  if (z === "town" || n < 2) { W0.huntT = Math.max(W0.huntT || 0, 40); return; }
  W0.huntT = (W0.huntT || 60) - dt * (1 + n * 0.15);
  if (W0.huntT > 0 || W0.mobs.some((m) => m.hunter && !m.dead)) return;
  W0.huntT = rand(70, 100);
  for (let i = 0; i < 20; i++) {
    const a = rand(0, Math.PI * 2), x = W0.x + Math.cos(a) * 190, y = W0.y + Math.sin(a) * 190;
    if (blockedCircle(x, y, 8) || zoneAt(x, y) === "town") continue;
    const lv = ZONES[z].lv[1] + 2, hp = WMOBS.hunter.hp * (1 + 0.3 * (lv - 1)) * 3;
    W0.mobs.push({ type: "hunter", hunter: true, lv, elite: true, camp: { x, y, z, lv, respawn: [] }, x, y, hp, max: hp, st: "chase", wt: 0, wx: x, wy: y, atkT: 0, flash: 0, kb: 0, ka: 0, fuse: 0 });
    floatText(W0.x, W0.y - 50, "⚠ 獵寶妖盯上你的寶物了！快撤離或打倒牠", "#ff6b6b", true);
    sfx("roar"); shake = Math.max(shake, 6);
    return;
  }
}
// 傳說武器的專屬大招
function uniqueUlt(u, near) {
  const p = W0;
  shake = Math.max(shake, 7); sfx("crit"); flashT = 0.08; flashColor = "255,230,180";
  if (u === "thunder") {
    W0.mobs.filter((m) => !m.dead && dist(m, p) < 160).sort((a, b) => dist(a, p) - dist(b, p)).slice(0, 6)
      .forEach((m) => { bolts.push({ x: m.x, y: m.y, life: 0.3 }); hitMob(m, wDmg(34), 40, p, true); });
  } else if (u === "phoenix") {
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; W0.pshots.push({ x: p.x, y: p.y - 3, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, a, life: 0.6, dmg: 24, kind: "fireball", pierce: true, kb: 60, hit: new Set() }); }
  } else if (u === "sunbow") {
    const t = near(200) || { x: p.x + Math.cos(p.face) * 70, y: p.y + Math.sin(p.face) * 70 };
    for (let i = 0; i < 12; i++) W0.fires.push({ x: t.x + rand(-40, 40), y: t.y + rand(-30, 30), t: 0.1 + i * 0.06, r: 14, dmg: 16, c: "#ffe9a0" });
  } else if (u === "moon") {
    for (const m of W0.mobs) if (!m.dead && dist(m, p) < 80) hitMob(m, wDmg(48), 120, p, true);
    W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.4, r: 80, c: "255,240,200" });
  } else if (u === "tiger") {
    const t = near(45);
    if (t) for (let i = 0; i < 10; i++) setTimeout(() => { if (state === "world" && !t.dead) hitMob(t, wDmg(9), 10, p, i % 3 > 0); }, i * 45);
  } else if (u === "qiankun") {
    for (const m of W0.mobs) if (!m.dead && dist(m, p) < 120) { const a = angTo(m, p), d = dist(m, p) - 14; moveBody(m, Math.cos(a) * d, Math.sin(a) * d, WMOBS[m.type].r); }
    setTimeout(() => { if (state !== "world") return; for (const m of W0.mobs) if (!m.dead && dist(m, W0) < 45) hitMob(m, wDmg(32), 150, W0, true); W0.rings.push({ x: W0.x, y: W0.y, t: 0, max: 0.35, r: 45, c: "200,160,255" }); }, 250);
  }
  burst(p.x, p.y, "#ffe066", 20, 100, 0.5);
}
// 一鍵換武器：換成背包裡下一種武器（同種挑最強的），戰鬥中也能換
function quickSwap() {
  const order = WT_KEYS, cur = curWeapon();
  for (let i = 1; i < order.length; i++) {
    const t = order[(order.indexOf(cur) + i) % order.length];
    const best = save.bag.filter((b) => wtOf(b) === t).sort((a, b) => itemCP(b) - itemCP(a))[0];
    if (best) {
      equipItem(best); writeSave();
      B = worldStats(); W0.maxHp = B.maxHp; W0.hp = Math.min(W0.hp, B.maxHp);
      setPadLabels(true);
      floatText(W0.x, W0.y - 26, `換成${best.name}（${WEAPONS[t].job}）`, "#ffcf6b", true); sfx("arrive");
      burst(W0.x, W0.y, "#ffcf6b", 14, 60);
      return;
    }
  }
  floatText(W0.x, W0.y - 26, "背包裡沒有別種武器", "#cfc4dc");
}
// ───────── 右上角按鈕：背包、角色、傳送 ─────────
const hudEl = document.getElementById("hud");
function updateWorldButtons() {
  const on = state === "world";
  hudEl.classList.toggle("hidden", !on);
  if (!on || !save.w) return;
  hudEl.querySelector('[data-h="bag"]').classList.toggle("dot", save.bag.some((b) => sameWt(b) && itemCP(b) > itemCP(save.eq[b.slot])));
  hudEl.querySelector('[data-h="ap"]').classList.toggle("dot", save.w.free > 0);
}
const riskyItems = () => save.bag.filter((b) => b.risk).concat(SLOT_KEYS.map((k) => save.eq[k]).filter((b) => b && b.risk));
function bankLoot(why) { // 撤離成功：未帶回的裝備變成永久的
  const r = riskyItems();
  if (!r.length) return;
  r.forEach((b) => delete b.risk); writeSave();
  floatText(W0.x, W0.y - 40, `${why}：${r.length} 件裝備安全帶回！`, "#7dff8a", true); sfx("win");
}
function openTeleport() {
  const atWp = W0.zone === "town" || WAYPOINTS.some((wp) => save.w.wp.includes(wp.id) && dist(wp, W0) < 40);
  if (!atWp) {
    if (W0.recall > 0) return;
    W0.recall = 3; floatText(W0.x, W0.y - 26, "回城符：原地不動 3 秒", "#9fe8ff", true); return;
  }
  pausedFrom = "world"; state = "pick";
  keys.clear(); stick.id = null; pad.classList.add("hidden");
  const w = save.w;
  const btns = WAYPOINTS.filter((wp) => w.wp.includes(wp.id)).map((wp) => `<button class="big alt tp" data-wp="${wp.id}">${wp.n}<small>${wp.id === "town" ? "安全區" : `Lv.${ZONES[wp.id].lv.join("–")}`}</small></button>`).join("");
  screenEl.innerHTML = `<div class="panel"><h1 class="pick-title">傳送</h1>
    <div class="result">傳送會把還沒帶回的裝備一起帶回<br><small>走到各地區的傳送陣就會解鎖；在野外按傳送會用回城符（原地不動 3 秒）</small></div><div class="btns">${btns}<button id="close" class="big">取消</button></div></div>`;
  screenEl.classList.remove("hidden");
  document.getElementById("close").onclick = worldReturn;
  screenEl.querySelectorAll(".tp").forEach((b) => b.addEventListener("click", () => {
    const wp = WAYPOINTS.find((x) => x.id === b.dataset.wp);
    W0.x = wp.x; W0.y = wp.y + 22; W0.npcCool = "wp-" + wp.id; cam.x = W0.x; cam.y = W0.y;
    burst(W0.x, W0.y, "#9fe8ff", 30, 100); sfx("arrive");
    worldReturn(); bankLoot("傳送陣");
  }));
}
hudEl.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
  if (state !== "world") return;
  sfx("click");
  if (b.dataset.h === "bag") { pausedFrom = "world"; state = "pick"; pad.classList.add("hidden"); eqSel = null; renderEquip(); }
  else if (b.dataset.h === "ap") { pausedFrom = "world"; state = "pick"; pad.classList.add("hidden"); renderAP(); }
  else if (b.dataset.h === "swap") quickSwap();
  else openTeleport();
}));
