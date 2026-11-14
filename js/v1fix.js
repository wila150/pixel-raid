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

// ───────── 新角色出生點離秘境台太近：往南移到廣場空地 ─────────
function spawnFix1() {
  const w = save.w;
  if (!w || !w.created || w.spawn1 || (w.lv || 1) > 1 || w.exp > 0 || (w.q || 0) > 0) return;
  w.spawn1 = 1;
  if (!wmap) buildWorld();
  const P = pad77(); if (!P || Math.hypot(w.x - P.pad.x, w.y - P.pad.y) >= 80) return;
  const far = (x, y) => Math.hypot(x - P.pad.x, y - P.pad.y) >= 80 && Math.hypot(x - P.stash.x, y - P.stash.y) >= 50 && Math.hypot(x - P.anvil.x, y - P.anvil.y) >= 50;
  for (let dy = 0; dy <= 300; dy += 10) for (const dx of [0, 20, -20, 40, -40]) {
    const x = WAYPOINTS[0].x + dx, y = w.y + dy;
    if (far(x, y) && !blockedCircle(x, y, 8) && zoneAt(x, y) === "town") { w.x = x; w.y = y; return; }
  }
}
const _enterWorld1 = enterWorld;
enterWorld = function () { try { spawnFix1(); } catch (e) { /* 找不到就用原本的 */ } return _enterWorld1.apply(this, arguments); };
