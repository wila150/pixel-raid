// 萬劍仙途 — 世界難度「天劫等級」（企劃 40 §2-B、§6，總表第 28 項，v8.3）
// 凡塵（現在的難度）→ 一劫 … 六劫：每劫怪血 ×2.5、傷害 ×1.25、掉寶數量 +25%、傳說機率 +40%、經驗 +20%
// 只影響仙界野外的怪和四隻區域王；秘境（看鑰匙）、天劫版王（自己的難度）不變。
// 存 save.w.tj（現在選的）、save.w.tjOpen（最高能選，第一次＝1）。在營地結界裡（祭壇頁）換。
// 解鎖：在最高那一劫打倒一隻「等級不低於你 15 級以上」的區域王（或劍尊）→ 開下一劫（避免高等回去打石魔一路開到六劫）
"use strict";
const TJ_N = ["凡塵", "一劫", "二劫", "三劫", "四劫", "五劫", "六劫"];
const TJ_MAX = 6, TJ_HP = 2.5, TJ_DMG = 1.25, TJ_QTY = 0.25, TJ_LEG = 0.4, TJ_EXP = 0.2;
const tjCur = () => (save.w && save.w.tj) || 0;
const tjOpenN = () => Math.max(1, (save.w && save.w.tjOpen) || 1);
const tjSkip = (m) => !m || m.rift || m.R || m.tj || (typeof RIFT !== "undefined" && RIFT);
const tjOf = (m) => (tjSkip(m) ? 0 : tjCur());
const tjDmgMul = (m) => Math.pow(TJ_DMG, tjOf(m));
// 血量：每幀把場上的怪照現在的劫數換算（換劫數時已經在場上的怪照比例變）
function tjScale() {
  if (!W0 || !W0.mobs) return;
  for (const m of W0.mobs) {
    if (m.dead || m.ghost) continue;
    const n = tjOf(m), o = m.tjn || 0; if (n === o) continue;
    const f = Math.pow(TJ_HP, n - o); m.hp *= f; m.max *= f; m.tjn = n;
  }
}
const _updateWorldTjl = updateWorld;
updateWorld = function () { tjScale(); return _updateWorldTjl.apply(this, arguments); };
// 打倒的那一刻：掉寶數量、傳說機率、經驗都看那隻怪的劫數
let TJ_KILL = 0;
const _rollItemTjl = rollItem;
rollItem = function (boost = 0) {
  let it = _rollItemTjl.apply(this, arguments);
  if (TJ_KILL > 0 && it.q !== 3 && Math.random() < (boost ? 0.0153 : 0.003) * TJ_LEG * TJ_KILL / (1 - (boost ? 0.0153 : 0.003) * (1 + TJ_LEG * TJ_KILL))) { for (let i = 0; i < 300 && it.q !== 3; i++) it = _rollItemTjl.apply(this, arguments); }
  return it;
};
const _wDropItemTjl = wDropItem;
wDropItem = function (it, at) {
  const r = _wDropItemTjl.apply(this, arguments);
  if (TJ_KILL > 0 && it && !it.tjx) { const x = TJ_QTY * TJ_KILL, n = Math.floor(x) + (Math.random() < x % 1 ? 1 : 0); const n0 = TJ_KILL; TJ_KILL = 0; for (let i = 0; i < n; i++) { TJ_KILL = n0; const e = rollItem(it.q >= 1 ? 1 : 0, it.il); TJ_KILL = 0; e.tjx = 1; _wDropItemTjl(e, at); } TJ_KILL = n0; }
  return r;
};
const _gainExpTjl = gainExp;
gainExp = function (n) { if (TJ_KILL > 0) n = Math.round(n * (1 + TJ_EXP * TJ_KILL)); return _gainExpTjl.call(this, n); };
const _killMobTjl = killMob;
killMob = function (m) { const o = TJ_KILL; TJ_KILL = m && !m.dead ? m.tjn || 0 : 0; try { return _killMobTjl.apply(this, arguments); } finally { TJ_KILL = o; } };
const _wbKilledTjl = wbKilled;
wbKilled = function (m) {
  const n = m && !m.R && !m.tj ? m.tjn || 0 : 0, o = TJ_KILL; TJ_KILL = n;
  try { return _wbKilledTjl.apply(this, arguments); } finally {
    TJ_KILL = o;
    const w = save.w;
    if (w && m && !m.R && !m.tj && n >= tjOpenN() && tjOpenN() < TJ_MAX) {
      const R = RBOSS[m.rb], ok = R && (m.rb === "sky" || R.lv >= w.lv - 15);
      if (ok) { w.tjOpen = tjOpenN() + 1; writeSave(); if (typeof notice === "function") notice(`在${TJ_N[n]}打倒${R.n}！開放「${TJ_N[w.tjOpen]}」了（營地的祭壇頁可以換）`, "#ffcf6b"); }
      else if (R && typeof notice === "function") notice(`${R.n}比你低太多級，不算數：要打倒等級至少 Lv.${w.lv - 15} 的區域王才會開下一劫`, "#ff9a7a");
    }
  }
};
function tjSet(n) {
  const w = save.w; if (!w) return "沒有角色";
  if (n < 0 || n > tjOpenN()) return "還沒開放";
  if (!(typeof atCamp === "function" && atCamp())) return "要在營地結界裡才能換天劫等級";
  w.tj = n; writeSave(); tjScale(); return "";
}
function tjEff(n) { return n ? `怪血 ×${Math.pow(TJ_HP, n).toFixed(1)}・傷害 ×${Math.pow(TJ_DMG, n).toFixed(1)}・掉寶 +${Math.round(TJ_QTY * n * 100)}%・傳說 +${Math.round(TJ_LEG * n * 100)}%・經驗 +${Math.round(TJ_EXP * n * 100)}%` : "現在的難度"; }
function tjHtml() {
  const cur = tjCur(), op = tjOpenN(), camp = typeof atCamp === "function" && atCamp();
  const btns = TJ_N.map((nm, i) => `<button class="tjb${i === cur ? " on" : ""}" data-tjl="${i}" ${i > op || i === cur || !camp ? "disabled" : ""}>${i > op ? "🔒" : ""}${nm}</button>`).join("");
  return `<h3>天劫等級 <small>現在：${TJ_N[cur]}</small></h3>
    <p class="dim">想要挑戰就往上開：每一劫怪物血量 ×2.5、傷害 ×1.25，掉寶數量 +25%、傳說機率 +40%、經驗 +20%。只影響仙界野外和區域王（秘境、天劫挑戰不變）。在最高那一劫打倒一隻等級不低於你 15 級以上的區域王，就開下一劫。${camp ? "" : `<b style="color:#ff9a7a">要在營地結界裡才能換。</b>`}</p>
    <div class="tjrow">${btns}</div><p class="dim tjeff">${TJ_N[cur]}：${tjEff(cur)}</p>`;
}
const _altarHtmlTjl = altarHtml;
altarHtml = function () { return _altarHtmlTjl.apply(this, arguments).replace('<div class="panel wide altar">', `<div class="panel wide altar">${tjHtml()}`); };
const _renderAltarTjl = renderAltar;
renderAltar = function () {
  const r = _renderAltarTjl.apply(this, arguments);
  if (ovKind === "altar") ov.querySelectorAll("[data-tjl]").forEach((b) => b.addEventListener("click", () => { const n = +b.dataset.tjl, e = tjSet(n); sfx(e ? "bad" : "good"); renderAltar(e || `天劫等級換成「${TJ_N[n]}」${n ? "：" + tjEff(n) : ""}`); }));
  return r;
};
// 小地圖下面顯示現在的劫數（凡塵不顯示）
const _drawWorldHudTjl = drawWorldHud;
drawWorldHud = function () {
  const r = _drawWorldHudTjl.apply(this, arguments);
  const n = tjCur(); if (!n || (typeof RIFT !== "undefined" && RIFT) || !miniRect) return r;
  const R = miniRect;
  ctx.save(); ctx.font = "bold 11px 'Noto Sans TC', sans-serif"; ctx.textAlign = "left"; ctx.lineWidth = 3; ctx.strokeStyle = "#1b1424"; ctx.fillStyle = "#ff8a5a";
  const t = TJ_N[n]; ctx.strokeText(t, R.x + 3, R.y + 13); ctx.fillText(t, R.x + 3, R.y + 13); ctx.restore();
  return r;
};
