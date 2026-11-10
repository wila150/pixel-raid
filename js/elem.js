// 萬劍仙途（pixel-raid）— 武器元素、破體、雷谷／仙域小怪機制（企劃 06、07 B 包）
// build.js 後面載入：會換掉 elemHit，包住 updateWorld、hurtW、hitMob、drawWMob、drawWBZones、drawOrbs、drawHeldWeapon、showWorldDead、enterWorld
"use strict";

// ───────── 小工具 ─────────
function segDist(px, py, ax, ay, bx, by) { // 點到線段的距離
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = L ? clamp(((px - ax) * dx + (py - ay) * dy) / L, 0, 1) : 0;
  return Math.hypot(px - ax - dx * t, py - ay - dy * t);
}
function seenHint(k, t) { // 第一次碰到新機制：一句提示（save.w.seen）
  const w = save.w; if (!w || !W0) return; if (!w.seen) w.seen = {};
  if (w.seen[k]) return; w.seen[k] = 1; notice(t);
}
function wLater(t, f) { if (!W0.lat) W0.lat = []; W0.lat.push({ t, f }); } // 取代 setTimeout：暫停、切 App 不會偷跑
function drawEleTag(x, y, e) { // 怪名後面的元素小圖示
  ctx.fillStyle = ELE_C[e]; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#1a1424"; ctx.font = "bold 4px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.fillText(ELE_N[e], x, y + 1.5);
}

// ───────── 武器元素：剋制環 火→冰→雷→毒→火（被剋 +30%、同屬性 −30%）─────────
const ELE_BEATS = { F: "W", W: "T", T: "P", P: "F" };
const wEleGem = () => (typeof slotGemEle === "function" ? slotGemEle(CUR_SL || "a") : itemEle(save.eq.sword)); // 企劃 66 A：只看串的寶石（感電等狀態要寶石）
const wEle = () => (typeof slotEle === "function" ? slotEle(CUR_SL || "a") : itemEle(save.eq.sword)); // 第二版：看正在放的那一招（沒有就看普攻）
const mobEle = (m) => m.ele || (WMOBS[m.type] && WMOBS[m.type].ele) || null; // m.ele：秘境「元素加持」
function chainZap(m, amt, n) { // 雷：跳到旁邊 n 隻（不會再連鎖）
  if (chainLock) return;
  const near = W0.mobs.filter((o) => o !== m && !o.dead && dist(o, m) < 70).sort((a, b) => dist(a, m) - dist(b, m)).slice(0, n);
  chainLock = true;
  for (const o of near) { bolts.push({ x: o.x, y: o.y, life: 0.2 }); hitMob(o, amt, 0, null, true); }
  chainLock = false;
}
function stormVolt(t) { // 風雷＋雷元素：每下多跳一隻（企劃 08 留下的）
  const hr = t.hr || 22, o = W0.mobs.find((m) => !m.dead && dist(m, t) >= hr + WMOBS[m.type].r && dist(m, t) < 80);
  if (o) { bolts.push({ x: o.x, y: o.y, life: 0.2 }); chainLock = true; hitMob(o, wDmg(t.dmg || 13) * 0.6, 0, t, true); chainLock = false; }
}
// 企劃 61 B（v9.13.1）：寶石上限 單體 +40%、清 10 隻 +55%（固定天賦樹量）。雷跳電 25%+7%/級、50% → 20%+4%/級、25%；毒每層 10% → 5.5%
const VOLT_P = (l) => 0.2 + l * 0.04, VOLT_D = 0.25, VENOM_D = 0.055;
elemHit = function (m, dmg) {
  // 企劃 41 §6-1：剋制移到最後一步（dmg2.js 的 hitFinal），這裡只管冰凍／燃燒／中毒／反應
  let gi = gemLv("ice"), gf = gemLv("fire"), gd = gemLv("det"), gv = gemLv("volt"), gp = gemLv("venom");
  const ef = gemLv("efocus"); // 元素集中：有元素的招傷害提高，但不會冰凍／燃燒／中毒、不觸發反應（雷的跳電保留）
  if (ef && (gi || gf || gv || gp)) { dmg *= 1.2 + ef * 0.05; m.expT = time + 4; /* 曝曬：受傷 +20%（dmg2.js） */ return gv && !chainLock && Math.random() < VOLT_P(gv) ? (chainZap(m, dmg * VOLT_D, gv >= 3 ? 2 : 1), dmg) : dmg; }
  if (B.uq.psnConv && (gi || gf || gv || gp || SPELL_WT[curWeapon()])) { // 萬毒蟾衣：屬性傷害全部變毒
    m.psn = Math.min(5, (m.psn || 0) + 1); m.psnT = 3; m.psnD = Math.max(m.psnD || 0, dotSeed(dmg) * 0.12 * (1 + (gi + gf + gv + gp) * 0.15));
    return dmg;
  }
  if (gf && m.frz > 0) { // 融化：冰凍的怪被火打到
    dmg *= 2.5; m.frz = 0;
    floatText(m.x, m.y - 22, "融化！", "#ff9a3a", true); burst(m.x, m.y, "#ffb070", 18, 110, 0.5); burst(m.x, m.y, "#bfefff", 10, 80, 0.4);
  }
  if (gi && m.burnT > 0) { // 蒸汽：冰打燃燒中的怪 → 旁邊的怪一起變慢
    m.burnT = 0; floatText(m.x, m.y - 22, "蒸汽！", "#e8f4ff", true);
    for (let i = 0; i < 10; i++) particles.push({ x: m.x + rand(-20, 20), y: m.y + rand(-12, 8), vx: rand(-15, 15), vy: -18, life: 0.8, max: 0.8, color: "rgba(235,245,255,0.8)", size: 3 });
    for (const o of W0.mobs) if (!o.dead && dist(o, m) < 40) o.slowT = Math.max(o.slowT || 0, 2);
  }
  if (gi) { m.slowT = Math.max(m.slowT || 0, 1.5); if (Math.random() < (m.boss ? 0.03 : 0.1) * (1 + gi * 0.6)) { if (!(m.frz > 0)) floatText(m.x, m.y - 18, "冰凍", "#bfefff"); m.frz = m.boss ? 0.5 : 1.4; } }
  if (gf) { m.burnT = 3; m.burnD = Math.max(m.burnD || 0, dotSeed(dmg) * 0.1 * (1 + gf * 0.2));
    const gs = gemLv("spread"); if (gs) { const r = 36 + gs * 4; for (const o of W0.mobs) if (o !== m && !o.dead && !(o.burnT > 0) && dist(o, m) < r + WMOBS[o.type].r) { o.burnT = 3; o.burnD = m.burnD * 0.7; } } } // 火勢蔓延
  if (gv && !chainLock) {
    if (m.psn > 0 && m.psnT > 0 && !((W0.pbT || 0) > 0)) { // 毒爆：毒層一次引爆（0.3 秒最多一次，炸到的不再連鎖）
      W0.pbT = 0.3; const v = m.psnD * m.psn * 4; m.psn = 0; m.psnT = 0; dmg += v;
      floatText(m.x, m.y - 24, "毒爆！", "#b0ff6a", true); fxBoom(m.x, m.y, 36, "150,255,110"); burst(m.x, m.y, "#9aff6a", 16, 100, 0.4);
      chainLock = true; for (const o of W0.mobs) if (o !== m && !o.dead && dist(o, m) < 36 + WMOBS[o.type].r) hitMob(o, v * 0.6, 0, null, true); chainLock = false;
    } else if (Math.random() < VOLT_P(gv)) chainZap(m, dmg * VOLT_D, gv >= 3 ? 2 : 1);
  }
  if (gp) { m.psn = Math.min(5, (m.psn || 0) + 1); m.psnT = 3; m.psnD = Math.max(m.psnD || 0, dotSeed(dmg) * VENOM_D * (1 + gp * 0.15)); }
  if (gd && m.burnT > 0 && Math.random() < 0.12 + gd * 0.05) W0.fires.push({ x: m.x, y: m.y, t: 0.05, r: 28 + gd * 3, dmg: 8 + gd * 5, c: "#ff8a3d" });
  if (supOn("thunder") && !chainLock && Math.random() < 0.15) { // 雷霆萬鈞（原本用 setTimeout）
    bolts.push({ x: m.x, y: m.y, life: 0.25 });
    wLater(0.06, () => { if (!m.dead && W0) { chainLock = true; hitMob(m, wDmg(14), 0, null, true); chainLock = false; } });
  }
  return dmg;
};
// 舊存檔：同一把同時鑲兩種元素 → 留等級高的那種，其他元素寶石退回袋子
function fixEleGems(it) {
  if (!it || !it.so) return 0;
  const e = itemEle(it); let n = 0;
  it.so = it.so.map((g) => { if (g && ELE_GEM[g.split(":")[0]] && ELE_GEM[g.split(":")[0]] !== e) { addGem(g); n++; return null; } return g; });
  return n;
}
const _enterWorldE = enterWorld;
enterWorld = function () {
  let n = 0;
  const all = [save.eq, ...((save.chars || []).filter(Boolean).map((c) => c.eq))];
  for (const eq of all) if (eq) n += fixEleGems(eq.sword);
  for (const it of save.bag || []) if (it.slot === "sword") n += fixEleGems(it);
  for (const it of (save.w && save.w.ws) || []) n += fixEleGems(it);
  const r = _enterWorldE.apply(this, arguments);
  if (n && W0) notice(`一把武器只能一種元素：${n} 顆元素寶石退回袋子`, "#ffe9a8");
  return r;
};

// ───────── 破體：被區域王的招式打中疊 1 層（最多 5），每層吸血、回血 −20%；6 秒沒被打中清掉 ─────────
function bossHitNow(from) { const ar = typeof wbArena === "function" ? wbArena() : null; return ar && ar.m.rb !== "volcano" && (!from || from.boss); }
const _hurtWE = hurtW;
hurtW = function (dmg, from, kind) {
  const hp0 = W0.hp, es0 = W0.es;
  _hurtWE(dmg, from, kind);
  if ((W0.hp < hp0 || W0.es < es0) && bossHitNow(from)) {
    W0.brk = Math.min(5, (W0.brk || 0) + 1); W0.brkT = 6;
    seenHint("brk", "破體！被王打中會疊層，每層吸血和回血 −20%；6 秒沒被打中就清掉");
  }
};

// ───────── 雷甲巨像的電圈：踩到緩速 ×0.5、1 秒 ─────────
function addZap(x, y, r, t) { if (!W0.zaps) W0.zaps = []; W0.zaps.push({ x, y, r, t, max: t }); if (W0.zaps.length > 10) W0.zaps.shift(); }

// ───────── 天兵石像：身邊 110 內的其他怪連金線、受傷 −50%（最多 6 隻）─────────
function guardLinks() {
  for (const m of W0.mobs) m.gd = null;
  for (const g of W0.mobs) {
    if (g.dead || g.type !== "guardian" || Math.abs(g.x - W0.x) > 420 || Math.abs(g.y - W0.y) > 420) continue;
    const near = W0.mobs.filter((o) => o !== g && !o.dead && !o.boss && o.type !== "guardian" && !o.gd && dist(o, g) < 110).sort((a, b) => dist(a, g) - dist(b, g)).slice(0, 6);
    for (const o of near) o.gd = g;
    if (near.length && dist(g, W0) < 150) seenHint("gold", "金線：天兵石像身邊的妖怪受傷 −50%，先打石像");
  }
}

// ───────── 每幀 ─────────
const _updateWorldE = updateWorld;
updateWorld = function (dt) {
  const p = W0, rolling0 = p.roll > 0;
  if (p.lat && p.lat.length) { const L = p.lat; p.lat = []; for (const l of L) { if ((l.t -= dt) <= 0) l.f(); else p.lat.push(l); } }
  if (p.pbT > 0) p.pbT -= dt;
  if (p.zapT > 0) { p.zapT -= dt; if (Math.random() < 0.4) particles.push({ x: p.x + rand(-5, 5), y: p.y - rand(0, 10), vx: rand(-20, 20), vy: -10, life: 0.2, max: 0.2, color: "#dfefff", size: 1.5 }); }
  if (p.brk > 0 && (p.brkT -= dt) <= 0) p.brk = 0;
  if (p.lethalCd > 0) p.lethalCd -= dt;
  for (const z of p.zaps || []) {
    z.t -= dt;
    if (Math.hypot(p.x - z.x, (p.y - z.y) / 0.55) < z.r && !safeAt(p.x, p.y)) { if (!(p.zapT > 0)) floatText(p.x, p.y - 20, "觸電！變慢", "#dfefff"); p.zapT = 1; seenHint("zap", "電圈：踩到會變慢，繞過去"); }
  }
  if (p.zaps) p.zaps = p.zaps.filter((z) => z.t > 0);
  if ((p.gdT = (p.gdT || 0) - dt) <= 0) { p.gdT = 0.25; guardLinks(); }
  _updateWorldE(dt);
  const p2 = W0; if (!p2) return;
  if (B.uq.tstep) { // 踏雷靴：閃身冷卻 −20%、閃身結束落雷
    if (!rolling0 && p2.roll > 0) p2.cds.roll *= 0.8;
    if (rolling0 && !(p2.roll > 0) && state === "world") {
      bolts.push({ x: p2.x, y: p2.y, life: 0.3 }); fxBoom(p2.x, p2.y, 30, "200,220,255"); sfx("crit");
      for (const m of p2.mobs) if (!m.dead && dist(m, p2) < 30 + WMOBS[m.type].r) hitMob(m, wDmg(30), 40, p2, true);
    }
  }
  // 無相劍尊卡：致命傷不倒下，改成無敵 3 秒（冷卻 90 秒）
  if (state === "worldDead" && save.eq.robe && save.eq.robe.card === "rbsky" && !(p2.lethalCd > 0)) {
    state = "world"; p2.hp = 1; p2.invT = 3; p2.lethalCd = 90;
    floatText(p2.x, p2.y - 40, "無相護體！無敵 3 秒", "#ffe066", true); burst(p2.x, p2.y, "#ffe08a", 40, 120, 0.6); flashT = 0.2; flashColor = "255,230,150";
  }
};
const _showWorldDeadE = showWorldDead;
showWorldDead = function () { if (state !== "worldDead") return; return _showWorldDeadE.apply(this, arguments); };

// ───────── 無相劍：普攻打中 25% 劍影再砍一次（60%）─────────
const _hitMobE = hitMob;
hitMob = function (m, dmg, kb, from, quiet) {
  _hitMobE(m, dmg, kb, from, quiet);
  if (B.uq && B.uq.echo && !quiet && from === W0 && !m.dead && Math.random() < 0.25)
    wLater(0.12, () => { if (!m.dead && W0) { burst(m.x, m.y, "#fff4c8", 8, 70, 0.3); W0.rings.push({ x: m.x, y: m.y, t: 0, max: 0.2, r: 16, c: "255,240,200" }); _hitMobE(m, dmg * 0.6, 0, null, true); } });
};

// ───────── 畫面 ─────────
const _drawWMobE = drawWMob;
drawWMob = function (m) {
  const v = m.dv;
  if (v && v.ph === "aim") { // 雷鷹俯衝紅線
    const q = 1 - v.t / 0.5; ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(v.a);
    ctx.fillStyle = `rgba(255,50,30,${0.12 + q * 0.15})`; ctx.fillRect(0, -8, 140, 16);
    ctx.fillStyle = "rgba(255,80,40,0.35)"; ctx.fillRect(0, -8, 140 * q, 16);
    ctx.strokeStyle = "rgba(255,110,60,0.9)"; ctx.lineWidth = 1; ctx.strokeRect(0, -8, 140, 16); ctx.restore();
  }
  _drawWMobE(m);
  const r = (WMOBS[m.type] && WMOBS[m.type].r) || 8;
  if (m.tired > 0) { ctx.fillStyle = "#ffe9a0"; ctx.font = "bold 5px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.fillText("喘", m.x + r + 3, m.y - r); }
  if (m.gd) { ctx.fillStyle = "#ffd870"; ctx.beginPath(); ctx.moveTo(m.x - 3, m.y - r - 12); ctx.lineTo(m.x + 3, m.y - r - 12); ctx.lineTo(m.x + 3, m.y - r - 9); ctx.lineTo(m.x, m.y - r - 6); ctx.lineTo(m.x - 3, m.y - r - 9); ctx.closePath(); ctx.fill(); }
};
const _drawWBZonesE = drawWBZones;
drawWBZones = function () {
  for (const z of W0.zaps || []) { // 電圈
    const a = Math.min(1, z.t / 0.4);
    ctx.fillStyle = `rgba(150,200,255,${0.18 * a})`; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(220,240,255,${(0.5 + 0.4 * Math.sin(time * 20 + z.x)) * a})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
    if (Math.random() < 0.3) { const t = rand(0, 6.28), d = rand(0, z.r); particles.push({ x: z.x + Math.cos(t) * d, y: z.y + Math.sin(t) * d * 0.55, vx: 0, vy: -8, life: 0.15, max: 0.15, color: "#eef6ff", size: 1.5 }); }
  }
  for (const m of W0.mobs) if (m.gd && !m.dead && !m.gd.dead) { // 天兵金線
    ctx.strokeStyle = `rgba(255,215,110,${0.35 + 0.2 * Math.sin(time * 5 + m.x)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(m.gd.x, m.gd.y - 6); ctx.lineTo(m.x, m.y - 3); ctx.stroke();
  }
  _drawWBZonesE();
};
const _drawOrbsE = drawOrbs;
drawOrbs = function () {
  _drawOrbsE();
  if (!(W0 && W0.brk > 0)) return;
  const R = clamp(Math.min(W, H) * 0.11, 34, 56), hx = SAFE.l + R + 14, hy = H - R - 18, y = hy - R - (B.maxEs > 0 ? 22 : 9);
  ctx.font = "bold 10px 'Noto Sans TC', sans-serif"; ctx.textAlign = "left";
  ctx.lineWidth = 3; ctx.strokeStyle = "rgba(20,10,10,0.9)"; const t = `破體 ×${W0.brk}（回血 −${W0.brk * 20}%）`, tx = Math.max(SAFE.l + 6, hx + 10 - ctx.measureText(t).width / 2); // 大字體不被左邊切掉
  ctx.strokeText(t, tx, y); ctx.fillStyle = `rgb(255,${150 - W0.brk * 20},${120 - W0.brk * 20})`; ctx.fillText(t, tx, y);
};
const _drawHeldWeaponE = drawHeldWeapon;
drawHeldWeapon = function (p, wt) {
  _drawHeldWeaponE(p, wt);
  const e = p === W0 ? wEle() : null; if (!e) return; // 元素武器帶那個顏色的光
  const c = { F: "255,130,60", W: "160,220,255", T: "200,185,255", P: "140,255,110" }[e];
  glow(p.x + Math.cos(p.face) * 8, p.y + Math.sin(p.face) * 5, 9, c, 0.35 + 0.15 * Math.sin(time * 8));
};
