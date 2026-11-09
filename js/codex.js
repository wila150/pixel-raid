// 萬劍仙途 — 冒險手冊（妖物圖鑑、傳說圖鑑）、稱號、閉關（總表第 9 項；企劃 03 §7、12 §2-2、15 §9）
// 手冊：每種妖物 3 顆星（斬 100、斬 1000、拿過卡片），每顆星對那種妖物傷害 +1%；全書每 10 顆星生命 +1%。
//       每收集過一件傳說，攻擊 +0.3%。
// 稱號：條件達成就解鎖，戴上後顯示在名字上面，別的玩家看得到（presence 的 ti 欄位）。
// 閉關：在青雲城或營地結界裡按「閉關」，或直接下線；回來依時間給經驗，最多算 8 小時 ≈ 你平常玩 30 分鐘的量。
"use strict";
const BOOK_MOBS = ["imp", "wolf", "treant", "golem", "bomber", "crow", "lava", "frostwolf", "icewisp", "yeti", "toad", "bonewolf", "bogtree", "thawk", "tgolem", "twisp", "crane", "skyfox", "guardian", "jianling", "hunter"];
const BOOK_BOSS_CARD = { volcano: "wboss", swamp: "rbswamp", thunder: "rbthunder", sky: "rbsky" };
const BOOK_STAR_MAX = (BOOK_MOBS.length + RB_KEYS.length) * 3;
const BOOK_U = Object.keys(UNIQUES);
const MED_MIN = 10, MED_MAX_H = 8; // 閉關：至少 10 分鐘才算、最多算 8 小時
function book() { const w = save.w; if (!w.book) w.book = { k: {}, u: [], c: [], tk: 0, oh: 0, ti: [] }; return w.book; }
const rbKills = (k) => { const w = save.w; return (w.rbK && w.rbK[k]) || (rbKilled(k) ? 1 : 0); };
function mobStars(t) { const b = book(), n = b.k[t] || 0; return (n >= 100 ? 1 : 0) + (n >= 1000 ? 1 : 0) + (b.c.includes(t) ? 1 : 0); }
function bossStars(k) { const n = rbKills(k); return (n >= 1 ? 1 : 0) + (n >= 10 ? 1 : 0) + (book().c.includes(BOOK_BOSS_CARD[k]) ? 1 : 0); }
const bookStars = () => BOOK_MOBS.reduce((s, t) => s + mobStars(t), 0) + RB_KEYS.reduce((s, k) => s + bossStars(k), 0);
const bookHpPct = () => Math.floor(bookStars() / 10);
const bookAtkPct = () => Math.round(book().u.length * 3) / 10;
const BOSS_OF_TYPE = {}; for (const k of RB_KEYS) BOSS_OF_TYPE[RBOSS[k].type] = k;
// 對某種妖物的傷害加成（%）
function bookVs(m) { if (!save.w || !save.w.book) return 0; const bk = BOSS_OF_TYPE[m.type]; return bk ? bossStars(bk) : m.boss ? 0 : mobStars(m.type); }

// ───────── 數值：生命、攻擊、對妖物傷害 ─────────
const _worldStatsBk = worldStats;
worldStats = function () {
  const b = _worldStatsBk.apply(this, arguments);
  if (save.w && save.w.book) { b.atk *= 1 + bookAtkPct() / 100; b.maxHp = Math.round(b.maxHp * (1 + bookHpPct() / 100)); }
  return b;
};
const _hitMobBk = hitMob;
hitMob = function (m, dmg) { if (m && !m.dead && WMOBS[m.type] && WMOBS[m.type].ai !== "pillar") { const v = bookVs(m); if (v) arguments[1] = dmg * (1 + v / 100); } return _hitMobBk.apply(this, arguments); };
const _killMobBk = killMob;
killMob = function (m) {
  const d = WMOBS[m.type];
  if (save.w && d && d.ai !== "pillar" && !m.boss && !m.dead) { const b = book(); b.tk++; if (BOOK_MOBS.includes(m.type)) { const n = (b.k[m.type] || 0) + 1; b.k[m.type] = n; if (n === 100 || n === 1000) bookStarUp(d.n, n); } }
  return _killMobBk.apply(this, arguments);
};
function bookStarUp(n, k) { B = worldStats(); say(`冒險手冊：${n} 斬了 ${k} 隻，點亮一顆星（對${n}傷害 +1%）`, "#ffe9a8"); }

// ───────── 閉關：修煉速度（最近幾段 5 分鐘、每分鐘拿到多少「一級的經驗」）─────────
let medGiving = false, medOn = null; // medOn = 閉關開始時間
const _gainExpBk = gainExp;
gainExp = function (n) { if (!medGiving && W0) W0.xpAcc = (W0.xpAcc || 0) + n; return _gainExpBk.apply(this, arguments); };
const _updateWorldBk = updateWorld;
updateWorld = function (dt) {
  const p = W0, w = save.w;
  if (p && w && !medOn) {
    w.offT = Date.now();
    p.xpT = (p.xpT || 0) + dt;
    if (p.xpT >= 300) { if (p.xpAcc > 0) { const s = p.xpAcc / expNext(w.lv) / (p.xpT / 60); w.xrN = w.xrN ? w.xrN * 0.7 + s * 0.3 : s; } p.xpT = 0; p.xpAcc = 0; }
  }
  return _updateWorldBk.apply(this, arguments);
};
const medRate = () => Math.min(0.2, Math.max(0.004, save.w.xrN || 1 / 60)) * expNext(save.w.lv); // 每分鐘經驗
const medExp = (min) => Math.round(medRate() * 30 * Math.min(MED_MAX_H, min / 60) / MED_MAX_H);
const fmtHM = (min) => { const h = Math.floor(min / 60), m = Math.floor(min % 60); return h ? `${h} 小時 ${m} 分` : `${m} 分`; };
function medGrant(ms) {
  const w = save.w, min = ms / 60000;
  if (!W0 || !(min >= MED_MIN)) return 0;
  const n = medExp(min), b = book();
  b.oh = Math.round((b.oh || 0) * 100 + Math.min(MED_MAX_H, min / 60) * 100) / 100;
  medGiving = true; gainExp(n); medGiving = false;
  w.offT = Date.now(); writeSave();
  say(`閉關 ${fmtHM(min)}${min / 60 > MED_MAX_H ? `（最多算 ${MED_MAX_H} 小時）` : ""}，修為精進：經驗 +${n.toLocaleString()}`, "#bfe8ff");
  return n;
}
// 下線回來：進仙界時、切回 App 時
const _enterWorldBk = enterWorld;
enterWorld = function () {
  const off = save.w && save.w.offT ? Date.now() - save.w.offT : 0;
  const r = _enterWorldBk.apply(this, arguments);
  if (off && inWorld && W0 && !medOn) setTimeout(() => { if (W0 && !medOn) medGrant(off); }, 1200);
  return r;
};
document.addEventListener("visibilitychange", () => {
  if (document.hidden || !inWorld || !W0 || medOn || !save.w || !save.w.offT) return;
  const off = Date.now() - save.w.offT; if (off >= MED_MIN * 60000) medGrant(off);
});
const medCan = () => W0 && !(typeof RIFT !== "undefined" && RIFT) && safeAt(W0.x, W0.y);
function medStart() {
  if (!medCan()) return;
  medOn = Date.now(); save.w.offT = medOn; writeSave(); if (typeof cloudFlush === "function") cloudFlush();
  bookTab = "med"; renderBook();
}
function medEnd() { if (!medOn) return; const t0 = medOn; medOn = null; const n = medGrant(Date.now() - t0); if (!n) say(`閉關不到 ${MED_MIN} 分鐘，沒有感悟。`, "#cfc4dc"); }
const _ovCloseBk = ovClose;
ovClose = function () { if (medOn && ovKind === "book") medEnd(); return _ovCloseBk.apply(this, arguments); };

// ───────── 稱號 ─────────
const TITLES = [
  { k: "lv10", n: "初出茅廬", c: "#cfe8f4", d: "到 Lv.10", ok: () => save.w.lv >= 10 },
  { k: "k1", n: "百妖斬", c: "#cfe8f4", d: "總共斬殺 1,000 隻妖物", p: () => [book().tk, 1000] },
  { k: "k2", n: "萬妖斬", c: "#8fd0ff", d: "總共斬殺 10,000 隻妖物", p: () => [book().tk, 10000] },
  { k: "k3", n: "妖界噩夢", c: "#ff8a3d", d: "總共斬殺 100,000 隻妖物", p: () => [book().tk, 100000] },
  { k: "b1", n: "石魔剋星", c: "#ff9a6a", d: "打倒焚天石魔", ok: () => rbKilled("volcano") },
  { k: "b2", n: "屠蟾者", c: "#8ad86a", d: "打倒腐骨蟾王", ok: () => rbKilled("swamp") },
  { k: "b3", n: "馭雷人", c: "#a8d0ff", d: "打倒九雷鵬王", ok: () => rbKilled("thunder") },
  { k: "b4", n: "斬仙之終", c: "#ffd84a", d: "打倒無相劍尊", ok: () => rbKilled("sky") },
  { k: "s1", n: "博物修士", c: "#8fd0ff", d: "冒險手冊妖物星數 40 顆", p: () => [bookStars(), 40] },
  { k: "s2", n: "萬妖全書", c: "#ffd84a", d: `冒險手冊妖物星數全滿（${BOOK_STAR_MAX} 顆）`, p: () => [bookStars(), BOOK_STAR_MAX] },
  { k: "u1", n: "尋寶人", c: "#b77dff", d: "收集 5 件不同的傳說", p: () => [book().u.length, 5] },
  { k: "u2", n: "藏劍閣主", c: "#ff8a3d", d: `收集全部 ${BOOK_U.length} 件傳說`, p: () => [book().u.length, BOOK_U.length] },
  { k: "r1", n: "秘境行者", c: "#b77dff", d: "秘境打到第 20 層", p: () => [save.w.riftMax || 0, 20] },
  { k: "r2", n: "深淵行者", c: "#ff6b6b", d: "秘境打到第 50 層", p: () => [save.w.riftMax || 0, 50] },
  { k: "m1", n: "閉關老祖", c: "#bfe8ff", d: "閉關累計 24 小時", p: () => [Math.floor(book().oh || 0), 24] },
  { k: "lv120", n: "登峰造極", c: "#ffd84a", d: "到 Lv.120（巔峰）", ok: () => save.w.lv >= 120 },
];
const TITLE_BY = {}; for (const t of TITLES) TITLE_BY[t.k] = t;
const titleOk = (t) => (t.ok ? !!t.ok() : t.p()[0] >= t.p()[1]);
const myTitle = () => { const w = save.w; return w && w.title && TITLE_BY[w.title] && book().ti.includes(w.title) ? w.title : ""; };
// 畫在名字上面（自己、別人共用）
function drawTitleTag(k, x, y) {
  const t = TITLE_BY[k]; if (!t) return;
  ctx.font = "bold 5px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
  const s = `〔${t.n}〕`;
  ctx.fillStyle = "#1b1424"; ctx.fillText(s, x + 0.5, y + 0.5); ctx.fillStyle = t.c; ctx.fillText(s, x, y);
}

// ───────── 定時檢查：收集到的傳說、卡片、新稱號 ─────────
function bookScan() {
  const w = save.w; if (!w || !w.created) return;
  const b = book(), first = !w.bookSeen; let chg = false;
  const items = Object.values(save.eq || {}).concat(save.bag || []);
  const newU = [];
  for (const it of items) if (it && it.u && UNIQUES[it.u] && !b.u.includes(it.u)) { b.u.push(it.u); newU.push(UNIQUES[it.u].n); }
  const cs = new Set(Object.keys(save.cards || {}).filter((c) => save.cards[c] > 0)); for (const it of items) if (it && it.card) cs.add(it.card);
  for (const c of cs) if (CARDS[c] && !b.c.includes(c)) { b.c.push(c); chg = true; }
  const newT = TITLES.filter((t) => !b.ti.includes(t.k) && titleOk(t));
  for (const t of newT) b.ti.push(t.k);
  if (!newU.length && !newT.length && !chg && !first) return;
  w.bookSeen = 1; B = worldStats(); writeSave();
  if (first) { say(`冒險手冊開放了！右上「冊」看妖物圖鑑、傳說圖鑑、稱號和閉關${b.ti.length ? `；你已經有 ${b.ti.length} 個稱號` : ""}`, "#ffe9a8"); bookDot(true); return; }
  if (newU.length) say(`傳說圖鑑收錄「${newU.join("、")}」：攻擊 +0.3%`, "#ffb070");
  if (newT.length) { say(`得到稱號〔${newT.map((t) => t.n).join("〕〔")}〕！冒險手冊→稱號可以戴上`, "#ffe066"); bookDot(true); }
  if (ovKind === "book") renderBook();
}
setInterval(() => { if (inWorld && (state === "world" || (state === "pick" && pausedFrom === "world"))) bookScan(); }, 1500);

// ───────── 介面：右上「冊」 ─────────
let bookTab = "mob";
OV_TAB.book = "book"; OV_NAME.book = "冒險手冊"; OV_KEYS.book = ["escape", "k"];
const bookBtn = document.createElement("button");
bookBtn.className = "qbtn"; bookBtn.dataset.q = "book"; bookBtn.setAttribute("aria-label", "手冊"); bookBtn.title = "冒險手冊（K）";
bookBtn.innerHTML = '<b class="qglyph">冊</b><small>手冊</small>';
bookBtn.addEventListener("click", () => { if (state !== "world" && !ovKind) return; ovGo("book"); });
quickEl.insertBefore(bookBtn, quickEl.querySelector('[data-q="rank"]'));
const bookDot = (on) => { bookBtn.classList.toggle("dot", !!on); };
const _ovGoBk = ovGo;
ovGo = function (q) {
  if (q !== "book") return _ovGoBk.apply(this, arguments);
  if (ovKind) { if (ovKind === "book") return; ovSw = true; ovClose(); }
  if (state === "world") { sfx("click"); renderBook(); }
  ovSw = false;
};
window.addEventListener("keydown", (e) => {
  if (e.target && e.target.tagName === "INPUT") return;
  if (e.key.toLowerCase() !== "k" || e.repeat) return;
  if (state === "world" && !ovKind) ovGo("book"); else if (ovKind && ovKind !== "book" && !ovJust) ovGo("book");
});
const mobImgCache = {};
function mobImgURL(t) {
  if (mobImgCache[t]) return mobImgCache[t];
  let src; try { src = WMOBS[t].img(); } catch { return ""; }
  if (!src || !src.width) return "";
  const c = document.createElement("canvas"); c.width = src.width; c.height = src.height; c.getContext("2d").drawImage(src, 0, 0);
  return (mobImgCache[t] = c.toDataURL());
}
const mobZone = (t) => { if (t === "hunter") return "身上帶著沒帶回的寶物時會來追你"; const z = Object.keys(ZONES).find((k) => (ZONES[k].mobs || []).includes(t)); return z ? `${ZONES[z].n}（Lv.${ZONES[z].lv[0]}–${ZONES[z].lv[1]}）` : ""; };
const pips = (s) => `<span class="bkpips">${[0, 1, 2].map((i) => `<i class="${i < s ? "on" : ""}">★</i>`).join("")}</span>`;
function bookMobHtml() {
  const b = book(), st = bookStars();
  const mob = BOOK_MOBS.map((t) => {
    const n = b.k[t] || 0, s = mobStars(t), seen = n > 0, d = WMOBS[t];
    return `<div class="bkcard${seen ? "" : " unseen"}"><img src="${mobImgURL(t)}" alt=""><div><b>${seen ? d.n : "？？？"}</b>${pips(s)}
      <small>${mobZone(t)}</small><small>斬殺 ${n.toLocaleString()}　${n < 100 ? "／100" : n < 1000 ? "／1000" : ""}${b.c.includes(t) ? "　卡片 ✓" : CARDS[t] ? "　卡片 ✗" : ""}</small>
      ${s ? `<em>對${d.n}傷害 +${s}%</em>` : ""}</div></div>`;
  }).join("");
  const boss = RB_KEYS.map((k) => {
    const R = RBOSS[k], n = rbKills(k), s = bossStars(k);
    return `<div class="bkcard boss${n ? "" : " unseen"}"><div class="bkboss" style="background:rgb(${R.col})"></div><div><b>${n ? R.n : "？？？"}</b>${pips(s)}
      <small>${R.where}</small><small>擊敗 ${n}　${n < 1 ? "／1" : n < 10 ? "／10" : ""}${b.c.includes(BOOK_BOSS_CARD[k]) ? "　王卡 ✓" : "　王卡 ✗"}</small>
      ${s ? `<em>對${R.n}傷害 +${s}%</em>` : ""}</div></div>`;
  }).join("");
  return `<div class="bksum">妖物星數 <b>${st} / ${BOOK_STAR_MAX}</b>　→ 生命 <b>+${bookHpPct()}%</b>（每 10 顆星 +1%）<br><small>每種妖物 3 顆星：斬 100 隻、斬 1000 隻、拿過牠的卡片（王：首殺、擊敗 10 次、王卡）。每顆星對那種妖物傷害 +1%。</small></div>
    <div class="bkgrid">${mob}</div><div class="bkhead">區域王</div><div class="bkgrid">${boss}</div>`;
}
function bookUHtml() {
  const b = book();
  const where = (k) => { const U = UNIQUES[k]; if (U.rb) { const bk = RB_KEYS.find((r) => (RBOSS[r].loot || "").includes(U.n)); return bk ? `${RBOSS[bk].n}掉落` : "區域王掉落"; } return `野外、秘境隨機掉落（精英、獵寶妖比較容易）${slotOpen(U.slot) ? "" : `，${slotLockTxt(U.slot)}後才會掉`}`; };
  const list = BOOK_U.map((k) => {
    const U = UNIQUES[k], has = b.u.includes(k), ic = itemIcon({ slot: U.slot, wt: U.wt, u: k, q: 3 });
    return `<div class="bkcard u${has ? "" : " unseen"}">${ic}<div><b>${U.n}</b><small>${has ? U.d : where(k)}</small>${has ? "<em>已收錄　攻擊 +0.3%</em>" : ""}</div></div>`;
  }).join("");
  return `<div class="bksum">傳說收集 <b>${b.u.length} / ${BOOK_U.length}</b>　→ 攻擊 <b>+${bookAtkPct()}%</b>（每件 +0.3%）<br><small>拿到過就算收錄，賣掉也不會消失。灰色的還沒拿到，下面寫哪裡掉。</small></div><div class="bkgrid">${list}</div>`;
}
function bookTiHtml() {
  const b = book(), cur = myTitle();
  const rows = TITLES.map((t) => {
    const has = b.ti.includes(t.k), pr = !has && t.p ? t.p() : null;
    return `<div class="bkti${has ? "" : " lock"}${cur === t.k ? " on" : ""}"><b style="color:${has ? t.c : ""}">〔${t.n}〕</b><small>${t.d}${pr ? `（${Math.min(pr[0], pr[1]).toLocaleString()} / ${pr[1].toLocaleString()}）` : ""}</small>
      ${has ? `<button class="sbtn${cur === t.k ? "" : " gold"}" data-ti="${cur === t.k ? "" : t.k}">${cur === t.k ? "拿下" : "戴上"}</button>` : "<i>🔒</i>"}</div>`;
  }).join("");
  return `<div class="bksum">稱號 <b>${b.ti.length} / ${TITLES.length}</b>　戴著：<b style="color:${cur ? TITLE_BY[cur].c : ""}">${cur ? `〔${TITLE_BY[cur].n}〕` : "沒有"}</b><br><small>戴上的稱號會顯示在名字上面，別的玩家看得到。</small></div><div class="bktis">${rows}</div>`;
}
function bookMedHtml() {
  const w = save.w, b = book();
  if (medOn) {
    const min = (Date.now() - medOn) / 60000;
    return `<div class="bkmed on"><div class="medorb"></div><h3>閉關中</h3><p class="medt">${fmtHM(min)}</p>
      <p>${min < MED_MIN ? `再 ${Math.ceil(MED_MIN - min)} 分鐘才開始有感悟` : `現在出關可得經驗 <b>+${medExp(min).toLocaleString()}</b>`}${min / 60 >= MED_MAX_H ? "（已滿 8 小時）" : ""}</p>
      <p class="dim">可以直接關掉遊戲，下次上線自動結算。</p><div class="acts row"><button id="medEnd" class="gold">出關</button></div></div>`;
  }
  const can = medCan();
  return `<div class="bkmed"><h3>閉關修煉</h3>
    <p>在青雲城或營地結界裡閉關，或是直接下線，回來時依時間給經驗。<br>最多算 <b>${MED_MAX_H} 小時</b>，大約等於你平常玩 <b>30 分鐘</b>的量；不到 ${MED_MIN} 分鐘不算。</p>
    <div class="sr"><span>你最近的修煉速度</span><b>每分鐘約 ${Math.round(medRate()).toLocaleString()} 經驗${w.xrN ? "" : "（還在估算，多玩幾分鐘會更準）"}</b></div>
    <div class="sr"><span>閉關 8 小時可得</span><b>經驗 +${medExp(MED_MAX_H * 60).toLocaleString()}</b></div>
    <div class="sr"><span>累計閉關</span><b>${Math.floor(b.oh || 0)} 小時（24 小時得稱號〔閉關老祖〕）</b></div>
    <div class="acts row"><button id="medGo" class="gold"${can ? "" : " disabled"}>開始閉關</button></div>
    ${can ? "" : `<p class="dim">${typeof RIFT !== "undefined" && RIFT ? "秘境裡不能閉關" : "要在青雲城或營地結界裡才能閉關（下線也算）"}</p>`}</div>`;
}
let medTick = null;
function renderBook() {
  if (ovKind !== "book" && !ovOpen("book")) return;
  bookDot(false);
  if (medOn) bookTab = "med";
  const tabs = [["mob", "妖物"], ["u", "傳說"], ["ti", "稱號"], ["med", "閉關"]];
  const body = { mob: bookMobHtml, u: bookUHtml, ti: bookTiHtml, med: bookMedHtml }[bookTab]();
  ov.innerHTML = `<div class="col cw"><div class="panel wide equip bookwin">
    <div class="btabs">${tabs.map(([k, n]) => `<button class="btab${bookTab === k ? " on" : ""}" data-bt="${k}"${medOn && k !== "med" ? " disabled" : ""}>${n}</button>`).join("")}</div>
    <div class="bkbody">${body}</div></div></div>`;
  ov.querySelectorAll("[data-bt]").forEach((b) => b.addEventListener("click", () => { sfx("click"); bookTab = b.dataset.bt; renderBook(); }));
  ov.querySelectorAll("[data-ti]").forEach((b) => b.addEventListener("click", () => { sfx("good"); save.w.title = b.dataset.ti; writeSave(); if (typeof netSend === "function") netSend(); renderBook(); }));
  const go = document.getElementById("medGo"); if (go) go.onclick = () => { sfx("click"); medStart(); };
  const en = document.getElementById("medEnd"); if (en) en.onclick = () => { sfx("good"); ovClose(); };
  clearInterval(medTick); if (medOn) medTick = setInterval(() => { if (ovKind === "book" && medOn) { const p = ov.querySelector(".bkbody"); if (p) p.innerHTML = bookMedHtml(); const e2 = document.getElementById("medEnd"); if (e2) e2.onclick = () => { sfx("good"); ovClose(); }; } else clearInterval(medTick); }, 1000);
}
