// 萬劍仙途 — 事件任務（企劃 23 A，總表第 15 項）：主線第 3／4／7／14 步原地改寫
// rescue 救採藥童子（清光一營）、find 找三把斷劍、named 石中魂・孤、hold 修復三個陣眼
// 存檔：save.w.qKey（目前這一步的「種類＋位置」，換了就把 qp、qBits 歸零）、save.w.qBits（找到的斷劍／修好的陣眼，位元）
"use strict";
const EVQ = { rescue: 1, find: 1, named: 1, hold: 1 };
const EVQ_NAMED = "石中魂・孤";
// 固定種子挑空地（每次開遊戲都一樣）
function evSpots(z, n, seed, gap) {
  let sd = seed >>> 0; const rnd = () => { sd = (sd + 0x6D2B79F5) >>> 0; let t = sd; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const out = [], camps = (W0 && W0.camps) || [];
  for (let i = 0; i < 6000 && out.length < n; i++) {
    const x = 40 + rnd() * (TW * TS - 80), y = 40 + rnd() * (TH * TS - 80);
    if (zoneAt(x, y) !== z || blockedCircle(x, y, 12) || safeAt(x, y)) continue;
    if (camps.some((c) => Math.hypot(c.x - x, c.y - y) < 80) || PASSES.some((p) => Math.hypot(p.x - x, p.y - y) < 60)) continue;
    if (out.some((o) => Math.hypot(o.x - x, o.y - y) < gap)) continue;
    out.push({ x, y });
  }
  return out;
}
let EV_SPOT = null;
function evData() {
  if (EV_SPOT || !W0 || !W0.camps || !W0.camps.length) return EV_SPOT;
  const near = (z) => { const wp = WAYPOINTS.find((p) => p.id === z); return W0.camps.filter((c) => c.z === z).sort((a, b) => Math.hypot(a.x - wp.x, a.y - wp.y) - Math.hypot(b.x - wp.x, b.y - wp.y))[0]; };
  EV_SPOT = { rescue: near("grass"), named: near("waste"), find: evSpots("forest", 3, 4117, 260), hold: evSpots("snow", 3, 9203, 220) };
  return EV_SPOT;
}
const evQ = () => { const q = curQuest(); return q && q.main && EVQ[q.k] ? q : null; };
// 換到新的一步：進度歸零（正在舊「斬妖」那步的舊存檔，任務直接換成新的、從 0 開始）
const _curQuestEv = curQuest;
curQuest = function () {
  const q = _curQuestEv.apply(this, arguments), w = save.w;
  if (q && q.main && w) { const key = q.k + ":" + w.q; if (w.qKey !== key) { w.qKey = key; if (EVQ[q.k]) { w.qp = 0; w.qBits = 0; } } }
  return q;
};
const _questTargetEv = questTarget;
questTarget = function () {
  const q = evQ(), D = evData(); if (!q || !D) return _questTargetEv.apply(this, arguments);
  const bits = save.w.qBits || 0;
  if (q.k === "rescue" || q.k === "named") return D[q.k];
  const L = D[q.k], i = L.findIndex((o, j) => !(bits & (1 << j))); return i >= 0 ? L[i] : null;
};
function evNamedSpawn(camp) {
  spawnWMob(camp); const m = W0.mobs[W0.mobs.length - 1];
  m.type = "golem"; m.elite = true; m.mod = "鐵壁"; m.mod2 = "狂暴"; m.named = EVQ_NAMED; m.noRespawn = true; m.evq = 1;
  m.lv = camp.lv + 2; m.hp = m.max = WMOBS.golem.hp * 1.2 * (1 + 0.35 * (m.lv - 1)) * 4 * 3;
  m.x = camp.x; m.y = camp.y + 10; burst(m.x, m.y, "#ffd84a", 24, 90, 0.5);
  return m;
}
const _updateWorldEv = updateWorld;
updateWorld = function (dt) {
  const r = _updateWorldEv.apply(this, arguments);
  const q = evQ(), D = evData(), w = save.w, p = W0;
  if (!q || !D || (typeof RIFT !== "undefined" && RIFT)) return r;
  if (q.k === "rescue") { // 那一營的妖獸全部倒下＝救到
    const c = D.rescue, alive = W0.mobs.filter((m) => m.camp === c && !m.dead).length;
    if (!alive && Math.hypot(p.x - c.x, p.y - c.y) < 260) { w.qp = 1; notice("採藥童子：「謝謝大哥哥／大姐姐！森林裡插著好多黑色的斷劍⋯⋯」說完就跑回城了。", "#9fe8ff"); checkQuest(); }
  } else if (q.k === "find") {
    D.find.forEach((o, j) => { if (!(w.qBits & (1 << j)) && Math.hypot(p.x - o.x, p.y - o.y) < 16) { w.qBits |= 1 << j; w.qp = (w.qp || 0) + 1; floatText(o.x, o.y - 20, `撿到斷劍 ${w.qp}/3`, "#ffe066", true); sfx("arrive"); burst(o.x, o.y, "#b07dff", 16, 70, 0.4); writeSave(); checkQuest(); } });
  } else if (q.k === "named") { // 打到那一營附近才叫出來；倒下由 killMob 包裝算
    const c = D.named;
    if (Math.hypot(p.x - c.x, p.y - c.y) < 220 && !W0.mobs.some((m) => m.evq && !m.dead)) { evNamedSpawn(c); notice(`「${EVQ_NAMED}」出現了！金色名字那隻`, "#ffd84a"); }
  } else if (q.k === "hold") { // 站在陣眼上 10 秒：被打不中斷，離開就重算；第一次踏上去叫附近的妖獸衝過來
    let on = -1; D.hold.forEach((o, j) => { if (!(w.qBits & (1 << j)) && Math.hypot(p.x - o.x, p.y - o.y) < 22) on = j; });
    if (on < 0) { if (W0.holdI !== undefined && W0.holdT > 0) floatText(p.x, p.y - 24, "離開陣眼，重新計時", "#ff9a7a"); W0.holdI = undefined; W0.holdT = 0; }
    else {
      if (W0.holdI !== on) { W0.holdI = on; W0.holdT = 0;
        if (!(W0.holdCall > time)) { W0.holdCall = time + 15; const c = W0.camps.filter((k) => k.z === "snow").sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
          if (c) for (let i = 0; i < 4; i++) { spawnWMob(c); const m = W0.mobs[W0.mobs.length - 1], a = (i / 4) * Math.PI * 2; m.x = p.x + Math.cos(a) * 90; m.y = p.y + Math.sin(a) * 70; if (blockedCircle(m.x, m.y, 6)) { m.x = c.x; m.y = c.y; } m.st = "chase"; m.noRespawn = true; m.evh = 1; } }
        seenHint("hold", "陣眼：站在上面 10 秒，被打不會中斷，但離開就要重算"); }
      W0.holdT += dt;
      if (W0.holdT >= 10) { const o = D.hold[on]; w.qBits |= 1 << on; w.qp = (w.qp || 0) + 1; W0.holdI = undefined; W0.holdT = 0; floatText(o.x, o.y - 24, `陣眼修好 ${w.qp}/3`, "#9fe8ff", true); sfx("win"); fxBoom(o.x, o.y, 30, "160,220,255"); writeSave(); checkQuest(); }
    }
  }
  return r;
};
const _killMobEv = killMob;
killMob = function (m) {
  const r = _killMobEv.apply(this, arguments);
  if (m.evq && m.named) {
    let it = null; for (let i = 0; i < 60; i++) { const t = rollItem(1, Math.floor(m.lv / 3) + 1); if (t.q >= 2 && !t.u) { it = t; break; } if (!it || t.q > it.q) it = t; }
    if (it.q < 2) { it.q = 2; nameItem(it); } wDropItem(it, m);
    const q = evQ(); if (q && q.k === "named") { save.w.qp = 1; notice(`${EVQ_NAMED}：「我⋯⋯本是青雲城的修士⋯⋯是劍尊把我封進石頭⋯⋯」`, "#ffd84a"); checkQuest(); }
  }
  return r;
};
// 金色名字
const _drawWMobEv = drawWMob;
drawWMob = function (m) {
  if (!m.named) return _drawWMobEv.apply(this, arguments);
  const d = WMOBS[m.type], o = d.n; d.n = m.named; try { return _drawWMobEv.apply(this, arguments); } finally { d.n = o; }
};
// 畫童子、斷劍、陣眼（世界座標）
const _drawCampsEv = drawCamps;
drawCamps = function () {
  _drawCampsEv.apply(this, arguments);
  const q = evQ(), D = evData(); if (!q || !D || (typeof RIFT !== "undefined" && RIFT)) return;
  const bits = save.w.qBits || 0;
  ctx.save(); ctx.textAlign = "center";
  if (q.k === "rescue") { // 小童子：綠衣、背竹簍
    const c = D.rescue, x = c.x + 26, y = c.y - 4 + Math.abs(Math.sin(time * 6)) * -2;
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(x - 4, y + 5, 8, 2);
    ctx.fillStyle = "#8a6a3a"; ctx.fillRect(x + 2, y - 5, 4, 6); ctx.fillStyle = "#5ab45a"; ctx.fillRect(x - 3, y - 3, 6, 7); ctx.fillStyle = "#f2d0a8"; ctx.fillRect(x - 3, y - 8, 6, 5); ctx.fillStyle = "#2a2020"; ctx.fillRect(x - 3, y - 9, 6, 2);
    ctx.font = "bold 7px 'Noto Sans TC', sans-serif"; ctx.lineWidth = 2; ctx.strokeStyle = "#000"; ctx.strokeText("救命！", x, y - 13); ctx.fillStyle = "#ffe066"; ctx.fillText("救命！", x, y - 13);
  } else if (q.k === "find") D.find.forEach((o, j) => { if (bits & (1 << j)) return; // 插在地上的斷劍＋紫光
    glow(o.x, o.y - 4, 14 + Math.sin(time * 4) * 3, "176,125,255", 0.5);
    ctx.fillStyle = "#3a3048"; ctx.fillRect(o.x - 1, o.y - 10, 2, 9); ctx.fillStyle = "#c8b8e8"; ctx.fillRect(o.x - 1, o.y - 14, 2, 4); ctx.fillStyle = "#6a4a30"; ctx.fillRect(o.x - 3, o.y - 10, 6, 1);
  });
  else if (q.k === "hold") D.hold.forEach((o, j) => { const done = bits & (1 << j), act = W0.holdI === j; // 陣眼：地上的圓陣，站上去會填滿
    ctx.strokeStyle = done ? "rgba(160,220,255,0.9)" : `rgba(160,220,255,${0.4 + 0.25 * Math.sin(time * 4)})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(o.x, o.y, 22, 13, 0, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(o.x, o.y, 12, 7, 0, 0, Math.PI * 2); ctx.stroke();
    if (done) { ctx.fillStyle = "rgba(160,220,255,0.25)"; ctx.beginPath(); ctx.ellipse(o.x, o.y, 22, 13, 0, 0, Math.PI * 2); ctx.fill(); return; }
    ctx.strokeStyle = "#ff6a6a"; ctx.beginPath(); ctx.moveTo(o.x - 14, o.y - 5); ctx.lineTo(o.x + 12, o.y + 6); ctx.stroke(); // 裂痕
    if (act) { ctx.strokeStyle = "#9fe8ff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W0.x, W0.y - 26, 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, W0.holdT / 10)); ctx.stroke();
      ctx.font = "bold 7px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#cfefff"; ctx.fillText(`${Math.ceil(10 - W0.holdT)}`, W0.x, W0.y - 23); }
  });
  ctx.restore();
};
// 天罰能量 %：手機 E 鍵上也看得到（企劃 12 §2-3 v6.2 沒做的那條）
let evEnEl = null, evEnTxt = "";
setInterval(() => {
  if (!W0 || !inWorld || state !== "world") return;
  if (!evEnEl) { const b = pad.querySelector('[data-act="ult"]'); if (!b) return; evEnEl = b; }
  let s = evEnEl.querySelector(".enp"); if (!s) { s = document.createElement("i"); s.className = "enp"; evEnEl.appendChild(s); evEnTxt = ""; }
  const t = (save.w.lv || 1) < E_LV ? "" : (W0.en || 0) >= EN_FULL ? "滿" : Math.floor(W0.en || 0) + "%";
  if (t !== evEnTxt) { evEnTxt = t; s.textContent = t; s.classList.toggle("full", t === "滿"); }
}, 200);
