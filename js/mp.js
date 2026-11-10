// 萬劍仙途 — 企劃 67：真氣回復上限、打中回氣蓄水池、裝備真氣詞綴
// 放在所有 worldStats 包裝的最後面（fate.js、uq2.js 後面）
"use strict";
const MPR_CAP = 0.1, MPR_CAP_MAX = 0.15, LEECH_CAP = 0.2, MP_POOL_MAX = 0.4;
const mprCapAdd = (b) => (b.uq && b.uq.xingyun ? 0.03 : 0) + (typeof trN === "function" && trN("mp") ? 0.02 : 0) + (typeof ascList === "function" && save.w && ascList().some((N) => N.k === "fali") ? 0.03 : 0);
const _worldStatsMp = worldStats;
worldStats = function () {
  const b = _worldStatsMp.apply(this, arguments);
  if (!b.bloodMagic) { b.maxMp += Math.round(b.gMp || 0); b.mpRegen *= 1 + (b.gMpr || 0); } // 裝備的最大真氣、真氣回復（worldStats 重算真氣之後才加）
  b.mprCap = Math.min(MPR_CAP_MAX, MPR_CAP + mprCapAdd(b));
  const cap = b.maxMp * b.mprCap;
  b.mpRegenRaw = b.mpRegen; b.mpRegenCap = b.maxMp > 0 && b.mpRegen >= cap - 1e-9;
  if (b.mpRegen > cap) b.mpRegen = cap;
  return b;
};
// 打中回真氣：先進蓄水池，每秒最多放出真氣上限的 20%
function mpLeech(n) {
  if (!W0 || !B || !(B.maxMp > 0) || !(n > 0) || W0.dryT > 0) return; // 企劃 70：乾涸時吸藍不收
  W0.mpPool = Math.min(B.maxMp * MP_POOL_MAX, (W0.mpPool || 0) + n);
}
const _updateWorldMp = updateWorld;
updateWorld = function (dt) {
  const r = _updateWorldMp.apply(this, arguments);
  const p = W0;
  if (p && p.dryT > 0 && dt > 0) p.dryT = Math.max(0, p.dryT - dt); // 企劃 70 A
  if (p && p.mpPool > 0 && !(p.dryT > 0)) { // 乾涸時池子也不放
    if (!(B.maxMp > 0)) p.mpPool = 0;
    else { const g = Math.min(p.mpPool, B.maxMp * LEECH_CAP * dt, B.maxMp - p.mp); if (g > 0) { p.mp += g; p.mpPool -= g; } if (p.mp >= B.maxMp - 1e-6) p.mpPool = Math.min(p.mpPool, B.maxMp * 0.1); }
  }
  return r;
};
