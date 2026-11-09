// 萬劍仙途 — 第 11 項：各區音樂、低階手機模式、無障礙（企劃 12 §2-5）
// 這些是「這台裝置」的設定，存在 localStorage（不跟帳號走：低階模式只跟手機有關）
"use strict";

const A11 = {
  low: localStorage.getItem("pr_low") === "1",   // 低階手機模式
  font: localStorage.getItem("pr_font") || "m",  // 字體 s／m／l
  cb: localStorage.getItem("pr_cb") === "1",     // 色弱預警（閃爍虛線框）
  bgm: localStorage.getItem("pr_bgm") !== "0",   // 背景音樂（音效另外開關）
};
const FONT_K = { s: 0.88, m: 1, l: 1.2 };
function a11Set(k, v) {
  A11[k] = v;
  localStorage.setItem("pr_" + k, typeof v === "boolean" ? (v ? "1" : "0") : v);
  if (k === "low") resize();
  if (k === "font") a11Font();
}

// ───────── 字體大小：畫布上的字全部跟著縮放，覆蓋層（行囊、設定…）用 zoom ─────────
(() => {
  const d = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, "font");
  if (!d || !d.set) return;
  Object.defineProperty(ctx, "font", {
    configurable: true,
    get() { return d.get.call(this); },
    set(v) { const f = FONT_K[A11.font] || 1; d.set.call(this, f === 1 ? v : String(v).replace(/(\d+(?:\.\d+)?)px/, (m, n) => (n * f).toFixed(1) + "px")); },
  });
})();
function a11Font() { document.body.classList.remove("fz-s", "fz-m", "fz-l"); document.body.classList.add("fz-" + A11.font); }
a11Font();

// ───────── 低階模式 ─────────
// 1) 解析度最多 1 倍（core.js resize 會看 pr_low）2) 粒子減半、最多 60 顆 3) 不畫地面花草 4) 其他玩家招式特效關掉（net.js allyA）
let a11PN = 0;
const _updateFxA = updateFx;
updateFx = function (dt) {
  if (A11.low) {
    if (particles.length > a11PN) { const fresh = particles.splice(a11PN); for (let i = 0; i < fresh.length; i += 2) particles.push(fresh[i]); }
    if (particles.length > 60) particles.splice(0, particles.length - 60);
  }
  _updateFxA(dt);
  a11PN = particles.length;
};
const _drawDecoA = drawDeco;
drawDeco = function (x, y, z, v) { if (!A11.low) _drawDecoA(x, y, z, v); };

// 偵測掉幀：仙界裡連續兩次（各 6 秒）平均低於 40 幀，就問一次要不要開低階模式
(() => {
  let n = 0, t0 = performance.now(), bad = 0, asked = localStorage.getItem("pr_lowAsk") === "no";
  function tick(now) {
    n++;
    if (now - t0 >= 6000) {
      const fps = (n * 1000) / (now - t0);
      const ok = !document.hidden && state === "world" && !ovKind;
      bad = ok && fps < 40 ? bad + 1 : ok ? 0 : bad;
      if (bad >= 2 && !A11.low && !asked) { asked = true; askLow(fps); }
      n = 0; t0 = now;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  function askLow(fps) {
    const bar = document.createElement("div"); bar.id = "updBar"; bar.className = "lowBar";
    bar.innerHTML = `<button class="upd-go">畫面有點卡（${Math.round(fps)} 幀）・開低階模式</button><button class="upd-later">不用</button>`;
    bar.querySelector(".upd-go").onclick = () => { a11Set("low", true); bar.remove(); notice("已開低階模式，齒輪→設定可以關掉"); };
    bar.querySelector(".upd-later").onclick = () => { localStorage.setItem("pr_lowAsk", "no"); bar.remove(); };
    document.body.appendChild(bar);
    setTimeout(() => bar.remove(), 20000);
  }
})();

// ───────── 色弱預警：紅色範圍外再加一圈閃爍的白色虛線，不靠顏色也看得出來 ─────────
function cbBegin(w = 1.2) {
  ctx.save();
  ctx.setLineDash([3, 2.5]); ctx.lineDashOffset = -time * 18;
  ctx.strokeStyle = `rgba(255,255,255,${0.55 + 0.45 * Math.sin(time * 14)})`; ctx.lineWidth = w;
}
const _drawTelegraphA = drawTelegraph;
drawTelegraph = function (m, d) {
  _drawTelegraphA(m, d);
  if (!A11.cb) return;
  cbBegin(); ctx.beginPath();
  if (d.ai === "ranged") ctx.arc(m.x, m.y - 3, 11, 0, Math.PI * 2);
  else if (d.heavy) { const cx = m.x + Math.cos(m.wa) * 8, cy = m.y + Math.sin(m.wa) * 8; ctx.ellipse(cx, cy, 30, 15.5, 0, 0, Math.PI * 2); }
  else { const R = d.r + 14; ctx.moveTo(m.x, m.y); ctx.arc(m.x, m.y, R, m.wa - 1.1, m.wa + 1.1); ctx.closePath(); }
  ctx.stroke(); ctx.restore();
};
const _drawHazardsA = drawHazards;
drawHazards = function () {
  _drawHazardsA();
  if (!A11.cb) return;
  cbBegin(1.5);
  for (const h of hazards) {
    if (h.delay > 0 || !(h.warn > 0)) continue;
    ctx.beginPath();
    if (h.type === "circle") { ctx.arc(h.x, h.y, h.r + 2, 0, Math.PI * 2); ctx.stroke(); }
    else if (h.type === "line") { ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.a); ctx.strokeRect(-2, -h.w / 2 - 2, h.len + 4, h.w + 4); ctx.restore(); }
  }
  ctx.restore();
};
const _drawWBZonesA = drawWBZones;
drawWBZones = function () {
  _drawWBZonesA();
  if (!A11.cb) return;
  cbBegin(1.5);
  for (const z of wbZones) {
    ctx.beginPath();
    if (z.k === "ring") { ctx.arc(z.x, z.y, z.r1 + 2, 0, Math.PI * 2); ctx.stroke(); if (z.r0 > 0) { ctx.beginPath(); ctx.arc(z.x, z.y, Math.max(1, z.r0 - 2), 0, Math.PI * 2); ctx.stroke(); } }
    else if (z.k === "circle") { ctx.ellipse(z.x, z.y, z.r + 2, z.r * 0.55 + 1.5, 0, 0, Math.PI * 2); ctx.stroke(); }
    else { ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(z.a); ctx.strokeRect(-2, -z.w / 2 - 2, z.len + 4, z.w + 4); ctx.restore(); }
  }
  ctx.restore();
};
const _drawWMobA = drawWMob;
drawWMob = function (m) {
  _drawWMobA(m);
  if (A11.cb && m.dv && m.dv.ph === "aim") { cbBegin(1.5); ctx.translate(m.x, m.y); ctx.rotate(m.dv.a); ctx.strokeRect(-2, -10, 144, 20); ctx.restore(); } // 雷鷹俯衝線
};

// ───────── 各區音樂：每區自己的調式、速度、音色；打王有鼓 ─────────
// sc：音階（半音，從 root 起）、bt：每拍秒數、wv：旋律音色、bw：低音音色、dn：旋律密度、ec：回音（空靈）、dr：鼓（0 沒有、1 輕、2 打王）
const MOODS = {
  town:    { root: 262, sc: [0, 2, 4, 7, 9], bt: 0.3, wv: "triangle", bw: "sine", dn: 0.55, ec: 0.25, dr: 0, v: 0.045 },
  grass:   { root: 294, sc: [0, 2, 4, 7, 9], bt: 0.24, wv: "triangle", bw: "triangle", dn: 0.7, ec: 0, dr: 1, v: 0.045 },
  forest:  { root: 220, sc: [0, 3, 5, 7, 10], bt: 0.32, wv: "triangle", bw: "sine", dn: 0.45, ec: 0.3, dr: 0, v: 0.04 },
  waste:   { root: 196, sc: [0, 2, 5, 7, 10], bt: 0.27, wv: "square", bw: "triangle", dn: 0.5, ec: 0, dr: 1, v: 0.028 },
  volcano: { root: 165, sc: [0, 1, 5, 7, 8], bt: 0.21, wv: "square", bw: "sawtooth", dn: 0.6, ec: 0, dr: 1, v: 0.028 },
  snow:    { root: 523, sc: [0, 2, 4, 7, 9], bt: 0.38, wv: "sine", bw: "sine", dn: 0.35, ec: 0.45, dr: 0, v: 0.04 },
  swamp:   { root: 147, sc: [0, 1, 5, 6, 10], bt: 0.42, wv: "triangle", bw: "sawtooth", dn: 0.35, ec: 0.35, dr: 0, v: 0.04 },
  thunder: { root: 247, sc: [0, 3, 5, 7, 10], bt: 0.16, wv: "square", bw: "sawtooth", dn: 0.65, ec: 0, dr: 1, v: 0.026 },
  sky:     { root: 392, sc: [0, 2, 4, 7, 9], bt: 0.4, wv: "sine", bw: "sine", dn: 0.4, ec: 0.5, dr: 0, v: 0.042 },
  boss:    { root: 110, sc: [0, 1, 3, 7, 8], bt: 0.17, wv: "square", bw: "sawtooth", dn: 0.75, ec: 0, dr: 2, v: 0.03 },
};
const hash01 = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
let bgmMood = "town";
function bgmPick() {
  const vs = viewState();
  if (vs === "play" || vs === "intro" || vs === "hunt") return "boss";
  if (vs === "run" || vs === "runEnd" || vs === "title") return "grass";
  if (vs !== "world" || typeof W0 === "undefined" || !W0) return null;
  const a = typeof wbArena === "function" && wbArena();
  if (a && Math.hypot(W0.x - a.x, W0.y - a.y) < a.r + 60) return "boss";
  const z = zoneAt(W0.x, W0.y);
  return MOODS[z] ? z : "town";
}
function kick(d, v) { tone("sine", 130, 40, 0.14, v, d); }
function snare(d, v) { noise(0.09, v, 3200, d); }
function hat(d, v) { noise(0.025, v, 9000, d); }
updateBgm = function () {
  if (!actx || muted || !A11.bgm || actx.state !== "running" || state === "paused") return;
  const k = bgmPick();
  if (!k) return;
  if (k !== bgmMood) { bgmMood = k; bgmStep = 0; } // 換區：從頭開始這區的曲子
  const M = MOODS[k], beat = M.bt, f = (i, oct = 0) => M.root * Math.pow(2, (M.sc[((i % 5) + 5) % 5] + 12 * (oct + Math.floor(i / 5))) / 12);
  if (bgmNext < actx.currentTime) bgmNext = actx.currentTime + 0.05;
  while (bgmNext < actx.currentTime + 0.3) {
    const d = bgmNext - actx.currentTime, s = bgmStep % 16, bar = Math.floor(bgmStep / 16) % 4, seed = (bgmStep % 64) + k.length * 97; // 4 小節一個循環
    // 低音：每 4 拍一個，跟著小節換和弦根音（I-VI-IV-V 的五聲版）
    const chord = [0, 3, 2, 4][bar];
    if (s % 4 === 0) tone(M.bw, f(chord, -1) , f(chord, -1), beat * 3.5, M.v * 1.3, d);
    // 旋律：同一個循環每次都一樣（聽起來像曲子，不是亂彈）
    if (s % 2 === 0 ? hash01(seed) < M.dn : hash01(seed + 7) < M.dn * 0.35) {
      const n = f(chord + Math.floor(hash01(seed + 3) * 7) - 1, k === "snow" || k === "sky" ? 0 : 1);
      tone(M.wv, n, n, beat * (s % 4 === 0 ? 1.6 : 0.9), M.v, d);
      if (M.ec) tone("sine", n, n, beat * 1.2, M.v * M.ec, d + beat * 1.5); // 回音
    }
    if (M.dr === 1) { if (s % 8 === 0) kick(d, 0.05); if (s % 4 === 2) hat(d, 0.012); }
    if (M.dr === 2) { if (s % 4 === 0 || s === 10) kick(d, 0.09); if (s % 8 === 4) snare(d, 0.05); if (s % 2 === 1) hat(d, 0.015); }
    bgmStep++;
    bgmNext += beat;
  }
};
