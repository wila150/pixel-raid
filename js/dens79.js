// 企劃 79：野外動態怪物密度——同分流、同地區、600 內「60 秒內有動」的其他玩家 n（最多 6）
// 重生 ×1/(1+0.2n)、精英 8%+2%n（最多 20%）、n≥3 營地 +1 隻、n≥5 +2 隻。秘境、王、怪潮、事件怪不吃。
"use strict";
const DENS_K = 0.2, DENS_R = 600, DENS_MAX = 6, DENS_IDLE = 60000;
let densCache = 0, densT = 0;
const densAct = {}; // uid → {x, y, s, cq, t 最後一次有動的時間}
function densCount() {
  if (typeof othersList !== "function" || !W0 || !save.w || (typeof RIFT !== "undefined" && RIFT)) return 0;
  const now = Date.now(), z = W0.zone || "";
  if (!z || z === "town") return 0;
  let n = 0;
  for (const k in others) {
    const o = others[k], d = o.d || {};
    const cq = d.cq && d.cq.length ? d.cq[d.cq.length - 1].i : 0;
    let a = densAct[k];
    if (!a) a = densAct[k] = { x: d.x, y: d.y, s: d.s || 0, cq, t: now };
    else if (Math.hypot((d.x || 0) - a.x, (d.y || 0) - a.y) > 4 || (d.s || 0) !== a.s || cq !== a.cq) { a.x = d.x; a.y = d.y; a.s = d.s || 0; a.cq = cq; a.t = now; }
  }
  for (const k in densAct) if (!others[k]) delete densAct[k];
  for (const o of othersList()) {
    const k = Object.keys(others).find((q) => others[q] === o);
    if (!k || now - densAct[k].t > DENS_IDLE) continue;
    if ((o.d.z || "") !== z || Math.hypot(o.x - W0.x, o.y - W0.y) > DENS_R) continue;
    if (++n >= DENS_MAX) break;
  }
  return n;
}
const densN = () => densCache;
const densOn = (c) => !!c && !c.rift && !(typeof RIFT !== "undefined" && RIFT) && !(W0 && W0.tide);
const densMul = (c) => densOn(c) ? 1 / (1 + DENS_K * densCache) : 1;
const densElite = (c) => densOn(c) ? Math.min(0.12, 0.02 * densCache) : 0;
const densAdd = () => densCache >= 5 ? 2 : densCache >= 3 ? 1 : 0;

// 重生時間：killMob 剛 push 的那一筆乘上倍率
const _killMobDens79 = killMob;
killMob = function (m) { // eslint-disable-line no-func-assign
  const c = m && m.camp, n0 = c && c.respawn ? c.respawn.length : -1;
  const r = _killMobDens79.apply(this, arguments);
  if (c && c.respawn && c.respawn.length > n0 && densOn(c)) c.respawn[c.respawn.length - 1] *= densMul(c);
  return r;
};
// 精英機率：spawnWMob 生完那隻再補擲一次
const _spawnWMobDens79 = spawnWMob;
spawnWMob = function (camp) { // eslint-disable-line no-func-assign
  const k = W0.mobs.length, r = _spawnWMobDens79.apply(this, arguments);
  const m = W0.mobs[k], e = densElite(camp);
  if (m && !m.elite && e > 0 && Math.random() < e / 0.92) { // 原本 8% 沒中的那 92% 裡補，合起來 = 8% + e
    m.elite = true; m.hp *= 4; m.max *= 4; m.mod = ELITE_MODS[Math.floor(Math.random() * ELITE_MODS.length)];
  }
  return r;
};
// 每 5 秒：重算 n、營地上限（只加不減：人走了活著的照舊，排隊重生的超過就取消）
function densTick() {
  densCache = densCount();
  if (densCache >= 2) seenHint("dens79", "附近修士多，妖物湧得更快了");
  if (!W0 || !W0.camps || (typeof RIFT !== "undefined" && RIFT)) return;
  const add = densAdd(), alive = new Map();
  for (const m of W0.mobs) if (!m.dead && m.camp && !m.noRespawn) alive.set(m.camp, (alive.get(m.camp) || 0) + 1);
  for (const c of W0.camps) {
    if (c.rift || !c.respawn) continue;
    const want = c.size + (densOn(c) ? add : 0), have = (alive.get(c) || 0) + c.respawn.length;
    if (have < want) for (let i = have; i < want; i++) c.respawn.push((2 + Math.random() * 4) * densMul(c));
    else if (have > want && c.respawn.length) c.respawn.splice(0, Math.min(c.respawn.length, have - want));
  }
}
const _updateWorldDens79 = updateWorld;
updateWorld = function (dt) { // eslint-disable-line no-func-assign
  const r = _updateWorldDens79.apply(this, arguments);
  densT -= dt; if (densT <= 0) { densT = 5; densTick(); }
  return r;
};
// 小地圖底部：附近修士 n・妖氣 +xx%
const _drawWorldHudDens79 = drawWorldHud;
drawWorldHud = function () { // eslint-disable-line no-func-assign
  const r = _drawWorldHudDens79.apply(this, arguments);
  const n = densCache, R = typeof miniRect !== "undefined" ? miniRect : null;
  if (n >= 1 && R && state === "world" && !(typeof RIFT !== "undefined" && RIFT)) {
    const pct = Math.round(DENS_K * n * 100); // 重生加快：每秒刷的量 ×(1+0.2n)
    ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = "rgba(10,8,16,0.72)"; ctx.fillRect(R.x + 2, R.y + R.h - 15, R.w - 4, 13);
    ctx.font = "bold 9px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#ffb070";
    ctx.fillText(`附近修士 ${n}・妖氣 +${pct}%`, R.x + R.w / 2, R.y + R.h - 5);
    ctx.restore();
  }
  return r;
};
