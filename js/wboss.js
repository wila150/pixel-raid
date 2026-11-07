// 萬劍仙途（pixel-raid）— 區域王：每區一座祭壇，用自己的招式打（共用框架 RBOSS，企劃 02）
// 王是 W0.mobs 裡的一隻（boss:true，m.rb＝哪一隻），所以玩家所有招式、寶石效果都打得到它
"use strict";

WMOBS.wboss = { n: "焚天石魔", img: () => null, hp: 1, spd: 26, dmg: 30, r: 20, exp: 900, ai: "boss", armor: 0.15 };
WMOBS.rbswamp = { n: "腐骨蟾王", img: () => RC.rbswamp || (RC.rbswamp = recolor(MOB, 150, 1.2, 0.6)), hp: 1, spd: 30, dmg: 30, r: 16, exp: 1500, ai: "boss", armor: 0.15, sz: "L", race: "B" };
const WB_LV = 22, WB_ARENA = 170;
// 區域王資料表：等級、血量、掉落都看王，不看玩家
const RBOSS = {
  volcano: { type: "wboss", n: "焚天石魔", lv: 22, x: ALTAR.x, y: ALTAR.y, hp: 9000, cool: 90, rec: 18, col: "255,80,40", bar: ["#ff8a2e", "#ff5a2a", "#ff2a1a"], shards: 20,
    where: "焚天火山北邊祭壇", loot: "4 件好裝、2 寶石、精髓 3、25% 超技能寶石、15% 王卡",
    wake: "焚天石魔甦醒了！", sleep: "焚天石魔沉回熔岩⋯⋯", p2: "石魔暴走！", p3: "元神燃燒！", addMsg: "召喚熔岩妖群！", addN: 3,
    desc: "石魔會在這裡現身，用你自己的招式打倒它；看到紅色範圍就閃開。" },
  swamp: { type: "rbswamp", n: "腐骨蟾王", lv: 50, x: 3800, y: 1650, hp: 450000, dmgMul: 1.4, cool: 120, rec: 45, col: "120,230,110", bar: ["#8ad86a", "#6ac04a", "#4aa83a"], shards: 15, addType: "toad", addN: 2,
    where: "幽冥沼澤東南深處祭壇", loot: "3 件裝備（至少 1 件玄品）、12% 傳說「萬毒蟾衣」、10% 王卡、精髓 2",
    wake: "腐骨蟾王從泥沼爬出來了！", sleep: "腐骨蟾王沉回泥沼⋯⋯", p2: "蟾王發狂！會跳了！", p3: null, addMsg: "叫來毒沼蟾！",
    desc: "紅線＝舌頭，往旁邊閃；紅圈落地會留下毒池，別站在池子裡。<br>蟾王站進毒池時受到的傷害 +25%，可以引牠進去。" },
};
const RB_KEYS = Object.keys(RBOSS);
let wbZones = []; // 預警範圍：{ k: "circle"|"line", x, y, r, a, len, w, t, max, dmg, pool, done }
const rbOf = (m) => RBOSS[m.rb || "volcano"];
const rbCool = (k) => ((W0.rbCool || {})[k] || 0);
const rbKilled = (k) => { const w = save.w; if (w.rbK && w.rbK[k]) return true; if (k === "volcano") { const bi = QUESTS.findIndex((q) => q.k === "boss"); return bi >= 0 && (w.q || 0) > bi; } return false; };

function startWorldBossField(k = "volcano") {
  const R = RBOSS[k];
  if (W0.mobs.some((m) => m.boss)) return;
  if (rbCool(k) > 0) { floatText(W0.x, W0.y - 30, `${R.n}還在沉睡（${Math.ceil(rbCool(k))} 秒）`, "#cfc4dc", true); return; }
  const camp = { x: R.x, y: R.y, z: k, lv: R.lv, respawn: [] };
  W0.mobs.push({ type: R.type, rb: k, boss: true, lv: R.lv, elite: false, camp, x: R.x, y: R.y - 6, hp: R.hp, max: R.hp, st: "chase", wt: 0, wx: 0, wy: 0,
    atkT: 2, flash: 0, kb: 0, ka: 0, fuse: 0, phase: 1, act: null, actT: 0, adds: 0, dash: null, seq: [] });
  wbZones = [];
  shake = 10; flashT = 0.15; flashColor = R.col; sfx("crit");
  burst(R.x, R.y, `rgb(${R.col})`, 50, 160, 0.8);
  floatText(R.x, R.y - 40, R.wake, `rgb(${R.col})`, true);
}
const wbDmg = (m, mul = 1) => WMOBS.wboss.dmg * (1 + 0.22 * (m.lv - 1)) * mul * (rbOf(m).dmgMul || 1);
function wbZone(o) { o.t = 0; wbZones.push(o); return o; }
const wbFast = (m) => (m.phase >= 2 ? 0.8 : 1); // 第二階段預警最多縮到 0.8 倍
// 排程：取代 setTimeout（暫停、切 App 時不會偷跑）
const wbLater = (m, t, f) => m.seq.push({ t, f });
// 每幀（world.js 的怪物迴圈遇到王時呼叫）
function updateWBoss(m, dt, p) {
  const R = rbOf(m);
  m.flash = Math.max(0, m.flash - dt);
  if (m.slowT > 0) m.slowT -= dt;
  if (!m.seq) m.seq = [];
  for (const s of m.seq) if ((s.t -= dt) <= 0) s.f();
  m.seq = m.seq.filter((s) => s.t > 0);
  const dp = dist(m, p), home = Math.hypot(p.x - R.x, p.y - R.y);
  // 玩家跑出祭壇範圍太遠：王回去睡覺、回滿血
  if (home > WB_ARENA + 120 || state === "worldDead") {
    m.dead = true; wbZones = [];
    floatText(R.x, R.y - 30, R.sleep, "#cfc4dc", true);
    return;
  }
  // 階段
  const r = m.hp / m.max;
  if (m.phase === 1 && r < 0.5) { m.phase = 2; floatText(m.x, m.y - 40, R.p2, `rgb(${R.col})`, true); shake = 8; flashT = 0.1; flashColor = R.col; }
  if (m.phase === 2 && r < 0.2 && R.p3) { m.phase = 3; floatText(m.x, m.y - 40, R.p3, "#ff2a1a", true); shake = 10; }
  if ((m.adds === 0 && r < 0.7) || (m.adds === 1 && r < 0.35)) { // 召喚小怪
    m.adds++;
    floatText(m.x, m.y - 46, R.addMsg, `rgb(${R.col})`, true);
    for (let i = 0; i < R.addN; i++) {
      const camp = W0.camps.find((c) => c.z === (m.rb || "volcano")) || m.camp;
      spawnWMob(camp); const n = W0.mobs[W0.mobs.length - 1];
      if (R.addType) n.type = R.addType;
      n.x = m.x + rand(-40, 40); n.y = m.y + rand(10, 40); n.st = "chase"; n.noRespawn = true; n.elite = false; n.mod = null; n.lv = R.lv - 2;
      n.hp = n.max = WMOBS[n.type].hp * 1.2 * (1 + 0.35 * (n.lv - 1)) * 0.6; n.camp = m.camp;
      burst(n.x, n.y, `rgb(${R.col})`, 14, 80);
    }
  }
  const spdMul = (m.slowT > 0 ? 0.6 : 1) * (m.phase >= 2 ? 1.25 : 1);
  if (m.air) return; // 蟾躍：在空中
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
  const spd = WMOBS[m.type].spd;
  if (!m.act && dp > 34) { const a = angTo(m, p); moveBody(m, Math.cos(a) * spd * spdMul * dt, Math.sin(a) * spd * spdMul * dt, 14); }
  if (m.act) { // 蓄力中
    m.actT -= dt * (m.slowT > 0 ? 0.8 : 1);
    if (m.actT <= 0) (m.rb === "swamp" ? tkFire : wbFire)(m, p);
  } else if (m.atkT <= 0) (m.rb === "swamp" ? tkPick : wbPick)(m, p, dp);
}
// ───── 焚天石魔 ─────
function wbPick(m, p, dp) {
  const opts = ["slam", "fan", "rain"];
  if (m.phase >= 2) opts.push("charge", "charge");
  if (m.phase >= 3) opts.push("spiral", "spiral");
  let k = opts[Math.floor(Math.random() * opts.length)];
  if (dp > 120 && k === "slam") k = m.phase >= 2 ? "charge" : "fan";
  const fast = wbFast(m);
  m.act = k;
  if (k === "slam") { m.actT = 0.9 * fast; m.slamAt = wbZone({ k: "circle", x: p.x, y: p.y, r: 36, max: m.actT, follow: true }); }
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
  else if (k === "spiral") { // 螺旋火焰：連續 2.4 秒往外噴（用王自己的排程，暫停時不會偷噴）
    for (let i = 0; i < 16; i++) wbLater(m, i * 0.15, () => {
      if (m.dead) return;
      for (let j = 0; j < 3; j++) { const a = i * 0.45 + (j * Math.PI * 2) / 3; W0.eshots.push({ x: m.x, y: m.y - 8, vx: Math.cos(a) * 95, vy: Math.sin(a) * 95, life: 2.4, dmg: wbDmg(m, 0.45), c: "#ff3a1a", big: true, ele: true }); }
    });
  }
}
// ───── 腐骨蟾王：舌縛、毒涎、蟾躍（50% 後）─────
function tkPick(m, p, dp) {
  const opts = ["tongue", "spit", "spit"];
  if (m.phase >= 2) opts.push("leap", "leap");
  let k = opts[Math.floor(Math.random() * opts.length)];
  if (k === "tongue" && dp > 170) k = "spit";
  const fast = wbFast(m);
  m.act = k;
  if (k === "tongue") {
    m.actT = 0.8 * fast; m.tongueA = angTo(m, p);
    wbZone({ k: "line", x: m.x, y: m.y, a: m.tongueA, len: 180, w: 14, max: m.actT, owner: m, fixA: true });
    floatText(m.x, m.y - 34, "舌縛！", "#ff8a7a", true);
  } else if (k === "spit") {
    m.actT = 0.35;
    floatText(m.x, m.y - 34, "毒涎！", "#9aff7a", true);
    const dur = m.phase >= 2 ? 12 : 8, pts = [{ x: p.x, y: p.y }, { x: p.x + rand(-55, 55), y: p.y + rand(-40, 40) }, { x: p.x + rand(-55, 55), y: p.y + rand(-40, 40) }];
    for (const q of pts) wbZone({ k: "circle", x: q.x, y: q.y, r: 22, max: 1.0, dmg: wbDmg(m, 0.45), lob: { x: m.x, y: m.y - 14 }, pool: { r: 24, dur, dmg: wbDmg(m, 0.25) }, c: "140,255,110" });
  } else if (k === "leap") {
    m.actT = 0.3;
    floatText(m.x, m.y - 34, "蟾躍！", "#ffb07a", true);
  }
  sfx("dash");
}
function tkFire(m, p) {
  const k = m.act; m.act = null;
  m.atkT = (m.phase >= 2 ? 1.0 : 1.4) + rand(0, 0.5);
  if (k === "tongue") { // 舌頭打中：拉到王面前（停在腹擊圈外一點），接著腹擊
    const a = m.tongueA, dx = p.x - m.x, dy = p.y - m.y, along = dx * Math.cos(a) + dy * Math.sin(a), perp = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a));
    m.tongue = { a, t: 0.25 };
    if (along > 0 && along < 186 && perp < 12 && W0.iframe <= 0 && !W0.shield) {
      hurtW(wbDmg(m, 0.4), m);
      if (W0.hp > 0) {
        const tx = m.x + Math.cos(a) * 50, ty = m.y + Math.sin(a) * 50; W0.x = tx; W0.y = ty;
        floatText(tx, ty - 20, "被拉過去了！快閃開", "#ff8a7a", true);
        const f = 0.8 * wbFast(m);
        m.act = "belly"; m.actT = f;
        wbZone({ k: "circle", x: m.x, y: m.y, r: 36, max: f, dmg: wbDmg(m, 1.3), kind: "phys", c: "255,60,40" });
      }
    }
  } else if (k === "belly") { m.atkT = 0.9; shake = Math.max(shake, 6); sfx("break"); fxBoom(m.x, m.y, 36, "160,255,120"); }
  else if (k === "leap") { // 跳起來：影子前 0.6 秒跟著你、後 0.4 秒固定
    m.air = true; burst(m.x, m.y, "#6ac04a", 18, 90, 0.5);
    wbZone({ k: "circle", x: p.x, y: p.y, r: 40, max: 1.0, follow: true, followT: 0.6, shadow: true, done: (z) => {
      m.air = false; m.x = z.x; m.y = z.y; shake = Math.max(shake, 9); sfx("break"); fxBoom(z.x, z.y, 46, "140,255,110"); burst(z.x, z.y, "#8ad86a", 30, 140, 0.6);
      if (Math.hypot(W0.x - z.x, (W0.y - z.y) / 0.55) < z.r) hurtW(wbDmg(m, 1.5), m);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + rand(0, 0.3); W0.eshots.push({ x: z.x, y: z.y - 4, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, life: 2.4, dmg: wbDmg(m, 0.5), c: "#a0ff50", big: true, ele: true }); }
      m.atkT = 1.2;
    } });
  }
}
// ───── 毒池（王和沼澤小怪共用）：站在裡面每 0.5 秒扣血＋變慢，不疊加；最多 12 個 ─────
function addPool(x, y, r, dur, dmg, arm = 0.3) {
  if (!W0.pools) W0.pools = [];
  if (safeAt(x, y)) return;
  W0.pools.push({ x, y, r, t: dur, max: dur, dmg, arm });
  if (W0.pools.length > 12) W0.pools.shift();
}
const inPool = (o, q) => Math.hypot(o.x - q.x, (o.y - q.y) / 0.55) < q.r;
function poolHurt(dmg) { // 不給無敵時間（不然站在池子裡反而擋掉別的攻擊）
  const p = W0;
  if (p.shield > 0 || p.invT > 0 || safeAt(p.x, p.y) || state !== "world") return;
  dmg = Math.max(1, Math.round(dmg * (1 - B.res)));
  p.esT = 3;
  if (p.es > 0) { const a = Math.min(p.es, dmg); p.es -= a; dmg -= a; if (dmg <= 0) return; }
  p.hp -= dmg; floatText(p.x + rand(-4, 4), p.y - 14, `-${dmg}`, "#9aff6a");
  if (p.hp <= 0) { p.hp = 0; state = "worldDead"; screenEl.classList.add("hidden"); sfx("lose"); setTimeout(showWorldDead, 900); }
}
function updatePools(dt) {
  const p = W0, ps = W0.pools || [];
  if (p.poolT > 0) p.poolT -= dt;
  let worst = 0;
  for (const q of ps) {
    q.t -= dt; if (q.arm > 0) { q.arm -= dt; continue; }
    if (inPool(p, q)) worst = Math.max(worst, q.dmg);
  }
  for (const m of W0.mobs) if (m.boss && !m.dead) m.inPool = !m.air && ps.some((q) => q.arm <= 0 && inPool(m, q));
  if (worst > 0) {
    p.poolT = 0.25;
    const w = save.w; if (!w.seen) w.seen = {};
    if (!w.seen.pool) { w.seen.pool = 1; floatText(p.x, p.y - 40, "毒池！站在裡面會一直扣血、變慢，快走出去", "#9aff6a", true); }
    p.poolTick = (p.poolTick || 0) - dt;
    if (p.poolTick <= 0) {
      p.poolTick = 0.5;
      if (B.uq.psnHit) { p.mp = Math.min(B.maxMp, p.mp + B.maxMp * 0.04); if (Math.random() < 0.3) floatText(p.x, p.y - 14, "+真氣", "#9fdcff"); }
      else poolHurt(worst);
    }
  } else p.poolTick = 0;
  W0.pools = ps.filter((q) => q.t > 0);
}
// 預警圈（不管王在不在都要跑，隕石落地）
function updateWBZones(dt) {
  const p = W0;
  updatePools(dt);
  if (W0.rbCool) for (const k in W0.rbCool) if (W0.rbCool[k] > 0) W0.rbCool[k] -= dt;
  for (const z of wbZones) {
    z.t += dt;
    if (z.follow && z.t < (z.followT || z.max * 0.55)) { z.x += (p.x - z.x) * Math.min(1, dt * 4); z.y += (p.y - z.y) * Math.min(1, dt * 4); } // 前半段會跟著你，後半段固定
    if (z.k === "line" && z.owner) { z.x = z.owner.x; z.y = z.owner.y; if (z.owner.dead) z.t = z.max; }
    if (z.t >= z.max) {
      if (z.done) { z.done(z); continue; }
      if (!z.dmg) continue;
      const c = z.c || "255,140,50";
      fxBoom(z.x, z.y, z.r * 1.3, c); burst(z.x, z.y, `rgb(${c})`, z.r > 18 ? 14 : 8, 90, 0.4); shake = Math.max(shake, z.r > 18 ? 3 : 1);
      if (Math.random() < 0.5) sfx("break");
      if (Math.hypot(p.x - z.x, (p.y - z.y) / 0.55) < z.r) hurtW(z.dmg, null, z.kind || "ele");
      if (z.pool) addPool(z.x, z.y, z.pool.r, z.pool.dur, z.pool.dmg);
    }
  }
  wbZones = wbZones.filter((z) => z.t < z.max);
}
function drawPools() {
  for (const q of W0.pools || []) {
    const fade = Math.min(1, q.t / 0.8, (q.max - q.t + 0.3) / 0.5), a = (q.arm > 0 ? 0.35 : 1) * fade;
    ctx.fillStyle = `rgba(90,170,60,${0.32 * a})`; ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r, q.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(150,80,200,${0.22 * a})`; ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r * 0.65, q.r * 0.36, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(170,255,120,${0.6 * a})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r, q.r * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
    const s = (time * 1.5 + q.x * 0.13) % 1; // 冒泡
    ctx.fillStyle = `rgba(200,255,150,${(1 - s) * 0.7 * a})`; ctx.fillRect(q.x + Math.sin(q.y + Math.floor(time * 1.5)) * q.r * 0.5, q.y - s * 6, 2, 2);
  }
}
function drawWBZones() {
  drawPools();
  for (const z of wbZones) {
    const q = Math.min(1, z.t / z.max), c = z.c || "255,50,30";
    if (z.k === "circle") {
      if (z.shadow) { ctx.fillStyle = `rgba(0,0,0,${0.2 + q * 0.3})`; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r * (0.4 + 0.6 * q), z.r * 0.55 * (0.4 + 0.6 * q), 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = `rgba(255,50,30,${0.12 + q * 0.15})`; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,80,40,0.35)"; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r * q, z.r * 0.55 * q, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,110,60,0.9)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
      if (z.meteor) { const my = z.y - (1 - q) * 120, mx = z.x + (1 - q) * 30; glow(mx, my, 8, "255,150,50", 0.9 * q); ctx.fillStyle = "#fff0a0"; ctx.fillRect(mx - 1.5, my - 1.5, 3, 3); }
      if (z.lob) { const lx = z.lob.x + (z.x - z.lob.x) * q, ly = z.lob.y + (z.y - z.lob.y) * q - Math.sin(q * Math.PI) * 50; glow(lx, ly, 6, c, 0.8); ctx.fillStyle = `rgb(${c})`; ctx.fillRect(lx - 2, ly - 2, 4, 4); }
    } else {
      ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(z.a);
      ctx.fillStyle = `rgba(255,50,30,${0.12 + q * 0.15})`; ctx.fillRect(0, -z.w / 2, z.len, z.w);
      ctx.fillStyle = "rgba(255,80,40,0.35)"; ctx.fillRect(0, -z.w / 2, z.len * q, z.w);
      ctx.strokeStyle = "rgba(255,110,60,0.9)"; ctx.lineWidth = 1; ctx.strokeRect(0, -z.w / 2, z.len, z.w);
      ctx.restore();
    }
  }
  // 祭壇範圍
  const bm = W0.mobs.find((m) => m.boss && !m.dead);
  if (bm) { const R = rbOf(bm); ctx.strokeStyle = `rgba(${R.col},${0.25 + 0.1 * Math.sin(time * 3)})`; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.ellipse(R.x, R.y, WB_ARENA, WB_ARENA * 0.6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
}
// 祭壇（地圖上每區一座，冷卻中變灰）
function drawAltars() {
  for (const k of RB_KEYS) {
    const R = RBOSS[k], cool = rbCool(k) > 0, col = cool ? "140,140,150" : R.col;
    if (Math.abs(R.x - cam.x) > W && Math.abs(R.y - cam.y) > H) continue;
    ctx.fillStyle = k === "volcano" ? "#4a2a2a" : "#26331f"; ctx.beginPath(); ctx.ellipse(R.x, R.y, 26, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(${col},${0.5 + Math.sin(time * 4) * 0.3})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(R.x, R.y, 20, 10, 0, 0, Math.PI * 2); ctx.stroke();
  }
}
// 王的樣子
function drawWBoss(m) {
  if (m.rb === "swamp") {
    if (m.air) return;
    const img = WMOBS.rbswamp.img(), s = 2.5;
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(m.x, m.y + 2, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(Math.round(m.x), Math.round(m.y + 2));
    const sq = m.act ? 1 + 0.08 * Math.sin(time * 30) : 1 + 0.03 * Math.sin(time * 3); ctx.scale(s * sq, s / sq);
    if (m.flash > 0) ctx.filter = "brightness(2.5)";
    ctx.drawImage(img, -img.width / 2, -img.height);
    ctx.restore();
    if (m.inPool) { ctx.fillStyle = "#9aff6a"; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center"; ctx.fillText("泡毒 +25%", m.x, m.y + 14); }
    if (Math.random() < 0.15) particles.push({ x: m.x + rand(-10, 10), y: m.y - rand(8, 18), vx: 0, vy: -10, life: 0.6, max: 0.6, color: "#9aff6a", size: 2 });
    if (m.tongue && (m.tongue.t -= 1 / 60) > 0) { ctx.strokeStyle = "#ff7a9a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(m.x, m.y - 10); ctx.lineTo(m.x + Math.cos(m.tongue.a) * 180, m.y - 10 + Math.sin(m.tongue.a) * 180); ctx.stroke(); }
    if (m.act) glow(m.x, m.y - 10, 24, "140,255,110", 0.3 + 0.2 * Math.sin(time * 20));
    return;
  }
  const saved = boss;
  boss = { x: 0, y: 0, r: 30, flash: m.flash, phase: m.phase >= 2 ? 2 : 1, state: m.act ? "cast" : "idle" };
  ctx.save(); ctx.translate(Math.round(m.x), Math.round(m.y - 6)); ctx.scale(0.62, 0.62);
  try { drawBoss(); } finally { boss = saved; }
  ctx.restore();
  if (m.act && m.act !== "rain") glow(m.x, m.y - 10, 26, "255,80,40", 0.35 + 0.2 * Math.sin(time * 20));
}
function drawWBossBar() { // 畫面上方的王血條
  const m = W0.mobs.find((o) => o.boss); if (!m) return;
  const R = rbOf(m);
  const bw = Math.min(260, W * 0.62), x = (W - bw) / 2, y = W <= 600 ? 168 : 60;
  ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(x - 3, y - 3, bw + 6, 14);
  ctx.fillStyle = "#2a1a1a"; ctx.fillRect(x, y, bw, 8);
  ctx.fillStyle = R.bar[Math.min(2, m.phase - 1)]; ctx.fillRect(x, y, bw * Math.max(0, m.hp / m.max), 8);
  ctx.font = "bold 11px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#ffe0c0";
  ctx.fillText(`${R.n} Lv.${m.lv}　${Math.max(0, Math.ceil(m.hp))} / ${m.max}`, W / 2, y + 22);
}
// 王專屬傳說（不會在一般掉落、碎屑兌換出現）
function rbUnique(u, il) {
  const it = rollItem(1, il), U = UNIQUES[u], bv = BASE_VAL[SLOTS[U.slot].base];
  it.slot = U.slot; it.u = u; it.q = 3; if (U.slot === "sword") it.wt = U.wt; else delete it.wt;
  it.base = Math.round((bv[0] + bv[1] * il) * 2); rollAffixes(it, 1 + Math.floor(Math.random() * 4));
  nameItem(it); delete it.risk; return it;
}
function wbKilled(m) { // 打倒區域王
  const k = m.rb || "volcano", R = RBOSS[k], w = save.w;
  if (!W0.rbCool) W0.rbCool = {};
  W0.rbCool[k] = R.cool; wbZones = [];
  if (!w.rbK) w.rbK = {};
  w.rbK[k] = (w.rbK[k] || 0) + 1;
  shake = 12; flashT = 0.2; flashColor = "255,220,150"; sfx("win");
  floatText(m.x, m.y - 40, `擊敗${R.n}！`, "#ffe066", true);
  const il = Math.floor(R.lv / 3) + 2; // 掉落等級看王的等級，不看玩家：高等回來刷沒有好處
  const item = (it) => { delete it.risk; wDrop({ kind: "item", it, safe: true }, m); };
  if (k === "volcano") {
    if (Math.random() < 0.25) addSup(Object.keys(SUPERS)[Math.floor(Math.random() * 3)]);
    if (Math.random() < 0.15) wDrop({ kind: "card", c: "wboss" }, m);
    for (let i = 0; i < 3; i++) wDrop({ kind: "ess", k: randEss() }, m);
    for (let i = 0; i < 4; i++) item(rollItem(1, il));
    for (let i = 0; i < 2; i++) wDrop({ kind: "gem", g: randGem(Math.random() < 0.3 ? 2 : 1) }, m);
    questEvent("boss");
  } else if (k === "swamp") {
    let best = null; for (let i = 0; i < 30 && !(best && best.q >= 2); i++) best = rollItem(1, il); // 保底 1 件玄品以上
    item(best); for (let i = 0; i < 2; i++) item(rollItem(1, il));
    if (Math.random() < 0.12) { item(rbUnique("toadrobe", il)); floatText(m.x, m.y - 56, "傳說！萬毒蟾衣", "#ff8a3d", true); }
    if (Math.random() < 0.1) wDrop({ kind: "card", c: "rbswamp" }, m);
    for (let i = 0; i < 2; i++) wDrop({ kind: "ess", k: randEss() }, m);
    wDrop({ kind: "gem", g: randGem(Math.random() < 0.3 ? 2 : 1) }, m);
  }
  wDrop({ kind: "stone", v: 80 + R.lv * 3 }, m);
  writeSave();
}
