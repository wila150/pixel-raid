// 萬劍仙途 — 物理減免＋四元素抗性（v6.8，企劃 22）：riftmod.js 後面載入
// 計算在 world.js（hitEle／effRes／resPen）、詞綴在 equip.js；這裡放舊存檔轉換、換裝比較抗性、進到扣抗性地區的說明
"use strict";

// ───── 舊存檔：「元素抗性 N%」→「全元素抗性 N/2%」、精髓搬家、送避雷丹＋避毒丹的材料 ─────
function resMigItem(it) {
  if (!it || typeof it !== "object" || !it.aff || it.aff.res === undefined) return 0;
  it.aff.resA = (it.aff.resA || 0) + Math.max(1, Math.round(it.aff.res / 2)); delete it.aff.res;
  if (it.jie === "res") it.jie = "resA";
  if (typeof nameItem === "function" && it.slot) nameItem(it);
  return 1;
}
function resMigrate() {
  if (!save || !save.w || save.resMig) return;
  let n = 0;
  const seen = new Set(), walk = (o, d) => { if (!o || typeof o !== "object" || seen.has(o) || d > 6) return; seen.add(o); n += resMigItem(o); for (const k in o) walk(o[k], d + 1); };
  walk(save, 0);
  if (save.ess && save.ess.res) { save.ess.resA = (save.ess.resA || 0) + save.ess.res; delete save.ess.res; }
  save.resMig = 1;
  if (save.w.created && typeof addMat === "function") { addMat("tfeather", 10); addMat("venomsac", 10); save.stone = (save.stone || 0) + 700; }
  writeSave();
  if (W0 && inWorld) { B = worldStats(); notice(`抗性改版：分成火、冰、雷、混沌四種，越深的地方扣越多。舊的元素抗性變成全元素抗性一半${n ? `（${n} 件）` : ""}。送你避雷丹、避毒丹的材料各一份（工藝台 → 煉丹）`, "#ffe066"); }
}
setInterval(resMigrate, 2500);

// ───── 換裝比較：抗性變化（綠↑紅↓）─────
const _cmpRowsRs = cmpRows;
cmpRows = function (sel, cur) {
  let h = _cmpRowsRs.apply(this, arguments);
  if (!save.w || !sel || sel.slot === undefined || cur === sel || save.eq[sel.slot] === sel) return h;
  const slot = sel.slot, old = save.eq[slot], before = worldStats();
  save.eq[slot] = sel; let after; try { after = worldStats(); } finally { if (old) save.eq[slot] = old; else delete save.eq[slot]; }
  const parts = [["物理", physRed(before), physRed(after)]].concat(ELES.map((e) => [RES_S[e], effRes(e, before), effRes(e, after)]))
    .filter(([, a, b]) => Math.round(a * 100) !== Math.round(b * 100))
    .map(([n, a, b]) => `${n} ${Math.round(a * 100)}%→<em class="${b > a ? "up" : "down"}">${Math.round(b * 100)}% ${b > a ? "↑" : "↓"}</em>`);
  return parts.length ? h + `<div class="stat resdiff"><span>穿上後抗性</span><b>${parts.join("　")}</b></div>` : h;
};

// ───── 第一次走進會扣抗性的地方：劍靈說明 ─────
const _updateWorldRes22 = updateWorld;
updateWorld = function (dt) {
  _updateWorldRes22.apply(this, arguments);
  if (!W0 || !save.w || state !== "world") return;
  const pen = resPen(); if (pen <= 0) return;
  const low = ELES.filter((e) => effRes(e) < 0).map((e) => RES_S[e]);
  seenHint("respen", `這裡的妖氣很重：四種元素抗性都 −${Math.round(pen * 100)}%（越往東扣越多）。${low.length ? `你現在${low.join("、")}抗性是負的，被打會比較痛。` : ""}戒指、耳飾比較常出抗性詞綴，也可以吃避火／避寒／避雷／避毒丹。`);
};
