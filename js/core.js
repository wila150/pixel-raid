// 御劍渡劫（pixel-raid）— 核心：畫面設定、工具函式、像素圖、輸入（鍵盤／搖桿／按鈕）、共用遊戲狀態
"use strict";


// ───────── 基本設定 ─────────
const ARENA = { w: 640, h: 420 }; // 競技場大小（世界座標，1 單位＝1 像素點）
const VIEW_H = 175; // 畫面高度大約看得到多少世界單位（越小越放大）
const cvs = document.getElementById("game");
const ctx = cvs.getContext("2d");
let W = 0, H = 0, SCALE = 3, DPR = 1;
const SAFE = { l: 0, r: 0, t: 0, b: 0 }; // 手機瀏海／圓角要避開的距離（畫在 canvas 上的介面用）
const safeProbe = document.createElement("div");
safeProbe.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";
document.body.appendChild(safeProbe);

function resize() {
  const cs = getComputedStyle(safeProbe);
  SAFE.l = parseFloat(cs.paddingLeft) || 0; SAFE.r = parseFloat(cs.paddingRight) || 0;
  SAFE.t = parseFloat(cs.paddingTop) || 0; SAFE.b = parseFloat(cs.paddingBottom) || 0;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  cvs.width = Math.round(W * DPR);
  cvs.height = Math.round(H * DPR);
  SCALE = Math.max(1.8, Math.min(H / VIEW_H, W / 240));
}
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", () => setTimeout(resize, 300));
resize();

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);

// ───────── 像素圖 ─────────
function sprite(rows, pal) {
  const c = document.createElement("canvas");
  c.width = rows[0].length;
  c.height = rows.length;
  const g = c.getContext("2d");
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); }
  }));
  return c;
}
const HERO_PAL = { k: "#1b1424", H: "#2b2433", h: "#4a3f5c", S: "#f4c9a0", e: "#1b1424", W: "#eef2fa", w: "#a9bcd8", B: "#3c8fd1", L: "#3a2f4a" };
const HERO_TOP = [
  "....kkkk....",
  "...kHhhHk...",
  "....kHHk....",
  "..kHHhhHHk..",
  "..kHSSSSHk..",
  "..kSeSSeSk..",
  "..kSSSSSSk..",
  "..kWWBBWWk..",
  ".kWWWBBWWWk.",
  ".kSkwWWwkSk.",
  ".kkkBBBBkkk.",
  "...kWWWWk...",
];
const HERO = sprite([...HERO_TOP, "...kwk.kwk..", "...kk...kk.."], HERO_PAL);
const HERO_WALK = sprite([...HERO_TOP, "..kwk..kwk..", "..kk.....k.."], HERO_PAL);

// ───────── 輸入 ─────────
const keys = new Set();
const pressed = new Set(); // 這一幀剛按下
window.addEventListener("keydown", (e) => {
  if (e.target && e.target.tagName === "INPUT") return; // 打字（聊天、取名）時不當成操作
  const k = e.key.toLowerCase();
  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
  if (!keys.has(k)) pressed.add(k);
  keys.add(k);
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());

// 滑鼠：左鍵普攻、朝游標方向出招（電腦）
const mouse = { x: 0, y: 0, down: false, t: -99 };
window.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") { mouse.x = e.clientX; mouse.y = e.clientY; mouse.t = performance.now(); } });
window.addEventListener("pointerup", (e) => { if (e.pointerType === "mouse" && e.button === 0) mouse.down = false; });
window.addEventListener("blur", () => { mouse.down = false; });
// 虛擬搖桿：左半邊螢幕按住拖曳
const stick = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
cvs.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse" && state === "world") { if (e.button === 0) { mouse.down = true; mouse.x = e.clientX; mouse.y = e.clientY; mouse.t = performance.now(); } return; }
  if ((e.clientX < W * 0.55 || state === "hunt") && stick.id === null) { // 斬妖試煉整個畫面都能當搖桿
    stick.id = e.pointerId;
    stick.ox = stick.x = e.clientX;
    stick.oy = stick.y = e.clientY;
    cvs.setPointerCapture(e.pointerId);
  }
});
cvs.addEventListener("pointermove", (e) => {
  if (e.pointerId === stick.id) { stick.x = e.clientX; stick.y = e.clientY; }
});
const endStick = (e) => { if (e.pointerId === stick.id) stick.id = null; };
cvs.addEventListener("pointerup", endStick);
cvs.addEventListener("pointercancel", endStick);

// 技能按鈕
const pad = document.getElementById("pad");
const padAct = new Set();
const padHeld = new Set(); // 按住中的鈕（手機攻擊鍵按住連打，跟電腦按住滑鼠一樣）
pad.querySelectorAll(".btn").forEach((b) => {
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    padAct.add(b.dataset.act); padHeld.add(b.dataset.act);
    try { b.setPointerCapture(e.pointerId); } catch (_) {}
    b.classList.add("down");
  });
  const up = () => { b.classList.remove("down"); padHeld.delete(b.dataset.act); };
  for (const ev of ["pointerup", "pointercancel", "pointerleave", "lostpointercapture"]) b.addEventListener(ev, up);
});
window.addEventListener("blur", () => padHeld.clear());
const act = (name, ...ks) => padAct.has(name) || ks.some((k) => pressed.has(k));

// ───────── 遊戲狀態 ─────────
let state = "title"; // title / run / runEnd / runFail / hunt / huntEnd / huntFail / intro / play / win / lose
let player, boss, hazards, shots, pshots, particles, floaters, shake, time, stats, cam, slowmo;
let hitstop = 0, combo = 0, comboT = 0, comboPop = 0, flashT = 0, flashColor = "255,255,255", introT = 0, ultFx = 0, ultA = 0, embers = [], cracks = [];
