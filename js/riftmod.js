// 萬劍仙途 — v6.6 秘境補齊的 5 種詞綴（企劃 16 §3-5、§9）＋天劫蟾王毒池調整（企劃 20 bot 實測）
// 詞綴定義在 maps.js MAP_MODS（curse、thund、brkfast、eleup_*、eleimm_*）
"use strict";

const rmMod = (k) => typeof RIFT !== "undefined" && RIFT && RIFT.key && RIFT.key.mods.includes(k);
const rmEle = (g) => { if (typeof RIFT === "undefined" || !RIFT || !RIFT.key) return null; const m = RIFT.key.mods.find((x) => MAP_MODS[x] && MAP_MODS[x].g === g); return m ? MAP_MODS[m].e : null; };

// 元素加持：秘境裡的怪第一次被看到時換成那個元素（王也一樣）
const _updateWorldRm = updateWorld;
updateWorld = function (dt) {
  if (typeof RIFT !== "undefined" && RIFT && W0) {
    const e = rmEle("eleup");
    if (e) for (const m of W0.mobs) if (!m.rmk) { m.rmk = 1; m.ele = e; }
  }
  return _updateWorldRm.apply(this, arguments);
};

// 元素免疫：用那個元素的武器打，傷害 −70%
const _elemHitRm = elemHit;
elemHit = function (m, dmg) {
  const r = _elemHitRm.apply(this, arguments), e = rmEle("eleimm");
  if (e && wEle() === e && typeof r === "number") {
    if (!(m.imT > time)) { m.imT = time + 0.8; floatText(m.x - 8, m.y - 20, "免疫", ELE_C[e]); }
    return r * 0.3;
  }
  return r;
};

// 詛咒怪：死掉留小毒池；雷擊：死掉 0.6 秒後在原地落雷
const _killMobRm = killMob;
killMob = function (m) {
  const was = m.dead;
  const r = _killMobRm.apply(this, arguments);
  if (!was && m.dead && typeof RIFT !== "undefined" && RIFT && !m.boss) {
    const d = WMOBS[m.type] || { dmg: 5 };
    if (rmMod("curse")) { addPool(m.x, m.y, 14, 3.5, Math.max(1, mobDmg(m, d) * 0.2), 0.4); seenHint("rcurse", "詛咒怪：死掉的地方會留毒池，別站在上面"); }
    if (rmMod("thund")) { wbZone({ k: "circle", x: m.x, y: m.y, r: 20, max: 0.6, dmg: mobDmg(m, d) * 0.7, c: "190,220,255", fc: "150,190,255", done: zapDone }); seenHint("rthund", "雷擊：怪死掉 0.6 秒後原地落雷，殺完往旁邊走一步"); }
  }
  return r;
};

// 破體加速：秘境裡小怪打中也疊破體，4 秒沒被打才清
const _hurtWRm = hurtW;
hurtW = function (dmg, from, kind) {
  const hp0 = W0.hp, es0 = W0.es, b0 = W0.brk || 0;
  const r = _hurtWRm.apply(this, arguments);
  if (rmMod("brkfast") && (W0.hp < hp0 || W0.es < es0)) {
    if ((W0.brk || 0) === b0) W0.brk = Math.min(5, b0 + 1);
    W0.brkT = 4;
    seenHint("rbrk", "破體加速：這張秘境小怪也會疊破體，每層回血 −20%，4 秒沒被打就清掉");
  }
  return r;
};

// 天劫・腐骨蟾王：毒池持續時間減半、同時最多 6 個（企劃 20：×1.1 後還是只勝 3/12）
const _addPoolRm = addPool;
addPool = function (x, y, r, dur, dmg, arm) {
  const tb = typeof tjBoss === "function" && tjBoss();
  if (tb && tb.rb === "swamp") {
    _addPoolRm.call(this, x, y, r, dur * 0.5, dmg, arm);
    while (W0.pools && W0.pools.length > 6) W0.pools.shift();
    return;
  }
  return _addPoolRm.apply(this, arguments);
};
