// 萬劍仙途 — 企劃 55 拳套「散打流」（總表第 43 項）：散手（普攻）、摔投（Q）、勢
// 勢：只有普攻選「散手」時有。散手打完一套＋1（每 2 秒最多 1 次）、Q 打中＋1、閃身／身法＋2（每秒最多 1 次）；最多 5 層，3 秒沒打中掉 1 層
// 滿 5 層：下一個 Q 或 E 是終結技（傷害 ×1.6、範圍 ×1.3，world.js slotCast），飄「散打・終」，勢歸 0
"use strict";
const SHI_MAX = 5;
// 散手 4 段：[距離, 半角, 傷害, 擊退]（world.js atkFx）
const SS_SEG = [null, [22, 0.7, 4.2, 30], [26, 1.3, 4.6, 40], [30, Math.PI, 4.0, 20], [36, 0.6, 9.5, 220]]; // v9.9.1 企劃 55 §8：放大（掃腿整圈）
const shiOn = () => !!(typeof W0 !== "undefined" && W0 && save.w && curWeapon() === "fist" && typeof triOf === "function" && triOf("fist", "a") === "sanshou");
function shiAdd(n, why) {
  if (!shiOn()) return;
  if (why === "set") { if (time - (W0.shiSetT || -99) < 2) return; W0.shiSetT = time; } // v9.9.1：打完一套 +1 每 2 秒最多 1 次
  const p = W0, was = p.shi || 0; p.shi = Math.min(SHI_MAX, was + n); p.shiIdle = 0;
  if (p.shi >= SHI_MAX && was < SHI_MAX) { floatText(p.x, p.y - 22, "勢滿", "#ffd84a"); W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.3, r: 18, c: "255,215,110" }); }
}
// slotCast 手動放 Q／E 時呼叫：勢滿＝終結技（回傳 true）；不是終結的 Q 先記著，打中時＋1
function shiFin(sl) {
  if (!shiOn()) return false;
  const p = W0;
  if ((p.shi || 0) >= SHI_MAX) {
    p.shi = 0; p.shiQ = 0; p.shiFinN = (p.shiFinN || 0) + 1;
    floatText(p.x, p.y - 28, "散打・終", "#ffd84a", true);
    W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.45, r: 64, c: "255,215,110" });
    burst(p.x, p.y, "#ffd84a", 26, 150, 0.6); flashT = Math.max(flashT, 0.12); flashColor = "255,215,110"; shake = Math.max(shake, 6); sfx("crit");
    return true;
  }
  if (sl === "q") p.shiQ = 1.5; // 衝刺、摔落地比較晚才打到：1.5 秒內第一下打中算
  return false;
}
// 摔投（world.js doSpin 呼叫；CUR_SL／CUR_DM 由 cast 設好）
function ssThrow(p, AM, afterAt) {
  let tg = null, bd = 50;
  for (const m of W0.mobs) { if (m.dead || m.noTarget || m.air) continue; const d = dist(m, p) - WMOBS[m.type].r; if (d < bd) { bd = d; tg = m; } }
  if (tg) p.face = angTo(p, tg);
  const cs = Math.cos(p.face), sn = Math.sin(p.face);
  if (!tg) { // 前面沒怪：原地重踏
    const r = 30 * AM(); afterAt(p.x, p.y, r, 15);
    for (const m of W0.mobs) if (!m.dead && dist(m, p) < r + WMOBS[m.type].r) hitMob(m, wDmg(15), 60, p, true);
    W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.25, r, c: "230,200,150" }); fxBoom(p.x, p.y, r, "230,200,150"); sfx("break"); shake = Math.max(shake, 3);
    p.ssK = 0; return;
  }
  if (tg.boss) { // 王：鞭腿，王受傷 +10% 2 秒（跟破甲不疊）
    hitMob(tg, wDmg(45), 0, p, true); tg.whipU = time + 2;
    floatText(tg.x, tg.y - 30, "鞭腿", "#ffd08a"); p.ssK = 5; p.ssKT = time; p.swing = p.swingMax = 0.2; p.swingR = 26; sfx("break"); shake = Math.max(shake, 4); return;
  }
  if (tg.elite || WMOBS[tg.type].ai === "pillar") { // 精英：過肩頂＋擊退
    hitMob(tg, wDmg(40), 0, p, true); if (WMOBS[tg.type].ai !== "pillar") { tg.kb = 160; tg.ka = angTo(p, tg); }
    floatText(tg.x, tg.y - 22, "過肩頂", "#ffd08a"); p.ssK = 4; p.ssKT = time; p.swing = p.swingMax = 0.16; p.swingR = 24; sfx("break"); shake = Math.max(shake, 3); return;
  }
  // 小怪：抓起來往身後摔
  const end = { x: p.x, y: p.y }; moveBody(end, -cs * 24, -sn * 24, WMOBS[tg.type].r);
  tg.air = true; tg.ssAir = 1;
  W0.ssThr = { m: tg, x0: tg.x, y0: tg.y, x1: end.x, y1: end.y, t: 0, max: 0.24, r: 35 * AM(), sl: CUR_SL, dm: CUR_DM };
  p.ssK = 0; sfx("dash");
}
function ssLand(T) {
  const m = T.m; m.air = false; m.ssAir = 0; m.x = T.x1; m.y = T.y1;
  if (m.dead) return;
  const s0 = CUR_SL, d0 = CUR_DM; CUR_SL = T.sl; CUR_DM = T.dm;
  try {
    const at = { x: T.x1, y: T.y1 }, l = gemLv("after", T.sl); if (l) W0.fires.push({ x: at.x, y: at.y, t: 0.5, r: T.r, dmg: 30 * (0.4 + (l - 1) * 0.075), c: "#e0b080", isAf: 1, sl: T.sl, dm: T.dm });
    for (const o of W0.mobs) if (!o.dead && dist(o, at) < T.r + WMOBS[o.type].r) { hitMob(o, wDmg(o === m ? 50 : 30), o === m ? 0 : 70, at, true); if (!o.boss && !o.elite) o.ssStun = Math.max(o.ssStun || 0, 0.8); }
  } finally { CUR_SL = s0; CUR_DM = d0; }
  W0.rings.push({ x: T.x1, y: T.y1, t: 0, max: 0.3, r: T.r, c: "230,200,150" }); fxBoom(T.x1, T.y1, T.r, "230,200,150"); burst(T.x1, T.y1, "#d8c0a0", 16, 110, 0.5);
  sfx("break"); shake = Math.max(shake, 5);
}
// 命中：鞭腿易傷、勢的計時／Q 打中＋1
const _hitMobSs = hitMob;
hitMob = function (m, dmg) { // eslint-disable-line no-func-assign
  if (m && !m.dead && !m.air && typeof W0 !== "undefined" && W0) {
    if (m.whipU > time && !(m.armBrk > 0)) arguments[1] = dmg * 1.1;
    if (shiOn()) { W0.shiIdle = 0; if (CUR_SL === "q" && W0.shiQ > 0) { W0.shiQ = 0; shiAdd(1); } }
  }
  return _hitMobSs.apply(this, arguments);
};
const _skillUsedSs = skillUsed;
skillUsed = function (k) { // eslint-disable-line no-func-assign
  if (k === "roll" && shiOn() && time - (W0.shiRollT || -99) >= 1) { W0.shiRollT = time; shiAdd(2); } // v9.9.1：閃身 +2
  return _skillUsedSs.apply(this, arguments);
};
const _updateWorldSs = updateWorld;
updateWorld = function (dt) { // eslint-disable-line no-func-assign
  const r = _updateWorldSs.apply(this, arguments);
  if (typeof W0 === "undefined" || !W0) return r;
  const p = W0;
  if (!shiOn()) { p.shi = 0; p.shiQ = 0; }
  else {
    if (p.shiQ > 0) p.shiQ -= dt;
    p.shiIdle = (p.shiIdle || 0) + dt;
    if (p.shi > 0 && p.shiIdle >= 3) { p.shi--; p.shiIdle = 0; }
  }
  const T = p.ssThr;
  if (T) {
    T.t += dt; const q = Math.min(1, T.t / T.max), m = T.m;
    if (m.dead) { m.air = false; p.ssThr = null; }
    else if (q >= 1) { p.ssThr = null; ssLand(T); }
    else { m.x = T.x0 + (T.x1 - T.x0) * q; m.y = T.y0 + (T.y1 - T.y0) * q - Math.sin(q * Math.PI) * 26; m.kb = 0; }
  }
  return r;
};
// 被摔的怪暈 0.8 秒（不能動、不出手）
const _dotTickSs = dotTick;
dotTick = function (m, dt) { // eslint-disable-line no-func-assign
  if (_dotTickSs.apply(this, arguments)) return true;
  if (m.ssAir) return true;
  if (m.ssStun > 0 && !m.boss) { m.ssStun -= dt; if (Math.random() < 0.25) burst(m.x, m.y - WMOBS[m.type].r - 6, "#ffe9a0", 1, 25, 0.4); return true; }
  return false;
};
// 連段發光：散手第 4 段（側踹）、勢滿（Q）
const _comboGlowSs = comboGlow;
comboGlow = function () { // eslint-disable-line no-func-assign
  const g = _comboGlowSs.apply(this, arguments);
  if (shiOn()) {
    if ((W0.ssN || 0) === 3 && time - (W0.ssT || -99) <= 2) g.attack = true;
    if ((W0.shi || 0) >= SHI_MAX) g.spin = true;
  }
  return g;
};
// 刀光：直拳（窄短）、勾拳（寬弧）、掃腿（腳邊低矮半圈）、側踹（一道直線）、鞭腿（大弧）
const _drawSlashSs = drawSlash;
drawSlash = function (p, wt) { // eslint-disable-line no-func-assign
  if (!(wt === "fist" && p === W0 && p.swing > 0 && p.ssK && time - (p.ssKT || -99) < (p.swingMax || 0.1) + 0.05)) return _drawSlashSs.apply(this, arguments);
  const max = p.swingMax || 0.1, q = Math.min(1, 1 - p.swing / max), k = p.ssK, F = p.face, fin = (p.shi || 0) >= SHI_MAX;
  const col = k === 4 || k === 5 || fin ? "255,215,110" : "255,200,150", A = 1 - q * 0.8;
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
  const arc = (cx, cy, R, a0, a1, w, sy) => { ctx.save(); ctx.translate(cx, cy); ctx.scale(1, sy || 1); for (let i = 0; i < 3; i++) { ctx.strokeStyle = `rgba(${col},${(i === 2 ? 1 : i === 1 ? 0.6 : 0.25) * A})`; ctx.lineWidth = i === 0 ? w : i === 1 ? w * 0.55 : 1.5; ctx.beginPath(); ctx.arc(0, 0, R, a0, a1); ctx.stroke(); } ctx.restore(); };
  if (k === 1) { // 直拳：短直線＋拳頭衝擊點
    const d = 6 + q * 12, x = p.x + Math.cos(F) * d, y = p.y - 2 + Math.sin(F) * d;
    ctx.strokeStyle = `rgba(${col},${0.7 * A})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(F) * 4, p.y - 2 + Math.sin(F) * 4); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = `rgba(${col},${A})`; ctx.beginPath(); ctx.arc(x, y, 3 + q * 2, 0, Math.PI * 2); ctx.fill();
  } else if (k === 2) { // 勾拳：寬弧，從外側勾進來
    const h = 1.0, a1 = F + h - h * 2 * Math.min(1, q * 1.6 + 0.15); arc(p.x, p.y - 2, 16, a1, F + h, 5);
  } else if (k === 3) { // 掃腿：腳邊壓扁的半圈
    const h = Math.PI / 2, a1 = F - h + h * 2 * Math.min(1, q * 1.5 + 0.15); arc(p.x, p.y + 5, p.swingR || 26, Math.max(F - h, a1 - 1.6), a1, 6, 0.45);
  } else if (k === 4) { // 側踹：一道又粗又直的踢擊
    const L = (p.swingR || 30) * Math.min(1, q * 2 + 0.2), x = p.x + Math.cos(F) * L, y = p.y + 1 + Math.sin(F) * L;
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = `rgba(${col},${(i === 2 ? 1 : i === 1 ? 0.6 : 0.25) * A})`; ctx.lineWidth = i === 0 ? 10 : i === 1 ? 5 : 1.5; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(F) * 4, p.y + 1 + Math.sin(F) * 4); ctx.lineTo(x, y); ctx.stroke(); }
    ctx.fillStyle = `rgba(255,240,200,${A})`; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  } else { // 鞭腿：高處大弧
    const h = 1.3, a1 = F - h + h * 2 * Math.min(1, q * 1.6 + 0.15); arc(p.x, p.y - 4, p.swingR || 26, Math.max(F - h, a1 - 1.8), a1, 8);
  }
  ctx.restore();
};
// 勢：血球上方 5 個點（破體字的上面）
const _drawOrbsSs = drawOrbs;
drawOrbs = function () { // eslint-disable-line no-func-assign
  _drawOrbsSs.apply(this, arguments);
  if (!shiOn()) return;
  const R = clamp(Math.min(W, H) * 0.11, 34, 56), hx = SAFE.l + R + 14, hy = H - R - 18, y = hy - R - (B.maxEs > 0 ? 22 : 9) - (W0.brk > 0 ? 13 : 0) - 4, n = W0.shi || 0, full = n >= SHI_MAX;
  for (let i = 0; i < SHI_MAX; i++) {
    const x = hx - 20 + i * 10;
    ctx.fillStyle = "rgba(10,8,6,0.85)"; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    if (i < n) { ctx.fillStyle = full ? `rgba(255,${200 + 40 * Math.sin(time * 10)},90,1)` : "#ffb347"; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.strokeStyle = "rgba(255,180,90,0.5)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.stroke(); }
  }
  if (full) { ctx.font = "bold 8px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(20,10,0,0.9)"; ctx.strokeText("Q／E 收勢", hx, y - 8); ctx.fillStyle = "#ffd84a"; ctx.fillText("Q／E 收勢", hx, y - 8); }
};
STATUS.push({ k: "shi", g: "勢", c: "#ffb347", on: (p) => shiOn() && p.shi > 0, txt: (p) => `${p.shi}` });
