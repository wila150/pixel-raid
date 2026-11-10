// 御劍渡劫（pixel-raid）— 連線：在仙界看得到其他玩家（Firebase Realtime Database 的 presence/{uid}）
// 每個人只寫自己的位置，大家都讀全部人的；斷線時 onDisconnect 自動刪掉
"use strict";

const NET_ON = typeof AUTH_ON !== "undefined" && AUTH_ON && typeof firebase !== "undefined" && firebase.database;
let netRef = null, netAll = null, netUid = null, netSendT = 0, netBeatT = 0, netLast = "", netLastD = null, netSwing = 0, netSwingSeen = 0;
const others = {}; // uid → { d: 最新資料, x, y（畫面上平滑移動的位置）, buf（收到的位置紀錄）, walk, swing, swingMax }
// 別人的位置：照伺服器時間記下來，畫「0.4 秒前」那一刻（前後兩筆之間等速內插），永遠有下一筆可走 → 不會走走停停
const NET_DELAY = 400;
let netOff = 0, netPx = null, netPy = 0, netVx = 0, netVy = 0; // netOff：伺服器時間 − 本機時間；netV：自己的速度（送給別人預測用）
const srvNow = () => Date.now() + netOff;
function netPush(o, d) {
  const t = d.t || srvNow(), b = o.buf, last = b[b.length - 1];
  if (last && t <= last.t) return;
  if (last && Math.hypot(d.x - last.x, d.y - last.y) > 200) { b.length = 0; o.x = d.x; o.y = d.y; } // 傳送：直接跳過去
  else if (last && t - last.t > 500 && !last.vx && !last.vy) b.push({ x: last.x, y: last.y, vx: 0, vy: 0, t: t - 250 }); // 站了很久才走：補一筆，免得一開始用跳的
  b.push({ x: d.x, y: d.y, vx: d.vx || 0, vy: d.vy || 0, t });
  while (b.length > 8) b.shift();
}

function netStart() {
  if (!NET_ON || !fbUser || netRef) return;
  netUid = fbUser.uid;
  const db = firebase.database();
  netRef = db.ref("presence/" + netUid);
  netRef.onDisconnect().remove();
  netAll = db.ref("presence");
  db.ref(".info/serverTimeOffset").on("value", (s) => { netOff = s.val() || 0; });
  db.ref(".info/connected").on("value", (s) => { if (s.val() && netRef) { netRef.onDisconnect().remove(); netLastD = null; netSend(true); } }); // 斷線重連：伺服器那筆已被刪掉，要重送完整一包
  const upd = (snap) => {
    if (snap.key === netUid) return;
    const d = snap.val(); if (!d) return;
    const o = others[snap.key];
    if (!o) others[snap.key] = { d, x: d.x, y: d.y, buf: [{ x: d.x, y: d.y, vx: 0, vy: 0, t: d.t || srvNow() }], walk: 0, swing: 0, swingMax: 0.2, sw: d.s || 0, cqSeen: d.cq && d.cq.length ? d.cq[d.cq.length - 1].i : 0 };
    else {
      if (d.cq && (d.ch || 1) === myCh() && othersVisible(o)) for (const c of d.cq) if (c.i > o.cqSeen) { o.cqSeen = c.i; ghostCast(o, d.wt, c); }
      if ((d.s || 0) !== o.sw) { o.sw = d.s || 0; o.swing = o.swingMax = d.wt === "blade" ? 0.25 : d.wt === "fist" ? 0.08 : 0.18; }
      if (d.x !== o.d.x || d.y !== o.d.y || d.t !== o.d.t) netPush(o, d);
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
  if (NET_ON) firebase.database().ref(".info/connected").off();
  netRef = netAll = null; netLastD = null;
  for (const k in others) delete others[k];
}
function netSend(force) {
  if (!netRef || !W0) return;
  const p = W0, d = {
    x: Math.round(p.x), y: Math.round(p.y), f: Math.round(p.face * 100) / 100, wt: curWeapon(), g: gearKey(),
    vx: Math.round(netVx), vy: Math.round(netVy), lv: save.w.lv, n: myName(), s: netSwing, r: p.roll > 0 ? 1 : 0, ch: myCh(), z: W0.zone || "", ti: typeof myTitle === "function" ? myTitle() : "", tj: (save.w && save.w.tj) || 0,
  };
  if (netCq.length) d.cq = netCq.slice(); // 複製一份：netCq 會原地變動，不複製的話跟上一包比永遠一樣、招式送不出去
  // 第一次、重連、心跳、切分流：送完整一包（set）；平常只送有變的欄位（update），走路時大約只剩 x、y、vx、vy、t
  const prev = netLastD;
  if (force || !prev || d.ch !== prev.ch) {
    netLastD = d; netLast = JSON.stringify(d);
    netRef.set(Object.assign({}, d, { t: firebase.database.ServerValue.TIMESTAMP })).catch(() => { netLastD = null; });
    return;
  }
  const u = {};
  for (const k in d) if (k === "cq" ? JSON.stringify(d.cq) !== JSON.stringify(prev.cq) : d[k] !== prev[k]) u[k] = d[k];
  if (prev.cq && !d.cq) u.cq = null;
  if (!Object.keys(u).length) return;
  netLastD = d;
  u.t = firebase.database.ServerValue.TIMESTAMP;
  netRef.update(u).catch(() => { netLastD = null; });
}
// world.js 的 updateWorld 每幀呼叫
function netTick(dt) {
  if (!NET_ON) return;
  if (!netRef) { if (fbUser) netStart(); return; }
  lbTick(dt);
  if (W0.swing > 0 && W0.swing === W0.swingMax && W0.swing !== netSwingSeen) netSwing++;
  netSwingSeen = W0.swing === W0.swingMax ? W0.swing : 0;
  if (netPx === null || dt <= 0) { netPx = W0.x; netPy = W0.y; }
  else { // 自己的速度：有動就平滑跟上，沒動就直接 0（停下那一包速度一定是 0，別人才不會滑過頭）
    const mx = (W0.x - netPx) / dt, my = (W0.y - netPy) / dt; netPx = W0.x; netPy = W0.y;
    if (Math.abs(mx) + Math.abs(my) < 1 || Math.hypot(mx, my) > 2000) netVx = netVy = 0;
    else { const k = Math.min(1, dt * 12); netVx += (mx - netVx) * k; netVy += (my - netVy) * k; }
  }
  netSendT -= dt; netBeatT -= dt;
  if (netSendT <= 0) { netSendT = 0.25; netSend(netBeatT <= 0); if (netBeatT <= 0) netBeatT = 20; } // 一秒 4 次（沒動就不送），20 秒心跳一次
  const now = srvNow(), rt = now - NET_DELAY;
  for (const k in others) {
    const o = others[k], d = o.d, b = o.buf;
    if (d.t && now - d.t > 90000) { delete others[k]; continue; } // 當機沒清掉的
    const ox = o.x, oy = o.y;
    let tx, ty;
    let i = b.length - 1; while (i > 0 && b[i - 1].t > rt) i--;
    const B = b[i], A = b[i - 1];
    if (A && B.t > rt) { const f = Math.max(0, (rt - A.t) / (B.t - A.t)); tx = A.x + (B.x - A.x) * f; ty = A.y + (B.y - A.y) * f; }
    else if (B.t > rt) { tx = B.x; ty = B.y; }
    else { // 網路卡、還沒收到下一筆：照最後的速度往前推（0.2 秒內原速，之後 0.2 秒慢慢停）
      const e = Math.min(0.4, (rt - B.t) / 1000), s = e <= 0.2 ? e : 0.2 + (e - 0.2) - ((e - 0.2) ** 2) / 0.4;
      tx = B.x + B.vx * s; ty = B.y + B.vy * s;
    }
    if (Math.hypot(tx - ox, ty - oy) > 200) { o.x = tx; o.y = ty; } // 傳送
    else { const m = Math.min(1, dt * 15); o.x += (tx - ox) * m; o.y += (ty - oy) * m; } // 慢網路遲到的包：滑過去修正，不要用跳的
    const sp = dt > 0 ? Math.hypot(o.x - ox, o.y - oy) / dt : 0;
    o.walk = sp > 6 ? o.walk + dt * 8 : 0;
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
const allyA = () => { if (typeof A11 !== "undefined" && A11.low) return 0; const v = (save.w && save.w.allyFx) || "dim"; return v === "off" ? 0 : v === "dim" ? 0.3 : 1; };
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
    else if (c.o === "shower") for (let i = 0; i < 6; i++) W0.fires.push({ x: c.x + rand(-28, 28), y: c.y + rand(-20, 20), t: 0.3 + i * 0.07, r: 16, dmg: 0, ghost: true });
    else if (c.o === "doom") W0.fires.push({ x: c.x, y: c.y, t: 0.7, r: 26, dmg: 0, ghost: true });
    else if (c.o === "wall") { const cx = sx + Math.cos(c.a) * 34, cy = sy + Math.sin(c.a) * 34; for (let i = -2; i <= 2; i++) W0.walls && W0.walls.push({ x: cx - Math.sin(c.a) * i * 16, y: cy + Math.cos(c.a) * i * 16, t: 2, tick: 0, ghost: true }); }
    else if (c.o === "suck" || c.o === "storm") W0.tornados.push({ x: sx, y: sy, vx: Math.cos(c.a) * 45, vy: Math.sin(c.a) * 45, t: 1.6, tick: 0, ghost: true });
    else if (c.o === "ward") W0.tornados.push({ x: sx, y: sy, vx: 0, vy: 0, t: 3, tick: 0, orbit: 0, own: o, ghost: true });
    else if (c.o === "throw") { const bx = sx - Math.cos(c.a) * 24, by = sy - Math.sin(c.a) * 24; W0.rings.push({ x: bx, y: by, t: 0, max: 0.3, r: 35, c: "230,200,150" }); burst(bx, by, "#d8c0a0", 10, 90, 0.4); } // 企劃 55 摔投
    else if (c.o === "whirl") W0.rings.push({ x: sx, y: sy, t: 0, max: 0.6, r: 80, c: "255,70,50" });
    else if (c.o === "swal") W0.pshots.push(Object.assign(P(c.a, 260), { life: 0.45, kind: "swal" }));
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
  const rd = typeof MOUNTS !== "undefined" && MOUNTS[g[4]] ? g[4] : null; // 別人騎的坐騎
  if (rd) drawMount(rd, o.x, o.y, fake.flip, o.walk);
  if (behind && !rd) drawHeldWeapon(fake, d.wt);
  ctx.save(); ctx.translate(Math.round(o.x), Math.round(o.y) - (rd ? 6 : 0)); if (fake.flip) ctx.scale(-1, 1);
  ctx.drawImage(heroImgFor(r, c, b, rd ? 0 : Math.floor(o.walk) % 2, sk), -6, -9); ctx.restore();
  if (!behind && !rd) drawHeldWeapon(fake, d.wt);
  if (!rd) drawSlash(fake, d.wt);
  ctx.globalAlpha = 1;
  ctx.font = "bold 6px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
  const label = `${d.n} Lv.${d.lv}${d.tj && typeof TJ_N !== "undefined" && TJ_N[d.tj] ? "・" + TJ_N[d.tj] : ""}`;
  ctx.fillStyle = "#1b1424"; ctx.fillText(label, o.x + 0.5, o.y - 12.5); ctx.fillStyle = "#9fffb0"; ctx.fillText(label, o.x, o.y - 13);
  if (d.ti && typeof drawTitleTag === "function") drawTitleTag(d.ti, o.x, o.y - 19);
}
document.addEventListener("visibilitychange", () => { if (!document.hidden && netRef) netSend(true); });

// ───────── 排行榜（lb/{uid}：名字、等級、戰力）─────────
let lbLast = "", lbT = 5, rankTab = "lv";
function lbPush(force) {
  if (!NET_ON || !fbUser || !save.w) return;
  const d = { n: myName(), lv: save.w.lv, cp: Math.min(1e9, totalCP()), g: gearKey().split(",").slice(0, 4).join(","), wt: curWeapon(), rt: save.w.riftMax || 0 };
  const key = JSON.stringify(d);
  if (!force && key === lbLast) return;
  lbLast = key; d.t = firebase.database.ServerValue.TIMESTAMP;
  firebase.database().ref("lb/" + fbUser.uid).set(d).catch(() => {});
}
function lbTick(dt) { lbT -= dt; if (lbT <= 0) { lbT = 30; lbPush(); } }
function renderRank() {
  if (ovKind !== "rank" && !ovOpen("rank")) return; // 企劃 15：改用覆蓋層
  const shell = (inner) => {
    if (ovKind !== "rank") return;
    ov.innerHTML = `<div class="col cw"><div class="panel wide equip rank">
      <div class="tabs"><button class="tab${rankTab === "lv" ? " on" : ""}" data-t="lv">等級榜</button><button class="tab${rankTab === "cp" ? " on" : ""}" data-t="cp">戰力榜</button><button class="tab${rankTab === "rt" ? " on" : ""}" data-t="rt">秘境層數榜</button></div>
      ${inner}</div></div>`;
    ov.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => { rankTab = b.dataset.t; sfx("click"); renderRank(); }));
  };
  if (!NET_ON || !fbUser) { shell(`<p class="sub">登入帳號後才有排行榜</p>`); return; }
  shell(`<p class="sub">讀取中…</p>`);
  lbPush(true);
  const key = rankTab;
  firebase.database().ref("lb").orderByChild(key).limitToLast(50).once("value").then((snap) => {
    if (rankTab !== key || ovKind !== "rank") return;
    const rows = [];
    snap.forEach((c) => { rows.push(Object.assign({ uid: c.key }, c.val())); });
    rows.sort((a, b) => (b[key] || 0) - (a[key] || 0) || (b.lv || 0) - (a.lv || 0));
    const me = rows.findIndex((r) => r.uid === fbUser.uid);
    const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1);
    const list = rows.map((r, i) => {
      const g = String(r.g || "-1,-1,-1,none").split(","), img = heroImgFor(+g[0], +g[1], +g[2], 0, SKINS[g[3]] ? g[3] : "none");
      return `<div class="rrow${r.uid === fbUser.uid ? " me" : ""}"><span class="rk">${medal(i)}</span><img src="${img.toDataURL()}" alt=""><b>${String(r.n || "修士").replace(/[<>&"]/g, "")}</b><span>Lv.${r.lv || 1}</span><span class="cp">${key === "rt" ? `秘境 第 ${r.rt || 0} 層` : `戰力 ${r.cp || 0}`}</span></div>`;
    }).join("");
    shell(`<div class="cpline">你的排名：<b>${me >= 0 ? `第 ${me + 1} 名` : "50 名外"}</b>　Lv.${save.w.lv}　戰力 ${cpTxt()}</div><div class="rlist">${list || '<p class="sub">還沒有人上榜</p>'}</div><small class="hint">每 30 秒更新一次自己的成績</small>`);
  }).catch((e) => shell(`<p class="sub">讀不到排行榜：${e.code || e.message}</p>`));
}
