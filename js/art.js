// 御劍渡劫（pixel-raid）— 仙界美術：手上武器、地面裝飾、樹石房子、背包圖示、攻擊特效
// 全部是原創像素圖（用字串畫），在 world.js 之後載入
"use strict";

const K = "#1b1424";
// ───────── 武器（朝右畫，握把在左邊；原點在握把）─────────
const WPN_IMG = {
  sword: sprite([
    "..k...........",
    ".kGk.kkkkkkkk.",
    "kBGBkWWWWWWWwk",
    ".kGk.kkkkkkkk.",
    "..k...........",
  ], { k: K, G: "#ffd84a", B: "#7a4a2a", W: "#eef6ff", w: "#9fc8ff" }),
  staff: sprite([
    "...........kk.",
    "..........kPPk",
    "kkkkkkkkkkkPpk",
    "kBBbBBbBBBkPPk",
    "kkkkkkkkkkk.kk",
  ], { k: K, B: "#8a5a2a", b: "#c08040", P: "#c9a2ff", p: "#ffffff" }),
  bow: sprite([
    "kkk.....",
    "kBBk....",
    ".kBBk...",
    "..kBk...",
    "s..kBk..",
    "s..kGk..",
    "s..kBk..",
    "..kBk...",
    ".kBBk...",
    "kBBk....",
    "kkk.....",
  ], { k: K, B: "#a0602a", G: "#ffd84a", s: "#e8e0d0" }),
  blade: sprite([
    ".......kkkkkk...",
    "..k...kWWWWWWkk.",
    ".kGk.kWWWWWWWWwk",
    "kBGBkkWWWWWWWwk.",
    ".kGk..kkkkkkkk..",
    "..k.............",
  ], { k: K, G: "#ffd84a", B: "#5a3a2a", W: "#e0e6f0", w: "#a8b8d0" }),
  fist: sprite([
    ".kkkk.",
    "kRRRRk",
    "kRYRYk",
    "kRRRRk",
    ".kkkk.",
  ], { k: K, R: "#b0402a", Y: "#ffd84a" }),
  fan: sprite([
    "....kkk..",
    "...kGgGk.",
    "..kgGgGgk",
    ".kGgGgGgk",
    "kkkkkkkk.",
    ".kBk.....",
  ], { k: K, G: "#7dffb0", g: "#3a9a6a", B: "#8a5a2a" }),
};
// 每種武器的特效顏色
const WPN_FX = { sword: "200,235,255", staff: "201,162,255", bow: "255,230,160", blade: "255,220,170", fist: "255,170,110", fan: "160,255,200" };

// ───────── 樹、石頭（依地區換樣子）─────────
const TREE_IMG = {
  grass: sprite([
    "......kkkkk.......",
    "....kkLLLLLkk.....",
    "...kLLlLLLLLLk....",
    "..kLLlllLLLLLLk...",
    "..kLLLlLLLLDLLk...",
    ".kLLLLLLLLLDDLLk..",
    ".kLLLLLLLLLLDLLk..",
    ".kDLLLLLLLLLLLDk..",
    ".kDDLLLLLLLLLDDk..",
    "..kDDLLLLLLDDDk...",
    "...kkDDDDDDDkk....",
    ".....kkkTkkk......",
    "........Tt........",
    "........Tt........",
    ".......kTtk.......",
    "......kkkkkk......",
  ], { k: K, L: "#3f9a4a", l: "#7fd06a", D: "#2a6e3a", T: "#5a3a1a", t: "#3a2410" }),
  forest: sprite([
    "........k.........",
    ".......kLk........",
    "......kLlLk.......",
    ".....kLLlLLk......",
    "......kDLDk.......",
    ".....kLLLLLk......",
    "....kLLlLLLLk.....",
    "...kDDLLLLDDDk....",
    ".....kLLLLLk......",
    "....kLLLlLLLk.....",
    "...kLLLLLLLLLk....",
    "..kDDDLLLLLDDDk...",
    "...kkkkTtkkkk.....",
    ".......Tt.........",
    "......kTtk........",
    ".....kkkkkk.......",
  ], { k: K, L: "#2a6e3e", l: "#4fa060", D: "#1a4a2a", T: "#4a2a1a", t: "#2a180c" }),
  waste: sprite([
    "..................",
    "..k.......k.......",
    "..kTk....kTk......",
    "...kTk..kTk...k...",
    "....kTkkTk...kTk..",
    ".....kTTk...kTk...",
    "......kTTkkkTk....",
    "......kTtTTTk.....",
    ".......kTtk.......",
    ".......kTtk.......",
    ".......kTtk.......",
    ".......kTtk.......",
    "......kTTtTk......",
    ".....kkkkkkkk.....",
    "..................",
    "..................",
  ], { k: K, T: "#8a6a4a", t: "#5a4030" }),
  volcano: sprite([
    "..................",
    "...k......k.......",
    "...kTk...kTk......",
    "....kTk.kTk..k....",
    ".....kTkTk..kTk...",
    "......kTTkkkTk....",
    "......kTtTTTk.....",
    ".......kTtk.......",
    ".......kTOk.......",
    ".......kTtk.......",
    ".......kOtk.......",
    "......kTTtTk......",
    ".....kkkkkkkk.....",
    "..................",
    "..................",
    "..................",
  ], { k: K, T: "#3a2a2a", t: "#1f1414", O: "#ff7a2a" }),
};
TREE_IMG.snow = sprite([
  "........k.........",
  ".......kWk........",
  "......kWWLk.......",
  ".....kWWLLLk......",
  "......kLWLk.......",
  ".....kWWWLLk......",
  "....kWWLLLLLk.....",
  "...kWLLLWWLLLk....",
  ".....kWWLLLk......",
  "....kWWWLLLLk.....",
  "...kWWLLLWWLLk....",
  "..kLLLLLLLLLLLk...",
  "...kkkkTtkkkk.....",
  ".......Tt.........",
  "......kTtk........",
  ".....kkkkkk.......",
], { k: K, W: "#f4f8ff", L: "#2e5a4a", T: "#4a3a2a", t: "#2a2018" });
TREE_IMG.town = TREE_IMG.grass;
const ROCK_IMG = sprite([
  "................",
  ".....kkkkk......",
  "...kkHHhhhkk....",
  "..kHHhhhhhhhk...",
  "..kHhhhhhhhhkk..",
  ".kHhhhhhhhhhhhk.",
  ".khhhhhhhhhhhdk.",
  ".khhhhhhhhhhddk.",
  "kkhhhhhhhhhdddkk",
  "kdhhhhhhhhdddddk",
  "kddhhhhhhdddddk.",
  ".kdddddddddddkk.",
  "..kkkkkkkkkkkk..",
], { k: K, H: "#a8a2c0", h: "#7a7396", d: "#57506e" });
const ROCK_RED = sprite([
  "................",
  ".....kkkkk......",
  "...kkHHhhhkk....",
  "..kHHhhhhhhhk...",
  "..kHhhhOhhhhkk..",
  ".kHhhhhOOhhhhhk.",
  ".khhhhhhOhhhhdk.",
  ".khhhhhhhhhhddk.",
  "kkhhhhhhhhhdddkk",
  "kdhhhhhhhhdddddk",
  "kddhhhhhhdddddk.",
  ".kdddddddddddkk.",
  "..kkkkkkkkkkkk..",
], { k: K, H: "#7a5a50", h: "#5a3e38", d: "#3a2622", O: "#ff7a2a" });

// ───────── 地面裝飾（小草、花、蘑菇、骨頭、碎石、火星）─────────
const DECO = {
  tuft: sprite(["k.k.k", ".kGk.", "..k.."], { k: "#2a6a32", G: "#5fbf5a" }),
  tuft2: sprite([".G.G.", "G.G.G", ".GGG."], { G: "#4aa04a" }),
  flowerR: sprite([".r.", "rYr", ".r.", ".g."], { r: "#ff6b8a", Y: "#ffe066", g: "#3a8a3a" }),
  flowerY: sprite([".y.", "yWy", ".y.", ".g."], { y: "#ffd84a", W: "#fff6d0", g: "#3a8a3a" }),
  flowerW: sprite([".w.", "wYw", ".w.", ".g."], { w: "#f4f0ff", Y: "#ffb030", g: "#3a8a3a" }),
  mush: sprite([".kkk.", "kRWRk", "kRRRk", ".kSk.", ".kSk."], { k: K, R: "#d84a4a", W: "#fff", S: "#e8dcc0" }),
  mushB: sprite([".kk.", "kBBk", ".kS.", ".kS."], { k: K, B: "#6fb8ff", S: "#d8e8f0" }),
  fern: sprite(["g...g", ".g.g.", "..g..", "g.g.g", ".ggg."], { g: "#3a8a4a" }),
  pebble: sprite([".kk..", "kHhk.", ".kk.k", "...kh"], { k: "#4a4058", H: "#a8a0b8", h: "#7a7090" }),
  bone: sprite(["W...W", ".WWW.", "W...W"], { W: "#e8e0cc" }),
  crack: sprite(["k....", ".k...", ".kk..", "...k.", "...kk"], { k: "rgba(0,0,0,0.35)" }),
  skull: sprite([".WWW.", "WkWkW", ".WWW.", ".W.W."], { W: "#e8e0cc", k: K }),
  ember: sprite(["O.", ".Y"], { O: "#ff7a2a", Y: "#ffe066" }),
  ash: sprite(["kk.", ".kk"], { k: "rgba(20,10,10,0.4)" }),
  snowT: sprite([".W.", "WWW"], { W: "#eef4ff" }),
  iceC: sprite([".C.", "CWC", ".C."], { C: "#7ac8f0", W: "#e8fbff" }),
  twig: sprite(["k...", ".k.k", "..k."], { k: "#5a4a3a" }),
  stoneT: sprite(["hhhhhh", "h....h", "hhhhhh"], { h: "rgba(0,0,0,0.12)" }),
};
const DECO_SET = {
  grass: ["tuft", "tuft", "tuft2", "flowerR", "flowerY", "flowerW", "pebble"],
  forest: ["fern", "fern", "mush", "mushB", "tuft2", "tuft"],
  waste: ["pebble", "pebble", "bone", "crack", "skull", "crack"],
  volcano: ["ember", "ash", "crack", "pebble", "ember"],
  snow: ["snowT", "snowT", "iceC", "twig", "pebble"],
  town: ["stoneT", "stoneT", "flowerY", "tuft"],
};
function drawDeco(x, y, z, v) { // v：0～1 的固定亂數
  if (v > 0.32) return;
  const set = DECO_SET[z] || DECO_SET.grass, key = set[Math.floor(v / 0.32 * set.length) % set.length], img = DECO[key];
  const dx = x + 2 + Math.floor(hash(x * 0.7 + y) * 9), dy = y + 3 + Math.floor(hash(y * 1.3 + x) * 8);
  if (key === "ember") { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 4 + x); ctx.drawImage(img, dx, dy); ctx.globalAlpha = 1; return; }
  ctx.drawImage(img, dx, dy);
}
// 城牆、房子
function drawWallTile(x, y) {
  ctx.fillStyle = "#6d6390"; ctx.fillRect(x, y, TS, TS);
  ctx.fillStyle = "#57507a";
  for (let r = 0; r < 4; r++) { ctx.fillRect(x, y + r * 4 + 3, TS, 1); const o = r % 2 ? 0 : 4; ctx.fillRect(x + o, y + r * 4, 1, 3); ctx.fillRect(x + o + 8, y + r * 4, 1, 3); }
  ctx.fillStyle = "#8a83a6"; ctx.fillRect(x, y, TS, 2);
}
function drawHouseTile(x, y, tx, ty) {
  const roofAbove = wmap[(ty - 1) * TW + tx] === 6, below = wmap[(ty + 1) * TW + tx] === 6;
  if (!below) { // 最下面一排：牆＋門窗
    ctx.fillStyle = "#e8d8b8"; ctx.fillRect(x, y, TS, TS);
    ctx.fillStyle = "#8a5a3a"; ctx.fillRect(x, y, 2, TS); ctx.fillRect(x + TS - 2, y, 2, TS);
    if ((tx + ty) % 3 === 0) { ctx.fillStyle = "#5a3a2a"; ctx.fillRect(x + 5, y + 6, 6, 10); ctx.fillStyle = "#ffd84a"; ctx.fillRect(x + 9, y + 11, 1, 1); }
    else { ctx.fillStyle = "#3a2a4a"; ctx.fillRect(x + 5, y + 5, 6, 5); ctx.fillStyle = `rgba(255,220,140,${0.5 + 0.2 * Math.sin(time * 2 + tx)})`; ctx.fillRect(x + 6, y + 6, 4, 3); ctx.fillStyle = "#8a5a3a"; ctx.fillRect(x + 7.5, y + 5, 1, 5); }
  } else { // 屋頂瓦片
    ctx.fillStyle = "#8a2a2a"; ctx.fillRect(x, y, TS, TS);
    ctx.fillStyle = "#b03a2a"; for (let i = 0; i < 4; i++) ctx.fillRect(x, y + i * 4, TS, 2);
    ctx.fillStyle = "#5a1a1a"; for (let i = 0; i < 4; i++) ctx.fillRect(x + (i % 2) * 4, y + i * 4 + 2, 1, 2), ctx.fillRect(x + (i % 2) * 4 + 8, y + i * 4 + 2, 1, 2);
    if (!roofAbove) { ctx.fillStyle = "#3a1414"; ctx.fillRect(x - 1, y, TS + 2, 2); ctx.fillStyle = "#ffd84a"; if (tx % 4 === 0) ctx.fillRect(x + 7, y - 2, 2, 2); }
  }
}

// ───────── 背包圖示（小圖轉成 dataURL 給 HTML 用）─────────
const ICON_SRC = {
  crown: sprite(["..........", ".k..kk..k.", "kGkkGGkkGk", "kGGGGGGGGk", "kGRGGBGGRk", "kGGGGGGGGk", "kkkkkkkkkk"], { k: K, G: "#ffd84a", R: "#ff6b6b", B: "#6fb8ff" }),
  robe: sprite(["..kk..kk..", ".kBBkkBBk.", "kBBBWWBBBk", "kBkBWWBkBk", "kBkBBBBkBk", "..kBBBBk..", "..kBBBBk..", "..kkkkkk.."], { k: K, B: "#4a6ad8", W: "#eef2fa" }),
  boots: sprite(["..kkk.....", "..kBk.....", "..kBk.....", "..kBk.....", "..kBBkk...", "..kBBBBk..", "..kkkkkk.."], { k: K, B: "#8a5a3a" }),
  charm: sprite(["....k.....", "...kRk....", "...kRk....", "..kGGGk...", ".kGgGGGk..", ".kGGGgGk..", "..kGGGk...", "...kkk...."], { k: K, R: "#ff6b6b", G: "#7dffb0", g: "#ffffff" }),
};
const iconCache = {};
function iconURL(key) {
  if (iconCache[key]) return iconCache[key];
  const src = WPN_IMG[key] || ICON_SRC[key];
  if (!src) return "";
  const c = document.createElement("canvas"), n = 16; c.width = c.height = n;
  const g = c.getContext("2d");
  if (WPN_IMG[key] && key !== "bow" && key !== "fist") { g.translate(n / 2, n / 2); g.rotate(-Math.PI / 4); g.drawImage(src, -src.width / 2, -src.height / 2); }
  else g.drawImage(src, Math.round((n - src.width) / 2), Math.round((n - src.height) / 2));
  return (iconCache[key] = c.toDataURL());
}
const itemIcon = (it) => `<img class="icon" src="${iconURL(it.slot === "sword" ? wtOf(it) : it.slot)}" alt="">`;

// ───────── 特效 ─────────
let fxs = [];
function fxAdd(o) { o.t = 0; fxs.push(o); if (fxs.length > 220) fxs.shift(); }
const fxHit = (x, y, crit, c) => fxAdd({ k: "hit", x, y, max: crit ? 0.22 : 0.14, s: crit ? 11 : 7, a: rand(0, Math.PI), c: crit ? "255,230,120" : c || "255,255,255" });
const fxPuff = (x, y, big) => { for (let i = 0; i < (big ? 7 : 4); i++) fxAdd({ k: "puff", x: x + rand(-5, 5), y: y + rand(-4, 2), vy: -rand(8, 20), max: rand(0.35, 0.6), s: rand(3, big ? 8 : 5) }); fxAdd({ k: "soul", x, y, max: 0.6 }); };
const fxBoom = (x, y, r, c = "255,150,60") => { fxAdd({ k: "boom", x, y, r, max: 0.32, c }); fxAdd({ k: "scorch", x, y, r: r * 0.7, max: 1.6 }); };
const fxCast = (c) => fxAdd({ k: "cast", follow: true, max: 0.3, c });
function updateWFx(dt) {
  for (const f of fxs) { f.t += dt; if (f.vy) f.y += f.vy * dt; }
  fxs = fxs.filter((f) => f.t < f.max);
}
function drawFxUnder() { // 畫在角色下面：焦痕、施法光圈
  for (const f of fxs) {
    const q = f.t / f.max;
    if (f.k === "scorch") { ctx.fillStyle = `rgba(20,10,10,${0.35 * (1 - q)})`; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.5, 0, 0, Math.PI * 2); ctx.fill(); }
    else if (f.k === "cast") { const x = W0.x, y = W0.y + 6; ctx.strokeStyle = `rgba(${f.c},${1 - q})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y, 6 + q * 14, (6 + q * 14) * 0.45, 0, 0, Math.PI * 2); ctx.stroke(); }
  }
}
function drawFxOver() { // 畫在最上面：命中火花、爆炸、煙
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (const f of fxs) {
    const q = f.t / f.max;
    if (f.k === "hit") { // 十字星芒
      const s = f.s * (0.6 + q * 0.8);
      ctx.fillStyle = `rgba(${f.c},${1 - q})`;
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a);
      for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, -1.2); ctx.lineTo(s, 0); ctx.lineTo(0, 1.2); ctx.fill(); }
      ctx.beginPath(); ctx.arc(0, 0, 2.5 * (1 - q) + 0.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    } else if (f.k === "boom") {
      const r = f.r * (0.4 + q * 0.8);
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
      g.addColorStop(0, `rgba(255,255,220,${1 - q})`); g.addColorStop(0.4, `rgba(${f.c},${0.8 * (1 - q)})`); g.addColorStop(1, `rgba(${f.c},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(${f.c},${1 - q})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * (0.5 + q), f.r * (0.5 + q) * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (f.k === "soul") { // 妖魂往上飄
      ctx.fillStyle = `rgba(190,140,255,${0.7 * (1 - q)})`; ctx.beginPath(); ctx.arc(f.x + Math.sin(q * 10) * 2, f.y - q * 22, 2.5 * (1 - q) + 1, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
  for (const f of fxs) if (f.k === "puff") { const q = f.t / f.max; ctx.fillStyle = `rgba(200,190,210,${0.55 * (1 - q)})`; ctx.beginPath(); ctx.arc(f.x, f.y, f.s * (0.5 + q), 0, Math.PI * 2); ctx.fill(); }
}
// 揮砍月牙：有寬度、會從一邊掃到另一邊
function drawSlash(p, wt) {
  if (!(p.swing > 0)) return;
  const max = p.swingMax || 0.2, q = 1 - p.swing / max, R = p.swingR || 22, c = WPN_FX[wt] || "220,240,255";
  const half = wt === "blade" ? 1.5 : wt === "fist" ? 0.6 : 1.1, a0 = p.face - half, a1 = a0 + half * 2 * Math.min(1, q * 1.6 + 0.15);
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const w = wt === "blade" ? 9 : wt === "fist" ? 5 : 7;
  for (let i = 0; i < 3; i++) { // 三層：外光、主體、亮邊
    ctx.strokeStyle = `rgba(${c},${(i === 2 ? 1 : i === 1 ? 0.6 : 0.25) * (1 - q * 0.8)})`;
    ctx.lineWidth = i === 0 ? w : i === 1 ? w * 0.55 : 1.5;
    ctx.beginPath(); ctx.arc(p.x, p.y - 2, R - (i === 2 ? w * 0.25 : 0), Math.max(a0, a1 - half * 1.4), a1); ctx.stroke();
  }
  ctx.restore();
}
// 手上的武器：平常斜拿，攻擊時跟著揮
function drawHeldWeapon(p, wt) {
  const img = WPN_IMG[wt]; if (!img) return;
  let a = p.face, off = 4;
  if (p.swing > 0 && (wt === "sword" || wt === "blade")) { const q = 1 - p.swing / (p.swingMax || 0.2), half = wt === "blade" ? 1.5 : 1.1; a = p.face - half + half * 2 * Math.min(1, q * 1.6); }
  else if (p.swing > 0 && wt === "fist") off = 9;
  else if (!(p.swing > 0) && (wt === "sword" || wt === "blade")) a = p.flip ? Math.PI + 0.9 : -0.9; // 收劍：斜靠在身上
  ctx.save();
  ctx.translate(Math.round(p.x + Math.cos(a) * off), Math.round(p.y + 1 + Math.sin(a) * off * 0.6));
  if (wt === "bow") { ctx.rotate(p.face); ctx.drawImage(img, -2, -img.height / 2); }
  else if (wt === "fist") { ctx.drawImage(img, -3, -2); }
  else { ctx.rotate(a); if (Math.cos(a) < 0 && wt !== "staff") ctx.scale(1, -1); ctx.drawImage(img, -2, -img.height / 2); }
  ctx.restore();
  if (wt === "staff") { const tx = p.x + Math.cos(a) * (off + 12), ty = p.y + 1 + Math.sin(a) * (off + 12) * 0.6; ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(201,162,255,${0.35 + 0.2 * Math.sin(time * 6)})`; ctx.beginPath(); ctx.arc(tx, ty, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
}
// 飛行物的拖尾
function drawTrail(s, c, w) {
  if (!s.tr) s.tr = [];
  s.tr.push(s.x, s.y); if (s.tr.length > 12) s.tr.splice(0, 2);
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
  for (let i = 2; i < s.tr.length; i += 2) {
    ctx.strokeStyle = `rgba(${c},${(i / s.tr.length) * 0.6})`; ctx.lineWidth = w * (i / s.tr.length);
    ctx.beginPath(); ctx.moveTo(s.tr[i - 2], s.tr[i - 1]); ctx.lineTo(s.tr[i], s.tr[i + 1]); ctx.stroke();
  }
  ctx.restore();
}
function glow(x, y, r, c, a = 0.5) {
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function drawArrow(s, sc) { // 箭：箭身＋箭頭＋尾羽
  ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a); ctx.scale(sc, sc);
  ctx.fillStyle = "#c89a5a"; ctx.fillRect(-8, -0.5, 8, 1);
  ctx.fillStyle = "#eef2fa"; ctx.beginPath(); ctx.moveTo(2.5, 0); ctx.lineTo(-0.5, -1.8); ctx.lineTo(-0.5, 1.8); ctx.fill();
  ctx.fillStyle = "#ff6b6b"; ctx.fillRect(-9, -1.5, 2, 1); ctx.fillRect(-9, 0.5, 2, 1);
  ctx.restore();
}

// ───────── 怪物出手預警 ─────────
function drawTelegraph(m, d) {
  const q = 1 - m.wind / m.windMax;
  ctx.save();
  if (d.ai === "ranged") { glow(m.x, m.y - 3, 6 + q * 6, "255,90,60", 0.5 + q * 0.4); ctx.restore(); return; }
  if (d.heavy) {
    const cx = m.x + Math.cos(m.wa) * 8, cy = m.y + Math.sin(m.wa) * 8;
    ctx.fillStyle = `rgba(255,60,40,${0.12 + q * 0.18})`; ctx.beginPath(); ctx.ellipse(cx, cy, 28, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255,80,50,${0.35})`; ctx.beginPath(); ctx.ellipse(cx, cy, 28 * q, 14 * q, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,90,60,0.8)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(cx, cy, 28, 14, 0, 0, Math.PI * 2); ctx.stroke();
  } else {
    const R = d.r + 13;
    ctx.fillStyle = `rgba(255,60,40,${0.12 + q * 0.15})`; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.arc(m.x, m.y, R, m.wa - 1.1, m.wa + 1.1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,80,50,0.35)"; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.arc(m.x, m.y, R * q, m.wa - 1.1, m.wa + 1.1); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  if (q < 0.35) { ctx.font = "bold 9px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#1b1424"; ctx.fillText("!", m.x + 0.5, m.y - d.r - 11.5); ctx.fillStyle = "#ff5a4a"; ctx.fillText("!", m.x, m.y - d.r - 12); }
}

// ───────── 穿什麼裝看得到：袍子顏色、頭冠、靴子跟著裝備品質變 ─────────
const ROBE_C = [["#eef2fa", "#a9bcd8", "#3c8fd1"], ["#cfe4ff", "#6fa0e0", "#2a5ab8"], ["#fff1c0", "#e0b850", "#b0402a"], ["#ffd8b0", "#ff8a3d", "#7a1e1e"]];
const CROWN_C = ["#9a8a70", "#6fb8ff", "#ffd84a", "#ff8a3d"];
const BOOT_C = ["#a9bcd8", "#5a8ad8", "#d8a040", "#ff6a3a"];
const heroCache = {};
// 時裝：蓋掉袍子和頭髮的顏色（只是外觀，不影響數值）
const SKINS = {
  none: { n: "跟著裝備", price: 0 },
  snow: { n: "白雪道袍", price: 0, W: "#ffffff", w: "#c8d8f0", B: "#9fc8ff", H: "#e8e8f0", h: "#b0b8d0" },
  ink: { n: "墨夜劍客", price: 150, W: "#3a3450", w: "#24203a", B: "#ff5a6a", H: "#121018", h: "#3a3050" },
  jade: { n: "青竹隱士", price: 150, W: "#9fe0b0", w: "#5aa070", B: "#2a6a4a", H: "#2a3a2a", h: "#4a6a4a" },
  crimson: { n: "赤焰狂徒", price: 300, W: "#ff7a5a", w: "#c03a2a", B: "#ffd84a", H: "#ff5a2a", h: "#ffb030" },
  sakura: { n: "落櫻仙子", price: 300, W: "#ffd0e0", w: "#f090b0", B: "#c04a80", H: "#f8f0ff", h: "#e0b0d0" },
  gold: { n: "金蓮聖者", price: 800, W: "#fff1b0", w: "#e0b040", B: "#ff8a3d", H: "#fff6d0", h: "#ffd84a" },
  void: { n: "虛空魔君", price: 800, W: "#6a3a9a", w: "#3a1a5a", B: "#ff3a5a", H: "#d8d0ff", h: "#9a8ad8" },
};
const gearKey = () => { const e = save.eq; return `${e.robe ? e.robe.q : -1},${e.crown ? e.crown.q : -1},${e.boots ? e.boots.q : -1},${(save.w && save.w.skin) || "none"}`; };
function heroImg(walk) { const g = gearKey().split(","); return heroImgFor(+g[0], +g[1], +g[2], walk, g[3]); }
function heroImgFor(rq, cq, bq, walk, skin = "none") {
  const key = `${rq}${cq}${bq}${walk}${skin}`;
  if (heroCache[key]) return heroCache[key];
  const rc = rq < 0 ? ["#c8bca8", "#8a8070", "#6a5a4a"] : ROBE_C[rq];
  const pal = Object.assign({}, HERO_PAL, { W: rc[0], w: rc[1], B: rc[2], C: CROWN_C[Math.max(0, cq)], b: bq < 0 ? "#3a2f4a" : BOOT_C[bq] });
  const sk = SKINS[skin]; if (sk && skin !== "none") for (const c of ["W", "w", "B", "H", "h"]) if (sk[c]) pal[c] = sk[c];
  const top = HERO_TOP.slice();
  if (cq >= 0) { top[0] = cq >= 2 ? "...kCkCk...." : "....kCCk...."; top[1] = cq >= 2 ? "...kCCCCk..." : "...kHCCHk..."; }
  const legs = walk ? ["..kbk..kbk..", "..kk.....k.."] : ["...kbk.kbk..", "...kk...kk.."];
  return (heroCache[key] = sprite([...top, ...legs], pal));
}
function drawHeroAura(p) { // 穿傳說裝：腳下光環；武器強化 +7 以上：武器旁邊閃光
  const n = SLOT_KEYS.filter((k) => save.eq[k] && save.eq[k].q === 3).length, en = save.eq.sword ? save.eq.sword.en || 0 : 0;
  if (n) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(255,150,60,${0.35 + 0.15 * Math.sin(time * 3) + n * 0.05})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 7, 9, 3.5, 0, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < n + 1; i++) { const a = time * 1.5 + i * 2.3, y = p.y + 6 - ((time * 12 + i * 7) % 18); ctx.fillStyle = "rgba(255,180,80,0.7)"; ctx.fillRect(p.x + Math.cos(a) * 7, y, 1, 1); }
    ctx.restore();
  }
  if (en >= 7 && Math.random() < 0.3) particles.push({ x: p.x + rand(-8, 8), y: p.y + rand(-10, 4), vx: 0, vy: -12, life: 0.4, max: 0.4, color: en >= 10 ? "#ff8a3d" : "#ffe066", size: 1 });
}

// 自己頭上的名字（金色），別人是綠色
const myName = () => ((save.w && save.w.nick) || (typeof fbUser !== "undefined" && fbUser && fbUser.displayName) || "我").slice(0, 12);
function drawMyName(p) {
  ctx.font = "bold 6px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
  const t = `${myName()} Lv.${save.w.lv}`;
  ctx.fillStyle = "#1b1424"; ctx.fillText(t, p.x + 0.5, p.y - 12.5); ctx.fillStyle = "#ffe066"; ctx.fillText(t, p.x, p.y - 13);
  ctx.fillStyle = "#ffe066"; ctx.beginPath(); ctx.moveTo(p.x - 2, p.y - 20); ctx.lineTo(p.x + 2, p.y - 20); ctx.lineTo(p.x, p.y - 17.5); ctx.fill(); // 小箭頭：這是你
}
// 角色畫面：改暱稱、換時裝
function fashionHtml() {
  const w = save.w, own = w.skins || ["none", "snow"], cur = w.skin || "none";
  return `<div class="fashion">
    <div class="baghead">暱稱（別的玩家看到的名字）</div>
    <div class="nickrow"><input id="nick" maxlength="10" value="${myName().replace(/"/g, "")}" placeholder="2～10 個字"><button id="nickOk" class="sbtn gold">改名</button></div>
    <div class="baghead">時裝（只改外觀，不影響數值）　靈石 <b class="stone">${save.stone}</b></div>
    <div class="skins">${Object.keys(SKINS).map((k) => { const s = SKINS[k], has = own.includes(k) || !s.price;
      return `<button class="skin${cur === k ? " sel" : ""}" data-k="${k}"><img src="${skinIcon(k)}" alt=""><b>${s.n}</b><small>${cur === k ? "穿著中" : has ? "點一下換上" : `${s.price} 靈石`}</small></button>`; }).join("")}</div>
  </div>`;
}
const skinIconCache = {};
function skinIcon(k) {
  const g = gearKey().split(","), ck = k + g.slice(0, 3).join("");
  if (skinIconCache[ck]) return skinIconCache[ck];
  const img = heroImgFor(+g[0], +g[1], +g[2], 0, k), c = document.createElement("canvas");
  c.width = 14; c.height = 16; c.getContext("2d").drawImage(img, 1, 1);
  return (skinIconCache[ck] = c.toDataURL());
}
function bindFashion() {
  const w = save.w;
  const ok = document.getElementById("nickOk");
  if (ok) ok.onclick = () => {
    const v = document.getElementById("nick").value.trim().replace(/[<>&"]/g, "");
    if (v.length < 2) { floatText(W0.x, W0.y - 30, "暱稱至少 2 個字", "#ff8a7a"); return; }
    w.nick = v; writeSave(); sfx("good"); renderAP();
  };
  screenEl.querySelectorAll(".skin").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.k, s = SKINS[k]; w.skins = w.skins || ["none", "snow"];
    if (!w.skins.includes(k) && s.price) {
      if (save.stone < s.price) { sfx("bad"); b.querySelector("small").textContent = "靈石不夠"; return; }
      save.stone -= s.price; w.skins.push(k);
    }
    w.skin = k; writeSave(); sfx("arrive"); renderAP();
  }));
}

// ───────── 建立角色：取名、選初始武器、選外觀 ─────────
let createSel = { wt: "sword", skin: "none" };
function renderCreate(msg = "") {
  state = "title"; pad.classList.add("hidden");
  const def = (typeof fbUser !== "undefined" && fbUser && fbUser.displayName) || "";
  const prev = document.getElementById("cname"), nameVal = prev ? prev.value : def;
  const wpn = (k) => { const w = WEAPONS[k], sk = WSKILLS[k];
    return `<button class="card cw${createSel.wt === k ? " picked" : ""}" data-k="${k}"><img class="icon" src="${iconURL(k)}" alt=""><b>${w.job}</b><span class="tag">${w.n}</span><span class="desc">J ${sk.attack[0]}・K ${sk.spin[0]}・U ${sk.ult[0]}</span></button>`; };
  const looks = ["none", "snow", "ink", "jade"];
  screenEl.innerHTML = `<div class="panel wide create">
    <h1 class="pick-title">建立角色</h1>
    ${msg ? `<div class="emsg">${msg}</div>` : ""}
    <div class="baghead">名字（2～10 個字，之後可以在「角色」改）</div>
    <input id="cname" class="cname" maxlength="10" placeholder="例如：青雲劍仙" value="${nameVal.replace(/"/g, "")}">
    <div class="baghead">初始武器（決定一開始的招式；之後撿到別的武器隨時能換）</div>
    <div class="cards cwrap">${WT_KEYS.map(wpn).join("")}</div>
    <div class="baghead">外觀</div>
    <div class="skins">${looks.map((k) => `<button class="skin${createSel.skin === k ? " sel" : ""}" data-k="${k}"><img src="${skinIcon(k)}" alt=""><b>${k === "none" ? "素衣" : SKINS[k].n}</b></button>`).join("")}</div>
    <div class="btns"><button id="cgo" class="big">踏上仙途</button></div>
  </div>`;
  screenEl.classList.remove("hidden");
  screenEl.querySelectorAll(".cw").forEach((b) => b.addEventListener("click", () => { createSel.wt = b.dataset.k; sfx("click"); renderCreate(); }));
  screenEl.querySelectorAll(".skin").forEach((b) => b.addEventListener("click", () => { createSel.skin = b.dataset.k; sfx("click"); renderCreate(); }));
  document.getElementById("cgo").onclick = () => {
    const n = document.getElementById("cname").value.trim().replace(/[<>&"]/g, "");
    if (n.length < 2) { renderCreate("名字至少 2 個字"); return; }
    save.w = blankW();
    Object.assign(save.w, { created: 1, tut: 0, nick: n, skin: createSel.skin, skins: ["none", "snow", createSel.skin].filter((v, i, a) => a.indexOf(v) === i) });
    const it = rollItem(0, 0, createSel.wt); it.q = 0; it.u = null; it.wt = createSel.wt; it.aff = {}; nameItem(it);
    if (save.eq.sword) save.bag.push(save.eq.sword);
    save.eq.sword = it;
    writeSave(); sfx("arrive");
    enterWorld();
  };
}
