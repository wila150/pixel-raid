// 萬劍仙途 — 企劃 77 §A-2／§B／§C（claude-cb 做；§A 房間拼接在 rift.js，由 pixel-raid-a0 做）
// A-2 剩怪紅點：秘境裡活著的營地怪 < 15 隻、王門還沒開 → 小地圖紅點＋畫面邊緣箭頭（最近 3 隻）
// B 輿圖鎖圖：save.w.atlas.lock = { ban: [], fav: [] }，id 是 "lay:lane" / "ev:crack" / "fate"；格數看點亮數
// C 青雲城秘境台：傳送陣旁邊 秘境台（直接進，不用 3 秒）、倉庫箱、鐵砧；從秘境台進的，出來回秘境台旁邊
// mob76.js 後面載入（包 renderRift／atlasTabs／atlasEvW／worldSpots／openSpot／drawCamps／drawWorldHud／riftOpen／riftEnter）
"use strict";

// ───────── B 輿圖鎖圖 ─────────
const LOCK77_LAY = { lane: ["長廊", "一條主路由左到右，房間一間接一間"], ring: ["環道", "房間圍成一圈，清完一圈剛好到王門"], arena: ["廣場", "房間少但很大，每間怪多 50%"] };
function lock77Opts() {
  const o = [];
  for (const k in LOCK77_LAY) o.push({ id: "lay:" + k, g: "地形", n: LOCK77_LAY[k][0], d: LOCK77_LAY[k][1] });
  for (const k of RIFT_EV_KEYS) o.push({ id: "ev:" + k, g: "事件", n: RIFT_EV[k].n, d: RIFT_EV[k].d });
  o.push({ id: "fate", g: "祭壇", n: "天命祭壇", d: "鑰匙前綴「天命」：秘境裡出現天命祭壇（二選一的賭注）" });
  return o;
}
function lockSt() { const A = atlasSt(); if (!A.lock || !Array.isArray(A.lock.ban)) A.lock = { ban: [], fav: [] }; if (!Array.isArray(A.lock.fav)) A.lock.fav = []; return A.lock; }
const lockSlots = () => { const n = talTotal(); return n >= 30 ? { ban: 3, fav: 2 } : n >= 15 ? { ban: 2, fav: 2 } : n >= 5 ? { ban: 1, fav: 1 } : { ban: 0, fav: 0 }; };
// 給其他檔案用（maps.js makeKey／rollKeyMods、rift.js 舊鑰匙補地形）：輿圖還沒開就當作沒有鎖
function lockOf() { if (!save.w || !atlasOpen() || !save.w.atlas) return { ban: [], fav: [] }; const L = lockSt(), S = lockSlots(); return { ban: L.ban.slice(0, S.ban), fav: L.fav.slice(0, S.fav) }; }
const lockBan = (id) => lockOf().ban.includes(id);
const lockFav = (id) => lockOf().fav.includes(id);
// 事件：封鎖＝0、偏好＝×3（evPickKind 用）
const _atlasEvW77 = atlasEvW;
atlasEvW = function (k) { if (lockBan("ev:" + k)) return 0; return _atlasEvW77.apply(this, arguments) * (lockFav("ev:" + k) ? 3 : 1); };

const _atlasTabs77 = atlasTabs;
atlasTabs = function () {
  const h = _atlasTabs77.apply(this, arguments); if (!h) return h;
  return h.replace(/<\/div>$/, `<button class="btab${atlasTab === "lock" ? " on" : ""}" data-at="lock">鎖圖</button></div>`);
};
function lockHtml() {
  const L = lockSt(), S = lockSlots(), n = talTotal(), O = lock77Opts();
  const nb = L.ban.length, nf = L.fav.length;
  const next = n < 5 ? `點亮 5 個輿圖節點開 封鎖 1・偏好 1（現在 ${n}）` : n < 15 ? `點亮 15 個：封鎖 2・偏好 2（現在 ${n}）` : n < 30 ? `點亮 30 個：封鎖 3（現在 ${n}）` : "格數全開了";
  let rows = "", g0 = "";
  for (const o of O) {
    if (o.g !== g0) { g0 = o.g; rows += `<div class="winhead">${o.g}</div>`; }
    const b = L.ban.includes(o.id), f = L.fav.includes(o.id);
    const layBan = o.id.startsWith("lay:") && L.ban.some((x) => x.startsWith("lay:")), evBan = o.id.startsWith("ev:") && L.ban.filter((x) => x.startsWith("ev:")).length >= 3;
    const canB = !b && nb < S.ban && !layBan && !evBan, canF = !f && nf < S.fav;
    rows += `<div class="lk77${b ? " ban" : f ? " fav" : ""}"><div class="lkm"><b>${o.n}</b>${b ? `<i class="lkb">封鎖</i>` : f ? `<i class="lkf">偏好 ×3</i>` : ""}<small>${o.d}</small></div>
      <div class="lka">${b || f ? `<button data-lk="clr:${o.id}">取消</button>` : `<button data-lk="ban:${o.id}" ${canB ? "" : "disabled"}>封鎖</button><button data-lk="fav:${o.id}" ${canF ? "" : "disabled"}>偏好</button>`}</div></div>`;
  }
  return `<div class="skjob">鎖圖<small>封鎖＝完全不會出現；偏好＝機率 ×3。在營地隨時改、免費。只影響之後掉的鑰匙和進場時選的事件</small></div>
    <div class="lk77top"><span>封鎖 <b>${nb}／${S.ban}</b></span><span>偏好 <b>${nf}／${S.fav}</b></span><small>${next}・地形最多封 1 種、事件最多封 3 種</small></div>
    <div class="lk77list">${rows}</div>`;
}
function bindLock() {
  ov.querySelectorAll("[data-lk]").forEach((b) => b.addEventListener("click", () => {
    const [act, ...rest] = b.dataset.lk.split(":"), id = rest.join(":"), L = lockSt(), S = lockSlots();
    if (!atCamp()) { sfx("bad"); renderRift("回營地才能改鎖圖"); return; }
    L.ban = L.ban.filter((x) => x !== id); L.fav = L.fav.filter((x) => x !== id);
    if (act === "ban" && L.ban.length < S.ban) L.ban.push(id);
    if (act === "fav" && L.fav.length < S.fav) L.fav.push(id);
    writeSave(); sfx(act === "clr" ? "click" : "good");
    const o = lock77Opts().find((x) => x.id === id);
    renderRift(act === "clr" ? `${o.n}：取消了` : act === "ban" ? `封鎖 ${o.n}` : `偏好 ${o.n}（×3）`);
  }));
}

// ───────── C 青雲城秘境台 ─────────
let PAD77 = null; // { pad, stash, anvil }，世界座標；第一次用到時找一組不擋路的位置
function pad77() {
  if (PAD77 || !wmap) return PAD77;
  const wp = WAYPOINTS[0], D = 50, alch = NPCS.find((n) => n.id === "alch");
  const ok = (p) => !blockedCircle(p.x, p.y, 9) && zoneAt(p.x, p.y) === "town" && (!alch || Math.hypot(p.x - alch.x, p.y - alch.y) > 44) && Math.hypot(p.x - wp.x, p.y - wp.y) <= 160;
  for (const [sx, sy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const P = { pad: { x: wp.x + sx * D, y: wp.y }, stash: { x: wp.x, y: wp.y + sy * D }, anvil: { x: wp.x + sx * D, y: wp.y + sy * D } };
    if (ok(P.pad) && ok(P.stash) && ok(P.anvil)) { PAD77 = P; break; }
  }
  if (!PAD77) PAD77 = { pad: { x: wp.x - 46, y: wp.y + 4 }, stash: { x: wp.x + 4, y: wp.y + 46 }, anvil: { x: wp.x - 46, y: wp.y + 46 } };
  PAD77.dir = PAD77.pad.x < wp.x ? -1 : 1;
  PAD77.ret = { x: PAD77.pad.x + PAD77.dir * 4, y: PAD77.pad.y - 30 }; // 出秘境站的地方（離觸發範圍 18 夠遠）
  const env = NPCS.find((n) => n.id === "rift"); // 秘境使者站到秘境台外側
  if (env) { env.x = PAD77.pad.x + PAD77.dir * 44; env.y = PAD77.pad.y - 12; }
  return PAD77;
}
const padNear77 = () => { const P = pad77(); return !!P && !(typeof RIFT !== "undefined" && RIFT) && !!W0 && Math.hypot(W0.x - P.pad.x, W0.y - P.pad.y) < 40; };
const _worldSpots77 = worldSpots;
worldSpots = function () {
  const s = _worldSpots77.apply(this, arguments);
  if (inRiftW()) return s;
  const P = pad77(); if (!P) return s;
  return s.concat([
    { id: "p77pad", kind: "p77", x: P.pad.x, y: P.pad.y, r: 18, n: "秘境台" },
    { id: "p77stash", kind: "p77", x: P.stash.x, y: P.stash.y, r: 18, n: "倉庫箱" },
    { id: "p77anvil", kind: "p77", x: P.anvil.x, y: P.anvil.y, r: 18, n: "鐵砧" },
  ]);
};
const _openSpot77 = openSpot;
openSpot = function (s) {
  if (!s || s.kind !== "p77") return _openSpot77.apply(this, arguments);
  sfx("click");
  if (s.id === "p77pad") { atlasTab = "key"; renderRift(); }
  else if (s.id === "p77stash") { if (typeof renderStash === "function") renderStash(); }
  else if (typeof renderSmith === "function") renderSmith();
};
// 秘境台旁：開秘境不用站 3 秒
const _riftOpen77 = riftOpen;
riftOpen = function (k) {
  if (!padNear77() || RIFT || RIFT_PEND) return _riftOpen77.apply(this, arguments);
  RIFT_PEND = { id: k.id, t: 0.01, x: W0.x, y: W0.y, pad: true };
  return "";
};
const _riftEnter77 = riftEnter;
riftEnter = function () {
  const fromPad = !!(RIFT_PEND === null && padNear77());
  _riftEnter77.apply(this, arguments);
  if (RIFT && fromPad && PAD77) { RIFT.ret = { x: PAD77.ret.x, y: PAD77.ret.y }; RIFT.pad77 = true; }
};
function drawPad77() {
  const P = pad77(); if (!P || inRiftW()) return;
  const near = (o) => Math.abs(o.x - cam.x) < W && Math.abs(o.y - cam.y) < H;
  const lab = (x, y, t, c) => { ctx.font = "bold 7px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(0,0,0,0.8)"; ctx.strokeText(t, x, y); ctx.fillStyle = c; ctx.fillText(t, x, y); };
  if (near(P.pad)) { // 石台＋紫色漩渦
    const { x, y } = P.pad;
    ctx.fillStyle = "#4a4452"; ctx.fillRect(x - 15, y - 3, 30, 9); ctx.fillStyle = "#6a6274"; ctx.fillRect(x - 13, y - 5, 26, 4); ctx.fillStyle = "#2c2832"; ctx.fillRect(x - 15, y + 5, 30, 2);
    ctx.save();
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = `rgba(200,140,255,${0.45 + 0.35 * Math.sin(time * 4 + i * 2)})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x, y - 12, 10 - i * 3, 6 - i * 1.6, time * (i % 2 ? 1.2 : -1.2), 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = "rgba(170,110,255,0.35)"; ctx.beginPath(); ctx.arc(x, y - 12, 5 + Math.sin(time * 3), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    lab(x, y - 24, "秘境台", "#e0c8ff");
  }
  if (near(P.stash)) { // 木箱
    const { x, y } = P.stash;
    ctx.fillStyle = "#6a4426"; ctx.fillRect(x - 9, y - 10, 18, 12); ctx.fillStyle = "#8a5a32"; ctx.fillRect(x - 9, y - 13, 18, 4);
    ctx.fillStyle = "#c8a050"; ctx.fillRect(x - 9, y - 6, 18, 1.5); ctx.fillRect(x - 1.5, y - 8, 3, 4);
    ctx.fillStyle = "#3a2414"; ctx.fillRect(x - 9, y + 2, 18, 1.5);
    lab(x, y - 17, "倉庫箱", "#ffe0a0");
  }
  if (near(P.anvil)) { // 鐵砧
    const { x, y } = P.anvil;
    ctx.fillStyle = "#5a3a22"; ctx.fillRect(x - 6, y - 2, 12, 5);
    ctx.fillStyle = "#5c6068"; ctx.fillRect(x - 3, y - 6, 6, 5); ctx.fillStyle = "#7a808a"; ctx.fillRect(x - 10, y - 10, 18, 4); ctx.fillRect(x + 8, y - 9, 4, 2);
    ctx.fillStyle = "#aab0ba"; ctx.fillRect(x - 10, y - 10, 18, 1);
    if (Math.sin(time * 5) > 0.85) { ctx.fillStyle = "#ffcf6b"; ctx.fillRect(x - 2 + Math.random() * 6, y - 14 - Math.random() * 4, 1.5, 1.5); }
    lab(x, y - 16, "鐵砧", "#d8dce4");
  }
}
const _drawCamps77 = drawCamps;
drawCamps = function () { _drawCamps77.apply(this, arguments); drawPad77(); };

// ───────── 秘境畫面：鎖圖分頁、鑰匙地形、秘境台按鈕 ─────────
const _renderRift77 = renderRift;
renderRift = function (msg = "") {
  if (!save.w) return;
  if (atlasTab === "lock" && (!atlasOpen() || RIFT)) atlasTab = "key";
  if (atlasTab === "lock") {
    if (ovKind !== "rift" && !ovOpen("rift")) return;
    if (msg) ovMsg = msg;
    ov.innerHTML = `<div class="col cw"><div class="panel wide equip atlasw skwin">${atlasTabs()}${lockHtml()}</div></div>${ovMsg ? `<div class="toast">${ovMsg}</div>` : ""}`;
    ovMsg = "";
    bindAtlasTabs(); bindLock();
    return;
  }
  _renderRift77.apply(this, arguments);
  if (ovKind !== "rift" || atlasTab !== "key") return;
  const lay = (k) => (k && k.lay && typeof RLAY !== "undefined" && RLAY[k.lay]) || "";
  ov.querySelectorAll("[data-rk]").forEach((b) => { const k = save.keys.find((x) => x.id === b.dataset.rk), n = lay(k), t = b.querySelector("b"); if (n && t && !t.textContent.includes("〔")) t.insertAdjacentHTML("afterbegin", `〔${n}〕`); });
  const go = document.getElementById("rgo");
  if (go && !go.disabled && padNear77()) go.innerHTML = `開啟秘境<small>秘境台：直接進入</small>`;
};

// ───────── A-2 剩怪紅點 ─────────
const RED77_N = 15;
function red77Left() {
  const out = [];
  for (const m of W0.mobs) if (m.rift && !m.dead && !m.boss && !m.ev && !(WMOBS[m.type] && WMOBS[m.type].ai === "pillar")) out.push(m);
  return out;
}
const _drawWorldHud77 = drawWorldHud;
drawWorldHud = function () {
  _drawWorldHud77.apply(this, arguments);
  if (typeof RIFT === "undefined" || !RIFT || state !== "world") return;
  const R = RIFT;
  if (R.pow >= 100 || R.bossOn || R.bossDown) return;
  const left = red77Left();
  // 企劃寫「剩 < 15 隻」，但新地圖一張約 100 隻、殺 80% 王門就開，剩 15 隻時王門早開了 → 改成「離王門還差 15 隻以內」或剩不到 15 隻
  const need = Math.ceil((100 - R.pow) / 100 * Math.max(1, R.total * 0.8));
  if (!left.length || (left.length >= RED77_N && need > RED77_N)) return;
  if (!R.red77) { R.red77 = 1; notice("剩下的妖物位置標在小地圖上了", "#ff9a8a"); }
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // 小地圖（跟 rift.js 同一個換算）
  const mw = Math.min(104, W * 0.26), mx0 = W - mw - 12 - SAFE.r, my0 = 58 + SAFE.t, sc = mw / (RIFT_IW * TS);
  const blink = 0.65 + 0.35 * Math.sin(time * 6);
  ctx.fillStyle = `rgba(255,60,60,${blink})`;
  for (const m of left) { const a = mx0 + (m.x - RIFT_IX0 * TS) * sc, b = my0 + (m.y - RIFT_IY0 * TS) * sc; ctx.fillRect(a - 1.5, b - 1.5, 3, 3); }
  ctx.font = "bold 9px 'Noto Sans TC', sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#ff8a8a";
  ctx.fillText(`王門還差約 ${need} 隻`, mx0, my0 + mw * RIFT_IH / RIFT_IW + 13);
  // 畫面邊緣箭頭：最近 3 隻（在畫面外的）
  const Z = SCALE * 1.35, near = left.map((m) => ({ m, d: Math.hypot(m.x - W0.x, m.y - W0.y) })).sort((a, b) => a.d - b.d).slice(0, 3);
  for (const { m, d } of near) {
    const sx = W / 2 + (m.x - cam.x) * Z, sy = H / 2 + (m.y - cam.y) * Z;
    if (sx > 20 && sx < W - 20 && sy > 20 && sy < H - 20) continue;
    const a = Math.atan2(sy - H / 2, sx - W / 2), mx = W / 2 - 34, my = H / 2 - 34;
    const t = Math.min(mx / Math.max(0.001, Math.abs(Math.cos(a))), my / Math.max(0.001, Math.abs(Math.sin(a))));
    const ex = W / 2 + Math.cos(a) * t, ey = H / 2 + Math.sin(a) * t;
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(a);
    ctx.fillStyle = `rgba(255,70,70,${0.55 + 0.35 * blink})`; ctx.strokeStyle = "rgba(0,0,0,0.7)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -7); ctx.lineTo(-2, 0); ctx.lineTo(-6, 7); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.restore();
    ctx.font = "bold 8px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#ffb0b0";
    ctx.fillText(`${Math.round(d / TS)} 格`, ex - Math.cos(a) * 16, ey - Math.sin(a) * 16 + 3);
  }
};
