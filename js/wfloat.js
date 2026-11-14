// 萬劍仙途 — 飄浮武器：沒在攻擊時，武器飄在角色身邊（呼吸起伏）；攻擊／翻滾時照原本拿在手上揮
// dens79.js 後面載入：包住 drawHeldWeapon（自己和別人都走這裡）、drawMount（騎坐騎時原本不畫武器，這裡補畫飄浮的）
"use strict";

// 每種武器飄在哪（角色朝右時；朝左自動鏡射）。ox/oy＝離角色中心、sc＝大小、rot＝角度（-1.57＝尖端朝上）
const WFLOAT = {
  sword: { ox: -10, oy: -3, sc: 1, rot: -1.57 },
  blade: { ox: -11, oy: -3, sc: 1, rot: -1.57 },
  staff: { ox: -10, oy: -4, sc: 1, rot: -1.57 },
  bow: { ox: -10, oy: -3, sc: 1, rot: 0 },
  fan: { ox: -10, oy: -4, sc: 1, rot: -0.6 },
  fist: { ox: -9, oy: -2, sc: 1, rot: 0 },
};
const WF = { x: 0, y: 0, init: false, t: 0, it: undefined, pop: -9 }; // 自己那把：平滑跟隨的位置、上次畫的時間、上次的武器、換武器的時間
const wfLow = () => typeof A11 !== "undefined" && A11.low;

function wfOther(x, y) { if (typeof others === "undefined") return null; for (const k in others) { const o = others[k]; if (o.x === x && o.y === y) return o; } return null; } // 正在畫的是哪個別的玩家
// 畫一把飄浮武器。p＝角色（自己是 W0，別人是 net.js 的假物件）、dy＝騎坐騎時往上移
function wfDraw(p, wt, dy) {
  const T = WFLOAT[wt], img = WPN_IMG[wt]; if (!T || !img) return false;
  const me = p === W0, dir = p.flip ? -1 : 1, low = wfLow();
  let ph = 0, popT = -9, it = null;
  if (me) {
    it = save.eq.sword || null;
    if (!it) { WF.it = null; return true; } // 沒裝武器：什麼都不畫
    if (WF.it !== undefined && WF.it !== it) WF.pop = time; // 換武器（1／2／3、Q、行囊換裝）：0.25 秒彈出來
    WF.it = it; popT = WF.pop;
  } else {
    const o = wfOther(p.x, p.y);
    if (o) { if (o._wfp === undefined) o._wfp = Math.random() * 6; if (o._wfw !== undefined && o._wfw !== wt) o._wfT = time; o._wfw = wt; ph = o._wfp; popT = o._wfT === undefined ? -9 : o._wfT; }
  }
  let x = p.x + T.ox * dir, y = p.y + T.oy - (dy || 0);
  if (me) { // 自己：每幀靠近 12%（跟劍靈一樣），瞬移／太久沒畫就直接到位
    const k = 1 - Math.pow(0.88, clamp((time - WF.t) * 60, 0, 4));
    if (!WF.init || time - WF.t > 0.5 || time < WF.t || Math.hypot(x - WF.x, y - WF.y) > 48) { WF.x = x; WF.y = y; WF.init = true; }
    else { WF.x += (x - WF.x) * k; WF.y += (y - WF.y) * k; }
    WF.t = time; x = WF.x; y = WF.y;
  }
  y += Math.sin(time * 2.4 + ph) * 1.5;
  const rot = T.rot + Math.sin(time * 1.7 + ph) * 0.1, pq = clamp((time - popT) / 0.25, 0, 1);
  const sc = T.sc * (pq < 1 ? 0.3 + 0.7 * pq + 0.35 * Math.sin(pq * Math.PI) : 1); // 彈出：小 → 略大 → 正常
  if (!low && me) {
    if (it.u) glow(x, y, 11, "255,150,60", 0.2 + 0.08 * Math.sin(time * 3)); // 傳說：淡淡橘光
    const e = typeof wEle === "function" ? wEle() : null; // 元素武器帶那個顏色的光（原本畫在手上）
    if (e) { const c = { F: "255,130,60", W: "160,220,255", T: "200,185,255", P: "140,255,110" }[e]; if (c) glow(x, y, 9, c, 0.3 + 0.12 * Math.sin(time * 8)); }
  }
  ctx.save(); const al = ctx.globalAlpha;
  ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.beginPath(); ctx.ellipse(x, p.y + 7.5, 3, 1, 0, 0, Math.PI * 2); ctx.fill(); // 地上的小影子
  ctx.translate(x, y); ctx.scale(dir * sc, sc); ctx.rotate(rot);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  if (wt === "staff" && !low) { ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(201,162,255,${0.3 + 0.18 * Math.sin(time * 6)})`; ctx.beginPath(); ctx.arc(img.width / 2 - 2, 0, 3.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = al; ctx.restore();
  if (pq < 1 && !low) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = `rgba(255,220,140,${0.7 * (1 - pq)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 3 + pq * 8, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  return true;
}

const _drawHeldWeaponWf = drawHeldWeapon;
drawHeldWeapon = function (p, wt) { // eslint-disable-line no-func-assign
  if (p.swing > 0 || p.roll > 0 || !WFLOAT[wt]) { // 攻擊、翻滾：照原本的（揮砍手感不變）；飄浮位置先放回手邊，打完再飄出去
    if (p === W0) { WF.x = p.x + Math.cos(p.face) * 5; WF.y = p.y + 1 + Math.sin(p.face) * 3; WF.t = time; WF.init = true; }
    return _drawHeldWeaponWf.apply(this, arguments);
  }
  if (!wfDraw(p, wt, 0)) return _drawHeldWeaponWf.apply(this, arguments);
};

// 騎坐騎時 world.js／net.js 都不畫手上武器 → 畫坐騎前先畫飄浮武器（人往上 6，武器也跟著）
const _drawMountWf = drawMount;
drawMount = function (k, x, y, flip) { // eslint-disable-line no-func-assign
  try {
    if (typeof W0 !== "undefined" && W0 && state === "world") {
      if (x === W0.x && y === W0.y) wfDraw(W0, curWeapon(), 6);
      else { const o = wfOther(x, y); if (o && o.d) wfDraw({ x, y, flip: !!flip }, o.d.wt, 6); }
    }
  } catch (e) {}
  return _drawMountWf.apply(this, arguments);
};
