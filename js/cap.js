// 萬劍仙途 — 移速／攻速上限（企劃 24，使用者 11/10：全點敏捷跑太快、打太快）
// 放在所有 worldStats 包裝的最後面：常駐移速最多 ×1.75（坐騎 mountMul、霧化、凌波等暫時效果在 world.js 移動那行另外乘）
// 攻速最多 ×2，超過的部分每 1% 換 0.5% 攻擊
"use strict";
const _worldStatsCap = worldStats;
worldStats = function () {
  const b = _worldStatsCap.apply(this, arguments);
  b.spdCap = b.spdMul >= SPD_CAP - 1e-9; if (b.spdMul > SPD_CAP) b.spdMul = SPD_CAP;
  b.aspdCap = (b.aspd || 1) >= ASPD_CAP - 1e-9;
  if (b.aspd > ASPD_CAP) { b.atk *= 1 + (b.aspd - ASPD_CAP) * 0.5; b.aspd = ASPD_CAP; }
  return b;
};
