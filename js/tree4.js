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
