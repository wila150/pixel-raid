// 萬劍仙途 — 企劃 28：怪物不要只會走過來咬
// 近戰怪：撲擊（狼）／衝撞（巨型）／瞬步（天狐）；遠程怪：保持距離＋各自的射法；新角色：鐵盾妖、妖巫、靈醫、疾行妖
// 所有會打到人的新招都有預警（紅線／紅圈／殘影），手機原則：沒預警的傷害 0 個
"use strict";

const turnTo = (cur, want, max) => { const da = ((want - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI; return cur + clamp(da, -max, max); };
// 企劃 28 §7 驗收：荒原／雪域風箏太安全 → 撲擊更遠更頻繁；雷谷／仙域弓太痛 → 遠程子彈 ×0.75、射程最多 190
const zIs = (m, a) => !!m.camp && a.includes(m.camp.z);
const MID_Z = ["waste", "snow"], DEEP_Z = ["thunder", "sky"];
const mobRange = (m, d) => (zIs(m, DEEP_Z) ? Math.min(d.range, 190) : d.range);
const MOB_SPECIAL = (t) => { const d = WMOBS[t]; return !!d && (["ranged", "dive", "witch", "healer"].includes(d.ai) || d.shield || d.fast); };

// 營地配置：Lv.11 以後每營至少 1 隻遠程／新角色，Lv.30 以後 2 隻；妖巫、靈醫一營最多 1 隻
function campPick(camp, types) {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const live = W0.mobs.filter((o) => !o.dead && o.camp === camp);
  let type = pick(types);
  const need = camp.lv >= 11 ? 2 : 0;
  if (need && live.filter((o) => MOB_SPECIAL(o.type)).length < need) { const sp = types.filter(MOB_SPECIAL); if (sp.length) type = pick(sp); }
  const one = (t) => (t === "witch" || t === "healer") && live.some((o) => o.type === t);
  if (one(type)) { const sp = types.filter((t) => MOB_SPECIAL(t) && !one(t)), rest = types.filter((t) => !one(t)); type = pick(sp.length && need ? sp : rest.length ? rest : types); }
  return type;
}

// 玩家這幾幀的速度（火鴉預判用）
let pvx = 0, pvy = 0, plx = null, ply = null;
function trackPlayerVel(dt) {
  const p = W0; if (plx == null || dt <= 0) { plx = p.x; ply = p.y; return; }
  const vx = (p.x - plx) / dt, vy = (p.y - ply) / dt; plx = p.x; ply = p.y;
  if (Math.hypot(vx, vy) > 400) return; // 傳送、瞬移不算
  const k = Math.min(1, dt * 8); pvx += (vx - pvx) * k; pvy += (vy - pvy) * k;
}

// ───────── 近戰：拉近距離的招 ─────────
// 回傳 true＝這幀開始出招了（不走一般近戰）
function meleeMove(m, d, p, dp, a) {
  if (!d.mv || (m.mvCd = (m.mvCd == null ? rand(1, 3) : m.mvCd)) > 0 || m.atkT > 0.3) return false;
  const far = zIs(m, MID_Z) ? 160 : 130;
  if (d.mv === "pounce" && dp > 60 && dp < far) { mvStart(m, "pounce", a, Math.min(dp + 12, far + 10), m.elite ? 0.4 : 0.45); return true; }
  if (d.mv === "charge" && dp > 55 && dp < 170) { mvStart(m, "charge", a, 160, 0.6); return true; }
  if (d.mv === "blink" && dp > 50 && dp < 200) { mvStart(m, "blink", a, 0, 0.4); return true; }
  return false;
}
function mvStart(m, k, a, len, aim) {
  const d = WMOBS[m.type], p = W0;
  m.mv = { k, ph: "aim", t: aim, a, len };
  m.wind = 0;
  if (k === "pounce") { wbZone({ k: "line", x: m.x, y: m.y, a, len, w: 10, max: aim }); seenHint("pounce", "紅線＝妖狼要撲過來，往旁邊閃"); }
  else if (k === "charge" || k === "rush") { wbZone({ k: "line", x: m.x, y: m.y, a, len, w: 16 + d.r, max: aim }); seenHint("charge", "紅色長條＝衝撞路線，被撞到會被撞飛，往旁邊閃"); }
  else if (k === "blink") { // 瞬步：目的地在你背後，地上先出現紫圈
    const f = p.face || 0;
    let tx = p.x - Math.cos(f) * 24, ty = p.y - Math.sin(f) * 24;
    if (blockedCircle(tx, ty, d.r)) { tx = p.x + Math.cos(a + Math.PI / 2) * 24; ty = p.y + Math.sin(a + Math.PI / 2) * 24; }
    if (blockedCircle(tx, ty, d.r)) { m.mv = null; m.mvCd = 2; return; }
    m.mv.tx = tx; m.mv.ty = ty;
    wbZone({ k: "circle", x: tx, y: ty, r: 14, max: aim, c: "190,120,255", fc: "190,120,255" });
    seenHint("blink", "紫圈＝天狐要閃到你背後，看到殘影就往旁邊走");
  }
}
function mvTick(m, d, p, dt) {
  const v = m.mv;
  v.t -= dt;
  if (v.ph === "aim") {
    if (v.t > 0) return;
    if (v.k === "blink") {
      m.gh = { x: m.x, y: m.y, t: 0.4 }; burst(m.x, m.y, "#c79bff", 10, 60, 0.3);
      m.x = v.tx; m.y = v.ty; burst(m.x, m.y, "#c79bff", 10, 60, 0.3); sfx("roll");
      m.mv = null; m.mvCd = 8; m.wa = angTo(m, p); m.wind = m.windMax = 0.4; m.atkT = 0; // 出現後還有 0.4 秒蓄力才咬
      return;
    }
    const spd = v.k === "pounce" ? 480 : 400;
    v.ph = "go"; v.t = v.len / spd; v.spd = spd; v.hit = false; sfx("dash");
    return;
  }
  // go：照預警的線衝過去
  const ox = m.x, oy = m.y;
  moveBody(m, Math.cos(v.a) * v.spd * dt, Math.sin(v.a) * v.spd * dt, d.r);
  if (v.k === "pounce") m.lunge = 0.1;
  else if (Math.random() < 0.6) particles.push({ x: m.x, y: m.y + d.r * 0.6, vx: 0, vy: 0, life: 0.3, max: 0.3, color: "#c8a888", size: 2 });
  if (!v.hit && segDist(p.x, p.y, ox, oy, m.x, m.y) < d.r + (v.k === "pounce" ? 14 : 10)) { // 跟一般撲咬的距離一樣（怪碰不到你身體正中間）
    v.hit = true;
    const dmg = mobDmg(m, d) * (v.k === "pounce" ? 1 : 1.2);
    hurtW(dmg, m);
    if (v.k !== "pounce") { moveBody(p, Math.cos(v.a) * 26, Math.sin(v.a) * 26, 5); shake = Math.max(shake, 4); } // 撞飛
  }
  if (v.t <= 0 || (Math.hypot(m.x - ox, m.y - oy) < 0.3 * v.spd * dt)) {
    if (v.k !== "pounce") { shake = Math.max(shake, 2); sfx("break"); }
    m.mv = null; m.mvCd = v.k === "pounce" ? (zIs(m, MID_Z) ? rand(3, 4) : rand(4, 6)) : v.k === "rush" ? Math.max(m.mvCd || 0, 1) : rand(6, 8);
    m.atkT = v.k === "pounce" ? 0.5 : 0.8; m.tired = v.k === "pounce" ? 0 : 0.5; // 衝完喘一下（受傷 +30%）
  }
}
// 冷卻倒數（每幀）
function mobAiTick(m, dt) { if (m.mvCd > 0) m.mvCd -= dt; if (m.tired > 0 && WMOBS[m.type].ai !== "dive") m.tired -= dt; if (m.gh && (m.gh.t -= dt) <= 0) m.gh = null; if (m.hl && (m.hl.t -= dt) <= 0) m.hl = null; }

// ───────── 遠程：保持距離＋射法 ─────────
const volsAlive = (m) => { const s = new Set(); for (const e of W0.eshots) if (e.src === m) s.add(e.vol); return s.size; };
function rangedAI(m, d, p, dp, a, dt) {
  let spd = d.spd * B.slow * (m.elite ? 1.1 : 1) * (m.mod === "狂暴" ? 1.4 : 1) * (m.spdMul || 1) * (m.slowT > 0 ? 0.45 : 1);
  const R = mobRange(m, d), homeD = Math.hypot(m.x - m.camp.x, m.y - m.camp.y);
  if (dp < 80) m.flee = true; else if (dp > 150) m.flee = false; // 你靠近 80 內：往後退到 150
  let dir = m.flee && homeD < 230 ? -0.9 : dp > R * 0.8 ? 1 : dp < R * 0.55 ? -0.5 : 0;
  let mx = Math.cos(a) * dir, my = Math.sin(a) * dir;
  if (d.sh === "orbit" && !m.flee) { // 仙鶴妖：繞著你飛
    if (m.osg == null) m.osg = Math.random() < 0.5 ? 1 : -1;
    const t = a + (Math.PI / 2) * m.osg; mx += Math.cos(t) * 0.9; my += Math.sin(t) * 0.9;
    if ((m.osT = (m.osT || rand(3, 5)) - dt) <= 0) { m.osT = rand(3, 5); m.osg *= -1; }
  }
  const ox = m.x, oy = m.y;
  if (mx || my) moveBody(m, mx * spd * dt, my * spd * dt, d.r);
  if (m.flee && Math.hypot(m.x - ox, m.y - oy) < spd * dt * 0.2) m.flee = false; // 退到牆角：不退了，站著射
  if (m.q) queueTick(m, d, p, dt);
  if (d.ai === "witch") { witchTick(m, d, p, dp, dt); return; }
  if (d.ai === "healer") healTick(m, d, dt);
  // 出手
  if (dp < R && m.atkT <= 0 && !(m.wind > 0) && !m.q && volsAlive(m) < 2) {
    m.wind = m.windMax = d.sh === "line" ? 0.55 : 0.3; m.atkT = 99; m.wa = a;
    if (d.sh === "line") { wbZone({ k: "line", x: m.x, y: m.y - 3, a, len: R, w: 10, max: m.windMax }); seenHint("jline", "紅線＝劍靈要射一排飛劍，往旁邊跑"); }
  }
  if (m.wind > 0 && (m.wind -= dt) <= 0) {
    m.wind = 0; m.atkT = (m.mod === "狂暴" ? 0.9 : 1.4) * (d.sh === "line" || d.sh === "split" ? 1.6 : d.ai === "healer" ? 1.5 : 1);
    if (d.lob) { wbZone({ k: "circle", x: p.x, y: p.y, r: 16, max: 0.6, dmg: mobDmg(m, d), ele: mobEle(m), lob: { x: m.x, y: m.y - 6 }, pool: { r: 16, dur: 5, dmg: mobDmg(m, d) * 0.3 }, c: "140,255,110" }); return; } // 腐沼樹妖：拋毒泥（留毒池）
    fireShots(m, d, p, a);
  }
}
function eShot(m, d, a, o) {
  const sp = (o && o.sp) || d.shot, life = (o && o.life) || Math.min(3, (mobRange(m, d) * 1.25) / sp);
  const s = Object.assign({ x: m.x, y: m.y - 3, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life, dmg: mobDmg(m, d), c: m.type === "crow" ? "#ff3a3a" : d.chill ? "#d050ff" : m.type === "healer" ? "#7dff9a" : "#ff4aa0", chill: d.chill, ele: mobEle(m), src: m, vol: m.volN }, o || {});
  delete s.sp; if (zIs(m, DEEP_Z)) s.dmg *= 0.75; W0.eshots.push(s); return s;
}
function fireShots(m, d, p, a) {
  m.volN = (m.volN || 0) + 1;
  const dp = dist(m, p);
  switch (d.sh) {
    case "spread": for (const i of [-1, 0, 1]) eShot(m, d, a + i * 0.28); break; // 樹妖：三發扇形
    case "lead": { // 火鴉：預判你走的方向
      const t = dp / d.shot; let lx = pvx * t, ly = pvy * t; const L = Math.hypot(lx, ly); if (L > 70) { lx *= 70 / L; ly *= 70 / L; }
      eShot(m, d, Math.atan2(p.y + ly - m.y, p.x + lx - m.x)); break;
    }
    case "split": eShot(m, d, a, { big: true, life: clamp(dp / d.shot, 0.6, 2.6), split: 6 }); break; // 冰靈：大冰球飛到你那邊炸開
    case "burst": m.q = { n: 3, t: 0, iv: 0.13, k: "burst" }; break; // 雷靈：連射 3 顆
    case "line": m.q = { n: 5, t: 0, iv: 0.12, k: "line", a: m.wa }; break; // 劍靈：同一條線 5 把飛劍
    default: eShot(m, d, a, d.ai === "healer" ? { dmg: mobDmg(m, d) * 0.6 } : null);
  }
  sfx("hit");
}
function queueTick(m, d, p, dt) {
  const q = m.q;
  if ((q.t -= dt) > 0) return;
  q.t = q.iv; q.n--;
  if (q.k === "line") eShot(m, d, q.a, { c: "#ffe9a0", dmg: mobDmg(m, d) * 0.6 });
  else eShot(m, d, angTo(m, p), { dmg: mobDmg(m, d) * 0.6 });
  if (q.n <= 0) m.q = null;
}
function splitShot(s) { // 冰靈的大冰球：炸成 6 顆小冰
  const n = s.split; s.split = 0; s.life = 0;
  burst(s.x, s.y, "#bfefff", 10, 70, 0.3);
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + rand(0, 0.4); W0.eshots.push({ x: s.x, y: s.y, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80, life: 1.1, dmg: s.dmg * 0.45, c: "#9fe8ff", chill: s.chill, ele: s.ele, src: s.src, vol: s.vol }); }
}

// 妖巫：每 6 秒在身邊叫 3 隻小妖（先出紫圈 0.6 秒），同時最多 6 隻
function witchTick(m, d, p, dp, dt) {
  m.sumT = (m.sumT == null ? 2 : m.sumT) - dt;
  if (m.sumT > 0 || dp > 220) return;
  m.sumT = 6;
  const alive = W0.mobs.filter((o) => !o.dead && o.sumBy === m).length;
  const n = Math.min(3, 6 - alive); if (n <= 0) return;
  floatText(m.x, m.y - 14, "召喚！", "#c79bff");
  seenHint("witch", "妖巫會一直叫小妖出來，先打牠");
  for (let i = 0; i < n; i++) {
    let x = m.x, y = m.y;
    for (let k = 0; k < 8; k++) { const aa = Math.random() * Math.PI * 2, tx = m.x + Math.cos(aa) * 22, ty = m.y + Math.sin(aa) * 16; if (!blockedCircle(tx, ty, 6)) { x = tx; y = ty; break; } }
    wbZone({ k: "circle", x, y, r: 9, max: 0.6, c: "190,120,255", fc: "190,120,255", done: () => {
      if (m.dead || !W0.mobs.includes(m)) return;
      spawnWMob(m.camp); const o = W0.mobs[W0.mobs.length - 1];
      o.type = "imp"; o.elite = false; o.mod = null; o.lv = m.lv; o.hp = o.max = WMOBS.imp.hp * 1.2 * (1 + 0.35 * (m.lv - 1)) * 0.5;
      o.x = x; o.y = y; o.st = "chase"; o.noRespawn = true; o.sum = 1; o.sumBy = m; o.emk = 1; burst(x, y, "#b07dff", 10, 60);
    } });
  }
}
// 靈醫：每 4 秒幫 120 內的怪回 10% 血（綠線連起來）
function healTick(m, d, dt) {
  m.healT = (m.healT == null ? 2 : m.healT) - dt;
  if (m.healT > 0) return;
  m.healT = 4;
  const L = W0.mobs.filter((o) => o !== m && !o.dead && !o.boss && o.hp < o.max && dist(o, m) < 120).slice(0, 6);
  if (!L.length) return;
  for (const o of L) { o.hp = Math.min(o.max, o.hp + o.max * 0.1); floatText(o.x, o.y - 12, "+", "#7dff9a"); }
  m.hl = { t: 0.5, L }; burst(m.x, m.y, "#7dff9a", 8, 50, 0.3);
  seenHint("healer", "靈醫會幫旁邊的妖怪回血（綠線），先打牠");
}

// 鐵盾妖：正面 ±63° 來的投射物擋掉（穿透的照打）
function shieldBlock(m, s) {
  if (!WMOBS[m.type].shield || s.pierce || m.fa == null) return false;
  const inc = Math.atan2(-s.vy, -s.vx), diff = Math.abs(((inc - m.fa + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
  if (diff > 1.1) return false;
  s.life = 0; s.hit.add(m);
  burst(s.x, s.y, "#ffe08a", 6, 70, 0.25); floatText(m.x, m.y - 14, "擋", "#cfc4dc");
  if (!m.blkMsg) { m.blkMsg = 1; seenHint("shield", "鐵盾妖會擋住正面的箭和法球：繞到側面、用範圍招或穿透"); }
  return true;
}

// 畫：盾、殘影、回血綠線
function drawMobExtra(m, d) {
  if (d.shield && m.fa != null) {
    const sc = m.elite ? 1.4 : 1, sx = m.x + Math.cos(m.fa) * (d.r + 2) * sc, sy = m.y - 2 + Math.sin(m.fa) * (d.r + 1) * 0.7 * sc;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(m.fa);
    ctx.fillStyle = "#6a6a78"; ctx.fillRect(-1.5, -6 * sc, 3, 12 * sc);
    ctx.fillStyle = "#c8c8d8"; ctx.fillRect(0.5, -5 * sc, 1, 10 * sc);
    ctx.restore();
  }
  if (m.gh) { const img = d.img(); ctx.globalAlpha = 0.35 * (m.gh.t / 0.4); ctx.drawImage(img, m.gh.x - img.width / 2, m.gh.y - img.height / 2); ctx.globalAlpha = 1; }
  if (m.hl) { ctx.strokeStyle = `rgba(125,255,154,${m.hl.t * 1.6})`; ctx.lineWidth = 1; for (const o of m.hl.L) { ctx.beginPath(); ctx.moveTo(m.x, m.y - 3); ctx.lineTo(o.x, o.y - 3); ctx.stroke(); } }
  if (m.mv && m.mv.ph === "aim" && Math.floor(time * 16) % 2) { ctx.fillStyle = "rgba(255,80,60,0.5)"; ctx.fillRect(m.x - 1, m.y - d.r - 12, 2, 4); ctx.fillRect(m.x - 1, m.y - d.r - 7, 2, 1.5); }
}
