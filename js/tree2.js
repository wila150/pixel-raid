// 萬劍仙途 — 天賦樹第二版（企劃 25 §16、27 A／B）
// 重要天賦特殊效果 13＋奪魔、技能標籤加成、4 個新核心（血魔法、劍心通明、血祭、天人合一）、屬性門檻、狀態圖示。
// tree.js 後、cap.js 前載入（攻速上限要最後套）。
"use strict";

// ───────── 1. 新核心天賦（放進 mind.js 的 KEYSTONE，ksOn／ksDef／jobStats 迴圈都看得到）─────────
KEYSTONE.t2 = [
  { k: "xuemo", n: "血魔法", c: "#ff4a5a", d: "招式改花生命不花真氣（1 真氣＝1% 最大生命，不會花到死）；真氣上限變 0；生命 +30%", f: (b) => { b.bloodMagic = 1; b.maxMp = 0; b.mpRegen = 0; b.maxHp = Math.round(b.maxHp * 1.3); } },
  { k: "jianxin", n: "劍心通明", c: "#9fe8ff", d: "被打一下超過最大生命 20% 的部分減半（不會被秒）；攻擊 −5%", f: (b) => { b.jianxin = 1; b.more *= 0.95; } },
  { k: "xueji", n: "血祭", c: "#d84a6a", d: "吸血 ×2；生命不會自然回復、丹藥回血 −50%", f: (b) => { b.leech = (b.leech || 0) * 2; b.regen = 0; b.potionMul = (b.potionMul || 1) * 0.5; } },
  { k: "tianren", n: "天人合一", c: "#c8e0ff", d: "四種元素抗性上限 +5%；物理減免上限 −10%", f: (b) => { b.resCapAdd = 0.05; b.physCapSub = 0.1; } },
];

// ───────── 2. 有沒有點：重要天賦（同主題點一個就有效，不疊加）、標籤 ─────────
let TR2_K = null, TR2_A = null, TR2_L = -1;
function trNotes() {
  const T = treeSt(); if (!T) return {};
  if (TR2_K && TR2_A === T.n && TR2_L === T.n.length) return TR2_K;
  const o = {}; for (const id of T.n) { const N = TREE[id]; if (N && N.t === "note") o[N.th] = 1; }
  TR2_K = o; TR2_A = T.n; TR2_L = T.n.length; return o;
}
const trN = (k) => !!save.w && !!trNotes()[k];
function trTagMul(sl) { // 這一招的標籤加成（加算）
  if (!sl || typeof slotTags !== "function") return 1;
  const s = treeSum(), tags = slotTags(sl); let a = 0;
  for (const t of tags) a += s["t" + t] || 0;
  return 1 + a / 100;
}

// ───────── 3. 屬性門檻（企劃 27 A）：玄品以上、物品等級 20 以上要屬性＝物品等級×2，不夠每差 10 點 −5%（最低 60%）─────────
function attrReq(it) {
  if (!it || it.q < 2 || (it.il || 0) < 20) return null;
  let k;
  if (it.slot === "sword") k = TR_WMAIN[wtOf(it)] || "agi";
  else { const a = treeAttr(); k = ["str", "agi", "wis"].sort((x, y) => a[y] - a[x])[0]; } // 防具：看你最高的那個屬性
  return [k, it.il * 2];
}
const attrReqShort = (it) => { const r = attrReq(it); return r ? Math.max(0, r[1] - treeAttr()[r[0]]) : 0; };
const attrReqMul = (it) => { const d = attrReqShort(it); return d <= 0 ? 1 : Math.max(0.6, 1 - 0.05 * Math.ceil(d / 10)); };
function attrReqHtml(it) {
  const r = attrReq(it); if (!r) return "";
  const have = treeAttr()[r[0]], ok = have >= r[1], nm = TR_ATTR[r[0]].n + (it.slot === "sword" ? "" : "（防具看你最高的屬性）");
  return ok ? `<div class="reqline ok">需要${nm} ${r[1]}</div>` : `<div class="reqline">需要${nm} ${r[1]}（目前 ${have}）・只能發揮 ${Math.round(attrReqMul(it) * 100)}%，到天賦樹點屬性格補</div>`;
}

// ───────── 4. 疾風（閃身後攻速）：攻速在 jobStats 算，cap.js 會套上限 ─────────
const _jobStatsT2 = jobStats;
jobStats = function (b) {
  b = _jobStatsT2(b);
  if (W0 && W0.trHasteT > time && trN("aspd")) b.aspd = (b.aspd || 1) * 1.2;
  if (b.bloodMagic) { b.maxMp = 0; b.mpRegen = 0; } // 血魔法：tree.js 的真氣格在後面加，這裡再歸零
  return b;
};
const trSpdMul = () => (W0 && W0.trDodgeT > time ? 1.3 : 1); // 凌波（world.js 移動那行）
function trResBuf(e) { return W0 && W0.trRes && W0.trRes[e] > time ? 0.15 : 0; } // 避劫
function trResCapX(e) { return W0 && W0.trRes && W0.trRes[e] > time ? 0.8 : 0; }

// ───────── 5. 打怪：標籤、破軍、靈犀、斬首、奪魔 ─────────
const _hitMobT2 = hitMob;
hitMob = function (m, dmg, kb, from, quiet) {
  if (!m || m.dead || m.air || !save.w || !W0) return _hitMobT2.apply(this, arguments);
  let f = trTagMul(CUR_SL);
  if ((m.elite || m.boss) && trN("atk")) f *= 1.1;
  arguments[1] = dmg * f;
  const ca0 = W0.critAdd, cd0 = B.critDmg, hp0 = m.hp;
  if (W0.trCritT > time && trN("crit")) W0.critAdd = (ca0 || 0) + 0.15;
  if (trN("cdmg") && m.hp < m.max * 0.3) B.critDmg = cd0 + 0.3;
  const lc0 = W0.lastCrit;
  try { return _hitMobT2.apply(this, arguments); }
  finally {
    W0.critAdd = ca0; B.critDmg = cd0;
    if (W0.lastCrit !== lc0 && trN("crit")) { if (!(W0.trCritT > time)) popWord(W0, "靈犀", "#ffd84a"); W0.trCritT = time + 2; }
    if (trN("duomo") && B.maxMp > 0) {
      const dealt = Math.max(0, hp0 - Math.max(0, m.hp));
      if (W0.trDmSec !== Math.floor(time) || W0.trDmGot == null) { W0.trDmSec = Math.floor(time); W0.trDmGot = 0; }
      const g = Math.min(dealt * 0.01, B.maxMp * 0.1 - W0.trDmGot);
      if (g > 0) { W0.trDmGot += g; W0.mp = Math.min(B.maxMp, W0.mp + g); }
    }
  }
};

// ───────── 6. 受傷：金剛、鐵壁、劍心通明、血盾、玄光、避劫 ─────────
const trPhys = (from, kind) => !ELES.includes(kind) && kind !== "ele" && (kind || (from ? "phys" : "spell")) === "phys" && !hitEle(from, kind);
const _hurtWT2 = hurtW;
hurtW = function (dmg, from, kind) {
  const p = W0;
  if (!p || !save.w || p.iframe > 0 || p.shield > 0 || p.invT > 0) return _hurtWT2.apply(this, arguments);
  if (trN("life") && p.hp < p.maxHp * 0.35) dmg *= 0.85;
  if (trN("armor") && p.trStill >= 1 && trPhys(from, kind)) dmg *= 0.92;
  if (B.jianxin) { const c = p.maxHp * 0.2; if (dmg > c) dmg = c + (dmg - c) / 2; }
  if (p.trOv > 0) { // 嗜血：血盾先擋
    const a = Math.min(p.trOv, dmg); p.trOv -= a; dmg -= a;
    if (dmg <= 0) { p.iframe = 0.3; floatText(p.x, p.y - 14, `血盾 -${Math.round(a)}`, "#ff7a8a"); return; }
  }
  const es0 = p.es, hp0 = p.hp, ele = hitEle(from, kind);
  arguments[0] = dmg;
  const r = _hurtWT2.apply(this, arguments);
  if (trN("es") && es0 > 0 && p.es <= 0 && !(p.trEsCd > time) && p.hp > 0) { p.trEsCd = time + 20; p.trEsT = time + 1; p.iframe = Math.max(p.iframe, 1); popWord(p, "玄光", "#9fdcff"); burst(p.x, p.y - 3, "#9fdcff", 16, 80, 0.4); }
  if (trN("res") && ele && (p.hp < hp0 || p.es < es0)) { p.trRes = p.trRes || {}; if (!(p.trRes[ele] > time)) popWord(p, `避${RES_S[ele]}`, ELE_C[ele] || "#9fdcff"); p.trRes[ele] = time + 3; }
  return r;
};
// 閃避、壓制成功（world.js 用 popWord 顯示）
const _popWordT2 = popWord;
popWord = function (p, t, c) {
  _popWordT2.apply(this, arguments);
  if (p !== W0 || !save.w) return;
  if (t === "DODGE" && trN("dodge")) p.trDodgeT = time + 1;
  if (t === "SUPPRESSED" && trN("supp")) { const h = Math.min(Math.round(p.maxHp * 0.02), p.maxHp - p.hp); if (h > 0) { p.hp += h; floatText(p.x, p.y - 26, `+${h}`, "#6fb8ff"); } }
};

// ───────── 7. 每幀：疾風、位移標籤、鐵壁、吐納、血盾 ─────────
const _updateWorldT2 = updateWorld;
updateWorld = function (dt) {
  const p = W0;
  if (!p || !save.w) return _updateWorldT2.apply(this, arguments);
  const r0 = p.cds ? p.cds.roll : 0, x0 = p.x, y0 = p.y;
  // 嗜血：生命滿了，多的吸血變血盾
  if (trN("leech") && p.hp >= p.maxHp && p.regenAcc >= 1) { const a = Math.floor(p.regenAcc); p.regenAcc -= a; p.trOv = Math.min(p.maxHp * 0.1, (p.trOv || 0) + a); p.trOvT = time + 3; }
  const ret = _updateWorldT2.apply(this, arguments);
  if (!W0) return ret;
  if (p.trOv > 0 && !(p.trOvT > time)) p.trOv = 0;
  if (p.cds && p.cds.roll > r0 + 0.01) { // 剛閃身
    const tv = treeSum().tv || 0; if (tv) p.cds.roll *= 1 - 0.03 * (tv / 6);
    if (trN("aspd")) { const was = p.trHasteT > time; p.trHasteT = time + 2; if (!was) { B = worldStats(); p.trHasteOn = 1; } }
  }
  if (p.trHasteOn && !(p.trHasteT > time)) { p.trHasteOn = 0; B = worldStats(); }
  p.trStill = Math.abs(p.x - x0) + Math.abs(p.y - y0) < 0.01 ? (p.trStill || 0) + dt : 0;
  if (trN("mp") && B.maxMp > 0 && p.mp < B.maxMp * 0.2) p.mp = Math.min(B.maxMp, p.mp + B.mpRegen * dt);
  return ret;
};

// ───────── 8. 聚寶：精英 10% 多掉 1 件 ─────────
const _killMobT2 = killMob;
killMob = function (m) {
  const was = m.dead;
  _killMobT2.apply(this, arguments);
  if (was || !m.dead || !W0 || !save.w || !m.elite || m.boss || m.sum || m.hunter || !trN("loot") || Math.random() >= 0.1) return;
  if (WMOBS[m.type].ai === "pillar") return;
  const il = Math.max(0, Math.floor(m.lv / 3) + Math.floor(Math.random() * 2) - 1);
  wDropItem(rollItem(1, il), m); floatText(m.x, m.y - 30, "聚寶！", "#ffe066", true);
};

// ───────── 9. 狀態圖示 ─────────
if (typeof STATUS !== "undefined") STATUS.push(
  { k: "tcrit", g: "犀", c: "#ffd84a", on: (p) => p.trCritT > time && trN("crit"), sub: (p) => p.trCritT - time },
  { k: "thaste", g: "疾", c: "#7dff6a", on: (p) => p.trHasteT > time && trN("aspd"), sub: (p) => p.trHasteT - time },
  { k: "tdodge", g: "波", c: "#9aff9a", on: (p) => p.trDodgeT > time, sub: (p) => p.trDodgeT - time },
  { k: "tstill", g: "壁", c: "#e8c87a", on: (p) => p.trStill >= 1 && trN("armor") },
  { k: "tlife", g: "剛", c: "#ffb070", on: (p) => trN("life") && p.hp < p.maxHp * 0.35 },
  { k: "tov", g: "盾", c: "#ff7a8a", on: (p) => p.trOv > 0, txt: (p) => "", sub: (p) => p.trOvT - time },
  { k: "tes", g: "玄", c: "#9fdcff", on: (p) => p.trEsT > time, sub: (p) => p.trEsT - time },
  { k: "tres", g: "避", c: "#c8e0ff", on: (p) => p.trRes && ELES.some((e) => p.trRes[e] > time) },
);
