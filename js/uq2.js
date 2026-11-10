// 萬劍仙途 — 企劃 57 傳說武器補齊（總表第 45 項）：新傳說的效果（world.js 呼叫 uq2Hit／uq2Spin／zyQuake／zyCrack；其他用包裝）
"use strict";
// 法球、風刃打中（world.js 劍氣飛行）
function uq2Hit(s, m, fz0) {
  if (s.hx) { if (Math.random() < 0.2 && !m.dead) m.frz = Math.max(m.frz || 0, m.boss ? 0.5 : 1.4); return; } // 冰刃：20% 再冰凍
  if (B.uq.hanxu && fz0 && s.kind === "orb" && !s.child && curWeapon() === "staff") { // 寒髓玄冰杖：碎冰 6 片
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + rand(-0.2, 0.2); W0.pshots.push({ x: m.x, y: m.y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, a, life: 0.3, dmg: s.dmg * 0.3, kind: "orb", pierce: false, kb: 10, hit: new Set([m]), child: true, hx: 1, sl: s.sl, dm: s.dm }); }
    burst(m.x, m.y, "#bfefff", 12, 110, 0.35); floatText(m.x, m.y - 18, "碎冰", "#bfefff");
  }
  if (B.uq.liuyun && s.kind === "wind" && s.turned) mpLeech(B.maxMp * 0.002); // 流雲百花扇：回程回真氣
}
// Q 放完（world.js doSpin 最後）：星隕天樞杖多落 2 顆
function uq2Spin(wt, tq, f0) {
  if (!(B.uq.xingyun && wt === "staff" && tq !== "wall")) return;
  const add = W0.fires.slice(f0).filter((f) => !f.isAf); if (!add.length) return;
  for (let i = 0; i < 2; i++) { const t = add[i % add.length]; W0.fires.push(Object.assign({}, t, { x: t.x + rand(-30, 30), y: t.y + rand(-22, 22), t: t.t + 0.12 * (i + 1), dmg: t.dmg * 0.15 })); } // 企劃 57 §7：多出來的 15%（§8）
}
// 震岳碎山拳
function zyQuake(p, am) { // 普攻每 3 拳：身邊震地小圈
  const r = 22 * am;
  for (const m of W0.mobs) if (!m.dead && dist(m, p) < r + WMOBS[m.type].r) hitMob(m, wDmg(1.5), 20, p, true);
  W0.rings.push({ x: p.x, y: p.y + 3, t: 0, max: 0.2, r, c: "220,180,120" });
}
function zyCrack(p, dmg, dm) { // 衝拳類 Q 停下：地裂 r45、Q 傷害 60%
  const s0 = CUR_SL, d0 = CUR_DM; CUR_SL = "q"; CUR_DM = dm || 1;
  try { const r = 45 * areaMul("q"); for (const m of W0.mobs) if (!m.dead && dist(m, p) < r + WMOBS[m.type].r) hitMob(m, wDmg((dmg || 45) * 0.2), 80, p, true); W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.35, r, c: "210,160,100" }); fxBoom(p.x, p.y, r, "210,160,100"); }
  finally { CUR_SL = s0; CUR_DM = d0; }
  shake = Math.max(shake, 5); sfx("break");
}
// 閃身：追風逐影弓 2 秒
const _skillUsedU2 = skillUsed;
skillUsed = function (k) { // eslint-disable-line no-func-assign
  if (k === "roll" && W0 && B.uq.zhuifeng) W0.zfT = time + 1; // 企劃 57 §8：1 秒
  return _skillUsedU2.apply(this, arguments);
};
// 命中：修羅血飲刀回血、萬妖噬魂袍傷害層數
const _hitMobU2 = hitMob;
hitMob = function (m, dmg) { // eslint-disable-line no-func-assign
  if (m && !m.dead && !m.air && W0 && B && B.uq) {
    if (W0.dvN > 0) arguments[1] = dmg * (1 + 0.03 * W0.dvN);
    if (B.uq.xiuluo && W0.spinT > 0 && curWeapon() === "blade" && CUR_SL === "q") {
      arguments[1] *= 1.4; // 企劃 57 §8：旋風斬／颶風傷害更多 40%
      if (time - (W0.xlS || -9) >= 1) { W0.xlS = time; W0.xlH = 0; }
      const cap = W0.maxHp * 0.04, h = Math.min(W0.maxHp * 0.003 * brkMul(), cap - W0.xlH, W0.maxHp - W0.hp);
      if (h > 0) { W0.hp += h; W0.xlH += h; }
    }
  }
  return _hitMobU2.apply(this, arguments);
};
// 修羅血飲刀：轉的時候受傷 −15%
const _hurtWU2 = hurtW;
hurtW = function (dmg) { // eslint-disable-line no-func-assign
  if (W0 && B && B.uq && B.uq.xiuluo && W0.spinT > 0 && curWeapon() === "blade") arguments[0] = dmg * 0.85;
  return _hurtWU2.apply(this, arguments);
};
// 殺怪：萬妖噬魂袍層數；天劫王／天劫秘境之主 8% 掉太虛幻月扇
const _killMobU2 = killMob;
killMob = function (m) { // eslint-disable-line no-func-assign
  const was = m && m.dead;
  const r = _killMobU2.apply(this, arguments);
  if (m && !was && m.dead && W0 && WMOBS[m.type].ai !== "pillar") {
    if (B.uq.devour && (W0.dvK = (W0.dvK || 0) + 1) % 30 === 0) { W0.dvN = Math.min(5, (W0.dvN || 0) + 1); W0.dvT = 8; floatText(W0.x, W0.y - 24, `噬魂 ×${W0.dvN}`, "#c08aff"); }
    if (m.boss && m.tj && Math.random() < 0.08) { const it = giftUnique("taixu", save.w.lv); if (it) wDropItem(it, m); }
  }
  return r;
};
// 每幀：噬魂計時；太虛幻月扇旋風跟著走、最多 3 個
const _updateWorldU2 = updateWorld;
updateWorld = function (dt) { // eslint-disable-line no-func-assign
  const p = typeof W0 !== "undefined" ? W0 : null, x0 = p ? p.x : 0, y0 = p ? p.y : 0;
  const r = _updateWorldU2.apply(this, arguments);
  if (!W0 || W0 !== p) return r;
  if (W0.dvT > 0 && (W0.dvT -= dt) <= 0) W0.dvN = 0;
  if (B.uq.taixu && curWeapon() === "fan") {
    const dx = p.x - x0, dy = p.y - y0, own = W0.tornados.filter((o) => !o.ghost && o.t > 0 && !o.zep);
    for (const o of own) { if (o.ty === undefined) o.ty = 1; o.x += dx; o.y += dy; }
    if (own.length > 3) { const drop = new Set(own.slice(0, own.length - 3)); W0.tornados = W0.tornados.filter((o) => !drop.has(o)); }
  }
  return r;
};
STATUS.push({ k: "devour", g: "噬", c: "#c08aff", on: (p) => p.dvN > 0, txt: (p) => `${p.dvN}`, sub: (p) => p.dvT });
