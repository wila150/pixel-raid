// 萬劍仙途 — 秘境第三版（劍尊後的終局，企劃 16 第 9 節、03 第 5-2 節）
// ・秘境輿圖：37 個節點（六角格），打完一點旁邊的點才亮；第 N 圈要第 10+N 層以上的鑰匙
// ・鎮妖塔：打完塔那張圖，周圍 2 格的秘境都吃它的加成；塔上放混元石＝隨機多一條、淬靈石＝指定一條（最多 3 條）
// ・事件天賦樹：每點亮一個節點（第一次通關）得 1 點；五種事件各 4 點＋尋鑰、聚寶
// ・11 層以上無上限（maps.js riftCap）、層數榜（net.js lb.rt）
// ・天劫雷印渡劫鑰匙：25% 沒事／25% 劫紋（超強前綴＋超危險後綴）／25% 重洗／25% 天劫秘境（王更強、掉更好）
// ・巔峰點：Lv.120 以後每升 1 級 1 點，四條小線每點 +0.5%（技能頁「巔峰」分頁）
"use strict";

const atlasOpen = () => !!save.w && typeof rbKilled === "function" && rbKilled("sky");
// 不會被隨機骰到的特殊詞綴（x:true，maps.js rollKeyMods 會跳過）
Object.assign(MAP_MODS, {
  at_qty: { t: "p", x: 1, n: "鎮妖塔：物品數量 +15%", q: 15 },
  at_pack: { t: "p", x: 1, n: "鎮妖塔：怪物數量 +15%", q: 0 },
  at_elite: { t: "p", x: 1, n: "鎮妖塔：精英 +8%", q: 0 },
  at_ev: { t: "p", x: 1, n: "鎮妖塔：事件獎勵 +1", q: 0 },
  at_key: { t: "p", x: 1, n: "鎮妖塔：高一層鑰匙 +10%", q: 0 },
  tq: { t: "p", x: 1, n: "聚寶", q: 0 },
  pq: { t: "p", x: 1, n: "巔峰", q: 0 },
  tj_qty: { t: "p", x: 1, n: "劫紋：物品數量 +80%", q: 80 },
  tj_dmg: { t: "s", x: 1, n: "劫紋：怪物傷害 +60%、血量 +40%", q: 0 },
});
const TOWER_B = { qty: "物品數量 +15%", pack: "怪物數量 +15%", elite: "精英 +8%", ev: "事件獎勵 +1", key: "高一層鑰匙 +10%" };
const TOWER_KEYS = Object.keys(TOWER_B);

// ───────── 輿圖節點（固定種子，大家同一張）─────────
const ATLAS = (() => {
  const r = mulberry32(20261109), N = [];
  for (let q = -3; q <= 3; q++) for (let s = -3; s <= 3; s++) { const t = -q - s; if (Math.abs(t) > 3) continue; N.push({ id: q + "," + s, q, s, ring: Math.max(Math.abs(q), Math.abs(s), Math.abs(t)) }); }
  const A = "青赤玄白幽雷霜焚雲墨碧蒼紫金", B = "嶺淵谷原峰澤林台窟野崖川洞丘";
  const used = new Set();
  for (const ring of [1, 2, 3]) {
    const R = N.filter((n) => n.ring === ring).sort(() => r() - 0.5);
    R.slice(0, [0, 2, 3, 4][ring]).forEach((n) => { n.tower = true; });
    R.slice([0, 2, 3, 4][ring]).forEach((n) => { if (r() < 0.4) n.ev = RIFT_EV_KEYS[Math.floor(r() * RIFT_EV_KEYS.length)]; });
  }
  for (const n of N) {
    if (n.ring === 0) { n.n = "裂隙之心"; continue; }
    let nm; do nm = A[Math.floor(r() * A.length)] + B[Math.floor(r() * B.length)]; while (used.has(nm)); used.add(nm);
    n.n = n.tower ? `鎮妖塔・${nm}` : nm;
  }
  return N;
})();
const atlasNode = (id) => ATLAS.find((n) => n.id === id);
const hexD = (a, b) => (Math.abs(a.q - b.q) + Math.abs(a.s - b.s) + Math.abs(a.q + a.s - b.q - b.s)) / 2;
function atlasSt() { const w = save.w; if (!w.atlas) w.atlas = { d: {}, tw: {}, sel: null, tal: {} }; return w.atlas; }
const atlasDone = (id) => !!atlasSt().d[id];
const atlasLit = (n) => n.ring === 0 || atlasDone(n.id) || ATLAS.some((m) => atlasDone(m.id) && hexD(m, n) === 1);
const atlasNeed = (n) => 10 + n.ring;
function towerBonus(id) { // 周圍 2 格內打完的塔
  const n = atlasNode(id), b = {}; if (!n) return b;
  const A = atlasSt();
  for (const t of ATLAS) if (t.tower && A.d[t.id] && hexD(t, n) <= 2) for (const k of A.tw[t.id] || []) b[k] = (b[k] || 0) + 1;
  return b;
}
// ───────── 事件天賦樹 ─────────
const TAL = {
  crack: { n: "天裂", c: "#ff8ad8" }, altar: { n: "祭劍", c: "#ffc85a" }, seal: { n: "封妖", c: "#9fdcff" }, goblin: { n: "寶藏", c: "#ffe66a" }, tomb: { n: "劍冢", c: "#c8dcff" },
  key: { n: "尋鑰", c: "#b48aff", d: (l) => `秘境之主多 ${l * 8}% 掉高一層鑰匙` },
  loot: { n: "聚寶", c: "#ffd84a", d: (l) => `秘境物品數量 +${l * 4}%` },
};
for (const k of RIFT_EV_KEYS) TAL[k].d = (l) => `${RIFT_EV[k].n}出現機率 +${l * 50}%、完成多掉 ${l} 個通貨${l >= 4 ? "＋1 精髓" : ""}`;
const TAL_MAX = 4;
const talLv = (k) => (save.w && save.w.atlas && save.w.atlas.tal[k]) || 0;
const talTotal = () => Object.keys(atlasSt().d).length;
const talFree = () => talTotal() - Object.values(atlasSt().tal).reduce((a, b) => a + b, 0);
function atlasEvW(k) { return 1 + 0.5 * talLv(k); } // riftev.js 選事件時用
// ───────── 巔峰點 ─────────
const PARA_LV = 120;
const PARA = {
  atk: { n: "攻擊", g: "攻", c: "#ffcf6b", d: (l) => `攻擊 +${(l * 0.5).toFixed(1)}%`, f: (b, l) => { b.inc += l * 0.005; } },
  def: { n: "防禦", g: "防", c: "#d8c8a0", d: (l) => `護甲 +${(l * 0.5).toFixed(1)}%`, f: (b, l) => { b.armor = (b.armor || 0) * (1 + l * 0.005); } },
  life: { n: "生存", g: "命", c: "#ff7a6a", d: (l) => `生命 +${(l * 0.5).toFixed(1)}%`, f: (b, l) => { b.maxHp = Math.round(b.maxHp * (1 + l * 0.005)); } },
  loot: { n: "打寶", g: "寶", c: "#ffd84a", d: (l) => `秘境物品數量 +${(l * 0.5).toFixed(1)}%`, f: () => {} },
};
const paraLv = (k) => (save.w && save.w.para && save.w.para[k]) || 0;
const paraTotal = () => Math.max(0, ((save.w && save.w.lv) || 0) - PARA_LV);
const paraFree = () => paraTotal() - Object.values((save.w && save.w.para) || {}).reduce((a, b) => a + b, 0);
const _jobStatsA = jobStats;
jobStats = function (b) {
  b = _jobStatsA(b);
  if (save.w && save.w.para) for (const k in PARA) { const l = paraLv(k); if (l) PARA[k].f(b, l); }
  return b;
};
function renderPara(msg) {
  const w = save.w, free = paraFree(), on = w.lv >= PARA_LV;
  const rows = Object.keys(PARA).map((k) => { const P = PARA[k], l = paraLv(k);
    return `<div class="skrow${l ? " has" : ""}" style="--c:${P.c}"><span class="skico">${P.g}</span><div class="skmain"><b>${P.n}</b><small>${l ? P.d(l) : "未點"}　下一點：${P.d(l + 1)}</small></div><span class="sklv">${l}</span><button class="skup" data-pa="${k}" ${free > 0 ? "" : "disabled"}>＋</button></div>`; }).join("");
  return `<div class="skjob">巔峰${on ? "" : `<small>Lv.${PARA_LV} 以後每升 1 級得 1 點（你現在 Lv.${w.lv}）</small>`}</div>
    ${msg ? `<div class="emsg">${msg}</div>` : ""}
    <div class="sklist${on ? "" : " locked"}">${rows}</div>
    <div class="apfoot"><span>巔峰點數</span><b>${free}</b><button id="paReset" class="sbtn" ${Object.keys(w.para || {}).length ? "" : "disabled"}>重置（免費）</button></div>
    <p class="sub">每點很小，但沒有上限：滿等以後刷秘境，永遠有一點東西在漲。</p>`;
}
function bindPara() {
  const w = save.w;
  ov.querySelectorAll("[data-pa]").forEach((b) => b.addEventListener("click", () => {
    if (paraFree() <= 0) return; w.para = w.para || {}; w.para[b.dataset.pa] = paraLv(b.dataset.pa) + 1; writeSave(); sfx("good"); renderSkills(`${PARA[b.dataset.pa].n} +1`);
  }));
  const r = document.getElementById("paReset"); if (r) r.onclick = () => { w.para = {}; writeSave(); sfx("click"); renderSkills("巔峰點數全部退回"); };
}

// ───────── 天劫雷印：渡劫鑰匙 ─────────
function keyVaal(k) {
  if (k.cor) return "渡劫過的鑰匙不能再渡劫";
  if (!useCur("vaal")) return "沒有天劫雷印";
  k.cor = true; const r = Math.random();
  if (r < 0.25) return "雷劫散去⋯⋯什麼都沒發生";
  if (r < 0.5) { k.mods.push("tj_qty", "tj_dmg"); return "劫紋！物品數量 +80%，但怪物更兇"; }
  if (r < 0.75) { const [a, b] = KEY_RARITY[k.q].mods; rollKeyMods(k, Math.max(1, a + Math.floor(Math.random() * (b - a + 1)))); return "詞綴全部重洗了"; }
  k.tj = true; return "天劫秘境！秘境之主換成天劫版：更強、掉更好";
}

// ───────── 進秘境：輿圖節點、塔加成、天賦、巔峰、劫紋 ─────────
function riftAddMob(camp) { // 跟 riftSpawn 同一套
  const R = RIFT, mods = R.key.mods;
  spawnWMob(camp);
  const m = W0.mobs[W0.mobs.length - 1];
  m.noRespawn = true; m.rift = true;
  if (!R.reach[Math.floor(m.y / TS) * TW + Math.floor(m.x / TS)]) { m.x = camp.x; m.y = camp.y; m.wx = m.x; m.wy = m.y; }
  if (mods.includes("hp")) { m.hp *= 1.4; m.max *= 1.4; }
  if (mods.includes("fast")) m.spdMul = 1.25;
  if (mods.includes("dmg")) m.dmgMul = 1.3;
  R.total += m.elite ? 3 : 1;
  return m;
}
const _riftEnterA = riftEnter;
riftEnter = function (id) {
  const key = save.keys.find((k) => k.id === id);
  if (!key) return _riftEnterA.apply(this, arguments);
  const A = atlasOpen() ? atlasSt() : null, N = A && A.sel ? atlasNode(A.sel) : null;
  const node = N && atlasLit(N) && key.tier >= atlasNeed(N) ? N : null;
  const tb = node ? towerBonus(node.id) : {}, extra = [];
  for (const k in tb) for (let i = 0; i < tb[k]; i++) extra.push("at_" + k);
  if (node && node.ev) key.ev2 = node.ev;
  const tl = talLv("loot"); if (tl) { MAP_MODS.tq.q = tl * 4; MAP_MODS.tq.n = `聚寶：物品數量 +${tl * 4}%`; extra.push("tq"); }
  const pl = typeof treeLoot === "function" ? treeLoot() : 0; if (pl) { MAP_MODS.pq.q = Math.round(pl); MAP_MODS.pq.n = `天賦樹：物品數量 +${pl}%`; extra.push("pq"); }
  key.mods = key.mods.concat(extra);
  _riftEnterA.apply(this, arguments);
  if (!RIFT) return;
  const R = RIFT; R.node = node ? node.id : null; R.tb = tb;
  if (tb.pack) for (const c of W0.camps) if (c.rift) { const n = Math.round(c.size * 0.15 * tb.pack + Math.random() * 0.5); for (let i = 0; i < n; i++) riftAddMob(c); }
  for (const m of W0.mobs) if (m.rift && !m.boss) {
    if (tb.elite && !m.elite && Math.random() < 0.08 * tb.elite) { m.elite = true; m.hp *= 4; m.max *= 4; m.mod = ELITE_MODS[Math.floor(Math.random() * ELITE_MODS.length)]; R.total += 2; }
    if (key.mods.includes("tj_dmg")) { m.dmgMul = (m.dmgMul || 1) * 1.6; m.hp *= 1.4; m.max *= 1.4; }
  }
  if (node) setTimeout(() => { if (RIFT === R) notice(`輿圖：${node.n}${Object.keys(tb).length ? "（吃到鎮妖塔加成）" : ""}`, "#e0c8ff"); }, 2600);
  if (key.tj) setTimeout(() => { if (RIFT === R) notice("天劫秘境：秘境之主是天劫版，小心！", "#ff8a7a"); }, 4000);
};
const _evSpawnA = evSpawn;
evSpawn = function () { const m = _evSpawnA.apply(this, arguments); if (RIFT && RIFT.key.mods.includes("tj_dmg") && m) { m.dmgMul = (m.dmgMul || 1) * 1.6; m.hp *= 1.4; m.max *= 1.4; } return m; };
const _riftSpawnBossA = riftSpawnBoss;
riftSpawnBoss = function () {
  _riftSpawnBossA.apply(this, arguments);
  const R = RIFT; if (!R) return;
  const m = W0.mobs.filter((x) => x.R && !x.dead).pop(); if (!m) return;
  if (R.key.mods.includes("tj_dmg")) m.R.dmgMul *= 1.3;
  if (R.key.tj) { m.hp *= 2.5; m.max *= 2.5; m.R.dmgMul *= 1.4; m.R.n = "天劫・" + m.R.n; m.tj = true; floatText(m.x, m.y - 56, "天劫降臨！", "#ff5a5a", true); }
};
const _riftBossKilledA = riftBossKilled;
riftBossKilled = function (m) {
  const R = RIFT; _riftBossKilledA.apply(this, arguments); if (!R) return;
  const tb = R.tb || {}, A = atlasOpen() ? atlasSt() : null;
  // 尋鑰天賦＋塔：多一次高一層鑰匙
  if (Math.random() < 0.1 * (tb.key || 0) + 0.08 * talLv("key")) wDrop({ kind: "key", k: makeKey(R.tier + 1) }, m);
  // 天劫秘境：多 3 件＋35% 保底傳說＋20% 雷印
  if (R.key.tj) {
    const il = Math.floor(R.lv / 3) + 2;
    for (let i = 0; i < 3; i++) wDropItem(rollItem(1, il), m);
    if (Math.random() < 0.35) { let it = null; for (let i = 0; i < 400 && !(it && it.q === 3); i++) it = rollItem(1, il); if (it && it.q === 3) wDropItem(it, m); }
    if (Math.random() < 0.2) wDrop({ kind: "cur", c: "vaal" }, m);
  }
  // 輿圖：第一次通關點亮、得天賦點；塔給第一條加成
  if (A && R.node && !A.d[R.node]) {
    const n = atlasNode(R.node); A.d[R.node] = 1;
    if (n.tower) A.tw[n.id] = [TOWER_KEYS[Math.floor(Math.random() * TOWER_KEYS.length)]];
    writeSave();
    notice(`輿圖點亮：${n.n}！輿圖天賦點 +1${n.tower ? `；鎮妖塔加成「${TOWER_B[A.tw[n.id][0]]}」照到周圍 2 格` : ""}`, "#ffe066");
  }
  if (typeof lbPush === "function") lbPush(true);
};
// 事件天賦：事件完成時多掉
const _updateWorldA = updateWorld;
updateWorld = function (dt) {
  _updateWorldA.apply(this, arguments);
  if (!RIFT || !RIFT.evs || !W0) return;
  for (const E of RIFT.evs) if (E.st === "done" && !E.paid) {
    E.paid = 1; const L = talLv(E.k) + ((RIFT.tb && RIFT.tb.ev) || 0);
    for (let i = 0; i < L; i++) wDrop({ kind: "cur", c: randCur() }, E);
    if (talLv(E.k) >= 4) wDrop({ kind: "ess", k: randEss() }, E);
  }
};

// ───────── 秘境畫面：分頁「鑰匙｜輿圖｜天賦」─────────
let atlasTab = "key", atlasPick = null;
const _renderRiftA = renderRift;
renderRift = function (msg = "") {
  if (!save.w) return;
  if (!atlasOpen() || RIFT) atlasTab = "key";
  if (atlasTab === "key") { _renderRiftA.apply(this, arguments); if (ovKind === "rift") riftKeyExtras(); return; }
  if (ovKind !== "rift" && !ovOpen("rift")) return;
  if (msg) ovMsg = msg;
  ov.innerHTML = `<div class="col cw"><div class="panel wide equip atlasw${atlasTab === "tal" ? " skwin" : ""}">${atlasTabs()}${atlasTab === "map" ? atlasMapHtml() : atlasTalHtml()}</div></div>${ovMsg ? `<div class="toast">${ovMsg}</div>` : ""}`;
  ovMsg = "";
  bindAtlasTabs();
  if (atlasTab === "map") bindAtlasMap(); else bindAtlasTal();
};
function atlasTabs() {
  if (!atlasOpen() || RIFT) return "";
  const t = (k, n) => `<button class="btab${atlasTab === k ? " on" : ""}" data-at="${k}">${n}</button>`;
  return `<div class="btabs atabs">${t("key", "鑰匙")}${t("map", "輿圖")}${t("tal", `天賦${talFree() > 0 ? " ●" : ""}`)}</div>`;
}
function bindAtlasTabs() { ov.querySelectorAll("[data-at]").forEach((b) => b.addEventListener("click", () => { sfx("click"); atlasTab = b.dataset.at; renderRift(); })); }
function riftKeyExtras() {
  const c = ov.querySelector(".col.c.rift"); if (!c) return;
  if (atlasOpen() && !RIFT) { c.insertAdjacentHTML("afterbegin", atlasTabs()); bindAtlasTabs(); }
  // 鑰匙列表標示渡劫／天劫
  ov.querySelectorAll("[data-rk]").forEach((b) => { const k = save.keys.find((x) => x.id === b.dataset.rk); if (k && k.cor) b.querySelector("small").insertAdjacentHTML("beforeend", k.tj ? ` <i class="rtj">天劫</i>` : ` <i class="rtj">劫</i>`); });
  const sel = save.keys.find((k) => k.id === riftSel); if (!sel || RIFT) return;
  const acts = c.querySelector(".acts");
  if (sel.cor) { ["rup", "rroll"].forEach((id) => { const e = document.getElementById(id); if (e) e.remove(); }); }
  const info = [];
  if (sel.cor) info.push(`<div class="rmod s">⚡ 已渡劫：不能再點金、洗練、放精髓</div>`);
  if (sel.tj) info.push(`<div class="rmod s">⚡ 天劫秘境：秘境之主血量 ×2.5、傷害 ×1.4；多掉 3 件、35% 保底傳說、20% 天劫雷印</div>`);
  if (atlasOpen()) {
    const A = atlasSt(), N = A.sel ? atlasNode(A.sel) : null;
    if (!N) info.push(`<div class="anode dim">輿圖節點：沒有選（到「輿圖」分頁選一個點，打通了會點亮旁邊的點）</div>`);
    else { const ok = atlasLit(N) && sel.tier >= atlasNeed(N), tb = towerBonus(N.id);
      info.push(`<div class="anode${ok ? " ok" : ""}">輿圖節點：<b>${N.n}</b>${N.ev ? `・必出${RIFT_EV[N.ev].n}` : ""}${Object.keys(tb).length ? `・塔：${Object.keys(tb).map((k) => TOWER_B[k] + (tb[k] > 1 ? `×${tb[k]}` : "")).join("、")}` : ""}<small>${ok ? "這把鑰匙會打這個點" : `要第 ${atlasNeed(N)} 層以上的鑰匙（這把不算輿圖，照一般秘境打）`}</small></div>`); }
  }
  if (info.length) { const d = document.createElement("div"); d.className = "rmods"; d.innerHTML = info.join(""); if (acts) acts.before(d); else c.appendChild(d); }
  if (acts && !sel.cor) {
    const b = document.createElement("button"); b.id = "rvaal"; b.disabled = !curN("vaal");
    b.innerHTML = `渡劫<small>天劫雷印（有 ${curN("vaal")}）</small>`; acts.insertBefore(b, acts.querySelector("#rdel"));
    b.onclick = () => evDialog("渡劫這把鑰匙？", "25% 沒事、25% 劫紋（物品數量 +80%＋怪物更兇）、25% 詞綴重洗、25% 變成天劫秘境。渡劫過就不能再改。", [
      { t: "渡劫", cls: "red", f: () => { const r = keyVaal(sel); writeSave(); sfx(sel.cor ? "crit" : "bad"); renderRift(r); } }, { t: "算了" }]);
  }
}
// 輿圖分頁
const atlasXY = (n) => [50 + (n.q + n.s / 2) * 12.4, 50 + n.s * 13.4];
function atlasMapHtml() {
  const A = atlasSt(), pick = atlasNode(atlasPick || A.sel || "0,0");
  let lines = "";
  const seen = (n) => atlasLit(n) || ATLAS.some((m) => atlasLit(m) && hexD(m, n) === 1); // 迷霧：只看得到亮的點和旁邊一圈「？」
  for (const a of ATLAS) for (const b of ATLAS) if (a.id < b.id && hexD(a, b) === 1 && (atlasLit(a) || atlasLit(b)) && seen(a) && seen(b)) {
    const [x1, y1] = atlasXY(a), [x2, y2] = atlasXY(b), on = (atlasDone(a.id) && atlasLit(b)) || (atlasDone(b.id) && atlasLit(a));
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${on ? "on" : ""}"/>`;
  }
  const lit = ATLAS.filter(atlasLit);
  const nodes = ATLAS.filter(seen).map((n) => {
    const [x, y] = atlasXY(n), L = atlasLit(n), D = atlasDone(n.id), cov = Object.keys(towerBonus(n.id)).length;
    const g = !L ? "?" : n.tower ? "塔" : n.ev ? RIFT_EV[n.ev].n[0] : n.ring === 0 ? "心" : String(atlasNeed(n));
    return `<button class="anod${L ? " lit" : ""}${D ? " done" : ""}${n.tower ? " tw" : ""}${A.sel === n.id ? " sel" : ""}${pick === n ? " pk" : ""}${cov ? " cov" : ""}" style="left:${x}%;top:${y}%" data-an="${n.id}">${g}</button>`;
  }).join("");
  const L = atlasLit(pick), D = atlasDone(pick.id), tb = towerBonus(pick.id), tw = A.tw[pick.id] || [];
  const info = !L ? `<h3>？？？</h3><p class="dim">打通旁邊的點才看得到。</p>` : `<h3>${pick.n}</h3>
    <p>要第 <b>${atlasNeed(pick)}</b> 層以上的鑰匙・${D ? `<span class="ok">已點亮</span>` : "還沒打通"}</p>
    ${pick.ev ? `<p>這個點必出事件：<b>${RIFT_EV[pick.ev].n}</b></p>` : ""}
    ${Object.keys(tb).length ? `<p>吃到的塔加成：<b>${Object.keys(tb).map((k) => TOWER_B[k] + (tb[k] > 1 ? ` ×${tb[k]}` : "")).join("、")}</b></p>` : `<p class="dim">周圍 2 格沒有打通的鎮妖塔</p>`}
    ${pick.tower ? `<div class="winhead">鎮妖塔</div>${D ? `<p>這座塔的加成（照到周圍 2 格）：<b>${tw.map((k) => TOWER_B[k]).join("、")}</b></p>
      <div class="acts"><button id="twChaos" ${tw.length < 3 && curN("chaos") ? "" : "disabled"}>放混元石<small>隨機多一條（${tw.length}/3，有 ${curN("chaos")}）</small></button>
      <button id="twExalt" ${tw.length < 3 && curN("exalt") ? "" : "disabled"}>放淬靈石<small>指定一條（有 ${curN("exalt")}）</small></button></div>` : `<p class="dim">打通這座塔，周圍 2 格的秘境都會吃到它的加成；之後還能在塔上放通貨多加幾條。</p>`}` : ""}
    <div class="acts"><button id="anSel" class="gold" ${A.sel === pick.id ? "disabled" : ""}>${A.sel === pick.id ? "已選這個點" : "選這個點"}<small>回「鑰匙」分頁開秘境</small></button>${A.sel ? `<button id="anClr">不用輿圖</button>` : ""}</div>`;
  return `<div class="atlas"><div class="amap"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>${nodes}</div>
    <div class="ainfo">${info}<p class="dim small">點亮 ${Object.keys(A.d).length}/${ATLAS.length}・看得到 ${lit.length}・最高通過第 ${save.w.riftMax || 0} 層<br>點亮一個點＝輿圖天賦點 +1。外圈要更高層的鑰匙。</p></div></div>`;
}
function bindAtlasMap() {
  const A = atlasSt();
  ov.querySelectorAll("[data-an]").forEach((b) => b.addEventListener("click", () => { sfx("click"); atlasPick = b.dataset.an; renderRift(); }));
  const on = (id, f) => { const e = document.getElementById(id); if (e) e.onclick = f; };
  const pick = atlasNode(atlasPick || A.sel || "0,0");
  on("anSel", () => { if (!atlasLit(pick)) return; A.sel = pick.id; writeSave(); sfx("good"); renderRift(`選了 ${pick.n}`); });
  on("anClr", () => { A.sel = null; writeSave(); sfx("click"); renderRift("不用輿圖（一般秘境）"); });
  const tw = A.tw[pick.id] || (A.tw[pick.id] = []);
  on("twChaos", () => { if (tw.length >= 3 || !useCur("chaos")) return; tw.push(TOWER_KEYS[Math.floor(Math.random() * TOWER_KEYS.length)]); writeSave(); sfx("good"); renderRift(`鎮妖塔多了「${TOWER_B[tw[tw.length - 1]]}」`); });
  on("twExalt", () => { if (tw.length >= 3 || !curN("exalt")) return;
    evDialog("淬靈石：指定一條塔加成", "照到周圍 2 格的秘境", TOWER_KEYS.map((k) => ({ t: TOWER_B[k], f: () => { if (!useCur("exalt")) return; tw.push(k); writeSave(); sfx("good"); renderRift(`鎮妖塔多了「${TOWER_B[k]}」`); } })).concat([{ t: "算了", cls: "red" }])); });
}
// 天賦分頁
function atlasTalHtml() {
  const free = talFree();
  const rows = Object.keys(TAL).map((k) => { const T = TAL[k], l = talLv(k);
    return `<div class="skrow${l ? " has" : ""}" style="--c:${T.c}"><span class="skico">${T.n[0]}</span><div class="skmain"><b>${T.n}</b><small>${l ? T.d(l) : "未點"}${l >= TAL_MAX ? "（滿）" : `　下一點：${T.d(l + 1)}`}</small></div><span class="sklv">${l}<small>/${TAL_MAX}</small></span><button class="skup" data-tl="${k}" ${free > 0 && l < TAL_MAX ? "" : "disabled"}>＋</button></div>`; }).join("");
  return `<div class="skjob">輿圖天賦<small>點你喜歡的事件：出現機率和獎勵都會變高</small></div>
    <div class="sklist">${rows}</div>
    <div class="apfoot"><span>天賦點數</span><b>${free}</b><button id="talReset" class="sbtn" ${Object.values(atlasSt().tal).some((x) => x) ? "" : "disabled"}>重置 ${curN("regret") ? "−1 洗心丹" : "−500 靈石"}</button></div>
    <p class="sub">每點亮一個輿圖節點（第一次通關）得 1 點，共 ${ATLAS.length} 點。</p>`;
}
function bindAtlasTal() {
  const A = atlasSt();
  ov.querySelectorAll("[data-tl]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.tl; if (talFree() <= 0 || talLv(k) >= TAL_MAX) return; A.tal[k] = talLv(k) + 1; writeSave(); sfx("good"); renderRift(`${TAL[k].n} +1`); }));
  const r = document.getElementById("talReset");
  if (r) r.onclick = () => { if (!useCur("regret")) { if (save.stone < 500) { sfx("bad"); renderRift("靈石不夠（要 500）"); return; } save.stone -= 500; } A.tal = {}; writeSave(); sfx("click"); renderRift("天賦點數全部退回"); };
}
// 劍尊倒下後第一次提示
setInterval(() => { const w = save.w; if (w && w.created && atlasOpen() && !w.atlasHint && typeof inWorld !== "undefined" && inWorld && W0) { w.atlasHint = 1; writeSave(); notice("秘境輿圖開了：右上「秘境」→ 輿圖。11 層以上沒有上限！", "#e0c8ff"); } }, 4000);
