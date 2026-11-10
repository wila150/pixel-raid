// 萬劍仙途 — E 招去重複（總表第 33 項，企劃 43）：換掉 9 招撞玩法的
// world.js eAltFx 開頭呼叫 eNewFx(k, ctx)；這裡處理招式本身、每幀狀態、畫面、舊存檔搬家。
// asc.js 後、unstuck.js 前載入（包 hitMob／hurtW／updateWorld／jobStats／skillUsed／drawFxOver 最外層）。
"use strict";

// ───────── 1. 招式表：同一個位置換新招（開放等級照舊）─────────
const E_SWAP = { // 舊 → 新
  bow: { pierce9: "trap" }, blade: { rift: "roar", fury: "tthrow" }, staff: { freeze: "curse", blizz: "tslow" },
  fist: { palm: "gbell", hund: "grab" }, fan: { healz: "crane", zephyr: "stealth" },
};
const E_NEW = {
  trap: ["連環雷陷阱", "往前丟 3 個雷陷阱，怪踩到就爆炸並感電；8 秒沒人踩自己爆（陷阱、範圍）"],
  roar: ["戰吼", "身邊 90 內的怪 5 秒受到傷害 +20%，而且會衝向你；打斷正在蓄力的招；你護甲 +50%（詛咒、增益）"],
  tthrow: ["飛刀迴旋", "把刀丟出去再飛回來，去回各打一次（大刀唯一的遠程招）"],
  curse: ["詛咒・脆弱", "身邊擴散紫黑詛咒波，不造成傷害；被波及的怪 4 秒受到的物理與元素傷害加倍（王 ×1.5），頭上紫色印記（詛咒）"],
  tslow: ["時緩", "目標一帶召喚巨大半透明時鐘領域 4 秒：裡面的怪動作、移動和敵方子彈慢 80%（王 40%）（控場）"],
  gbell: ["金鐘罩", "吸收 30% 生命的護罩 4 秒；被打破時炸開，震退四周（防禦）"],
  grab: ["擒拿", "抓住最近的怪拉到面前摔在地上：大傷害＋暈 1.5 秒（王 0.5 秒、不拉）（爆發單體）"],
  crane: ["紙鶴", "放出 3 隻紙鶴 8 秒，自己飛去找怪啄（召喚）"],
  stealth: ["風遁", "隱身 3 秒：怪找不到你、移速 +30%；隱身中下一招傷害 ×2；進入和現身各炸一圈風（位移）"],
};
const E_NEW_TAG = { trap: "pa", roar: "ab", tthrow: "pm", curse: "ab", tslow: "ab", gbell: "ab", grab: "m", crane: "pd", stealth: "vb" };
for (const wt in E_SWAP) for (const o in E_SWAP[wt]) {
  const nk = E_SWAP[wt][o], L = TRI_E[wt], i = L.findIndex((x) => x.k === o);
  if (i >= 0) L[i] = { k: nk, n: E_NEW[nk][0], d: E_NEW[nk][1] };
  if (SK_TAG[wt] && SK_TAG[wt].e) { delete SK_TAG[wt].e[o]; SK_TAG[wt].e[nk] = E_NEW_TAG[nk]; }
}

// ───────── 2. 舊存檔：選了被換掉那招 → 換成同位置的新招（技能寶石等級一起搬）─────────
function eSwapMig() {
  const w = save.w; if (!w || w.eSwapV) return;
  let hit = [];
  for (const wt in E_SWAP) for (const o in E_SWAP[wt]) {
    const nk = E_SWAP[wt][o];
    if (w.tri && w.tri[wt] && w.tri[wt].e === o) { w.tri[wt].e = nk; hit.push(`${E_NEW[nk][0]}`); }
    if (Array.isArray(w.triOwn)) w.triOwn = w.triOwn.map((x) => (x === `${wt}:e:${o}` ? `${wt}:e:${nk}` : x));
    const S = save.skg; if (S) { const ok = `${wt}:e:${o}`, nk2 = `${wt}:e:${nk}`; if (S[ok]) { const a = S[ok], b = S[nk2]; S[nk2] = !b || a.lv > b.lv || (a.lv === b.lv && (a.xp || 0) > (b.xp || 0)) ? a : b; delete S[ok]; if (!hit.length) hit.push(E_NEW[nk][0]); } }
  }
  w.eSwapV = 1;
  if (hit.length && typeof notice === "function") notice(`E 招改版：重複的 9 招換成新招（${[...new Set(hit)].join("、")}…）。你原本選的已經自動換成同位置的新招，技能寶石等級也搬過去了`, "#ffe066");
  writeSave();
}
const _enterWorldEN = enterWorld;
enterWorld = function () { const r = _enterWorldEN.apply(this, arguments); try { eSwapMig(); if (typeof applyWeapon === "function" && W0) applyWeapon(); } catch (e) {} return r; };

// ───────── 3. 放招 ─────────
const CURSE_R = 100, CURSE_T = 4;
const eRing = (x, y, r, c, max = 0.35) => W0.rings.push({ x, y, t: 0, max, r, c });
function eNewFx(k, c) {
  const { p, t, tx, ty, F, cs, sn } = c;
  if (k === "trap") {
    W0.traps = (W0.traps || []).filter((o) => o.ghost);
    for (let i = 0; i < 3; i++) { const d = 34 + i * 30; W0.traps.push({ x: p.x + cs * d + rand(-6, 6), y: p.y + sn * d + rand(-6, 6), t: 8, arm: 0.35 + i * 0.08, sl: CUR_SL, dm: CUR_DM }); }
    sfx("volley"); return true;
  }
  if (k === "roar") {
    const r = 90 * AM();
    for (const m of W0.mobs) if (!m.dead && dist(m, p) < r + WMOBS[m.type].r) { m.roarT = 5; hitMob(m, wDmg(14), 0, p, true); if (!m.boss && (m.st === "idle" || m.st === "home")) m.st = "chase"; }
    for (const m of W0.mobs) if (!m.dead && m.wind > 0 && dist(m, p) < 100 + WMOBS[m.type].r) { m.wind = 0; m.atkT = Math.max(m.atkT || 0, 0.6); if (m.dv && m.dv.ph === "aim") m.dv = null; floatText(m.x, m.y - 16, "打斷", "#ffb070"); } // 企劃 66 D：打斷出招蓄力
    W0.roarT = 5; B = worldStats(); eRing(p.x, p.y, r, "255,170,90", 0.45); floatText(p.x, p.y - 22, "戰吼", "#ffb070");
    sfx("break"); shake = Math.max(shake, 5); return true;
  }
  if (k === "tthrow") {
    c.shoot(F, { v: 300, life: 1.0, back: 0.5, dmg: 31, kind: "sword", pierce: true, kb: 30 });
    p.swing = p.swingMax = 0.18; p.swingR = 30; sfx("volley"); return true;
  }
  if (k === "curse") { // 企劃 68：紫黑詛咒波，不造成傷害；被波及的怪受到的傷害加倍（王 ×1.5）
    const r = CURSE_R * AM();
    for (const m of W0.mobs) if (!m.dead && dist(m, p) < r + WMOBS[m.type].r) { m.curT = CURSE_T; if (!m.boss && (m.st === "idle" || m.st === "home")) m.st = "chase"; }
    eRing(p.x, p.y, r, "150,60,200", 0.5); eRing(p.x, p.y, r * 0.7, "40,10,60", 0.4);
    for (let i = 0; i < 30; i++) { const a = rand(0, 6.28), v = rand(60, 200); particles.push({ x: p.x, y: p.y - 3, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, life: 0.6, max: 0.6, color: i % 2 ? "#c890ff" : "#3a1050", size: 2.5 }); }
    sfx("arrive"); return true;
  }
  if (k === "tslow") { W0.tslow = { x: tx, y: ty, r: 110 * AM(), t: 4, max: 4 }; sfx("arrive"); return true; } // 企劃 68：巨大時鐘領域
  if (k === "gbell") {
    p.guardSh = Math.round(p.maxHp * 0.3); p.guardT2 = 4; W0.gbell = { sl: CUR_SL, dm: CUR_DM };
    eRing(p.x, p.y, 24, "255,215,120", 0.4); floatText(p.x, p.y - 22, "金鐘罩", "#ffd878"); sfx("arrive"); return true;
  }
  if (k === "grab") {
    let tg = null, bd = 80; for (const m of W0.mobs) if (!m.dead && m.ai !== "pillar") { const d = dist(m, p) - WMOBS[m.type].r; if (d < bd) { bd = d; tg = m; } }
    p.swing = p.swingMax = 0.2; p.swingR = 18;
    if (!tg) { floatText(p.x, p.y - 20, "沒抓到", "#cfc4dc"); sfx("dash"); return true; }
    p.face = angTo(p, tg);
    if (!tg.boss) { const fx = p.x + Math.cos(p.face) * 20, fy = p.y + Math.sin(p.face) * 20; tg.x = fx; tg.y = fy; } // 企劃 66 D：拉到面前 20
    tg.frz = Math.max(tg.frz || 0, tg.boss ? 0.5 : 1.5); tg.wind = 0; tg.mv = null;
    hitMob(tg, wDmg(75), 0, p);
    fxBoom(tg.x, tg.y + 4, 22, "230,200,150"); burst(tg.x, tg.y, "#e8c890", 18, 110, 0.45);
    sfx("break"); shake = Math.max(shake, 8); flashT = 0.05; flashColor = "255,230,190"; return true;
  }
  if (k === "crane") {
    W0.cranes = (W0.cranes || []).filter((o) => o.ghost);
    for (let i = 0; i < 3; i++) W0.cranes.push({ x: p.x, y: p.y - 10, a: (i / 3) * Math.PI * 2, t: 8, cd: 0.3 + i * 0.15, sl: CUR_SL, dm: CUR_DM, f: 0 });
    sfx("arrive"); return true;
  }
  if (k === "stealth") {
    W0.stealthT = 3; W0.stealthNew = 1; windPop(CUR_SL, CUR_DM);
    for (const m of W0.mobs) if (!m.dead && !m.boss && !m.hunter && m.st === "chase") { m.st = "idle"; m.wind = 0; m.mv = null; m.q = null; m.wt = 0; }
    for (let i = 0; i < 20; i++) { const a = rand(0, 6.28), v = rand(30, 80); particles.push({ x: p.x, y: p.y - 4, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5, max: 0.5, color: "#c8ffe0", size: 2 }); }
    sfx("dash"); return true;
  }
  return false;
}

// 企劃 66 D 風遁：進入和現身各一個風爆（r50、傷害 8、擊退）
function windPop(sl, dm) { if (!W0) return; eNewHitAt(W0.x, W0.y, 50 * areaMul(sl || "e"), 8, 80, sl || "e", dm); eRing(W0.x, W0.y, 50, "200,255,224", 0.35); }
// ───────── 4. 每幀 ─────────
function eNewHitAt(x, y, r, base, kb, sl, dm) {
  const s0 = CUR_SL, d0 = CUR_DM; CUR_SL = sl; CUR_DM = dm || 1;
  try { const n = []; for (const m of W0.mobs) if (!m.dead && Math.hypot(m.x - x, m.y - y) < r + WMOBS[m.type].r) { hitMob(m, wDmg(base), kb, { x, y }, true); n.push(m); } return n; }
  finally { CUR_SL = s0; CUR_DM = d0; }
}
const _updateWorldEN = updateWorld;
updateWorld = function (dt) {
  const r = _updateWorldEN.apply(this, arguments);
  if (!W0 || !(dt > 0)) return r;
  const p = W0;
  // 陷阱
  if (W0.traps && W0.traps.length) {
    for (const o of W0.traps) {
      o.t -= dt; o.arm -= dt; if (o.arm > 0) continue;
      const step = !o.ghost && W0.mobs.some((m) => !m.dead && Math.hypot(m.x - o.x, m.y - o.y) < 12 + WMOBS[m.type].r);
      if (step || o.t <= 0) {
        o.t = -1; bolts.push({ x: o.x, y: o.y, life: 0.25 }); fxBoom(o.x, o.y, 26, "190,220,255"); sfx("crit"); shake = Math.max(shake, 3);
        if (!o.ghost) for (const m of eNewHitAt(o.x, o.y, 32, 24, 40, o.sl, o.dm)) m.shockT = Math.max(m.shockT || 0, 3);
      }
    }
    W0.traps = W0.traps.filter((o) => o.t > 0);
  }
  // 戰吼／詛咒的計時
  if (W0.roarT > 0 && (W0.roarT -= dt) <= 0) { W0.roarT = 0; B = worldStats(); }
  for (const m of W0.mobs) { if (m.curT > 0) m.curT -= dt; if (m.roarT > 0) { m.roarT -= dt; if (!m.boss && m.st === "idle" && dist(m, p) < 260) m.st = "chase"; } }
  // 時緩：圈裡的怪變慢、敵方子彈退回 70% 的位移
  const Z = W0.tslow;
  if (Z) {
    Z.t -= dt; if (Z.t <= 0) W0.tslow = null;
    else {
      for (const m of W0.mobs) if (!m.dead && Math.hypot(m.x - Z.x, m.y - Z.y) < Z.r + WMOBS[m.type].r) { const f = m.boss ? 0.4 : 0.8; m.tslT = 0.1; m.tslF = f; if (m.wind > 0) m.wind += dt * f; if (m.boss && m.actT !== undefined) m.actT += dt * f; if (m.mv && m.mv.t !== undefined) m.mv.t += dt * f; } // 企劃 68：動作慢 80%（王 40%）
      for (const s of W0.eshots) if (Math.hypot(s.x - Z.x, s.y - Z.y) < Z.r && s.vx !== undefined) { s.x -= s.vx * dt * 0.8; s.y -= s.vy * dt * 0.8; s.life += dt * 0.8; }
    }
  }
  // 金鐘罩：護罩被打破就炸開
  if (W0.gbell) {
    if (p.guardT2 > 0 && !(p.guardSh > 0)) {
      const g = W0.gbell; W0.gbell = null;
      eNewHitAt(p.x, p.y, 60, 40, 220, g.sl, g.dm); eRing(p.x, p.y, 60, "255,215,120", 0.4); burst(p.x, p.y, "#ffd878", 26, 140, 0.5);
      floatText(p.x, p.y - 22, "金鐘震！", "#ffd878"); sfx("break"); shake = Math.max(shake, 7);
    } else if (!(p.guardT2 > 0)) W0.gbell = null;
  }
  // 紙鶴
  if (W0.cranes && W0.cranes.length) {
    for (const c of W0.cranes) {
      c.t -= dt; c.cd -= dt; c.f += dt;
      let tg = null, bd = 150; if (!c.ghost) for (const m of W0.mobs) if (!m.dead) { const d = Math.hypot(m.x - p.x, m.y - p.y); if (d < bd && Math.hypot(m.x - c.x, m.y - c.y) < 220) { bd = d; tg = m; } }
      c.a += dt * 3; const gx = tg ? tg.x + Math.cos(c.a * 2) * 8 : p.x + Math.cos(c.a) * 22, gy = (tg ? tg.y + Math.sin(c.a * 2) * 5 : p.y + Math.sin(c.a) * 12) - 10;
      const dx = gx - c.x, dy = gy - c.y, d = Math.hypot(dx, dy), v = 170 * dt;
      if (d > v) { c.x += (dx / d) * v; c.y += (dy / d) * v; c.dir = Math.atan2(dy, dx); } else { c.x = gx; c.y = gy; }
      if (tg && c.cd <= 0 && Math.hypot(tg.x - c.x, tg.y - 10 - c.y) < 16 + WMOBS[tg.type].r) {
        c.cd = 0.45; const s0 = CUR_SL, d0 = CUR_DM; CUR_SL = c.sl; CUR_DM = c.dm || 1;
        try { hitMob(tg, wDmg(1.8), 10, c, true); } finally { CUR_SL = s0; CUR_DM = d0; }
        particles.push({ x: tg.x, y: tg.y - 6, vx: rand(-30, 30), vy: rand(-40, -10), life: 0.3, max: 0.3, color: "#ffffff", size: 2 });
      }
    }
    W0.cranes = W0.cranes.filter((c) => c.t > 0);
  }
  // 風遁
  if (W0.stealthT > 0) { W0.stealthT -= dt; if (W0.stealthT <= 0) { W0.stealthT = 0; windPop("e", 1); } }
  if (W0.ambushT > 0) W0.ambushT -= dt;
  W0.stealthNew = 0;
  return r;
};
// 風遁：放下一招（不是閃身、丹藥）＝出手，傷害 ×2 一下子、隱身解除
const _skillUsedEN = skillUsed;
skillUsed = function (k) { // eslint-disable-line no-func-assign
  if (W0 && W0.stealthT > 0 && !W0.stealthNew && k !== "roll" && k !== "potion") { W0.stealthT = 0; windPop("e", 1); W0.ambushT = 0.6; floatText(W0.x, W0.y - 22, "伏擊 ×2", "#c8ffe0"); }
  return _skillUsedEN.apply(this, arguments);
};
// 移速 +30%、戰吼護甲 +50%
const _jobStatsEN = jobStats;
jobStats = function (b) {
  b = _jobStatsEN(b);
  if (typeof W0 !== "undefined" && W0) { if (W0.roarT > 0) b.armor = (b.armor || 0) * 1.5; }
  return b;
};
// 受到傷害：詛咒、戰吼、伏擊
const _hitMobEN = hitMob;
hitMob = function (m, dmg) { // eslint-disable-line no-func-assign
  if (m && dmg > 0) {
    let f = 1;
    if (m.curT > 0) f *= m.boss ? 1.5 : 2; // 企劃 68：詛咒受傷加倍（王 ×1.5）
    if (m.roarT > 0) f *= 1.2;
    if (W0 && W0.ambushT > 0) f *= 2;
    if (f !== 1) { arguments[1] = dmg * f; }
  }
  return _hitMobEN.apply(this, arguments);
};

// ───────── 5. 畫面（世界座標，接在命中火花前面）─────────
const _drawFxOverEN = drawFxOver;
drawFxOver = function () { // eslint-disable-line no-func-assign
  if (W0 && state === "world") try { eNewDraw(); } catch (e) {}
  return _drawFxOverEN.apply(this, arguments);
};
function eNewDraw() {
  const g = ctx, T = typeof time !== "undefined" ? time : 0;
  const Z = W0.tslow;
  if (Z) { const a = Math.min(1, Z.t * 2) * 0.8, q = 1 - Z.t / Z.max, cr = Z.r * 0.55; g.save(); g.strokeStyle = `rgba(170,200,255,${a})`; g.lineWidth = 1.5; g.setLineDash([5, 4]); g.lineDashOffset = -T * 4; g.beginPath(); g.ellipse(Z.x, Z.y, Z.r, Z.r * 0.6, 0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); g.fillStyle = `rgba(120,150,255,${0.12 * a})`; g.fill(); // 企劃 68：半透明大時鐘
    g.strokeStyle = `rgba(220,230,255,${0.6 * a})`; g.lineWidth = 2; g.beginPath(); g.ellipse(Z.x, Z.y, cr, cr * 0.6, 0, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 12; i++) { const b = (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(Z.x + Math.cos(b) * cr * 0.85, Z.y + Math.sin(b) * cr * 0.51); g.lineTo(Z.x + Math.cos(b) * cr, Z.y + Math.sin(b) * cr * 0.6); g.stroke(); }
    const h1 = -Math.PI / 2 + q * Math.PI * 2, h2 = -Math.PI / 2 + q * Math.PI * 2 * 12; g.lineWidth = 2.5; g.beginPath(); g.moveTo(Z.x, Z.y); g.lineTo(Z.x + Math.cos(h1) * cr * 0.5, Z.y + Math.sin(h1) * cr * 0.3); g.stroke(); g.lineWidth = 1.2; g.beginPath(); g.moveTo(Z.x, Z.y); g.lineTo(Z.x + Math.cos(h2) * cr * 0.85, Z.y + Math.sin(h2) * cr * 0.51); g.stroke(); g.restore(); }
  for (const o of W0.traps || []) { const on = o.arm <= 0, bl = 0.5 + 0.5 * Math.sin(T * (on ? 10 : 4)); g.fillStyle = "#3a3450"; g.beginPath(); g.ellipse(o.x, o.y, 6, 3.5, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = `rgba(200,220,255,${0.5 + 0.5 * bl})`; g.lineWidth = 1; g.stroke(); g.fillStyle = `rgba(220,235,255,${on ? bl : 0.3})`; g.fillRect(o.x - 1, o.y - 2, 2, 2); }
  for (const m of W0.mobs) {
    if (m.dead) continue;
    if (m.curT > 0) { const y = m.y - WMOBS[m.type].r * 2 - 10 + Math.sin(T * 4) * 1.5; g.save(); g.globalAlpha = Math.min(1, m.curT); g.strokeStyle = "#c890ff"; g.lineWidth = 1.3; g.beginPath(); g.arc(m.x, y, 3.5, 0, Math.PI * 2); g.moveTo(m.x - 5, y); g.lineTo(m.x + 5, y); g.moveTo(m.x, y - 5); g.lineTo(m.x, y + 5); g.stroke(); g.restore(); }
    if (m.roarT > 0) { g.fillStyle = `rgba(255,150,80,${0.5 + 0.3 * Math.sin(T * 8)})`; g.fillRect(m.x - 1, m.y - WMOBS[m.type].r * 2 - 8, 2, 4); }
  }
  for (const c of W0.cranes || []) { // 紙鶴：白色三角形＋拍翅
    const a = c.dir || 0, fl = Math.sin(c.f * 18) * 3; g.save(); g.translate(c.x, c.y); g.globalAlpha = Math.min(1, c.t * 2) * (c.ghost ? allyA() : 1);
    g.fillStyle = "#ffffff"; g.strokeStyle = "#8aa0c0"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(Math.cos(a) * 6, Math.sin(a) * 6); g.lineTo(-Math.cos(a) * 4 - Math.sin(a) * (4 + fl), -Math.sin(a) * 4 + Math.cos(a) * (4 + fl) - 2); g.lineTo(-Math.cos(a) * 2, -Math.sin(a) * 2); g.lineTo(-Math.cos(a) * 4 + Math.sin(a) * (4 + fl), -Math.sin(a) * 4 - Math.cos(a) * (4 + fl) - 2); g.closePath(); g.fill(); g.stroke(); g.restore(); }
  if (W0.stealthT > 0) { g.save(); g.strokeStyle = `rgba(200,255,224,${0.35 + 0.2 * Math.sin(T * 6)})`; g.lineWidth = 1; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(W0.x, W0.y - 4, 10 + i * 3, T * 3 + i * 2, T * 3 + i * 2 + 1.6); g.stroke(); } g.restore(); }
  if (W0.gbell && W0.guardT2 > 0) { g.save(); g.strokeStyle = `rgba(255,216,120,${0.55 + 0.25 * Math.sin(T * 6)})`; g.lineWidth = 2; g.beginPath(); g.moveTo(W0.x - 11, W0.y + 3); g.quadraticCurveTo(W0.x - 12, W0.y - 20, W0.x, W0.y - 22); g.quadraticCurveTo(W0.x + 12, W0.y - 20, W0.x + 11, W0.y + 3); g.closePath(); g.stroke(); g.restore(); }
}
// 隱身移速 +30%：tree2.js trSpdMul 裡乘（const 不能包）
