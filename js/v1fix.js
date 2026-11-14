// 萬劍仙途（pixel-raid）— 1.0 企劃第 1 項：新手前 3 分鐘（docs/企劃_1.0完整化.md）
// dens79.js 後面載入。
"use strict";

// ───────── 新手教學還沒做完：劍靈別的話先排隊，畫面中間同時只有新手提示一個 ─────────
const tutHeld = [];
const _notice1 = notice;
notice = function (t, c) {
  if (typeof tutOn === "function" && tutOn()) { if (!tutHeld.some((n) => n.t === t)) tutHeld.push({ t, c }); return; }
  return _notice1.apply(this, arguments);
};
setInterval(() => { // 教學做完：排隊的照順序說（最多 6 句，太舊的不說）
  if (!tutHeld.length || (typeof tutOn === "function" && tutOn())) return;
  if (tutHeld.length > 6) tutHeld.splice(0, tutHeld.length - 6);
  const intro = typeof QUEST_STORY !== "undefined" ? QUEST_STORY[0] : null; // 劍靈開場白先說
  tutHeld.sort((a, b) => (b.t === intro) - (a.t === intro));
  for (const n of tutHeld.splice(0)) _notice1(n.t, n.c);
}, 500);

// ───────── 世界上的字：不畫在左上 HUD（頭像、任務欄）上面 ─────────
function hudCovers(wx, wy) {
  if (typeof W0 === "undefined" || !W0) return false;
  const z = SCALE * 1.35, sx = W / 2 + (wx - cam.x) * z, sy = H / 2 + (wy - cam.y) * z;
  const bw = SAFE.l + 10 + Math.max(176, Math.min(190, W * 0.46)) + 30, bh = SAFE.t + 10 + 88 + 8;
  return sx < bw && sy < bh;
}
// Lv.10 前：秘境台、倉庫箱、鐵砧的名牌只在 120 內顯示
const padLabelOn = (x, y) => !hudCovers(x, y) && !(save.w && (save.w.lv || 1) < 10 && W0 && Math.hypot(W0.x - x, W0.y - y) > 120);

// ───────── 新角色出生點：城牆內廣場的空地（v9.37：v9.36 會掉進南邊城牆缺口，左右都是牆，按 D 走不動）─────────
// 條件：城牆裡面；自己那格＋周圍 8 格是空地；朝上下左右各模擬走一次（角色半徑 5），撞牆前都要能走 ≥ 90（新手第 1 步要 80）；
// 離秘境台／倉庫箱／鐵砧／NPC 至少 26（不會一出生就打開）。符合的裡面選「最短那個方向」最長的，再來靠近城中心。
function spawnSpot1() {
  if (!wmap) buildWorld();
  pad77();
  const spots = _worldSpots1();
  const open = (tx, ty) => !solid(tx * TS + 8, ty * TS + 8);
  const run = (x, y, dx, dy) => { for (let d = 2; d <= 120; d += 2) if (blockedCircle(x + dx * d, y + dy * d, 5)) return d - 2; return 120; };
  const cx = Math.floor(TOWN.x / TS), cy = Math.floor(TOWN.y / TS);
  let best = null, bd = -1e9;
  for (let ty = cy - 3; ty <= cy + 3; ty++) for (let tx = cx - 6; tx <= cx + 6; tx++) { // 城牆內約 14×6 格
    if (!open(tx, ty)) continue;
    let ok = true;
    for (let i = -1; i <= 1 && ok; i++) for (let j = -1; j <= 1 && ok; j++) ok = open(tx + i, ty + j);
    if (!ok) continue;
    for (let ox = 0; ox < TS; ox += 2) for (const oy of [4, 8, 12]) {
      const x = tx * TS + ox, y = ty * TS + oy;
      if (zoneAt(x, y) !== "town" || spots.some((s) => Math.hypot(s.x - x, s.y - y) < 26)) continue;
      const m = Math.min(run(x, y, 1, 0), run(x, y, -1, 0), run(x, y, 0, 1), run(x, y, 0, -1));
      if (m < 90) continue;
      const sc = m - Math.hypot(x - TOWN.x, y - TOWN.y) * 0.3;
      if (sc > bd) { bd = sc; best = { x, y }; }
    }
  }
  return best || { x: WAYPOINTS[0].x - 4, y: WAYPOINTS[0].y + 25 };
}
// 新手第 1 步（走路）還沒過：走過倉庫箱／鐵砧／秘境台／NPC 不自動打開（城裡很小，往哪走都會經過）
const _worldSpots1 = worldSpots;
worldSpots = function () {
  if (typeof tutOn === "function" && tutOn() && save.w.tut === 0) return [];
  return _worldSpots1.apply(this, arguments);
};
function spawnFix1() {
  const w = save.w;
  if (!w || !w.created || w.spawn2 || (w.lv || 1) > 1 || w.exp > 0 || (w.q || 0) > 0) return;
  w.spawn1 = w.spawn2 = 1;
  const p = spawnSpot1(); w.x = p.x; w.y = p.y;
}
const _enterWorld1 = enterWorld;
enterWorld = function () { try { spawnFix1(); } catch (e) { /* 找不到就用原本的 */ } return _enterWorld1.apply(this, arguments); };
