// 萬劍仙途 — 傷害公式第二版（企劃 41 §2-3、2-4、2-7、§6、§6-1；企劃 22 §11；總表第 30 項，v8.5）
// tjlv.js 後面載入。
// 1. 基礎傷害：攻擊招（劍、刀、拳、弓）＝武器底材；法術招（法杖、扇）＝技能寶石等級的基礎。其他裝備的「攻擊 +N」＝附加傷害 × 招式的傷害效用。
//    world.js 的 wDmg 呼叫 hitBase(k)：k＝招式倍率（舊的數字），單位「8 點底材＝1」（Lv.1 白武器差不多 8）。
// 2. 怪物元素抗性（深區 20–40%，穿透最低扣到 0）、感電／曝曬（受傷 +20%）、元素剋制最後一步：world.js hitMob 呼叫 hitFinal。
// 3. 持續傷害：DOT_HIT（火牆、旋風、黑洞每跳）不暴擊、只吃「持續」標籤；燃燒、中毒每跳吃 dotMul（build.js dotTick）。
// 4. 怪血：基礎傷害變成跟著武器長，所有怪（含王、秘境、天劫）血量 × DMG_REF(怪的等級)＝同等級藍武器底材 ÷ 8。
// 5. 舊裝備的抗性詞綴照新的分級表重算（企劃 22 §11）。
"use strict";

// ───────── 1. 基礎傷害 ─────────
const REF_W = (lv) => (8 + (4 * Math.max(1, lv)) / 3) * 1.12; // 同等級藍武器底材（舊公式；企劃 44 的縮水另外乘 gearHpK／spellK，不改成階梯——階梯會讓 Lv.89→90 的怪血跳 40%）
// 法術（企劃 41 §8）：同等級藍武器底材 × (0.8 + 0.4 × 寶石等級／上限)：1 級約 0.8、上限一半 1.0、滿 1.2；法術不再吃技能寶石每級「更多 2%」（skgem.js）
const GEM_BASE = (L) => REF_W(wLv()) * spellK(wLv()) * (0.8 + 0.4 * Math.min(1, L / skgCap()));
const ADD_K = 0.15; // 附加傷害：「攻擊 +N」詞綴 × 0.15 點底材（第一版是增加 N%，同等級換算差不多）
// 傷害效用（附加傷害乘這個）：沒寫的＝100%；割草、多段招 30–60%
const SK_EFF = {
  sword: { q: { wan: 0.5, boom: 0.6 }, e: { array: 0.4, storm: 0.4, domain: 0.4 } },
  bow: { q: { rain: 0.4, refr: 0.6 }, e: { turret: 0.5, barr: 0.4, seekr: 0.5 } },
  staff: { a: { split: 0.6 }, q: { shower: 0.5, wall: 0.4 }, e: { tstorm: 0.4, blizz: 0.4, inferno: 0.4 } },
  blade: { q: { base: 0.4, gale: 0.3 }, e: { blades: 0.6, cyclone: 0.3 } },
  fist: { a: { lean: 0.6 }, e: { thous: 0.4, hund: 0.3 } },
  fan: { a: { twin: 0.6 }, q: { base: 0.4, suck: 0.4, storm: 0.4, ward: 0.4 }, e: { petal: 0.4, typh: 0.4, bloom: 0.5, zephyr: 0.4 } },
  r: { ghost: 0.5 },
};
function skEff(sl, wt = curWeapon()) {
  if (!sl || typeof slotSkill !== "function") return 1;
  try { const k = slotSkill(sl, wt), t = sl === "r" ? SK_EFF.r : SK_EFF[wt] && SK_EFF[wt][sl]; return (t && t[k]) || 1; } catch (e) { return 1; }
}
const isSpellW = (wt = curWeapon()) => !!SPELL_W[wt];
function spellLv(sl) { // 法術招看這一格的技能寶石（起源、傳說 E、改寫的 Q 不是寶石 → 看普攻那顆）
  const k = (sl && skgOfSlot(sl)) || skgOfSlot("a");
  return k ? skgLv(k) : 1;
}
function baseOf(sl, b = B) { // 這一招的基礎（單位：8 點底材＝1）
  const b0 = isSpellW() ? GEM_BASE(spellLv(sl)) : b && b.wBase > 0 ? b.wBase : 8;
  return (b0 + ADD_K * ((b && b.flatAtk) || 0) * skEff(sl)) / 8;
}
const DOT_K = 1.5; // 持續傷害不吃暴擊，基礎 ×1.5 補回來（PoE 的持續招基礎也比較高；扇的旋風是主力，不補打王慢 1.5 倍）
const TORN_K = 1.35; // 旋風每跳（扇的主力）：企劃 41 §8 法系打王要跟攻擊武器差 ≤20%，扇 Lv.50 以上慢 25–47%
const FAN_A = 1.3; // 扇普攻（企劃 41 §8 複驗：扇打鵬王、劍尊慢 1.35 倍；Q 的旋風是 TORN_K）
const hitBase = (k) => k * baseOf(CUR_SL) * (DOT_HIT ? DOT_K : 1) * (CUR_SL === "a" && curWeapon() === "fan" ? FAN_A : 1);

// ───────── 2. 怪物元素抗性、感電／曝曬、剋制 ─────────
const MOB_RES = { snow: 0.2, swamp: 0.25, thunder: 0.3, sky: 0.4 }; // 混沌（毒）減半
function mobRes(m, e) {
  let r;
  if (m.rift || (typeof RIFT !== "undefined" && RIFT)) { const t = typeof RIFT !== "undefined" && RIFT ? RIFT.tier || 0 : 0; r = t >= 11 ? 0.4 : t >= 6 ? 0.2 : 0; }
  else if (m.tj || m.R) r = 0.4;
  else r = MOB_RES[(m.camp && m.camp.z) || zoneAt(m.x, m.y)] || 0;
  return e === "P" ? r / 2 : r;
}
const mobResEff = (m, e) => Math.max(0, mobRes(m, e) - ((B && B.pen && B.pen[e]) || 0)); // 穿透最低扣到 0（PoE2），不會變負
const takenMul = (m) => 1 + (m.shockT > time ? 0.2 : 0) + (m.expT > time ? 0.2 : 0); // 感電、曝曬各 +20%（加法）
function eleKe(m, e) { // 剋 ×1.3、被剋 ×0.7、同元素 ×0.7、物理不吃
  const me = mobEle(m); if (!e || !me) return 1;
  if (ELE_BEATS[e] === me) return 1.3;
  if (ELE_BEATS[me] === e || e === me) return 0.7;
  return 1;
}
const SK_ELE_RES = 0.5, SK_ELE_K = 1.1;
function hitFinal(m, dmg) {
  const e = wEle();
  dmg *= takenMul(m);
  if (!e) return dmg;
  const bi = typeof wEleGem === "function" && !wEleGem(); // 企劃 66 A：招式自帶元素（沒串元素寶石）只吃一半抗性、傷害 ×1.1（不然深區比物理弱 25–40%）
  dmg *= 1 - mobResEff(m, e) * (bi ? SK_ELE_RES : 1);
  if (bi) dmg *= SK_ELE_K;
  const k = eleKe(m, e); dmg *= k;
  if (k !== 1 && !(m.keT > time)) {
    m.keT = time + 0.6;
    const bad = k < 1 && ELE_BEATS[mobEle(m)] === e;
    if (k > 1 || bad) floatText(m.x + 8, m.y - 20, k > 1 ? "剋" : "被剋", k > 1 ? ELE_C[e] : "#9a9a9a");
    seenHint("ke2", "「剋」：火→冰→雷→毒→火。剋牠的元素傷害 ×1.3；被牠剋（灰字「被剋」）或同元素 ×0.7。越深的地方妖獸的元素抗性越高（最多 40%）。");
  }
  if (e === "T" && wEleGem() === "T" && !DOT_HIT && !chainLock && Math.random() < 0.15 + 0.03 * gemLv("volt")) { // 感電：雷打中機率，4 秒受傷 +20%（企劃 61 B：20%+5%/級 → 15%+3%/級）
    if (!(m.shockT > time)) floatText(m.x - 8, m.y - 26, "感電", "#bfe0ff");
    m.shockT = time + 4;
  }
  return dmg;
}
// 燃燒（火）、中毒（混沌）每跳
const dotMul = (m, e) => takenMul(m) * (1 - mobResEff(m, e)) * eleKe(m, e);
// 燃燒、中毒的基準：扣掉暴擊和「擊中」類標籤加成，只留「持續」標籤
function dotSeed(dmg) {
  let d = dotBase(dmg);
  if (typeof trTagMul === "function" && CUR_SL && !DOT_HIT) d = (d / trTagMul(CUR_SL)) * (1 + ((typeof treeSum === "function" && treeSum().td) || 0) / 100);
  return d;
}

// ───────── 4. 怪血 × 同等級武器底材 ─────────
const HP_REF_K = 0.87; // 攻擊招少了武器底材那份「增加」，怪血跟著少一點（#scan：一般怪回到 3–4 下）
const DMG_REF = (lv) => (REF_W(lv) / 8) * HP_REF_K * gearHpK(lv); // gearHpK：企劃 44 詞綴分階後的縮水（equip.js）
function hpV2() {
  if (!W0 || !W0.mobs) return;
  for (const m of W0.mobs) { if (m.hv2 || m.ghost) continue; const k = DMG_REF(m.lv || 1); m.hp *= k; m.max *= k; m.hv2 = 1; }
}
const _updateWorldD2 = updateWorld;
updateWorld = function () { hpV2(); return _updateWorldD2.apply(this, arguments); };
// 直接改 hp＝WMOBS×mobHpMul 的地方（天劫王小弟、王的小弟）：mobHpMul 本身不動，靠 hv2 補一次

// ───────── 5. 舊裝備抗性詞綴照新分級重算 ─────────
function resV2Item(it) {
  if (!it || typeof it !== "object" || !it.aff || it.resV2) return 0;
  let n = 0;
  for (const k of ["resF", "resW", "resT", "resA", "resP"]) {
    const v = it.aff[k]; if (v === undefined) continue;
    const a = AFFIX[k], m = affMul(k, it.il || 0), f = Math.max(0, Math.min(1, (v / m - a.lo) / (a.hi - a.lo)));
    const [lo, hi] = resRange(k, it.il || 0);
    it.aff[k] = Math.round(lo + f * (hi - lo)); n++;
  }
  it.resV2 = 1;
  return n ? 1 : 0;
}
function resV2Migrate() {
  if (!save || !save.w || save.resV2 || !save.resMig) return;
  let n = 0;
  const seen = new Set(), walk = (o, d) => { if (!o || typeof o !== "object" || seen.has(o) || d > 6) return; seen.add(o); if (o.slot && o.aff) n += resV2Item(o); for (const k in o) walk(o[k], d + 1); };
  walk(save, 0);
  save.resV2 = 1; writeSave();
  if (W0 && inWorld) { B = worldStats(); if (n && typeof seenHint === "function") seenHint("resv2", `抗性詞綴改成固定分級（物品等級越高那一級越高，最高單抗 45%）：舊裝備 ${n} 件照新表重算過了，同一件的好壞位置不變。抗性上限只有天賦樹、丹藥和三件王傳說（焚天石心、萬毒蟾衣、踏雷靴）能提高。`); }
}
setInterval(resV2Migrate, 2600);
// 新掉的裝備：已經是新表，標記起來避免被重算
const _rollAffixesD2 = rollAffixes;
rollAffixes = function (it) { const r = _rollAffixesD2.apply(this, arguments); if (it) it.resV2 = 1; return r; };
