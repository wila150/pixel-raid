// 萬劍仙途 — 戰力重算（企劃 39，總表第 27 項，v8.2）
// 戰力＝攻擊分（打木樁預估每秒傷害 ÷10）＋防禦分（生命×(1＋物理減免)×(1＋平均四抗)÷20）
// 用 worldStats() 拿完整數值：天賦樹、轉職、自動成長、技能寶石、輔助寶石（普攻那列）都算進去 → 戰力翻倍≈傷害翻倍
// 一定要在 cap.js 後面載入（worldStats 的最後一層包裝）
"use strict";
// 每把武器普攻：每 1 點攻擊倍率、攻速 1 的每秒傷害（scratchpad #k 量的，Lv.60 中型木樁、沒爆擊、段數換算成 1）
const CP_K = { sword: 24, staff: 28, bow: 30, blade: 33, fist: 31, fan: 33 };
function cpParts(b) {
  if (!save.w) return null;
  b = b || worldStats();
  const wt = curWeapon(), j = jobLv(), L = 1 + (j >= 3 ? 1 : 0) + (j >= 4 ? 1 : 0);
  const crit = clamp(b.crit || 0, 0, 1), cd = b.critDmg || 2;
  const pw = gemLv("power", "a"), fc = gemLv("focus", "a");
  const dps = (b.atk || 1) * (CP_K[wt] || 28) * (b.aspd || 1) * (1 + crit * (cd - 1)) * (1 + 0.3 * (L - 1)) * (1 + 0.1 * pw) * (fc ? 1.25 + 0.05 * fc : 1) * skgDmg("a");
  const res = ELES.reduce((s, e) => s + clamp(b["res" + e] || 0, -0.6, 0.75), 0) / ELES.length;
  const ehp = ((b.maxHp || 0) + (b.maxEs || 0)) * (1 + physRed(b)) * (1 + res);
  return { dps, atk: dps / 10, def: ehp / 20, ehp };
}
const _totalCPOld = totalCP;
totalCP = function () {
  if (!save.w) return _totalCPOld();
  try { const p = cpParts(); return Math.round(p.atk + p.def); } catch (e) { return _totalCPOld(); }
};
const cpTxt = (n = totalCP()) => fmtN(n);
const cpDiff = (a, b) => (a === b ? "" : `戰力 ${fmtN(a)} → <b class="${b > a ? "up" : "down"}">${fmtN(b)}</b>（${b > a ? "+" : "−"}${fmtN(Math.abs(b - a))}）`);
// 穿上這件之後的戰力（暫時換上去算，再換回來）
function cpIf(it) {
  const sl = it && it.slot; if (!sl || !save.eq) return totalCP();
  const old = save.eq[sl]; save.eq[sl] = it;
  try { return totalCP(); } finally { save.eq[sl] = old; }
}
// 技能頁、天賦樹：做了動作（有訊息）戰力有變就在訊息後面加「戰力 A → B」
let cpLast = null;
function cpWrapMsg(fn) {
  return function (msg) {
    let now = null; try { now = totalCP(); } catch (e) { /* 沒角色 */ }
    if (msg && cpLast != null && now != null && now !== cpLast) msg = `${msg}<br><small class="cpd">${cpDiff(cpLast, now)}</small>`;
    cpLast = now; return fn.apply(this, [msg].concat([].slice.call(arguments, 1)));
  };
}
renderSkills = cpWrapMsg(renderSkills);
renderTree = cpWrapMsg(renderTree);
function cpHud() { const t = performance.now(); if (!cpHud.t || t - cpHud.t > 1000) { cpHud.v = cpTxt(); cpHud.t = t; } return cpHud.v; } // 畫面每幀用：1 秒算一次
