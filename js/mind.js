// 萬劍仙途 — 總表第 10 項（企劃 20）：心法大節點（每轉二選一）、精英詞綴 8 種（深區雙詞綴）、區域王天劫版（天劫印）
// codex.js 後面載入；包住 jobStats、hitMob、killMob、hurtW、updateWorld、guardLinks、drawCamps、openSpot、renderSkills、writeSave
"use strict";

// ───────── 1. 心法大節點：一轉～四轉各一組二選一，在城裡／營地結界免費換 ─────────
const KEYSTONE = {
  1: [
    { k: "kuang", n: "狂心", c: "#ff5a6a", d: "不能喝丹藥；吸血 ×3，再加 1%", f: (b) => { b.leech = ((b.leech || 0) + 0.01) * 3; } },
    { k: "jianyi", n: "劍意", c: "#7aa8ff", d: "真氣不會自己回；每打中一下回 3 真氣", f: (b) => { b.mpRegen = 0; } },
  ],
  2: [
    { k: "guzhu", n: "孤注", c: "#ff9a4a", d: "生命上限 −30%；攻擊 +25%", f: (b) => { b.maxHp = Math.round(b.maxHp * 0.7); b.more *= 1.25; } },
    { k: "panshi", n: "磐石", c: "#d8c8a0", d: "受到的傷害 −20%；移動速度 −12%", f: (b) => { b.spdMul *= 0.88; } },
  ],
  3: [
    { k: "wuxin", n: "無心", c: "#9fffc8", d: "不會爆擊；攻擊 +35%", f: (b) => { b.crit = -9; b.more *= 1.35; } },
    { k: "huixin", n: "會心", c: "#ffe066", d: "爆擊率 +12%、爆擊傷害 +40%；攻擊 −15%", f: (b) => { b.crit = (b.crit || 0) + 0.12; b.critDmg = (b.critDmg || 2) + 0.4; b.more *= 0.85; } },
  ],
  4: [
    { k: "tiandao", n: "天道", c: "#c8a0ff", d: "E 招冷卻 −30%；攻擊 −10%", f: (b) => { b.eCd = (b.eCd || 1) * 0.7; b.more *= 0.9; } },
    { k: "shayi", n: "殺意", c: "#ff6b6b", d: "E 招真氣 ×1.5；每殺一隻攻擊 +3%（5 秒，最多 10 層）", f: (b) => { b.eMp = (b.eMp || 1) * 1.5; } },
  ],
};
const ksOf = (t) => (save.w && save.w.ks && save.w.ks[t]) || null;
// v6.7：技能點拿掉，只看轉職
// v7.2：大節點搬到天賦樹最外圈（tree.js），點了就生效
const ksOn = (k) => !!save.w && typeof treeHasKs === "function" && treeHasKs(k);
const ksDef = (k) => { for (const t in KEYSTONE) for (const o of KEYSTONE[t]) if (o.k === k) return o; return null; };
const _jobStatsM = jobStats;
jobStats = function (b) {
  b = _jobStatsM(b);
  for (const t in KEYSTONE) for (const o of KEYSTONE[t]) if (ksOn(o.k)) o.f(b);
  return b;
};
function ksHtml(t) {
  const j = jobLv(), gate = j >= t && typeof skGateOk === "function" && !skGateOk(t), lock = j < t || gate, cur = ksOf(t), here = W0 && safeAt(W0.x, W0.y);
  const cards = KEYSTONE[t].map((o) => `<button class="kscard${cur === o.k ? " on" : ""}" data-ks="${t}:${o.k}" style="--c:${o.c}" ${lock ? "disabled" : ""}><b>${o.n}</b><small>${o.d}</small>${cur === o.k ? (gate ? "<i>補點後生效</i>" : "<i>使用中</i>") : ""}</button>`).join("");
  return `<div class="ksbox"><div class="kshead">大節點・二選一<small>${j < t ? "轉職後開放" : gate ? `前面還要再點 ${SK_NEED[t] - spBelow(t)} 點${cur ? "（選了的會在補到後生效）" : ""}` : cur ? (here ? "點另一張可以換（免費）" : "在城裡或營地結界裡才能換") : "選一個（免費，在城裡或營地結界裡可以換）"}</small></div><div class="ksrow">${cards}</div></div>`;
}
const _renderSkillsM = renderSkills;
renderSkills = function (msg) {
  _renderSkillsM.apply(this, arguments);
  if (skTab !== "ks" || !ov) return;
  const box = ov.querySelector(".ksall"); if (!box) return;
  box.innerHTML = Object.keys(KEYSTONE).map((t) => `<div class="kst"><small>${JOBS[t - 1].n}（Lv.${JOBS[t - 1].lv}）</small>${ksHtml(+t)}</div>`).join("");
  ov.querySelectorAll("[data-ks]").forEach((b) => b.addEventListener("click", () => {
    const [t, k] = b.dataset.ks.split(":"), w = save.w; w.ks = w.ks || {};
    if (w.ks[t] === k) return;
    if (jobLv() < +t) { sfx("bad"); renderSkills("轉職後才能選這組大節點"); return; }
    if (w.ks[t] && !(W0 && safeAt(W0.x, W0.y))) { sfx("bad"); renderSkills("在城裡或營地結界裡才能換大節點"); return; }
    w.ks[t] = k; writeSave(); sfx("good");
    B = worldStats(); if (W0) { W0.maxHp = B.maxHp; W0.hp = Math.min(W0.hp, B.maxHp); }
    renderSkills(`大節點：${ksDef(k).n}`);
  }));
};

// ───────── 2. 精英詞綴 8 種：深區（沼澤、雷谷、仙域，秘境 Lv.50 以上）從 8 種抽，30% 雙詞綴 ─────────
const ELITE_NEW = ["毒池", "雷擊", "護主", "瞬影", "不死", "急襲"];
const ELITE_ALL = ELITE_MODS.concat(ELITE_NEW);
const eHas = (m, k) => m.mod === k || m.mod2 === k || m.mod3 === k;
const deepMob = (m) => (typeof RIFT !== "undefined" && RIFT ? m.lv >= 50 : ["swamp", "thunder", "sky"].includes(m.camp && m.camp.z));
function eliteRoll(m) {
  m.emk = 1;
  if (!m.elite || m.boss || m.hunter || m.mod2 || !deepMob(m)) return;
  m.mod = ELITE_ALL[Math.floor(Math.random() * ELITE_ALL.length)];
  if (Math.random() < 0.3) { const p = ELITE_NEW.filter((x) => x !== m.mod); m.mod2 = p[Math.floor(Math.random() * p.length)]; }
}
function eliteTick(m, dt) {
  const d = WMOBS[m.type], dp = dist(m, W0);
  if (m.zapCd > 0) m.zapCd -= dt;
  if (m.st !== "chase" || dp > 320) return;
  if (eHas(m, "毒池")) { // 走過的地方留毒
    m.poolT = (m.poolT || 0) - dt;
    if (m.poolT <= 0 && Math.hypot(m.x - (m.px0 || 0), m.y - (m.py0 || 0)) > 10) { m.poolT = 1.1; m.px0 = m.x; m.py0 = m.y; addPool(m.x, m.y, 15, 4, Math.max(1, mobDmg(m, d) * 0.22), 0.5); seenHint("epool", "毒池精英：走過的地方會留毒，別跟在牠後面"); }
  }
  if (eHas(m, "急襲") && !m.mv && !(m.wind > 0) && !m.fuse) { // 企劃 28：每 5 秒照紅色長條衝過來一次（可以閃）
    m.rushT = (m.rushT == null ? 2 + Math.random() * 3 : m.rushT) - dt;
    if (m.rushT <= 0 && dp > 50 && dp < 180) { m.rushT = 5; mvStart(m, "rush", angTo(m, W0), Math.min(dp + 30, 170), 0.5); }
  }
  if (eHas(m, "瞬影")) { // 每 5 秒閃到你身邊，閃完 0.6 秒不出手
    m.blinkT = (m.blinkT == null ? 2 + Math.random() * 3 : m.blinkT) - dt;
    if (m.blinkT <= 0 && dp > 60) {
      m.blinkT = 5; burst(m.x, m.y, "#b07dff", 12, 70, 0.4);
      for (let i = 0; i < 8; i++) { const a = Math.random() * Math.PI * 2, tx = W0.x + Math.cos(a) * 34, ty = W0.y + Math.sin(a) * 22; if (!blockedCircle(tx, ty, d.r)) { m.x = tx; m.y = ty; break; } }
      m.atkT = Math.max(m.atkT || 0, 0.6); m.wind = 0; burst(m.x, m.y, "#b07dff", 12, 70, 0.4); sfx("roll");
      seenHint("eblink", "瞬影精英：會閃到你身邊，閃完有一下空檔");
    }
  }
}
// 護主：身邊 110 內的怪連金線、受傷 −50%（跟天兵石像一樣，先打牠）
const _guardLinksM = guardLinks;
guardLinks = function () {
  _guardLinksM.apply(this, arguments);
  for (const g of W0.mobs) {
    if (g.dead || !g.elite || !eHas(g, "護主") || Math.abs(g.x - W0.x) > 420 || Math.abs(g.y - W0.y) > 420) continue;
    const near = W0.mobs.filter((o) => o !== g && !o.dead && !o.boss && !o.gd && dist(o, g) < 110).sort((a, b) => dist(a, g) - dist(b, g)).slice(0, 5);
    for (const o of near) o.gd = g;
    if (near.length && dist(g, W0) < 150) seenHint("eguard", "護主精英：身邊的妖怪受傷 −50%，先打牠");
  }
};

// ───────── 3. 區域王天劫版：天劫印召喚（Lv.130、多 1–3 個王詞綴、傳說機率 ×3）─────────
CUR.tjseal = { n: "天劫印", g: "印", c: "#ff7ad8", r: 0, d: "到打倒過的區域王祭壇召喚天劫版：Lv.130、多 1–3 個王詞綴、掉落等級 130、傳說機率 ×3。秘境第 8 層以上的秘境之主會掉" };
if (!CUR_KEYS.includes("tjseal")) CUR_KEYS.push("tjseal");
const TJ_LV = 130;
const TJ_MODS = {
  rage: { n: "狂暴", d: "出招更快" },
  iron: { n: "鐵壁", d: "受傷 −30%" },
  call: { n: "召喚", d: "每 20 秒叫 3 隻小妖" },
  pool: { n: "毒池", d: "每 3.5 秒在你腳下留毒池" },
  zap: { n: "雷擊", d: "每 4 秒在你身邊落雷" },
};
const tjBoss = () => W0 && W0.mobs.find((m) => m.tj && !m.dead);
function startTianjie(k) {
  if (!rbKilled(k) || W0.mobs.some((m) => m.boss)) return "現在不能召喚";
  if (rbCool(k) > 0) return `還在沉睡（${Math.ceil(rbCool(k))} 秒）`;
  if (curN("tjseal") < 1) return "沒有天劫印（秘境第 8 層以上的秘境之主會掉）";
  startWorldBossField(k);
  const m = W0.mobs.find((x) => x.boss && x.rb === k && !x.dead && !x.R); if (!m) return "召喚失敗";
  useCur("tjseal"); writeSave();
  const R = RBOSS[k], keys = Object.keys(TJ_MODS), r = Math.random(), n = r < 0.4 ? 1 : r < 0.8 ? 2 : 3;
  m.tj = keys.sort(() => Math.random() - 0.5).slice(0, n);
  m.lv = TJ_LV; m.hp = m.max = Math.round(Math.max(R.hp, RBOSS.sky.hp) * 2 * (1 + 0.25 * (n - 1)));
  m.tjT = { call: 20, pool: 3.5, zap: 4 };
  shake = 14; flashT = 0.25; flashColor = "255,90,200";
  floatText(m.x, m.y - 58, `天劫・${R.n}（${m.tj.map((x) => TJ_MODS[x].n).join("、")}）`, "#ff7ad8", true);
  if (typeof netAnnounce === "function") netAnnounce(`召喚了天劫・${R.n}！`);
  return "";
}
function tjTick(m, dt) {
  const R = RBOSS[m.rb], T = m.tjT;
  if (m.tj.includes("rage") && m.atkT > 0) m.atkT -= dt * 0.4;
  if (dist(m, W0) > WB_EDGE + 40) return;
  if (m.tj.includes("call") && (T.call -= dt) <= 0) {
    T.call = 20; floatText(m.x, m.y - 46, "天劫召喚！", "#ff7ad8", true);
    for (let i = 0; i < 3; i++) {
      spawnWMob(m.camp); const a = W0.mobs[W0.mobs.length - 1];
      if (R.addType) a.type = R.addType;
      a.x = m.x + rand(-40, 40); a.y = m.y + rand(10, 40); a.st = "chase"; a.noRespawn = true; a.elite = false; a.mod = null; a.lv = TJ_LV - 2; a.emk = 1;
      a.hp = a.max = WMOBS[a.type].hp * mobHpMul(a.lv) * 0.6; burst(a.x, a.y, "#ff7ad8", 14, 80);
    }
  }
  if (m.tj.includes("pool") && (T.pool -= dt) <= 0) { T.pool = 3.5; wbZone({ k: "circle", x: W0.x, y: W0.y, r: 24, max: 0.9, dmg: wbDmg(m, 0.5), kind: "P", c: "120,230,110", pool: { r: 24, dur: 5, dmg: wbDmg(m, 0.12) } }); }
  if (m.tj.includes("zap") && (T.zap -= dt) <= 0) {
    T.zap = 4;
    for (let i = 0; i < 2; i++) wbZone({ k: "circle", x: W0.x + (i ? rand(-40, 40) : 0), y: W0.y + (i ? rand(-25, 25) : 0), r: 20, max: 0.7, dmg: wbDmg(m, 0.6), c: "190,220,255", fc: "150,190,255", done: zapDone });
  }
}

// ───────── 共用包裝 ─────────
const _hitMobM = hitMob;
hitMob = function (m, dmg, kb, from, quiet) {
  if (m && !m.dead && !m.air) {
    if (Array.isArray(m.tj) && m.tj.includes("iron")) arguments[1] = dmg * 0.7;
    if (ksOn("shayi") && W0.ksK > 0) arguments[1] = arguments[1] * (1 + 0.03 * W0.ksK);
    if (ksOn("jianyi") && !quiet) mpLeech(3); // 企劃 61：打中 +1 拿掉了，劍意自己給 3
    if (m.elite && eHas(m, "雷擊") && !(m.zapCd > 0) && Math.random() < 0.2) {
      m.zapCd = 1.5; wbZone({ k: "circle", x: W0.x, y: W0.y, r: 20, max: 0.5, dmg: mobDmg(m, WMOBS[m.type]) * 0.8, c: "190,220,255", fc: "150,190,255", done: zapDone });
      seenHint("ezap", "雷擊精英：打牠有機會在你腳下落雷，看到圈就閃");
    }
  }
  return _hitMobM.apply(this, arguments);
};
const _killMobM = killMob;
killMob = function (m) {
  if (!m.dead && m.elite && eHas(m, "不死") && !m.rev && WMOBS[m.type].ai !== "pillar") { // 第一次倒下：35% 血爬起來
    m.rev = 1; m.hp = m.max * 0.35; m.flash = 0.3; burst(m.x, m.y, "#ffe9a0", 20, 90, 0.5); sfx("arrive");
    floatText(m.x, m.y - 22, "不死！再站起來", "#ffe9a0", true); seenHint("eundy", "不死精英：第一次倒下會爬起來，再打一次"); return;
  }
  const was = m.dead;
  _killMobM.apply(this, arguments);
  if (was || !m.dead) return;
  if (ksOn("shayi")) { W0.ksK = Math.min(10, (W0.ksK || 0) + 1); W0.ksT = 5; }
  if (m.boss && m.R && typeof RIFT !== "undefined" && RIFT && RIFT.tier >= 8 && Math.random() < (RIFT.tier >= 11 ? 0.3 : 0.15)) wDrop({ kind: "cur", c: "tjseal" }, m);
};
const _hurtWM = hurtW;
hurtW = function (dmg, from, kind) {
  if (ksOn("panshi")) dmg *= 0.8;
  { const tb = tjBoss(); if (tb) dmg *= tb.rb === "swamp" ? 1.1 : 1.3; } // 蟾王天劫 ×1.1（企劃 20 bot 實測勝率 1/12）
  return _hurtWM.call(this, dmg, from, kind);
};
const _wbKilledM = wbKilled;
wbKilled = function (m) {
  if (!m.tj || m.R) return _wbKilledM.apply(this, arguments);
  const R = RBOSS[m.rb], lv0 = R.lv; R.lv = TJ_LV; // 掉落等級、靈石照 Lv.130 算
  try { _wbKilledM.apply(this, arguments); } finally { R.lv = lv0; }
  const w = save.w, il = Math.floor(TJ_LV / 3) + 2;
  w.tjK = w.tjK || {}; w.tjK[m.rb] = (w.tjK[m.rb] || 0) + 1;
  for (let i = 0; i < m.tj.length; i++) { const it = rollItem(1, il); delete it.risk; wDrop({ kind: "item", it, safe: true }, m); } // 每個王詞綴多 1 件
  const lc = { volcano: 0.2, swamp: 0.24, thunder: 0.24, sky: 0.2 }[m.rb] || 0.2; // 原本的王傳說機率再加 2 倍＝×3
  if (Math.random() < lc) {
    const U = { swamp: "toadrobe", thunder: "tstep", sky: "wuxiang" }[m.rb];
    const sks = SLOT_KEYS.filter(slotOpen), it = U ? rbUnique(U, il) : shardItem(sks[Math.floor(Math.random() * sks.length)], 3);
    delete it.risk; wDrop({ kind: "item", it, safe: true }, m); floatText(m.x, m.y - 96, `天劫傳說！${it.name}`, "#ff8a3d", true);
  }
  if (Math.random() < 0.25) wDrop({ kind: "cur", c: "tjseal" }, m);
  floatText(m.x, m.y - 72, `渡過天劫・${R.n}！`, "#ff7ad8", true);
  if (typeof netAnnounce === "function") netAnnounce(`打倒了天劫・${R.n}！`);
  writeSave();
};
const _openSpotM = openSpot;
openSpot = function (s) {
  _openSpotM.apply(this, arguments);
  if (!s || s.kind !== "altar" || !rbKilled(s.rb)) return;
  const btns = screenEl.querySelector(".btns"), res = screenEl.querySelector(".result"); if (!btns) return;
  if (res) res.insertAdjacentHTML("beforeend", `<br><br><b style="color:#ff7ad8">天劫版</b>：Lv.${TJ_LV}、多 1–3 個王詞綴（${Object.values(TJ_MODS).map((x) => x.n).join("／")}），掉落等級 130、傳說機率 ×3，每個詞綴多掉 1 件。建議 Lv.120 以上。<br>天劫印：有 ${curN("tjseal")} 個（秘境第 8 層以上的秘境之主會掉）`);
  const b = document.createElement("button"); b.className = "big"; b.style.background = "#7a2a5a"; b.innerHTML = `天劫挑戰<small>−1 天劫印</small>`;
  b.disabled = curN("tjseal") < 1; btns.insertBefore(b, btns.querySelector("#close"));
  b.onclick = () => { worldReturn(); const e = startTianjie(s.rb); if (e) floatText(W0.x, W0.y - 30, e, "#ff9a7a", true); };
};
// 王頭上：天劫詞綴；精英：雙詞綴標記
const _drawCampsM = drawCamps;
drawCamps = function () {
  _drawCampsM.apply(this, arguments);
  const m = tjBoss();
  if (m) {
    ctx.strokeStyle = `rgba(255,90,200,${0.4 + 0.3 * Math.sin(time * 6)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(m.x, m.y + 4, 30, 15, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.font = "bold 7px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 2; ctx.strokeStyle = "rgba(20,10,20,0.9)";
    const t = Array.isArray(m.tj) ? `天劫・${m.tj.map((x) => TJ_MODS[x].n).join("・")}` : "天劫"; ctx.strokeText(t, m.x, m.y - 46); ctx.fillStyle = "#ff9ae0"; ctx.fillText(t, m.x, m.y - 46);
  }
};

// ───────── 每幀 ─────────
const _updateWorldMind = updateWorld;
updateWorld = function (dt) {
  if (!W0) return _updateWorldMind.apply(this, arguments);
  if (W0.ksT > 0) { W0.ksT -= dt; if (W0.ksT <= 0) W0.ksK = 0; }
  for (const m of W0.mobs) {
    if (m.dead) continue;
    if (!m.emk) eliteRoll(m);
    if (m.elite && (m.mod2 || ELITE_NEW.includes(m.mod))) eliteTick(m, dt);
    if (Array.isArray(m.tj)) tjTick(m, dt); // 天劫秘境的秘境之主 m.tj＝true（不是陣列），不跑天劫王詞綴
  }
  const w = save.w;
  if (!ksOn("kuang") || !w) return _updateWorldMind.apply(this, arguments);
  MIND_POT = w.potions; w.potions = 0; // 狂心：不能喝丹藥（這一幀先藏起來）
  if (act("potion", "h", "4") && !(W0.kuangHint > time)) { W0.kuangHint = time + 1.5; floatText(W0.x, W0.y - 16, "狂心：不能喝丹藥", "#ff7a7a"); }
  try { return _updateWorldMind.apply(this, arguments); } finally { w.potions = MIND_POT; MIND_POT = null; }
};
let MIND_POT = null;
const _writeSaveM = writeSave;
writeSave = function () {
  if (MIND_POT == null || !save.w) return _writeSaveM.apply(this, arguments);
  const z = save.w.potions; save.w.potions = MIND_POT;
  try { return _writeSaveM.apply(this, arguments); } finally { save.w.potions = z; }
};
