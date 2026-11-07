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
    if (!o) others[snap.key] = { d, x: d.x, y: d.y, walk: 0, swing: 0, swingMax: 0.2, sw: d.s || 0, cqSeen: d.cq && d.cq.length ? d.cq[d.cq.length - 1].i : 0 };
    else {
      if (d.cq && (d.ch || 1) === myCh() && othersVisible(o)) for (const c of d.cq) if (c.i > o.cqSeen) { o.cqSeen = c.i; ghostCast(o, d.wt, c); }
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
    lv: save.w.lv, n: myName(), s: netSwing, r: p.roll > 0 ? 1 : 0, ch: myCh(), z: W0.zone || "",
  };
  if (netCq.length) d.cq = netCq;
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
  lbTick(dt);
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
const othersList = () => Object.keys(others).filter((k) => (others[k].d.ch || 1) === myCh()).map((k) => others[k]); // 只畫同一條分流的人
// ───────── 分流：同一條線的人才看得到彼此（Firebase 版只是畫面分開，真正省流量要伺服器）─────────
const CH_MAX = 3;
const myCh = () => (save.w && save.w.ch) || 1;
function chCount(c) { let n = c === myCh() ? 1 : 0; for (const k in others) if ((others[k].d.ch || 1) === c) n++; return n; }
function setCh(c) { if (!save.w || c === myCh()) return; save.w.ch = c; writeSave(); netSend(true); if (W0) { W0.shield = 3; floatText(W0.x, W0.y - 30, `切換到 ${c} 服`, "#9fe8ff", true); } }
// ───────── 招式同步：自己放招時記一筆，跟著位置一起送出；別人收到就在畫面上重播（只有特效，不會打怪）─────────
let netCq = [], netCqI = 0;
function netCast(k, a, x, y, o) {
  if (!NET_ON || !netRef) return;
  netCq.push(Object.assign({ i: ++netCqI, k, a: Math.round(a * 100) / 100, x: Math.round(x), y: Math.round(y) }, o ? { o } : {}));
  if (netCq.length > 4) netCq.shift();
  netSendT = Math.min(netSendT, 0.06);
}
const othersVisible = (o) => W0 && Math.abs(o.x - W0.x) < 400 && Math.abs(o.y - W0.y) < 300;
// 隊友特效：full 全部、dim 淡化、off 關閉
const allyA = () => { const v = (save.w && save.w.allyFx) || "dim"; return v === "off" ? 0 : v === "dim" ? 0.3 : 1; };
function ghostCast(o, wt, c) {
  if (!W0 || !allyA()) return;
  const sx = o.x, sy = o.y - 3, P = (a, v) => ({ x: sx, y: sy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, a, hit: new Set(), ghost: true });
  if (c.k === "a") {
    if (wt === "staff") W0.pshots.push(Object.assign(P(c.a, 170), { life: 0.9, kind: "orb" }));
    else if (wt === "bow") W0.pshots.push(Object.assign(P(c.a, 300), { life: 0.6, kind: "arrow" }));
    else if (wt === "fan") W0.pshots.push(Object.assign(P(c.a, 200), { life: 0.6, kind: "wind" }));
  } else if (c.k === "v") W0.voids.push({ x: c.x, y: c.y, t: 2.2, max: 2.2, tick: 0, ghost: true });
  else if (c.k === "q" && c.o) { // 改招三選一
    if (c.o === "wan") for (let i = -2; i <= 2; i++) W0.pshots.push(Object.assign(P(c.a + i * 0.26, 230), { life: 0.6, kind: "sword" }));
    else if (c.o === "boom") for (let i = -1; i <= 1; i++) W0.pshots.push(Object.assign(P(c.a + i * 0.2, 230), { life: 0.5, kind: "sword" }));
    else if (c.o === "rain") for (let i = 0; i < 8; i++) W0.fires.push({ x: c.x + rand(-26, 26), y: c.y + rand(-18, 18), t: 0.3 + i * 0.05, r: 16, dmg: 0, ghost: true });
    else if (c.o === "refr") for (let i = -2; i <= 2; i++) W0.pshots.push(Object.assign(P(c.a + i * 0.18, 280), { life: 0.55, kind: "arrow" }));
    else if (c.o === "swal") for (let i = -1; i <= 1; i++) W0.pshots.push(Object.assign(P(c.a + i * 0.15, 300), { life: 0.6, kind: "arrow" }));
    else W0.rings.push({ x: sx, y: sy, t: 0, max: 0.3, r: 30, c: "190,225,255" });
  } else if (c.k === "q") {
    if (wt === "sword") for (let i = -1; i <= 1; i++) W0.pshots.push(Object.assign(P(c.a + i * 0.22, 230), { life: 0.6, kind: "sword" }));
    else if (wt === "staff") W0.fires.push({ x: c.x, y: c.y, t: 0.45, r: 34, dmg: 0, ghost: true });
    else if (wt === "bow") for (let i = -2; i <= 2; i++) W0.pshots.push(Object.assign(P(c.a + i * 0.18, 280), { life: 0.55, kind: "arrow" }));
    else if (wt === "fan") W0.tornados.push({ x: sx, y: sy, vx: Math.cos(c.a) * 45, vy: Math.sin(c.a) * 45, t: 1.6, tick: 0, ghost: true });
    else W0.rings.push({ x: sx, y: sy, t: 0, max: 0.4, r: 40, c: "255,220,170" });
  } else if (c.k === "e") {
    W0.rings.push({ x: sx, y: sy, t: 0, max: 0.5, r: 120, c: "255,210,110" });
    for (let i = 0; i < 4; i++) bolts.push({ x: sx + rand(-90, 90), y: sy + rand(-60, 60), life: 0.3 });
  }
}
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

// ───────── 排行榜（lb/{uid}：名字、等級、戰力）─────────
let lbLast = "", lbT = 5, rankTab = "lv";
function lbPush(force) {
  if (!NET_ON || !fbUser || !save.w) return;
  const d = { n: myName(), lv: save.w.lv, cp: totalCP(), g: gearKey(), wt: curWeapon() };
  const key = JSON.stringify(d);
  if (!force && key === lbLast) return;
  lbLast = key; d.t = firebase.database.ServerValue.TIMESTAMP;
  firebase.database().ref("lb/" + fbUser.uid).set(d).catch(() => {});
}
function lbTick(dt) { lbT -= dt; if (lbT <= 0) { lbT = 30; lbPush(); } }
function renderRank() {
  const back = () => { worldReturn(); };
  const shell = (inner) => {
    screenEl.innerHTML = `<div class="panel wide equip rank"><h1 class="pick-title">排行榜</h1>
      <div class="tabs"><button class="tab${rankTab === "lv" ? " on" : ""}" data-t="lv">等級榜</button><button class="tab${rankTab === "cp" ? " on" : ""}" data-t="cp">戰力榜</button></div>
      ${inner}<div class="btns"><button id="close" class="big">回到仙界</button></div></div>`;
    screenEl.classList.remove("hidden");
    document.getElementById("close").onclick = back;
    screenEl.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => { rankTab = b.dataset.t; sfx("click"); renderRank(); }));
  };
  if (!NET_ON || !fbUser) { shell(`<p class="sub">登入帳號後才有排行榜</p>`); return; }
  shell(`<p class="sub">讀取中…</p>`);
  lbPush(true);
  const key = rankTab;
  firebase.database().ref("lb").orderByChild(key).limitToLast(50).once("value").then((snap) => {
    if (rankTab !== key || state !== "pick") return;
    const rows = [];
    snap.forEach((c) => { rows.push(Object.assign({ uid: c.key }, c.val())); });
    rows.sort((a, b) => (b[key] || 0) - (a[key] || 0) || (b.lv || 0) - (a.lv || 0));
    const me = rows.findIndex((r) => r.uid === fbUser.uid);
    const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1);
    const list = rows.map((r, i) => {
      const g = String(r.g || "-1,-1,-1,none").split(","), img = heroImgFor(+g[0], +g[1], +g[2], 0, SKINS[g[3]] ? g[3] : "none");
      return `<div class="rrow${r.uid === fbUser.uid ? " me" : ""}"><span class="rk">${medal(i)}</span><img src="${img.toDataURL()}" alt=""><b>${String(r.n || "修士").replace(/[<>&"]/g, "")}</b><span>Lv.${r.lv || 1}</span><span class="cp">戰力 ${r.cp || 0}</span></div>`;
    }).join("");
    shell(`<div class="cpline">你的排名：<b>${me >= 0 ? `第 ${me + 1} 名` : "50 名外"}</b>　Lv.${save.w.lv}　戰力 ${totalCP()}</div><div class="rlist">${list || '<p class="sub">還沒有人上榜</p>'}</div><small class="hint">每 30 秒更新一次自己的成績</small>`);
  }).catch((e) => shell(`<p class="sub">讀不到排行榜：${e.code || e.message}</p>`));
}
