// 萬劍仙途 — 採集點（企劃 23 B、17 §3-1，總表第 16 項）
// 靈草（草原／森林／沼澤）、玄鐵礦（荒原／火山／雷谷）、靈晶（雪域／仙域）；每區 7 個固定點，站著不動 1.5 秒，被打或移動就中斷，採完 3 分鐘重生
// 用途：丹藥 +2 靈草、精煉 +4～+9 每次 1 玄鐵礦、部位／王裝鍛造 +5 靈晶。存 save.mat（三角色共用，撿到就安全）；手冊多「採集」星（100／1000 次）
"use strict";
Object.assign(MATS, {
  herb: { n: "靈草", gz: ["grass", "forest", "swamp"], rare: 0, c: "#7dff8a" },
  ore: { n: "玄鐵礦", gz: ["waste", "volcano", "thunder"], rare: 0, c: "#a8b0c8" },
  crystal: { n: "靈晶", gz: ["snow", "sky"], rare: 0, c: "#9fe8ff" },
});
const GATHER_K = { grass: "herb", forest: "herb", swamp: "herb", waste: "ore", volcano: "ore", thunder: "ore", snow: "crystal", sky: "crystal" };
const GATHER_T = 1.5, GATHER_RESPAWN = 180, GATHER_PER = 7;
for (const r of RECIPES) { if (r.kind === "pill") r.need.herb = 2; if (r.kind === "forge" || r.kind === "slot") r.need.crystal = 5; }
const _enhNeedG = enhNeed;
enhNeed = function (it) { const n = (it.en || 0) + 1, nd = _enhNeedG.apply(this, arguments); if (n < 4 || n > 9) return nd; return Object.assign(nd || {}, { ore: 1 }); };
let gNodes = null;
function gatherInit() {
  if (gNodes || !W0 || !W0.camps || !W0.camps.length) return gNodes;
  gNodes = []; let seed = 7001;
  for (const z in GATHER_K) for (const o of evSpots(z, GATHER_PER, seed += 97, 150)) gNodes.push({ x: o.x, y: o.y, z, k: GATHER_K[z], t: 0 });
  return gNodes;
}
const inRiftG = () => typeof RIFT !== "undefined" && RIFT;
const _updateWorldG = updateWorld;
updateWorld = function (dt) {
  const ox = W0 ? W0.x : 0, oy = W0 ? W0.y : 0, hp0 = W0 ? W0.hp : 0;
  const r = _updateWorldG.apply(this, arguments);
  if (!W0 || inRiftG() || !gatherInit()) return r;
  const p = W0; let on = null, bd = 16;
  for (const n of gNodes) { if (n.t > 0) { n.t -= dt; continue; } const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < bd) { bd = d; on = n; } }
  const moved = Math.hypot(p.x - ox, p.y - oy) > 0.2 || p.roll > 0, hurt = p.hp < hp0 || p.hurt > 0.15;
  if (!on || on !== p.gNode || moved || hurt || state !== "world") { if (p.gT > 0.25 && on && (moved || hurt)) floatText(p.x, p.y - 24, hurt ? "採集被打斷" : "採集中斷", "#ff9a7a"); p.gNode = on; p.gT = 0; }
  if (on && !moved && !hurt && state === "world") {
    if (!p.gT) seenHint("gather", "採集點：站在上面不動 1.5 秒就能採；被打或移動會中斷");
    p.gT = (p.gT || 0) + dt;
    if (p.gT >= GATHER_T) {
      const deep = ZONES[on.z].lv[0] >= 50, n = deep ? 2 + (Math.random() < 0.5 ? 1 : 0) : 1 + (Math.random() < 0.5 ? 1 : 0);
      addMat(on.k, n); on.t = GATHER_RESPAWN; p.gT = 0; p.gNode = null;
      const b = book(); b.gc = (b.gc || 0) + 1; if (b.gc === 100 || b.gc === 1000) { B = worldStats(); notice(`採集 ${b.gc} 次！手冊「採集」多一顆星：生命 +0.1%`, "#7dff8a"); }
      floatText(on.x, on.y - 22, `${MATS[on.k].n} +${n}（${matN(on.k)}）`, MATS[on.k].c, true); burst(on.x, on.y, MATS[on.k].c, 14, 60, 0.4); sfx("good"); writeSave();
    }
  }
  return r;
};
function drawGNode(n) {
  const x = n.x, y = n.y, s = Math.sin(time * 3 + x) * 0.5 + 0.5;
  if (n.k === "herb") { glow(x, y - 3, 9 + s * 3, "125,255,138", 0.35); ctx.fillStyle = "#2e7a3a"; ctx.fillRect(x - 4, y - 2, 8, 2); ctx.fillStyle = "#5ad06a"; ctx.fillRect(x - 3, y - 6, 2, 5); ctx.fillRect(x + 1, y - 7, 2, 6); ctx.fillStyle = "#c8ffb0"; ctx.fillRect(x - 3, y - 8, 2, 2); ctx.fillRect(x + 1, y - 9, 2, 2); }
  else if (n.k === "ore") { glow(x, y - 3, 8 + s * 2, "200,210,240", 0.25); ctx.fillStyle = "#3a3a48"; ctx.fillRect(x - 6, y - 6, 12, 7); ctx.fillStyle = "#5a5a6a"; ctx.fillRect(x - 4, y - 8, 8, 3); ctx.fillStyle = s > 0.5 ? "#ffffff" : "#c8d0e8"; ctx.fillRect(x - 3, y - 5, 2, 2); ctx.fillRect(x + 2, y - 3, 2, 1); ctx.fillRect(x, y - 7, 1, 1); }
  else { glow(x, y - 5, 10 + s * 3, "159,232,255", 0.4); ctx.fillStyle = "#6ac8f0"; ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x + 4, y - 5); ctx.lineTo(x, y); ctx.lineTo(x - 4, y - 5); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#e8faff"; ctx.fillRect(x - 1, y - 9, 1, 3); }
}
const _drawCampsG = drawCamps;
drawCamps = function () {
  _drawCampsG.apply(this, arguments);
  if (!W0 || inRiftG() || !gNodes) return;
  const p = W0; ctx.save(); ctx.textAlign = "center";
  for (const n of gNodes) {
    if (n.t > 0 || Math.abs(n.x - p.x) > 320 || Math.abs(n.y - p.y) > 220) continue;
    drawGNode(n);
    if (Math.hypot(n.x - p.x, n.y - p.y) < 40) { ctx.font = "bold 6px 'Noto Sans TC', sans-serif"; ctx.lineWidth = 2; ctx.strokeStyle = "#000"; ctx.strokeText("採集", n.x, n.y - 15); ctx.fillStyle = MATS[n.k].c; ctx.fillText("採集", n.x, n.y - 15); }
  }
  if (p.gT > 0) { ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y - 26, 6, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = "#7dff8a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y - 26, 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, p.gT / GATHER_T)); ctx.stroke(); }
  ctx.restore();
};
// 手冊：採集星（100／1000 次，各生命 +0.1%）
const gatherStars = () => { const c = (save.w && save.w.book && save.w.book.gc) || 0; return (c >= 100 ? 1 : 0) + (c >= 1000 ? 1 : 0); };
const _worldStatsG = worldStats;
worldStats = function () { const b = _worldStatsG.apply(this, arguments); const s = gatherStars(); if (s) b.maxHp = Math.round(b.maxHp * (1 + s * 0.001)); return b; };
const _bookMobHtmlG = bookMobHtml;
bookMobHtml = function () {
  const c = (save.w.book && save.w.book.gc) || 0, s = gatherStars();
  const pip = `<span class="bkpips">${[0, 1].map((i) => `<i class="${i < s ? "on" : ""}">★</i>`).join("")}</span>`;
  return _bookMobHtmlG.apply(this, arguments) + `<div class="bkhead">採集</div><div class="bkgrid"><div class="bkcard"><div><b>靈草・玄鐵礦・靈晶</b>${pip}<small>採集 ${c} 次　${c < 100 ? "／100" : c < 1000 ? "／1000" : ""}</small><small>每顆星生命 +0.1%</small></div></div></div>`;
};
// 舊存檔：送各 10 個
setInterval(() => { if (save.w && save.w.created && !save.gatherGift) { save.gatherGift = 1; for (const k of ["herb", "ore", "crystal"]) addMat(k, 10); writeSave(); if (W0 && inWorld && typeof notice === "function") notice("新系統：採集點！地上的發光靈草、玄鐵礦、靈晶站著不動 1.5 秒就能採。丹藥、精煉 +4～+9、鍛造會用到，先送你各 10 個", "#7dff8a"); } }, 3000);
