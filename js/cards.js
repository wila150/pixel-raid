// 萬劍仙途 — 魔物卡片頁＋右上「⋯更多」（v7.6，企劃 26）
// 卡片：上（橫向左邊）兩個卡槽、中間收集冊（拿過的亮、沒拿過的灰色寫哪裡掉）、右邊選了的卡＋一顆「插上」
"use strict";
let cdSel = null, cdSlot = null, cdTab = "all";
OV_TAB.cards = "cards"; OV_NAME.cards = "魔物卡片"; OV_KEYS.cards = ["escape", "l"];
OV_TAB.more = "more"; OV_NAME.more = "更多"; OV_KEYS.more = ["escape"];
const CD_KEYS = Object.keys(CARDS);
const cdSlotN = (s) => (s === "sword" ? "武器" : "道袍");
function cdWhere(c) {
  if (c === "hunter") return "獵寶妖（身上有沒帶回的寶物時會來追你）";
  const rb = Object.keys(BOOK_BOSS_CARD).find((k) => BOOK_BOSS_CARD[k] === c);
  if (rb) return `${RBOSS[rb].n}掉落`;
  if (WMOBS[c]) return `${WMOBS[c].n}・${mobZone(c)}`;
  return "";
}
const cdSeen = (c) => book().c.includes(c);
const cdIn = (c) => CARD_SLOTS.find((s) => save.eq[s] && save.eq[s].card === c);
function cdSlotsHtml() {
  return `<div class="cdslots">${CARD_SLOTS.map((s) => {
    const it = save.eq[s], c = it && it.card, ok = cdSel && CARDS[cdSel].slot === s;
    return `<button class="cdslot${ok ? " ok" : ""}${cdSlot === s ? " sel" : ""}" data-cs="${s}">
      <span class="cdart">${c ? ico("card", c, "cardico") : `<span class="cdemp">空</span>`}</span>
      <span class="cdtx"><small>${cdSlotN(s)}卡槽</small><b>${c ? CARDS[c].n : it ? "還沒插卡" : `沒穿${cdSlotN(s)}`}</b><small>${c ? cardDesc(c) : it ? it.name : ""}</small></span></button>`;
  }).join("")}</div>`;
}
function cdGridHtml() {
  const ks = CD_KEYS.filter((c) => cdTab === "all" || CARDS[c].slot === cdTab);
  return `<div class="cdgrid">${ks.map((c) => {
    const n = (save.cards && save.cards[c]) || 0, seen = cdSeen(c), ins = cdIn(c);
    return `<button class="cdc${n ? "" : seen ? " dim" : " unseen"}${cdSel === c ? " sel" : ""}" data-cd="${c}" title="${seen ? CARDS[c].n : "？？？"}">
      ${ico("card", c, "cardico")}<b>${seen ? CARDS[c].n.replace(/卡$/, "") : "？？？"}</b>${n ? `<em>×${n}</em>` : ""}${ins ? `<span class="cdins">插著</span>` : ""}</button>`;
  }).join("")}</div>`;
}
function cdInfoHtml() {
  if (!cdSel) return `<div class="cdinfo"><h3>魔物卡片</h3><p>點一張亮著的卡片，再按「插上」。</p><p class="dim">每件武器、道袍只能插一張，換卡時舊的那張會碎掉。灰色的卡還沒拿過，點了看哪裡掉。</p></div>`;
  const c = cdSel, C = CARDS[c], n = (save.cards && save.cards[c]) || 0, seen = cdSeen(c), it = save.eq[C.slot], old = it && it.card;
  let act;
  if (!n) act = `<p class="dim">${seen ? "現在沒有這張（拿過了，已經插掉或碎掉）" : "還沒拿過"}</p>`;
  else if (!it) act = `<p class="warn">先穿上一件${cdSlotN(C.slot)}</p>`;
  else act = `${old ? `<p class="warn">${it.name} 已經插著「${CARDS[old].n}」，換上去舊的會碎掉</p>` : ""}<button id="cdIns" class="smmain gold">插到${cdSlotN(C.slot)}上</button><small class="dim">${it.name}</small>`;
  return `<div class="cdinfo"><div class="cdbig${n ? "" : seen ? " dim" : " unseen"}">${ico("card", c, "cardico")}</div>
    <h3>${seen ? C.n : "？？？"}</h3><small>${cdSlotN(C.slot)}卡・持有 ${n}</small>
    ${seen ? `<p class="cdeff">${cardDesc(c)}</p>` : ""}<p class="dim">掉落：${cdWhere(c)}</p>${act}</div>`;
}
function renderCards(msg = "") {
  if (!save.w) return;
  if (ovKind !== "cards" && !ovOpen("cards")) return;
  if (msg) ovMsg = msg;
  const b = book(); save.w.cardSeen = b.c.length;
  const tabs = `<div class="btabs">${[["all", "全部"], ["sword", "武器卡"], ["robe", "道袍卡"]].map(([k, n]) => `<button class="btab${cdTab === k ? " on" : ""}" data-ct2="${k}">${n}</button>`).join("")}<small class="cdsum">收集 ${b.c.filter((c) => CARDS[c]).length} / ${CD_KEYS.length}</small></div>`;
  ov.innerHTML = `<div class="col l">${cdSlotsHtml()}</div><div class="col c">${tabs}${cdGridHtml()}</div><div class="col r">${cdInfoHtml()}</div>${ovMsg ? `<div class="toast">${ovMsg}</div>` : ""}`;
  ovMsg = "";
  const again = (m) => renderCards(m);
  ov.querySelectorAll("[data-ct2]").forEach((x) => x.addEventListener("click", () => { sfx("click"); cdTab = x.dataset.ct2; again(); }));
  ov.querySelectorAll("[data-cd]").forEach((x) => x.addEventListener("click", () => { sfx("click"); cdSel = cdSel === x.dataset.cd ? null : x.dataset.cd; again(); }));
  ov.querySelectorAll("[data-cs]").forEach((x) => x.addEventListener("click", () => {
    sfx("click"); const s = x.dataset.cs, it = save.eq[s];
    if (cdSel && CARDS[cdSel].slot === s && save.cards[cdSel] > 0 && it && !it.card) { again(insertCard(cdSel, s)); cdSel = null; return; }
    cdSlot = cdSlot === s ? null : s; if (it && it.card) cdSel = it.card; again();
  }));
  const ins = document.getElementById("cdIns");
  if (ins) ins.onclick = () => { const s = CARDS[cdSel].slot; const m = insertCard(cdSel, s); cdSel = null; again(m); };
}
const _ovSubCd = ovSub;
ovSub = function () { if (ovKind === "cards" && cdSel) { cdSel = null; renderCards(); return true; } return _ovSubCd.apply(this, arguments); };
const _ovCloseCd = ovClose;
ovClose = function () { if (ovKind === "cards") { cdSel = null; cdSlot = null; } return _ovCloseCd.apply(this, arguments); };
const cardsNew = () => save.w && save.w.created && book().c.length > (save.w.cardSeen || 0);

// ───────── 「⋯更多」：3×3 格子 ─────────
const MORE = [["cards", "魔物卡片", "卡", "L"], ["quest", "任務", "任", "Y"], ["book", "冒險手冊", "冊", "K"], ["social", "聊天", "聊", "G"], ["rank", "排行", "榜", "R"], ["menu", "設定", "設", "Esc"]];
const moreDot = (k) => (k === "cards" ? cardsNew() : k === "book" ? bookBtn.classList.contains("dot") : false);
function renderMore() {
  if (ovKind !== "more" && !ovOpen("more")) return;
  ov.innerHTML = `<div class="col cw"><div class="panel wide"><div class="moregrid">${MORE.map(([k, n, g, key]) => `<button class="moreb${moreDot(k) ? " dot" : ""}" data-mo="${k}"><b>${g}</b><span>${n}</span><small>${key}</small></button>`).join("")}</div></div></div>`;
  ov.querySelectorAll("[data-mo]").forEach((x) => x.addEventListener("click", () => { sfx("click"); ovGo(x.dataset.mo); }));
}
setInterval(() => { const m = document.querySelector('#quick .qbtn[data-q="more"]'); if (m && save.w && save.w.created) m.classList.toggle("dot", MORE.some(([k]) => moreDot(k))); }, 1000);
