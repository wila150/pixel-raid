// 萬劍仙途 — 企劃 68：技能照使用者的敘述改（第一包：劍＋法杖；第二包：弓＋大刀）
// world.js 直接改招式本身；這裡放共用小工具、每幀狀態（劍雨、焚天火浪、電磁球、時緩）、畫面。
// enew.js 後載入（包 updateWorld／drawFxOver 最外層）。
"use strict";

function sk68Hit(x, y, test, base, kb, sl, dm, fn) { // 在 (x,y) 用 test(m) 判斷範圍，打中呼叫 fn
  const s0 = CUR_SL, d0 = CUR_DM; CUR_SL = sl || null; CUR_DM = dm || 1;
  try { for (const m of W0.mobs) if (!m.dead && test(m)) { hitMob(m, wDmg(base), kb, { x, y }, true); if (fn) fn(m); } }
  finally { CUR_SL = s0; CUR_DM = d0; }
}
// 破霸體：打斷精英／王的出招蓄力
function sk68Break(m) {
  let hit = false;
  if (m.wind > 0) { m.wind = 0; hit = true; }
  if (m.dv && m.dv.ph === "aim") { m.dv = null; hit = true; }
  if (m.mv && m.mv.ph !== "go") { m.mv = null; hit = true; }
  if (m.boss && m.wbAct) { m.wbAct = null; hit = true; }
  m.atkT = Math.max(m.atkT || 0, 0.6);
  if (m.boss && m.actT !== undefined) m.actT = Math.max(m.actT, 0.8);
  if (hit || m.elite || m.boss) floatText(m.x, m.y - 22, "破霸體", "#ffd84a");
}
// 破軍第 3 下：前方長條金色巨劍
function breakSlash(p, a) {
  const L = 100 * AM(), Wd = 14, ca = Math.cos(a), sa = Math.sin(a);
  const ms = [];
  for (const m of W0.mobs) {
    if (m.dead) continue;
    const dx = m.x - p.x, dy = m.y - p.y, u = dx * ca + dy * sa, v = Math.abs(-dx * sa + dy * ca), r = WMOBS[m.type].r;
    if (u > -8 && u < L + r && v < Wd + r) ms.push([u, m]);
  }
  ms.sort((a, b) => a[0] - b[0]); // 最前面那隻全傷害、後面的 35%（單體重劈）
  ms.forEach(([, m], i) => { hitMob(m, wDmg(BREAK_D) * (i ? BREAK_SIDE : 1) * (m.elite || m.boss ? 1.3 : 1), 140, p); if (!m.dead) sk68Break(m); });
  W0.bkFx.push({ x: p.x, y: p.y, a, L, t: 0.32, max: 0.32 });
  shake = Math.max(shake, 5); flashT = 0.04; flashColor = "255,225,140";
}
// 爆裂：十字形火焰
function crossFire(x, y, a, L) {
  W0.bkFx.push({ x, y, a, L, t: 0.3, max: 0.3, cross: 1 });
  for (let k = 0; k < 4; k++) { const b = a + (k * Math.PI) / 2; for (let i = 0; i < 6; i++) { const v = rand(60, 160); particles.push({ x, y, vx: Math.cos(b) * v, vy: Math.sin(b) * v, life: 0.3, max: 0.3, color: i % 2 ? "#ff8a2e" : "#ffd84a", size: 2 }); } }
  sfx("hit");
}
// 暈眩（麻痺）：一般怪 t 秒，王 0.3 秒（王只停出招）
function sk68Stun(m, t) {
  if (!m || m.dead) return;
  if (!m.boss) m.ssStun = Math.max(m.ssStun || 0, t);
  else { m.atkT = Math.max(m.atkT || 0, 0.3); if (m.actT !== undefined) m.actT = Math.max(m.actT, 0.3); }
  if (!(m.stunTxt > time)) { m.stunTxt = time + 0.8; floatText(m.x, m.y - 24, "麻痺", "#dfe8ff"); }
}
function zapLine(x1, y1, x2, y2) { W0.zaps.push({ x1, y1, x2, y2, t: 0.22 }); bolts.push({ x: x2, y: y2, life: 0.15 }); }

// ───────── 每幀 ─────────
const _updateWorld68 = updateWorld;
updateWorld = function (dt) {
  const r = _updateWorld68.apply(this, arguments);
  if (!W0 || !(dt > 0) || state !== "world") return r;
  const p = W0;
  // 劍雨：區域內每 0.25 秒落一陣小劍
  if (W0.swRains && W0.swRains.length) {
    for (const o of W0.swRains) {
      o.t -= dt; o.tick -= dt;
      for (let i = 0; i < 2; i++) { const a = rand(0, 6.28), d = Math.sqrt(Math.random()) * o.r; particles.push({ x: o.x + Math.cos(a) * d, y: o.y + Math.sin(a) * d * 0.6 - 70, vx: 0, vy: 330, life: 0.21, max: 0.21, color: Math.random() < 0.5 ? "#e8f4ff" : "#9fd0ff", size: 1.6, sword: 1 }); }
      if (o.tick <= 0 && !o.ghost) {
        o.tick = 0.25; DOT_HIT = true;
        try { sk68Hit(o.x, o.y, (m) => Math.hypot(m.x - o.x, (m.y - o.y) / 0.8) < o.r + WMOBS[m.type].r, RAIN_D, 0, o.sl, o.dm); } finally { DOT_HIT = false; }
        if (Math.random() < 0.5) sfx("hit");
      }
    }
    W0.swRains = W0.swRains.filter((o) => o.t > 0);
  }
  // 焚天：火浪從你往外擴散，經過就燒
  const I = W0.infW;
  if (I) {
    I.t += dt; const rr = (I.R * Math.min(1, I.t / I.max));
    sk68Hit(I.x, I.y, (m) => !I.hit.has(m) && dist(m, I) < rr + WMOBS[m.type].r, INF_D, 60, I.sl, I.dm, (m) => { if (!m.dead) { m.burnT = Math.max(m.burnT || 0, 3); m.burnD = Math.max(m.burnD || 0, wDmg(INF_B)); } });
    for (const m of W0.mobs) if (!m.dead && dist(m, I) < rr + WMOBS[m.type].r) I.hit.add(m);
    for (let i = 0; i < 8; i++) { const a = rand(0, 6.28); particles.push({ x: I.x + Math.cos(a) * rr, y: I.y + Math.sin(a) * rr * 0.6, vx: Math.cos(a) * 30, vy: -rand(20, 50), life: 0.4, max: 0.4, color: Math.random() < 0.5 ? "#ff8a2e" : "#ffd84a", size: 2 }); }
    if (I.t >= I.max + 0.2) W0.infW = null;
  }
  if (W0.emBall && (W0.emBall.t -= dt) <= 0) W0.emBall = null;
  if (W0.starUp && (W0.starUp.t -= dt) <= 0) W0.starUp = null;
  if (W0.bkFx && W0.bkFx.length) { for (const o of W0.bkFx) o.t -= dt; W0.bkFx = W0.bkFx.filter((o) => o.t > 0); }
  if (W0.zaps && W0.zaps.length) { for (const o of W0.zaps) o.t -= dt; W0.zaps = W0.zaps.filter((o) => o.t > 0); }
  return r;
};

// ───────── 畫面 ─────────
function drawSpinSword(s) { // 回旋劍：一把旋轉的大飛劍
  const g = ctx, sc = s.sc || 2;
  s.rot = (s.rot || 0) + 0.45;
  drawTrail(s, "160,210,255", 6);
  g.save(); g.translate(s.x, s.y - 2); g.rotate(s.rot);
  glow(0, 0, 9 * sc, "150,210,255", 0.45);
  g.fillStyle = "#eaf4ff"; g.beginPath(); g.moveTo(9 * sc, 0); g.lineTo(-3 * sc, -1.6 * sc); g.lineTo(-3 * sc, 1.6 * sc); g.closePath(); g.fill();
  g.fillStyle = "#7fb6ff"; g.fillRect(-3.6 * sc, -2.6 * sc, 1.2 * sc, 5.2 * sc);
  g.fillStyle = "#3a4a6a"; g.fillRect(-6.5 * sc, -0.8 * sc, 3 * sc, 1.6 * sc);
  g.restore();
}
function drawSwal(s) { // 燕返：迴力鏢狀弧形氣刃
  const g = ctx; drawTrail(s, "170,255,220", 5);
  g.save(); g.globalCompositeOperation = "lighter"; g.translate(s.x, s.y); g.rotate(s.a);
  glow(0, 0, 10, "150,255,210", 0.4);
  g.strokeStyle = "rgba(150,255,210,0.55)"; g.lineWidth = 5; g.beginPath(); g.arc(-6, 0, 10, -1.3, 1.3); g.stroke();
  g.strokeStyle = "#f2fff8"; g.lineWidth = 1.6; g.beginPath(); g.arc(-6, 0, 10, -1.2, 1.2); g.stroke();
  g.restore();
}
function sk68Draw() {
  const g = ctx, T = typeof time !== "undefined" ? time : 0;
  for (const o of W0.swRains || []) { // 劍雨：地上的範圍
    const a = Math.min(1, o.t * 2) * 0.7; g.save(); g.strokeStyle = `rgba(170,215,255,${a})`; g.lineWidth = 1; g.setLineDash([4, 3]); g.lineDashOffset = -T * 12;
    g.beginPath(); g.ellipse(o.x, o.y, o.r, o.r * 0.6, 0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); g.fillStyle = `rgba(140,190,255,${0.08 * a})`; g.fill(); g.restore();
  }
  const I = W0.infW;
  if (I) { const rr = I.R * Math.min(1, I.t / I.max), a = Math.max(0, 1 - Math.max(0, I.t - I.max) / 0.2);
    g.save(); g.globalCompositeOperation = "lighter";
    for (let k = 0; k < 3; k++) { g.strokeStyle = k === 0 ? `rgba(255,110,40,${0.55 * a})` : k === 1 ? `rgba(255,190,80,${0.6 * a})` : `rgba(255,245,200,${0.7 * a})`; g.lineWidth = [14, 7, 2][k]; g.beginPath(); g.ellipse(I.x, I.y, Math.max(1, rr - k * 3), Math.max(1, (rr - k * 3) * 0.6), 0, 0, Math.PI * 2); g.stroke(); }
    g.restore(); }
  const S = W0.starUp;
  if (S) { const q = 1 - S.t / S.max; g.save(); // 墜星箭：天色變暗、天上聚星
    g.globalAlpha = 0.3 * q; g.fillStyle = "#0a1030"; g.fillRect(cam.x - 700, cam.y - 450, 1400, 900); g.globalAlpha = 1; g.globalCompositeOperation = "lighter";
    const cx = W0.x, cy = W0.y - 90; glow(cx, cy, 20 + q * 40, "150,190,255", 0.25 + q * 0.35);
    for (let i = 0; i < 8; i++) { const a = T * 2 + i * 0.785, r = 30 * (1 - q) + 6; g.fillStyle = "rgba(220,235,255,0.9)"; g.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.5, 2, 2); }
    g.restore(); }
  const E = W0.emBall;
  if (E) { const q = 1 - E.t / E.max, rr = 8 + q * E.r * 0.35; g.save(); g.globalCompositeOperation = "lighter"; glow(W0.x, W0.y - 6, rr * 1.6, "150,180,255", 0.6);
    g.strokeStyle = "rgba(220,235,255,0.9)"; g.lineWidth = 1.2; for (let i = 0; i < 6; i++) { const a0 = T * 9 + i; g.beginPath(); g.arc(W0.x, W0.y - 6, rr * (0.6 + 0.4 * Math.sin(T * 30 + i)), a0, a0 + 1.2); g.stroke(); }
    g.fillStyle = "rgba(235,245,255,0.9)"; g.beginPath(); g.arc(W0.x, W0.y - 6, rr * 0.35, 0, Math.PI * 2); g.fill(); g.restore(); }
  for (const o of W0.bkFx || []) {
    const q = o.t / o.max; g.save(); g.translate(o.x, o.y - 3); g.rotate(o.a); g.globalCompositeOperation = "lighter";
    if (o.cross) { // 十字火焰
      for (let k = 0; k < 2; k++) { g.rotate(k * Math.PI / 2); const gr = g.createLinearGradient(-o.L, 0, o.L, 0); gr.addColorStop(0, "rgba(255,90,30,0)"); gr.addColorStop(0.5, `rgba(255,200,90,${0.9 * q})`); gr.addColorStop(1, "rgba(255,90,30,0)"); g.fillStyle = gr; g.fillRect(-o.L, -5 * q - 2, o.L * 2, 10 * q + 4); }
    } else { // 金色巨劍
      const L = o.L, w = 9; g.globalAlpha = Math.min(1, q * 2);
      glow(L * 0.5, 0, L * 0.5, "255,210,100", 0.35 * q);
      g.fillStyle = "rgba(255,230,140,0.95)"; g.beginPath(); g.moveTo(L + 6, 0); g.lineTo(8, -w); g.lineTo(8, w); g.closePath(); g.fill();
      g.fillStyle = "rgba(255,255,230,0.95)"; g.fillRect(8, -1.5, L - 6, 3);
      g.fillStyle = "rgba(255,190,60,0.95)"; g.fillRect(2, -w - 4, 5, (w + 4) * 2);
    }
    g.restore();
  }
  for (const o of W0.zaps || []) { // 雷鏈電弧
    g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = `rgba(200,225,255,${o.t / 0.22})`; g.lineWidth = 2; g.beginPath(); g.moveTo(o.x1, o.y1 - 4);
    const n = 6; for (let i = 1; i < n; i++) { const t = i / n; g.lineTo(o.x1 + (o.x2 - o.x1) * t + rand(-5, 5), o.y1 + (o.y2 - o.y1) * t - 4 + rand(-5, 5)); } g.lineTo(o.x2, o.y2 - 4); g.stroke(); g.restore();
  }
}
const _drawFxOver68 = drawFxOver;
drawFxOver = function () { // eslint-disable-line no-func-assign
  if (W0 && state === "world") try { sk68Draw(); } catch (e) {}
  return _drawFxOver68.apply(this, arguments);
};
