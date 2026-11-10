// 萬劍仙途 — 裝備基底＋詞綴階級：舊存檔搬家（企劃 44 §3，總表第 34 項，v9.3）
// dmg2.js 後面載入（要等 resV2Migrate 先把抗性換成分級，才知道舊抗性在舊範圍的位置）。
// 表和掉落邏輯在 equip.js（BASE_REQ／BASE_TBL／AFF_T／pickBt／rollAffVal／uqApply）。
"use strict";

// 舊裝備一件：物品等級＝舊 il×3；基底照舊數值找最接近的一階；詞綴照它在舊範圍的位置，換成新物品等級允許的範圍裡同樣位置
function ibaseItem(it) {
  if (!it || typeof it !== "object" || !it.slot || !it.aff || it.bt || !SLOTS[it.slot]) return 0;
  const il = it.il || 0;
  it.lvI = Math.max(1, Math.min(ITEM_LV_MAX, il * 3));
  if (it.u && UNIQUES[it.u]) { const en = it.en; uqApply(it); if (en) it.en = en; nameItem(it); return 1; }
  const key = baseKey(it), tbl = BASE_TBL[key === "spell" ? "atk" : key];
  if (SLOTS[it.slot].acc) it.bt = pickBtTop(it.lvI);
  else {
    const raw = (it.base || 1) / (1 + 0.12 * Math.min(2, it.q || 0)); // 舊的基底含品質加成
    let best = 0, bd = 1e9;
    for (let i = 0; i < 8; i++) { const d = Math.abs(Math.log(Math.max(0.1, raw) / tbl[i])); if (d < bd) { bd = d; best = i; } }
    it.bt = best + 1;
  }
  setBase(it);
  const top = tierTop(it.lvI);
  for (const k in it.aff) {
    const T = AFF_T[k], a = AFFIX[k]; if (!T || !a) continue;
    const v = it.aff[k], lo2 = T[0][0], hi2 = T[top][1];
    if (it.jie === k) { it.aff[k] = a.dec ? Math.round(hi2 * 1.3 * 10) / 10 : Math.round(hi2 * 1.3); continue; }
    let lo, hi;
    if (isTierRes(k)) [lo, hi] = resRange(k, il);
    else { const m = affMul(k, il); lo = a.lo * m; hi = a.hi * m; }
    const f = Math.max(0, Math.min(1, (v - lo) / Math.max(1e-6, hi - lo))), nv = lo2 + f * (hi2 - lo2);
    it.aff[k] = a.dec ? Math.round(nv * 10) / 10 : Math.max(1, Math.round(nv));
  }
  it.resV2 = 1;
  nameItem(it);
  return 1;
}
function pickBtTop(lv) { let t = 0; for (let i = 0; i < 8; i++) if (BASE_REQ[i] <= lv) t = i; return t + 1; }
function ibaseMigrate() {
  if (!save || !save.w || save.ibase || !save.resMig || !save.resV2) return;
  let n = 0;
  const seen = new Set(), walk = (o, d) => { if (!o || typeof o !== "object" || seen.has(o) || d > 6) return; seen.add(o); if (o.slot && o.aff) n += ibaseItem(o); for (const k in o) walk(o[k], d + 1); };
  walk(save, 0);
  save.ibase = 1; writeSave();
  if (W0 && inWorld) {
    B = worldStats(); W0.maxHp = B.maxHp;
    if (n && typeof seenHint === "function") seenHint("ibase", `裝備改成「基底＋詞綴階級」：每種裝備分 8 階（需求等級寫死），詞綴分 T5～T1，物品等級越高才骰得到高階。你的 ${n} 件舊裝備照新表重算過了，好壞位置不變；傳說改成固定數值。`);
  }
}
setInterval(ibaseMigrate, 3000);
