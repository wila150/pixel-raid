// 御劍渡劫（pixel-raid）— 世界王：在仙界火山祭壇直接打，用自己的招式（不再切到渡劫飛劍場地）
// 王是 W0.mobs 裡的一隻（type "wboss"），所以玩家所有招式、寶石效果都打得到它
"use strict";

WMOBS.wboss = { n: "焚天石魔", img: () => null, hp: 1, spd: 26, dmg: 30, r: 20, exp: 900, ai: "boss", armor: 0.15 };
const WB_LV = 22, WB_ARENA = 170, WB_COOL = 90;
let wbZones = []; // 預警範圍：{ k: "circle"|"line", x, y, r, a, len, w, t, max, dmg }

function startWorldBossField() {
  if (W0.mobs.some((m) => m.boss)) return;
  if (W0.wbCool > 0) { floatText(W0.x, W0.y - 30, `焚天石魔還在沉睡（${Math.ceil(W0.wbCool)} 秒）`, "#cfc4dc", true); return; }
  const lv = save.w.lv, hp = Math.round(8000 * (1 + 0.1 * Math.max(0, lv - 18)));
  const camp = { x: ALTAR.x, y: ALTAR.y, z: "volcano", lv: WB_LV, respawn: [] };
  W0.mobs.push({ type: "wboss", boss: true, lv: WB_LV, elite: false, camp, x: ALTAR.x, y: ALTAR.y - 6, hp, max: hp, st: "chase", wt: 0, wx: 0, wy: 0,
    atkT: 2, flash: 0, kb: 0, ka: 0, fuse: 0, phase: 1, act: null, actT: 0, adds: 0, dash: null });
  wbZones = [];
  shake = 10; flashT = 0.15; flashColor = "255,120,40"; sfx("crit");
  burst(ALTAR.x, ALTAR.y, "#ff8a2e", 50, 160, 0.8);
  floatText(ALTAR.x, ALTAR.y - 40, "焚天石魔甦醒了！", "#ff6b3a", true);
}
const wbDmg = (m, mul = 1) => WMOBS.wboss.dmg * (1 + 0.22 * (m.lv - 1)) * mul;
function wbZone(o) { o.t = 0; wbZones.push(o); }
// 每幀（world.js 的怪物迴圈遇到王時呼叫）
function updateWBoss(m, dt, p) {
  m.flash = Math.max(0, m.flash - dt);
  if (m.slowT > 0) m.slowT -= dt;
  const dp = dist(m, p), home = Math.hypot(p.x - ALTAR.x, p.y - ALTAR.y);
  // 玩家跑出祭壇範圍太遠：王回去睡覺、回滿血
  if (home > WB_ARENA + 120 || state === "worldDead") {
    m.dead = true; wbZones = [];
    floatText(ALTAR.x, ALTAR.y - 30, "焚天石魔沉回熔岩⋯⋯", "#cfc4dc", true);
    return;
  }
  // 階段
  const r = m.hp / m.max;
  if (m.phase === 1 && r < 0.5) { m.phase = 2; floatText(m.x, m.y - 40, "石魔暴走！", "#ff4a2a", true); shake = 8; flashT = 0.1; flashColor = "255,60,30"; }
  if (m.phase === 2 && r < 0.2) { m.phase = 3; floatText(m.x, m.y - 40, "元神燃燒！", "#ff2a1a", true); shake = 10; }
  if ((m.adds === 0 && r < 0.7) || (m.adds === 1 && r < 0.35)) { // 召喚熔岩小妖
    m.adds++;
    floatText(m.x, m.y - 46, "召喚熔岩妖群！", "#ff6b3a", true);
    for (let i = 0; i < 3; i++) {
      const camp = W0.camps.find((c) => c.z === "volcano") || m.camp;
      spawnWMob(camp); const n = W0.mobs[W0.mobs.length - 1];
      n.x = m.x + rand(-40, 40); n.y = m.y + rand(10, 40); n.st = "chase"; n.noRespawn = true; n.elite = false; n.mod = null; n.lv = WB_LV - 2;
      n.hp = n.max = WMOBS[n.type].hp * 1.2 * (1 + 0.35 * (n.lv - 1)) * 0.6; n.camp = m.camp;
      burst(n.x, n.y, "#ff8a2e", 14, 80);
    }
  }
  const spdMul = (m.slowT > 0 ? 0.6 : 1) * (m.phase >= 2 ? 1.25 : 1);
  // 衝撞中
  if (m.dash) {
    const d = m.dash; d.t -= dt;
    moveBody(m, Math.cos(d.a) * 260 * dt, Math.sin(d.a) * 260 * dt, 14);
    if (!d.hit && dist(m, p) < 22) { d.hit = true; hurtW(wbDmg(m, 1.1), m); }
    if (Math.random() < 0.6) burst(m.x, m.y + 10, "#ff8a2e", 2, 40, 0.3);
    if (d.t <= 0) { m.dash = null; shake = Math.max(shake, 5); fxBoom(m.x, m.y + 8, 30); }
    return;
  }
  // 沒在出招：慢慢走向玩家
  m.atkT -= dt;
  if (!m.act && dp > 34) { const a = angTo(m, p); moveBody(m, Math.cos(a) * WMOBS.wboss.spd * spdMul * dt, Math.sin(a) * WMOBS.wboss.spd * spdMul * dt, 14); }
  if (m.act) { // 蓄力中
    m.actT -= dt * (m.slowT > 0 ? 0.8 : 1);
    if (m.actT <= 0) wbFire(m, p);
  } else if (m.atkT <= 0) wbPick(m, p, dp);
}
function wbPick(m, p, dp) {
  const opts = ["slam", "fan", "rain"];
  if (m.phase >= 2) opts.push("charge", "charge");
  if (m.phase >= 3) opts.push("spiral", "spiral");
  let k = opts[Math.floor(Math.random() * opts.length)];
  if (dp > 120 && k === "slam") k = m.phase >= 2 ? "charge" : "fan";
  const fast = m.phase >= 2 ? 0.8 : 1;
  m.act = k;
  if (k === "slam") { m.actT = 0.9 * fast; wbZone({ k: "circle", x: p.x, y: p.y, r: 36, max: m.actT, follow: true }); m.slamAt = wbZones[wbZones.length - 1]; }
  else if (k === "fan") { m.actT = 0.6 * fast; m.fanA = angTo(m, p); }
  else if (k === "rain") {
    m.actT = 0.3;
    const n = m.phase >= 2 ? 9 : 6;
    for (let i = 0; i < n; i++) { const x = p.x + rand(-60, 60), y = p.y + rand(-45, 45), t = 0.9 + i * 0.12; wbZone({ k: "circle", x, y, r: 20, max: t, dmg: wbDmg(m, 0.7), meteor: true }); }
    wbZone({ k: "circle", x: p.x, y: p.y, r: 20, max: 1.0, dmg: wbDmg(m, 0.7), meteor: true }); // 一定有一顆砸你腳下
  } else if (k === "charge") { m.actT = 0.8 * fast; const a = angTo(m, p); m.chargeA = a; wbZone({ k: "line", x: m.x, y: m.y, a, len: 200, w: 26, max: m.actT, owner: m }); }
  else if (k === "spiral") { m.actT = 0.5; }
  sfx("dash");
}
function wbFire(m, p) {
  const k = m.act; m.act = null;
  m.atkT = (m.phase >= 3 ? 0.7 : m.phase >= 2 ? 1.0 : 1.4) + rand(0, 0.5);
  if (k === "slam") { // 對預警圈中心砸下去
    const z = m.slamAt; if (!z) return;
    fxBoom(z.x, z.y, 40, "255,150,60"); shake = Math.max(shake, 7); sfx("break");
    burst(z.x, z.y, "#ff8a2e", 30, 130, 0.6);
    if (Math.hypot(p.x - z.x, p.y - z.y) < z.r) hurtW(wbDmg(m, 1.2), m);
    m.slamAt = null;
  } else if (k === "fan") { // 火球扇
    const n = m.phase >= 2 ? 9 : 7, spread = 1.1;
    for (let i = 0; i < n; i++) { const a = m.fanA - spread / 2 + (spread * i) / (n - 1); W0.eshots.push({ x: m.x, y: m.y - 8, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 2.2, dmg: wbDmg(m, 0.55), c: "#ff6a2a", big: true, ele: true }); }
    sfx("volley");
  } else if (k === "charge") { m.dash = { a: m.chargeA, t: 0.75, hit: false }; sfx("dash"); }
  else if (k === "spiral") { // 螺旋火焰：連續 2.4 秒往外噴
    for (let i = 0; i < 16; i++) setTimeout(() => {
      if (m.dead || state !== "world") return;
      for (let j = 0; j < 3; j++) { const a = i * 0.45 + (j * Math.PI * 2) / 3; W0.eshots.push({ x: m.x, y: m.y - 8, vx: Math.cos(a) * 95, vy: Math.sin(a) * 95, life: 2.4, dmg: wbDmg(m, 0.45), c: "#ff3a1a", big: true, ele: true }); }
    }, i * 150);
  }
}
// 預警圈（不管王在不在都要跑，隕石落地）
function updateWBZones(dt) {
  const p = W0;
  for (const z of wbZones) {
    z.t += dt;
    if (z.follow && z.t < z.max * 0.55) { z.x += (p.x - z.x) * Math.min(1, dt * 4); z.y += (p.y - z.y) * Math.min(1, dt * 4); } // 前半段會跟著你，後半段固定
    if (z.k === "line" && z.owner) { z.x = z.owner.x; z.y = z.owner.y; }
    if (z.t >= z.max && z.dmg) { // 隕石落地
      fxBoom(z.x, z.y, z.r * 1.3, "255,140,50"); burst(z.x, z.y, "#ff8a2e", 14, 90, 0.4); shake = Math.max(shake, 3);
      if (Math.random() < 0.5) sfx("break");
      if (Math.hypot(p.x - z.x, p.y - z.y) < z.r) hurtW(z.dmg, null, "ele");
    }
  }
  wbZones = wbZones.filter((z) => z.t < z.max);
}
function drawWBZones() {
  for (const z of wbZones) {
    const q = Math.min(1, z.t / z.max);
    if (z.k === "circle") {
      ctx.fillStyle = `rgba(255,50,30,${0.12 + q * 0.15})`; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,80,40,0.35)"; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r * q, z.r * 0.55 * q, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,110,60,0.9)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
      if (z.meteor) { const my = z.y - (1 - q) * 120, mx = z.x + (1 - q) * 30; glow(mx, my, 8, "255,150,50", 0.9 * q); ctx.fillStyle = "#fff0a0"; ctx.fillRect(mx - 1.5, my - 1.5, 3, 3); }
    } else {
      ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(z.a);
      ctx.fillStyle = `rgba(255,50,30,${0.12 + q * 0.15})`; ctx.fillRect(0, -z.w / 2, z.len, z.w);
      ctx.fillStyle = "rgba(255,80,40,0.35)"; ctx.fillRect(0, -z.w / 2, z.len * q, z.w);
      ctx.strokeStyle = "rgba(255,110,60,0.9)"; ctx.lineWidth = 1; ctx.strokeRect(0, -z.w / 2, z.len, z.w);
      ctx.restore();
    }
  }
  // 祭壇範圍
  if (W0.mobs.some((m) => m.boss)) { ctx.strokeStyle = `rgba(255,90,40,${0.25 + 0.1 * Math.sin(time * 3)})`; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.ellipse(ALTAR.x, ALTAR.y, WB_ARENA, WB_ARENA * 0.6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
}
// 王的樣子：借用原本打王的石魔畫法，縮小放進仙界
function drawWBoss(m) {
  const saved = boss;
  boss = { x: 0, y: 0, r: 30, flash: m.flash, phase: m.phase >= 2 ? 2 : 1, state: m.act ? "cast" : "idle" };
  ctx.save(); ctx.translate(Math.round(m.x), Math.round(m.y - 6)); ctx.scale(0.62, 0.62);
  try { drawBoss(); } finally { boss = saved; }
  ctx.restore();
  if (m.act && m.act !== "rain") glow(m.x, m.y - 10, 26, "255,80,40", 0.35 + 0.2 * Math.sin(time * 20));
}
function drawWBossBar() { // 畫面上方的王血條
  const m = W0.mobs.find((o) => o.boss); if (!m) return;
  const bw = Math.min(260, W * 0.62), x = (W - bw) / 2, y = W <= 600 ? 168 : 60;
  ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(x - 3, y - 3, bw + 6, 14);
  ctx.fillStyle = "#3a1a1a"; ctx.fillRect(x, y, bw, 8);
  ctx.fillStyle = m.phase >= 3 ? "#ff2a1a" : m.phase >= 2 ? "#ff5a2a" : "#ff8a2e"; ctx.fillRect(x, y, bw * Math.max(0, m.hp / m.max), 8);
  ctx.font = "bold 11px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#ffe0c0";
  ctx.fillText(`焚天石魔 Lv.${m.lv}　${Math.max(0, Math.ceil(m.hp))} / ${m.max}`, W / 2, y + 22);
}
function wbKilled(m) { // 打倒世界王
  W0.wbCool = WB_COOL; wbZones = [];
  shake = 12; flashT = 0.2; flashColor = "255,220,150"; sfx("win");
  floatText(m.x, m.y - 40, "擊敗焚天石魔！", "#ffe066", true);
  const il = Math.floor(WB_LV / 3) + 2; // 掉落等級看王的等級（Lv.22），不看玩家：高等回來刷沒有好處
  for (let i = 0; i < 4; i++) { const it = rollItem(1, il); delete it.risk; wDrop({ kind: "item", it, safe: true }, m); }
  for (let i = 0; i < 2; i++) wDrop({ kind: "gem", g: randGem(Math.random() < 0.3 ? 2 : 1) }, m);
  wDrop({ kind: "stone", v: 80 + WB_LV * 3 }, m);
  questEvent("boss");
}
