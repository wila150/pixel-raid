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
  golem: { n: "石甲妖", img: () => GOLEM, hp: 140, spd: 22, dmg: 13, r: 8, exp: 14, ai: "melee", armor: 0.3 },
  bomber: { n: "爆石靈", img: () => BOMBER, hp: 32, spd: 58, dmg: 26, r: 6, exp: 10, ai: "bomber" },
  crow: { n: "火鴉", img: () => CROW, hp: 55, spd: 72, dmg: 9, r: 6, exp: 14, ai: "ranged", range: 115, shot: 120 },
  lava: { n: "熔岩獸", img: () => LAVA, hp: 230, spd: 30, dmg: 18, r: 9, exp: 26, ai: "melee", armor: 0.3 },
};

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
const PAD_LABELS = { attack: ["劍擊", "J"], spin: ["劍氣斬", "K"], roll: ["閃身", "空白"], ult: ["掌心雷", "U"], potion: ["丹藥", "H"] };
const padOrig = {};
pad.querySelectorAll(".btn").forEach((b) => { padOrig[b.dataset.act] = b.innerHTML; });
function setPadLabels(world) {
  pad.querySelectorAll(".btn").forEach((b) => {
    if (!world) { b.innerHTML = padOrig[b.dataset.act]; return; }
    const [n, k] = PAD_LABELS[b.dataset.act];
    b.innerHTML = `${n}<small>${k}</small>${b.dataset.act === "potion" ? '<b class="count">3</b>' : ""}${b.dataset.act !== "attack" ? '<i class="cd"></i>' : ""}`;
  });
}
const WSKILL = { attack: { cd: 0.3, mp: 0 }, spin: { cd: 0.7, mp: 10 }, ult: { cd: 2.5, mp: 22 }, roll: { cd: 1.1, mp: 0 }, potion: { cd: 1, mp: 0 } };

function enterWorld() {
  if (!wmap) buildWorld();
  if (!save.w) save.w = blankW();
  mode = "normal";
  inWorld = true;
  B = worldStats();
  run = { x: 0, y: 0, swords: 0, perks: {}, shield: 0, rows: [], fromWorld: true };
  const w = save.w;
  if (blockedCircle(w.x, w.y, 5)) { w.x = 1200; w.y = 1530; }
  if (!W0) {
    W0 = { camps: [], mobs: [], pshots: [], eshots: [], drops: [], npcCool: null, zone: "", bannerT: 0, saveT: 5, combatT: 0, lastAggro: 0 };
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
  last = performance.now();
}
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
const wDmg = (base) => base * B.atk * (B.zen ? 1 + Math.floor(W0.combatT / 10) * 0.05 : 1);
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
  if (B.leech > 0) W0.regenAcc += dmg * B.leech;
  W0.mp = Math.min(B.maxMp, W0.mp + (quiet ? 0 : 1));
  floatText(m.x, m.y - 10, crit ? `${dmg}!` : `${dmg}`, crit ? "#ffd84a" : "#ffffff", crit);
  if (!quiet) { sfx(crit ? "crit" : "hit"); hitstop = Math.max(hitstop, crit ? 0.05 : 0.025); }
  burst(m.x, m.y, crit ? "#ffd84a" : "#ffb070", crit ? 10 : 5, 60);
  if (m.hp <= 0) killMob(m);
}
function killMob(m) {
  m.dead = true;
  const d = WMOBS[m.type], w = save.w;
  burst(m.x, m.y, m.elite ? "#6fb8ff" : "#b07dff", m.elite ? 30 : 12, 90);
  // 經驗：打比自己弱很多的怪，經驗變少
  let exp = d.exp * (1 + 0.3 * (m.lv - 1)) * (m.elite ? 3 : 1);
  if (m.lv < w.lv - 5) exp *= 0.3;
  exp = Math.max(1, Math.round(exp));
  gainExp(exp);
  save.xiuwei += Math.max(1, Math.round(exp / 6));
  // 掉寶
  const il = Math.max(0, Math.floor(m.lv / 3) + Math.floor(Math.random() * 2) - 1);
  if (Math.random() < (m.elite ? 0.6 : 0.045)) wDrop({ kind: "item", it: rollItem(m.elite ? 1 : 0, il) }, m);
  if (Math.random() < (m.elite ? 0.8 : 0.15)) wDrop({ kind: "stone", v: 1 + Math.floor(m.lv / 3) + (m.elite ? 4 : 0) }, m);
  if (Math.random() < 0.03) wDrop({ kind: "potion" }, m);
  if (m.elite && Math.random() < 0.15) wDrop({ kind: "key", k: makeKey(Math.max(1, Math.ceil(m.lv / 4))) }, m);
  m.camp.respawn.push(22 + Math.random() * 10);
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
  w.exp -= lose; w.x = 1200; w.y = 1530; writeSave();
  pad.classList.add("hidden");
  screenEl.innerHTML = `<div class="panel"><h1>你倒下了…</h1>
    <div class="result">損失經驗 ${lose}<br>撿到的裝備都還在。回城換裝、配點，或先在比較簡單的地區練等。</div>
    <div class="btns"><button id="revive" class="big">在青雲城復活</button><button id="home" class="big alt">回主畫面</button></div></div>`;
  screenEl.classList.remove("hidden");
  document.getElementById("revive").onclick = () => { W0.x = 1200; W0.y = 1530; enterWorld(); };
  document.getElementById("home").onclick = renderTitle;
}

// ───────── 每幀更新 ─────────
function updateWorld(dt) {
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
    if (Math.random() < 0.6) particles.push({ x: p.x, y: p.y + 5, vx: 0, vy: -10, life: 0.3, max: 0.3, color: "#8fa7ff", size: 2 });
  } else {
    const spd = 85 * B.spdMul * (p.swing > 0 ? 0.6 : 1);
    moveBody(p, mx * spd * dt, my * spd * dt, 5);
  }
  // 熔岩會燙
  if (tileAt(p.x, p.y) === 3) { p.lavaT -= dt; if (p.lavaT <= 0) { p.lavaT = 0.5; p.iframe = 0; hurtW(4 + w.lv * 0.6); } }

  const near = (max) => { let best = null, bd = max; for (const m of W0.mobs) { if (m.dead) continue; const d = dist(m, p); if (d < bd) { bd = d; best = m; } } return best; };
  const useSkill = (k) => { if (p.cds[k] > 0 || p.mp < WSKILL[k].mp || p.roll > 0) return false; p.cds[k] = WSKILL[k].cd * (k === "roll" ? B.rollCd : 1); p.mp -= WSKILL[k].mp; return true; };
  // 劍擊：前方扇形，自動轉向最近的怪
  if ((act("attack", "j", "z") || (keys.has("j") && p.cds.attack <= 0)) && useSkill("attack")) {
    const t = near(50); if (t) p.face = angTo(p, t);
    p.swing = 0.18; sfx("dash");
    for (const m of W0.mobs) {
      if (m.dead) continue;
      const d = dist(m, p), diff = Math.abs(((angTo(p, m) - p.face + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (d < 30 + WMOBS[m.type].r && diff < 1.1) hitMob(m, wDmg(10), 80, p);
    }
  }
  // 劍氣斬：三道穿透劍氣
  if (act("spin", "k", "x") && useSkill("spin")) {
    const t = near(160); if (t) p.face = angTo(p, t);
    for (let i = -1; i <= 1; i++) { const a = p.face + i * 0.22; W0.pshots.push({ x: p.x, y: p.y - 3, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230, a, life: 0.6, hit: new Set() }); }
    sfx("volley");
  }
  // 掌心雷：劈最近的怪和牠旁邊的
  if (act("ult", "u", "i") && p.cds.ult <= 0 && p.mp >= WSKILL.ult.mp) {
    const t = near(150);
    if (t && useSkill("ult")) {
      bolts.push({ x: t.x, y: t.y, life: 0.3 });
      for (const m of W0.mobs) if (!m.dead && dist(m, t) < 38) hitMob(m, wDmg(26), 40, t, true);
      sfx("crit"); shake = Math.max(shake, 6); flashT = 0.08; flashColor = "200,220,255";
      burst(t.x, t.y, "#cfe0ff", 26, 120, 0.6);
    } else if (!t) floatText(p.x, p.y - 20, "附近沒有目標", "#cfc4dc");
  }
  if (act("roll", " ", "l", "shift") && useSkill("roll")) { p.roll = 0.22; p.rollDir = ml > 0.1 ? Math.atan2(my, mx) : p.face; p.iframe = Math.max(p.iframe, 0.3); sfx("dash"); }
  if (act("potion", "h", "c") && w.potions > 0 && p.hp < p.maxHp && useSkill("potion")) {
    w.potions--; const heal = Math.min(Math.round(p.maxHp * 0.4 * B.potionMul), p.maxHp - p.hp); p.hp += heal;
    floatText(p.x, p.y - 16, `+${heal}`, "#7dff8a"); burst(p.x, p.y, "#7dff8a", 12, 40); sfx("heal"); writeSave();
  }

  // 劍氣飛行
  for (const s of W0.pshots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (solid(s.x, s.y)) s.life = 0;
    for (const m of W0.mobs) if (!m.dead && !s.hit.has(m) && Math.hypot(m.x - s.x, m.y - s.y) < WMOBS[m.type].r + 4) { s.hit.add(m); hitMob(m, wDmg(14), 50, p, true); }
  }
  W0.pshots = W0.pshots.filter((s) => s.life > 0);

  // 怪物：只更新玩家附近的
  let aggro = false;
  const inTown = zoneAt(p.x, p.y) === "town";
  for (const m of W0.mobs) {
    if (m.dead || Math.abs(m.x - p.x) > 420 || Math.abs(m.y - p.y) > 420) continue;
    const d = WMOBS[m.type], dp = dist(m, p), spd = d.spd * B.slow * (m.elite ? 1.1 : 1);
    m.flash = Math.max(0, m.flash - dt); m.atkT -= dt;
    if (m.kb > 0) { moveBody(m, Math.cos(m.ka) * m.kb * dt * 3, Math.sin(m.ka) * m.kb * dt * 3, d.r); m.kb = Math.max(0, m.kb - dt * 400); continue; }
    const homeD = Math.hypot(m.x - m.camp.x, m.y - m.camp.y);
    if (m.st === "idle") {
      if (dp < 75 && !inTown) m.st = "chase";
      m.wt -= dt;
      if (m.wt <= 0) { m.wt = rand(1.5, 4); m.wx = m.camp.x + rand(-50, 50); m.wy = m.camp.y + rand(-50, 50); }
      const a = Math.atan2(m.wy - m.y, m.wx - m.x);
      if (Math.hypot(m.wx - m.x, m.wy - m.y) > 4) moveBody(m, Math.cos(a) * spd * 0.35 * dt, Math.sin(a) * spd * 0.35 * dt, d.r);
    } else if (m.st === "home") { // 追太遠就回營地、回滿血
      const a = Math.atan2(m.camp.y - m.y, m.camp.x - m.x);
      moveBody(m, Math.cos(a) * spd * 1.2 * dt, Math.sin(a) * spd * 1.2 * dt, d.r);
      m.hp = Math.min(m.max, m.hp + m.max * 0.3 * dt);
      if (homeD < 20) m.st = "idle";
    } else {
      aggro = true;
      if (homeD > 280 || inTown) { m.st = "home"; continue; }
      const a = angTo(m, p);
      if (d.ai === "ranged") {
        const want = d.range * 0.75;
        const dir = dp > want + 10 ? 1 : dp < want - 15 ? -0.7 : 0;
        moveBody(m, Math.cos(a) * spd * dir * dt, Math.sin(a) * spd * dir * dt, d.r);
        if (dp < d.range && m.atkT <= 0) {
          m.atkT = 1.8;
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
        if (dp > d.r + 4) moveBody(m, Math.cos(a) * spd * dt, Math.sin(a) * spd * dt, d.r);
        if (dp < d.r + 7 && m.atkT <= 0) { m.atkT = 1.0; hurtW(d.dmg * (1 + 0.15 * (m.lv - 1)) * (m.elite ? 1.5 : 1), m); }
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
    if (o.kind !== "item" && o.kind !== "key" && d < mag) { const a = angTo(o, p); o.x += Math.cos(a) * 180 * dt; o.y += Math.sin(a) * 180 * dt; }
    if (d < 10) {
      o.got = true;
      if (o.kind === "item") grantLoot(o.it, p.x, p.y - 6);
      else if (o.kind === "stone") { save.stone += o.v; floatText(p.x, p.y - 16, `靈石 +${o.v}`, "#9fe8ff"); sfx("good"); }
      else if (o.kind === "potion") { w.potions = Math.min(B.potMax, w.potions + 1); floatText(p.x, p.y - 16, "丹藥 +1", "#7dff8a"); sfx("heal"); }
      else if (o.kind === "key") { addKey(o.k); floatText(p.x, p.y - 16, `秘境鑰 第 ${o.k.tier} 層`, "#9fe8ff", true); sfx("arrive"); }
      writeSave();
    }
  }
  W0.drops = W0.drops.filter((o) => !o.got && o.t < 120);

  // 地區切換提示、傳送陣解鎖
  const z = zoneAt(p.x, p.y);
  if (z !== W0.zone) { W0.zone = z; W0.bannerT = 2.5; if (z === "town") { w.potions = Math.max(w.potions, B.potMax); } }
  W0.bannerT = Math.max(0, W0.bannerT - dt);
  for (const wp of WAYPOINTS) if (!w.wp.includes(wp.id) && dist(wp, p) < 40) { w.wp.push(wp.id); floatText(p.x, p.y - 30, `解鎖傳送陣：${wp.n}`, "#9fe8ff", true); sfx("arrive"); writeSave(); }

  // NPC、傳送陣、祭壇：走過去自動打開
  const spots = worldSpots();
  const hitSpot = spots.find((s) => dist(s, p) < (s.r || 16));
  if (!hitSpot) W0.npcCool = null;
  else if (W0.npcCool !== hitSpot.id) { W0.npcCool = hitSpot.id; openSpot(hitSpot); return; }

  W0.saveT -= dt;
  if (W0.saveT <= 0) { W0.saveT = 5; w.x = Math.round(p.x); w.y = Math.round(p.y); writeSave(); }
}

// ───────── NPC 與選單 ─────────
const NPCS = [
  { id: "smith", n: "煉器師", x: 1138, y: 1480, pal: { W: "#c98a4a", w: "#8a5a2a", B: "#5a3a1a" }, d: "換裝備、出售、洗練、點金" },
  { id: "alch", n: "丹師", x: 1262, y: 1480, pal: { W: "#7fd88a", w: "#4a9a5a", B: "#2a6a3a" }, d: "回滿生命真氣、補滿丹藥" },
  { id: "rift", n: "秘境使者", x: 1138, y: 1566, pal: { W: "#a96be0", w: "#7a3fb8", B: "#4a2a7a" }, d: "用秘境鑰進秘境刷寶" },
  { id: "elder", n: "長老", x: 1262, y: 1566, pal: { W: "#eef2fa", w: "#c9c2d8", B: "#ffcf6b" }, d: "配能力點、換流派" },
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
  if (s.id === "smith") { worldReturnTo(); eqSel = null; renderEquip(); return; }
  if (s.id === "rift") { worldReturnTo(); keySel = null; renderMaps(); return; }
  if (s.id === "alch") {
    W0.hp = W0.maxHp; W0.mp = B.maxMp; w.potions = Math.max(w.potions, B.potMax); writeSave();
    body = `生命、真氣都回滿了，丹藥補到 ${w.potions} 顆。`;
  } else if (s.id === "elder") { renderAP(); return; }
  else if (s.kind === "wp") {
    body = "要傳送到哪裡？";
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
  screenEl.innerHTML = `<div class="panel wide equip"><h1 class="pick-title">長老</h1>
    <div class="cpline">Lv.${w.lv}　能力點 <b>${w.free}</b>　戰力 <b>${totalCP()}</b></div>
    <div class="cards">${Object.keys(AP).map((k) => `<button class="card ap" data-k="${k}" ${w.free ? "" : "disabled"}><b>${AP[k].n} ${w.ap[k]}</b><span class="desc">每點 ${AP[k].d}</span><i>＋1</i></button>`).join("")}</div>
    <div class="cpline small">生命 ${B.maxHp}　攻擊 ×${B.atk.toFixed(2)}　真氣 ${B.maxMp}　爆擊 ${Math.round(B.crit * 100)}%</div>
    <div class="btns"><button id="apReset" class="big alt">重新配點（−${20 * w.lv} 靈石）</button><button id="school" class="big alt">換流派（${SCHOOLS[save.school].n}）</button><button id="close" class="big">離開</button></div></div>`;
  screenEl.classList.remove("hidden");
  screenEl.querySelectorAll(".ap").forEach((b) => b.addEventListener("click", () => { if (!w.free) return; w.free--; w.ap[b.dataset.k]++; writeSave(); sfx("good"); renderAP(); }));
  document.getElementById("apReset").onclick = () => {
    const c = 20 * w.lv; if (save.stone < c) { sfx("bad"); return; }
    save.stone -= c; for (const k in w.ap) { w.free += w.ap[k]; w.ap[k] = 0; } writeSave(); renderAP();
  };
  document.getElementById("school").onclick = renderSchools;
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
    if (t === 0 && v < 0.2 && z !== "town") { ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fillRect(x + v * 60, y + 5, 2, 3); }
    if (t === 3) { ctx.fillStyle = `rgba(255,${100 + Math.sin(time * 3 + tx) * 40},30,0.85)`; ctx.fillRect(x, y, TS, TS); ctx.fillStyle = "rgba(255,230,120,0.5)"; ctx.fillRect(x + v * 10, y + 4, 3, 2); }
    else if (t === 4) { ctx.fillStyle = "#2a4a7a"; ctx.fillRect(x, y, TS, TS); ctx.fillStyle = "rgba(160,200,255,0.3)"; ctx.fillRect(x + ((time * 6 + v * 16) % 14), y + 6, 3, 1); }
    else if (t === 5) { ctx.fillStyle = "#6d6390"; ctx.fillRect(x, y, TS, TS); ctx.fillStyle = "#8a83a6"; ctx.fillRect(x, y, TS, 4); }
    else if (t === 6) { ctx.fillStyle = "#5a3a3a"; ctx.fillRect(x, y + 4, TS, 12); ctx.fillStyle = "#8a3a2a"; ctx.fillRect(x - 1, y, TS + 2, 6); }
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
      const x = o.tx * TS, y = o.ty * TS, z = zoneAt(x, y);
      ctx.fillStyle = "#3a2a1a"; ctx.fillRect(x + 6, y + 8, 4, 8);
      ctx.fillStyle = z === "forest" ? "#1f5a32" : "#2f7a3a"; ctx.beginPath(); ctx.arc(x + 8, y + 4, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = z === "forest" ? "#2a6e3e" : "#3f9a4a"; ctx.beginPath(); ctx.arc(x + 6, y + 1, 5, 0, Math.PI * 2); ctx.fill();
    } else if (o.t === 2) {
      const x = o.tx * TS, y = o.ty * TS;
      ctx.fillStyle = "#1b1424"; ctx.fillRect(x + 1, y + 3, 14, 13);
      ctx.fillStyle = "#6f6888"; ctx.fillRect(x + 2, y + 4, 12, 11); ctx.fillStyle = "#8a83a6"; ctx.fillRect(x + 2, y + 4, 12, 3);
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
        ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y)); if (p.flip) ctx.scale(-1, 1);
        ctx.drawImage(Math.floor(p.walk) % 2 ? HERO_WALK : HERO, -6, -9); ctx.restore();
        if (p.swing > 0) { // 劍光
          ctx.strokeStyle = `rgba(220,240,255,${p.swing * 5})`; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(p.x, p.y, 22, p.face - 1, p.face + 1); ctx.stroke();
        }
      }
    }
  }
  for (const s of W0.pshots) drawSword(s.x, s.y, s.a, 10);
  for (const s of W0.eshots) { ctx.fillStyle = s.c; ctx.fillRect(s.x - 2.5, s.y - 2.5, 5, 5); ctx.fillStyle = "#fff6c0"; ctx.fillRect(s.x - 1, s.y - 1, 2, 2); }
  drawFx();
  drawWorldHud();
}
function drawWMob(m) {
  const d = WMOBS[m.type], img = d.img(), sc = m.elite ? 1.4 : 1;
  ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.beginPath(); ctx.ellipse(m.x, m.y + d.r * 0.8, d.r * sc, d.r * 0.3 * sc, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.translate(Math.round(m.x), Math.round(m.y + Math.sin(time * 7 + m.x) * 0.6));
  if (m.x > W0.x) ctx.scale(-1, 1);
  if (m.fuse > 0 && Math.floor(time * 16) % 2) ctx.globalCompositeOperation = "lighter";
  ctx.drawImage(img, -img.width * sc / 2, -img.height * sc / 2, img.width * sc, img.height * sc);
  if (m.flash > 0) { ctx.globalCompositeOperation = "lighter"; ctx.drawImage(img, -img.width * sc / 2, -img.height * sc / 2, img.width * sc, img.height * sc); }
  ctx.restore();
  if (m.elite) { ctx.strokeStyle = "rgba(111,184,255,0.7)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(m.x, m.y + d.r * 0.8, d.r * 1.6, d.r * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); }
  if (m.hp < m.max || m.elite) {
    const bw = m.elite ? 26 : 18;
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(m.x - bw / 2, m.y - d.r * sc - 7, bw, 3);
    ctx.fillStyle = m.elite ? "#6fb8ff" : "#ff6a3a"; ctx.fillRect(m.x - bw / 2, m.y - d.r * sc - 7, bw * Math.max(0, m.hp / m.max), 3);
  }
  if (!(m.elite || m.st === "chase" || dist(m, W0) < 60)) return; // 名字只顯示精英、追你的、附近的
  ctx.font = "bold 5px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
  const gap = m.lv - save.w.lv;
  ctx.fillStyle = m.elite ? "#6fb8ff" : gap >= 4 ? "#ff6b6b" : gap <= -5 ? "#a99bb8" : "#f3eada";
  ctx.fillText(`${m.elite ? "精英 " : ""}${d.n} Lv.${m.lv}`, m.x, m.y - d.r * sc - 9);
}
function drawWorldHud() {
  const p = W0, w = save.w;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // 小地圖（左上）
  const mw = Math.min(110, W * 0.28), mh = mw * (TH / TW), mx0 = 10, my0 = 10, sc = mw / (TW * TS);
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(mx0 - 2, my0 - 2, mw + 4, mh + 4);
  for (let j = 0; j < 14; j++) for (let i = 0; i < 20; i++) {
    const z = zoneAt((i + 0.5) / 20 * TW * TS, (j + 0.5) / 14 * TH * TS);
    ctx.fillStyle = ZONES[z].g[0]; ctx.fillRect(mx0 + i * mw / 20, my0 + j * mh / 14, mw / 20 + 0.5, mh / 14 + 0.5);
  }
  for (const wp of WAYPOINTS) { ctx.fillStyle = w.wp.includes(wp.id) ? "#9fe8ff" : "#555"; ctx.fillRect(mx0 + wp.x * sc - 1.5, my0 + wp.y * sc - 1.5, 3, 3); }
  ctx.fillStyle = "#ff4a2a"; ctx.fillRect(mx0 + ALTAR.x * sc - 2, my0 + ALTAR.y * sc - 2, 4, 4);
  ctx.fillStyle = "#fff"; ctx.fillRect(mx0 + p.x * sc - 1.5, my0 + p.y * sc - 1.5, 3, 3);
  // 生命、真氣、經驗
  const bx = mx0, by = my0 + mh + 10, bw = Math.min(150, W * 0.36);
  const bar = (y, f, c, label) => {
    ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(bx - 2, y - 2, bw + 4, 12);
    ctx.fillStyle = c; ctx.fillRect(bx, y, bw * clamp(f, 0, 1), 8);
    ctx.fillStyle = "#fff"; ctx.font = "bold 9px 'Noto Sans TC', sans-serif"; ctx.textAlign = "left"; ctx.fillText(label, bx + 3, y + 7.5);
  };
  bar(by, p.hp / p.maxHp, p.hp / p.maxHp < 0.3 ? "#ff5a4a" : "#d83a3a", `生命 ${Math.ceil(p.hp)}/${p.maxHp}`);
  bar(by + 14, p.mp / B.maxMp, "#3a7ad8", `真氣 ${Math.floor(p.mp)}/${B.maxMp}`);
  bar(by + 28, w.exp / expNext(w.lv), "#e0c040", `Lv.${w.lv}　${Math.floor(w.exp / expNext(w.lv) * 100)}%`);
  ctx.font = "bold 10px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#cfc4dc";
  ctx.fillText(`丹藥 ${w.potions}　靈石 ${save.stone}${w.free ? `　能力點 ${w.free}（找長老）` : ""}`, bx, by + 50);
  // 地區名稱
  if (W0.bannerT > 0) {
    const z = ZONES[W0.zone];
    ctx.globalAlpha = Math.min(1, W0.bannerT * 2);
    ctx.textAlign = "center"; ctx.font = "900 22px 'Noto Sans TC', sans-serif";
    ctx.fillStyle = "#1b1424"; ctx.fillText(z.n, W / 2 + 2, H * 0.3 + 2); ctx.fillStyle = "#ffe0b0"; ctx.fillText(z.n, W / 2, H * 0.3);
    ctx.font = "bold 13px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#cfc4dc";
    ctx.fillText(W0.zone === "town" ? "安全區・找 NPC 換裝、補給" : `妖獸 Lv.${z.lv[0]}–${z.lv[1]}`, W / 2, H * 0.3 + 22);
    ctx.globalAlpha = 1;
  }
  if (time < 6 && w.lv === 1 && w.exp === 0) {
    ctx.textAlign = "center"; ctx.font = "bold 13px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#fff";
    ctx.fillText("左邊拖曳移動，右下按鈕出招（電腦：WASD＋J／K／U／空白／H）", W / 2, H * 0.62);
    ctx.fillText("出城往北走，越北邊的妖獸越強", W / 2, H * 0.62 + 20);
  }
  // 搖桿
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
