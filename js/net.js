// 御劍渡劫（pixel-raid）— 連線：在仙界看得到其他玩家（Firebase Realtime Database 的 presence/{uid}）
// 每個人只寫自己的位置，大家都讀全部人的；斷線時 onDisconnect 自動刪掉
"use strict";

const NET_ON = typeof AUTH_ON !== "undefined" && AUTH_ON && typeof firebase !== "undefined" && firebase.database;
let netRef = null, netAll = null, netUid = null, netSendT = 0, netBeatT = 0, netLast = "", netSwing = 0, netSwingSeen = 0;
const others = {}; // uid → { d: 最新資料, x, y（畫面上平滑移動的位置）, walk, swing, swingMax }

function netStart() {
  if (!NET_ON || !fbUser || netRef) return;
  netUid = fbUser.uid;
  const db = firebase.database();
  netRef = db.ref("presence/" + netUid);
  netRef.onDisconnect().remove();
  netAll = db.ref("presence");
  const upd = (snap) => {
    if (snap.key === netUid) return;
    const d = snap.val(); if (!d) return;
    const o = others[snap.key];
    if (!o) others[snap.key] = { d, x: d.x, y: d.y, walk: 0, swing: 0, swingMax: 0.2, sw: d.s || 0 };
    else {
      if ((d.s || 0) !== o.sw) { o.sw = d.s || 0; o.swing = o.swingMax = d.wt === "blade" ? 0.25 : d.wt === "fist" ? 0.08 : 0.18; }
      o.d = d;
    }
  };
  netAll.on("child_added", upd);
  netAll.on("child_changed", upd);
  netAll.on("child_removed", (snap) => { delete others[snap.key]; });
  netSend(true);
}
function netStop() {
  if (netAll) netAll.off();
  if (netRef) netRef.remove().catch(() => {});
  netRef = netAll = null;
  for (const k in others) delete others[k];
}
function netSend(force) {
  if (!netRef || !W0) return;
  const p = W0, d = {
    x: Math.round(p.x), y: Math.round(p.y), f: Math.round(p.face * 100) / 100, wt: curWeapon(), g: gearKey(),
    lv: save.w.lv, n: myName(), s: netSwing, r: p.roll > 0 ? 1 : 0,
  };
  const key = JSON.stringify(d);
  if (!force && key === netLast) return;
  netLast = key;
  d.t = firebase.database.ServerValue.TIMESTAMP;
  netRef.set(d).catch(() => {});
}
// world.js 的 updateWorld 每幀呼叫
function netTick(dt) {
  if (!NET_ON) return;
  if (!netRef) { if (fbUser) netStart(); return; }
  if (W0.swing > 0 && W0.swing === W0.swingMax && W0.swing !== netSwingSeen) netSwing++;
  netSwingSeen = W0.swing === W0.swingMax ? W0.swing : 0;
  netSendT -= dt; netBeatT -= dt;
  if (netSendT <= 0) { netSendT = 0.25; netSend(netBeatT <= 0); if (netBeatT <= 0) netBeatT = 20; } // 一秒 4 次（沒動就不送），20 秒心跳一次
  const now = Date.now();
  for (const k in others) {
    const o = others[k], d = o.d;
    if (d.t && now - d.t > 90000) { delete others[k]; continue; } // 當機沒清掉的
    const dx = d.x - o.x, dy = d.y - o.y, dd = Math.hypot(dx, dy);
    if (dd > 200) { o.x = d.x; o.y = d.y; } // 傳送：直接跳過去
    else { const m = Math.min(1, dt * 10); o.x += dx * m; o.y += dy * m; }
    o.walk = dd > 1 ? o.walk + dt * 8 : 0;
    o.swing = Math.max(0, o.swing - dt);
  }
}
const othersList = () => Object.keys(others).map((k) => others[k]);
function drawOther(o) {
  const d = o.d, g = String(d.g || "-1,-1,-1,none").split(","), r = +g[0], c = +g[1], b = +g[2], sk = SKINS[g[3]] ? g[3] : "none";
  const fake = { x: o.x, y: o.y, face: d.f || 0, flip: Math.cos(d.f || 0) < 0, swing: o.swing, swingMax: o.swingMax, swingR: d.wt === "blade" ? 34 : d.wt === "fist" ? 14 : 22 };
  ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(o.x, o.y + 7, 6, 2, 0, 0, Math.PI * 2); ctx.fill();
  if (d.r) ctx.globalAlpha = 0.5;
  const behind = Math.sin(fake.face) < -0.3;
  if (behind) drawHeldWeapon(fake, d.wt);
  ctx.save(); ctx.translate(Math.round(o.x), Math.round(o.y)); if (fake.flip) ctx.scale(-1, 1);
  ctx.drawImage(heroImgFor(r, c, b, Math.floor(o.walk) % 2, sk), -6, -9); ctx.restore();
  if (!behind) drawHeldWeapon(fake, d.wt);
  drawSlash(fake, d.wt);
  ctx.globalAlpha = 1;
  ctx.font = "bold 6px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
  const label = `${d.n} Lv.${d.lv}`;
  ctx.fillStyle = "#1b1424"; ctx.fillText(label, o.x + 0.5, o.y - 12.5); ctx.fillStyle = "#9fffb0"; ctx.fillText(label, o.x, o.y - 13);
}
document.addEventListener("visibilitychange", () => { if (!document.hidden && netRef) netSend(true); });
