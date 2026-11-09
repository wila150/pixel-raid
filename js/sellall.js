// 萬劍仙途 — 一鍵出售＋鎖定（v7.9，總表第 25 項，企劃 38）
// 行囊標題右邊「一鍵出售」→ 小視窗：品質勾選（預設凡、靈）、「比身上強的也賣」、即時件數／靈石、縮圖點一下排除；野外也能賣
// 不賣：身上穿的、武器組的、比身上強的（除非勾選）、上鎖的。賣掉時卡片、舊寶石退回（ungem）
"use strict";
let sellOpen = false, sellEx = new Set();
const LOCK_SVG = '<svg class="lksvg" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="8" rx="1.5" fill="#ffd84a"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="#ffd84a" stroke-width="2"/></svg>';
const sellPref = () => { const w = save.w; if (!w.sell) w.sell = { q: [0, 1], better: 0 }; return w.sell; };
const isBetterIt = (it) => sameWt(it) && itemCP(it) > itemCP(save.eq[it.slot]);
const inWset = (it) => !!(save.w && save.w.ws && save.w.ws.includes(it));
function sellPick(all) { // all＝不看手動排除（算「可以賣的」）
  const P = sellPref();
  return save.bag.filter((it) => it && !it.lock && !inWset(it) && P.q.includes(it.q) && (P.better || !isBetterIt(it)) && (all || !sellEx.has(it.id)));
}
function sellPopHtml() {
  const P = sellPref(), cand = sellPick(true), L = cand.filter((it) => !sellEx.has(it.id)), sum = L.reduce((s, it) => s + sellPrice(it), 0);
  const locked = save.bag.filter((it) => it.lock).length, better = save.bag.filter((it) => !it.lock && P.q.includes(it.q) && isBetterIt(it)).length;
  return `<div class="sellpop"><div class="sellbox">
    <h3>一鍵出售</h3>
    <div class="sellq">${RARITY.map((r, q) => `<label style="--c:${r.c}"><input type="checkbox" data-sq="${q}" ${P.q.includes(q) ? "checked" : ""}><span>${r.n}</span></label>`).join("")}</div>
    <label class="sellb"><input type="checkbox" id="sellBetter" ${P.better ? "checked" : ""}><span>比身上強的也賣${better && !P.better ? `（有 ${better} 件）` : ""}</span></label>
    <div class="sellsum">會賣掉 <b>${L.length}</b> 件，得到 <b class="gold">${sum}</b> 靈石</div>
    <div class="sellgrid">${cand.map((it) => `<button class="sellc q${it.q}${sellEx.has(it.id) ? " ex" : ""}" data-sx="${it.id}" title="${it.name}" style="--c:${RARITY[it.q].c}">${itemIcon(it)}${it.en ? `<span class="en">+${it.en}</span>` : ""}</button>`).join("") || `<p class="dim">沒有符合的裝備</p>`}</div>
    <small class="dim">點縮圖可以排除那件。不會賣：身上穿的、武器組的、上鎖的${LOCK_SVG}${locked ? `（${locked} 件）` : ""}${P.better ? "" : "、比身上強的"}。插著的卡片、寶石會退回。</small>
    <div class="sellacts"><button id="sellCancel">取消</button><button id="sellGo" class="red" ${L.length ? "" : "disabled"}>出售</button></div>
  </div></div>`;
}
function sellDo() {
  const L = sellPick(false); if (!L.length) return "";
  let sum = 0; for (const it of L) { ungem(it); sum += sellPrice(it); }
  const set = new Set(L); save.bag = save.bag.filter((it) => !set.has(it)); save.stone += sum;
  eqSel = null; writeSave(); sfx("arrive");
  return `賣掉 ${L.length} 件，靈石 +${sum}`;
}
function sellBind() {
  const pop = ov.querySelector(".sellpop"); if (!pop) return;
  const re = () => { pop.outerHTML = sellPopHtml(); sellBind(); };
  pop.addEventListener("click", (e) => { e.stopPropagation(); if (e.target === pop) { sellOpen = false; renderEquip(); } });
  pop.querySelectorAll("[data-sq]").forEach((x) => x.addEventListener("change", () => { const P = sellPref(), q = +x.dataset.sq; P.q = x.checked ? [...new Set(P.q.concat(q))] : P.q.filter((v) => v !== q); writeSave(); re(); }));
  const bt = document.getElementById("sellBetter"); if (bt) bt.onchange = () => { sellPref().better = bt.checked ? 1 : 0; writeSave(); re(); };
  pop.querySelectorAll("[data-sx]").forEach((x) => x.addEventListener("click", () => { sfx("click"); const id = isNaN(+x.dataset.sx) ? x.dataset.sx : +x.dataset.sx; if (sellEx.has(id)) sellEx.delete(id); else sellEx.add(id); re(); }));
  document.getElementById("sellCancel").onclick = () => { sfx("click"); sellOpen = false; renderEquip(); };
  document.getElementById("sellGo").onclick = () => { const m = sellDo(); sellOpen = false; renderEquip(m); };
}
const _renderEquipSa = renderEquip;
renderEquip = function () {
  const r = _renderEquipSa.apply(this, arguments);
  if (ovKind !== "bag") return r;
  const h2 = ov.querySelector(".bagwin h2");
  if (h2 && !h2.querySelector("#sellAll")) { const b = document.createElement("button"); b.id = "sellAll"; b.className = "sellall"; b.textContent = "一鍵出售"; h2.appendChild(b); b.onclick = (e) => { e.stopPropagation(); sfx("click"); sellOpen = true; sellEx = new Set(); renderEquip(); }; }
  const old = document.getElementById("sellJunk"); if (old) old.remove();
  // 格子角落小鎖頭
  ov.querySelectorAll(".bcell[data-id]").forEach((c) => { const it = save.bag.find((x) => String(x.id) === c.dataset.id); if (it && it.lock) c.insertAdjacentHTML("beforeend", `<em class="lockic">${LOCK_SVG}</em>`); });
  // 物品說明：鎖定／解鎖
  const sel = eqSel && !String(eqSel).startsWith("eq:") ? save.bag.find((x) => x.id === eqSel) : null;
  const acts = ov.querySelector(".col.r .acts");
  if (sel && acts) {
    const lb = document.createElement("button"); lb.id = "lockIt"; lb.innerHTML = `${LOCK_SVG}${sel.lock ? "解鎖" : "鎖定"}`; acts.appendChild(lb);
    lb.onclick = () => { sfx("click"); sel.lock = sel.lock ? 0 : 1; if (!sel.lock) delete sel.lock; writeSave(); renderEquip(sel.lock ? `${sel.name} 鎖定了（一鍵出售不會賣）` : `${sel.name} 解鎖了`); };
    if (sel.lock) { const s = document.getElementById("sell"); if (s) { s.disabled = true; s.textContent = "已鎖定"; } }
  }
  if (sellOpen) { ov.insertAdjacentHTML("beforeend", sellPopHtml()); sellBind(); }
  return r;
};
const _ovCloseSa = ovClose;
ovClose = function () { sellOpen = false; return _ovCloseSa.apply(this, arguments); };
const _ovSubSa = ovSub;
ovSub = function () { if (ovKind === "bag" && sellOpen) { sellOpen = false; renderEquip(); return true; } return _ovSubSa.apply(this, arguments); };
