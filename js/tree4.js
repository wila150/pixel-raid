// 企劃 73 B：天賦樹介面——加成總覽、縮放按鈕、右鍵退點、雙擊空白回到起點、底部操作說明
"use strict";
let trSumOn = false;
function trSumHtml() {
  const T = treeSt(), s = treeSum(), keys = Object.keys(s).filter((k) => TR_EFF[k] && s[k]);
  const notes = [], kss = [];
  for (const id of treeAll()) { const N = TREE[id]; if (!N) continue; if (N.t === "note") notes.push(trNodeName(N)); else if (N.t === "ks") kss.push(trNodeName(N)); }
  const a = treeAttr();
  const body = !T.s ? `<p class="dim">還沒有點天賦，先選一個起點吧！</p>`
    : `<div class="trsuml">${["str", "agi", "wis", "vit"].map((k) => `<span style="color:${TR_ATTR[k].c}">${TR_ATTR[k].n} ${a[k]}</span>`).join("")}</div>
      ${keys.length ? `<h4>數值</h4><div class="trsuml">${trEffTxt(Object.fromEntries(keys.map((k) => [k, Math.round(s[k] * 10) / 10]))).map((x) => `<span>${x}</span>`).join("")}</div>` : ""}
      ${notes.length ? `<h4>重要天賦（${notes.length}）</h4><div class="trsuml">${[...new Set(notes)].map((x) => `<span class="gold">${x}</span>`).join("")}</div>` : ""}
      ${kss.length ? `<h4>核心天賦</h4><div class="trsuml">${kss.map((x) => `<span style="color:#ff9ae0">${x}</span>`).join("")}</div>` : ""}`;
  return `<div class="trsumbox"><div class="trsumh"><b>天賦加成總覽</b><small>${TRM ? `含武器組 ${TRM} 專屬點` : "主樹＋手上這組的專屬點"}</small><button class="trb" data-trs="x">收起</button></div>${body}</div>`;
}
const _trPanel73 = trPanel;
trPanel = function () { // eslint-disable-line no-func-assign
  const r = _trPanel73.apply(this, arguments);
  const top = ov && ov.querySelector(".trtop"); if (!top) return r;
  top.insertAdjacentHTML("beforeend", `<button id="trSum" class="trb${trSumOn ? " on" : ""}">加成總覽</button><span class="trstone">靈石 ${save.stone}</span>`);
  const b = top.querySelector("#trSum"); if (b) b.onclick = (e) => { e.stopPropagation(); sfx("click"); trSumOn = !trSumOn; trPanel(); };
  const wrap = ov.querySelector(".trwrap"); if (!wrap) return r;
  wrap.querySelectorAll(".trsumbox").forEach((x) => x.remove());
  if (trSumOn) { wrap.insertAdjacentHTML("beforeend", trSumHtml()); const x = wrap.querySelector('[data-trs="x"]'); if (x) x.onclick = (e) => { e.stopPropagation(); trSumOn = false; trPanel(); }; const box = wrap.querySelector(".trsumbox"); box.addEventListener("pointerdown", (e) => e.stopPropagation()); }
  if (!wrap.querySelector(".trzoom")) {
    wrap.insertAdjacentHTML("beforeend", `<div class="trzoom"><button data-z="in" aria-label="放大">＋</button><button data-z="out" aria-label="縮小">－</button><button data-z="home" aria-label="回到我的格子">⌂</button><button data-z="all" aria-label="看全部">◎</button></div>
      <div class="trhelp">${TOUCH ? "點一下 看說明・兩指 縮放・拖曳 移動" : "左鍵 看說明／點亮・右鍵 退點・拖曳 移動・滾輪 縮放・雙擊空白 回到我的格子"}</div>`);
    wrap.querySelectorAll(".trzoom button").forEach((zb) => {
      zb.addEventListener("pointerdown", (e) => e.stopPropagation());
      zb.onclick = (e) => {
        e.stopPropagation(); sfx("click"); const k = zb.dataset.z;
        if (k === "in" || k === "out") trView.z = Math.max(0.2, Math.min(2.6, trView.z * (k === "in" ? 1.25 : 0.8)));
        else if (k === "home") trCenter();
        else { trView.x = 0; trView.y = 0; trView.z = Math.min(trCv.clientWidth, trCv.clientHeight) / 2900; }
        trDraw();
      };
    });
  }
  if (trCv && !trCv.dataset.t4) { // 右鍵退點、雙擊空白回到我的格子
    trCv.dataset.t4 = "1";
    trCv.addEventListener("contextmenu", (e) => {
      e.preventDefault(); const rc = trCv.getBoundingClientRect(), id = trHit(e.clientX - rc.left, e.clientY - rc.top);
      if (!id || !trHave().includes(id)) return;
      if (!trRemovable(id)) { trSel = id; renderTree("要先退外面的格子才能退這一格"); return; }
      const N = TREE[id], m = trUndo(id); trSel = null; sfx(m ? "bad" : "good"); renderTree(m || `退掉：${trNodeName(N)}`);
    });
    trCv.addEventListener("dblclick", (e) => { const rc = trCv.getBoundingClientRect(); if (!trHit(e.clientX - rc.left, e.clientY - rc.top)) { trCenter(); trDraw(); } });
  }
  return r;
};

// ───────── 11/13：天賦樹做詳細一點（照 Slay Monsters）：滑鼠提示框、路徑預覽、左鍵直接學、搜尋「找到 N 個」、重置先確認 ─────────
let trHov = null;
const TR_KIND = { hub: "樞紐", start: "起點", attr: "屬性", small: "小天賦", note: "重要天賦", ks: "核心天賦（有好有壞）", jw: "天賦玉槽" };
function trTipHtml(id) {
  const N = TREE[id]; if (!N) return "";
  const have = trHave().includes(id), lines = trNodeLines(N);
  let st;
  if (have) st = `<b class="ok">✔ 已學會</b>${id === treeSt().s ? "" : trRemovable(id) ? `<small>右鍵退點（${TRM ? "營地免費" : curN("regret") ? "1 洗心丹" : trUndoCost() + " 靈石"}）</small>` : `<small>要先退外面的格子才能退這一格</small>`}`;
  else {
    const path = trPath(id), why = trWhyNot(id, path);
    if (!treeSt().s && N.t === "start") st = `<b class="go">點擊選這個起點</b>`;
    else if (why) st = `<b class="bad">${why}</b>`;
    else st = `<b class="go">點擊學習${path.length > 1 ? `（連同路徑共 ${path.length} 點）` : "（1 點）"}</b><small>學完還剩 ${(TRM ? wsFree(TRM - 1) : treeFree()) - path.length} 點</small>`;
  }
  const extra = N.t === "start" ? `<small class="dim">適合：${TR_SEC[N.sec].fit}</small>` : N.t === "ks" ? `<small class="dim">Lv.${TR_KS_LV} 以後才能點</small>` : "";
  return `<div class="trtn" style="color:${N.t === "ks" ? "#ff9ae0" : N.t === "note" ? "#ffe066" : "#f0e2c4"}">${trNodeName(N)}<small>${TR_KIND[N.t] || ""}</small></div>
    <div class="trtl">${lines.map((x) => `<span>${x}</span>`).join("") || "<span class='dim'>（沒有效果，只是路）</span>"}</div>${extra}<div class="trts">${st}</div>`;
}
function trQuickLearn(id) { // 電腦左鍵：沒學過、走得到就直接學
  const N = TREE[id], T = treeSt();
  if (!N || trHave().includes(id)) return false;
  if (!T.s) { if (N.t !== "start" || TRM) return false; const m = trPickStart(id); sfx(m ? "bad" : "good"); trSel = null; renderTree(m || "起點選好了，往外點吧"); return true; }
  if (N.t === "jw") return false; // 玉槽要看說明卡（鑲玉）
  const path = trPath(id), why = trWhyNot(id, path);
  if (why) { sfx("bad"); trSel = id; renderTree(why); return true; }
  const n = path.length, m = trAlloc(id); sfx(m ? "bad" : "good"); trSel = null; renderTree(m || `學會：${trNodeName(N)}${n > 1 ? `（連同路徑 ${n} 點）` : ""}`); return true;
}
function trConfirmReset() {
  const T = treeSt(), n = TRM ? wsTree(TRM - 1).n.length : T.n.filter((x) => x !== T.s).length;
  const cost = TRM ? "營地免費" : T.fr ? "這次免費" : curN("regret") >= 5 ? "5 個洗心丹" : `${trResetCost()} 靈石（你有 ${save.stone}）`;
  const wrap = ov.querySelector(".trwrap"); if (!wrap) return;
  wrap.querySelectorAll(".trconf").forEach((x) => x.remove());
  wrap.insertAdjacentHTML("beforeend", `<div class="trconf"><div class="trcbox"><h3>${TRM ? `重置武器組 ${TRM} 的專屬點？` : "重置全部天賦？"}</h3><p>退還全部 <b>${n}</b> 點天賦${TRM ? "" : "（昇華也會清掉）"}，花費：<b>${cost}</b>。</p><div class="trcact"><button class="trb" data-c="no">取消</button><button class="trb gold" data-c="yes">確定重置</button></div></div></div>`);
  const box = wrap.querySelector(".trconf"); box.addEventListener("pointerdown", (e) => e.stopPropagation());
  box.querySelector('[data-c="no"]').onclick = (e) => { e.stopPropagation(); box.remove(); };
  box.querySelector('[data-c="yes"]').onclick = (e) => { e.stopPropagation(); box.remove(); const m = trReset(); if (!m) trSel = null; sfx(m ? "bad" : "good"); renderTree(m || (TRM ? `武器組 ${TRM} 的專屬點全部退回了` : "全部退回了，重新選起點")); };
}
const _trPanel1113 = trPanel;
trPanel = function () { // eslint-disable-line no-func-assign
  const r = _trPanel1113.apply(this, arguments);
  const rb = ov && ov.querySelector("#trReset"); if (rb) rb.onclick = (e) => { e.stopPropagation(); sfx("click"); trConfirmReset(); };
  const pts = ov && ov.querySelector(".trtop .trpts"); if (pts && !TRM) { const T = treeSt(); pts.innerHTML = `可用天賦點 <b class="${treeFree() > 0 ? "hot" : ""}">${treeFree()}</b><small>已學 ${T.n.filter((x) => x !== T.s).length} / ${treeTotal()}</small>`; }
  trSearchCount();
  { const inf = ov && ov.querySelector(".trinfo"); if (inf) inf.hidden = !trSel && !TRM && !!treeSt().s && matchMedia("(pointer: fine)").matches && !inf.querySelector(".trmsg"); } // 電腦有提示框了：沒選格子就不擋畫面
  const wrap = ov && ov.querySelector(".trwrap");
  if (wrap && !wrap.querySelector(".trtip")) wrap.insertAdjacentHTML("beforeend", `<div class="trtip" hidden></div>`);
  if (trCv && !trCv.dataset.t5) {
    trCv.dataset.t5 = "1";
    trCv.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || trPtr.size) return;
      const rc = trCv.getBoundingClientRect(), id = trHit(e.clientX - rc.left, e.clientY - rc.top), tip = ov.querySelector(".trtip"); if (!tip) return;
      if (id !== trHov) { trHov = id; trDraw(); if (id) tip.innerHTML = trTipHtml(id); }
      tip.hidden = !id; if (!id) return;
      const wr = ov.querySelector(".trwrap").getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
      let x = e.clientX - wr.left + 18, y = e.clientY - wr.top + 14;
      if (x + tw > wr.width - 8) x = e.clientX - wr.left - tw - 14; if (y + th > wr.height - 8) y = wr.height - th - 8;
      tip.style.left = Math.max(8, x) + "px"; tip.style.top = Math.max(8, y) + "px";
    });
    trCv.addEventListener("pointerleave", () => { trHov = null; const tip = ov.querySelector(".trtip"); if (tip) tip.hidden = true; trDraw(); });
  }
  return r;
};
function trSearchCount() {
  const q = ov && ov.querySelector(".trq"); if (!q) return;
  let c = ov.querySelector(".trqn"); if (!c) { q.insertAdjacentHTML("afterend", `<span class="trqn"></span>`); c = ov.querySelector(".trqn"); }
  c.style.top = q.style.top; c.textContent = trQ ? (trHitSet && trHitSet.size ? `找到 ${trHitSet.size} 個` : "沒有符合的") : "";
}
const _trSearch1113 = trSearch;
trSearch = function () { const r = _trSearch1113.apply(this, arguments); setTimeout(trSearchCount, 0); return r; }; // eslint-disable-line no-func-assign
// 學會／退點後提示框要更新
const _renderTree1113 = renderTree;
renderTree = function () { const r = _renderTree1113.apply(this, arguments); const tip = ov && ov.querySelector(".trtip"); if (tip && trHov && !tip.hidden) tip.innerHTML = trTipHtml(trHov); return r; }; // eslint-disable-line no-func-assign
