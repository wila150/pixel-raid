// 企劃 73 A：腰帶丹藥 4 種（回春／聚氣／護體／淨化），共用冷卻；回城、營地免費補滿；殺精英、王補 1 瓶
// 回春丹＝原本的丹藥（save.w.potions，舊的程式照用）；其他三種存 save.w.pots = { mp, guard, pure }
"use strict";
const POTS = {
  hp: { n: "回春丹", c: "#ff6a5a", key: "4", ik: "pot", d: "立刻回 40% 生命" },
  mp: { n: "聚氣丹", c: "#6aa8ff", key: "5", ik: "pot", d: "立刻回 40% 真氣" },
  guard: { n: "護體丹", c: "#7ddc8a", key: "6", ik: "pot", d: "5 秒內受到的傷害 −25%" },
  pure: { n: "淨化丹", c: "#ffd76a", key: "7", ik: "pot", d: "解除凍傷、毒池減速、電圈、破體，4 秒內不會再中" },
};
const POT_KEYS = ["hp", "mp", "guard", "pure"];
const potMaxOf = (k) => { const m = (B && B.potMax) || 3; return k === "hp" || k === "mp" ? m : Math.ceil(m / 2); };
const potN = (k) => { const w = save.w; if (!w) return 0; return k === "hp" ? w.potions || 0 : ((w.pots || {})[k] || 0); };
function potSet(k, v) { const w = save.w; if (k === "hp") w.potions = v; else { if (!w.pots) w.pots = { mp: 0, guard: 0, pure: 0 }; w.pots[k] = v; } }
function potAdd(k, n) { potSet(k, Math.max(0, Math.min(potMaxOf(k), potN(k) + n))); }
function potFill() { for (const k of POT_KEYS) if (potN(k) < potMaxOf(k)) potSet(k, potMaxOf(k)); }

function usePot(k) { // 喝回春丹以外的三種（回春丹走原本 world.js 那段）
  const p = W0; if (!p || state !== "world") return;
  if (typeof ksOn === "function" && ksOn("kuang")) { popWord(p, "狂心：不能喝丹藥", "#ff9a7a"); return; }
  if (potN(k) <= 0) { popWord(p, `${POTS[k].n}用完了`, "#cfc4dc"); return; }
  if (p.cds.potion > 0) { if (!(W0.potHintT > 0)) { floatText(p.x, p.y - 16, `丹藥冷卻 ${p.cds.potion.toFixed(1)} 秒`, "#ff9a7a"); W0.potHintT = 1; } return; }
  if (k === "mp" && (B.bloodMagic || p.mp >= B.maxMp)) { popWord(p, B.bloodMagic ? "血魔法：沒有真氣" : "真氣是滿的", "#cfc4dc"); return; }
  potAdd(k, -1);
  const boss = typeof bossHitNow === "function" && bossHitNow();
  W0.potCd = boss ? 6 : 0; p.cds.potion = boss ? 6 : WSKILL.potion.cd;
  if (k === "mp") { const n = Math.min(Math.round(B.maxMp * 0.4), B.maxMp - p.mp); p.mp += n; floatText(p.x, p.y - 16, `真氣 +${n}`, "#7ab8ff"); burst(p.x, p.y, "#7ab8ff", 12, 40); }
  else if (k === "guard") { W0.guardPotT = 5; floatText(p.x, p.y - 16, "護體：受傷 −25%", "#9ff0a8"); burst(p.x, p.y, "#9ff0a8", 12, 40); }
  else if (k === "pure") { W0.pureT = 4; potPurge(p); floatText(p.x, p.y - 16, "淨化", "#ffe58a"); burst(p.x, p.y, "#ffe58a", 14, 50); }
  sfx("heal"); writeSave();
}
function potPurge(p) { p.chillT = 0; p.poolT = 0; p.zapT = 0; W0.chillT = 0; if (W0.brk) { W0.brk = 0; W0.brkT = 0; } }

const _updateWorldPot = updateWorld;
updateWorld = function (dt) { // eslint-disable-line no-func-assign
  const p = W0;
  if (p && save.w && state === "world") {
    if (!save.w.pots) { save.w.pots = { mp: 0, guard: 0, pure: 0 }; potFill(); } // 舊存檔：第一次給滿
    for (const k of ["mp", "guard", "pure"]) if ((typeof keyHit === "function" ? keyHit("pot_" + k) : pressed.has(POTS[k].key)) || W0.potReq === k) { W0.potReq = null; usePot(k); }
  }
  const r = _updateWorldPot.apply(this, arguments);
  if (p) {
    if (W0.guardPotT > 0) W0.guardPotT -= dt;
    if (W0.pureT > 0) { W0.pureT -= dt; potPurge(p); }
  }
  return r;
};
const _hurtWPot = hurtW;
hurtW = function (dmg) { // eslint-disable-line no-func-assign
  if (W0 && W0.guardPotT > 0 && dmg > 0) arguments[0] = dmg * 0.75;
  return _hurtWPot.apply(this, arguments);
};
const _killMobPot = killMob;
killMob = function (m) { // eslint-disable-line no-func-assign
  const was = m && !m.dead;
  const r = _killMobPot.apply(this, arguments);
  if (was && save.w && (m.elite || m.boss) && !m.sum) { const need = POT_KEYS.filter((k) => potN(k) < potMaxOf(k)); if (need.length) { const k = need[Math.floor(Math.random() * need.length)]; potAdd(k, 1); if (W0) floatText(W0.x + 8, W0.y - 30, `${POTS[k].n} +1`, POTS[k].c); } }
  return r;
};
if (typeof STATUS !== "undefined") STATUS.push(
  { k: "guardPot", g: "護", c: "#9ff0a8", on: () => W0.guardPotT > 0, sub: () => W0.guardPotT },
  { k: "purePot", g: "淨", c: "#ffe58a", on: () => W0.pureT > 0, sub: () => W0.pureT });

// 手機下方快捷欄：多 3 格（聚氣、護體、淨化）
const _quickItemPot = quickItem;
quickItem = function (k) { if (k === "mp" || k === "guard" || k === "pure") { if (W0) W0.potReq = k; return; } return _quickItemPot.apply(this, arguments); }; // eslint-disable-line no-func-assign
const _wbarDrawPot = wbarDraw;
wbarDraw = function (force) { // eslint-disable-line no-func-assign
  const key = POT_KEYS.map(potN).join();
  const r = _wbarDrawPot.call(this, force || key !== wbarDraw.k);
  wbarDraw.k = key;
  if (!wbar.classList.contains("hidden") && !wbar.querySelector('[data-it="mp"]')) {
    const pot = wbar.querySelector('[data-it="pot"]'); if (!pot) return r;
    const h = ["mp", "guard", "pure"].map((k) => `<button class="qit pot2" data-it="${k}" title="${POTS[k].n}（${POTS[k].key}）" style="--pc:${POTS[k].c}"><b style="color:${POTS[k].c}">${POTS[k].n[0]}</b><small>×${potN(k)}</small>${TOUCH ? "" : `<i class="pk">${POTS[k].key}</i>`}</button>`).join("");
    pot.insertAdjacentHTML("afterend", h);
  }
  return r;
};
