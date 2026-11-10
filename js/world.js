// 御劍渡劫（pixel-raid）— 仙界大世界：一張可以自由探索的地圖（城鎮、四個野外地區、傳送陣、世界王祭壇）
// 玩法：自己放技能打怪 → 升等配點 → 撿裝備變強 → 往北走打更強的怪 → 火山祭壇挑戰焚天石魔
"use strict";

const TS = 16, TW = 300, TH = 112; // 一格 16 單位，地圖 4800×1792（x 2400 以東雪域；3200 以東南沼澤、北雷霆峽谷；4000 以東天外仙域）
const TOWN = { x: 1200, y: 1520, r: 120 };
const ZONES = {
  town: { n: "青雲城", lv: [0, 0], g: ["#4a4458", "#433e52"] },
  grass: { n: "靈草原", lv: [1, 6], g: ["#2f4a2c", "#2b4429"], mobs: ["imp", "imp", "wolf"] },
  forest: { n: "幽暗森林", lv: [6, 12], g: ["#1d3326", "#1a2e22"], mobs: ["wolf", "treant", "treant", "imp", "witch"] },
  waste: { n: "亂石荒原", lv: [11, 17], g: ["#4a4034", "#443a2f"], mobs: ["golem", "bomber", "wolf", "shield"] },
  volcano: { n: "焚天火山", lv: [16, 24], g: ["#3a2424", "#342020"], mobs: ["crow", "lava", "bomber", "rusher"] },
  snow: { n: "寒霜雪域", lv: [22, 30], g: ["#c4d0de", "#b8c6d6"], mobs: ["frostwolf", "frostwolf", "icewisp", "yeti", "healer"] },
  swamp: { n: "幽冥沼澤", lv: [30, 50], g: ["#2a3328", "#263024"], mobs: ["toad", "toad", "bonewolf", "bogtree", "witch"] },
  thunder: { n: "雷霆峽谷", lv: [48, 75], g: ["#363448", "#312f42"], mobs: ["thawk", "thawk", "tgolem", "twisp", "shield", "rusher"] },
  sky: { n: "天外仙域", lv: [72, 120], g: ["#5a5a80", "#55557a"], mobs: ["crane", "skyfox", "skyfox", "guardian", "jianling", "healer"] },
};
const EN_FULL = 100; // 天罰能量
const SNOW_X = 2400, SNOW_PASS = { x: 2400, y: 640 }; // 雪域在東邊，只有一個山口能過去
const EAST_X = 3200, SKY_X = 4000, MID_Y = 896; // 雪域再往東：沼澤（南）、雷霆峽谷（北），最東天外仙域
const PASS2 = { x: 3200, y: 1300 }, PASS3 = { x: 3600, y: 896 }, PASS4 = { x: 4000, y: 420 };
const PASSES = [SNOW_PASS, PASS2, PASS3, PASS4];
function zoneAt(x, y) {
  if (Math.hypot(x - TOWN.x, y - TOWN.y) < TOWN.r + 10) return "town";
  if (x >= SKY_X) return "sky";
  if (x >= EAST_X) return y < MID_Y ? "thunder" : "swamp";
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
  { id: "swamp", n: "幽冥沼澤", x: 3560, y: 1450 },
  { id: "thunder", n: "雷霆峽谷", x: 3480, y: 640 },
  { id: "sky", n: "天外仙域", x: 4170, y: 470 },
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
// 換色：色相轉 dh 度、飽和度 ×sat、亮度 ×lum（每隻怪只算一次）
const RC = {};
function recolor(src, dh, sat, lum) {
  const c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
  const g = c.getContext("2d"); g.drawImage(src, 0, 0);
  const im = g.getImageData(0, 0, c.width, c.height), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    let r = d[i] / 255, gg = d[i + 1] / 255, b = d[i + 2] / 255;
    const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b); let h = 0, s2 = 0, l = (mx + mn) / 2;
    if (mx !== mn) { const dd = mx - mn; s2 = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn); h = mx === r ? (gg - b) / dd + (gg < b ? 6 : 0) : mx === gg ? (b - r) / dd + 2 : (r - gg) / dd + 4; h /= 6; }
    h = (h + dh / 360) % 1; s2 = Math.min(1, s2 * sat); l = Math.min(0.95, l * lum);
    const q = l < 0.5 ? l * (1 + s2) : l + s2 - l * s2, p = 2 * l - q;
    const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    d[i] = f(h + 1 / 3) * 255; d[i + 1] = f(h) * 255; d[i + 2] = f(h - 1 / 3) * 255;
  }
  g.putImageData(im, 0, 0); return c;
}
const WMOBS = {
  imp: { n: "小妖", img: () => MOB, hp: 30, spd: 34, dmg: 6, r: 6, exp: 4, ai: "melee", sz: "S", race: "B" },
  wolf: { n: "狼妖", img: () => WOLF, hp: 42, spd: 64, dmg: 7, r: 6, exp: 6, ai: "melee", mv: "pounce", sz: "M", race: "B" },
  treant: { n: "樹妖", img: () => TREANT, hp: 40, spd: 24, dmg: 7, r: 7, exp: 7, ai: "ranged", range: 150, shot: 90, sh: "spread", sz: "M", race: "P" },
  golem: { n: "石甲妖", img: () => GOLEM, hp: 140, spd: 22, dmg: 16, r: 8, exp: 14, ai: "melee", mv: "charge", armor: 0.3, heavy: true, sz: "L", race: "R" },
  bomber: { n: "爆石靈", img: () => BOMBER, hp: 32, spd: 58, dmg: 26, r: 6, exp: 10, ai: "bomber", sz: "S", race: "R" },
  crow: { n: "火鴉", img: () => CROW, hp: 55, spd: 72, dmg: 9, r: 6, exp: 14, ai: "ranged", range: 170, shot: 125, sh: "lead", sz: "S", race: "B", ele: "F" },
  lava: { n: "熔岩獸", img: () => LAVA, hp: 230, spd: 30, dmg: 22, r: 9, exp: 26, ai: "melee", armor: 0.3, heavy: true, sz: "L", race: "R", ele: "F" },
  frostwolf: { n: "霜狼", img: () => FROSTWOLF, hp: 64, spd: 78, dmg: 10, r: 6, exp: 18, ai: "melee", mv: "pounce", chill: true, sz: "M", race: "B", ele: "W" },
  icewisp: { n: "冰靈", img: () => ICEWISP, hp: 58, spd: 40, dmg: 10, r: 6, exp: 18, ai: "ranged", range: 180, shot: 75, sh: "split", chill: true, sz: "S", ele: "W" },
  yeti: { n: "雪巨猿", img: () => YETI, hp: 300, spd: 30, dmg: 26, r: 9, exp: 34, ai: "melee", mv: "charge", armor: 0.25, heavy: true, chill: true, sz: "L", race: "B", ele: "W" },
  // 東邊三區：用舊怪的骨架換顏色（recolor），數值和經驗比較高
  toad: { n: "毒沼蟾", img: () => RC.toad || (RC.toad = recolor(MOB, 150, 1.1, 0.8)), hp: 46, spd: 40, dmg: 11, r: 6, exp: 30, ai: "melee", sz: "S", race: "B", ele: "P" },
  bonewolf: { n: "屍骨狼", img: () => RC.bonewolf || (RC.bonewolf = recolor(WOLF, 0, 0.15, 1.35)), hp: 70, spd: 80, dmg: 12, r: 6, exp: 32, ai: "melee", mv: "pounce", sz: "M", race: "B", ele: "P" },
  bogtree: { n: "腐沼樹妖", img: () => RC.bogtree || (RC.bogtree = recolor(TREANT, 60, 0.7, 0.75)), hp: 64, spd: 24, dmg: 11, r: 7, exp: 32, ai: "ranged", range: 170, shot: 95, lob: true, sz: "M", race: "P", ele: "P" },
  thawk: { n: "雷鷹", img: () => RC.thawk || (RC.thawk = recolor(CROW, 200, 1.2, 1.1)), hp: 70, spd: 84, dmg: 12, r: 6, exp: 36, ai: "dive", range: 130, sz: "S", race: "B", ele: "T" },
  tgolem: { n: "雷甲巨像", img: () => RC.tgolem || (RC.tgolem = recolor(GOLEM, 210, 1.3, 1.0)), hp: 320, spd: 26, dmg: 28, r: 9, exp: 60, ai: "melee", mv: "charge", armor: 0.35, heavy: true, sz: "L", race: "R", ele: "T" },
  twisp: { n: "雷靈", img: () => RC.twisp || (RC.twisp = recolor(ICEWISP, 260, 1.4, 1.2)), hp: 62, spd: 46, dmg: 12, r: 6, exp: 36, ai: "ranged", range: 200, shot: 190, sh: "burst", sz: "S", ele: "T" },
  crane: { n: "仙鶴妖", img: () => RC.crane || (RC.crane = recolor(CROW, 0, 0.1, 1.9)), hp: 80, spd: 90, dmg: 13, r: 6, exp: 44, ai: "ranged", range: 200, shot: 140, sh: "orbit", sz: "S", race: "B", ele: "W" },
  skyfox: { n: "天狐", img: () => RC.skyfox || (RC.skyfox = recolor(WOLF, 30, 1.3, 1.6)), hp: 84, spd: 90, dmg: 14, r: 6, exp: 44, ai: "melee", mv: "blink", sz: "M", race: "B", ele: "F" },
  guardian: { n: "天兵石像", img: () => RC.guardian || (RC.guardian = recolor(GOLEM, 40, 1.4, 1.5)), hp: 380, spd: 28, dmg: 32, r: 9, exp: 80, ai: "melee", armor: 0.4, heavy: true, sz: "L", race: "R", ele: "T" },
  jianling: { n: "劍靈", img: () => RC.jianling || (RC.jianling = recolor(ICEWISP, 0, 0.2, 1.8)), hp: 74, spd: 52, dmg: 14, r: 6, exp: 44, ai: "ranged", range: 220, shot: 200, sh: "line", sz: "S" },
  // 企劃 28：四種新角色（換色，不用新畫）
  shield: { n: "鐵盾妖", img: () => RC.shield || (RC.shield = recolor(GOLEM, 25, 0.45, 0.85)), hp: 95, spd: 32, dmg: 11, r: 7, exp: 16, ai: "melee", shield: true, armor: 0.15, sz: "M", race: "R" }, // 擋正面的投射物
  witch: { n: "妖巫", img: () => RC.witch || (RC.witch = recolor(TREANT, 250, 1.3, 0.85)), hp: 42, spd: 30, dmg: 7, r: 6, exp: 18, ai: "witch", range: 160, sz: "S", race: "P", ele: "P" }, // 每 6 秒叫 3 隻小妖
  healer: { n: "靈醫", img: () => RC.healer || (RC.healer = recolor(ICEWISP, 100, 1.2, 1.25)), hp: 52, spd: 40, dmg: 7, r: 6, exp: 22, ai: "healer", range: 170, shot: 95, sz: "S", ele: "W" }, // 每 4 秒幫附近怪回 10% 血
  rusher: { n: "疾行妖", img: () => RC.rusher || (RC.rusher = recolor(BOMBER, 330, 1.5, 1.15)), hp: 22, spd: 108, dmg: 20, r: 5, exp: 12, ai: "bomber", fast: true, sz: "S", race: "R", ele: "F" }, // 很快、衝過來自爆
  hunter: { n: "獵寶妖", img: () => WOLF, hp: 70, spd: 70, dmg: 12, r: 7, exp: 30, ai: "melee", sz: "M", race: "B" }, // 身上寶物多時會來追殺
};
const SZ_N = { S: "小", M: "中", L: "大" };
// 體型 × 武器修正（RO）：輕型飛劍割小怪 100%、砍大型王只剩 50%；玄鐵重劍專剋大型
const SIZE_MOD = { sword: { S: 1, M: 0.75, L: 0.5 }, blade: { S: 0.75, M: 1, L: 1.25 }, bow: { S: 1, M: 1, L: 0.75 }, fist: { S: 1, M: 1, L: 0.75 }, staff: { S: 1, M: 1, L: 1 }, fan: { S: 1, M: 1, L: 1 } };
const SPELL_WT = { staff: 1, fan: 1 };
const ZONE_LOOT = { town: 1, grass: 1, forest: 1.3, waste: 1.6, volcano: 2, snow: 2.4, swamp: 2.8, thunder: 3.2, sky: 3.8 }; // 越深的地方掉越多

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
    else if (z === "swamp") t = n > 0.6 && v < 0.5 ? 1 : n < 0.24 ? 4 : v > 0.985 ? 2 : 0;
    else if (z === "thunder") t = v > 0.94 || (n > 0.74 && v < 0.45) ? 2 : 0;
    else if (z === "sky") t = n > 0.72 && v < 0.35 ? 1 : n < 0.1 ? 4 : v > 0.99 ? 2 : 0;
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
  // 東邊三區的山脊：雪域｜沼澤、沼澤／峽谷、峽谷｜仙域，各留一個山口
  for (let ty = 1; ty < TH - 1; ty++) for (const tx of [199, 200]) { const y = ty * TS; if (Math.abs(y - PASS2.y) > 70) wmap[ty * TW + tx] = 2; }
  for (let tx = 201; tx < 249; tx++) for (const ty of [55, 56]) { const x = tx * TS; if (Math.abs(x - PASS3.x) > 70) wmap[ty * TW + tx] = 2; }
  for (let ty = 1; ty < TH - 1; ty++) for (const tx of [249, 250]) { const y = ty * TS; if (Math.abs(y - PASS4.y) > 70) wmap[ty * TW + tx] = 2; }
  roads.push([WAYPOINTS[5], PASS2], [PASS2, WAYPOINTS[6]], [WAYPOINTS[6], PASS3], [PASS3, WAYPOINTS[7]], [WAYPOINTS[7], PASS4], [PASS4, WAYPOINTS[8]]);
  for (const [a, b] of roads) carve(a, b, 2);
  for (const p of [...WAYPOINTS, ALTAR, ...PASSES]) clearAround(p.x, p.y, 3);
  for (const k of RB_KEYS) if (k !== "volcano") clearAround(RBOSS[k].x, RBOSS[k].y, RBOSS[k].clr || 7); // 區域王祭壇：清出打王空地
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
  agi: { n: "AGI 敏捷", d: "攻速 +1.5%（上限 200%）、閃避 +0.4%、法術壓制 +0.3%、移動 +0.5%（前 80 點）" },
  wis: { n: "INT 智力", d: "法術武器（法杖、扇）傷害 +3%、能量護盾 +6、真氣 +4" },
  vit: { n: "VIT 體魄", d: "生命 +12、護甲 +1" },
};
const blankW = () => ({ lv: 1, exp: 0, x: 1200, y: 1530, wp: ["town"], ap: { str: 0, vit: 0, agi: 0, wis: 0 }, free: 0, potions: 3 });
const expNext = (lv) => Math.round(36 * Math.pow(lv, 1.7));
let W0 = null; // 大世界執行中的資料
let inWorld = false;
const AGI_SPD_PTS = 80, SPD_CAP = 1.75, ASPD_CAP = 2; // 企劃 24：常駐移速最多 +75%、攻速最多 ×2
function worldStats() {
  const w = save.w, a = typeof treeAttr === "function" ? treeAttr() : w.ap, wt = curWeapon();
  const main = (typeof TR_WMAIN !== "undefined" && TR_WMAIN[wt]) || "str"; // 企劃 25 §13：武器看顏色吃主屬性
  const b = bonus();
  b.maxHp = Math.round(b.maxHp + (w.lv - 1) * 12 + a.vit * 12);
  b.inc += (w.lv - 1) * 0.02 + a[main] * (main === "agi" ? 0.012 : 0.03); // 企劃 41：每級 +2%、主屬性每點 +3%（敏捷 1.2%，§7 劍弓太強），都是「增加」
  b.aspd = (b.aspd || 1) * (1 + (main === "agi" ? a.agi * 0.003 : 0));
  b.spdMul *= 1 + Math.min(a.agi, AGI_SPD_PTS) * 0.005; // 企劃 24：只算前 80 點；總上限在 cap.js
  b.dodge = Math.min(0.5, (b.dodge || 0) + a.agi * 0.004);
  b.supp = Math.min(0.6, (b.supp || 0) + a.agi * 0.003);
  for (const e of ELES) b["res" + e] = b["res" + e] || 0; // 抗性上限、地區扣抗性在 effRes 算（看當下位置）
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
  const u = curUq(); if (u) WSKILL.ult = { n: (typeof jobLv === "function" && jobLv() >= 4 ? "起源・" : "") + WUQ[u][0], cd: WUQ[u][1], mp: WUQ[u][2], uq: u };
  const SLK = { attack: "a", spin: "q", ult: "e", roll: "r" }; // 輔助寶石：疾風、省元只算那一招；每串 1 顆耗真氣 +10%（企劃 21 §3-2-2）
  for (const k of ["attack", "spin", "ult", "roll"]) {
    const sl = SLK[k], cdm = Math.max(0.4, 1 - 0.07 * gemLv("haste", sl)), mm = typeof chainMpMul === "function" ? chainMpMul(sl) : 1; // 企劃 21 §8-6：真氣倍率相乘
    WSKILL[k].cd *= cdm; WSKILL[k].mp = Math.round(WSKILL[k].mp ? WSKILL[k].mp * mm : Math.max(0, mm - 1) * 4); // 普攻、閃身原本不耗真氣：串了寶石才開始耗
  }
  WSKILL.ult.mp = 0; WSKILL.ult.cd = 1; // 天罰：不吃真氣，改成集滿天罰能量才能放
  if (typeof triOf === "function" && save.w) { // 改招三選一：按鈕名字、冷卻
    const wt = curWeapon(), na = triName(wt, "a"), nq = triName(wt, "q");
    if (na) WSKILL.attack.n = na; if (nq) WSKILL.spin.n = nq;
    if (triOf(wt, "q") === "rush") WSKILL.spin.cd += 0.3;
    if (triOf(wt, "a") === "snipe") WSKILL.attack.cd *= 2;
    const ta = triOf(wt, "a"), tq = triOf(wt, "q"); // 企劃 08-B
    if (ta === "frost") WSKILL.attack.cd *= 1.54;
    if (ta === "quake") WSKILL.attack.cd *= 1.67;
    if (ta === "lean") WSKILL.attack.cd *= 2;
    if (tq === "doom") WSKILL.spin.cd += 0.6;
    const ne = triName(wt, "e"); if (ne) { WSKILL.ult.n = ne; delete WSKILL.ult.uq; }
    const se = slotSkill("e"); // 企劃 35：原本的 E／傳說專屬／起源 各自一格
    if (se === "base" && WSKILL.ult.uq) { WSKILL.ult.n = ws.ult[0]; delete WSKILL.ult.uq; }
    if (se === "uq" && WSKILL.ult.uq) WSKILL.ult.n = WUQ[WSKILL.ult.uq][0];
    if (se === "origin") WSKILL.ult.n = WSKILL.ult.uq ? "起源・" + WUQ[WSKILL.ult.uq][0] : "起源覺醒"; // 按鈕名字要跟放出來的招一樣
    const tr = triOf(wt, "r"), RM = { blink: ["縮地", 1.3], pull: ["聚妖", 2.5], guard: ["護體", 4.5] }; // 身法通用招
    if (RM[tr]) { WSKILL.roll.n = RM[tr][0]; WSKILL.roll.cd *= RM[tr][1]; }
  }
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
    const sl = { spin: "q", ult: "e", roll: "r" }[b.dataset.act], sk = sl && typeof slotSkill === "function" && typeof skIco === "function" ? slotSkill(sl) : null; // 使用者畫的技能圖示（企劃 33）
    const pi = sk && sk !== "over" && sk !== "origin" && sk !== "uq" ? skIco(curWeapon(), sl, sk === "base" ? "" : sk, "pico") : "";
    b.classList.toggle("hasico", !!pi);
    b.innerHTML = `${pi}<span class="plab">${n}<small>${k}</small></span>${b.dataset.act === "potion" ? '<b class="count">3</b>' : ""}${b.dataset.act !== "attack" ? '<i class="cd"></i>' : ""}`;
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
  const heroNote = typeof migHero === "function" ? migHero() : "";
  if (heroNote) writeSave();
  mode = "normal";
  inWorld = true;
  B = worldStats();
  run = { x: 0, y: 0, swords: 0, perks: {}, shield: 0, rows: [], fromWorld: true };
  const w = save.w;
  if (blockedCircle(w.x, w.y, 5)) { w.x = 1200; w.y = 1530; }
  if (!W0) {
    W0 = { voids: [], orbs: [], camps: [], mobs: [], pshots: [], eshots: [], fires: [], walls: [], rings: [], tornados: [], spinT: 0, spinTick: 0, drops: [], pools: [], rbCool: {}, npcCool: null, zone: "", bannerT: 0, saveT: 5, combatT: 0, lastAggro: 0 };
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
  if (heroNote) { notice("英雄系統改版（選英雄拿掉了）", "#9fe8ff"); heroNote.split("；").forEach((t) => notice(t.replace("英雄改版：", ""), "#cfe8ff")); }
  if (W0gift) { W0gift = false; notice("得到 2 顆輔助寶石！技能 → 技能鏈，點招式下面的格子串上去", "#ffb347"); }
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
  const want = { grass: 16, forest: 16, waste: 14, volcano: 12, snow: 14, swamp: 14, thunder: 14, sky: 20 };
  for (const z in want) {
    let n = 0, tries = 0;
    while (n < want[z] && tries++ < 4000) {
      const x = 40 + r() * (TW * TS - 80), y = 40 + r() * (TH * TS - 80);
      if (zoneAt(x, y) !== z || Math.hypot(x - TOWN.x, y - TOWN.y) < 230 || blockedCircle(x, y, 12) || PASSES.some((q) => Math.hypot(x - q.x, y - q.y) < 150) || WAYPOINTS.some((wp) => Math.hypot(x - wp.x, y - wp.y) < CAMP_R + 90) || RB_KEYS.some((k) => k !== "volcano" && Math.hypot(x - RBOSS[k].x, y - RBOSS[k].y) < 240)) continue;
      if (W0.camps.some((c) => Math.hypot(c.x - x, c.y - y) < 120)) continue;
      const lo = ZONES[z].lv[0], hi = ZONES[z].lv[1];
      const far = clamp((Math.hypot(x - TOWN.x, y - TOWN.y) - 230) / 1300, 0, 1);
      const zf = z === "grass" ? clamp((Math.hypot(x - TOWN.x, y - TOWN.y) - 230) / 700, 0, 1) : z === "volcano" ? clamp((480 - y) / 400, 0, 1) : z === "snow" ? clamp((x - SNOW_X - 100) / 600, 0, 1) : z === "swamp" ? clamp((Math.hypot(x - PASS2.x, y - PASS2.y) - 150) / 700, 0, 1) : z === "thunder" ? clamp((Math.hypot(x - PASS3.x, y - PASS3.y) - 150) / 650, 0, 1) : z === "sky" ? clamp((Math.hypot(x - PASS4.x, y - PASS4.y) - 150) / 1100, 0, 1) : far;
      const camp = { x, y, z, lv: Math.round(lo + (hi - lo) * zf), size: 4 + Math.floor(r() * 4), respawn: [] };
      W0.camps.push(camp);
      for (let i = 0; i < camp.size; i++) spawnWMob(camp);
      n++;
    }
  }
}
// 企劃 41 第一版：怪物血量倍率（乘 WMOBS 的 hp）。用 bot 量「該等級推薦天賦＋藍裝、普攻一下平均傷害」，一般怪普攻 3–4 下死（hp 70 的怪 ≈ 3.5 下）
// 舊的是 1.2×(1＋0.35×(lv−1)) 線性長；新的攻擊是「增加」加總，曲線跟著玩家實際傷害走（70 級三轉段數 +1 那一段比較陡）
const MOB_HP_T = [[1, 0.9], [10, 2.35], [20, 4.15], [30, 5.9], [40, 8.5], [50, 10.5], [60, 13.5], [70, 21], [80, 27], [90, 30], [100, 36], [110, 46], [120, 63]];
function mobHpMul(lv) {
  const T = MOB_HP_T; if (lv <= T[0][0]) return T[0][1];
  for (let i = 1; i < T.length; i++) if (lv <= T[i][0]) { const [a, x] = T[i - 1], [b, y] = T[i]; return x + (y - x) * (lv - a) / (b - a); }
  const [a, x] = T[T.length - 2], [b, y] = T[T.length - 1]; return y + (y - x) / (b - a) * (lv - b);
}
function spawnWMob(camp) {
  const types = ZONES[camp.z].mobs, type = campPick(camp, types), d = WMOBS[type];
  const lv = Math.max(1, camp.lv + Math.floor(Math.random() * 3) - 1), elite = Math.random() < 0.08;
  const hp = d.hp * mobHpMul(lv) * (elite ? 4 : 1);
  const mod = elite ? ELITE_MODS[Math.floor(Math.random() * ELITE_MODS.length)] : null;
  let x = camp.x, y = camp.y;
  for (let i = 0; i < 10; i++) { const tx = camp.x + rand(-40, 40), ty = camp.y + rand(-40, 40); if (!blockedCircle(tx, ty, d.r)) { x = tx; y = ty; break; } }
  W0.mobs.push({ type, lv, elite, mod, camp, x, y, hp, max: hp, st: "idle", wt: rand(0, 2), wx: x, wy: y, atkT: 0, flash: 0, kb: 0, ka: 0, fuse: 0 });
}

// 精英詞綴：狂暴（快、出手快）、鐵壁（很硬）、召喚（半血叫小弟）
const ELITE_MODS = ["狂暴", "鐵壁", "召喚"];
// v6.7 等級差：怪比你高 5 級以上，每多 1 級你打牠 −3%（最多 −60%）、牠打你 +3%（最多 +60%）。秘境、天劫王不算（它們有自己的難度）
function lvGap(m) { if (!m || !save.w || m.tj || (typeof RIFT !== "undefined" && RIFT)) return 0; return Math.max(0, Math.min(20, (m.lv || 1) - save.w.lv - 5)); }
const lvGapIn = (m) => 1 + 0.03 * lvGap(m);
// 企劃 22 §10-2：深區一般怪傷害（物理、元素都乘；王不算）
const DEEP_DMG = { forest: 1.3, waste: 1.3, volcano: 1.3, snow: 1.6, swamp: 2, thunder: 1.2, sky: 2.4 }; // 雷谷 2.2→1.2（v8.0.1 企劃驗收）；森林、荒原、火山 ×1.3（企劃 41 §8 複驗：有 ES 時荒原火山小怪只掉 0–4%）
const deepMul = (m) => { if (m.boss) return 1; if (typeof RIFT !== "undefined" && RIFT) return RIFT.tier >= 11 ? 2.4 : 1; return DEEP_DMG[zoneAt(m.x, m.y)] || 1; };
const mobDmg = (m, d) => d.dmg * (1 + 0.22 * (m.lv - 1)) * (m.elite ? 1.6 : 1) * (m.dmgMul || 1) * lvGapIn(m) * deepMul(m) * (typeof tjDmgMul === "function" ? tjDmgMul(m) : 1); // dmgMul：秘境詞綴
function packAggro(m) { // 打一隻，整個營地一起衝過來
  for (const o of W0.mobs) if (!o.dead && o.camp === m.camp && o.st === "idle") o.st = "chase";
}
// ───────── 傷害 ─────────
const KC_WIN = 4; // 連斬：4 秒內殺下一隻才接得上
const kcBonus = () => Math.min(0.3, Math.floor((W0.kc || 0) / 5) * 0.02); // 每 5 連斬傷害 +2%，最多 +30%
const eAspd = () => (W0 && W0.swDom && dist(W0, W0.swDom) < W0.swDom.r ? 1.2 : 1) * (W0 && W0.dragT > 0 ? 1.4 : 1); // 企劃 35：劍域、化龍
const wDmg = (base) => { const fc = gemLv("focus"); return (typeof hitBase === "function" ? hitBase(base) : base) * B.atk * (W0.titanT > 0 ? 1.2 : 1) * (B.zen ? 1 + Math.floor(W0.combatT / 10) * 0.05 : 1) * (1 + 0.1 * gemLv("power")) * (1 + kcBonus()) * (CUR_DM || 1) * (fc ? 1.25 + 0.05 * fc : 1) * (typeof skgDmg === "function" ? skgDmg(CUR_SL) : 1); };
const areaMul = (sl) => { const e = gemLv("enlarge", sl), f = gemLv("focus", sl); return (1 + (e ? [0, 0.15, 0.21, 0.27, 0.34, 0.4][Math.min(5, e)] : 0)) * (f ? 0.7 : 1) * (typeof trAreaX === "function" ? trAreaX() : 1); }; // 擴大／集中；天賦樹刀魂、萬法
const AM = () => areaMul(CUR_SL);
const brkMul = () => (1 - 0.2 * ((W0 && W0.brk) || 0)) * ((W0 && W0.healMul) || 1); // 破體：每層吸血、回血 −20%；healMul：秘境詞綴
let HIT_CRIT = false, DOT_HIT = false; const dotBase = (d) => d / (HIT_CRIT ? B.critDmg || 2 : 1); // DOT_HIT：這一下是持續傷害（火牆、旋風、黑洞每跳）
let chainLock = false; // 連鎖寶石引的雷不會再引雷
function hitMob(m, dmg, kb = 0, from = null, quiet = false) {
  if (m.dead || m.air) return;
  const d = WMOBS[m.type], vs = B.vs || {}, sz = d.sz || (m.boss ? "L" : "M");
  const crit = !DOT_HIT && (W0.sureCast || W0.sureNow || Math.random() < Math.min(CRIT_CAP, B.crit + (sz === "L" ? vs.critL || 0 : 0) + (W0.critAdd || 0)));
  HIT_CRIT = crit; // 企劃 41 §2-4：持續傷害不吃暴擊；燃燒、中毒的基準扣掉暴擊（elem.js）
  if (crit) { dmg *= B.critDmg; W0.lastCrit = time; if (CUR_SL && CUR_SL !== "e") W0.critEv = 1; } // 觸發：暴擊
  dmg *= (m.boss ? 1 : (SIZE_MOD[curWeapon()] || SIZE_MOD.staff)[sz]) * (1 + (vs[sz] || 0) / 100) * (1 + ((d.race && vs[d.race]) || 0) / 100) * (1 + ((d.ele && vs["e" + d.ele]) || 0) / 100); // 體型、種族、屬性（卡片）
  if (crit && !chainLock && save.eq.sword && save.eq.sword.card === "rbthunder" && Math.random() < 0.2) chainZap(m, dmg * 0.5, 2); // 九雷鵬王卡
  if (crit && B.uq.thunder && Math.random() < 0.3) { dmg += wDmg(20); bolts.push({ x: m.x, y: m.y, life: 0.25 }); }
  if (d.armor && !B.ignoreDef) dmg *= 1 - d.armor;
  { const g = lvGap(m); if (g) { dmg *= 1 - 0.03 * g; if (m.boss && W0.gapMsg !== m) { W0.gapMsg = m; if (typeof notice === "function") notice(`${d.n} 比你高 ${m.lv - save.w.lv} 級：你的傷害 −${Math.round(g * 3)}%、受到的傷害 +${Math.round(g * 3)}%`, "#ff9a7a"); } } }
  if (m.mod === "鐵壁") dmg *= 0.55;
  dmg = elemHit(m, dmg); // 輔助寶石：冰凍、燃燒、融化、引爆、毒
  if (m.inPool) dmg *= 1.25; // 王站在毒池裡
  if (m.armBrk > 0) dmg *= 1.15; // 大刀破甲
  if (W0.swDom && dist(m, W0.swDom) < W0.swDom.r + d.r) dmg *= 1.2; // 企劃 35 劍域
  dmg *= (m.takeMul || 1) * (m.gd ? 0.5 : 1) * (m.tired > 0 ? 1.3 : 1); // 王的破綻／劍柱護體、天兵金線、雷鷹喘氣
  const dmgPre = dmg; // 扣抗性前（毒的基準）
  if (typeof hitFinal === "function") dmg = hitFinal(m, dmg); // 企劃 41 §6 第 6–7 步：感電／曝曬、怪物抗性（穿透到 0）、元素剋制（最後）
  if (B.uq.psnHit && Math.random() < 0.2) { m.psn = Math.min(5, (m.psn || 0) + 3); m.psnT = 3; m.psnD = Math.max(m.psnD || 0, dotBase(dmgPre) * 0.12); } // 萬毒蟾衣
  const L = curLines(); // 段數：一下打好幾行，總傷害 ×(1+0.3×(段數−1))
  dmg = Math.max(1, Math.round(dmg * rand(0.9, 1.1) * (L > 1 ? (1 + 0.3 * (L - 1)) / L : 1)));
  m.hp -= dmg * L; m.flash = 0.08;
  if (!quiet || !W0.focusM || W0.focusM.dead || W0.focusT <= 0) { W0.focusM = m; W0.focusT = 3; } // 正在打的那隻：顯示名字
  if (m.st === "idle" || m.st === "home") { m.st = "chase"; packAggro(m); }
  if (kb && from && !m.elite && !m.boss) { m.kb = kb; m.ka = angTo(from, m); }
  const lch = B.leech + 0.005 * gemLv("blood") + (W0.invT > 0 ? 0.1 : 0);
  if (lch > 0) W0.regenAcc += dmg * L * lch * brkMul();
  const gf = gemLv("frost"); if (gf && Math.random() < 0.15 + gf * 0.1) m.slowT = Math.max(m.slowT || 0, 1.5);
  const gc = gemLv("chain");
  if (gc && !chainLock && Math.random() < 0.08 + gc * 0.05) {
    let o = null, bd = 70; for (const n of W0.mobs) if (n !== m && !n.dead) { const dd = dist(n, m); if (dd < bd) { bd = dd; o = n; } }
    if (o) { bolts.push({ x: o.x, y: o.y, life: 0.2 }); chainLock = true; hitMob(o, dmg * 0.7, 0, null, true); chainLock = false; }
  }
  W0.mp = Math.min(B.maxMp, W0.mp + (quiet ? 0 : 1));
  for (let i = 0; i < Math.min(L, 10); i++) { // 段數：數字一行一行疊上去
    floatText(m.x, m.y - 10 - i * 7, crit ? `${fmtN(dmg)}!` : fmtN(dmg), crit ? (dmg * L > m.max * 0.5 ? "#ff4a3a" : "#ffd84a") : L > 1 ? "#ffe9c0" : "#ffffff", crit);
    const f = floaters[floaters.length - 1], a = (from ? angTo(from, m) : rand(-Math.PI, Math.PI)) + rand(-0.6, 0.6); f.vx = Math.cos(a) * (crit ? 55 : 30) * (L > 1 ? 0.3 : 1); f.vy = -(crit ? 75 : 55) * (L > 1 ? 0.6 : 1); f.num = true; f.age = -i * 0.03;
  }
  if (!quiet) { sfx(crit ? "crit" : "hit"); hitstop = Math.max(hitstop, crit ? 0.05 : 0.025); }
  burst(m.x, m.y, crit ? "#ffd84a" : "#ffb070", crit ? 10 : 5, 60);
  fxHit(m.x + rand(-2, 2), m.y - 2 + rand(-2, 2), crit, WPN_FX[curWeapon()]);
  if (m.mod === "召喚" && !m.summoned && m.hp > 0 && m.hp < m.max * 0.5) {
    m.summoned = true; floatText(m.x, m.y - 18, "召喚妖群！", "#ff6b6b", true);
    for (let i = 0; i < 3; i++) { spawnWMob(m.camp); const n = W0.mobs[W0.mobs.length - 1]; n.elite = false; n.mod = null; n.hp = n.max = n.max / 4; n.x = m.x + rand(-15, 15); n.y = m.y + rand(-15, 15); n.st = "chase"; n.noRespawn = true; burst(n.x, n.y, "#b07dff", 10, 60); }
  }
  if (m.hp > 0) { const ge = gemLv("exec"); if (ge && m.hp < m.max * (m.boss ? 0.03 + (ge - 1) * 0.005 : 0.08 + (ge - 1) * 0.01) * (m.tj ? 0.5 : 1)) { m.hp = 0; floatText(m.x, m.y - 22, "斬殺", "#ff5a5a", true); } } // 斬殺
  { const gk = gemLv("bell"); if (gk && CUR_SL && typeof slotTags === "function" && slotTags(CUR_SL).includes("m")) { W0.bellN = Math.min(10 + gk, (W0.bellT > 0 ? W0.bellN || 0 : 0) + 1); W0.bellT = 5; } } // 金鐘
  if (m.hp <= 0) killMob(m);
}
function killMob(m) {
  if (WMOBS[m.type].ai === "pillar") { m.dead = true; fxBoom(m.x, m.y, 24, "255,220,140"); burst(m.x, m.y, "#ffe08a", 20, 100, 0.5); sfx("break"); return; } // 劍柱：不給經驗、不掉寶
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
  if (m.sum) exp *= 0.2;
  exp = Math.max(1, Math.round(exp));
  gainExp(exp);
  questEvent(m.elite ? "elite" : "kill", m.camp.z);
  save.xiuwei += Math.max(1, Math.round(exp / 6));
  const sh = m.boss ? RBOSS[m.rb || "volcano"].shards : m.hunter ? 5 : m.elite ? 3 : Math.random() < 0.05 ? 1 : 0; // 天罰碎屑
  if (sh) { save.shards = (save.shards || 0) + sh; if (sh > 1) floatText(m.x, m.y - 28, `天罰碎屑 +${sh}`, "#ffcf6b"); }
  if (B.uq.vamp) W0.hp = Math.min(W0.maxHp, W0.hp + W0.maxHp * 0.01 * brkMul());
  if (m.boss) { wbKilled(m); return; }
  if (m.sum) return; // 妖巫叫出來的小妖：不掉寶
  if (m.type === "toad") addPool(m.x, m.y, 20, 4, mobDmg(m, d) * 0.3, 0.4); // 毒沼蟾：死掉炸出毒池
  // 掉寶
  const il = Math.max(0, Math.floor(m.lv / 3) + Math.floor(Math.random() * 2) - 1);
  const zl = ZONE_LOOT[m.camp.z] || 1;
  const dm = 1 + (B.drop || 0);
  if (Math.random() < (m.hunter ? 0.2 : m.elite ? 0.03 : 0.003) * dm) { if (CARDS[m.type]) wDrop({ kind: "card", c: m.type }, m); } // 魔物卡片
  if (Math.random() < (m.hunter ? 1 : m.elite ? 0.2 : 0.006 * zl) * dm) wDrop({ kind: "ess", k: randEss() }, m); // 精髓
  if (m.hunter) { for (let i = 0; i < 2; i++) wDropItem(rollItem(1, il + 1), m); wDrop({ kind: "stone", v: 10 + m.lv }, m); floatText(m.x, m.y - 20, "獵寶妖被斬了！", "#ffe066", true); }
  else if (Math.random() < (m.elite ? 0.4 : 0.028) * zl * dm) wDropItem(rollItem(m.elite ? 1 : 0, il), m); // 越深掉越多件，但只有精英掉好東西
  if (m.hunter) { wDrop({ kind: "gem", g: randGem(1) }, m); wDrop({ kind: "gem", g: randGem(1) }, m); }
  else if (Math.random() < (m.elite ? 0.25 : 0.012 * zl)) wDrop({ kind: "gem", g: randGem(1) }, m);
  if (Math.random() < (m.elite ? 0.8 : 0.08)) wDrop({ kind: "stone", v: Math.round((1 + Math.floor(m.lv / 3) + (m.elite ? 4 : 0)) * zl) }, m);
  if (Math.random() < 0.03) wDrop({ kind: "potion" }, m);
  if (m.elite && Math.random() < (m.rift ? 0.03 : 0.15) && typeof keyTierFor === "function" && keyTierFor(m.lv)) wDrop({ kind: "key", k: makeKey(keyTierFor(m.lv)) }, m); // 秘境鑰：Lv.28 以上的精英才掉
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
    if (typeof JOBS !== "undefined") { const J = JOBS[jobLv()]; if (J && w.lv === J.lv) notice(`可以${J.n}了！打開角色（C）轉職`, "#ffcf6b"); }
    sfx("arrive"); burst(W0.x, W0.y, "#ffe066", 40, 120, 0.8); flashT = 0.2; flashColor = "255,240,180";
  }
  writeSave();
}
// 天罰：能量集滿放出，除了武器本身的大招，整個畫面的妖獸都被天雷劈一次
// 企劃 35 §5：放 E 時畫面上方小字顯示招式名
function eNameShow(n) {
  if (!n) return; let el = document.getElementById("eName");
  if (!el) { el = document.createElement("div"); el.id = "eName"; document.body.appendChild(el); }
  el.textContent = n; el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
}
function tianfa() {
  const p = W0; W0.enFullFx = false;
  for (const m of W0.mobs) if (!m.dead && Math.abs(m.x - p.x) < 260 && Math.abs(m.y - p.y) < 170) { bolts.push({ x: m.x, y: m.y, life: 0.35 }); hitMob(m, wDmg(30), 50, p, true); }
  shake = Math.max(shake, 10); flashT = 0.18; flashColor = "255,215,120"; sfx("crit");
  W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.5, r: 120, c: "255,210,110" });
  floatText(p.x, p.y - 30, "天罰！", "#ffd84a", true);
}
// ───── 物理減免＋四元素抗性（企劃 22）─────
const ELES = ["F", "W", "T", "P"];
const RES_N = { F: "火焰", W: "冰冷", T: "閃電", P: "混沌" }, RES_S = { F: "火", W: "冰", T: "雷", P: "混沌" }; // ELE_N／ELE_C 在 equip.js（武器元素用）
const ELE_PILL = { F: "fireres", W: "iceres", T: "thres", P: "psnres" }; // econ.js 的 BUFFS
const ZONE_RES_PEN = { snow: 0.2, swamp: 0.2, thunder: 0.4, sky: 0.6 };
const RES_CAP = 0.75, RES_MIN = -0.6;
function resPen() { // 這裡扣多少元素抗性
  if (!W0) return 0;
  if (typeof RIFT !== "undefined" && RIFT && RIFT.tier >= 11) return 0.6;
  if (typeof tjBoss === "function" && tjBoss()) return 0.6;
  return ZONE_RES_PEN[zoneAt(W0.x, W0.y)] || 0;
}
const pillRes = (e) => (typeof buffOn === "function" && buffOn(ELE_PILL[e]) ? 0.3 : 0);
const resCap = (e) => Math.max(pillRes(e) ? 0.8 : RES_CAP, typeof trResCapX === "function" ? trResCapX(e) : 0) + ((B && B.resCapAdd) || 0) + ((B && B.resCapE && B.resCapE[e]) || 0); // 天賦樹：避劫、天人合一；傳說：最大抗性 +3%
const rawRes = (e, b = B) => ((b && b["res" + e]) || 0) + pillRes(e) + (typeof trResBuf === "function" ? trResBuf(e) : 0); // 裝備＋丹藥，還沒扣地區
const effRes = (e, b = B) => Math.max(RES_MIN, Math.min(resCap(e), rawRes(e, b) - resPen()));
const BUFFS_N = (e) => (typeof BUFFS !== "undefined" && BUFFS[ELE_PILL[e]] ? BUFFS[ELE_PILL[e]].n : "丹藥");
const armorRed = (armor, dmg) => Math.min(0.75 - ((B && B.physCapSub) || 0), armor / (armor + 10 * dmg)); // 企劃 40 §9：常數 5→10（PoE2）
const refHit = () => 10 * (1 + 0.22 * ((save.w ? save.w.lv : 1) - 1)); // 同等級一般怪一下（顯示物理減免用）
const physRed = (b = B) => armorRed((b && b.armor) || 0, refHit());
// 這一下是什麼元素：招式直接帶（F/W/T/P）＞打人的怪＞打王場地裡的王；都沒有＝物理
function hitEle(from, kind) {
  if (ELES.includes(kind)) return kind;
  if (from && from.type) return typeof mobEle === "function" ? mobEle(from) : (WMOBS[from.type] && WMOBS[from.type].ele) || null;
  if (kind === "ele" && typeof wbArena === "function") { const a = wbArena(); if (a) return (typeof mobEle === "function" ? mobEle(a.m) : WMOBS[a.m.type].ele) || null; }
  return null;
}
let chillHit = false; // 冰靈的冰彈打中時設成 true
// kind：phys 物理（怪物近戰）、spell 法術（子彈）、ele 元素法術（火、冰，吃抗性）
// 天賦樹「血魔法」：招式改花生命（1 真氣＝1% 最大生命），不會花到死
const mpCan = (p, c) => (B.bloodMagic ? !c || p.hp > (c * p.maxHp) / 100 : p.mp >= c);
function mpPay(p, c) { if (!c) return; if (B.bloodMagic) { p.hp -= Math.round((c * p.maxHp) / 100); p.hurt = 0.1; } else p.mp -= c; }
function hurtW(dmg, from, kind) {
  const p = W0;
  if (p.shield > 0 || safeAt(p.x, p.y)) return; // 太極護罩、營地結界：完全不受傷
  if (p.invT > 0) return; // 吸血鬼：血霧無敵
  if (p.mistT > 0 && (kind || (from ? "phys" : "spell")) === "phys") { if (!p.mistMsg || time - p.mistMsg > 0.6) { p.mistMsg = time; popWord(p, "霧化", "#9aff9a"); } return; }
  if (p.iframe > 0 || !(state === "world" || ((state === "paused" || state === "pick") && pausedFrom === "world"))) return;
  if (p.rshT > 0) { p.rshT = 0; p.iframe = 0.3; popWord(p, "護盾", "#9fdcff"); burst(p.x, p.y - 3, "#9fdcff", 10, 60, 0.3); return; } // 輔助寶石：護盾
  const ele = hitEle(from, kind); // 企劃 22：元素傷害吃該元素抗性，沒元素的就是物理（吃護甲）
  if (ELES.includes(kind)) kind = "ele";
  kind = kind || (from ? "phys" : "spell");
  if (kind === "phys" && Math.random() < B.dodge) { p.iframe = 0.25; popWord(p, "DODGE", "#7dff6a"); return; } // 敏捷：閃避
  if (kind !== "phys" && Math.random() < B.supp) { dmg *= 0.5; popWord(p, "SUPPRESSED", "#6fb8ff"); } // 敏捷：法術壓制
  if (!ele && kind !== "spell" && B.armor > 0) { // 物理減免：護甲（傷害越小擋越多）
    const r = armorRed(B.armor, dmg); dmg *= 1 - r;
    if (r > 0.08) { burst(p.x + rand(-4, 4), p.y - 4, "#ffe9a0", 6, 70, 0.25); burst(p.x, p.y - 4, "#c8d0e0", 4, 40, 0.2); }
  }
  let eleHurt = null;
  if (ele) { const r = effRes(ele); dmg *= 1 - r; if (r < 0) eleHurt = ele; }
  dmg = dmg * (B.uq.vajra && p.hp < p.maxHp * 0.3 ? 0.5 : 1) * (W0.guardT > 0 && curWeapon() === "fist" ? 0.85 : 1) * (p.bellT > 0 ? 1 - 0.01 * (p.bellN || 0) : 1) * (W0.titanT > 0 ? 0.7 : 1); // 金鐘；企劃 35 霸體
  dmg = Math.max(1, Math.round(dmg));
  p.esT = 3; // 脫戰 3 秒才回充護盾
  if (p.es > 0) { // 智慧：能量護盾先扣
    const a = Math.min(p.es, dmg); p.es -= a; dmg -= a;
    burst(p.x, p.y - 3, "#9fdcff", 6, 50, 0.3);
    if (dmg <= 0) { p.iframe = 0.45; floatText(p.x, p.y - 14, `-${a}`, "#9fdcff"); sfx("hit"); return; }
  }
  if (p.guardSh > 0 && p.guardT2 > 0) { const a = Math.min(p.guardSh, dmg); p.guardSh -= a; dmg -= a; if (dmg <= 0) { p.iframe = 0.3; floatText(p.x, p.y - 14, `護體 -${a}`, "#ffe08a"); return; } } // 身法：護體
  p.hp -= dmg; p.iframe = 0.45; p.hurt = 0.2; p.hurtEv = 1;
  floatText(p.x, p.y - 14, `-${dmg}`, eleHurt ? "#c77dff" : "#ff6b6b"); // 企劃 22 §10-3：抗性是負的那種元素＝紫色＋「抗性不足」
  if (eleHurt) { if (!p.resNegT || time - p.resNegT > 1.2) { p.resNegT = time; floatText(p.x + 18, p.y - 18, `${RES_S[eleHurt]}抗性不足`, "#c77dff"); } seenHint("resneg2", `這裡的${RES_S[eleHurt]}很痛：你的${RES_N[eleHurt]}抗性是負的（${Math.round(effRes(eleHurt) * 100)}%），被打會多扣血。去工藝台煉${BUFFS_N(eleHurt)}，或換有${RES_S[eleHurt]}抗的戒指、耳飾。`); }
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
  updateWBZones(dt);
  if (!W0.walls) W0.walls = [];
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
  p.regenAcc += B.regen * dt * brkMul();
  if (p.regenAcc >= 1) { const h = Math.min(Math.floor(p.regenAcc), p.maxHp - p.hp); p.hp += h; p.regenAcc -= Math.floor(p.regenAcc); }

  // 移動
  let mx = 0, my = 0;
  if (keys.has("a") || keys.has("arrowleft")) mx -= 1;
  if (keys.has("d") || keys.has("arrowright")) mx += 1;
  if (keys.has("w") || keys.has("arrowup")) my -= 1;
  if (keys.has("s") || keys.has("arrowdown")) my += 1;
  if (stick.id !== null) { const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = Math.hypot(dx, dy); if (d > 8) { mx = dx / Math.max(d, 50); my = dy / Math.max(d, 50); } }
  if (typeof AUTO !== "undefined" && AUTO && !inMenu) { if (mx || my) autoStop("你自己動了，自動尋路停止"); else { const v = autoStep(p, dt); if (v) { mx = v[0]; my = v[1]; } } } // 企劃 15：任務「前往」
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
    const ar = typeof wbArena === "function" ? wbArena() : null, wasIn = ar && Math.hypot(p.x - ar.x, p.y - ar.y) <= ar.r, ox = p.x, oy = p.y;
    moveBody(p, Math.cos(p.rollDir) * 250 * dt, Math.sin(p.rollDir) * 250 * dt, 5);
    if (wasIn && Math.hypot(p.x - ar.x, p.y - ar.y) > ar.r) { p.x = ox; p.y = oy; p.roll = 0; } // 打王：衝刺／後跳撞到圈邊就停
    if (p.dashHit) { CUR_SL = p.dashSl || null; CUR_DM = p.dashDm || 1; for (const m of W0.mobs) if (!m.dead && !p.dashHit.has(m) && dist(m, p) < 14 + WMOBS[m.type].r) { p.dashHit.add(m); hitMob(m, wDmg(p.dashDmg || 16), 90, p); } CUR_SL = null; CUR_DM = 1; }
    if (p.ghostT !== undefined && (p.ghostT -= dt) <= 0 && p.ghostN > 0) { p.ghostT = 0.05; p.ghostN--; W0.fires.push({ x: p.x, y: p.y, t: 0.12, r: 16, dmg: p.ghostD || 6, c: "#bfe6ff", sl: p.ghostSl || "r", dm: 1 }); } // 殘影
    if (p.iceN > 0 && (p.iceT -= dt) <= 0) { p.iceT = 0.035; p.iceN--; W0.walls.push({ x: p.x, y: p.y, t: p.iceL || 2, tick: 0, ice: 1 }); } // 冰徑
    if (p.roll <= 0) {
      p.dashHit = null; p.dashDmg = 0; p.ghostN = 0; p.ghostD = 0; p.ghostSl = null; p.iceN = 0;
      if (p.rshPend) { W0.rshT = p.rshPend; p.rshPend = 0; }
      if (p.land) { const L = p.land; p.land = null; CUR_SL = L.sl || null; CUR_DM = L.dm || 1; { const l = gemLv("after"); if (l) W0.fires.push({ x: p.x, y: p.y, t: 0.5, r: L.r, dmg: L.dmg * (0.4 + (l - 1) * 0.075), c: "#e0b080", isAf: 1, sl: L.sl, dm: L.dm }); } for (const m of W0.mobs) if (!m.dead && dist(m, p) < L.r + WMOBS[m.type].r) hitMob(m, wDmg(L.dmg) * (m.boss ? 0.8 : 1), 100, p, true); W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.3, r: L.r, c: "230,200,150" }); fxBoom(p.x, p.y, L.r, "230,200,150"); shake = Math.max(shake, 5); sfx("break"); CUR_SL = null; CUR_DM = 1; }
    }
    if (Math.random() < 0.6) particles.push({ x: p.x, y: p.y + 5, vx: 0, vy: -10, life: 0.3, max: 0.3, color: "#8fa7ff", size: 2 });
  } else {
    const spd = 85 * B.spdMul * (p.swing > 0 ? 0.6 : 1) * (p.chillT > 0 ? 0.6 : 1) * (p.mistT > 0 ? 1.3 : 1) * (p.poolT > 0 ? 0.75 : 1) * (p.zapT > 0 ? 0.5 : 1) * (W0.spinT > 0 && W0.spinK !== "gale" && W0.spinK !== "cyc" ? 0.6 : 1) * (typeof mountMul === "function" ? mountMul() : 1) * (typeof trSpdMul === "function" ? trSpdMul() : 1);
    moveBody(p, mx * spd * dt, my * spd * dt, 5);
  }
  // 熔岩會燙
  if (tileAt(p.x, p.y) === 3) { p.lavaT -= dt; if (p.lavaT <= 0) { p.lavaT = 0.5; p.iframe = 0; hurtW(4 + w.lv * 0.6, null, "F"); } }

  const near = (max) => { if (mouseAim() && !W0.noAim) return mouseTarget(max); let best = null, bd = max; for (const m of W0.mobs) { if (m.dead) continue; const d = dist(m, p); if (d < bd) { bd = d; best = m; } } return best; };
  const useSkill = (k) => { const mc = WSKILL[k].mp * ((B.skMp && B.skMp[k]) || 1); if (p.cds[k] > 0 || !mpCan(p, mc) || p.roll > 0) return false; p.cds[k] = WSKILL[k].cd * (k === "roll" ? B.rollCd : k === "attack" ? 1 / ((B.aspd || 1) * eAspd()) : 1) * ((B.skCd && B.skCd[k]) || 1); mpPay(p, mc); if (k === "attack") { p.cds.attack = Math.max(0.07, p.cds.attack); W0.justAtk = true; } /* 企劃 24：普攻最快 0.07 秒 */ if ((k === "attack" || k === "spin") && W0.sureT > 0) { W0.sureT = 0; W0.sureCast = true; } skillUsed(k); tutEvent(k); return true; };
  const wt = curWeapon();
  const arcHit = (range, half, base, kb) => {
    for (const m of W0.mobs) {
      if (m.dead) continue;
      const d = dist(m, p), diff = Math.abs(((angTo(p, m) - p.face + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (d < range * AM() + WMOBS[m.type].r && diff < half) hitMob(m, wDmg(base), kb, p);
    }
  };
  // ── 輔助寶石（企劃 21 第二版）：出招時記下是哪一招（CUR_SL）和傷害倍率（CUR_DM，法壇／連打／觸發），新產生的子彈、火雨、旋風都帶著 ──
  const LISTS = () => [W0.pshots, W0.fires, W0.walls, W0.tornados, W0.voids];
  const cast = (sl, fn, dm = 1) => {
    const o0 = CUR_SL, d0 = CUR_DM, L0 = LISTS().map((a) => a.length), sp0 = W0.spinT, dh0 = p.dashHit, ld0 = p.land, r0 = p.roll;
    CUR_SL = sl; CUR_DM = dm; let r;
    try { r = fn(); } finally {
      const am = areaMul(sl), af = gemLv("after", sl);
      LISTS().forEach((a, i) => { for (let j = L0[i]; j < a.length; j++) { const o = a[j]; if (o.ghost || o.sl !== undefined) continue; o.sl = sl; o.dm = dm;
        if (i === 1) { o.r *= am; if (af && !o.isAf) o.af = af; } else if (i === 2) o.hr = 10 * am; else if (i === 3) { o.hr = (o.hr || 22) * am; o.pr = (o.pr || 40) * am; } } });
      if (W0.spinT > sp0) { W0.spinSl = sl; W0.spinDm = dm; }
      if (p.dashHit && p.dashHit !== dh0) { p.dashSl = sl; p.dashDm = dm; }
      if (p.land && p.land !== ld0) { p.land.sl = sl; p.land.dm = dm; p.land.r *= am; }
      if (p.roll > r0 && sl !== "r") moveRunes(sl);
      CUR_SL = o0; CUR_DM = d0;
    }
    return r;
  };
  const castLater = (t, fn) => { const sl = CUR_SL, dm = CUR_DM; wLater(t, () => { if (W0) cast(sl, fn, dm); }); };
  const afterAt = (x, y, r, base) => { const l = gemLv("after"); if (l) W0.fires.push({ x, y, t: 0.5, r, dmg: base * (0.4 + (l - 1) * 0.075), c: "#e0b080", isAf: 1 }); }; // 餘震（瞬間範圍招）
  const moveRunes = (sl) => { // 殘影／護盾／冰徑：位移招（閃身、御劍突、衝拳…）
    const gt = gemLv("trail", sl), gs = gemLv("rshield", sl), gi = gemLv("icepath", sl);
    if (gt) { p.ghostT = 0; p.ghostN = Math.max(p.ghostN || 0, 3 + gt); p.ghostD = 4 + gt * 2; p.ghostSl = sl; }
    if (gs) p.rshPend = 1.5 + gs * 0.25;
    if (gi) { p.iceN = 7; p.iceT = 0; p.iceL = 1.5 + gi * 0.5; }
  };
  const ownShots = () => { let n = 0; for (const s of W0.pshots) if (!s.ghost && s.life > 0) n++; return n; };
  const shoot = (a, o) => {
    const gp = gemLv("pierce"); if (gp) { o.pierce = true; if (!o.pdone) o.dmg *= 1 + gp * 0.05; }
    const gb = o.child ? 0 : gemLv("bounce"); o.bn = (B.uq.bounce ? 2 : 0) + (o.bnAdd || 0) + (gb ? (gb >= 5 ? 3 : gb >= 3 ? 2 : 1) : 0); if (gb) o.bnR = 1;
    if (!o.child) {
      if (gemLv("seek")) { o.home = true; o.homeR = 1 + gemLv("seek") * 0.2; }
      const gs = gemLv("split"); if (gs) { o.spl = gs >= 3 ? 3 : 2; if (!o.pdone) o.dmg *= 0.9; }
      if (gemLv("volley") && !o.pdone) o.dmg *= 0.9;
      if (gemLv("boomer") && o.back === undefined) { o.back = o.life * 0.8; o.life *= 1.8; o.rbm = 1; }
    }
    if (W0.sureCast) o.sure = true;
    if (!o.pdone && !o.child && (gemLv("lmp") || gemLv("volley"))) o.grp = { hit: new Set() }; // 多重投射／齊射：同一次出手打到同一隻王，第 2 道起 50%（企劃 21 §9-1）
    if (ownShots() >= 60) { const last = W0.pshots.slice().reverse().find((s) => !s.ghost && s.life > 0); if (last) { last.dmg += o.dmg; return; } } // 同時最多 60 道：超過就合併傷害
    W0.pshots.push(Object.assign({ x: p.x, y: p.y - 3, vx: Math.cos(a) * o.v, vy: Math.sin(a) * o.v, a, hit: new Set() }, o));
    if (!o.child) multiShots(a, o, shoot);
  };
  const autoAtk = w.autoAtk && !inMenu && p.cds.attack <= 0 && W0.mobs.some((m) => !m.dead && !m.noTarget && dist(m, p) < 70); // 設定：半自動割草
  const atkFx = () => {
    if (B.uq.orbit && (W0.orbAtk = (W0.orbAtk || 0) + 1) % 3 === 0) { if (W0.orbs.length >= 6) W0.orbs.shift(); W0.orbs.push({ t: 8, hit: new Map() }); }
    if (wt === "sword") { // 劍擊：前方扇形（改招：劍舞／劍芒／破軍）
      const ta = triOf("sword", "a"), t = near(ta === "ray" ? 90 : 50); if (t) p.face = angTo(p, t);
      if (W0.danceWt !== wt) { W0.danceWt = wt; W0.danceN = 0; }
      const third = ta === "dance" && (W0.danceN = ((W0.danceN || 0) + 1) % 3) === 0;
      const R = third ? 42 : ta === "break" ? 34 : 30, half = third ? 1.5 : ta === "break" ? 0.45 : 1.1, base = third ? 16.5 : ta === "break" ? 12 : ta === "dance" ? 9 : ta === "ray" ? 7 : 10;
      p.swing = p.swingMax = 0.18; p.swingR = third ? 34 : 22; sfx(third ? "break" : "dash"); if (third) shake = Math.max(shake, 2);
      for (const m of W0.mobs) {
        if (m.dead) continue;
        const d = dist(m, p), diff = Math.abs(((angTo(p, m) - p.face + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (d < R * AM() + WMOBS[m.type].r && diff < half) hitMob(m, wDmg(base) * (ta === "break" && (m.elite || m.boss) ? 1.3 : 1), third ? 160 : 80, p);
      }
      if (ta === "ray") shoot(p.face, { v: 260, life: 0.31, dmg: 4.5, kind: "sword", pierce: false, kb: 20 });
    } else if (wt === "staff") { // 法球：遠程、打到第一隻就消失
      const ta = triOf("staff", "a"), t = near(ta === "burst" ? 200 : 150); if (t) p.face = angTo(p, t);
      if (ta === "split") for (let i = -1; i <= 1; i++) shoot(p.face + i * 0.14, { v: 170, life: 0.9, dmg: 4.3, kind: "orb", pierce: false, kb: 25 });
      else if (ta === "frost") shoot(p.face, { v: 190, life: 0.85, dmg: 21.5, kind: "orb", pierce: false, kb: 40, slow: 1 });
      else if (ta === "burst") shoot(p.face, { v: 170, life: 1.26, dmg: 0, kind: "orb", pierce: false, kb: 0, boom: { r: 20, dmg: 10, kb: 110 } });
      else shoot(p.face, { v: 170, life: 0.9, dmg: 12, kind: "orb", pierce: false, kb: 40 }); sfx("volley");
    } else if (wt === "bow") { // 連射：快、傷害低（改招：三連珠／追蹤箭／狙擊）
      const ta = triOf("bow", "a"), t = near(ta === "snipe" ? 250 : 170); if (t) p.face = angTo(p, t);
      if (ta === "tri3") { W0.triN = ((W0.triN || 0) + 1) % 3; const big = W0.triN === 0; shoot(p.face + rand(-0.04, 0.04), { v: 300, life: 0.6, dmg: big ? 9 : 6, kind: "arrow", pierce: big, kb: big ? 40 : 15 }); }
      else if (ta === "home") shoot(p.face + rand(-0.05, 0.05), { v: 280, life: 0.7, dmg: 7, kind: "arrow", pierce: false, kb: 15, home: true });
      else if (ta === "snipe") shoot(p.face, { v: 380, life: 0.71, dmg: 14, kind: "arrow", pierce: false, kb: 50, critAdd: 0.1 });
      else shoot(p.face + rand(-0.05, 0.05), { v: 300, life: 0.6, dmg: 6, kind: "arrow", pierce: false, kb: 15 }); sfx("dash");
    } else if (wt === "blade") { // 重斬：慢但很寬
      const ta = triOf("blade", "a"), t = near(55); if (t) p.face = angTo(p, t);
      p.swing = p.swingMax = 0.25; p.swingR = ta === "sweep" ? 40 : 34; sfx("break"); shake = Math.max(shake, ta === "quake" ? 4 : 2);
      if (ta === "sweep") arcHit(40, Math.PI + 0.1, 19, 110);
      else if (ta === "quake") arcHit(38, 1.5, 34, 150);
      else if (ta === "crack") { arcHit(38, 1.5, 14.4, 110); for (const m of W0.mobs) if (!m.dead && dist(m, p) < 38 + WMOBS[m.type].r && Math.abs(((angTo(p, m) - p.face + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 1.5) m.armBrk = 4; }
      else arcHit(38, 1.5, 18, 110);
      if (B.uq.wave) shoot(p.face, { v: 220, life: 0.55, dmg: 10, kind: "sword", pierce: true, kb: 30 });
    } else if (wt === "fist") { // 連拳：超快、超近
      const ta = triOf("fist", "a"), t = near(ta === "qi" ? 70 : 40); if (t) p.face = angTo(p, t);
      p.swing = p.swingMax = 0.08; p.swingR = 14; sfx("hit"); W0.guardT = 0.4; // 連拳期間受傷 −15%
      if (ta === "lean") { const cx = p.x + Math.cos(p.face) * 14, cy = p.y + Math.sin(p.face) * 14, lr = 24 * AM(); for (const m of W0.mobs) if (!m.dead && Math.hypot(m.x - cx, m.y - cy) < lr + WMOBS[m.type].r) hitMob(m, wDmg(10), 40, p); W0.rings.push({ x: cx, y: cy, t: 0, max: 0.15, r: lr, c: "255,210,140" }); afterAt(cx, cy, lr, 10); }
      else if (ta === "inch") { if (W0.inchWt !== wt) { W0.inchWt = wt; W0.inchN = 0; } const big = (W0.inchN = ((W0.inchN || 0) + 1) % 5) === 0; arcHit(big ? 26 : 22, 0.8, big ? 13.5 : 4.2, big ? 170 : 30); if (big) { shake = Math.max(shake, 3); sfx("break"); } }
      else if (ta === "qi") shoot(p.face, { v: 220, life: 0.25, dmg: 4.2, kind: "qi", pierce: false, kb: 20 });
      else arcHit(22, 0.8, 5, 30);
    } else { // 風刃：飛出去再飛回來，穿透
      const ta = triOf("fan", "a"), t = near(ta === "gust" ? 200 : 150); if (t) p.face = angTo(p, t);
      if (ta === "twin") for (let i = -1; i <= 1; i += 2) shoot(p.face + i * 0.12, { v: 200, life: 1.0, dmg: 3.7, kind: "wind", pierce: true, kb: 20, back: 0.5 });
      else if (ta === "gust") shoot(p.face, { v: 330, life: 0.6, dmg: 17, kind: "wind", pierce: true, kb: 30 });
      else if (ta === "spring") shoot(p.face, { v: 200, life: 1.0, dmg: 8, kind: "wind", pierce: true, kb: 20, back: 0.5, heal: 1 });
      else shoot(p.face, { v: 200, life: 1.0, dmg: 8, kind: "wind", pierce: true, kb: 20, back: 0.5 }); sfx("dash");
    }
  };
  const doSpin = () => {
    const t = near(160); if (t) p.face = angTo(p, t);
    if (superSpin(p, t)) return; // 超技能寶石：隕石、萬劍天降
    if (B.uq.voidQ) { // 傳說：劍陣變成引力黑洞
      const tx = t ? t.x : p.x + Math.cos(p.face) * 60, ty = t ? t.y : p.y + Math.sin(p.face) * 60;
      W0.voids.push({ x: tx, y: ty, t: 2.2, max: 2.2, tick: 0 }); sfx("volley"); netCast("v", p.face, tx, ty); return;
    }
    netCast("q", p.face, t ? t.x : p.x + Math.cos(p.face) * 60, t ? t.y : p.y + Math.sin(p.face) * 60, typeof triOf === "function" ? triOf(wt, "q") : null);
    const tq = triOf(wt, "q");
    if (wt === "sword" && tq === "wan") { for (let i = -2; i <= 2; i++) shoot(p.face + i * 0.26, { v: 230, life: 0.6, dmg: 8.5, kind: "sword", pierce: true, kb: 50 }); sfx("volley"); }
    else if (wt === "sword" && tq === "boom") { for (let i = -1; i <= 1; i++) shoot(p.face + i * 0.2, { v: 230, life: 0.8, dmg: 8, kind: "sword", pierce: true, kb: 30, back: 0.4 }); sfx("volley"); }
    else if (wt === "sword" && tq === "rush") { p.roll = 0.24; p.rollDir = p.face; p.iframe = Math.max(p.iframe, 0.3); p.dashHit = new Set(); p.dashDmg = 50; sfx("dash"); }
    else if (wt === "bow" && tq === "rain") { const tx = t ? t.x : p.x + Math.cos(p.face) * 70, ty = t ? t.y : p.y + Math.sin(p.face) * 70; for (let i = 0; i < 8; i++) W0.fires.push({ x: tx + rand(-26, 26), y: ty + rand(-18, 18), t: 0.3 + i * 0.05, r: 16, dmg: 3, c: "#ffe9a0" }); sfx("volley"); }
    else if (wt === "bow" && tq === "refr") { for (let i = -2; i <= 2; i++) shoot(p.face + i * 0.18, { v: 280, life: 0.55, dmg: 10, kind: "arrow", pierce: false, kb: 30, bnAdd: 1 }); sfx("volley"); }
    else if (wt === "bow" && tq === "swal") { p.roll = 0.2; p.rollDir = p.face + Math.PI; p.iframe = Math.max(p.iframe, 0.25); for (let i = -1; i <= 1; i++) shoot(p.face + i * 0.15, { v: 300, life: 0.6, dmg: 8, kind: "arrow", pierce: false, kb: 30 }); sfx("volley"); }
    else if (wt === "staff" && tq === "shower") { const tx = t ? t.x : p.x + Math.cos(p.face) * 60, ty = t ? t.y : p.y + Math.sin(p.face) * 60; for (let i = 0; i < 6; i++) W0.fires.push({ x: tx + rand(-28, 28), y: ty + rand(-20, 20), t: 0.3 + i * 0.07, r: 16, dmg: 16, c: "#ff8a3d", met: 1 }); sfx("dash"); }
    else if (wt === "staff" && tq === "doom") { const tx = t ? t.x : p.x + Math.cos(p.face) * 60, ty = t ? t.y : p.y + Math.sin(p.face) * 60; W0.fires.push({ x: tx, y: ty, t: 0.7, r: 26, dmg: 110, big: 1 }); sfx("dash"); }
    else if (wt === "staff" && tq === "wall") { const cx = p.x + Math.cos(p.face) * 34, cy = p.y + Math.sin(p.face) * 34, nx = -Math.sin(p.face), ny = Math.cos(p.face); for (let i = -2; i <= 2; i++) W0.walls.push({ x: cx + nx * i * 16, y: cy + ny * i * 16, t: 2, tick: 0 }); sfx("break"); }
    else if (wt === "blade" && tq === "gale") { W0.spinT = 1.5; W0.spinTick = 0; W0.spinK = "gale"; sfx("volley"); }
    else if (wt === "blade" && tq === "whirl") {
      const wr = 55 * AM(); afterAt(p.x, p.y, wr, 76);
      for (const m of W0.mobs) if (!m.dead && dist(m, p) < wr + WMOBS[m.type].r) { if (!m.boss) { const a = angTo(m, p), d = dist(m, p) * 0.6; moveBody(m, Math.cos(a) * d, Math.sin(a) * d, WMOBS[m.type].r); } hitMob(m, wDmg(76) * (m.boss ? 0.8 : 1), 0, p, true); }
      W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.3, r: wr, c: "255,220,170" }); sfx("break"); shake = Math.max(shake, 4);
    }
    else if (wt === "blade" && tq === "leap") { p.roll = t && dist(p, t) < 90 ? clamp(dist(p, t) / 250, 0.08, 0.28) : 0.28; p.rollDir = p.face; p.iframe = Math.max(p.iframe, 0.3); p.land = { r: 40, dmg: 55 }; sfx("dash"); }
    else if (wt === "fist" && tq === "chain") { p.roll = 0.18; p.rollDir = p.face; p.iframe = Math.max(p.iframe, 0.25); p.dashHit = new Set(); p.dashDmg = 25; p.dash2T = 1; sfx("dash"); }
    else if (wt === "fist" && tq === "tiger") { const tg = near(130) || t; if (tg) p.face = p.rollDir = angTo(p, tg); else p.rollDir = p.face; p.roll = tg ? clamp((dist(p, tg) - 6) / 250, 0.06, 0.5) : 0.18; p.iframe = Math.max(p.iframe, 0.25); p.dashHit = new Set(); p.dashDmg = 54; sfx("dash"); }
    else if (wt === "fist" && tq === "roar") {
      const rr = 58 * AM(); afterAt(p.x + Math.cos(p.face) * 24, p.y + Math.sin(p.face) * 24, rr * 0.7, 36);
      for (const m of W0.mobs) if (!m.dead && dist(m, p) < rr + WMOBS[m.type].r && Math.abs(((angTo(p, m) - p.face + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.9) { hitMob(m, wDmg(36), 170, p, true); m.slowT = Math.max(m.slowT || 0, 2); }
      W0.rings.push({ x: p.x + Math.cos(p.face) * 24, y: p.y + Math.sin(p.face) * 24, t: 0, max: 0.3, r: 40, c: "255,210,140" }); sfx("break"); shake = Math.max(shake, 5);
    }
    else if (wt === "fan" && tq === "suck") { W0.tornados.push({ x: p.x + Math.cos(p.face) * 14, y: p.y + Math.sin(p.face) * 14, vx: Math.cos(p.face) * 45, vy: Math.sin(p.face) * 45, t: 1.6, tick: 0, pull: 80, pr: 60, hr: 30, dmg: 11, sc: 1.4 }); sfx("volley"); }
    else if (wt === "fan" && tq === "storm") { W0.tornados.push({ x: p.x + Math.cos(p.face) * 14, y: p.y + Math.sin(p.face) * 14, vx: Math.cos(p.face) * 45, vy: Math.sin(p.face) * 45, t: 1.6, tick: 0, dmg: 10, boom: 34 }); sfx("volley"); }
    else if (wt === "fan" && tq === "ward") { W0.tornados.push({ x: p.x, y: p.y, vx: 0, vy: 0, t: 3, tick: 0, orbit: 0, dmg: 5.5 }); sfx("volley"); }
    else if (wt === "sword") { // 劍氣斬：三道穿透劍氣
      for (let i = -1; i <= 1; i++) shoot(p.face + i * 0.22, { v: 230, life: 0.6, dmg: 14, kind: "sword", pierce: true, kb: 50 });
      sfx("volley");
    } else if (wt === "staff") { // 火雨：在目標位置落下、範圍爆炸
      const tx = t ? t.x : p.x + Math.cos(p.face) * 60, ty = t ? t.y : p.y + Math.sin(p.face) * 60;
      W0.fires.push({ x: tx, y: ty, t: 0.45, r: 34, dmg: 60 }); sfx("dash"); // 08-A：30→60
    } else if (wt === "bow") { // 散射：五支箭
      for (let i = -2; i <= 2; i++) shoot(p.face + i * 0.18, { v: 280, life: 0.55, dmg: 9, kind: "arrow", pierce: false, kb: 30 });
      sfx("volley");
    } else if (wt === "blade") { // 旋風斬：身邊轉三圈
      W0.spinT = 0.6; W0.spinTick = 0; W0.spinK = null; sfx("volley");
    } else if (wt === "fist") { // 衝拳：往前衝、一路打
      p.roll = 0.18; p.rollDir = p.face; p.iframe = Math.max(p.iframe, 0.25); p.dashHit = new Set(); p.dashDmg = 45; sfx("dash"); // 08-A：16→45
    } else { // 旋風：慢慢往前飄、一直打
      W0.tornados.push({ x: p.x + Math.cos(p.face) * 14, y: p.y + Math.sin(p.face) * 14, vx: Math.cos(p.face) * 45, vy: Math.sin(p.face) * 45, t: 1.6, tick: 0 }); sfx("volley");
    }
  };
  // E：ultFx(trig)＝放出效果（不檢查能量）；trig＝觸發寶石／連發／連打（不放起源覺醒）
  const ultFx = (trig) => {
    const alt = triOf(wt, "e");
    if (alt) return eAltFx(alt);
    if (!trig && slotSkill("e") === "origin") { originStart(); W0.originCast = 1; return true; } // 四轉：起源覺醒
    if (WSKILL.ult.uq) { uniqueUlt(WSKILL.ult.uq, near); return true; }
    if (wt === "sword") { // 掌心雷：劈最近的怪和牠旁邊的
      const t = near(150); if (!t) return false;
      const r = 38 * AM(); bolts.push({ x: t.x, y: t.y, life: 0.3 });
      for (const m of W0.mobs) if (!m.dead && dist(m, t) < r) hitMob(m, wDmg(39), 40, t, true); // 企劃 35 §5：原本的 E ×1.5（補回天罰）
      afterAt(t.x, t.y, r, 39);
      sfx("crit"); shake = Math.max(shake, 6); flashT = 0.08; flashColor = "200,220,255";
      burst(t.x, t.y, "#cfe0ff", 26, 120, 0.6);
    } else if (wt === "staff") { // 冰環：身邊一圈傷害＋減速
      const r = 60 * AM();
      for (const m of W0.mobs) if (!m.dead && dist(m, p) < r) { hitMob(m, wDmg(27), 70, p, true); m.slowT = 3; }
      W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.35, r }); afterAt(p.x, p.y, r, 27);
      sfx("crit"); shake = Math.max(shake, 5); burst(p.x, p.y, "#bfefff", 30, 140, 0.5);
    } else if (wt === "bow") { // 穿雲箭：一支大箭穿透一整排
      const t = near(220); if (t) p.face = angTo(p, t);
      shoot(p.face, { v: 380, life: 0.8, dmg: 51, kind: "big", pierce: true, kb: 90 });
      sfx("crit"); shake = Math.max(shake, 4);
    } else if (wt === "blade") { // 裂地斬：往前一路炸開
      const t = near(120); if (t) p.face = angTo(p, t);
      for (let i = 1; i <= 5; i++) W0.fires.push({ x: p.x + Math.cos(p.face) * i * 22, y: p.y + Math.sin(p.face) * i * 22, t: 0.05 + i * 0.07, r: 18, dmg: 33, c: "#d8c8a0" });
      sfx("crit"); shake = Math.max(shake, 6);
    } else if (wt === "fist") { // 震地
      const r = 50 * AM();
      for (const m of W0.mobs) if (!m.dead && dist(m, p) < r) { hitMob(m, wDmg(36), 140, p, true); m.slowT = 1.2; }
      W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.3, r, c: "255,210,140" }); afterAt(p.x, p.y, r, 36);
      sfx("break"); shake = Math.max(shake, 8); burst(p.x, p.y, "#d8b080", 30, 140, 0.5);
    } else { // 清風：回血＋把怪吹開
      const heal = Math.min(Math.round(p.maxHp * 0.25 * (trig ? 0.4 : 1)), p.maxHp - p.hp); p.hp += heal;
      if (heal) floatText(p.x, p.y - 16, `+${heal}`, "#7dff8a");
      const r = 55 * AM();
      for (const m of W0.mobs) if (!m.dead && dist(m, p) < r) hitMob(m, wDmg(12), 160, p, true);
      W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.4, r, c: "160,255,190" });
      sfx("heal"); burst(p.x, p.y, "#a0ffbe", 24, 100, 0.6); fxPlay("heal", 0, 0, 32, 0.45, { follow: 1 });
    }
    return true;
  };
  // 第二版新 E 招（Lv.70／85／100，每把武器 3 招）
  const eAltFx = (k) => {
    const t = near(180), tx = t ? t.x : p.x + Math.cos(p.face) * 70, ty = t ? t.y : p.y + Math.sin(p.face) * 70; if (t) p.face = angTo(p, t);
    const F = p.face, cs = Math.cos(F), sn = Math.sin(F);
    if (typeof eNewFx === "function" && eNewFx(k, { p, t, tx, ty, F, cs, sn, near, shoot, castLater, arcHit })) return true; // 企劃 43 新招（enew.js）
    if (k === "storm") { for (let i = 0; i < 12; i++) W0.fires.push({ x: tx + rand(-32, 32), y: ty + rand(-24, 24), t: 0.2 + i * 0.06, r: 14, dmg: 27, c: "#bfe6ff" }); sfx("volley"); }
    else if (k === "nova") { for (let i = 0; i < 16; i++) shoot(F + (i / 16) * Math.PI * 2, { v: 240, life: 0.7, dmg: 57, kind: "sword", pierce: true, kb: 40 }); sfx("volley"); shake = Math.max(shake, 4); }
    else if (k === "judg") { W0.fires.push({ x: tx, y: ty, t: 0.6, r: 40, dmg: 120, c: "#e8f4ff" }); W0.rings.push({ x: tx, y: ty, t: 0, max: 0.6, r: 40, c: "230,240,255" }); sfx("arrive"); }
    else if (k === "blizz") { for (let i = 0; i < 10; i++) W0.fires.push({ x: tx + rand(-36, 36), y: ty + rand(-26, 26), t: 0.2 + i * 0.13, r: 20, dmg: 19.6, c: "#bfefff", slow: 2 }); sfx("volley"); }
    else if (k === "chainl") { shoot(F, { v: 260, life: 1.2, dmg: 72, kind: "orb", pierce: false, kb: 30, bnAdd: 6 }); bolts.push({ x: p.x, y: p.y, life: 0.2 }); sfx("crit"); }
    else if (k === "inferno") { for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; W0.walls.push({ x: p.x + Math.cos(a) * 40, y: p.y + Math.sin(a) * 30, t: 3, tick: 0, mul: 1.3 }); } sfx("break"); }
    else if (k === "barr") { for (let w = 0; w < 3; w++) castLater(w * 0.25, () => { for (let i = -3; i <= 3; i++) shoot(p.face + i * 0.12, { v: 300, life: 0.6, dmg: 8, kind: "arrow", pierce: false, kb: 20 }); sfx("volley"); }); }
    else if (k === "seekr") { for (let i = 0; i < 8; i++) shoot(F + (i - 3.5) * 0.17, { v: 260, life: 1.0, dmg: 11, kind: "arrow", pierce: false, kb: 20, home: true }); sfx("volley"); }
    else if (k === "star") { for (let i = 1; i <= 5; i++) W0.fires.push({ x: p.x + cs * i * 30, y: p.y + sn * i * 30, t: 0.25 + i * 0.1, r: 24, dmg: 40, c: "#ffe9a0" }); sfx("volley"); }
    else if (k === "cyclone") { W0.spinT = 2; W0.spinTick = 0; W0.spinK = "cyc"; sfx("volley"); }
    else if (k === "rift") { for (let i = 1; i <= 8; i++) W0.fires.push({ x: p.x + cs * i * 20, y: p.y + sn * i * 20, t: 0.05 + i * 0.05, r: 20, dmg: 34, c: "#d8c8a0" }); sfx("crit"); shake = Math.max(shake, 6); }
    else if (k === "exec") {
      const r = 60 * AM(); p.swing = p.swingMax = 0.3; p.swingR = 44;
      for (const m of W0.mobs) if (!m.dead && dist(m, p) < r + WMOBS[m.type].r && Math.abs(((angTo(p, m) - F + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 1.2) hitMob(m, wDmg(95) * (m.hp < m.max * 0.3 ? 2 : 1), 150, p, true);
      sfx("break"); shake = Math.max(shake, 7); flashT = 0.06; flashColor = "255,230,200";
    }
    else if (k === "hund") { for (let i = 0; i < 12; i++) castLater(i * 0.08, () => { const tg = near(60); if (tg) p.face = angTo(p, tg); p.swing = p.swingMax = 0.08; p.swingR = 14; arcHit(26, 0.9, 9, 20); sfx("hit"); }); }
    else if (k === "dragon") { const tg = near(140); if (tg) p.face = p.rollDir = angTo(p, tg); else p.rollDir = F; p.roll = tg ? clamp((dist(p, tg) - 6) / 250, 0.06, 0.5) : 0.2; p.iframe = Math.max(p.iframe, 0.3); p.land = { r: 50, dmg: 80 }; sfx("dash"); }
    else if (k === "gong") { shoot(F, { v: 240, life: 0.7, dmg: 70, kind: "big", pierce: true, kb: 120 }); sfx("crit"); shake = Math.max(shake, 4); }
    else if (k === "typh") { for (const da of [-0.4, 0, 0.4]) W0.tornados.push({ x: p.x + Math.cos(F + da) * 14, y: p.y + Math.sin(F + da) * 14, vx: Math.cos(F + da) * 45, vy: Math.sin(F + da) * 45, t: 2, tick: 0, dmg: 5.5 }); sfx("volley"); }
    else if (k === "bloom") { const h = Math.min(Math.round(p.maxHp * 0.15 * (CUR_DM < 1 ? 0.4 : 1) * brkMul()), p.maxHp - p.hp); p.hp += h; if (h) floatText(p.x, p.y - 16, `+${h}`, "#7dff8a"); for (let i = 0; i < 12; i++) shoot((i / 12) * Math.PI * 2, { v: 200, life: 0.9, dmg: 8, kind: "wind", pierce: true, kb: 20, back: 0.4 }); sfx("heal"); }
    // 企劃 35：中期 E（Lv.20／35／55）
    else if (k === "array") { W0.orbs = W0.orbs.filter((o) => !o.eArr); for (let i = 0; i < 4; i++) W0.orbs.push({ t: 5, hit: new Map(), dmg: 55, eArr: 1 }); W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.3, r: 26, c: "200,230,255" }); sfx("arrive"); }
    else if (k === "cold") {
      const L = 160, r0 = 16 * AM(); let n = 0;
      for (const m of W0.mobs) { if (m.dead) continue; const dx = m.x - p.x, dy = m.y - p.y, along = dx * cs + dy * sn, perp = Math.abs(-dx * sn + dy * cs); if (along > -6 && along < L + 6 && perp < r0 + WMOBS[m.type].r) { hitMob(m, wDmg(90), 60, p, true); n++; } }
      for (let i = 0; i <= 16; i++) particles.push({ x: p.x + cs * i * 10, y: p.y - 3 + sn * i * 10, vx: rand(-10, 10), vy: rand(-10, 10), life: 0.45, max: 0.45, color: "#e8f6ff", size: 2 });
      moveBody(p, cs * L, sn * L, 5); p.iframe = Math.max(p.iframe, 0.3); afterAt(p.x, p.y, 30, 90);
      sfx("crit"); shake = Math.max(shake, n ? 5 : 2); flashT = 0.05; flashColor = "220,240,255";
    }
    else if (k === "domain") { W0.swDom = { x: p.x, y: p.y, r: 60 * AM(), t: 5, tick: 0, sl: CUR_SL, dm: CUR_DM }; sfx("arrive"); }
    else if (k === "freeze") {
      const rr = 80 * AM(); { let nb = null, bd = rr + 20; for (const m of W0.mobs) if (!m.dead && dist(m, p) < bd) { bd = dist(m, p); nb = m; } if (nb && !(mouseAim() && t)) p.face = angTo(p, nb); } // 沒瞄到也朝最近的怪
      const F2 = p.face;
      for (const m of W0.mobs) if (!m.dead && dist(m, p) < rr + WMOBS[m.type].r && Math.abs(((angTo(p, m) - F2 + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.75) { hitMob(m, wDmg(55), 30, p, true); m.frz = Math.max(m.frz || 0, m.boss ? 0.5 : 1.5); m.slowT = Math.max(m.slowT || 0, 3); }
      for (let i = 0; i < 30; i++) { const a = F2 + rand(-0.75, 0.75), v = rand(80, 200); particles.push({ x: p.x, y: p.y - 3, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.4, max: 0.4, color: "#bfefff", size: 2 }); }
      sfx("crit"); shake = Math.max(shake, 4);
    }
    else if (k === "tstorm") { for (let i = 0; i < 12; i++) castLater(0.1 + i * 0.25, () => { const ms = W0.mobs.filter((m) => !m.dead && dist(m, p) < 110); const tg = ms.length ? ms[(Math.random() * ms.length) | 0] : null, bx = tg ? tg.x : p.x + rand(-70, 70), by = tg ? tg.y : p.y + rand(-50, 50), br = 30 * AM(); bolts.push({ x: bx, y: by, life: 0.25 }); for (const m of W0.mobs) if (!m.dead && dist(m, { x: bx, y: by }) < br + WMOBS[m.type].r) hitMob(m, wDmg(6), 20, { x: bx, y: by }, true); fxBoom(bx, by, br, "190,210,255"); if (i % 3 === 0) sfx("crit"); }); }
    else if (k === "hole") { W0.voids.push({ x: tx, y: ty, t: 2, max: 2, tick: 0, mul: 0.8 }); sfx("arrive"); }
    else if (k === "blast") { const d = t ? dist(p, t) : 120; shoot(F, { v: 320, life: d / 320, dmg: 15, kind: "arrow", pierce: false, kb: 20 }); W0.fires.push({ x: t ? t.x : p.x + cs * 120, y: t ? t.y : p.y + sn * 120, t: d / 320 + 0.02, r: 42, dmg: 60, c: "#ffb060", kb: 90 }); sfx("volley"); }
    else if (k === "turret") { W0.turret = { x: p.x + cs * 12, y: p.y + sn * 12, t: 6, cd: 0.2, sl: CUR_SL, dm: CUR_DM }; W0.rings.push({ x: W0.turret.x, y: W0.turret.y, t: 0, max: 0.3, r: 18, c: "255,230,160" }); sfx("arrive"); }
    else if (k === "pierce9") { W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.5, r: 30, c: "255,240,180" }); castLater(0.5, () => { const t2 = near(260); if (t2) p.face = angTo(p, t2); shoot(p.face, { v: 700, life: 0.6, dmg: 66, kind: "big", pierce: true, kb: 60 }); sfx("crit"); shake = Math.max(shake, 6); flashT = 0.06; flashColor = "255,245,200"; }); }
    else if (k === "fury") {
      const rr = 72 * AM(); p.swing = p.swingMax = 0.3; p.swingR = 50;
      for (const m of W0.mobs) if (!m.dead && dist(m, p) < rr + WMOBS[m.type].r && Math.abs(((angTo(p, m) - F + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 1.1) hitMob(m, wDmg(60), 230, p, true);
      afterAt(p.x + cs * 30, p.y + sn * 30, rr * 0.7, 60); sfx("break"); shake = Math.max(shake, 7);
    }
    else if (k === "blades") { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; W0.fires.push({ x: p.x + Math.cos(a) * 34, y: p.y + Math.sin(a) * 26, t: 1, r: 22, dmg: 44.8, c: "#d8c8a0" }); } sfx("break"); }
    else if (k === "titan") { W0.titanT = 5; W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.4, r: 26, c: "255,190,110" }); floatText(p.x, p.y - 20, "霸體", "#ffbe6e"); sfx("arrive"); }
    else if (k === "palm") { W0.fires.push({ x: p.x + cs * 38, y: p.y + sn * 38, t: 0.12, r: 42, dmg: 66, c: "#ffd08a", kb: 200 }); p.swing = p.swingMax = 0.15; p.swingR = 20; sfx("break"); shake = Math.max(shake, 6); }
    else if (k === "thous") { for (let i = 0; i < 15; i++) { const d = rand(20, 75), sd = rand(-26, 26); W0.fires.push({ x: p.x + cs * d - sn * sd, y: p.y + sn * d + cs * sd, t: 0.15 + i * 0.1, r: 16, dmg: 12, c: "#ffd08a", kb: 20 }); } sfx("volley"); }
    else if (k === "dragf") { W0.dragT = 5; W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.4, r: 26, c: "120,230,200" }); floatText(p.x, p.y - 20, "化龍", "#7ee6c8"); sfx("arrive"); }
    else if (k === "healz") { W0.healZ = { x: p.x, y: p.y, r: 40 * AM(), t: 4 }; sfx("heal"); fxPlay("heal", 0, 0, 32, 0.45, { follow: 1 }); }
    else if (k === "petal") { for (let i = 0; i < 10; i++) castLater(i * 0.2, () => { const t2 = near(90); if (t2) p.face = angTo(p, t2); arcHit(70, 0.6, 7.2, 10); for (let j = 0; j < 4; j++) { const a = p.face + rand(-0.6, 0.6), v = rand(90, 160); particles.push({ x: p.x, y: p.y - 3, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.45, max: 0.45, color: j % 2 ? "#ffc0d8" : "#fff0f6", size: 2 }); } }); sfx("volley"); }
    else if (k === "wwall") { W0.wwall = { x: p.x + cs * 28, y: p.y + sn * 28, a: F, t: 4, half: 32 * AM() }; sfx("volley"); }
    else if (k === "zephyr") { W0.tornados = W0.tornados.filter((o) => !(o.orbit !== undefined && o.zep && !o.ghost)); W0.tornados.push({ x: p.x, y: p.y, vx: 0, vy: 0, t: 5, tick: 0, orbit: 0, dmg: 5, zep: 1 }); sfx("volley"); }
    return true;
  };
  const SLFX = { a: () => atkFx(), q: () => doSpin(), e: () => ultFx(true) };
  const slotCast = (sl, manual) => { // 手動出招：法壇、連發、連打
    if (sl === "a" && manual && W0.dragT > 0) cast("e", () => shoot(p.face, { v: 260, life: 0.45, dmg: 6, kind: "big", pierce: true, kb: 30 })); // 化龍：每拳多一道龍氣
    const tl = sl === "a" || sl === "q" ? gemLv("totem", sl) : 0;
    if (tl && manual) {
      if (!W0.totems) W0.totems = [];
      const mine = W0.totems.filter((o) => o.sl === sl), old = mine[mine.length - 1], tn = typeof trTotemN === "function" ? trTotemN() : 1; // 天賦樹「法壇」：可以放 2 座
      if (mine.length >= tn) W0.totems = W0.totems.filter((o) => o !== mine[0]);
      W0.totems.push({ x: p.x, y: p.y, sl, t: 6 + tl, max: 6 + tl, cd: old ? old.cd : 0.15, every: Math.max(0.5, WSKILL[sl === "a" ? "attack" : "spin"].cd), dm: 0.5 * (tn > 1 ? 1.08 : 1) });
      if (!old) { sfx("arrive"); seenHint("totem", "法壇：這招會自己朝附近的怪放；再按一次可以把法壇搬到腳下"); }
      return true;
    }
    const r = manual && sl === "e" ? cast(sl, () => ultFx(false)) : cast(sl, SLFX[sl]);
    if (manual) {
      const gm = gemLv("multi", sl); if (gm && Math.random() < 0.25 + gm * 0.1) W0["rc" + sl] = 0.2; // 連發
      const gr = gemLv("rapid", sl); if (gr) W0.rapidQ = { sl, n: 2, t: 0.1, dm: 0.65 + gr * 0.02 }; // 連打
    }
    return r;
  };
  if ((act("attack", "j", "z") || autoAtk || ((keys.has("j") || mouse.down || (padHeld.has("attack") && !inMenu)) && p.cds.attack <= 0)) && useSkill("attack")) slotCast("a", true);
  if (p.dash2T > 0) p.dash2T -= dt;
  if (p.dash2T > 0 && p.roll <= 0 && wt === "fist" && act("spin", "k", "x", "q")) { // 連環衝：第二衝不扣真氣、不吃冷卻
    p.dash2T = 0; const t2 = near(160); if (t2) p.face = angTo(p, t2);
    p.roll = 0.18; p.rollDir = p.face; p.iframe = Math.max(p.iframe, 0.25); p.dashHit = new Set(); p.dashDmg = 25; p.dashSl = "q"; p.dashDm = 1; sfx("dash"); netCast("q", p.face, p.x, p.y, "chain");
  } else if (act("spin", "k", "x", "q") && useSkill("spin")) {
    slotCast("q", true); fxCast(WPN_FX[wt]);
  }
  const ultCd0 = p.cds.ult;
  if (act("ult", "u", "e") && p.cds.ult <= 0 && (p.en || 0) < EN_FULL) { if (!p.enMsgT) { floatText(p.x, p.y - 20, `${WSKILL.ult.uq ? WSKILL.ult.n + "：" : ""}天罰能量 ${Math.floor(p.en || 0)}%（斬妖集滿）`, "#b8a0ff"); p.enMsgT = 1; } }
  if (p.enMsgT > 0) p.enMsgT = Math.max(0, p.enMsgT - dt) || 0;
  if (act("ult", "u", "e") && p.cds.ult <= 0 && (p.en || 0) >= EN_FULL) {
    W0.originCast = 0;
    if (wt === "sword" && slotSkill("e") === "base" && !near(150)) floatText(p.x, p.y - 20, "附近沒有目標", "#cfc4dc");
    else if (useSkill("ult")) { slotCast("e", true); if (W0.originCast) { p.en = 0; eNameShow("起源覺醒"); } }
  }
  if (p.cds.ult > ultCd0 && !W0.originCast) { p.en = 0; W0.enFullFx = false; eNameShow(WSKILL.ult.n); netCast("e", p.face, p.x, p.y); } // 企劃 35 §5：拿掉附帶的天罰（全畫面落雷），改成上方小字顯示招式名
  // 觸發寶石（只能串 E）：暴擊／受傷時自動放 E，不用天罰能量
  if (p.trigCd > 0) p.trigCd -= dt;
  if ((p.critEv || p.hurtEv) && !inMenu && !(p.trigCd > 0) && wLv() >= E_LV) {
    const gc = p.critEv ? gemLv("trigc", "e") : 0, gh = p.hurtEv ? gemLv("trigh", "e") : 0, l = Math.max(gc, gh);
    const cost = Math.round(TRIG_MP * chainMpMul("e"));
    if (l && mpCan(p, cost)) { p.trigCd = 1; mpPay(p, cost); cast("e", () => ultFx(true), 0.8); }
  }
  p.critEv = 0; p.hurtEv = 0;
  for (const sl of ["a", "q", "e"]) if (W0["rc" + sl] > 0 && (W0["rc" + sl] -= dt) <= 0) { W0["rc" + sl] = 0; cast(sl, SLFX[sl]); floatText(p.x, p.y - 20, "連發！", "#ffb347"); }
  if (W0.rapidQ && (W0.rapidQ.t -= dt) <= 0) { const R = W0.rapidQ; cast(R.sl, SLFX[R.sl], R.dm); if (--R.n <= 0) W0.rapidQ = null; else R.t = 0.1; }
  if (W0.totems && W0.totems.length) { // 法壇：朝附近的怪自動放
    for (const T of W0.totems) {
      T.t -= dt; T.cd -= dt; if (T.cd > 0 || T.t <= 0) continue;
      let tg = null, bd = 170; for (const m of W0.mobs) if (!m.dead && !m.noTarget) { const d = dist(m, T); if (d < bd) { bd = d; tg = m; } }
      if (!tg) continue;
      T.cd = T.every; T.fire = 0.15;
      const sx = p.x, sy = p.y, sf = p.face, sw = p.swing, swm = p.swingMax; p.x = T.x; p.y = T.y + 3; p.face = angTo(p, tg); W0.noAim = true;
      try { cast(T.sl, SLFX[T.sl], T.dm); } finally { p.x = sx; p.y = sy; p.face = sf; p.swing = sw; p.swingMax = swm; W0.noAim = false; }
    }
    W0.totems = W0.totems.filter((T) => T.t > 0);
  }
  if (W0.turret) { // 企劃 35 弩台：6 秒自動射
    const T = W0.turret; T.t -= dt; T.cd -= dt;
    if (T.cd <= 0) { let tg = null, bd = 170; for (const m of W0.mobs) if (!m.dead && !m.noTarget) { const d = dist(m, T); if (d < bd) { bd = d; tg = m; } }
      if (tg) { T.cd = 0.3; const sx = p.x, sy = p.y; p.x = T.x; p.y = T.y + 3; W0.noAim = true; try { cast(T.sl || "e", () => shoot(angTo(p, tg), { v: 320, life: 0.6, dmg: 7.2, kind: "arrow", pierce: false, kb: 15 }), T.dm || 1); } finally { p.x = sx; p.y = sy; W0.noAim = false; } } }
    if (T.t <= 0) W0.turret = null;
  }
  if (W0.swDom) { const D = W0.swDom; D.t -= dt; D.tick -= dt; if (D.tick <= 0) { D.tick = 0.5; CUR_SL = D.sl || "e"; CUR_DM = D.dm || 1; for (const m of W0.mobs) if (!m.dead && dist(m, D) < D.r + WMOBS[m.type].r) hitMob(m, wDmg(4), 0, D, true); CUR_SL = null; CUR_DM = 1; } if (D.t <= 0) W0.swDom = null; }
  if (W0.titanT > 0) W0.titanT -= dt;
  if (W0.dragT > 0) W0.dragT -= dt;
  if (W0.healZ) { const H = W0.healZ; H.t -= dt; H.fx = (H.fx || 0) - dt; if (H.fx <= 0 && dist(p, H) < H.r) { H.fx = 0.8; fxPlay("heal", 0, 0, 26, 0.4, { follow: 1 }); } if (dist(p, H) < H.r && p.hp < p.maxHp) { H.acc = (H.acc || 0) + p.maxHp * 0.03 * dt * brkMul(); if (H.acc >= 1) { const h = Math.min(Math.floor(H.acc), p.maxHp - p.hp); p.hp += h; H.acc -= Math.floor(H.acc); } } if (H.t <= 0) W0.healZ = null; }
  if (W0.wwall) { const V = W0.wwall, c = Math.cos(V.a), s2 = Math.sin(V.a); V.t -= dt;
    for (const s of W0.eshots) { const dx = s.x - V.x, dy = s.y - V.y; if (Math.abs(dx * c + dy * s2) < 10 && Math.abs(-dx * s2 + dy * c) < V.half && s.life > 0) { s.life = 0; burst(s.x, s.y, "#c8f0e0", 5, 50, 0.3); } }
    if (V.t <= 0) W0.wwall = null; }
  if (p.guardT2 > 0 && (p.guardT2 -= dt) <= 0) p.guardSh = 0;
  if (W0.rshT > 0) W0.rshT -= dt;
  if (W0.bellT > 0) W0.bellT -= dt;
  if (W0.justAtk) { W0.justAtk = false; netCast("a", p.face, p.x, p.y, typeof triOf === "function" ? triOf(wt, "a") : null); }
  if (B.noRoll && act("roll", " ", "l", "shift") && !(p.nrMsg > time)) { p.nrMsg = time + 1.5; floatText(p.x, p.y - 20, "不動明王：不能閃身", "#e8c87a"); }
  if (!B.noRoll && act("roll", " ", "l", "shift") && useSkill("roll")) cast("r", () => {
    const tr = typeof triOf === "function" ? triOf(wt, "r") : null; // 身法
    if (tr === "blink") { // 縮地：瞬間移到前面 70
      const a = ml > 0.1 ? Math.atan2(my, mx) : p.face, ar = typeof wbArena === "function" ? wbArena() : null, gt = gemLv("trail"), gi = gemLv("icepath");
      burst(p.x, p.y, "#bfe6ff", 10, 60, 0.3);
      for (let i = 0; i < 7; i++) {
        const ox = p.x, oy = p.y, wasIn = ar && Math.hypot(p.x - ar.x, p.y - ar.y) <= ar.r;
        moveBody(p, Math.cos(a) * 10, Math.sin(a) * 10, 5);
        if (wasIn && Math.hypot(p.x - ar.x, p.y - ar.y) > ar.r) { p.x = ox; p.y = oy; break; }
        if (gt && i % 2 === 0) W0.fires.push({ x: p.x, y: p.y, t: 0.12, r: 16, dmg: 4 + gt * 2, c: "#bfe6ff" });
        if (gi) W0.walls.push({ x: p.x, y: p.y, t: 1.5 + gi * 0.5, tick: 0, ice: 1 });
      }
      const gs = gemLv("rshield"); if (gs) W0.rshT = 1.5 + gs * 0.25;
      p.iframe = Math.max(p.iframe, 0.2); burst(p.x, p.y, "#bfe6ff", 14, 80, 0.3); sfx("dash"); return;
    }
    if (tr === "pull") { // 聚妖：把附近的怪吸過來、變慢
      const r = 110 * AM();
      for (const m of W0.mobs) if (!m.dead && !m.noTarget && dist(m, p) < r + WMOBS[m.type].r) { if (!m.boss) { const a = angTo(m, p), d = dist(m, p) * 0.7; moveBody(m, Math.cos(a) * d, Math.sin(a) * d, WMOBS[m.type].r); } m.slowT = Math.max(m.slowT || 0, 1.5); hitMob(m, wDmg(5), 0, p, true); }
      W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.35, r, c: "200,150,255" }); afterAt(p.x, p.y, 40, 5); sfx("volley"); return;
    }
    if (tr === "guard") { p.guardSh = Math.round(p.maxHp * 0.2); p.guardT2 = 3; W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.35, r: 20, c: "255,230,150" }); floatText(p.x, p.y - 20, "護體", "#ffe08a"); sfx("arrive"); return; }
    p.roll = 0.22; p.rollDir = ml > 0.1 ? Math.atan2(my, mx) : p.face; p.iframe = Math.max(p.iframe, 0.3); sfx("dash");
    if (tr === "ghost") { p.ghostT = 0; p.ghostN = Math.max(p.ghostN || 0, 5); p.ghostSl = "r"; }
    else if (tr === "surge") { W0.sureT = 1.5; }
    else if (tr === "wave") { p.cds.roll *= 0.7; p.mp = Math.min(B.maxMp, p.mp + 8); }
    moveRunes("r");
  });
  W0.sureCast = false; if (W0.sureT > 0) W0.sureT -= dt;
  if (W0.kcT > 0) { W0.kcT -= dt; if (W0.kcT <= 0) W0.kc = 0; }
  if (W0.kcPop > 0) W0.kcPop -= dt;
  if (W0.potHintT > 0) W0.potHintT -= dt;
  const autoPot = w.autoPot !== false && p.hp < p.maxHp * 0.3 && !inMenu; // 設定：低血量自動喝藥（預設開）
  const potKey = act("potion", "h", "4");
  if (potKey && p.cds.potion > 0 && W0.potCd && !(W0.potHintT > 0)) { floatText(p.x, p.y - 16, `丹藥冷卻 ${Math.ceil(p.cds.potion)} 秒`, "#ff9a7a"); W0.potHintT = 1; }
  if ((potKey || autoPot) && w.potions > 0 && p.hp < p.maxHp && useSkill("potion")) {
    w.potions--; W0.potCd = bossHitNow() ? 6 : 0; if (W0.potCd) p.cds.potion = W0.potCd; // 打區域王：丹藥冷卻 6 秒（企劃 13：不能站著吃招靠丹藥硬撐）
    const heal = Math.min(Math.round(p.maxHp * 0.4 * B.potionMul), p.maxHp - p.hp); p.hp += heal;
    floatText(p.x, p.y - 16, `+${heal}`, "#7dff8a"); burst(p.x, p.y, "#7dff8a", 12, 40); fxPlay("heal", 0, 0, 28, 0.4, { follow: 1 }); sfx("heal"); writeSave();
    if (W0.potCd) seenHint("potCd", "打區域王時丹藥要冷卻 6 秒，靠躲招撐住！");
  }

  // 劍氣飛行
  for (const s of W0.pshots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.back !== undefined && s.life < s.back && !s.turned) { s.turned = true; s.hit.clear(); }
    if (s.turned) { const a = angTo(s, p); s.vx = Math.cos(a) * 220; s.vy = Math.sin(a) * 220; s.a += dt * 20; if (dist(s, p) < 8) { s.life = 0; if (s.heal && s.hits && !s.ghost) { const h = Math.min(Math.round(p.maxHp * Math.min(0.03, 0.005 * s.hits) * brkMul()), p.maxHp - p.hp); if (h > 0) { p.hp += h; floatText(p.x, p.y - 16, `+${h}`, "#7dff8a"); } } } }
    else if (s.kind === "wind") s.a += dt * 20;
    if (s.home && !s.ghost) { // 追蹤箭：每 0.1 秒找目標，轉向有上限
      if ((s.seekT = (s.seekT || 0) - dt) <= 0) { s.seekT = 0.1; let o = null, bd = 120; for (const m of W0.mobs) if (!m.dead && !s.hit.has(m)) { const d = dist(m, s); if (d < bd) { bd = d; o = m; } } s.tgt = o; }
      if (s.tgt && !s.tgt.dead) { const want = angTo(s, s.tgt), cur = Math.atan2(s.vy, s.vx), v = Math.hypot(s.vx, s.vy); let da = ((want - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI; da = clamp(da, -6 * (s.homeR || 1) * dt, 6 * (s.homeR || 1) * dt); const na = cur + da; s.vx = Math.cos(na) * v; s.vy = Math.sin(na) * v; s.a = na; }
    }
    if (solid(s.x, s.y) && !s.turned) {
      if (s.back !== undefined) { s.turned = true; s.hit.clear(); }
      else if (s.bn > 0) { s.bn--; if (solid(s.x - s.vx * dt, s.y)) s.vy = -s.vy; else s.vx = -s.vx; s.x -= s.vx * dt * -1; s.a = Math.atan2(s.vy, s.vx); } // 彈跳：撞牆折射
      else s.life = 0;
    }
    if (s.ghost) continue; // 別人的招式：只有畫面
    CUR_SL = s.sl || null; CUR_DM = s.dm || 1;
    if (s.rbm && s.turned && !s.rbDone) { s.rbDone = true; s.dmg *= 0.4; } // 迴旋：回程 40%
    for (const m of W0.mobs) if (s.life > 0 && !m.dead && !s.hit.has(m) && Math.hypot(m.x - s.x, m.y - s.y) < WMOBS[m.type].r + (s.kind === "big" ? 7 : 4)) {
      s.hit.add(m);
      if (s.boom) { s.life = 0; W0.sureNow = !!s.sure; for (const n of W0.mobs) if (!n.dead && Math.hypot(n.x - s.x, n.y - s.y) < s.boom.r + WMOBS[n.type].r) hitMob(n, wDmg(s.boom.dmg), s.boom.kb, s, true); W0.sureNow = false; fxBoom(s.x, s.y, s.boom.r, "140,210,255"); break; } // 爆裂法球
      if (shieldBlock(m, s)) break; // 鐵盾妖：正面擋掉
      let gm = 1; if (s.grp && m.boss) { if (s.grp.hit.has(m)) gm = 0.5; else s.grp.hit.add(m); }
      W0.critAdd = s.critAdd || 0; W0.sureNow = !!s.sure; hitMob(m, wDmg(s.dmg) * gm, s.kb, p, true); W0.critAdd = 0; W0.sureNow = false;
      if (s.slow) m.slowT = Math.max(m.slowT || 0, s.slow);
      if (s.heal) s.hits = (s.hits || 0) + 1;
      if ((B.uq.split || s.spl) && !s.child && !s.split) { // 傳說／分裂寶石：分成小的往旁邊飛（分出來的不再分裂、不吃多重投射）
        s.split = true; const n = B.uq.split ? 3 : s.spl, sp = n === 3 ? [-1, 0, 1] : [-1, 1];
        for (const i of sp) { if (ownShots() >= 60) break; const a = s.a + i * 0.7 + rand(-0.1, 0.1); W0.pshots.push({ x: s.x, y: s.y, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240, a, life: 0.45, dmg: s.dmg * 0.5, kind: s.kind === "big" ? "sword" : s.kind, pierce: false, kb: 20, child: true, noMulti: true, bn: B.uq.bounce ? 2 : 0, hit: new Set([m]), sl: s.sl, dm: s.dm }); }
      }
      if (s.bn > 0) { // 傳說：彈跳到下一隻
        let o = null, bd = 120; for (const n of W0.mobs) if (!n.dead && !s.hit.has(n)) { const dd = dist(n, s); if (dd < bd) { bd = dd; o = n; } }
        if (o) { s.bn--; if (s.bnR) s.dmg *= 0.8; const a = angTo(s, o), v = Math.hypot(s.vx, s.vy); s.vx = Math.cos(a) * v; s.vy = Math.sin(a) * v; s.a = a; s.life = Math.max(s.life, 0.45); burst(s.x, s.y, "#bfe6ff", 4, 40); continue; }
      }
      if (!s.pierce) { s.life = 0; burst(s.x, s.y, s.kind === "orb" ? "#9fdcff" : "#ffe9a0", 5, 40); }
    }
  }
  CUR_SL = null; CUR_DM = 1;
  W0.pshots = W0.pshots.filter((s) => s.life > 0);
  const afs = [];
  for (const f of W0.fires) { // 火雨落地
    f.t -= dt;
    if (f.t <= 0) {
      CUR_SL = f.sl || null; CUR_DM = f.dm || 1;
      if (!f.ghost) for (const m of W0.mobs) if (!m.dead && dist(m, f) < f.r + WMOBS[m.type].r) { hitMob(m, wDmg(f.dmg), f.kb || 40, f, true); if (f.slow) m.slowT = Math.max(m.slowT || 0, f.slow); }
      if (f.af && !f.ghost) afs.push({ x: f.x, y: f.y, t: 0.5, r: f.r, dmg: f.dmg * (0.4 + (f.af - 1) * 0.075), c: "#e0b080", isAf: 1, sl: f.sl, dm: f.dm }); // 餘震
      CUR_SL = null; CUR_DM = 1;
      if (f.ghost) { if (allyA()) fxBoom(f.x, f.y, f.r * 1.1, "255,150,60"); continue; }
      fxBoom(f.x, f.y, f.r * 1.1, f.c === "#ff8a3d" || !f.c ? "255,150,60" : f.c === "#d8c8a0" ? "230,200,150" : "255,235,170");
      if (f.c) { burst(f.x, f.y, f.c, 14, 90, 0.4); shake = Math.max(shake, 3); if (Math.random() < 0.4) sfx("break"); }
      else { burst(f.x, f.y, "#ff8a2e", 36, 130, 0.6); burst(f.x, f.y, "#ffd84a", 16, 80, 0.4); shake = Math.max(shake, 5); sfx("break"); }
    }
  }
  W0.fires = W0.fires.filter((f) => f.t > 0).concat(afs);
  for (const f of W0.walls) { // 火牆：每 0.4 秒燒一次、走過去變慢
    f.t -= dt; f.tick -= dt;
    CUR_SL = f.sl || null; CUR_DM = f.dm || 1;
    if (!f.ghost) for (const m of W0.mobs) if (!m.dead && dist(m, f) < (f.hr || 10) + WMOBS[m.type].r) { m.slowT = Math.max(m.slowT || 0, f.ice ? 1 : 0.4); if (f.tick <= 0 && !f.ice) { DOT_HIT = true; hitMob(m, wDmg(11 * (f.mul || 1)), 0, f, true); DOT_HIT = false; } }
    CUR_SL = null; CUR_DM = 1;
    if (f.tick <= 0) f.tick = 0.4;
    if (f.ice) { if (Math.random() < 0.08) particles.push({ x: f.x + rand(-5, 5), y: f.y + rand(-2, 2), vx: 0, vy: -8, life: 0.4, max: 0.4, color: "#dff6ff", size: 1.5 }); continue; }
    if (Math.random() < 0.5) particles.push({ x: f.x + rand(-6, 6), y: f.y + rand(-2, 2), vx: rand(-5, 5), vy: -rand(25, 45), life: 0.4, max: 0.4, color: Math.random() < 0.5 ? "#ff8a2e" : "#ffd84a", size: 2 });
  }
  W0.walls = W0.walls.filter((f) => f.t > 0);
  for (const r of W0.rings) r.t += dt;
  W0.rings = W0.rings.filter((r) => r.t < r.max);
  if (W0.guardT > 0) W0.guardT -= dt;
  if (W0.focusT > 0) W0.focusT -= dt;
  if (W0.spinT > 0) { // 旋風斬
    W0.spinT -= dt; W0.spinTick -= dt;
    if (W0.spinTick <= 0) { W0.spinTick = 0.15; CUR_SL = W0.spinSl || null; CUR_DM = W0.spinDm || 1; const sr = 40 * areaMul(CUR_SL); for (const m of W0.mobs) if (!m.dead && dist(m, p) < sr + WMOBS[m.type].r) hitMob(m, wDmg(W0.spinK === "gale" ? 8.5 : W0.spinK === "cyc" ? 8 : 17) * (m.boss ? 0.8 : 1), 60, p, true); CUR_SL = null; CUR_DM = 1; sfx("dash"); }
  }
  for (const t of W0.tornados) {
    t.t -= dt; t.tick -= dt; CUR_SL = t.sl || null; CUR_DM = t.dm || 1;
    if (t.orbit !== undefined) { const o = t.own || p; t.orbit += dt * 6; t.x = o.x + Math.cos(t.orbit) * 22; t.y = o.y + Math.sin(t.orbit) * 16; } // 風陣：繞著自己轉
    else moveBody(t, t.vx * dt, t.vy * dt, 3);
    if (t.orbit !== undefined && !t.ghost) for (const s of W0.eshots) if (Math.hypot(s.x - p.x, s.y - p.y) < 36) { s.life = 0; burst(s.x, s.y, "#c8f0e0", 5, 50, 0.3); } // 吹散敵方子彈
    if (!t.ghost) for (const m of W0.mobs) if (!m.dead && dist(m, t) < (t.pr || 40)) { const a = angTo(m, t), f = t.pull || 40; moveBody(m, Math.cos(a) * f * dt, Math.sin(a) * f * dt, WMOBS[m.type].r); }
    if (t.tick <= 0 && !t.ghost) { t.tick = 0.25; DOT_HIT = true; for (const m of W0.mobs) if (!m.dead && dist(m, t) < (t.hr || 22) + WMOBS[m.type].r) hitMob(m, wDmg((t.dmg || 13) * (typeof TORN_K !== "undefined" ? TORN_K : 1)), 0, t, true); DOT_HIT = false; if (t.boom && wEle() === "T") stormVolt(t); } // 08-A：6→13；風雷＋雷元素：每下多跳一隻
    if (t.t <= 0 && t.boom) { fxBoom(t.x, t.y, 34, "190,220,255"); bolts.push({ x: t.x, y: t.y, life: 0.25 }); shake = Math.max(shake, 4); sfx("crit"); if (!t.ghost) for (const m of W0.mobs) if (!m.dead && dist(m, t) < 34 + WMOBS[m.type].r) hitMob(m, wDmg(t.boom), 80, t, true); }
    if (Math.random() < 0.7) particles.push({ x: t.x + rand(-6, 6), y: t.y + rand(-4, 4), vx: rand(-30, 30), vy: -50, life: 0.35, max: 0.35, color: "#c8f0e0", size: 2 });
  }
  CUR_SL = null; CUR_DM = 1;
  W0.tornados = W0.tornados.filter((t) => t.t > 0);
  for (const v of W0.voids) { // 引力黑洞：吸怪、持續傷害、最後爆開
    v.t -= dt; v.tick -= dt; CUR_SL = v.sl || null; CUR_DM = v.dm || 1;
    if (!v.ghost) {
      for (const m of W0.mobs) if (!m.dead && !m.boss && dist(m, v) < 95 && dist(m, v) > 4) { const a = angTo(m, v); moveBody(m, Math.cos(a) * 90 * dt, Math.sin(a) * 90 * dt, WMOBS[m.type].r); }
      if (v.tick <= 0) { v.tick = 0.25; DOT_HIT = true; for (const m of W0.mobs) if (!m.dead && dist(m, v) < 40 + WMOBS[m.type].r) hitMob(m, wDmg(7 * (v.mul || 1)), 0, v, true); DOT_HIT = false; }
      if (v.t <= 0) { for (const m of W0.mobs) if (!m.dead && dist(m, v) < 55 + WMOBS[m.type].r) hitMob(m, wDmg(30 * (v.mul || 1)), 120, v, true); shake = Math.max(shake, 7); sfx("crit"); }
    }
    if (v.t <= 0) { fxBoom(v.x, v.y, 55, "190,140,255"); W0.rings.push({ x: v.x, y: v.y, t: 0, max: 0.4, r: 60, c: "190,150,255", ghost: v.ghost }); }
    if (Math.random() < 0.8) { const a = rand(0, 6.28), r = rand(30, 80); particles.push({ x: v.x + Math.cos(a) * r, y: v.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 2, vy: -Math.sin(a) * r * 2, life: 0.4, max: 0.4, color: v.ghost ? "rgba(200,170,255,0.3)" : "#c9a8ff", size: 1.5 }); }
  }
  CUR_SL = null; CUR_DM = 1;
  W0.voids = W0.voids.filter((v) => v.t > 0);
  W0.orbs = W0.orbs.filter((o) => (o.t -= dt) > 0);
  W0.orbClk = (W0.orbClk || 0) + dt; const oc = W0.orbClk; // 自己的時鐘（不靠畫面的 time，機器人直接呼叫 updateWorld 也會轉）
  W0.orbs.forEach((o, i) => { // 環身飛劍
    const a = oc * 4 + (i / W0.orbs.length) * Math.PI * 2; o.x = p.x + Math.cos(a) * 24; o.y = p.y - 2 + Math.sin(a) * 18; o.a = a + Math.PI / 2;
    for (const m of W0.mobs) if (!m.dead && dist(m, o) < WMOBS[m.type].r + 5 && (o.hit.get(m) || 0) < oc) { o.hit.set(m, oc + (o.eArr ? 0.5 : 0.35)); hitMob(m, wDmg(o.dmg || 5), o.eArr ? 0 : 20, p, true); } // 劍陣不擊退（不然怪被推出圈外就打不到）
  });

  // 怪物：只更新玩家附近的
  trackPlayerVel(dt);
  let aggro = false;
  const inTown = safeAt(p.x, p.y);
  for (const m of W0.mobs) {
    if (W0.originT > 0) continue; // 起源：時停
    if (m.boss && !m.dead) { aggro = true; if (dotTick(m, dt)) continue; updateWBoss(m, dt, p); continue; }
    if (m.dead || Math.abs(m.x - p.x) > 420 || Math.abs(m.y - p.y) > 420) continue;
    if (WMOBS[m.type].ai === "pillar") { m.flash = Math.max(0, m.flash - dt); dotTick(m, dt); continue; } // 劍尊的劍柱：不會動
    const d = WMOBS[m.type], dp = dist(m, p); let spd = d.spd * B.slow * (m.elite ? 1.1 : 1) * (m.mod === "狂暴" ? 1.4 : 1) * (m.spdMul || 1);
    m.flash = Math.max(0, m.flash - dt); m.atkT -= dt; mobAiTick(m, dt);
    if (dotTick(m, dt)) continue; // 燃燒、中毒；冰凍不能動
    if (m.slowT > 0) { m.slowT -= dt; spd *= 0.45; }
    if (m.armBrk > 0) m.armBrk -= dt;
    if (m.mv && m.mv.ph === "go") m.kb = 0; // 撲擊／衝撞途中不吃擊退
    if (m.kb > 0) { moveBody(m, Math.cos(m.ka) * m.kb * dt * 3, Math.sin(m.ka) * m.kb * dt * 3, d.r); m.kb = Math.max(0, m.kb - dt * 400); continue; }
    const homeD = Math.hypot(m.x - m.camp.x, m.y - m.camp.y);
    if (m.st === "idle") {
      if (dp < 100 && !inTown && !(W0.stealthT > 0)) { m.st = "chase"; packAggro(m); }
      m.wt -= dt;
      if (m.wt <= 0) { m.wt = rand(1.5, 4); m.wx = m.camp.x + rand(-50, 50); m.wy = m.camp.y + rand(-50, 50); }
      const a = Math.atan2(m.wy - m.y, m.wx - m.x);
      if (Math.hypot(m.wx - m.x, m.wy - m.y) > 4) moveBody(m, Math.cos(a) * spd * 0.35 * dt, Math.sin(a) * spd * 0.35 * dt, d.r);
    } else if (m.st === "home") { // 追太遠就回營地、回滿血
      m.wind = 0; m.mv = null; m.q = null; if (m.atkT > 5) m.atkT = 0;
      const a = Math.atan2(m.camp.y - m.y, m.camp.x - m.x);
      moveBody(m, Math.cos(a) * spd * 1.2 * dt, Math.sin(a) * spd * 1.2 * dt, d.r);
      m.hp = Math.min(m.max, m.hp + m.max * 0.3 * dt);
      if (homeD < 20) m.st = "idle";
    } else {
      aggro = true;
      if (m.hunter && inTown) { m.dead = true; floatText(m.x, m.y - 12, "獵寶妖跑掉了", "#cfc4dc"); continue; }
      if (!m.hunter && (homeD > 280 || inTown)) { m.st = "home"; continue; }
      const a = angTo(m, p);
      if (m.mv) { mvTick(m, d, p, dt); continue; } // 企劃 28：撲擊／衝撞／瞬步／急襲
      if (d.shield) m.fa = turnTo(m.fa == null ? a : m.fa, a, 2.2 * dt);
      if (d.ai === "ranged" || d.ai === "healer" || d.ai === "witch") { if (m.lv >= 6 || d.ai !== "ranged") { rangedAI(m, d, p, dp, a, dt); continue; } }
      if (d.ai === "dive") { // 雷鷹：飛到中距離 → 紅線 0.5 秒 → 衝過去 → 停下喘氣 0.8 秒（受傷 +30%）
        const v = m.dv;
        if (m.tired > 0) m.tired -= dt;
        else if (v && v.ph === "aim") { v.t -= dt; if (dp < 160) seenHint("dive", "紅線＝雷鷹要俯衝的路線，往旁邊閃；牠衝完會停下喘氣，那時打牠更痛"); if (v.t <= 0) { v.ph = "go"; v.t = 0.45; v.hit = false; sfx("dash"); } }
        else if (v && v.ph === "go") {
          v.t -= dt; const ox = m.x, oy = m.y; moveBody(m, Math.cos(v.a) * 311 * dt, Math.sin(v.a) * 311 * dt, d.r);
          if (Math.random() < 0.7) particles.push({ x: m.x, y: m.y, vx: 0, vy: 0, life: 0.25, max: 0.25, color: "#c8d8ff", size: 2 });
          if (!v.hit && segDist(p.x, p.y, ox, oy, m.x, m.y) < 10) { v.hit = true; hurtW(mobDmg(m, d) * 1.3, m); }
          if (v.t <= 0 || (Math.hypot(m.x - ox, m.y - oy) < 0.5 && v.t < 0.4)) { m.dv = null; m.tired = 0.8; m.atkT = (m.mod === "狂暴" ? 1.0 : 1.6); }
        } else {
          const dir = dp > 120 ? 1 : dp < 90 ? -0.7 : 0;
          moveBody(m, Math.cos(a) * spd * dir * dt, Math.sin(a) * spd * dir * dt, d.r);
          if (dp < 150 && m.atkT <= 0) { m.dv = { ph: "aim", t: m.elite ? 0.42 : 0.5, a }; m.atkT = 99; }
        }
      } else if (d.ai === "ranged") {
        const want = d.range * 0.75;
        const dir = dp > want + 10 ? 1 : dp < want - 15 ? -0.7 : 0;
        moveBody(m, Math.cos(a) * spd * dir * dt, Math.sin(a) * spd * dir * dt, d.r);
        if (dp < d.range && m.atkT <= 0 && !(m.wind > 0)) { m.wind = m.windMax = 0.3; m.atkT = 99; }
        if (m.wind > 0 && (m.wind -= dt) <= 0) {
          m.wind = 0; m.atkT = m.mod === "狂暴" ? 0.9 : 1.4;
          if (d.lob) { wbZone({ k: "circle", x: p.x, y: p.y, r: 16, max: 0.6, dmg: mobDmg(m, d), ele: mobEle(m), lob: { x: m.x, y: m.y - 6 }, pool: { r: 16, dur: 5, dmg: mobDmg(m, d) * 0.3 }, c: "140,255,110" }); continue; } // 腐沼樹妖：拋毒泥打你腳下
          W0.eshots.push({ x: m.x, y: m.y - 3, vx: Math.cos(a) * d.shot, vy: Math.sin(a) * d.shot, life: 2, dmg: mobDmg(m, d), c: m.type === "crow" ? "#ff3a3a" : d.chill ? "#d050ff" : "#ff4aa0", chill: d.chill, ele: mobEle(m) }); // 怪物彈幕：亮紅／亮紫
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
          if (d.fast && dp < 24) { m.fuse = 0.5; wbZone({ k: "circle", x: m.x, y: m.y, r: 30, max: 0.5, c: "255,90,40" }); seenHint("rusher", "疾行妖：衝到身邊會自爆，看到紅圈趕快離開"); }
          else if (dp < 18) { m.fuse = 0.7; floatText(m.x, m.y - 12, "！", "#ff5a4a", true); }
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
              if (m.type === "tgolem") addZap(cx, cy, 28, 2); // 雷甲巨像：砸地留電圈
            } else { // 撲咬：往前衝一下
              moveBody(m, Math.cos(m.wa) * 12, Math.sin(m.wa) * 12, d.r); m.lunge = 0.15;
              const diff = Math.abs(((angTo(m, p) - m.wa + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
              if (dist(m, p) < d.r + 13 && diff < 1.1) hurtW(dmg, m);
            }
            m.atkT = (d.heavy ? 1.3 : 0.85) * (m.mod === "狂暴" ? 0.65 : 1);
          }
        } else {
          if (m.lv >= 6 && meleeMove(m, d, p, dp, a)) continue;
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
    if (s.life <= 0 && s.split) { splitShot(s); continue; }
    if (Math.hypot(s.x - p.x, s.y - p.y) < (s.big ? 8 : 6) && p.iframe <= 0) { s.life = 0; chillHit = !!s.chill; hurtW(s.dmg, null, typeof s.ele === "string" ? s.ele : s.ele ? "ele" : "spell"); chillHit = false; }
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
      else if (typeof dropPick === "function") dropPick(o, p); // 通貨、素材（econ.js）
      writeSave();
    }
  }
  W0.drops = W0.drops.filter((o) => !o.got && o.t < (o.corpse ? 600 : 120));
  if (W0.grave && ((W0.grave.t -= dt) <= 0 || !W0.drops.some((o) => o.corpse))) W0.grave = null;

  // 地區切換提示、傳送陣解鎖
  const z = zoneAt(p.x, p.y);
  if (z !== W0.zone) { W0.zone = z; W0.bannerT = 2.5; if (z === "town") { w.potions = Math.max(w.potions, B.potMax); bankLoot("回到青雲城"); } }
  W0.bannerT = Math.max(0, W0.bannerT - dt);
  for (const wp of WAYPOINTS) if (!w.wp.includes(wp.id) && dist(wp, p) < CAMP_R) { w.wp.push(wp.id); floatText(p.x, p.y - 30, `點亮傳送陣：${wp.n}營地`, "#9fe8ff", true); sfx("arrive"); writeSave(); }
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
    ...RB_KEYS.map((k) => ({ id: k === "volcano" ? "altar" : "altar-" + k, kind: "altar", rb: k, x: RBOSS[k].x, y: RBOSS[k].y, r: 20, n: `${RBOSS[k].n}的祭壇` })),
  ];
}
function openSpot(s) {
  pausedFrom = "world"; state = "pick";
  keys.clear(); stick.id = null;
  pad.classList.add("hidden");
  const w = save.w;
  let body = "", btns = "";
  if (s.id === "rift") { renderRift(); return; } // 企劃 16：秘境改成用仙界角色進
  if (s.id === "alch") {
    W0.hp = W0.maxHp; W0.mp = B.maxMp; w.potions = Math.max(w.potions, B.potMax); writeSave();
    body = `生命、真氣都回滿了，丹藥補到 ${w.potions} 顆。`;
  } else if (s.kind === "wp") { openTeleport(); return; } else if (false) {
    body = "";
    btns = WAYPOINTS.filter((wp) => w.wp.includes(wp.id) && wp.id !== s.wp.id).map((wp) => `<button class="big alt tp" data-wp="${wp.id}">${wp.n}<small>Lv.${ZONES[wp.id].lv.join("–")}</small></button>`).join("");
    if (!btns) body = "還沒有解鎖其他傳送陣。走到各地區的傳送陣就會解鎖。";
  } else if (s.kind === "altar") {
    const R = RBOSS[s.rb], cd = rbCool(s.rb);
    body = `${R.n}（Lv.${R.lv}）的祭壇。<br>建議 Lv.${R.rec} 以上（你現在 Lv.${w.lv}）。<br>${R.desc}<br>掉落（直接安全）：${R.loot}。${cd > 0 ? `<br><b>還在沉睡：${Math.ceil(cd)} 秒</b>` : ""}`;
    btns = `<button id="fight" class="big">挑戰${R.n}</button>`;
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
  if (f) f.onclick = () => { worldReturn(); startWorldBossField(s.rb); };
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
    + row("物理減免", pc(physRed())) + ELES.map((e) => row(RES_N[e] + "抗性", pc(effRes(e)))).join("") + row("閃避", pc(B.dodge || 0)) + row("法術壓制", pc(B.supp || 0)) + row("能量護盾", B.maxEs || 0) + row("吸血", pc(B.leech || 0)) + row("真氣回復", (B.mpRegen || 0).toFixed(1) + "/秒");
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
    else if (t === 4 && z === "swamp") { ctx.fillStyle = "#2c3f26"; ctx.fillRect(x, y, TS, TS); ctx.fillStyle = "rgba(140,200,90,0.25)"; ctx.fillRect(x + ((time * 3 + v * 16) % 14), y + 8, 2, 2); }
    else if (t === 4 && z === "sky") { ctx.fillStyle = "#dfe6fa"; ctx.fillRect(x, y, TS, TS); ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.fillRect(x + ((time * 4 + v * 16) % 12), y + 5, 5, 2); }
    else if (t === 4) { ctx.fillStyle = "#2a4a7a"; ctx.fillRect(x, y, TS, TS); ctx.fillStyle = "rgba(160,200,255,0.3)"; ctx.fillRect(x + ((time * 6 + v * 16) % 14), y + 6, 3, 1); }
    else if (t === 5) drawWallTile(x, y);
    else if (t === 6) drawHouseTile(x, y, tx, ty);
  }
  // 安全營地、祭壇
  drawCamps();
  drawAltars();
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
      if (o.kind === "card" && icoDrawS(ctx, "card", o.c, o.x - 4.5, by - 6, 9, 12)) {}
      else if (o.kind === "card") { ctx.fillStyle = "#2a1830"; ctx.fillRect(o.x - 3, by - 4, 6, 8); ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.strokeRect(o.x - 3, by - 4, 6, 8); }
      else { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(o.x, by - 4); ctx.lineTo(o.x + 3, by); ctx.lineTo(o.x, by + 4); ctx.lineTo(o.x - 3, by); ctx.fill(); }
      ctx.font = "bold 6px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = c; ctx.fillText(o.kind === "card" ? CARDS[o.c].n : essName(o.k), o.x, by - 7);
    }
    else if (o.kind === "key") { ctx.fillStyle = "#9fe8ff"; ctx.fillRect(o.x - 3, o.y - 1, 6, 2); ctx.fillRect(o.x + 2, o.y - 3, 2, 6); }
    else if ((o.kind === "cur" || o.kind === "mat") && typeof dropDraw === "function") dropDraw(o);
    else if (o.kind === "gem") { // 寶石：菱形＋光柱
      const c = GEMS[o.g.split(":")[0]].c, by = o.y - 2 + Math.sin(time * 4 + o.x) * 1.5;
      ctx.globalAlpha = 0.3; ctx.fillStyle = c; ctx.fillRect(o.x - 1, o.y - 18, 2, 18); ctx.globalAlpha = 1;
      if (icoDrawS(ctx, "gem", o.g.split(":")[0], o.x - 5.5, by - 5.5, 11, 11)) continue;
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
        const wt = curWeapon(), behind = Math.sin(p.face) < -0.3, rd = typeof mountRide === "function" ? mountRide() : null;
        drawHeroAura(p);
        if (rd) drawMount(rd, p.x, p.y, p.flip, p.walk);
        if (behind && !rd) drawHeldWeapon(p, wt);
        ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y) - (rd ? 6 : 0)); if (p.flip) ctx.scale(-1, 1);
        ctx.drawImage(heroImg(rd ? 0 : Math.floor(p.walk) % 2), -6, -9); ctx.restore();
        if (!behind && !rd) drawHeldWeapon(p, wt);
        if (!rd) drawSlash(p, wt);
        if (rd) { p.y -= 6; drawMyName(p); p.y += 6; } else drawMyName(p);
      }
    }
  }
  for (const v of W0.voids) { // 黑洞
    ctx.globalAlpha = v.ghost ? allyA() : 1;
    const q = Math.min(1, ((v.max || v.t) - v.t) * 4), R = 30 * q, g = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, R);
    g.addColorStop(0, "rgba(0,0,0,0.95)"); g.addColorStop(0.6, "rgba(30,10,60,0.8)"); g.addColorStop(1, "rgba(120,80,220,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(v.x, v.y, R, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = "rgba(190,150,255,0.8)"; ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(v.x, v.y, R * (0.5 + i * 0.22), time * (6 + i) + i, time * (6 + i) + i + 2); ctx.stroke(); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  for (const o of W0.orbs) { if (o.x === undefined) continue; ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.a); glow(0, 0, 7, "150,210,255", 0.5); ctx.fillStyle = "#e8f4ff"; ctx.fillRect(-5, -1, 9, 2); ctx.fillStyle = "#ffd84a"; ctx.fillRect(-6, -2, 2, 4); ctx.restore(); }
  for (const s of W0.pshots) {
    ctx.globalAlpha = s.ghost ? allyA() : 1;
    if (s.kind === "sword" && fxLoop("qi", s.x, s.y, 30, s.a)) {}
    else if (s.kind === "orb" && fxLoop("orb", s.x, s.y, 24, s.a)) {}
    else if (s.kind === "fireball" && fxLoop("fball", s.x, s.y, 28, s.a)) {}
    else if (s.kind === "sword") { // 劍氣：月牙＋拖尾
      drawTrail(s, "160,210,255", 5);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.translate(s.x, s.y); ctx.rotate(s.a);
      ctx.strokeStyle = "rgba(160,210,255,0.6)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-4, 0, 8, -1.1, 1.1); ctx.stroke();
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(-4, 0, 8, -1, 1); ctx.stroke(); ctx.restore();
    }
    else if (s.kind === "qi") { drawTrail(s, "255,215,140", 3); glow(s.x, s.y, 7, "255,210,130", 0.7); ctx.fillStyle = "#fff4d0"; ctx.beginPath(); ctx.arc(s.x, s.y, 2, 0, Math.PI * 2); ctx.fill(); }
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
    if (f.c && !f.met) continue;
    if (f.big) glow(f.x, f.y, f.r, "255,90,40", 0.25 * (1 - f.t / 0.7));
    ctx.strokeStyle = `rgba(255,120,40,${0.4 + 0.4 * Math.sin(time * 30)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    const my = f.y - f.t * 160, mx = f.x + f.t * 40; // 隕火從右上斜斜落下
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = "rgba(255,140,40,0.5)"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(mx + 10, my - 30); ctx.lineTo(mx, my); ctx.stroke(); ctx.restore();
    if (!fxLoop("fball", mx, my, f.big ? 40 : 26, 1.816)) { glow(mx, my, 9, "255,150,50", 0.9); ctx.fillStyle = "#fff0a0"; ctx.beginPath(); ctx.arc(mx, my, 2.5, 0, Math.PI * 2); ctx.fill(); }
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
  if (W0.swDom) { const D = W0.swDom, a = Math.min(1, D.t * 2); ctx.save(); ctx.globalAlpha = a * 0.5; ctx.strokeStyle = "#cfe6ff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(D.x, D.y + 2, D.r, D.r * 0.6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.ellipse(D.x, D.y + 2, D.r * 0.7, D.r * 0.42, time, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); for (let i = 0; i < 8; i++) { const q = time * 0.8 + (i / 8) * Math.PI * 2; ctx.fillStyle = "#e8f4ff"; ctx.fillRect(D.x + Math.cos(q) * D.r * 0.85 - 1, D.y + 2 + Math.sin(q) * D.r * 0.51 - 4, 2, 7); } ctx.restore(); }
  if (W0.healZ) { const H = W0.healZ; ctx.save(); ctx.globalAlpha = Math.min(1, H.t * 2) * (0.45 + 0.15 * Math.sin(time * 6)); glow(H.x, H.y + 2, H.r, "150,255,190", 0.25); ctx.strokeStyle = "#a0ffbe"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(H.x, H.y + 2, H.r, H.r * 0.6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  if (W0.wwall) { const V = W0.wwall, nx = -Math.sin(V.a), ny = Math.cos(V.a); ctx.save(); ctx.globalAlpha = Math.min(1, V.t * 2) * 0.75; ctx.strokeStyle = "#c8f0e0"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(V.x - nx * V.half, V.y - ny * V.half); ctx.lineTo(V.x + nx * V.half, V.y + ny * V.half); ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = "#ffffff"; for (let i = -3; i <= 3; i++) { const o = Math.sin(time * 10 + i) * 4; ctx.beginPath(); ctx.moveTo(V.x + nx * i * V.half / 3.5, V.y + ny * i * V.half / 3.5 - 6 + o); ctx.lineTo(V.x + nx * i * V.half / 3.5, V.y + ny * i * V.half / 3.5 + 4 + o); ctx.stroke(); } ctx.restore(); }
  if (W0.turret) { const T = W0.turret; ctx.globalAlpha = Math.min(1, T.t * 2); ctx.fillStyle = "#6b4a2a"; ctx.fillRect(T.x - 6, T.y - 4, 12, 6); ctx.fillStyle = "#c9a36a"; ctx.fillRect(T.x - 8, T.y - 9, 16, 3); ctx.fillStyle = "#ffe9a0"; ctx.fillRect(T.x - 1, T.y - 12, 2, 6); ctx.globalAlpha = 1; }
  if (W0.titanT > 0 || W0.dragT > 0) { ctx.save(); ctx.globalCompositeOperation = "lighter"; glow(W0.x, W0.y - 4, 16 + Math.sin(time * 8) * 2, W0.titanT > 0 ? "255,170,90" : "110,230,190", 0.35); ctx.restore(); }
  for (const T of W0.totems || []) { const a = Math.min(1, T.t * 2), c = T.sl === "a" ? "255,216,74" : "143,176,255"; ctx.globalAlpha = a; glow(T.x, T.y - 8, 14 + (T.fire > 0 ? 6 : 0), c, 0.5); ctx.fillStyle = "#3a3450"; ctx.fillRect(T.x - 5, T.y - 2, 10, 4); ctx.fillStyle = "#8a7a9a"; ctx.fillRect(T.x - 3, T.y - 12, 6, 10); ctx.fillStyle = `rgb(${c})`; ctx.fillRect(T.x - 2, T.y - 16 + Math.sin(time * 4) * 1.5, 4, 4); ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(T.x - 7, T.y + 4, 14, 2); ctx.fillStyle = `rgb(${c})`; ctx.fillRect(T.x - 7, T.y + 4, 14 * T.t / T.max, 2); ctx.globalAlpha = 1; if (T.fire > 0) T.fire -= 1 / 60; }
  if (W0.guardT2 > 0 && W0.guardSh > 0) { ctx.strokeStyle = `rgba(255,224,138,${0.4 + 0.2 * Math.sin(time * 8)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(W0.x, W0.y - 4, 13, 0, Math.PI * 2); ctx.stroke(); }
  if (W0.rshT > 0) { ctx.strokeStyle = "rgba(159,220,255,0.7)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(W0.x, W0.y - 4, 11, 0, Math.PI * 2); ctx.stroke(); }
  for (const f of W0.walls || []) { if (f.ice) { ctx.globalAlpha = Math.min(1, f.t * 2) * 0.55; ctx.fillStyle = "#bfefff"; ctx.beginPath(); ctx.ellipse(f.x, f.y, 9, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; continue; } if (f.ghost && !allyA()) continue; ctx.globalAlpha = (f.ghost ? allyA() : 1) * Math.min(1, f.t * 2); glow(f.x, f.y - 3, 12, "255,120,40", 0.5); ctx.fillStyle = "#ff8a2e"; ctx.fillRect(f.x - 6, f.y - 2, 12, 3); ctx.fillStyle = "#ffd84a"; ctx.fillRect(f.x - 3 + Math.sin(time * 20 + f.x) * 2, f.y - 7, 3, 5); ctx.globalAlpha = 1; }
  for (const m of W0.mobs) if (!m.dead && m.armBrk > 0) { ctx.fillStyle = "#ffb070"; ctx.fillRect(m.x - 3, m.y - WMOBS[m.type].r - 16, 6, 1); ctx.fillRect(m.x - 1, m.y - WMOBS[m.type].r - 18, 1, 5); ctx.fillRect(m.x + 1, m.y - WMOBS[m.type].r - 17, 1, 3); }
  for (const m of W0.mobs) if (!m.dead && m.slowT > 0) { ctx.fillStyle = "rgba(160,220,255,0.35)"; ctx.fillRect(m.x - 5, m.y - 2, 10, 3); }
  for (const s of W0.eshots) {
    if (s.big) { glow(s.x, s.y, 9, "255,110,40", 0.7); ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(s.x, s.y, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#fff6c0"; ctx.fillRect(s.x - 1, s.y - 1, 2, 2); continue; }
    ctx.fillStyle = s.c; ctx.fillRect(s.x - 2.5, s.y - 2.5, 5, 5); ctx.fillStyle = "#fff6c0"; ctx.fillRect(s.x - 1, s.y - 1, 2, 2);
  }
  drawShield();
  drawFxOver();
  wbBarFloatClamp(k, oy); drawFx(); fltMinY = null;
  drawWorldHud();
  drawWBossBar();
}
function drawWMob(m) {
  if (m.boss) { drawWBoss(m); return; }
  if (WMOBS[m.type].draw) { WMOBS[m.type].draw(m); return; }
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
  drawMobExtra(m, d);
  if (m.hunter) { ctx.strokeStyle = `rgba(255,70,50,${0.6 + 0.4 * Math.sin(time * 10)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(m.x, m.y + d.r * 0.8, d.r * 2, d.r * 0.6, 0, 0, Math.PI * 2); ctx.stroke(); }
  else if (m.elite) { ctx.strokeStyle = "rgba(111,184,255,0.7)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(m.x, m.y + d.r * 0.8, d.r * 1.6, d.r * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); }
  if (m.hp < m.max || m.elite) {
    const bw = m.elite ? 26 : 18;
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(m.x - bw / 2, m.y - d.r * sc - 7, bw, 3);
    ctx.fillStyle = m.elite ? "#6fb8ff" : "#ff6a3a"; ctx.fillRect(m.x - bw / 2, m.y - d.r * sc - 7, bw * Math.max(0, m.hp / m.max), 3);
  }
  if (!(m.elite || m.boss || m.hunter || (m === W0.focusM && W0.focusT > 0))) return; // 名字只顯示精英、王、獵寶妖、正在打的那隻（一般怪擠在一起名字不會疊成一團）
  ctx.font = "bold 5px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
  const gap = m.lv - save.w.lv;
  ctx.fillStyle = m.elite ? "#6fb8ff" : gap >= 4 ? "#ff6b6b" : gap <= -5 ? "#a99bb8" : "#f3eada";
  ctx.fillStyle = m.hunter ? "#ff6b6b" : ctx.fillStyle;
  const lab = `${m.elite && !m.hunter ? (m.mod2 ? m.mod + "、" + m.mod2 : m.mod || "") + "精英 " : ""}${d.n}${d.sz ? `（${SZ_N[d.sz]}）` : ""} Lv.${m.lv}`, fc = ctx.fillStyle;
  ctx.lineWidth = 1.6; ctx.lineJoin = "round"; ctx.strokeStyle = "rgba(20,14,30,0.85)"; ctx.strokeText(lab, m.x, m.y - d.r * sc - 9);
  ctx.fillStyle = fc; ctx.fillText(lab, m.x, m.y - d.r * sc - 9);
  if (d.ele) drawEleTag(m.x + ctx.measureText(lab).width / 2 + 4, m.y - d.r * sc - 10.5, d.ele);
}
let miniRect = null, questRect = null;
cvs.addEventListener("pointerdown", (e) => { // 點小地圖：開／關大地圖
  if (state !== "world") return;
  if (bigMap) { bigMap = false; return; }
  const qr = questRect; if (qr && e.clientX >= qr.x && e.clientX <= qr.x + qr.w && e.clientY >= qr.y && e.clientY <= qr.y + qr.h) { openHud("quest"); return; }
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
  for (const k of RB_KEYS) { ctx.fillStyle = rbCool(k) > 0 ? "#888" : `rgb(${RBOSS[k].col})`; ctx.fillRect(bx + RBOSS[k].x * sc - 3, by + RBOSS[k].y * sc - 3, 6, 6); }
  const qt = questTarget(); if (qt) { ctx.strokeStyle = "#ffe066"; ctx.lineWidth = 2; ctx.strokeRect(bx + qt.x * sc - 7, by + qt.y * sc - 7, 14, 14); }
  for (const m of W0.mobs) if ((m.elite || m.boss) && !m.dead) { ctx.fillStyle = m.boss ? "#ff2a2a" : "#ff6b4a"; ctx.fillRect(bx + m.x * sc - 2, by + m.y * sc - 2, 4, 4); }
  if (typeof othersList === "function") { ctx.fillStyle = "#7dff8a"; for (const o of othersList()) ctx.fillRect(bx + o.x * sc - 2, by + o.y * sc - 2, 4, 4); }
  ctx.fillStyle = Math.floor(time * 4) % 2 ? "#fff" : "#ffe066"; ctx.beginPath(); ctx.arc(bx + p.x * sc, by + p.y * sc, 4, 0, Math.PI * 2); ctx.fill();
  ctx.font = "10px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#cfc4dc"; ctx.fillText(`${TOUCH ? "點一下畫面" : "Tab"} 關閉　黃框＝任務　紅點＝精英`, W / 2, by + bh + 14);
}
function drawWorldHud() {
  const p = W0, w = save.w;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (W0.zone === "thunder" && Math.sin(time * 0.7) > 0.995) { ctx.fillStyle = "rgba(220,220,255,0.18)"; ctx.fillRect(0, 0, W, H); } // 峽谷偶爾打雷閃光
  if (W0.zone === "snow" || W0.zone === "sky") { // 下雪（仙域是飄落的光點）
    ctx.fillStyle = W0.zone === "sky" ? "rgba(255,236,170,0.7)" : "rgba(255,255,255,0.8)";
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
  for (const k of RB_KEYS) { ctx.fillStyle = rbCool(k) > 0 ? "#888" : `rgb(${RBOSS[k].col})`; ctx.fillRect(mx0 + RBOSS[k].x * sc - 2, my0 + RBOSS[k].y * sc - 2, 4, 4); }
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
  ctx.fillText(`${REALMS[realmIdx()].n}期修士　戰力 ${cpHud()}`, bx, y0 + 8);
  ctx.font = "9px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#a99bb8"; ctx.fillText(`靈石 ${save.stone}　丹藥 ${w.potions}`, bx, y0 + 22);
  // 任務欄
  const q = curQuest();
  if (q) {
    const qy = y0 + 50, qw = Math.min(190, W * 0.46);
    ctx.fillStyle = "rgba(10,8,18,0.7)"; ctx.fillRect(x0, qy, qw, 38); questRect = { x: x0, y: qy, w: qw, h: 38 };
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
    const pen = resPen(); if (pen > 0) { const t2 = `此地元素抗性 −${Math.round(pen * 100)}%`; ctx.font = "bold 11px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#ff9a7a"; ctx.strokeText(t2, W / 2, H * 0.3 + 38); ctx.fillText(t2, W / 2, H * 0.3 + 38); }
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
    if (el) { el.style.transform = "none"; el.style.setProperty("--cdf", clamp(p.cds[k] / (k === "potion" && W0.potCd ? W0.potCd : WSKILL[k].cd * (k === "roll" ? B.rollCd : 1) * ((B.skCd && B.skCd[k]) || 1)), 0, 1)); } // 扇形轉圈冷卻
    const btn = pad.querySelector(`[data-act="${k}"]`);
    if (btn) btn.style.opacity = !mpCan(p, WSKILL[k].mp) ? 0.45 : 1;
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
  { t: "救出被妖獸圍住的採藥童子（清光他身邊那一營）", k: "rescue", z: "grass", n: 1, item: 1 }, // 企劃 23 A：事件任務（原地改寫，不能插在中間）
  { t: "幽暗森林：找到三把染黑的斷劍", k: "find", z: "forest", n: 3 },
  { t: "找到幽暗森林傳送陣", k: "wp", id: "forest", n: 1 },
  { t: "升到 Lv.11", k: "lv", n: 11, item: 1 },
  { t: "亂石荒原：獵殺有名字的精英「石中魂・孤」", k: "named", z: "waste", n: 1 },
  { t: "找到亂石荒原傳送陣", k: "wp", id: "waste", n: 1 },
  { t: "升到 Lv.16", k: "lv", n: 16, item: 1 },
  { t: "焚天火山斬妖 20 隻", k: "kill", z: "volcano", n: 20 },
  { t: "找到焚天火山傳送陣", k: "wp", id: "volcano", n: 1 },
  { t: "火山北邊祭壇：打倒焚天石魔", k: "boss", n: 1, item: 2 },
  { t: "往東過雪山山口，找到寒霜雪域傳送陣", k: "wp", id: "snow", n: 1, item: 1 },
  { t: "寒霜雪域：修復三個被劈開的陣眼", k: "hold", z: "snow", n: 3 },
  { t: "升到 Lv.26", k: "lv", n: 26, item: 2 },
  { t: "寒霜雪域斬殺精英 3 隻", k: "elite", z: "snow", n: 3, item: 2 },
  { t: "雪域往東過山口，找到幽冥沼澤傳送陣", k: "wp", id: "swamp", n: 1, item: 2 },
  { t: "幽冥沼澤斬妖 30 隻", k: "kill", z: "swamp", n: 30 },
  { t: "升到 Lv.40", k: "lv", n: 40, item: 2 },
  { t: "幽冥沼澤斬殺精英 4 隻", k: "elite", z: "swamp", n: 4, item: 2 },
  { t: "沼澤往北過山口，找到雷霆峽谷傳送陣", k: "wp", id: "thunder", n: 1, item: 2 },
  { t: "雷霆峽谷斬妖 35 隻", k: "kill", z: "thunder", n: 35 },
  { t: "升到 Lv.60", k: "lv", n: 60, item: 2 },
  { t: "雷霆峽谷斬殺精英 5 隻", k: "elite", z: "thunder", n: 5, item: 2 },
  { t: "升到 Lv.70（可以三轉・元嬰）", k: "lv", n: 70, item: 2 },
  { t: "峽谷往東過山口，找到天外仙域傳送陣", k: "wp", id: "sky", n: 1, item: 2 },
  { t: "天外仙域斬妖 40 隻", k: "kill", z: "sky", n: 40 },
  { t: "升到 Lv.90", k: "lv", n: 90, item: 2 },
  { t: "天外仙域斬殺精英 8 隻", k: "elite", z: "sky", n: 8, item: 2 },
  { t: "升到 Lv.120（四轉・起源覺醒）", k: "lv", n: 120, item: 2 },
];
function curQuest() {
  const w = save.w;
  if (!w) return null;
  w.q = w.q || 0; w.qp = w.qp || 0;
  if (w.q < QUESTS.length) return { ...QUESTS[w.q], main: true };
  // 懸賞：在適合自己等級的地區斬妖
  const z = ["sky", "thunder", "swamp", "snow", "volcano", "waste", "forest", "grass"].find((k) => w.lv >= ZONES[k].lv[0]) || "grass";
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
  if (q.item !== undefined || !q.main) { const it = rollItem(q.item || 0, Math.floor(w.lv / 3) + 1, q.wt || null); if (q.wt && it.q === 3) { it.q = 1; it.u = null; it.wt = q.wt; nameItem(it); } grantLoot(it, W0.x, W0.y - 6); if (q.wt) notice(`得到${WEAPONS[q.wt].n}！到背包換上就能用${WEAPONS[q.wt].job}的招式`, "#ffcf6b"); }
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
  hudEl.querySelector('[data-h="ap"]').classList.toggle("dot", false);
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
  const k = e.key.toLowerCase(), map = { i: "bag", b: "smith", l: "cards", o: "ap", c: "ap", n: "skill", y: "quest", t: "tp", m: "tp", tab: "tp", r: "rank", f: "swap" };
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
  else if (h === "quest") renderQuests();
  else if (h === "skill") renderSkills();
  else if (h === "tree") renderTree();
  else if (h === "rank") renderRank();
  else if (h === "menu") openMenu();
  else if (h === "smith") renderSmith();
  else if (h === "cards") renderCards();
  else if (h === "more") renderMore();
  else openStarMap();
}
