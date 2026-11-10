// 萬劍仙途 — 秘境「天命祭壇」：二選一的誘餌與毒藥（企劃 51，總表第 39 項，v9.5）
// 每張秘境 0–2 座祭壇（跟 5 種事件分開算）。走過去跳二選一：【對象＋懲罰 → 獎勵】，兩個選項的對象不同，也可以不選。
// 效果只在這張秘境（存在 RIFT.fate，不寫進存檔，RIFT 結束就沒了）。
// 原則（使用者）：①你的懲罰砍防禦（抗性走 resPen 一起扣、先扣再封頂）②小怪只加傷害／速度／元素，不加血 ③獎勵＝指定種類多掉 1 個，不加全部掉落率。
// 要在 atlas.js 後面載入（輿圖天賦加「天命」）。
"use strict";

const FATE_TGT = { mob: { n: "小怪", c: "#9fdcff" }, you: { n: "你", c: "#ffb37a" }, boss: { n: "秘境之主", c: "#ff7a9a" } };
// 懲罰：t＝對象；同一條第二次只算一半（兩座最多 1.5 倍）
const FATE_PEN = {
  m_dmg: { t: "mob", n: "小怪傷害 +25%", v: 0.25 },
  m_spd: { t: "mob", n: "小怪移速 +20%", v: 0.2 },
  m_ele: { t: "mob", n: (o) => `小怪攻擊附帶 +30% ${RES_S[o.e]}傷害`, v: 0.3, e: 1 },
  m_pool: { t: "mob", n: "小怪死掉留下小毒池", v: 1 },
  m_elite: { t: "mob", n: "精英多 1 個詞綴", v: 1 },
  y_res: { t: "you", n: "你的四抗 −20%", v: 0.2 },
  y_arm: { t: "you", n: "你的護甲 −30%", v: 0.3 },
  y_cast: { t: "you", n: "你每放一招扣 1% 生命", v: 0.01 },
  y_noreg: { t: "you", n: "你不能自然回血", v: 1 },
  y_pot: { t: "you", n: "丹藥冷卻 +4 秒", v: 4 },
  y_roll: { t: "you", n: "閃身冷卻 +50%", v: 0.5 },
  b_dmg: { t: "boss", n: "秘境之主傷害 +40%", v: 0.4 },
  b_spd: { t: "boss", n: "秘境之主移速 +25%", v: 0.25 },
  b_tj: { t: "boss", n: (o) => `秘境之主多一個天劫詞綴「${TJ_MODS[o.tj].n}」（${TJ_MODS[o.tj].d}）`, v: 1, tj: 1 },
  b_call: { t: "boss", n: "秘境之主半血時叫一群精英", v: 1 },
  b_hp: { t: "boss", n: "秘境之主血量 +50%", v: 0.5 },
};
const FATE_REW = {
  r_cur: { t: "mob", n: "小怪死掉 2% 多掉 1 個通貨", v: 0.02 },
  r_ess: { t: "mob", n: "小怪死掉 1% 多掉 1 個精髓", v: 0.01 },
  r_gem: { t: "mob", n: "小怪死掉 0.5% 多掉 1 顆輔助寶石", v: 0.005 },
  r_exp: { t: "mob", n: "這張秘境經驗 +30%", v: 0.3 },
  r_purp: { t: "you", n: "精英死掉 25% 多掉 1 件紫裝", v: 0.25 },
  r_lordp: { t: "you", n: "秘境之主多掉 2 件紫裝", v: 2 },
  r_jw: { t: "you", n: "天賦玉掉率 ×3", v: 2 },
  r_mat: { t: "you", n: "秘境之主多掉 3 個稀有素材", v: 3 },
  r_leg: { t: "boss", n: "秘境之主 25% 多掉 1 件傳說＋保底紫裝 2 件", v: 0.25 },
  r_key2: { t: "boss", n: "秘境之主必掉高 2 層的鑰匙", v: 1 },
  r_card: { t: "boss", n: "秘境之主的王卡掉率 ×5", v: 4 },
  r_cur2: { t: "boss", n: "秘境之主多掉 1 個造化玉或淬靈石", v: 1 },
};
const FATE_TJ = ["rage", "call", "pool", "zap", "iron"];
const FATE_STACK = 1.5; // 同一條疊兩次最多 1.5 倍
const fateTxt = (o) => { const P = FATE_PEN[o.pen]; return typeof P.n === "function" ? P.n(o) : P.n; };
const fateRewTxt = (o) => FATE_REW[o.rew].n;
// 這張秘境目前的效果
const fateOn = () => typeof RIFT !== "undefined" && RIFT && RIFT.fate;
function fateN(k) { // 懲罰／獎勵的強度倍數（第一次 1、第二次 +0.5）
  const F = fateOn(); if (!F) return 0;
  const n = F.took.filter((o) => o.pen === k || o.rew === k).length;
  return n <= 0 ? 0 : Math.min(FATE_STACK, 1 + 0.5 * (n - 1));
}
const fateV = (k) => fateN(k) * ((FATE_PEN[k] || FATE_REW[k]).v);
const fateHas = (k) => fateN(k) > 0;
const fateEles = () => { const F = fateOn(); return F ? F.took.filter((o) => o.pen === "m_ele").map((o) => o.e) : []; };
const fateTjs = () => { const F = fateOn(); return F ? F.took.filter((o) => o.pen === "b_tj").map((o) => o.tj) : []; };

// ───────── 出現：每張 50% 1 座、15% 2 座（第 11 層以上 60%／25%）；輿圖天賦「天命」每點 +10% ─────────
if (typeof TAL !== "undefined") TAL.fate = { n: "天命", c: "#ff9ad8", d: (l) => `天命祭壇出現機率 +${l * 10}%` };
function fateCount(tier) {
  const hi = tier >= 11, p2 = hi ? 0.25 : 0.15, p1 = (hi ? 0.6 : 0.5) + 0.1 * (typeof talLv === "function" ? talLv("fate") : 0), r = Math.random();
  return r < p2 ? 2 : r < p2 + p1 ? 1 : 0;
}
function fatePlace(R) {
  const all = () => (R.evs || []).concat(R.fate.alt);
  let pos = null;
  for (let i = 0; i < 900 && !pos; i++) {
    const p = riftT2W(6 + Math.floor(Math.random() * (RIFT_IW - 12)), 5 + Math.floor(Math.random() * (RIFT_IH - 10)));
    if (!R.reach[evIdx(p.x, p.y)] || blockedCircle(p.x, p.y, 10)) continue;
    if (Math.hypot(p.x - R.ent.x, p.y - R.ent.y) < 200 || Math.hypot(p.x - R.boss.x, p.y - R.boss.y) < 260 || R.pts.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 80)) continue;
    if (all().some((e) => Math.hypot(e.x - p.x, e.y - p.y) < (i < 600 ? 300 : 160))) continue;
    pos = p;
  }
  if (!pos) return;
  clearAround(pos.x, pos.y, 2);
  R.fate.alt.push({ x: pos.x, y: pos.y, st: "idle", opts: null });
}
const _riftEnterFate = riftEnter;
riftEnter = function () {
  _riftEnterFate.apply(this, arguments);
  if (!RIFT || RIFT.fate) return;
  const R = RIFT; R.fate = { alt: [], took: [], boss: false };
  const n = fateCount(R.tier || 1);
  for (let i = 0; i < n; i++) fatePlace(R);
  if (R.fate.alt.length) setTimeout(() => { if (RIFT === R) notice(`這張秘境有 ${R.fate.alt.length} 座天命祭壇（小地圖紅點）：走過去二選一，賭懲罰換獎勵`, "#ff9ad8"); }, 2600);
};

// ───────── 選項：兩個對象不同；王出來以後沒有王的選項；同一座祭壇兩條懲罰不一樣 ─────────
function fateRoll() {
  const F = fateOn(), tgts = ["mob", "you"].concat(F.boss ? [] : ["boss"]);
  const ts = tgts.sort(() => Math.random() - 0.5).slice(0, 2);
  return ts.map((t) => {
    const pens = Object.keys(FATE_PEN).filter((k) => FATE_PEN[k].t === t && fateN(k) < FATE_STACK), rews = Object.keys(FATE_REW).filter((k) => FATE_REW[k].t === t);
    const o = { t, pen: pens[Math.floor(Math.random() * pens.length)], rew: rews[Math.floor(Math.random() * rews.length)] };
    if (o.pen === "m_ele") o.e = ELES[Math.floor(Math.random() * ELES.length)];
    if (o.pen === "b_tj") { const left = FATE_TJ.filter((x) => !fateTjs().includes(x)); o.tj = left[Math.floor(Math.random() * left.length)] || "rage"; }
    return o;
  });
}
function fateAsk(A) {
  if (!A.opts) A.opts = fateRoll();
  A.st = "ask";
  const row = (o) => `<b style="color:${FATE_TGT[o.t].c}">【${FATE_TGT[o.t].n}】</b>${fateTxt(o)}<br>→ <span style="color:#ffe066">${fateRewTxt(o)}</span>`;
  evDialog("天命祭壇", `選一個（只在這張秘境有效）：<br><br>A　${row(A.opts[0])}<br><br>B　${row(A.opts[1])}`, [
    { t: "選 A", cls: "gold", f: () => fateTake(A, A.opts[0]) },
    { t: "選 B", cls: "gold", f: () => fateTake(A, A.opts[1]) },
    { t: "不選", f: () => { A.st = "skip"; } },
  ]);
}
function fateTake(A, o) {
  const F = fateOn(); if (!F) return;
  A.st = "done"; F.took.push(o); sfx("crit"); shake = 5;
  floatText(A.x, A.y - 30, `天命：${fateTxt(o)}`, "#ff9ad8", true);
  if (o.t === "you") { B = worldStats(); W0.maxHp = B.maxHp; }
  fateMobs(true);
}

// ───────── 小怪：傷害、移速（乘在 m.dmgMul／m.spdMul，記下原本的值）；精英多 1 個詞綴 ─────────
function fateMobs(force) {
  const F = fateOn(); if (!F) return;
  const ver = F.took.length;
  for (const m of W0.mobs) {
    if (m.dead || !m.rift || (m.fv === ver && !force)) continue;
    if (m.dm0 === undefined) { m.dm0 = m.dmgMul || 1; m.sp0 = m.spdMul || 1; }
    if (m.boss) { if (m.R) { if (m.R.dm0 === undefined) m.R.dm0 = m.R.dmgMul || 1; m.R.dmgMul = m.R.dm0 * (1 + fateV("b_dmg")); } m.spdMul = m.sp0 * (1 + fateV("b_spd")); }
    else {
      m.dmgMul = m.dm0 * (1 + fateV("m_dmg")); m.spdMul = m.sp0 * (1 + fateV("m_spd"));
      if (fateHas("m_elite") && m.elite && !m.mod2 && m.emk) { const p = ELITE_NEW.filter((x) => x !== m.mod); m.mod2 = p[Math.floor(Math.random() * p.length)]; }
    }
    m.fv = ver;
  }
}

// ───────── 你：四抗（resPen 一起扣）、護甲、自然回血、閃身冷卻（worldStats）；每招扣血、丹藥冷卻 ─────────
const _resPenFate = resPen;
resPen = function () { return _resPenFate.apply(this, arguments) + fateV("y_res"); };
const _worldStatsFate = worldStats;
worldStats = function () {
  const b = _worldStatsFate.apply(this, arguments);
  if (!fateOn()) return b;
  if (fateHas("y_arm")) b.armor = (b.armor || 0) * Math.max(0, 1 - fateV("y_arm")); // 護甲沒有獨立的「增加」池（atlas 防禦也是直接乘），這裡是唯一一層
  if (fateHas("y_noreg")) b.regen = 0;
  if (fateHas("y_roll")) b.rollCd = (b.rollCd || 1) * (1 + fateV("y_roll"));
  return b;
};
const _skillUsedFate = skillUsed;
skillUsed = function (k) {
  const r = _skillUsedFate.apply(this, arguments);
  if (fateOn() && W0) {
    if (k === "potion") { if (fateHas("y_pot")) W0.fatePot = true; }
    else if (k !== "roll" && fateHas("y_cast") && !B.bloodMagic) { const p = W0, c = Math.round(p.maxHp * fateV("y_cast")); if (p.hp > c + 1) { p.hp -= c; p.hurt = Math.max(p.hurt, 0.05); } }
  }
  return r;
};
// 小怪附帶元素：打中了（生命或護盾真的有少）才再扣 30% 該元素傷害，照你的抗性（effRes）算
const _hurtWFate = hurtW;
hurtW = function (dmg, from, kind) {
  const p = W0, F = fateOn(), es = fateEles();
  if (!F || !es.length || !from || !from.rift || from.boss || !p) return _hurtWFate.apply(this, arguments);
  const h0 = p.hp, s0 = p.es || 0;
  const r = _hurtWFate.apply(this, arguments);
  if (p.hp < h0 || (p.es || 0) < s0) {
    let add = 0; for (const e of es) add += dmg * FATE_PEN.m_ele.v * Math.max(0, 1 - effRes(e));
    add = Math.round(add); if (add > 0) { p.hp = Math.max(1, p.hp - add); floatText(p.x + 6, p.y - 22, `-${add}`, ELE_C[es[0]] || "#ff9ad8"); }
  }
  return r;
};

// ───────── 秘境之主：傷害、移速（fateMobs）、血量、天劫詞綴、半血叫精英 ─────────
const _riftSpawnBossFate = riftSpawnBoss;
riftSpawnBoss = function () {
  _riftSpawnBossFate.apply(this, arguments);
  const F = fateOn(); if (!F) return;
  F.boss = true;
  const m = W0.mobs.find((x) => x.boss && x.R && !x.dead); if (!m) return;
  if (fateHas("b_hp")) { const k = 1 + fateV("b_hp"); m.hp *= k; m.max *= k; } // hv2（dmg2.js）之後還會再乘一次 DMG_REF，比例不變
  const tjs = fateTjs(); if (tjs.length) { m.fateTj = tjs; m.fateTjT = { call: 20, pool: 3.5, zap: 4 }; m.R.n = `天命・${m.R.n}`; }
  fateMobs(true);
};
const _hitMobFate = hitMob;
hitMob = function (m, dmg) {
  if (m && m.fateTj && m.fateTj.includes("iron")) arguments[1] = dmg * 0.7;
  return _hitMobFate.apply(this, arguments);
};
function fateBossTick(m, dt) {
  if (m.fateTj) { const o = m.tj, oT = m.tjT; m.tj = m.fateTj; m.tjT = m.fateTjT; try { tjTick(m, dt); } finally { m.tj = o; m.tjT = oT; } } // 借天劫王的詞綴邏輯，但不設 m.tj（不然會被當成天劫王：扣抗 60%、受傷 ×1.3）
  if (fateHas("b_call") && !m.fateCalled && m.hp < m.max * 0.5) {
    m.fateCalled = true; floatText(m.x, m.y - 50, "天命：精英來援！", "#ff7a9a", true); sfx("crit");
    const n = Math.round(4 * fateN("b_call"));
    for (let i = 0; i < n; i++) { const q = evRing(m.x, m.y, 70); const a = evSpawn(q.x, q.y, { elite: true }); a.st = "chase"; burst(a.x, a.y, "#ff7a9a", 12, 70); }
  }
}

// ───────── 每幀：靠近祭壇問、小怪套效果、王的詞綴、丹藥冷卻 ─────────
const _updateWorldFate = updateWorld;
updateWorld = function (dt) {
  _updateWorldFate.apply(this, arguments);
  const F = fateOn(); if (!F || state !== "world" || !W0) return;
  const p = W0;
  for (const A of F.alt) {
    const d = Math.hypot(p.x - A.x, p.y - A.y);
    if (A.st === "idle" && d < 20 && !evAskEl && !(typeof ovKind !== "undefined" && ovKind)) fateAsk(A);
    if ((A.st === "skip" || A.st === "ask") && d > 60) { if (A.st === "ask" && evAskEl) { evAskEl.remove(); evAskEl = null; } A.st = "idle"; }
    if (A.st === "idle" && A.opts && A.opts.some((o) => o.t === "boss") && F.boss) A.opts = null; // 王出來了：重抽（沒有王的選項）
  }
  fateMobs(false);
  for (const m of W0.mobs) if (!m.dead && m.boss && m.rift) fateBossTick(m, dt);
  if (W0.fatePot) { W0.fatePot = false; p.cds.potion = (p.cds.potion || 0) + fateV("y_pot"); W0.potCd = Math.max(W0.potCd || 0, p.cds.potion); }
};

// ───────── 獎勵：指定種類多掉 1 個 ─────────
const fateIl = () => Math.floor(RIFT.lv / 3) + 1;
const fatePurple = () => { let it = null; for (let i = 0; i < 40 && !(it && it.q >= 2); i++) it = rollItem(1, fateIl()); return it; };
const _killMobFate = killMob;
killMob = function (m) {
  const was = m.dead;
  _killMobFate.apply(this, arguments);
  const F = fateOn(); if (!F || was || !m.dead || !m.rift || m.boss || m.sum) return;
  if (WMOBS[m.type] && WMOBS[m.type].ai === "pillar") return;
  if (fateHas("m_pool")) addPool(m.x, m.y, 14, 3, mobDmg(m, WMOBS[m.type]) * 0.2, 0.5);
  const roll = (k) => fateHas(k) && Math.random() < fateV(k);
  if (roll("r_cur")) wDrop({ kind: "cur", c: randCur() }, m);
  if (roll("r_ess")) wDrop({ kind: "ess", k: randEss() }, m);
  if (roll("r_gem")) wDrop({ kind: "gem", g: randGem(1) }, m);
  if (m.elite && roll("r_purp")) wDropItem(fatePurple(), m);
  if (m.elite && fateHas("r_jw") && typeof jwGive === "function" && Math.random() < JW_ELITE * fateV("r_jw")) jwGive(jwRoll(1, 0.02), m); // 原本 JW_ELITE，再多 2 倍＝×3
};
const _gainExpFate = gainExp;
gainExp = function (n) { if (fateHas("r_exp")) n = Math.round(n * (1 + fateV("r_exp"))); return _gainExpFate.call(this, n); };
const _riftBossKilledFate = riftBossKilled;
riftBossKilled = function (m) {
  _riftBossKilledFate.apply(this, arguments);
  const F = fateOn(); if (!F || !m) return;
  const R = RIFT, n2 = (k) => Math.round(fateV(k));
  for (let i = 0; i < n2("r_lordp"); i++) wDropItem(fatePurple(), m);
  if (fateHas("r_jw") && typeof jwGive === "function" && Math.random() < 0.4 * fateV("r_jw")) jwGive(jwRoll(1, 0.04), m);
  if (fateHas("r_mat") && MAT_Z[R.theme]) for (let i = 0; i < n2("r_mat"); i++) wDrop({ kind: "mat", k: MAT_Z[R.theme][1] }, m);
  if (fateHas("r_leg")) {
    for (let i = 0; i < 2; i++) wDropItem(fatePurple(), m);
    if (Math.random() < fateV("r_leg")) { let it = null; for (let i = 0; i < 400 && !(it && it.q === 3); i++) it = rollItem(1, fateIl()); if (it && it.q === 3) wDropItem(it, m); }
  }
  if (fateHas("r_key2")) wDrop({ kind: "key", k: makeKey(Math.min(R.tier + 2, riftCap())) }, m);
  if (fateHas("r_card")) { const c = (typeof BOOK_BOSS_CARD !== "undefined" && BOOK_BOSS_CARD[m.rb]) || (CARDS[m.type] ? m.type : null); if (c && Math.random() < 0.08 * fateV("r_card")) wDrop({ kind: "card", c }, m); }
  if (fateHas("r_cur2")) for (let i = 0; i < n2("r_cur2"); i++) wDrop({ kind: "cur", c: Math.random() < 0.5 ? "divine" : "exalt" }, m);
};
// 離開秘境：你的數值重算（懲罰跟著 RIFT 一起消失）
const _riftLeaveFate = riftLeave;
riftLeave = function () { const had = fateOn() && fateOn().took.some((o) => o.t === "you"); const r = _riftLeaveFate.apply(this, arguments); if (had && W0) { B = worldStats(); W0.maxHp = B.maxHp; } return r; };

// ───────── 畫面：石台、小地圖紅點、狀態欄圖示＋效果清單 ─────────
const _drawCampsFate = drawCamps;
drawCamps = function () {
  _drawCampsFate.apply(this, arguments);
  const F = fateOn(); if (!F) return;
  ctx.save();
  for (const A of F.alt) {
    const used = A.st === "done", c = used ? "150,150,150" : "255,120,200", pu = used ? 0 : 0.5 + 0.5 * Math.sin(time * 4);
    ctx.fillStyle = `rgba(${c},${0.18 + 0.15 * pu})`; ctx.beginPath(); ctx.ellipse(A.x, A.y + 2, 16, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#3a2a3e"; ctx.fillRect(A.x - 9, A.y - 6, 18, 8); ctx.fillStyle = "#5a4260"; ctx.fillRect(A.x - 7, A.y - 9, 14, 3);
    ctx.strokeStyle = `rgba(${c},${0.6 + 0.4 * pu})`; ctx.lineWidth = 1; ctx.strokeRect(A.x - 9 + 0.5, A.y - 6 + 0.5, 17, 7);
    if (!used) { ctx.fillStyle = `rgba(255,170,230,${0.5 + 0.5 * pu})`; ctx.beginPath(); ctx.arc(A.x, A.y - 15, 3 + pu, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = "bold 8px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(0,0,0,0.8)";
    const lab = used ? "天命祭壇（已選）" : "天命祭壇"; ctx.strokeText(lab, A.x, A.y - 22); ctx.fillStyle = `rgb(${c})`; ctx.fillText(lab, A.x, A.y - 22);
  }
  ctx.restore();
};
const _drawWorldHudFate = drawWorldHud;
drawWorldHud = function () {
  _drawWorldHudFate.apply(this, arguments);
  const F = fateOn(); if (!F) return;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const mw = Math.min(104, W * 0.26), mx0 = W - mw - 12 - SAFE.r, my0 = 58 + SAFE.t, sc = mw / (RIFT_IW * TS);
  for (const A of F.alt) if (A.st !== "done") { const a = mx0 + (A.x - RIFT_IX0 * TS) * sc, b = my0 + (A.y - RIFT_IY0 * TS) * sc; ctx.fillStyle = `rgba(255,110,200,${0.6 + 0.4 * Math.sin(time * 6)})`; ctx.fillRect(a - 2.5, b - 2.5, 5, 5); }
  if (!F.took.length) return;
  // 效果清單：事件列下面
  const bw = Math.min(220, W * 0.5), bx = 10 + SAFE.l, by0 = 10 + SAFE.t + (curQuest() ? 94 : 50) + (riskyItems().length ? 22 : 0) + 42 + (RIFT.evs ? RIFT.evs.length : 0) * 17;
  ctx.textAlign = "left"; ctx.font = "bold 8px 'Noto Sans TC', sans-serif";
  F.took.forEach((o, i) => {
    const y = by0 + i * 26; ctx.fillStyle = "rgba(30,8,28,0.72)"; ctx.fillRect(bx, y, bw, 24);
    ctx.fillStyle = FATE_TGT[o.t].c; ctx.fillText(`命・${FATE_TGT[o.t].n}：${fateTxt(o)}`.slice(0, 30), bx + 6, y + 10);
    ctx.fillStyle = "#ffe066"; ctx.fillText(`→ ${fateRewTxt(o)}`.slice(0, 30), bx + 6, y + 20);
  });
};
STATUS.push({ k: "fate", g: "命", c: "#ff9ad8", on: () => !!(fateOn() && fateOn().took.length), txt: () => `${fateOn().took.length}` });
