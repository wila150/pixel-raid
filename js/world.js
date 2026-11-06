// 御劍渡劫（pixel-raid）— 仙界大世界：一張可以自由探索的地圖（城鎮、四個野外地區、傳送陣、世界王祭壇）
// 玩法：自己放技能打怪 → 升等配點 → 撿裝備變強 → 往北走打更強的怪 → 火山祭壇挑戰焚天石魔
"use strict";

const TS = 16, TW = 200, TH = 112; // 一格 16 單位，地圖 3200×1792（x 2400 以東是寒霜雪域）
const TOWN = { x: 1200, y: 1520, r: 120 };
const ZONES = {
  town: { n: "青雲城", lv: [0, 0], g: ["#4a4458", "#433e52"] },
  grass: { n: "靈草原", lv: [1, 6], g: ["#2f4a2c", "#2b4429"], mobs: ["imp", "imp", "wolf"] },
  forest: { n: "幽暗森林", lv: [6, 12], g: ["#1d3326", "#1a2e22"], mobs: ["wolf", "treant", "treant", "imp"] },
  waste: { n: "亂石荒原", lv: [11, 17], g: ["#4a4034", "#443a2f"], mobs: ["golem", "bomber", "wolf"] },
  volcano: { n: "焚天火山", lv: [16, 24], g: ["#3a2424", "#342020"], mobs: ["crow", "lava", "bomber"] },
  snow: { n: "寒霜雪域", lv: [22, 30], g: ["#c4d0de", "#b8c6d6"], mobs: ["frostwolf", "frostwolf", "icewisp", "yeti"] },
};
const EN_FULL = 100; // 天罰能量
const SNOW_X = 2400, SNOW_PASS = { x: 2400, y: 640 }; // 雪域在東邊，只有一個山口能過去
function zoneAt(x, y) {
  if (Math.hypot(x - TOWN.x, y - TOWN.y) < TOWN.r + 10) return "town";
  if (x >= SNOW_X) return "snow";
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
  { id: "snow", n: "寒霜雪域", x: 2820, y: 640 },
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
const FROSTWOLF = sprite([
  "k.k.......",
  "kWk.......",
  "kWWkkkkk..",
  "kWEWWWWWkk",
  ".kWWWWWWWk",
  "..kBkkkBk.",
  "..kk...kk.",
], { k: "#1b1424", W: "#e8f2ff", E: "#4ad8ff", B: "#9ab0c8" });
const ICEWISP = sprite([
  "...kk...",
  "..kCCk..",
  ".kCWWCk.",
  "kCWEEWCk",
  "kCWWWWCk",
  ".kCCCCk.",
  "..kCCk..",
  "...kk...",
], { k: "#1b3a5a", C: "#6ac8f0", W: "#d8f6ff", E: "#1b3a5a" });
const YETI = sprite([
  "...kkkkkk...",
  "..kWWWWWWk..",
  ".kWWkWWkWWk.",
  ".kWWBWWBWWk.",
  "kkWWWwwWWWkk",
  "kWWkWWWWkWWk",
  "kWWkWWWWkWWk",
  ".kk.kWWk.kk.",
  "....kk.kk...",
], { k: "#1b1424", W: "#f0f4ff", w: "#b8c8e0", B: "#3a6aa8" });
const WMOBS = {
  imp: { n: "小妖", img: () => MOB, hp: 30, spd: 34, dmg: 6, r: 6, exp: 4, ai: "melee", sz: "S", race: "B" },
  wolf: { n: "狼妖", img: () => WOLF, hp: 42, spd: 64, dmg: 7, r: 6, exp: 6, ai: "melee", sz: "M", race: "B" },
  treant: { n: "樹妖", img: () => TREANT, hp: 40, spd: 24, dmg: 7, r: 7, exp: 7, ai: "ranged", range: 95, shot: 85, sz: "M", race: "P" },
  golem: { n: "石甲妖", img: () => GOLEM, hp: 140, spd: 22, dmg: 16, r: 8, exp: 14, ai: "melee", armor: 0.3, heavy: true, sz: "L", race: "R" },
  bomber: { n: "爆石靈", img: () => BOMBER, hp: 32, spd: 58, dmg: 26, r: 6, exp: 10, ai: "bomber", sz: "S", race: "R" },
  crow: { n: "火鴉", img: () => CROW, hp: 55, spd: 72, dmg: 9, r: 6, exp: 14, ai: "ranged", range: 115, shot: 120, sz: "S", race: "B", ele: "F" },
  lava: { n: "熔岩獸", img: () => LAVA, hp: 230, spd: 30, dmg: 22, r: 9, exp: 26, ai: "melee", armor: 0.3, heavy: true, sz: "L", race: "R", ele: "F" },
  frostwolf: { n: "霜狼", img: () => FROSTWOLF, hp: 64, spd: 78, dmg: 10, r: 6, exp: 18, ai: "melee", chill: true, sz: "M", race: "B", ele: "W" },
  icewisp: { n: "冰靈", img: () => ICEWISP, hp: 58, spd: 40, dmg: 10, r: 6, exp: 18, ai: "ranged", range: 125, shot: 105, chill: true, sz: "S", ele: "W" },
  yeti: { n: "雪巨猿", img: () => YETI, hp: 300, spd: 30, dmg: 26, r: 9, exp: 34, ai: "melee", armor: 0.25, heavy: true, chill: true, sz: "L", race: "B", ele: "W" },
  hunter: { n: "獵寶妖", img: () => WOLF, hp: 70, spd: 70, dmg: 12, r: 7, exp: 30, ai: "melee", sz: "M", race: "B" }, // 身上寶物多時會來追殺
};
const SZ_N = { S: "小", M: "中", L: "大" };
// 體型 × 武器修正（RO）：輕型飛劍割小怪 100%、砍大型王只剩 50%；玄鐵重劍專剋大型
const SIZE_MOD = { sword: { S: 1, M: 0.75, L: 0.5 }, blade: { S: 0.75, M: 1, L: 1.25 }, bow: { S: 1, M: 1, L: 0.75 }, fist: { S: 1, M: 1, L: 0.75 }, staff: { S: 1, M: 1, L: 1 }, fan: { S: 1, M: 1, L: 1 } };
const SPELL_WT = { staff: 1, fan: 1 };
const ZONE_LOOT = { town: 1, grass: 1, forest: 1.3, waste: 1.6, volcano: 2, snow: 2.4 }; // 越深的地方掉越多

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
    else if (z === "snow") t = n > 0.64 && v < 0.5 ? 1 : n < 0.12 ? 4 : v > 0.975 ? 2 : 0;
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
  // 雪山山脊（只留一個山口）
  for (let ty = 1; ty < TH - 1; ty++) for (const tx of [149, 150]) { const y = ty * TS; if (Math.abs(y - SNOW_PASS.y) > 70) wmap[ty * TW + tx] = 2; }
  roads.push([WAYPOINTS[3], SNOW_PASS], [SNOW_PASS, WAYPOINTS[5]]);
  for (const [a, b] of roads) carve(a, b, 2);
  for (const p of [...WAYPOINTS, ALTAR, SNOW_PASS]) clearAround(p.x, p.y, 3);
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
  str: { n: "STR 力量", d: "物理武器（劍、重劍、拳、弓）傷害 +3%、護甲 +3" },
  agi: { n: "AGI 敏捷", d: "攻速 +1.5%、閃避 +0.4%、法術壓制 +0.3%、移動 +0.5%" },
  wis: { n: "INT 智慧", d: "法術武器（法杖、扇）傷害 +3%、能量護盾 +6、真氣 +4" },
  vit: { n: "VIT 體質", d: "生命 +12、護甲 +1" },
};
const blankW = () => ({ lv: 1, exp: 0, x: 1200, y: 1530, wp: ["town"], ap: { str: 0, vit: 0, agi: 0, wis: 0 }, free: 0, potions: 3 });
const expNext = (lv) => Math.round(36 * Math.pow(lv, 1.7));
let W0 = null; // 大世界執行中的資料
let inWorld = false;
function worldStats() {
  const w = save.w, a = w.ap, wt = curWeapon(), spell = !!SPELL_WT[wt];
  const b = bonus();
  b.maxHp = Math.round(b.maxHp + (w.lv - 1) * 12 + a.vit * 12);
  b.atk *= (1 + (w.lv - 1) * 0.1) * (1 + a.str * (spell ? 0.01 : 0.03)) * (1 + a.wis * (spell ? 0.03 : 0.01));
  b.aspd = (b.aspd || 1) * (1 + a.agi * 0.015);
  b.spdMul *= 1 + a.agi * 0.005;
  b.dodge = Math.min(0.5, (b.dodge || 0) + a.agi * 0.004);
  b.supp = Math.min(0.6, (b.supp || 0) + a.agi * 0.003);
  b.res = Math.min(0.75, b.res || 0);
  b.armor = (b.armor || 0) + a.str * 3 + a.vit;
  b.maxEs = Math.round((b.es || 0) * (1 + a.wis * 0.02) + a.wis * 6);
  b.maxMp = 60 + w.lv * 2 + a.wis * 4;
  b.mpRegen = (4 + w.lv * 0.1) * (1 + a.wis * 0.04);
  b.potMax = 3 + Math.floor(w.lv / 8) + (save.tr.furnace || 0);
  return jobStats(b);
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
  WSKILL.ult.mp = 0; WSKILL.ult.cd = 1; // 天罰：不吃真氣，改成集滿天罰能量才能放
}
applyWeapon();
const PAD_KEYS = { attack: "左鍵", spin: "Q", roll: "空白", ult: "E", potion: "H" };
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

// 安全營地：每個傳送點周圍一圈結界，怪物進不來、子彈打不進來，踏進去就算把裝備帶回
const CAMP_R = 72;
const campAt = (x, y) => WAYPOINTS.find((wp) => wp.id !== "town" && Math.hypot(x - wp.x, y - wp.y) < CAMP_R);
const safeAt = (x, y) => zoneAt(x, y) === "town" || !!campAt(x, y);
function enterWorld() {
  if (!wmap) buildWorld();
  // 第一次進來：先建立角色（取名、選初始武器）；舊存檔已經練過的直接當作建好了
  if (save.w && !save.w.created && (save.w.lv > 1 || save.w.exp > 0 || save.w.q)) save.w.created = 1;
  if (!save.w || !save.w.created) { renderCreate(); return; }
  if (!save.eq.sword) { const it = rollItem(0, 0, "sword"); it.q = 0; it.u = null; it.wt = "sword"; it.aff = {}; nameItem(it); save.eq.sword = it; writeSave(); }
  if (!save.gems) { save.gems = {}; addGem("multi:1"); addGem("power:1"); writeSave(); W0gift = true; }
  mode = "normal";
  inWorld = true;
  B = worldStats();
  run = { x: 0, y: 0, swords: 0, perks: {}, shield: 0, rows: [], fromWorld: true };
  const w = save.w;
  if (blockedCircle(w.x, w.y, 5)) { w.x = 1200; w.y = 1530; }
  if (!W0) {
    W0 = { voids: [], orbs: [], camps: [], mobs: [], pshots: [], eshots: [], fires: [], rings: [], tornados: [], spinT: 0, spinTick: 0, drops: [], npcCool: null, zone: "", bannerT: 0, saveT: 5, combatT: 0, lastAggro: 0 };
    makeCamps();
  }
  Object.assign(W0, { x: w.x, y: w.y, hp: B.maxHp, maxHp: B.maxHp, mp: B.maxMp, face: -Math.PI / 2, flip: false, walk: 0, iframe: 1, hurt: 0, swing: 0, shield: 3, en: W0.en || 0,
    roll: 0, rollDir: 0, cds: { attack: 0, spin: 0, ult: 0, roll: 0, potion: 0 }, regenAcc: 0, lavaT: 0, es: B.maxEs, esT: 0 });
  W0.voids = W0.voids || []; W0.orbs = W0.orbs || [];
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
  if (typeof tutHighlight === "function") tutHighlight();
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
  const want = { grass: 16, forest: 16, waste: 14, volcano: 12, snow: 14 };
  for (const z in want) {
    let n = 0, tries = 0;
    while (n < want[z] && tries++ < 4000) {
      const x = 40 + r() * (TW * TS - 80), y = 40 + r() * (TH * TS - 80);
      if (zoneAt(x, y) !== z || Math.hypot(x - TOWN.x, y - TOWN.y) < 230 || blockedCircle(x, y, 12) || Math.hypot(x - SNOW_PASS.x, y - SNOW_PASS.y) < 150 || WAYPOINTS.some((wp) => Math.hypot(x - wp.x, y - wp.y) < CAMP_R + 90)) continue;
      if (W0.camps.some((c) => Math.hypot(c.x - x, c.y - y) < 120)) continue;
      const lo = ZONES[z].lv[0], hi = ZONES[z].lv[1];
      const far = clamp((Math.hypot(x - TOWN.x, y - TOWN.y) - 230) / 1300, 0, 1);
      const zf = z === "grass" ? clamp((Math.hypot(x - TOWN.x, y - TOWN.y) - 230) / 700, 0, 1) : z === "volcano" ? clamp((480 - y) / 400, 0, 1) : z === "snow" ? clamp((x - SNOW_X - 100) / 600, 0, 1) : far;
      const camp = { x, y, z, lv: Math.round(lo + (hi - lo) * zf), size: 4 + Math.floor(r() * 4), respawn: [] };
      W0.camps.push(camp);
      for (let i = 0; i < camp.size; i++) spawnWMob(camp);
      n++;
    }
  }
}
function spawnWMob(camp) {
  const types = ZONES[camp.z].mobs, type = types[Math.floor(Math.random() * types.length)], d = WMOBS[type];
  const lv = Math.max(1, camp.lv + Math.floor(Math.random() * 3) - 1), elite = Math.random() < 0.08;
  const hp = d.hp * 1.2 * (1 + 0.35 * (lv - 1)) * (elite ? 4 : 1);
  const mod = elite ? ELITE_MODS[Math.floor(Math.random() * ELITE_MODS.length)] : null;
  let x = camp.x, y = camp.y;
  for (let i = 0; i < 10; i++) { const tx = camp.x + rand(-40, 40), ty = camp.y + rand(-40, 40); if (!blockedCircle(tx, ty, d.r)) { x = tx; y = ty; break; } }
  W0.mobs.push({ type, lv, elite, mod, camp, x, y, hp, max: hp, st: "idle", wt: rand(0, 2), wx: x, wy: y, atkT: 0, flash: 0, kb: 0, ka: 0, fuse: 0 });
}

// 精英詞綴：狂暴（快、出手快）、鐵壁（很硬）、召喚（半血叫小弟）
const ELITE_MODS = ["狂暴", "鐵壁", "召喚"];
const mobDmg = (m, d) => d.dmg * (1 + 0.22 * (m.lv - 1)) * (m.elite ? 1.6 : 1);
function packAggro(m) { // 打一隻，整個營地一起衝過來
  for (const o of W0.mobs) if (!o.dead && o.camp === m.camp && o.st === "idle") o.st = "chase";
}
// ───────── 傷害 ─────────
const KC_WIN = 4; // 連斬：4 秒內殺下一隻才接得上
const kcBonus = () => Math.min(0.3, Math.floor((W0.kc || 0) / 5) * 0.02); // 每 5 連斬傷害 +2%，最多 +30%
const wDmg = (base) => base * B.atk * (B.zen ? 1 + Math.floor(W0.combatT / 10) * 0.05 : 1) * (1 + 0.1 * gemLv("power")) * (1 + kcBonus());
let chainLock = false; // 連鎖寶石引的雷不會再引雷
function hitMob(m, dmg, kb = 0, from = null, quiet = false) {
  if (m.dead) return;
  const d = WMOBS[m.type], vs = B.vs || {}, sz = d.sz || (m.boss ? "L" : "M");
  const crit = Math.random() < B.crit + (sz === "L" ? vs.critL || 0 : 0);
  if (crit) dmg *= B.critDmg;
  dmg *= (SIZE_MOD[curWeapon()] || SIZE_MOD.staff)[sz] * (1 + (vs[sz] || 0) / 100) * (1 + ((d.race && vs[d.race]) || 0) / 100) * (1 + ((d.ele && vs[d.ele]) || 0) / 100); // 體型、種族、屬性（卡片）
  if (crit && B.uq.thunder && Math.random() < 0.3) { dmg += wDmg(20); bolts.push({ x: m.x, y: m.y, life: 0.25 }); }
  if (d.armor && !B.ignoreDef) dmg *= 1 - d.armor;
  if (m.mod === "鐵壁") dmg *= 0.55;
  dmg = elemHit(m, dmg); // 輔助寶石：冰凍、燃燒、融化、引爆、毒
  const L = curLines(); // 段數：一下打好幾行，總傷害 ×(1+0.3×(段數−1))
  dmg = Math.max(1, Math.round(dmg * rand(0.9, 1.1) * (L > 1 ? (1 + 0.3 * (L - 1)) / L : 1)));
  m.hp -= dmg * L; m.flash = 0.08;
  if (m.st === "idle" || m.st === "home") { m.st = "chase"; packAggro(m); }
  if (kb && from && !m.elite && !m.boss) { m.kb = kb; m.ka = angTo(from, m); }
  const lch = B.leech + 0.005 * gemLv("blood") + (W0.invT > 0 ? 0.1 : 0);
  if (lch > 0) W0.regenAcc += dmg * L * lch;
  const gf = gemLv("frost"); if (gf && Math.random() < 0.15 + gf * 0.1) m.slowT = Math.max(m.slowT || 0, 1.5);
  const gc = gemLv("chain");
  if (gc && !chainLock && Math.random() < 0.08 + gc * 0.05) {
    let o = null, bd = 70; for (const n of W0.mobs) if (n !== m && !n.dead) { const dd = dist(n, m); if (dd < bd) { bd = dd; o = n; } }
    if (o) { bolts.push({ x: o.x, y: o.y, life: 0.2 }); chainLock = true; hitMob(o, dmg * 0.6, 0, null, true); chainLock = false; }
  }
  W0.mp = Math.min(B.maxMp, W0.mp + (quiet ? 0 : 1));
  for (let i = 0; i < Math.min(L, 10); i++) { // 段數：數字一行一行疊上去
    floatText(m.x, m.y - 10 - i * 7, crit ? `${dmg}!` : `${dmg}`, crit ? (dmg * L > m.max * 0.5 ? "#ff4a3a" : "#ffd84a") : L > 1 ? "#ffe9c0" : "#ffffff", crit);
    const f = floaters[floaters.length - 1], a = (from ? angTo(from, m) : rand(-Math.PI, Math.PI)) + rand(-0.6, 0.6); f.vx = Math.cos(a) * (crit ? 55 : 30) * (L > 1 ? 0.3 : 1); f.vy = -(crit ? 75 : 55) * (L > 1 ? 0.6 : 1); f.num = true; f.age = -i * 0.03;
  }
  if (!quiet) { sfx(crit ? "crit" : "hit"); hitstop = Math.max(hitstop, crit ? 0.05 : 0.025); }
  burst(m.x, m.y, crit ? "#ffd84a" : "#ffb070", crit ? 10 : 5, 60);
  fxHit(m.x + rand(-2, 2), m.y - 2 + rand(-2, 2), crit, WPN_FX[curWeapon()]);
  if (m.mod === "召喚" && !m.summoned && m.hp > 0 && m.hp < m.max * 0.5) {
    m.summoned = true; floatText(m.x, m.y - 18, "召喚妖群！", "#ff6b6b", true);
    for (let i = 0; i < 3; i++) { spawnWMob(m.camp); const n = W0.mobs[W0.mobs.length - 1]; n.elite = false; n.mod = null; n.hp = n.max = n.max / 4; n.x = m.x + rand(-15, 15); n.y = m.y + rand(-15, 15); n.st = "chase"; n.noRespawn = true; burst(n.x, n.y, "#b07dff", 10, 60); }
  }
  if (m.hp <= 0) killMob(m);
}
function killMob(m) {
  m.dead = true; tutEvent("kill");
  W0.en = Math.min(EN_FULL, (W0.en || 0) + (m.boss ? 100 : m.elite || m.hunter ? 25 : 6) * (B.enMul || 1)); // 吸取魂屑
  if (W0.en >= EN_FULL && !W0.enFullFx) { W0.enFullFx = true; floatText(W0.x, W0.y - 36, "天罰能量已滿！按 E", "#ffd84a", true); sfx("arrive"); }
  W0.kc = (W0.kcT > 0 ? W0.kc || 0 : 0) + 1; W0.kcT = KC_WIN; W0.kcPop = 0.25;
  if (W0.kc > (W0.kcBest || 0)) W0.kcBest = W0.kc;
  if (W0.kc % 25 === 0) { floatText(W0.x, W0.y - 34, `${W0.kc} 連斬！`, "#ff8a3d", true); sfx("crit"); }
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
  const sh = m.boss ? 20 : m.hunter ? 5 : m.elite ? 3 : Math.random() < 0.05 ? 1 : 0; // 天罰碎屑
  if (sh) { save.shards = (save.shards || 0) + sh; if (sh > 1) floatText(m.x, m.y - 28, `天罰碎屑 +${sh}`, "#ffcf6b"); }
  if (heroHas("vampire")) W0.hp = Math.min(W0.maxHp, W0.hp + W0.maxHp * 0.01);
  if (m.boss) { if (Math.random() < 0.25) addSup(Object.keys(SUPERS)[Math.floor(Math.random() * 3)]); if (Math.random() < 0.15) wDrop({ kind: "card", c: "wboss" }, m); for (let i = 0; i < 3; i++) wDrop({ kind: "ess", k: randEss() }, m); wbKilled(m); return; }
  // 掉寶
  const il = Math.max(0, Math.floor(m.lv / 3) + Math.floor(Math.random() * 2) - 1);
  const zl = ZONE_LOOT[m.camp.z] || 1;
  const dm = 1 + (B.drop || 0);
  if (Math.random() < (m.hunter ? 0.2 : m.elite ? 0.03 : 0.003) * dm) wDrop({ kind: "card", c: m.type }, m); // 魔物卡片
  if (Math.random() < (m.hunter ? 1 : m.elite ? 0.2 : 0.006 * zl) * dm) wDrop({ kind: "ess", k: randEss() }, m); // 精髓
  if (m.hunter) { for (let i = 0; i < 2; i++) wDropItem(rollItem(1, il + 1), m); wDrop({ kind: "stone", v: 10 + m.lv }, m); floatText(m.x, m.y - 20, "獵寶妖被斬了！", "#ffe066", true); }
  else if (Math.random() < (m.elite ? 0.4 : 0.028) * zl * dm) wDropItem(rollItem(m.elite ? 1 : 0, il), m); // 越深掉越多件，但只有精英掉好東西
  if (m.hunter) { wDrop({ kind: "gem", g: randGem(1) }, m); wDrop({ kind: "gem", g: randGem(1) }, m); }
  else if (Math.random() < (m.elite ? 0.25 : 0.012 * zl)) wDrop({ kind: "gem", g: randGem(1) }, m);
  if (Math.random() < (m.elite ? 0.8 : 0.15)) wDrop({ kind: "stone", v: Math.round((1 + Math.floor(m.lv / 3) + (m.elite ? 4 : 0)) * zl) }, m);
  if (Math.random() < 0.03) wDrop({ kind: "potion" }, m);
  if (m.elite && Math.random() < 0.15) wDrop({ kind: "key", k: makeKey(Math.max(1, Math.ceil(m.lv / 4))) }, m);
  if (!m.hunter && !m.noRespawn) m.camp.respawn.push(15 + Math.random() * 7);
}
// 掉落過濾器：低於設定品質的裝備直接變成靈石（不會占背包、也不用走過去撿）
function wDropItem(it, at) { if (it.q < (save.w.filt || 0)) wDrop({ kind: "stone", v: sellPrice(it) }, at); else wDrop({ kind: "item", it }, at); }
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
// 天罰：能量集滿放出，除了武器本身的大招，整個畫面的妖獸都被天雷劈一次
function tianfa() {
  const p = W0; W0.enFullFx = false;
  for (const m of W0.mobs) if (!m.dead && Math.abs(m.x - p.x) < 260 && Math.abs(m.y - p.y) < 170) { bolts.push({ x: m.x, y: m.y, life: 0.35 }); hitMob(m, wDmg(30), 50, p, true); }
  shake = Math.max(shake, 10); flashT = 0.18; flashColor = "255,215,120"; sfx("crit");
  W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.5, r: 120, c: "255,210,110" });
  floatText(p.x, p.y - 30, "天罰！", "#ffd84a", true);
}
let chillHit = false; // 冰靈的冰彈打中時設成 true
// kind：phys 物理（怪物近戰）、spell 法術（子彈）、ele 元素法術（火、冰，吃抗性）
function hurtW(dmg, from, kind) {
  const p = W0;
  if (p.shield > 0 || safeAt(p.x, p.y)) return; // 太極護罩、營地結界：完全不受傷
  if (p.invT > 0) return; // 吸血鬼：血霧無敵
  if (p.mistT > 0 && (kind || (from ? "phys" : "spell")) === "phys") { if (!p.mistMsg || time - p.mistMsg > 0.6) { p.mistMsg = time; popWord(p, "霧化", "#9aff9a"); } return; }
  if (p.iframe > 0 || !(state === "world" || ((state === "paused" || state === "pick") && pausedFrom === "world"))) return;
  kind = kind || (from ? "phys" : "spell");
  if (kind === "phys" && Math.random() < B.dodge) { p.iframe = 0.25; popWord(p, "DODGE", "#7dff6a"); return; } // 敏捷：閃避
  if (kind !== "phys" && Math.random() < B.supp) { dmg *= 0.5; popWord(p, "SUPPRESSED", "#6fb8ff"); } // 敏捷：法術壓制
  if (kind === "phys" && B.armor > 0) { // 力量：護甲（傷害越小擋越多）
    const r = Math.min(0.75, B.armor / (B.armor + 5 * dmg)); dmg *= 1 - r;
    if (r > 0.08) { burst(p.x + rand(-4, 4), p.y - 4, "#ffe9a0", 6, 70, 0.25); burst(p.x, p.y - 4, "#c8d0e0", 4, 40, 0.2); }
  }
  if (kind === "ele") dmg *= 1 - B.res;
  dmg = dmg * (B.uq.vajra && p.hp < p.maxHp * 0.3 ? 0.5 : 1);
  dmg = Math.max(1, Math.round(dmg));
  p.esT = 3; // 脫戰 3 秒才回充護盾
  if (p.es > 0) { // 智慧：能量護盾先扣
    const a = Math.min(p.es, dmg); p.es -= a; dmg -= a;
    burst(p.x, p.y - 3, "#9fdcff", 6, 50, 0.3);
    if (dmg <= 0) { p.iframe = 0.45; floatText(p.x, p.y - 14, `-${a}`, "#9fdcff"); sfx("hit"); return; }
  }
  p.hp -= dmg; p.iframe = 0.45; p.hurt = 0.2;
  floatText(p.x, p.y - 14, `-${dmg}`, "#ff6b6b");
  sfx("hurt"); shake = Math.max(shake, 5); flashT = 0.1; flashColor = "255,40,40";
  if (from && B.thorns > 0 && from.hp !== undefined) hitMob(from, dmg * B.thorns * 3, 0, null, true);
  if (from) { const a = angTo(from, p); moveBody(p, Math.cos(a) * 8, Math.sin(a) * 8, 5); }
  if ((from && from.type && WMOBS[from.type] && WMOBS[from.type].chill) || chillHit) { if (!(p.chillT > 0)) floatText(p.x, p.y - 22, "凍傷！變慢", "#9fe8ff"); p.chillT = 1.6; }
  if (p.hp <= 0) { p.hp = 0; state = "worldDead"; screenEl.classList.add("hidden"); sfx("lose"); setTimeout(showWorldDead, 900); }
}
function popWord(p, t, c) { floatText(p.x, p.y - 18, t, c, true); const f = floaters[floaters.length - 1]; if (f) { f.vy = -40; f.px = true; } }
function showWorldDead() {
  const w = save.w, lose = Math.round(w.exp * 0.1);
  // 死掉：還沒帶回的裝備掉一半在倒下的地方（10 分鐘內回去撿得回來），另一半還在身上
  const risky = riskyItems().sort(() => Math.random() - 0.5), lost = risky.slice(0, Math.ceil(risky.length / 2));
  lost.forEach(ungem);
  save.bag = save.bag.filter((b) => !lost.includes(b));
  for (const k of SLOT_KEYS) if (lost.includes(save.eq[k])) delete save.eq[k];
  if (w.ws) w.ws = w.ws.map((b) => (lost.includes(b) ? null : b));
  for (const it of lost) wDrop({ kind: "item", it, corpse: true }, W0);
  if (lost.length) W0.grave = { x: W0.x, y: W0.y, t: 600 };
  w.exp -= lose; w.x = 1200; w.y = 1530; writeSave();
  pad.classList.add("hidden");
  screenEl.innerHTML = `<div class="panel"><h1>你倒下了…</h1>
    <div class="result">損失經驗 ${lose}<br>${lost.length ? `還沒帶回的裝備掉了 ${lost.length} 件在倒下的地方：${lost.map((it) => `<b style="color:${RARITY[it.q].c}">${it.name}</b>`).join("、")}<br><small>10 分鐘內回去撿得回來（地圖上有魂火標記）</small>` : "沒有掉裝備（都已經帶回了）"}<br><small>野外撿到的裝備要走進安全營地、回城，或用回城符才算帶回</small></div>
    <div class="btns"><button id="revive" class="big">在青雲城復活</button></div></div>`;
  screenEl.classList.remove("hidden");
  document.getElementById("revive").onclick = () => { W0.x = 1200; W0.y = 1530; enterWorld(); };
}

// ───────── 每幀更新 ─────────
function updateWorld(dt) {
  const inMenu = state !== "world"; // 連線時開著選單：世界照跑，但角色不接受操作
  if (inMenu) { keys.clear(); pressed.clear(); padAct.clear(); stick.id = null; }
  updateWFx(dt); fogTick(dt);
  updateWBZones(dt); if (W0.wbCool > 0) W0.wbCool -= dt;
  if (typeof netTick === "function") netTick(dt);
  if (!inMenu) tutTick();
  heroTick(dt, inMenu);
  const p = W0, w = save.w;
  for (const k in p.cds) p.cds[k] = Math.max(0, p.cds[k] - dt);
  if (p.chillT > 0) { p.chillT -= dt; if (Math.random() < 0.3) particles.push({ x: p.x + rand(-5, 5), y: p.y - rand(0, 10), vx: 0, vy: 12, life: 0.4, max: 0.4, color: "#bfefff", size: 1.5 }); }
  p.iframe = Math.max(0, p.iframe - dt); p.hurt = Math.max(0, p.hurt - dt); p.swing = Math.max(0, p.swing - dt);
  p.mp = Math.min(B.maxMp, p.mp + B.mpRegen * dt);
  if (p.es === undefined) p.es = B.maxEs;
  if (p.esT > 0) p.esT -= dt; else p.es = Math.min(B.maxEs, p.es + B.maxEs * 0.33 * dt); // 脫戰 3 秒回充
  p.es = Math.min(p.es, B.maxEs);
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
  if (p.shield > 0) { // 太極護罩：3 秒，或一移動／出招就解除
    p.shield -= dt;
    if (ml > 0.1 || padAct.size || mouse.down || ["j", "k", "u", "e", "q", "1", "h", " ", "z", "x"].some((k) => pressed.has(k))) p.shield = 0;
  }
  if (ml > 0.1) { p.face = Math.atan2(my, mx); p.walk += dt * 10; }
  if (Math.cos(p.face) < -0.2) p.flip = true; else if (Math.cos(p.face) > 0.2) p.flip = false;
  if (p.roll > 0) {
    p.roll -= dt;
    moveBody(p, Math.cos(p.rollDir) * 250 * dt, Math.sin(p.rollDir) * 250 * dt, 5);
    if (p.dashHit) for (const m of W0.mobs) if (!m.dead && !p.dashHit.has(m) && dist(m, p) < 14 + WMOBS[m.type].r) { p.dashHit.add(m); hitMob(m, wDmg(16), 90, p); }
    if (p.roll <= 0) p.dashHit = null;
    if (Math.random() < 0.6) particles.push({ x: p.x, y: p.y + 5, vx: 0, vy: -10, life: 0.3, max: 0.3, color: "#8fa7ff", size: 2 });
  } else {
    const spd = 85 * B.spdMul * (p.swing > 0 ? 0.6 : 1) * (p.chillT > 0 ? 0.6 : 1) * (p.mistT > 0 ? 1.3 : 1);
    moveBody(p, mx * spd * dt, my * spd * dt, 5);
  }
  // 熔岩會燙
  if (tileAt(p.x, p.y) === 3) { p.lavaT -= dt; if (p.lavaT <= 0) { p.lavaT = 0.5; p.iframe = 0; hurtW(4 + w.lv * 0.6, null, "ele"); } }

  const near = (max) => { if (mouseAim()) return mouseTarget(max); let best = null, bd = max; for (const m of W0.mobs) { if (m.dead) continue; const d = dist(m, p); if (d < bd) { bd = d; best = m; } } return best; };
  const useSkill = (k) => { if (p.cds[k] > 0 || p.mp < WSKILL[k].mp * ((B.skMp && B.skMp[k]) || 1) || p.roll > 0) return false; p.cds[k] = WSKILL[k].cd * (k === "roll" ? B.rollCd : k === "attack" ? 1 / (B.aspd || 1) : 1) * ((B.skCd && B.skCd[k]) || 1); p.mp -= WSKILL[k].mp * ((B.skMp && B.skMp[k]) || 1); if (k === "attack") W0.justAtk = true; skillUsed(k); tutEvent(k); return true; };
  const wt = curWeapon();
  const arcHit = (range, half, base, kb) => {
    for (const m of W0.mobs) {
      if (m.dead) continue;
      const d = dist(m, p), diff = Math.abs(((angTo(p, m) - p.face + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (d < range + WMOBS[m.type].r && diff < half) hitMob(m, wDmg(base), kb, p);
    }
  };
  const gp = gemLv("pierce");
  const shoot = (a, o) => { if (gp) { o.pierce = true; o.dmg *= 1 + gp * 0.05; } o.bn = B.uq.bounce ? 2 : 0; W0.pshots.push(Object.assign({ x: p.x, y: p.y - 3, vx: Math.cos(a) * o.v, vy: Math.sin(a) * o.v, a, hit: new Set() }, o)); multiShots(a, o, shoot); };
  const autoAtk = w.autoAtk && !inMenu && p.cds.attack <= 0 && W0.mobs.some((m) => !m.dead && !m.noTarget && dist(m, p) < 70); // 設定：半自動割草
  if ((act("attack", "j", "z") || autoAtk || ((keys.has("j") || mouse.down) && p.cds.attack <= 0)) && useSkill("attack")) {
    if (B.uq.orbit && (W0.orbAtk = (W0.orbAtk || 0) + 1) % 3 === 0) { if (W0.orbs.length >= 6) W0.orbs.shift(); W0.orbs.push({ t: 8, hit: new Map() }); }
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
      if (B.uq.wave) shoot(p.face, { v: 220, life: 0.55, dmg: 10, kind: "sword", pierce: true, kb: 30 });
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
    if (superSpin(p, t)) return; // 超技能寶石：隕石、萬劍天降
    if (B.uq.voidQ) { // 傳說：劍陣變成引力黑洞
      const tx = t ? t.x : p.x + Math.cos(p.face) * 60, ty = t ? t.y : p.y + Math.sin(p.face) * 60;
      W0.voids.push({ x: tx, y: ty, t: 2.2, max: 2.2, tick: 0 }); sfx("volley"); netCast("v", p.face, tx, ty); return;
    }
    netCast("q", p.face, t ? t.x : p.x + Math.cos(p.face) * 60, t ? t.y : p.y + Math.sin(p.face) * 60);
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
  if (act("spin", "k", "x", "q") && useSkill("spin")) {
    doSpin(); fxCast(WPN_FX[wt]);
    const gm = gemLv("multi"); if (gm && Math.random() < 0.25 + gm * 0.1) W0.recastT = 0.2; // 連發寶石
  }
  if (W0.recastT > 0 && (W0.recastT -= dt) <= 0) { W0.recastT = 0; doSpin(); floatText(p.x, p.y - 20, "連發！", "#ffb347"); }
  const ultCd0 = p.cds.ult;
  if (act("ult", "u", "e") && p.cds.ult <= 0 && (p.en || 0) < EN_FULL) { if (!p.enMsgT) { floatText(p.x, p.y - 20, `天罰能量 ${Math.floor(p.en || 0)}%（斬妖集滿）`, "#b8a0ff"); p.enMsgT = 1; } }
  if (p.enMsgT > 0) p.enMsgT = Math.max(0, p.enMsgT - dt) || 0;
  if (act("ult", "u", "e") && p.cds.ult <= 0 && (p.en || 0) >= EN_FULL) {
    if (jobLv() >= 4) { if (useSkill("ult")) { originStart(); p.en = 0; } } // 四轉：起源覺醒
    else if (WSKILL.ult.uq) { if (useSkill("ult")) uniqueUlt(WSKILL.ult.uq, near); }
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
  if (p.cds.ult > ultCd0 && jobLv() < 4) { p.en = 0; tianfa(); netCast("e", p.face, p.x, p.y); }
  if (W0.justAtk) { W0.justAtk = false; netCast("a", p.face, p.x, p.y); }
  if (act("roll", " ", "l", "shift") && useSkill("roll")) { p.roll = 0.22; p.rollDir = ml > 0.1 ? Math.atan2(my, mx) : p.face; p.iframe = Math.max(p.iframe, 0.3); sfx("dash"); }
  if (W0.kcT > 0) { W0.kcT -= dt; if (W0.kcT <= 0) W0.kc = 0; }
  if (W0.kcPop > 0) W0.kcPop -= dt;
  const autoPot = w.autoPot !== false && p.hp < p.maxHp * 0.3 && !inMenu; // 設定：低血量自動喝藥（預設開）
  if ((act("potion", "h", "4") || autoPot) && w.potions > 0 && p.hp < p.maxHp && useSkill("potion")) {
    w.potions--; const heal = Math.min(Math.round(p.maxHp * 0.4 * B.potionMul), p.maxHp - p.hp); p.hp += heal;
    floatText(p.x, p.y - 16, `+${heal}`, "#7dff8a"); burst(p.x, p.y, "#7dff8a", 12, 40); sfx("heal"); writeSave();
  }

  // 劍氣飛行
  for (const s of W0.pshots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.back !== undefined && s.life < s.back && !s.turned) { s.turned = true; s.hit.clear(); }
    if (s.turned) { const a = angTo(s, p); s.vx = Math.cos(a) * 220; s.vy = Math.sin(a) * 220; s.a += dt * 20; if (dist(s, p) < 8) s.life = 0; }
    else if (s.kind === "wind") s.a += dt * 20;
    if (solid(s.x, s.y) && !s.turned) {
      if (s.back !== undefined) { s.turned = true; s.hit.clear(); }
      else if (s.bn > 0) { s.bn--; if (solid(s.x - s.vx * dt, s.y)) s.vy = -s.vy; else s.vx = -s.vx; s.x -= s.vx * dt * -1; s.a = Math.atan2(s.vy, s.vx); } // 彈跳：撞牆折射
      else s.life = 0;
    }
    if (s.ghost) continue; // 別人的招式：只有畫面
    for (const m of W0.mobs) if (s.life > 0 && !m.dead && !s.hit.has(m) && Math.hypot(m.x - s.x, m.y - s.y) < WMOBS[m.type].r + (s.kind === "big" ? 7 : 4)) {
      s.hit.add(m); hitMob(m, wDmg(s.dmg), s.kb, p, true);
      if (B.uq.split && !s.child && !s.split) { // 傳說：分裂成 3 把副劍
        s.split = true;
        for (let i = -1; i <= 1; i++) { const a = s.a + i * 0.7 + rand(-0.1, 0.1); W0.pshots.push({ x: s.x, y: s.y, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240, a, life: 0.45, dmg: s.dmg * 0.5, kind: "sword", pierce: false, kb: 20, child: true, bn: B.uq.bounce ? 2 : 0, hit: new Set([m]) }); }
      }
      if (s.bn > 0) { // 傳說：彈跳到下一隻
        let o = null, bd = 120; for (const n of W0.mobs) if (!n.dead && !s.hit.has(n)) { const dd = dist(n, s); if (dd < bd) { bd = dd; o = n; } }
        if (o) { s.bn--; const a = angTo(s, o), v = Math.hypot(s.vx, s.vy); s.vx = Math.cos(a) * v; s.vy = Math.sin(a) * v; s.a = a; s.life = Math.max(s.life, 0.45); burst(s.x, s.y, "#bfe6ff", 4, 40); continue; }
      }
      if (!s.pierce) { s.life = 0; burst(s.x, s.y, s.kind === "orb" ? "#9fdcff" : "#ffe9a0", 5, 40); }
    }
  }
  W0.pshots = W0.pshots.filter((s) => s.life > 0);
  for (const f of W0.fires) { // 火雨落地
    f.t -= dt;
    if (f.t <= 0) {
      if (!f.ghost) for (const m of W0.mobs) if (!m.dead && dist(m, f) < f.r + WMOBS[m.type].r) hitMob(m, wDmg(f.dmg), 40, f, true);
      if (f.ghost) { if (allyA()) fxBoom(f.x, f.y, f.r * 1.1, "255,150,60"); continue; }
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
    if (!t.ghost) for (const m of W0.mobs) if (!m.dead && dist(m, t) < 40) { const a = angTo(m, t); moveBody(m, Math.cos(a) * 40 * dt, Math.sin(a) * 40 * dt, WMOBS[m.type].r); }
    if (t.tick <= 0 && !t.ghost) { t.tick = 0.25; for (const m of W0.mobs) if (!m.dead && dist(m, t) < 22 + WMOBS[m.type].r) hitMob(m, wDmg(6), 0, t, true); }
    if (Math.random() < 0.7) particles.push({ x: t.x + rand(-6, 6), y: t.y + rand(-4, 4), vx: rand(-30, 30), vy: -50, life: 0.35, max: 0.35, color: "#c8f0e0", size: 2 });
  }
  W0.tornados = W0.tornados.filter((t) => t.t > 0);
  for (const v of W0.voids) { // 引力黑洞：吸怪、持續傷害、最後爆開
    v.t -= dt; v.tick -= dt;
    if (!v.ghost) {
      for (const m of W0.mobs) if (!m.dead && !m.boss && dist(m, v) < 95 && dist(m, v) > 4) { const a = angTo(m, v); moveBody(m, Math.cos(a) * 90 * dt, Math.sin(a) * 90 * dt, WMOBS[m.type].r); }
      if (v.tick <= 0) { v.tick = 0.25; for (const m of W0.mobs) if (!m.dead && dist(m, v) < 40 + WMOBS[m.type].r) hitMob(m, wDmg(7), 0, v, true); }
      if (v.t <= 0) { for (const m of W0.mobs) if (!m.dead && dist(m, v) < 55 + WMOBS[m.type].r) hitMob(m, wDmg(30), 120, v, true); shake = Math.max(shake, 7); sfx("crit"); }
    }
    if (v.t <= 0) { fxBoom(v.x, v.y, 55, "190,140,255"); W0.rings.push({ x: v.x, y: v.y, t: 0, max: 0.4, r: 60, c: "190,150,255", ghost: v.ghost }); }
    if (Math.random() < 0.8) { const a = rand(0, 6.28), r = rand(30, 80); particles.push({ x: v.x + Math.cos(a) * r, y: v.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 2, vy: -Math.sin(a) * r * 2, life: 0.4, max: 0.4, color: v.ghost ? "rgba(200,170,255,0.3)" : "#c9a8ff", size: 1.5 }); }
  }
  W0.voids = W0.voids.filter((v) => v.t > 0);
  W0.orbs = W0.orbs.filter((o) => (o.t -= dt) > 0);
  W0.orbs.forEach((o, i) => { // 環身飛劍
    const a = time * 4 + (i / W0.orbs.length) * Math.PI * 2; o.x = p.x + Math.cos(a) * 24; o.y = p.y - 2 + Math.sin(a) * 18; o.a = a + Math.PI / 2;
    for (const m of W0.mobs) if (!m.dead && dist(m, o) < WMOBS[m.type].r + 5 && (o.hit.get(m) || 0) < time) { o.hit.set(m, time + 0.35); hitMob(m, wDmg(5), 20, p, true); }
  });

  // 怪物：只更新玩家附近的
  let aggro = false;
  const inTown = safeAt(p.x, p.y);
  for (const m of W0.mobs) {
    if (W0.originT > 0) continue; // 起源：時停
    if (m.boss && !m.dead) { aggro = true; if (dotTick(m, dt)) continue; updateWBoss(m, dt, p); continue; }
    if (m.dead || Math.abs(m.x - p.x) > 420 || Math.abs(m.y - p.y) > 420) continue;
    const d = WMOBS[m.type], dp = dist(m, p); let spd = d.spd * B.slow * (m.elite ? 1.1 : 1) * (m.mod === "狂暴" ? 1.4 : 1);
    m.flash = Math.max(0, m.flash - dt); m.atkT -= dt;
    if (dotTick(m, dt)) continue; // 燃燒、中毒；冰凍不能動
    if (m.slowT > 0) { m.slowT -= dt; spd *= 0.45; }
    if (m.kb > 0) { moveBody(m, Math.cos(m.ka) * m.kb * dt * 3, Math.sin(m.ka) * m.kb * dt * 3, d.r); m.kb = Math.max(0, m.kb - dt * 400); continue; }
    const homeD = Math.hypot(m.x - m.camp.x, m.y - m.camp.y);
    if (m.st === "idle") {
      if (dp < 100 && !inTown) { m.st = "chase"; packAggro(m); }
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
        if (dp < d.range && m.atkT <= 0 && !(m.wind > 0)) { m.wind = m.windMax = 0.3; m.atkT = 99; }
        if (m.wind > 0 && (m.wind -= dt) <= 0) {
          m.wind = 0; m.atkT = m.mod === "狂暴" ? 0.9 : 1.4;
          W0.eshots.push({ x: m.x, y: m.y - 3, vx: Math.cos(a) * d.shot, vy: Math.sin(a) * d.shot, life: 2, dmg: mobDmg(m, d), c: m.type === "crow" ? "#ff3a3a" : d.chill ? "#d050ff" : "#ff4aa0", chill: d.chill, ele: !!d.ele }); // 怪物彈幕：亮紅／亮紫
        }
      } else if (d.ai === "bomber") {
        if (m.fuse > 0) {
          m.fuse -= dt;
          if (m.fuse <= 0) { // 爆炸
            burst(m.x, m.y, "#ff8a2e", 30, 140, 0.6); shake = Math.max(shake, 8); sfx("break");
            if (dist(m, p) < 30) hurtW(mobDmg(m, d));
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
            const dmg = mobDmg(m, d);
            if (d.heavy) { // 重擊：砸地一圈
              const cx = m.x + Math.cos(m.wa) * 8, cy = m.y + Math.sin(m.wa) * 8;
              fxBoom(cx, cy, 28, "255,170,90"); shake = Math.max(shake, 4); sfx("break");
              if (Math.hypot(p.x - cx, p.y - cy) < 28) hurtW(dmg, m);
            } else { // 撲咬：往前衝一下
              moveBody(m, Math.cos(m.wa) * 12, Math.sin(m.wa) * 12, d.r); m.lunge = 0.15;
              const diff = Math.abs(((angTo(m, p) - m.wa + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
              if (dist(m, p) < d.r + 13 && diff < 1.1) hurtW(dmg, m);
            }
            m.atkT = (d.heavy ? 1.3 : 0.85) * (m.mod === "狂暴" ? 0.65 : 1);
          }
        } else {
          if (dp > d.r + 4) moveBody(m, Math.cos(a) * spd * dt, Math.sin(a) * spd * dt, d.r);
          if (dp < d.r + (d.heavy ? 20 : 15) && m.atkT <= 0) { m.wind = m.windMax = (d.heavy ? 0.6 : m.elite ? 0.3 : 0.36) * (m.mod === "狂暴" ? 0.75 : 1); m.wa = a; }
        }
        if (m.lunge > 0) m.lunge -= dt;
      }
    }
  }
  // 怪物重生
  for (const c of W0.camps) {
    for (let i = c.respawn.length - 1; i >= 0; i--) { c.respawn[i] -= dt; if (c.respawn[i] <= 0) { c.respawn.splice(i, 1); spawnWMob(c); } }
  }
  for (const m of W0.mobs) { // 驅怪結界：怪物被推出營地
    if (m.dead || m.boss) continue;
    for (const wp of WAYPOINTS) {
      const c = wp.id === "town" ? TOWN : wp, dx = m.x - c.x, dy = m.y - c.y, d = Math.hypot(dx, dy), R = (wp.id === "town" ? TOWN.r + 10 : CAMP_R) + WMOBS[m.type].r;
      if (d < R) { const a = d > 0.1 ? Math.atan2(dy, dx) : rand(0, 6.28); m.x = c.x + Math.cos(a) * R; m.y = c.y + Math.sin(a) * R; if (m.st === "chase") m.st = "home"; }
    }
  }
  W0.mobs = W0.mobs.filter((m) => !m.dead);
  // 敵人的子彈
  for (const s of W0.eshots) {
    if (W0.originT > 0) continue;
    s.x += s.vx * B.slow * dt; s.y += s.vy * B.slow * dt; s.life -= dt;
    if (solid(s.x, s.y) || safeAt(s.x, s.y)) s.life = 0;
    if (Math.hypot(s.x - p.x, s.y - p.y) < (s.big ? 8 : 6) && p.iframe <= 0) { s.life = 0; chillHit = !!s.chill; hurtW(s.dmg, null, s.ele ? "ele" : "spell"); chillHit = false; }
  }
  W0.eshots = W0.eshots.filter((s) => s.life > 0);
  W0.combatT = aggro ? W0.combatT + dt : 0;

  // 撿東西
  for (const o of W0.drops) {
    o.t += dt;
    const d = dist(o, p), mag = 26 * (1 + B.magnet);
    if (o.kind !== "item" && o.kind !== "key" && o.kind !== "gem" && o.kind !== "card" && d < mag) { const a = angTo(o, p); o.x += Math.cos(a) * 180 * dt; o.y += Math.sin(a) * 180 * dt; }
    if (d < 10) {
      o.got = true;
      if (o.kind === "item") { if (W0.zone !== "town" && !o.safe) o.it.risk = 1; grantLoot(o.it, p.x, p.y - 6); }
      else if (o.kind === "stone") { save.stone += o.v; floatText(p.x, p.y - 16, `靈石 +${o.v}`, "#9fe8ff"); sfx("good"); }
      else if (o.kind === "potion") { w.potions = Math.min(B.potMax, w.potions + 1); floatText(p.x, p.y - 16, "丹藥 +1", "#7dff8a"); sfx("heal"); }
      else if (o.kind === "gem") { addGem(o.g); floatText(p.x, p.y - 16, `◆ ${gemName(o.g)}`, GEMS[o.g.split(":")[0]].c, true); sfx("arrive"); }
      else if (o.kind === "card") { addCard(o.c); floatText(p.x, p.y - 16, `🂠 ${CARDS[o.c].n}！`, "#ff9ad8", true); sfx("win"); }
      else if (o.kind === "ess") { addEss(o.k); floatText(p.x, p.y - 16, essName(o.k), "#7dffd8", true); sfx("arrive"); }
      else if (o.kind === "key") { addKey(o.k); floatText(p.x, p.y - 16, `秘境鑰 第 ${o.k.tier} 層`, "#9fe8ff", true); sfx("arrive"); }
      writeSave();
    }
  }
  W0.drops = W0.drops.filter((o) => !o.got && o.t < (o.corpse ? 600 : 120));
  if (W0.grave && ((W0.grave.t -= dt) <= 0 || !W0.drops.some((o) => o.corpse))) W0.grave = null;

  // 地區切換提示、傳送陣解鎖
  const z = zoneAt(p.x, p.y);
  if (z !== W0.zone) { W0.zone = z; W0.bannerT = 2.5; if (z === "town") { w.potions = Math.max(w.potions, B.potMax); bankLoot("回到青雲城"); } }
  W0.bannerT = Math.max(0, W0.bannerT - dt);
  for (const wp of WAYPOINTS) if (!w.wp.includes(wp.id) && dist(wp, p) < CAMP_R) { w.wp.push(wp.id); floatText(p.x, p.y - 30, `點亮飛劍符文：${wp.n}營地`, "#9fe8ff", true); sfx("arrive"); writeSave(); }
  const cp = campAt(p.x, p.y), cid = cp ? cp.id : null;
  if (cid !== (W0.camp || null)) { W0.camp = cid; if (cid) { floatText(p.x, p.y - 44, `進入安全營地・${cp.n}`, "#ffe9a0", true); bankLoot("安全營地"); } else if (W0.zone !== "town") floatText(p.x, p.y - 44, "踏出結界，小心妖獸", "#ff9a7a"); }

  // NPC、傳送陣、祭壇：走過去自動打開
  const spots = worldSpots();
  const bossOn = W0.mobs.some((m) => m.boss);
  const hitSpot = spots.find((s) => dist(s, p) < (s.r || 16) && !(bossOn && s.kind === "altar"));
  if (!hitSpot) W0.npcCool = null;
  else if (W0.npcCool !== hitSpot.id && !inMenu) { W0.npcCool = hitSpot.id; openSpot(hitSpot); return; }

  if (pressed.has("f")) quickSwap();
  spawnHunter(dt);
  if (W0.recall > 0) { // 回城符：原地不動 3 秒
    if (ml > 0.1 || p.hurt > 0) { W0.recall = 0; floatText(p.x, p.y - 26, "回城被打斷", "#ff8a7a"); }
    else {
      W0.recall -= dt;
      if (Math.random() < 0.5) particles.push({ x: p.x + rand(-8, 8), y: p.y + 4, vx: 0, vy: -40, life: 0.5, max: 0.5, color: "#9fe8ff", size: 2 });
      if (W0.recall <= 0) { const to = W0.recallTo || { x: 1200, y: 1530 }; W0.recallTo = null; W0.recall = 0; bankLoot("御劍"); W0.x = to.x; W0.y = to.y; W0.shield = 3; cam.x = W0.x; cam.y = W0.y; burst(W0.x, W0.y, "#9fe8ff", 30, 100); sfx("arrive"); }
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
    body = `焚天石魔的祭壇。<br>建議 Lv.18 以上（你現在 Lv.${w.lv}）。<br>石魔會在這裡現身，用你自己的招式打倒它；看到紅色範圍就閃開。<br>打贏掉 4 件好裝（直接安全）＋寶石。`;
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
  if (f) f.onclick = () => { worldReturn(); startWorldBossField(); };
}
function worldReturnTo() { /* renderEquip／renderMaps 的「返回」會看 inWorld 回到大世界 */ }
function renderAP() {
  const w = save.w;
  B = worldStats();
  const pc = (v) => Math.round(v * 100) + "%", en = expNext(w.lv), j = typeof jobLv === "function" ? jobLv() : 0;
  const row = (k, v, c = "") => `<div class="sr${c}"><span>${k}</span><b>${v}</b></div>`;
  const left = row("名稱", w.nick || myName()) + row("招式", `${WEAPONS[curWeapon()].job}（${WEAPONS[curWeapon()].n}）`)
    + row("英雄", typeof HEROES !== "undefined" && HEROES[w.hero] ? HEROES[w.hero].n : "時空浪人") + row("轉職", j && typeof JOBS !== "undefined" ? JOBS[j - 1].n : "未轉職")
    + row("等級", w.lv) + row("生命", B.maxHp, " hp") + row("真氣", B.maxMp, " mp") + row("經驗", `${w.exp} / ${en}（${Math.floor(w.exp / en * 100)}%）`) + row("戰力", totalCP());
  const aps = Object.keys(AP).map((k) => `<div class="sr ap"><span title="每點 ${AP[k].d}">${AP[k].n.split(" ")[0]}</span><b>${w.ap[k]}</b><button class="apb" data-k="${k}" data-n="1" ${w.free ? "" : "disabled"}>＋</button><button class="apb" data-k="${k}" data-n="5" ${w.free >= 5 ? "" : "disabled"}>＋5</button><small>${AP[k].d}</small></div>`).join("");
  const right = row("攻擊", "×" + B.atk.toFixed(2)) + row("爆擊率", pc(B.crit || 0)) + row("爆擊傷害", pc(B.critDmg || 2)) + row("攻擊速度", pc(B.aspd || 1)) + row("移動速度", pc(B.spdMul || 1))
    + row("護甲", Math.round(B.armor || 0)) + row("閃避", pc(B.dodge || 0)) + row("法術壓制", pc(B.supp || 0)) + row("元素抗性", pc(B.res || 0)) + row("能量護盾", B.maxEs || 0) + row("吸血", pc(B.leech || 0)) + row("真氣回復", (B.mpRegen || 0).toFixed(1) + "/秒");
  screenEl.innerHTML = `<div class="panel wide equip charwin"><div class="winhead">角色資料</div>
    <div class="cw2"><div class="stbox"><div class="stl">${left}</div><div class="stl aps">${aps}</div>
      <div class="apfoot"><span>能力點</span><b>${w.free}</b><button id="apReset" class="sbtn">重新配點 −${20 * w.lv} 靈石</button></div></div>
      <div class="stbox"><div class="stl">${right}</div><p class="sub">招式跟著武器走：${WEAPONS[curWeapon()].d}</p></div></div>
    ${fashionHtml()}
    <div class="btns"><button id="close" class="big">離開</button></div></div>`;
  screenEl.classList.remove("hidden");
  screenEl.querySelectorAll(".apb").forEach((b) => b.addEventListener("click", () => { const n = Math.min(+b.dataset.n, w.free); if (!n) return; w.free -= n; w.ap[b.dataset.k] += n; writeSave(); sfx("good"); renderAP(); }));
  document.getElementById("apReset").onclick = () => {
    const c = 20 * w.lv; if (save.stone < c) { sfx("bad"); return; }
    save.stone -= c; for (const k in w.ap) { w.free += w.ap[k]; w.ap[k] = 0; } writeSave(); renderAP();
  };
  document.getElementById("close").onclick = worldReturn;
  bindFashion();
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
    else if (t === 4 && z === "snow") { ctx.fillStyle = "#8fc4e8"; ctx.fillRect(x, y, TS, TS); ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.fillRect(x + 2 + v * 8, y + 3, 4, 1); ctx.fillRect(x + 4, y + 10 - v * 4, 2, 1); }
    else if (t === 4) { ctx.fillStyle = "#2a4a7a"; ctx.fillRect(x, y, TS, TS); ctx.fillStyle = "rgba(160,200,255,0.3)"; ctx.fillRect(x + ((time * 6 + v * 16) % 14), y + 6, 3, 1); }
    else if (t === 5) drawWallTile(x, y);
    else if (t === 6) drawHouseTile(x, y, tx, ty);
  }
  // 安全營地、祭壇
  drawCamps();
  ctx.fillStyle = "#4a2a2a"; ctx.beginPath(); ctx.ellipse(ALTAR.x, ALTAR.y, 26, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `rgba(255,80,40,${0.5 + Math.sin(time * 4) * 0.3})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(ALTAR.x, ALTAR.y, 20, 10, 0, 0, Math.PI * 2); ctx.stroke();
  drawFxUnder();
  drawWBZones();
  // 掉落物
  for (const o of W0.drops) {
    if (Math.abs(o.x - cam.x) > hw || Math.abs(o.y - cam.y) > hh) continue;
    if (o.kind === "item") { // 掉落標籤：品質越高越顯眼；仙品以上有衝天光柱
      const q = o.it.q, c = RARITY[q].c, hgt = 12 + q * 9;
      if (q >= 2) {
        const bh = q === 3 ? 160 : 70, pw = q === 3 ? 7 : 4, g = ctx.createLinearGradient(0, o.y - bh, 0, o.y);
        g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, c);
        ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.45 + 0.2 * Math.sin(time * 5 + o.x);
        ctx.fillStyle = g; ctx.fillRect(o.x - pw / 2, o.y - bh, pw, bh); ctx.fillRect(o.x - pw, o.y - bh * 0.6, pw * 2, bh * 0.6);
        ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.ellipse(o.x, o.y, 9 + Math.sin(time * 6) * 2, 4, 0, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); ctx.restore();
      } else { ctx.globalAlpha = 0.25 + 0.15 * Math.sin(time * 4 + o.x); ctx.fillStyle = c; ctx.fillRect(o.x - 1.5, o.y - hgt, 3, hgt); ctx.globalAlpha = 1; }
      ctx.fillStyle = "#1b1424"; ctx.fillRect(o.x - 3, o.y - 3, 6, 6); ctx.fillStyle = c; ctx.fillRect(o.x - 2, o.y - 2, 4, 4);
      ctx.font = `${q >= 2 ? 900 : "bold"} ${q >= 2 ? 7 : 6}px 'Noto Sans TC', sans-serif`; ctx.textAlign = "center";
      const tw = ctx.measureText(o.it.name).width, lh = q >= 2 ? 10 : 8, ly = o.y - hgt - lh;
      ctx.fillStyle = q >= 2 ? c : "rgba(0,0,0,0.75)"; ctx.fillRect(o.x - tw / 2 - 3, ly, tw + 6, lh);
      if (q >= 2) { ctx.fillStyle = "rgba(20,10,0,0.55)"; ctx.fillRect(o.x - tw / 2 - 2, ly + 1, tw + 4, lh - 2); }
      ctx.fillStyle = q >= 2 ? "#fff" : q === 0 ? "#c8c0d0" : c; ctx.fillText(o.it.name, o.x, ly + lh - 2.5);
    } else if (o.kind === "stone") { ctx.fillStyle = "#9fe8ff"; ctx.fillRect(o.x - 2, o.y - 2, 4, 4); }
    else if (o.kind === "potion") { ctx.fillStyle = "#ff6b8a"; ctx.fillRect(o.x - 2, o.y - 3, 4, 5); ctx.fillStyle = "#fff"; ctx.fillRect(o.x - 1, o.y - 4, 2, 1); }
    else if (o.kind === "card" || o.kind === "ess") { // 卡片：粉紫卡＋光柱；精髓：青色晶體
      const c = o.kind === "card" ? "#ff9ad8" : "#7dffd8", by = o.y - 3 + Math.sin(time * 4 + o.x) * 1.5;
      ctx.globalAlpha = 0.35; ctx.fillStyle = c; ctx.fillRect(o.x - 1, o.y - (o.kind === "card" ? 40 : 18), 2, o.kind === "card" ? 40 : 18); ctx.globalAlpha = 1;
      if (o.kind === "card") { ctx.fillStyle = "#2a1830"; ctx.fillRect(o.x - 3, by - 4, 6, 8); ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.strokeRect(o.x - 3, by - 4, 6, 8); }
      else { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(o.x, by - 4); ctx.lineTo(o.x + 3, by); ctx.lineTo(o.x, by + 4); ctx.lineTo(o.x - 3, by); ctx.fill(); }
      ctx.font = "bold 6px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = c; ctx.fillText(o.kind === "card" ? CARDS[o.c].n : essName(o.k), o.x, by - 7);
    }
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
  if (typeof othersList === "function") for (const o of othersList()) if (Math.abs(o.x - cam.x) < hw && Math.abs(o.y - cam.y) < hh) objs.push({ y: o.y, op: o });
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
    else if (o.op) drawOther(o.op);
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
        drawMyName(p);
      }
    }
  }
  for (const v of W0.voids) { // 黑洞
    ctx.globalAlpha = v.ghost ? allyA() : 1;
    const q = Math.min(1, (v.max - v.t) * 4), R = 30 * q, g = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, R);
    g.addColorStop(0, "rgba(0,0,0,0.95)"); g.addColorStop(0.6, "rgba(30,10,60,0.8)"); g.addColorStop(1, "rgba(120,80,220,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(v.x, v.y, R, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = "rgba(190,150,255,0.8)"; ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(v.x, v.y, R * (0.5 + i * 0.22), time * (6 + i) + i, time * (6 + i) + i + 2); ctx.stroke(); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  for (const o of W0.orbs) { if (o.x === undefined) continue; ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.a); glow(0, 0, 7, "150,210,255", 0.5); ctx.fillStyle = "#e8f4ff"; ctx.fillRect(-5, -1, 9, 2); ctx.fillStyle = "#ffd84a"; ctx.fillRect(-6, -2, 2, 4); ctx.restore(); }
  for (const s of W0.pshots) {
    ctx.globalAlpha = s.ghost ? allyA() : 1;
    if (s.kind === "sword") { // 劍氣：月牙＋拖尾
      drawTrail(s, "160,210,255", 5);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.translate(s.x, s.y); ctx.rotate(s.a);
      ctx.strokeStyle = "rgba(160,210,255,0.6)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-4, 0, 8, -1.1, 1.1); ctx.stroke();
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(-4, 0, 8, -1, 1); ctx.stroke(); ctx.restore();
    }
    else if (s.kind === "orb") { drawTrail(s, "140,210,255", 4); glow(s.x, s.y, 9, "140,210,255", 0.7); ctx.fillStyle = "#eaf6ff"; ctx.beginPath(); ctx.arc(s.x, s.y, 2.2, 0, Math.PI * 2); ctx.fill(); }
    else if (s.kind === "wind") { drawTrail(s, "160,255,200", 3); ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.translate(s.x, s.y); ctx.rotate(s.a); ctx.strokeStyle = "rgba(160,255,200,0.9)"; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI * 2 / 3); ctx.beginPath(); ctx.arc(0, 0, 6, 0, 1.4); ctx.stroke(); } ctx.restore(); }
    else if (s.kind === "fireball") { drawTrail(s, "255,210,90", 6); glow(s.x, s.y, 10, "255,215,100", 0.8); ctx.fillStyle = "#ffe066"; ctx.beginPath(); ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2); ctx.fill(); }
    else if (s.kind === "big") { drawTrail(s, "255,230,120", 6); glow(s.x, s.y, 12, "255,230,120", 0.6); drawArrow(s, 1.8); }
    else if (s.kind === "arrow") { drawTrail(s, "255,240,200", 1.5); drawArrow(s, 1); }
    else { const L = s.kind === "big" ? 14 : 7; ctx.strokeStyle = s.kind === "big" ? "#ffe066" : "#f3eada"; ctx.lineWidth = s.kind === "big" ? 3 : 1.2;
      ctx.beginPath(); ctx.moveTo(s.x - Math.cos(s.a) * L, s.y - Math.sin(s.a) * L); ctx.lineTo(s.x, s.y); ctx.stroke(); }
  }
  ctx.globalAlpha = 1;
  for (const f of W0.fires) {
    if (f.ghost && !allyA()) continue;
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
    if (t.ghost && allyA() < 0.5) continue;
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
  for (const s of W0.eshots) {
    if (s.big) { glow(s.x, s.y, 9, "255,110,40", 0.7); ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(s.x, s.y, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#fff6c0"; ctx.fillRect(s.x - 1, s.y - 1, 2, 2); continue; }
    ctx.fillStyle = s.c; ctx.fillRect(s.x - 2.5, s.y - 2.5, 5, 5); ctx.fillStyle = "#fff6c0"; ctx.fillRect(s.x - 1, s.y - 1, 2, 2);
  }
  drawShield();
  drawFxOver();
  drawFx();
  drawWorldHud();
  drawWBossBar();
}
function drawWMob(m) {
  if (m.boss) { drawWBoss(m); return; }
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
  const lab = `${m.elite && !m.hunter ? (m.mod || "") + "精英 " : ""}${d.n}${d.sz ? `（${SZ_N[d.sz]}）` : ""} Lv.${m.lv}`, fc = ctx.fillStyle;
  ctx.lineWidth = 1.6; ctx.lineJoin = "round"; ctx.strokeStyle = "rgba(20,14,30,0.85)"; ctx.strokeText(lab, m.x, m.y - d.r * sc - 9);
  ctx.fillStyle = fc; ctx.fillText(lab, m.x, m.y - d.r * sc - 9);
}
let miniRect = null;
cvs.addEventListener("pointerdown", (e) => { // 點小地圖：開／關大地圖
  if (state !== "world") return;
  if (bigMap) { bigMap = false; return; }
  const r = miniRect; if (r && e.clientX >= r.x && e.clientX <= r.x + r.w && e.clientY >= r.y && e.clientY <= r.y + r.h + 16) openStarMap();
});
function drawBigMap() { // 半透明大地圖蓋在畫面中間，邊打邊看
  const p = W0, w = save.w, bw = Math.min(W - 40, (H - 150) * TW / TH), bh = bw * TH / TW, bx = (W - bw) / 2, by = 50 + SAFE.t, sc = bw / (TW * TS);
  ctx.globalAlpha = 0.78; ctx.fillStyle = "#0e0a16"; ctx.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
  const cols = 60, rows = 34;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = (i + 0.5) / cols * TW * TS, y = (j + 0.5) / rows * TH * TS, z = zoneAt(x, y);
    ctx.fillStyle = z === "snow" ? "#8a98ac" : ZONES[z].g[0]; ctx.fillRect(bx + i * bw / cols, by + j * bh / rows, bw / cols + 0.5, bh / rows + 0.5);
  }
  ctx.globalAlpha = 1;
  ctx.font = "bold 11px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
  for (const wp of WAYPOINTS) {
    const on = w.wp.includes(wp.id), x = bx + wp.x * sc, y = by + wp.y * sc;
    ctx.fillStyle = on ? "#9fe8ff" : "#666"; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = "#0e0a16"; ctx.strokeText(wp.n, x, y - 8); ctx.fillStyle = on ? "#fff" : "#9a90a8"; ctx.fillText(wp.n, x, y - 8);
  }
  ctx.fillStyle = "#ff4a2a"; ctx.fillRect(bx + ALTAR.x * sc - 3, by + ALTAR.y * sc - 3, 6, 6);
  const qt = questTarget(); if (qt) { ctx.strokeStyle = "#ffe066"; ctx.lineWidth = 2; ctx.strokeRect(bx + qt.x * sc - 7, by + qt.y * sc - 7, 14, 14); }
  for (const m of W0.mobs) if ((m.elite || m.boss) && !m.dead) { ctx.fillStyle = m.boss ? "#ff2a2a" : "#ff6b4a"; ctx.fillRect(bx + m.x * sc - 2, by + m.y * sc - 2, 4, 4); }
  if (typeof othersList === "function") { ctx.fillStyle = "#7dff8a"; for (const o of othersList()) ctx.fillRect(bx + o.x * sc - 2, by + o.y * sc - 2, 4, 4); }
  ctx.fillStyle = Math.floor(time * 4) % 2 ? "#fff" : "#ffe066"; ctx.beginPath(); ctx.arc(bx + p.x * sc, by + p.y * sc, 4, 0, Math.PI * 2); ctx.fill();
  ctx.font = "10px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#cfc4dc"; ctx.fillText(`${TOUCH ? "點一下畫面" : "Tab"} 關閉　黃框＝任務　紅點＝精英`, W / 2, by + bh + 14);
}
function drawWorldHud() {
  const p = W0, w = save.w;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (W0.zone === "snow") { // 下雪
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (let i = 0; i < 70; i++) {
      const sp = 0.5 + hash(i * 3.7), x = ((hash(i) * W + Math.sin(time * 0.8 + i) * 12 - cam.x * 0.6) % W + W) % W, y = ((hash(i * 9.1) * H + time * 38 * sp - cam.y * 0.6) % H + H) % H;
      ctx.fillRect(x, y, sp > 1.1 ? 3 : 2, sp > 1.1 ? 3 : 2);
    }
  }
  // 小地圖（右上，在按鈕列下面）
  const mw = Math.min(104, W * 0.26), mh = mw * (TH / TW), mx0 = W - mw - 12 - SAFE.r, my0 = 58 + SAFE.t, sc = mw / (TW * TS);
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(mx0 - 2, my0 - 2, mw + 4, mh + 4);
  for (let j = 0; j < 14; j++) for (let i = 0; i < 20; i++) {
    const z = zoneAt((i + 0.5) / 20 * TW * TS, (j + 0.5) / 14 * TH * TS);
    ctx.fillStyle = z === "snow" ? "#8a98ac" : ZONES[z].g[0]; ctx.fillRect(mx0 + i * mw / 20, my0 + j * mh / 14, mw / 20 + 0.5, mh / 14 + 0.5);
  }
  for (const wp of WAYPOINTS) { ctx.fillStyle = w.wp.includes(wp.id) ? "#9fe8ff" : "#555"; ctx.fillRect(mx0 + wp.x * sc - 1.5, my0 + wp.y * sc - 1.5, 3, 3); }
  ctx.fillStyle = "#ff4a2a"; ctx.fillRect(mx0 + ALTAR.x * sc - 2, my0 + ALTAR.y * sc - 2, 4, 4);
  const qt = questTarget();
  if (qt) { ctx.strokeStyle = "#ffe066"; ctx.lineWidth = 1; ctx.strokeRect(mx0 + qt.x * sc - 3, my0 + qt.y * sc - 3, 6, 6); }
  const ol = typeof othersList === "function" ? othersList() : [];
  ctx.fillStyle = "#7dff8a"; for (const o of ol) ctx.fillRect(mx0 + o.x * sc - 1, my0 + o.y * sc - 1, 2.5, 2.5);
  for (const m of W0.mobs) if ((m.elite || m.boss) && !m.dead) { ctx.fillStyle = m.boss ? "#ff2a2a" : "#ff6b4a"; const r = m.boss ? 4 : 2.5; ctx.fillRect(mx0 + m.x * sc - r / 2, my0 + m.y * sc - r / 2, r, r); }
  miniRect = { x: mx0 - 2, y: my0 - 2, w: mw + 4, h: mh + 4 };
  ctx.fillStyle = "#fff"; ctx.fillRect(mx0 + p.x * sc - 1.5, my0 + p.y * sc - 1.5, 3, 3);
  ctx.font = "bold 10px 'Noto Sans TC', sans-serif"; ctx.textAlign = "right"; ctx.fillStyle = "#cfc4dc";
  ctx.fillText(ZONES[W0.zone || "town"].n, mx0 + mw, my0 + mh + 13);
  if (typeof NET_ON !== "undefined" && NET_ON) { ctx.textAlign = "left"; ctx.fillStyle = "#7dff8a"; ctx.fillText(`● 線上 ${ol.length + 1} 人`, mx0, my0 + mh + 13); }
  // 左上：頭像、等級、生命、真氣
  const x0 = 10 + SAFE.l, y0 = 10 + SAFE.t;
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
  ctx.font = "9px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#a99bb8"; ctx.fillText(`靈石 ${save.stone}　丹藥 ${w.potions}`, bx, y0 + 22);
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
  ctx.fillText(`經驗 ${Math.floor(ef * 100)}%`, W / 2, H - 10);
  drawOrbs();
  // 地區名稱
  if (W0.bannerT > 0) {
    const z = ZONES[W0.zone];
    ctx.globalAlpha = Math.min(1, W0.bannerT * 2);
    ctx.textAlign = "center"; ctx.font = "900 22px 'Noto Sans TC', sans-serif";
    ctx.fillStyle = "#1b1424"; ctx.fillText(z.n, W / 2 + 2, H * 0.3 + 2); ctx.fillStyle = "#ffe0b0"; ctx.fillText(z.n, W / 2, H * 0.3);
    ctx.font = "bold 13px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#cfc4dc";
    const sub = W0.zone === "town" ? "安全區・補滿丹藥、帶回裝備" : W0.zone === "snow" ? `妖獸 Lv.${z.lv[0]}–${z.lv[1]}・被打中會凍傷變慢` : `妖獸 Lv.${z.lv[0]}–${z.lv[1]}`;
    ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.strokeStyle = "#1b1424"; ctx.strokeText(sub, W / 2, H * 0.3 + 22); ctx.fillText(sub, W / 2, H * 0.3 + 22);
    ctx.globalAlpha = 1;
  }
  drawTut();
  if (p.hp < p.maxHp * 0.3) { // 低血量：螢幕邊緣泛紅閃
    const a = 0.35 + 0.25 * Math.sin(time * 8), g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.7);
    g.addColorStop(0, "rgba(255,0,0,0)"); g.addColorStop(1, `rgba(220,20,20,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if ((W0.kc || 0) >= 3) { // 連斬計數（右邊，小地圖下面）
    const cx = W - 70 - SAFE.r, cy = 58 + SAFE.t + Math.min(104, W * 0.26) * (TH / TW) + 52, pop = 1 + Math.max(0, W0.kcPop) * 1.6;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop);
    ctx.textAlign = "center"; ctx.font = "900 26px 'Noto Sans TC', sans-serif"; ctx.lineWidth = 5; ctx.lineJoin = "round"; ctx.strokeStyle = "#1b1424";
    const col = W0.kc >= 50 ? "#ff4a3a" : W0.kc >= 20 ? "#ff8a3d" : "#ffe066";
    ctx.strokeText(W0.kc, 0, 0); ctx.fillStyle = col; ctx.fillText(W0.kc, 0, 0);
    ctx.font = "bold 11px 'Noto Sans TC', sans-serif"; ctx.lineWidth = 3; ctx.strokeText("連斬", 0, 14); ctx.fillStyle = "#fff"; ctx.fillText("連斬", 0, 14);
    ctx.restore();
    const b = kcBonus();
    ctx.textAlign = "center"; ctx.font = "bold 10px 'Noto Sans TC', sans-serif"; ctx.lineWidth = 3; ctx.strokeStyle = "#1b1424";
    const bt = b > 0 ? `傷害 +${Math.round(b * 100)}%` : "5 連斬起傷害提升"; ctx.strokeText(bt, cx, cy + 28); ctx.fillStyle = b > 0 ? "#ffb070" : "#cfc4dc"; ctx.fillText(bt, cx, cy + 28);
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(cx - 30, cy + 33, 60, 4); ctx.fillStyle = col; ctx.fillRect(cx - 30, cy + 33, 60 * (W0.kcT / KC_WIN), 4);
  }
  if (bigMap) drawBigMap();
  if (time < 6 && w.lv === 1 && w.exp === 0 && w.tut === undefined) {
    ctx.textAlign = "center"; ctx.font = "bold 13px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#fff";
    ctx.fillText(TOUCH ? "左邊拖曳移動，右下按鈕出招" : "WASD 移動　J／K／U 出招　空白 閃身　H 丹藥", W / 2, H * 0.62);
    ctx.fillText(W < 500 ? "照左上角的任務走" : "照左上角的任務走，越北邊的妖獸越強", W / 2, H * 0.62 + 20);
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
    if (el) el.style.transform = `scaleY(${p.cds[k] / (WSKILL[k].cd * (k === "roll" ? B.rollCd : 1) * ((B.skCd && B.skCd[k]) || 1))})`;
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
  { t: "往東過雪山山口，找到寒霜雪域傳送陣", k: "wp", id: "snow", n: 1, item: 1 },
  { t: "寒霜雪域斬妖 25 隻（小心凍傷）", k: "kill", z: "snow", n: 25 },
  { t: "升到 Lv.26", k: "lv", n: 26, item: 2 },
  { t: "寒霜雪域斬殺精英 3 隻", k: "elite", z: "snow", n: 3, item: 2 },
];
function curQuest() {
  const w = save.w;
  if (!w) return null;
  w.q = w.q || 0; w.qp = w.qp || 0;
  if (w.q < QUESTS.length) return { ...QUESTS[w.q], main: true };
  // 懸賞：在適合自己等級的地區斬妖
  const z = ["snow", "volcano", "waste", "forest", "grass"].find((k) => w.lv >= ZONES[k].lv[0]) || "grass";
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
  if (save.w.ws && save.w.ws.some(Boolean)) { for (let i = 1; i <= 2; i++) { const j = (save.w.wi + i) % 3; if (save.w.ws[j]) { switchW(j); return; } } } // 有武器組就輪流切
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
  hudEl.classList.add("hidden"); // 功能都收進右上角「☰」和快捷鍵
  if (!on || !save.w) return;
  hudEl.querySelector('[data-h="bag"]').classList.toggle("dot", save.bag.some((b) => sameWt(b) && itemCP(b) > itemCP(save.eq[b.slot])));
  hudEl.querySelector('[data-h="ap"]').classList.toggle("dot", save.w.free > 0);
}
const riskyItems = () => save.bag.filter((b) => b.risk).concat(SLOT_KEYS.map((k) => save.eq[k]).filter((b) => b && b.risk), ((save.w && save.w.ws) || []).filter((b) => b && b.risk));
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
hudEl.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => openHud(b.dataset.h)));
// 電腦快捷鍵：I 背包、O 角色、T 傳送、R 排行、Q 換武器、M／Tab 大地圖
window.addEventListener("keydown", (e) => {
  if (e.target && e.target.tagName === "INPUT") return;
  const k = e.key.toLowerCase(), map = { i: "bag", b: "bag", o: "ap", c: "ap", n: "skill", t: "tp", m: "tp", tab: "tp", r: "rank", f: "swap" };
  if (k === "tab") e.preventDefault();
  if (state !== "world" || e.repeat) return;
  if (map[k]) openHud(map[k]);

});
let bigMap = false;
function openHud(h) {
  if (state !== "world") return;
  sfx("click");
  if (h === "bag") { eqSel = null; renderEquip(); }
  else if (h === "ap") { pausedFrom = "world"; state = "pick"; pad.classList.add("hidden"); renderAP(); }
  else if (h === "swap") quickSwap();
  else if (h === "skill") { pausedFrom = "world"; state = "pick"; pad.classList.add("hidden"); renderSkills(); }
  else if (h === "rank") { pausedFrom = "world"; state = "pick"; pad.classList.add("hidden"); renderRank(); }
  else if (h === "menu") openMenu();
  else openStarMap();
}
