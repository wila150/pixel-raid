// 萬劍仙途 — 介面第二版（企劃 15 第 8、9 節）：狀態圖示欄、精英目標框、打王 DPS、任務「前往」自動尋路
"use strict";

// ───────── 狀態圖示欄（頭像右邊、靈石那行下面）─────────
const STATUS = [
  { k: "brk", g: "破", c: "#ff6a5a", on: (p) => p.brk > 0, txt: (p) => `${p.brk}`, sub: (p) => p.brkT },
  { k: "chill", g: "凍", c: "#9fe8ff", on: (p) => p.chillT > 0, sub: (p) => p.chillT },
  { k: "zap", g: "電", c: "#c8b0ff", on: (p) => p.zapT > 0, sub: (p) => p.zapT },
  { k: "pool", g: "毒", c: "#8ad86a", on: (p) => p.poolT > 0, sub: (p) => p.poolT },
  { k: "shield", g: "護", c: "#ffe9a0", on: (p) => p.shield > 0, sub: (p) => p.shield },
  { k: "sure", g: "勢", c: "#ffd84a", on: (p) => p.sureT > 0, sub: (p) => p.sureT },
  { k: "lb", g: "倍", c: "#9fe8ff", on: (p) => p.lbReady || p.lbT > 0, sub: (p) => (p.lbT > 0 ? p.lbT : 0) },
  { k: "inv", g: "無", c: "#ff8a9a", on: (p) => p.invT > 0, sub: (p) => p.invT },
  { k: "mist", g: "霧", c: "#9aff9a", on: (p) => p.mistT > 0, sub: (p) => p.mistT },
  { k: "pot", g: "丹", c: "#ff9a7a", on: (p) => p.potCd > 0 && p.cds.potion > 0, sub: (p) => p.cds.potion },
];
function drawStatus() {
  const p = W0; if (!p) return;
  const list = STATUS.filter((s) => { try { return s.on(p); } catch (e) { return false; } });
  if (!list.length) return;
  let x = 10 + SAFE.l + 46; const y = 10 + SAFE.t + 27;
  ctx.textAlign = "center";
  for (const s of list) {
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(x, y, 22, 17);
    ctx.strokeStyle = s.c; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, 21, 16);
    ctx.font = "bold 9px 'Noto Sans TC', sans-serif"; ctx.fillStyle = s.c; ctx.fillText(s.g + (s.txt ? s.txt(p) : ""), x + 11, y + 9);
    const t = s.sub ? s.sub(p) : 0;
    if (t > 0) { ctx.font = "7px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#e8e0d0"; ctx.fillText(t >= 10 ? Math.round(t) + "s" : t.toFixed(1), x + 11, y + 16); }
    x += 25;
  }
}
// ───────── 精英目標框（打到精英時，上方中間；有王時讓給王血條）─────────
function drawTarget() {
  const m = W0.focusM;
  if (!m || m.dead || !(W0.focusT > 0) || !(m.elite || m.hunter) || W0.mobs.some((o) => o.boss && !o.dead)) return;
  const d = WMOBS[m.type], w = Math.min(220, W * 0.4), x = W / 2 - w / 2, y = 62 + SAFE.t;
  ctx.fillStyle = "rgba(10,8,16,0.72)"; ctx.fillRect(x - 4, y - 14, w + 8, 30);
  ctx.textAlign = "left"; ctx.font = "bold 10px 'Noto Sans TC', sans-serif"; ctx.fillStyle = m.hunter ? "#ffd84a" : "#7ab8ff";
  ctx.fillText(`${m.hunter ? "獵寶妖" : "精英"}・${d.n}`, x, y - 3);
  ctx.textAlign = "right"; ctx.fillStyle = "#cfc4dc"; ctx.font = "9px 'Noto Sans TC', sans-serif";
  ctx.fillText(`Lv.${m.lv}${m.mod ? "・" + m.mod + (m.mod2 ? "、" + m.mod2 : "") + (m.mod3 ? "、" + m.mod3 : "") : ""}${d.ele ? "・" + ({ F: "火", W: "冰", T: "雷", P: "毒" }[d.ele] || "") : ""}`, x + w, y - 3);
  ctx.fillStyle = "#2a1a1a"; ctx.fillRect(x, y + 2, w, 8);
  ctx.fillStyle = m.hunter ? "#e0b030" : "#d84a3a"; ctx.fillRect(x, y + 2, w * clamp(m.hp / m.max, 0, 1), 8);
  ctx.textAlign = "center"; ctx.font = "bold 7px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#fff"; ctx.fillText(`${Math.ceil(Math.max(0, m.hp))} / ${Math.round(m.max)}`, W / 2, y + 9);
}
// ───────── 打王 DPS ─────────
let DPS = null; // { m, t0, dmg, end }
const fmtN = (n) => (n >= 1e8 ? (n / 1e8).toFixed(1) + "億" : n >= 1e4 ? (n / 1e4).toFixed(1) + "萬" : Math.round(n) + "");
const _hitMobD = hitMob;
hitMob = function (m, dmg) {
  if (!m || !m.boss || m.dead) return _hitMobD.apply(this, arguments);
  const h0 = m.hp;
  _hitMobD.apply(this, arguments);
  const d = h0 - Math.max(0, m.hp);
  if (d <= 0) return;
  if (!DPS || DPS.m !== m || DPS.end) DPS = { m, t0: time, dmg: 0, end: 0 };
  DPS.dmg += d;
  if (m.dead && !DPS.end) { DPS.end = time; const T = Math.max(1, time - DPS.t0); floatText(W0.x, W0.y - 62, `打王 ${Math.round(T)} 秒・DPS ${fmtN(DPS.dmg / T)}`, "#9fe8ff", true); }
};
function drawDps() {
  if (!DPS) return;
  const live = !DPS.end && !DPS.m.dead;
  if (!live && !DPS.end) { DPS = null; return; } // 王回去睡了
  if (DPS.end && time - DPS.end > 8) { DPS = null; return; }
  const T = Math.max(1, (DPS.end || time) - DPS.t0), mw = Math.min(104, W * 0.26), x = W - 12 - SAFE.r, y = 58 + SAFE.t + mw * (TH / TW) + 78;
  ctx.fillStyle = "rgba(10,10,18,0.72)"; ctx.fillRect(x - 104, y - 12, 106, 30);
  ctx.textAlign = "right"; ctx.font = "bold 11px 'Noto Sans TC', sans-serif"; ctx.fillStyle = DPS.end ? "#ffe066" : "#9fe8ff";
  ctx.fillText(`DPS ${fmtN(DPS.dmg / T)}`, x - 4, y + 1);
  ctx.font = "9px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#cfc4dc";
  ctx.fillText(`${DPS.end ? "完成" : "打王中"}・${Math.round(T)} 秒・${fmtN(DPS.dmg)}`, x - 4, y + 13);
}
// ───────── 自動尋路（任務「前往」）─────────
let AUTO = null; // { x, y, path:[{x,y}], i, last, stuckT, tries }
function autoPathFind(sx, sy, gx, gy, lava) {
  const s = Math.floor(sy / TS) * TW + Math.floor(sx / TS), g0x = Math.floor(gx / TS), g0y = Math.floor(gy / TS);
  const ok = (i) => { const t = wmap[i]; return t === 0 || (lava && t === 3); };
  const prev = new Int32Array(TW * TH).fill(-1), q = new Int32Array(TW * TH);
  let h = 0, tl = 0, best = s, bd = 1e9; q[tl++] = s; prev[s] = s;
  while (h < tl) {
    const i = q[h++], x = i % TW, y = (i / TW) | 0, d = Math.abs(x - g0x) + Math.abs(y - g0y);
    if (d < bd) { bd = d; best = i; } if (d === 0) break;
    for (const n of [i - 1, i + 1, i - TW, i + TW]) if (n >= 0 && n < TW * TH && prev[n] < 0 && ok(n)) { prev[n] = i; q[tl++] = n; }
  }
  if (bd > 3) return null;
  const path = []; for (let i = best; i !== s; i = prev[i]) path.push({ x: (i % TW) * TS + 8, y: ((i / TW) | 0) * TS + 8 });
  return path.reverse().filter((_, k, a) => k % 2 === 1 || k === a.length - 1);
}
function autoStop(msg) { if (!AUTO) return; AUTO = null; if (msg && W0) floatText(W0.x, W0.y - 28, msg, "#cfc4dc", true); }
function autoStep(p, dt) {
  const A = AUTO;
  if (typeof RIFT !== "undefined" && RIFT) { autoStop(); return null; }
  if (p.recall > 0) return null; // 等御劍
  if (p.hurt > 0.15) { autoStop("被攻擊了，自動尋路停止"); return null; }
  if (Math.hypot(p.x - A.x, p.y - A.y) < 40) { autoStop("到了！"); sfx("arrive"); return null; }
  if (!A.path || !A.last || Math.hypot(p.x - A.last.x, p.y - A.last.y) > 60) { // 第一次、或剛御劍過去：重算
    A.path = autoPathFind(p.x, p.y, A.x, A.y, false) || autoPathFind(p.x, p.y, A.x, A.y, true); A.i = 0; A.stuckT = 0; A.ref = { x: p.x, y: p.y };
    if (!A.path) { autoStop("找不到路"); return null; }
  }
  A.last = { x: p.x, y: p.y };
  if ((A.stuckT += dt) > 1.5) { if (Math.hypot(p.x - A.ref.x, p.y - A.ref.y) < 6) { A.tries = (A.tries || 0) + 1; A.path = null; if (A.tries > 3) { autoStop("卡住了，自動尋路停止"); return null; } } A.stuckT = 0; A.ref = { x: p.x, y: p.y }; }
  if (!A.path) return null;
  while (A.i < A.path.length - 1 && Math.hypot(p.x - A.path[A.i].x, p.y - A.path[A.i].y) < 10) A.i++;
  const n = A.path[A.i] || A, dx = n.x - p.x, dy = n.y - p.y, d = Math.hypot(dx, dy) || 1;
  return [dx / d, dy / d];
}
function autoGo() {
  const t = questTarget(); if (!t || !W0) return "這個任務沒有固定地點";
  const wps = WAYPOINTS.filter((wp) => save.w.wp.includes(wp.id));
  let best = null; for (const wp of wps) if (!best || Math.hypot(wp.x - t.x, wp.y - t.y) < Math.hypot(best.x - t.x, best.y - t.y)) best = wp;
  AUTO = { x: t.x, y: t.y + 24 };
  if (best && Math.hypot(W0.x - t.x, W0.y - t.y) > Math.hypot(best.x - t.x, best.y - t.y) + 300) flyTo(best); else ovClose();
  floatText(W0.x, W0.y - 40, "自動尋路：動搖桿或被打就停", "#9fe8ff", true);
  return "";
}
// ───────── 提示條：一次一則排隊（3 秒，點一下跳下一則；之後交給劍靈）─────────
const noticeQ = []; let noticeCur = null, noticeRect = null;
function notice(t, c = "#ffe9a8") { if ((noticeCur && noticeCur.t === t) || noticeQ.some((n) => n.t === t)) return; noticeQ.push({ t, c }); }
seenHint = function (k, t) { const w = save.w; if (!w || !W0) return; if (!w.seen) w.seen = {}; if (w.seen[k]) return; w.seen[k] = 1; notice(t); };
function drawNotice() {
  if (!noticeCur && noticeQ.length) { noticeCur = noticeQ.shift(); noticeCur.t0 = time; sfx("click"); }
  if (!noticeCur) { noticeRect = null; return; }
  const n = noticeCur, age = time - n.t0; if (age > 3.2) { noticeCur = null; return; }
  ctx.font = "bold 12px 'Noto Sans TC', sans-serif"; const tw = Math.min(W - 40, ctx.measureText(n.t).width + 28), x = W / 2 - tw / 2, y = H * 0.26;
  const a = Math.min(1, age * 6, (3.2 - age) * 4);
  ctx.globalAlpha = a; ctx.fillStyle = "rgba(12,10,18,0.85)"; ctx.fillRect(x, y, tw, 26); ctx.fillStyle = n.c; ctx.fillRect(x, y + 24, tw * (1 - age / 3.2), 2);
  ctx.strokeStyle = "rgba(230,210,170,0.4)"; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, tw - 1, 25);
  ctx.textAlign = "center"; ctx.fillStyle = n.c; ctx.fillText(n.t, W / 2, y + 17, tw - 16);
  if (noticeQ.length) { ctx.font = "9px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#a99bb8"; ctx.fillText(`還有 ${noticeQ.length} 則・點一下下一則`, W / 2, y + 38); }
  ctx.globalAlpha = 1; noticeRect = { x, y, w: tw, h: 26 };
}
cvs.addEventListener("pointerdown", (e) => { const r = noticeRect; if (r && e.clientX >= r.x && e.clientX <= r.x + r.w && e.clientY >= r.y && e.clientY <= r.y + r.h + 14) { noticeCur = null; e.stopPropagation(); } }, true);
// HUD
const _drawWorldHudH = drawWorldHud;
drawWorldHud = function () {
  _drawWorldHudH.apply(this, arguments);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawStatus(); drawTarget(); drawDps(); drawNotice();
  if (AUTO) { ctx.textAlign = "center"; ctx.font = "bold 11px 'Noto Sans TC', sans-serif"; ctx.fillStyle = `rgba(160,230,255,${0.7 + 0.3 * Math.sin(time * 5)})`; ctx.fillText(W0.recall > 0 ? "御劍中…之後自動走過去" : "自動尋路中…（動搖桿取消）", W / 2, H - 84 - SAFE.b); }
};
