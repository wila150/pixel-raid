// 萬劍仙途 — 企劃 68 第三包：拳套＋扇＋身法＋護身法術照使用者的敘述改
// world.js／enew.js／sanda.js／build.js 改招式本身；這裡放共用小工具（浮空、碎甲、特效）、每幀狀態（氣功炮、風陣、花雨、清風、疾風層數、血霧吸血）、畫面。
// sanda.js 後載入（包 dotTick／drawWMob／hitMob／hurtW／updateWorld／drawFxOver 最外層）。
"use strict";

// 浮空：一般怪 t 秒不能動、不出招（受傷照算），畫面往上飄；王不浮空，只停 0.3 秒出招
function sk68Air(m, t, h) {
  if (!m || m.dead) return;
  if (m.boss) { if (typeof sk68Stun === "function") sk68Stun(m, 0.3); return; }
  if (!(m.airT > 0) || m.airT < t) { m.airT = t; m.airMax = t; m.airH = h || 24; }
  m.wind = 0; m.mv = null; m.dv = null;
}
function fx3(o) { (W0.fx3s = W0.fx3s || []).push(o); }

const _dotTick683 = dotTick;
dotTick = function (m, dt) { // eslint-disable-line no-func-assign
  if (m.airT > 0) { m.airT -= dt; m.kb = 0; _dotTick683.apply(this, arguments); return true; }
  return _dotTick683.apply(this, arguments);
};
const _drawWMob683 = drawWMob;
drawWMob = function (m) { // eslint-disable-line no-func-assign
  if (!(m.airT > 0)) return _drawWMob683.apply(this, arguments);
  const q = 1 - m.airT / (m.airMax || 1), h = Math.sin(Math.min(1, q) * Math.PI) * (m.airH || 24), r = (WMOBS[m.type] && WMOBS[m.type].r) || 8;
  ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.beginPath(); ctx.ellipse(m.x, m.y + r * 0.6, r * (1 - h / 120), r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(0, -h); try { return _drawWMob683.apply(this, arguments); } finally { ctx.restore(); }
};
// 升龍碎甲：受到的傷害 +20%（王 +10%）
const _hitMob683 = hitMob;
hitMob = function (m, dmg) { // eslint-disable-line no-func-assign
  if (m && m.shredT > 0 && dmg > 0) arguments[1] = dmg * (m.boss ? 1.1 : 1.2);
  return _hitMob683.apply(this, arguments);
};
// 金鐘罩：期間受到的近戰傷害 100% 反彈給打你的怪
const _hurtW683 = hurtW;
hurtW = function (dmg, from, kind) { // eslint-disable-line no-func-assign
  const p = W0, G = p && p.guardT2 > 0 && W0.gbell;
  const can = G && from && from.type && WMOBS[from.type] && !from.dead && from.hp !== undefined && (kind || "phys") === "phys" && !(p.iframe > 0) && !(p.invT > 0) && !(p.mistT > 0) && !(p.shield > 0);
  const hp0 = p ? p.hp : 0;
  const r = _hurtW683.apply(this, arguments);
  if (p && p.wu && p.hp < hp0 && !(W0.titanT > 0) && !(W0.gbell && p.guardT2 > 0)) wuBreak(p); // 企劃 70 C：前搖被打中扣到血
  if (can && !from.dead) {
    const s0 = CUR_SL, d0 = CUR_DM; CUR_SL = G.sl || "e"; CUR_DM = G.dm || 1;
    try { hitMob(from, dmg, 60, p, true); } finally { CUR_SL = s0; CUR_DM = d0; }
    if (!(from.rflT > time)) { from.rflT = time + 0.6; floatText(from.x, from.y - 26, "反彈", "#ffd878"); }
    W0.rings.push({ x: from.x, y: from.y, t: 0, max: 0.25, r: 14, c: "255,215,120" });
  }
  return r;
};

// 企劃 70 C：打斷前搖：延遲的傷害取消、冷卻只算 1 秒、再扣這招真氣 50%
function wuBreak(p) {
  const U = p.wu; p.wu = null; (W0.wuDead = W0.wuDead || new Set()).add(U.tok);
  W0.fires = W0.fires.filter((f) => f.wu !== U.tok);
  if (U.k === "cold") W0.grayT = 0; if (U.k === "tstorm") W0.emBall = null; if (U.k === "nova") W0.novaP = null;
  if (p.cds[U.key] > 1) p.cds[U.key] = 1;
  const c = Math.round(U.mp * 0.5); if (c > 0) { if (p.mp < c) { p.mp = 0; mpDry(p); } else mpPay(p, c); }
  popWord(p, "被打斷", "#ff9a7a"); burst(p.x, p.y + 4, "#ffe0a0", 16, 110, 0.4); sfx("bad");
  if (typeof seenHint === "function") seenHint("wubreak", "大招蓄力的時候被打到會被打斷（冷卻只算 1 秒，但會多扣真氣）。先閃開、開霸體或金鐘罩再放。");
}
// ───────── 每幀 ─────────
const _updateWorld683 = updateWorld;
updateWorld = function (dt) { // eslint-disable-line no-func-assign
  const r = _updateWorld683.apply(this, arguments);
  if (!W0 || !(dt > 0) || state !== "world") return r;
  const p = W0;
  for (const m of W0.mobs) if (m.shredT > 0) m.shredT -= dt;
  if (p.wu && (p.wu.t -= dt) <= 0) p.wu = null; // 企劃 70 C 前搖
  if (W0.breezeT > 0) { W0.breezeT -= dt; if (Math.random() < 0.4) { const a = rand(0, 6.28); particles.push({ x: p.x + Math.cos(a) * 12, y: p.y - 2 + Math.sin(a) * 6, vx: -Math.sin(a) * 40, vy: Math.cos(a) * 20 - 10, life: 0.4, max: 0.4, color: "#bfffd0", size: 1.5 }); } }
  if (W0.gustN > 0 && !(W0.gustT > time)) W0.gustN = 0;
  // 氣功炮：衝擊波往前推，經過的怪全部打到
  if (W0.gongs && W0.gongs.length) {
    for (const G of W0.gongs) {
      const d0 = G.d; G.d += G.v * dt; const ca = Math.cos(G.a), sa = Math.sin(G.a);
      const s0 = CUR_SL, m0 = CUR_DM; CUR_SL = G.sl; CUR_DM = G.dm || 1;
      try { for (const m of W0.mobs) { if (m.dead || G.hit.has(m)) continue; const dx = m.x - G.x, dy = m.y - G.y, u = dx * ca + dy * sa, v = Math.abs(-dx * sa + dy * ca), rr = WMOBS[m.type].r; if (u > d0 - 20 - rr && u < G.d + rr && v < G.w + rr) { G.hit.add(m); HS_HEAVY = true; hitMob(m, wDmg(GONG_D), 140, G, true); HS_HEAVY = false; } } }
      finally { CUR_SL = s0; CUR_DM = m0; }
      if (Math.random() < 0.9) for (let i = 0; i < 3; i++) { const o = rand(-G.w, G.w); particles.push({ x: G.x + ca * G.d - sa * o, y: G.y + sa * G.d + ca * o, vx: ca * 60 + rand(-20, 20), vy: sa * 60 + rand(-20, 20), life: 0.3, max: 0.3, color: i % 2 ? "#ffffff" : "#a8d8ff", size: 2 }); }
    }
    W0.gongs = W0.gongs.filter((G) => G.d < G.L);
  }
  // 風陣：圈裡的怪變慢、往中間拉（精英一半、王不拉）
  const Wd = W0.fWard;
  if (Wd) {
    Wd.t -= dt; if (Wd.t <= 0) W0.fWard = null;
    else for (const m of W0.mobs) { if (m.dead || m.boss) continue; const d = dist(m, Wd); if (d > Wd.R * 1.6 + WMOBS[m.type].r) continue; m.slowT = Math.max(m.slowT || 0, 0.3); if (d > Wd.R * 0.5) { const a = angTo(m, Wd), f = (m.elite ? 25 : 50) * dt; moveBody(m, Math.cos(a) * f, Math.sin(a) * f, WMOBS[m.type].r); } }
  }
  // 花雨：每 0.5 秒打畫面裡全部的怪，每秒回 2% 生命
  const Bm = W0.bloomR;
  if (Bm) {
    Bm.t -= dt; Bm.tick -= dt;
    if (Bm.tick <= 0) { Bm.tick = 0.5; const s0 = CUR_SL, m0 = CUR_DM; CUR_SL = Bm.sl; CUR_DM = Bm.dm || 1; DOT_HIT = true;
      try { for (const m of W0.mobs) if (!m.dead && !m.noTarget && dist(m, p) < 220 + WMOBS[m.type].r) { hitMob(m, wDmg(BLOOM_D), 0, p, true); if (!m.dead && Math.random() < 0.3) particles.push({ x: m.x, y: m.y - 6, vx: rand(-20, 20), vy: -20, life: 0.4, max: 0.4, color: "#9ad86a", size: 2 }); } }
      finally { DOT_HIT = false; CUR_SL = s0; CUR_DM = m0; } }
    if (p.hp < p.maxHp) { Bm.acc = (Bm.acc || 0) + p.maxHp * 0.02 * dt * (typeof brkMul === "function" ? brkMul() : 1); if (Bm.acc >= 1) { const h = Math.min(Math.floor(Bm.acc), p.maxHp - p.hp); p.hp += h; Bm.acc -= Math.floor(Bm.acc); Bm.shown = (Bm.shown || 0) + h; } }
    if ((Bm.hT -= dt) <= 0) { Bm.hT = 1; if (Bm.shown) floatText(p.x, p.y - 16, `+${Bm.shown}`, "#7dff8a"); Bm.shown = 0; }
    for (let i = 0; i < 4; i++) particles.push({ x: p.x + rand(-220, 220), y: p.y + rand(-150, 90), vx: rand(-25, 10), vy: rand(30, 60), life: 0.9, max: 0.9, color: Math.random() < 0.5 ? "#ffc0d8" : "#fff0f6", size: 2 });
    if (Bm.t <= 0) W0.bloomR = null;
  }
  // 血霧無敵：穿過怪的身體，每秒吸那隻怪最大生命 5%（王 0.5%）
  if (p.bmT > 0) {
    p.bmT -= dt; if (!(p.invT > 0)) p.bmT = 0;
    for (const m of W0.mobs) {
      if (m.dead || m.noTarget || dist(m, p) > WMOBS[m.type].r + 8) continue;
      const a = m.max * (m.boss ? 0.005 : 0.05) * dt; m.hp -= a; m.flash = 0.05;
      p.bmAcc = (p.bmAcc || 0) + a; if (Math.random() < 0.5) particles.push({ x: m.x + rand(-4, 4), y: m.y - 4, vx: (p.x - m.x) * 3, vy: (p.y - m.y) * 3, life: 0.3, max: 0.3, color: "#ff3a4a", size: 2 });
      if (m.hp <= 0) killMob(m);
    }
    if ((p.bmShow = (p.bmShow || 0) - dt) <= 0) { p.bmShow = 0.5; if (p.bmAcc >= 1) { const h = Math.min(Math.floor(p.bmAcc), p.maxHp - p.hp); if (h > 0) { p.hp += h; floatText(p.x, p.y - 16, `+${h}`, "#ff8a9a"); } } p.bmAcc = 0; }
  }
  // 化龍上升特效
  if (W0.dragUp) { const D = W0.dragUp; D.t -= dt; for (let i = 0; i < 4; i++) { const a = rand(0, 6.28), rr = rand(0, D.r); particles.push({ x: D.x + Math.cos(a) * rr, y: D.y + Math.sin(a) * rr * 0.6, vx: rand(-15, 15), vy: -rand(80, 160), life: 0.5, max: 0.5, color: i % 2 ? "#ff8a2e" : "#ffd84a", size: 2 }); } if (D.t <= 0) W0.dragUp = null; }
  if (W0.fx3s && W0.fx3s.length) { for (const o of W0.fx3s) o.t -= dt; W0.fx3s = W0.fx3s.filter((o) => o.t > 0); }
  return r;
};

// ───────── 畫面 ─────────
function sk683Draw() {
  const g = ctx, T = typeof time !== "undefined" ? time : 0;
  if (W0.wu) { const U = W0.wu, q = 1 - U.t / U.max, c = `rgb(255,${Math.round(255 - 40 * q)},${Math.round(255 - 175 * q)})`; g.save(); g.strokeStyle = "rgba(0,0,0,0.45)"; g.lineWidth = 4; g.beginPath(); g.ellipse(W0.x, W0.y + 5, 14, 6, 0, 0, Math.PI * 2); g.stroke(); g.strokeStyle = c; g.lineWidth = 2.5; g.beginPath(); g.ellipse(W0.x, W0.y + 5, 14, 6, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * q); g.stroke(); g.restore(); } // 企劃 70 C：腳下蓄力圈（白→金）
  for (const G of W0.gongs || []) { // 氣功炮：藍白巨型衝擊波（弧形波面＋拖尾）
    const ca = Math.cos(G.a), sa = Math.sin(G.a), fx = G.x + ca * G.d, fy = G.y + sa * G.d, A = Math.min(1, (G.L - G.d) / 80);
    g.save(); g.globalCompositeOperation = "lighter"; g.translate(fx, fy); g.rotate(G.a);
    const gr = g.createLinearGradient(-90, 0, 10, 0); gr.addColorStop(0, "rgba(120,180,255,0)"); gr.addColorStop(1, `rgba(170,215,255,${0.45 * A})`);
    g.fillStyle = gr; g.beginPath(); g.moveTo(-90, -G.w); g.lineTo(0, -G.w); g.quadraticCurveTo(22, 0, 0, G.w); g.lineTo(-90, G.w); g.closePath(); g.fill();
    for (let i = 0; i < 3; i++) { g.strokeStyle = `rgba(${i ? "200,230,255" : "255,255,255"},${(0.9 - i * 0.25) * A})`; g.lineWidth = 4 - i; g.beginPath(); g.moveTo(-i * 8, -G.w); g.quadraticCurveTo(22 - i * 8, 0, -i * 8, G.w); g.stroke(); }
    g.restore();
  }
  for (const o of W0.fx3s || []) {
    const q = 1 - o.t / o.max;
    if (o.k === "lean") { // 鐵山靠：往前一整排的衝撞波
      g.save(); g.globalCompositeOperation = "lighter"; g.translate(o.x, o.y - 2); g.rotate(o.a);
      g.fillStyle = `rgba(255,210,140,${0.35 * (1 - q)})`; g.fillRect(0, -14, o.L * Math.min(1, q * 2.5), 28);
      g.strokeStyle = `rgba(255,235,190,${0.9 * (1 - q)})`; g.lineWidth = 3; g.beginPath(); const x = o.L * Math.min(1, q * 2.5); g.moveTo(x, -16); g.quadraticCurveTo(x + 8, 0, x, 16); g.stroke(); g.restore();
    } else if (o.k === "sonic") { // 震天：音爆，扇形一圈圈往外
      g.save(); g.globalCompositeOperation = "lighter";
      for (let i = 0; i < 3; i++) { const rr = o.L * Math.min(1, q * 1.4 + i * 0.12); g.strokeStyle = `rgba(255,240,210,${(0.8 - i * 0.2) * (1 - q)})`; g.lineWidth = 3 - i; g.beginPath(); g.arc(o.x, o.y - 2, rr, o.a - 0.9, o.a + 0.9); g.stroke(); }
      g.restore();
    } else if (o.k === "upper") { // 升龍：往上衝的金色光柱
      g.save(); g.globalCompositeOperation = "lighter"; const h = 60 * Math.min(1, q * 3);
      const gr = g.createLinearGradient(0, o.y, 0, o.y - h); gr.addColorStop(0, `rgba(255,220,140,${0.7 * (1 - q)})`); gr.addColorStop(1, "rgba(255,220,140,0)");
      g.fillStyle = gr; g.fillRect(o.x - 7, o.y - h, 14, h); g.restore();
    }
  }
  if (W0.dragUp) { // 化龍：金色火龍盤旋往上
    const D = W0.dragUp, q = 1 - D.t / D.max; g.save(); g.globalCompositeOperation = "lighter"; g.lineCap = "round";
    for (let k = 0; k < 2; k++) { g.strokeStyle = k ? `rgba(255,240,170,${0.9 * (1 - q)})` : `rgba(255,140,40,${0.7 * (1 - q)})`; g.lineWidth = k ? 3 : 8; g.beginPath();
      for (let i = 0; i <= 24; i++) { const t = i / 24, y = D.y - t * 120 * Math.min(1, q * 2), x = D.x + Math.sin(t * 9 + T * 10) * 16 * (1 - t * 0.5); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
    g.restore();
  }
  for (const t of W0.tornados) if (t.pur && !(t.ghost && allyA() < 0.5)) { // 風雷：龍捲風中間的紫色閃電
    g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = `rgba(200,140,255,${0.6 + 0.4 * Math.random()})`; g.lineWidth = 1.5;
    for (let k = 0; k < 2; k++) { g.beginPath(); let x = t.x + rand(-4, 4), y = t.y - 2; g.moveTo(x, y); for (let i = 0; i < 4; i++) { x += rand(-6, 6); y -= rand(4, 7); g.lineTo(x, y); } g.stroke(); }
    g.restore();
  }
  if (W0.fWard) { const Wd = W0.fWard; g.save(); g.strokeStyle = `rgba(190,255,220,${0.25 + 0.15 * Math.sin(T * 6)})`; g.setLineDash([4, 4]); g.lineDashOffset = -T * 20; g.lineWidth = 1.2; g.beginPath(); g.ellipse(Wd.x, Wd.y, Wd.R, Wd.R * 0.7, 0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); g.restore(); }
  if (W0.mistT > 0) { g.save(); g.globalAlpha = 0.5; g.fillStyle = "#f4fbf8"; g.beginPath(); g.ellipse(W0.x, W0.y - 4, 13 + Math.sin(T * 5) * 2, 10, 0, 0, Math.PI * 2); g.fill(); g.restore(); } // 化身霧氣：白色霧團
  if (W0.bmT > 0) { g.save(); g.globalAlpha = 0.4; g.fillStyle = "#c01828"; g.beginPath(); g.ellipse(W0.x, W0.y - 4, 13 + Math.sin(T * 5) * 2, 10, 0, 0, Math.PI * 2); g.fill(); g.restore(); } // 血霧
}
const _drawFxOver683 = drawFxOver;
drawFxOver = function () { // eslint-disable-line no-func-assign
  if (W0 && state === "world") try { sk683Draw(); } catch (e) {}
  return _drawFxOver683.apply(this, arguments);
};
