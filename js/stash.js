// 萬劍仙途 — 營地倉庫＋行囊 30 格（企劃 53，總表第 41 項，v9.7）
// 倉庫 save.stash = { pg: [[裝備]×頁], nm: [頁名] }，帳號共用；只有在安全營地（atCamp）能開。一開始 4 頁×30，可以花靈石加到 8 頁。
// 行囊 BAG_MAX 30（只算裝備）。野外撿到時行囊滿了：撿不起來、留在地上（劍靈說一次、頭上「滿」）。
// 任務、王首殺、鍛造、兌換這類「給你的東西」：行囊滿了直接進倉庫，倉庫也滿才留在地上。
// sellall.js 後面載入（包 renderEquip、grantLoot）。
"use strict";
const STASH_PG = 30, STASH_BASE = 4, STASH_MAXPG = 8, STASH_COST = [3000, 8000, 20000, 50000];
function stashSt() {
  if (!save.stash) save.stash = { pg: [], nm: [] };
  const S = save.stash; while (S.pg.length < STASH_BASE) S.pg.push([]); if (!S.nm) S.nm = [];
  return S;
}
const stashCount = () => stashSt().pg.reduce((s, p) => s + p.length, 0);
const stashCap = () => stashSt().pg.length * STASH_PG;
const stashName = (i) => stashSt().nm[i] || `第 ${i + 1} 頁`;
function stashPut(it, pref) { // 放進倉庫（先放指定頁，滿了找下一頁有空的）
  const S = stashSt(), order = pref !== undefined ? [pref].concat(S.pg.map((_, i) => i).filter((i) => i !== pref)) : S.pg.map((_, i) => i);
  for (const i of order) if (S.pg[i].length < STASH_PG) { delete it.risk; S.pg[i].push(it); return i; }
  return -1;
}
// 「給你的東西」：先行囊，滿了倉庫；回傳 "bag" / "stash" / ""（兩邊都滿）
function bagAdd(it) {
  if (save.bag.length < BAG_MAX) { save.bag.push(it); return "bag"; }
  if (stashPut(it) >= 0) { if (typeof notice === "function") notice(`行囊滿了：${it.name} 放進倉庫`, "#9fdcff"); return "stash"; }
  return "";
}
const bagRoomAny = () => save.bag.length < BAG_MAX || stashCount() < stashCap();
// 野外撿東西：行囊滿了就撿不起來（任務／王給的 safe 掉落改進倉庫，倉庫也滿才擋）
function bagHold(o) {
  if (save.bag.length < BAG_MAX) return false;
  if (o.safe && stashCount() < stashCap()) return false;
  if (!W0.bagFullT || time - W0.bagFullT > 2.5) { W0.bagFullT = time; floatText(W0.x, W0.y - 24, "行囊滿了", "#ff9a7a"); }
  if (typeof seenHint === "function") seenHint("bagfull", `行囊最多 ${BAG_MAX} 件裝備，滿了就撿不起來（東西會留在地上）。可以一鍵出售騰位置，或回營地把東西放進倉庫`);
  return true;
}
const _grantLootSt = grantLoot;
grantLoot = function (it, x, y) {
  if (save.bag.length < BAG_MAX || !inWorld) return _grantLootSt.apply(this, arguments);
  if (stashPut(it) >= 0) { loot.push(it); writeSave(); if (x !== undefined) floatText(x, y - 20, `${RARITY[it.q].n}・${it.name}（行囊滿：進倉庫）`, RARITY[it.q].c, it.q >= 2); return; }
  if (W0) { wDrop({ kind: "item", it, safe: true }, { x: W0.x, y: W0.y }); floatText(W0.x, W0.y - 24, "行囊、倉庫都滿了：留在地上", "#ff9a7a", true); }
};
// 舊存檔：行囊超過 30 件，最差的（沒鎖、不在武器組）搬進倉庫
function stashMig() {
  if (!save.w || save.stashMig) return;
  stashSt(); let n = 0;
  if (save.bag.length > BAG_MAX) {
    const cand = save.bag.filter((it) => !it.lock && !(save.w.ws || []).includes(it)).sort((a, b) => itemCP(a) - itemCP(b));
    while (save.bag.length > BAG_MAX && cand.length) { const it = cand.shift(); if (stashPut(it) < 0) break; save.bag.splice(save.bag.indexOf(it), 1); n++; }
  }
  save.stashMig = 1; writeSave();
  if (n && typeof notice === "function") notice(`行囊改成最多 ${BAG_MAX} 件裝備：多出來的 ${n} 件已經放進倉庫（在營地打開行囊 →「倉庫」）`, "#9fdcff");
}
setInterval(() => { if (W0 && inWorld) stashMig(); }, 2000);

// ───────── 倉庫畫面（覆蓋層 k-stash）─────────
OV_NAME.stash = "倉庫"; OV_TAB.stash = "bag";
let stPage = 0, stTab = "stash", stSel = new Set(), stLP = null, stLPfired = false;
const stIn = (side) => (side === "b" ? save.bag : stashSt().pg[stPage]);
const stLocked = (it) => !!(save.w.ws || []).includes(it);
function stCell(it, side) {
  const sel = stSel.has(side + ":" + it.id);
  return `<button class="stc q${it.q}${sel ? " sel" : ""}" data-s="${side}" data-id="${it.id}" title="${it.name}・戰 ${itemCP(it)}${stLocked(it) ? "（武器組）" : ""}" style="--c:${RARITY[it.q].c}">${itemIcon(it)}${it.en ? `<span class="en">+${it.en}</span>` : ""}${it.lock ? `<em class="lockic">${LOCK_SVG}</em>` : ""}${stLocked(it) ? '<em class="wsic">組</em>' : ""}</button>`;
}
const stGrid = (arr, side, cap) => { const c = arr.map((it) => stCell(it, side)); while (c.length < cap) c.push('<span class="stc empty"></span>'); return c.join(""); };
function stSort(arr) { arr.sort((a, b) => b.q - a.q || itemCP(b) - itemCP(a)); }
function stMove(side, it) { // 搬到另一邊；回傳錯誤字或 ""
  if (side === "b") {
    if (stLocked(it)) return `${it.name} 在武器組裡，先從武器組拿下來`;
    const pg = stashPut(it, stPage); if (pg < 0) return "倉庫滿了";
    save.bag.splice(save.bag.indexOf(it), 1); if (eqSel === it.id) eqSel = null; return "";
  }
  if (save.bag.length >= BAG_MAX) return "行囊滿了";
  const P = stashSt().pg[stPage]; P.splice(P.indexOf(it), 1); save.bag.push(it); return "";
}
function renderStash(msg = "") {
  if (!atCamp()) { if (ovKind === "stash") ovClose(); if (typeof notice === "function") notice("倉庫只能在安全營地（傳送點、青雲城）打開", "#ff9a7a"); return; }
  if (ovKind !== "stash" && !ovOpen("stash")) return;
  const S = stashSt(); if (stPage >= S.pg.length) stPage = 0;
  const P = S.pg[stPage], por = PORTRAIT(), next = S.pg.length < STASH_MAXPG ? STASH_COST[S.pg.length - STASH_BASE] : 0;
  const nSel = stSel.size;
  const bagCol = `<div class="stw${por && stTab !== "bag" ? " hid" : ""}"><div class="sth"><b>行囊</b><small>${save.bag.length} / ${BAG_MAX}</small><button data-st="sortb">排序</button></div><div class="stgrid">${stGrid(save.bag, "b", BAG_MAX)}</div></div>`;
  const stCol = `<div class="stw${por && stTab !== "stash" ? " hid" : ""}"><div class="sth"><b>倉庫</b><small>${stashCount()} / ${stashCap()}</small><button data-st="sorts">排序</button><button data-st="ren">改名</button>${next ? `<button data-st="buy" ${save.stone >= next ? "" : "disabled"}>加開第 ${S.pg.length + 1} 頁・${next} 靈石</button>` : ""}</div>
    <div class="stpages">${S.pg.map((p, i) => `<button data-pg="${i}" class="${i === stPage ? "on" : ""}">${stashName(i)}<small>${p.length}</small></button>`).join("")}</div>
    <div class="stgrid">${stGrid(P, "s", STASH_PG)}</div></div>`;
  ov.innerHTML = `<div class="col cw stash">
    ${por ? `<div class="sttabs"><button data-tab="bag" class="${stTab === "bag" ? "on" : ""}">行囊 ${save.bag.length}/${BAG_MAX}</button><button data-tab="stash" class="${stTab === "stash" ? "on" : ""}">倉庫 ${stashCount()}/${stashCap()}</button></div>` : ""}
    <p class="dim sthelp">點一下＝搬到${por ? "另一個分頁" : "另一邊"}；長按＝多選。倉庫裡的裝備不能穿、不能精煉、不能插卡，要先拿回行囊。</p>
    <div class="stcols">${bagCol}${stCol}</div>
    ${nSel ? `<div class="stbar"><span>選了 ${nSel} 件</span><button data-st="mv" class="gold">搬過去</button><button data-st="lock">鎖定／解鎖</button><button data-st="clr">取消</button></div>` : ""}
    <div class="acts"><button data-st="back">回行囊</button></div>
  </div>${msg ? `<div class="toast">${msg}</div>` : ""}`;
  const again = (m) => renderStash(m), find = (side, id) => stIn(side).find((x) => String(x.id) === id);
  ov.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { sfx("click"); stTab = b.dataset.tab; again(); }));
  ov.querySelectorAll("[data-pg]").forEach((b) => b.addEventListener("click", () => { sfx("click"); stPage = +b.dataset.pg; stSel = new Set([...stSel].filter((k) => k[0] === "b")); again(); }));
  ov.querySelectorAll(".stc[data-id]").forEach((c) => {
    const key = c.dataset.s + ":" + c.dataset.id;
    c.addEventListener("pointerdown", () => { stLPfired = false; clearTimeout(stLP); stLP = setTimeout(() => { stLPfired = true; sfx("click"); if (stSel.has(key)) stSel.delete(key); else stSel.add(key); again(); }, 450); });
    for (const ev of ["pointerup", "pointerleave", "pointercancel"]) c.addEventListener(ev, () => clearTimeout(stLP));
    c.addEventListener("click", () => {
      if (stLPfired) { stLPfired = false; return; }
      if (stSel.size) { if (stSel.has(key)) stSel.delete(key); else stSel.add(key); sfx("click"); again(); return; }
      const it = find(c.dataset.s, c.dataset.id); if (!it) return;
      const e = stMove(c.dataset.s, it); if (e) { sfx("bad"); again(e); return; }
      writeSave(); sfx("click"); again(c.dataset.s === "b" ? `${it.name} → 倉庫` : `${it.name} → 行囊`);
    });
  });
  const on = (k, f) => { const e = ov.querySelector(`[data-st="${k}"]`); if (e) e.onclick = (ev) => { ev.stopPropagation(); f(); }; };
  on("sortb", () => { stSort(save.bag); writeSave(); sfx("click"); again(); });
  on("sorts", () => { stSort(P); writeSave(); sfx("click"); again(); });
  on("ren", () => { const t = window.prompt("這一頁的名字（最多 6 個字）", stashName(stPage)); if (t === null) return; const s = t.trim().slice(0, 6); S.nm[stPage] = s || undefined; writeSave(); again(s ? `改名：${s}` : "名字恢復預設"); });
  on("buy", () => { if (S.pg.length >= STASH_MAXPG || save.stone < next) return; save.stone -= next; S.pg.push([]); stPage = S.pg.length - 1; writeSave(); sfx("arrive"); again(`倉庫加開第 ${S.pg.length} 頁（−${next} 靈石）`); });
  on("clr", () => { stSel.clear(); again(); });
  on("lock", () => { for (const k of stSel) { const it = find(k[0], k.slice(2)); if (it) { if (it.lock) delete it.lock; else it.lock = 1; } } stSel.clear(); writeSave(); sfx("click"); again("鎖定狀態換了"); });
  on("mv", () => {
    let ok = 0, err = "";
    for (const k of [...stSel]) { const it = find(k[0], k.slice(2)); if (!it) continue; const e = stMove(k[0], it); if (e) err = e; else ok++; }
    stSel.clear(); writeSave(); sfx("click"); again(`搬了 ${ok} 件${err ? `（${err}）` : ""}`);
  });
  on("back", () => { stSel.clear(); ovGo("bag"); });
}
// 行囊標題加「倉庫」按鈕（營地才能按）
const _renderEquipSt = renderEquip;
renderEquip = function () {
  const r = _renderEquipSt.apply(this, arguments);
  if (ovKind !== "bag") return r;
  const h2 = ov.querySelector(".bagwin h2");
  if (h2 && !h2.querySelector("#stashBtn")) {
    const b = document.createElement("button"); b.id = "stashBtn"; b.className = "sellall stashbtn"; b.textContent = "倉庫";
    if (!atCamp()) { b.classList.add("off"); b.title = "回營地才能打開倉庫"; }
    h2.appendChild(b); b.onclick = (e) => { e.stopPropagation(); sfx("click"); if (!atCamp()) { renderEquip("倉庫只能在安全營地（傳送點、青雲城）打開"); return; } stSel.clear(); renderStash(); };
  }
  return r;
};
const _ovCloseSt = ovClose;
ovClose = function () { stSel.clear(); return _ovCloseSt.apply(this, arguments); };
// 頭上「滿」
const _drawCampsSt = drawCamps;
drawCamps = function () {
  _drawCampsSt.apply(this, arguments);
  if (!W0 || !save.bag || save.bag.length < BAG_MAX) return;
  ctx.save(); ctx.font = "bold 7px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 2; ctx.strokeStyle = "rgba(0,0,0,0.8)";
  ctx.strokeText("滿", W0.x + 12, W0.y - 30); ctx.fillStyle = "#ff9a7a"; ctx.fillText("滿", W0.x + 12, W0.y - 30); ctx.restore();
};
