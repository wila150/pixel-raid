// 萬劍仙途 — 秘境第二版（企劃 16 第 3-6、9 節）：每張秘境 2 個不同的隨機事件（v6.1，第 10-2 節）；精髓放在鑰匙上可以指定其中一個
"use strict";
const RIFT_EV = {
  crack: { n: "天裂之隙", c: "255,120,200", d: "碰一下裂縫，10 秒內四面八方湧出大量妖獸，殺越多獎勵越多" },
  altar: { n: "祭劍台", c: "255,200,90", d: "三座劍台，每座點了出一群加了詛咒的妖獸；三座都清完選一個獎勵" },
  seal: { n: "封妖石", c: "150,200,255", d: "一隻被封住的精英：放出來（更強、多 2 個詞綴）打倒必掉精髓，或不理牠" },
  goblin: { n: "寶藏妖", c: "255,230,120", d: "寶藏妖在附近，靠近牠就開始逃，10 秒內打倒掉一堆通貨" },
  tomb: { n: "劍冢", c: "200,220,255", d: "站在劍冢中間守 15 秒（妖獸會衝過來），守住必掉一把武器" },
};
const RIFT_EV_KEYS = Object.keys(RIFT_EV);
let evAskEl = null;
function evDialog(title, text, btns) { // btns: [{t, cls, f}]
  if (evAskEl) evAskEl.remove();
  evAskEl = document.createElement("div"); evAskEl.id = "riftAsk";
  evAskEl.innerHTML = `<div class="exbox"><h3>${title}</h3><p>${text}</p><div class="acts row evbtns">${btns.map((b, i) => `<button data-i="${i}" class="${b.cls || ""}">${b.t}</button>`).join("")}</div></div>`;
  document.body.appendChild(evAskEl);
  evAskEl.querySelectorAll("[data-i]").forEach((el) => el.addEventListener("click", () => { sfx("click"); const b = btns[+el.dataset.i]; evAskEl.remove(); evAskEl = null; b.f && b.f(); }));
}
const evIdx = (x, y) => Math.floor(y / TS) * TW + Math.floor(x / TS);
function evSpawn(x, y, opt = {}) {
  const R = RIFT, camp = { x, y, z: R.theme, lv: R.lv, respawn: [], rift: true }, mods = R.key.mods;
  spawnWMob(camp);
  const m = W0.mobs[W0.mobs.length - 1];
  m.noRespawn = true; m.rift = true; m.ev = true; m.st = opt.idle ? "idle" : "chase";
  if (!R.reach[evIdx(m.x, m.y)]) { m.x = x; m.y = y; }
  if (opt.elite && !m.elite) { m.elite = true; m.hp *= 4; m.max *= 4; m.mod = ELITE_MODS[Math.floor(Math.random() * ELITE_MODS.length)]; }
  if (mods.includes("hp")) { m.hp *= 1.4; m.max *= 1.4; }
  m.spdMul = (mods.includes("fast") ? 1.25 : 1) * (opt.spd || 1);
  m.dmgMul = (mods.includes("dmg") ? 1.3 : 1) * (opt.dmg || 1);
  if (opt.hp) { m.hp *= opt.hp; m.max *= opt.hp; }
  return m;
}
function evRing(cx, cy, r) { // 圓周上找一個走得到的點
  for (let i = 0; i < 12; i++) { const a = Math.random() * Math.PI * 2, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; if (RIFT.reach[evIdx(x, y)] && !blockedCircle(x, y, 6)) return { x, y }; }
  return { x: cx + rand(-20, 20), y: cy + rand(-20, 20) };
}
// 進秘境：選 2 個不同事件、各自找位置（事件天賦樹會加權，atlas.js 的 atlasEvW）
const RIFT_EV_N = 2;
function evPickKind(not) {
  const ks = RIFT_EV_KEYS.filter((k) => !not.includes(k)), w = ks.map((k) => (typeof atlasEvW === "function" ? atlasEvW(k) : 1));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ks.length; i++) if ((r -= w[i]) < 0) return ks[i];
  return ks[ks.length - 1];
}
function evPlace(R, k) {
  let pos = typeof riftSpot === "function" ? riftSpot(R, R.key && R.key.mods.includes("fate") ? "room" : Math.random() < 0.5 ? "branch" : "room") : null; // 企劃 77：支線盡頭或戰鬥房正中間（有天命前綴時支線留給祭壇）
  for (let i = 0; i < 900 && !pos; i++) {
    const p = riftT2W(6 + Math.floor(Math.random() * (RIFT_IW - 12)), 5 + Math.floor(Math.random() * (RIFT_IH - 10)));
    if (!R.reach[evIdx(p.x, p.y)] || blockedCircle(p.x, p.y, 10)) continue;
    if (Math.hypot(p.x - R.ent.x, p.y - R.ent.y) < 260 || Math.hypot(p.x - R.boss.x, p.y - R.boss.y) < 260 || R.pts.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 90)) continue;
    if (R.evs.some((e) => Math.hypot(e.x - p.x, e.y - p.y) < (i < 600 ? 360 : 220))) continue; // 兩個事件分開放
    pos = p;
  }
  if (!pos) pos = R.pts[Math.floor(R.pts.length * (R.evs.length ? 0.25 : 0.6))] || R.ent;
  clearAround(pos.x, pos.y, 3);
  const E = { k, x: pos.x, y: pos.y, st: "idle", t: 0, mobs: [], kills: 0 };
  if (k === "altar") { E.alt = [0, 1, 2].map((i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / 3; return { x: pos.x + Math.cos(a) * 40, y: pos.y + Math.sin(a) * 40, st: "idle", mobs: [], curse: null }; }); for (const a of E.alt) clearAround(a.x, a.y, 1); }
  R.evs.push(E);
  return E;
}
const _riftEnterV = riftEnter;
riftEnter = function (id) {
  const key = save.keys.find((k) => k.id === id);
  _riftEnterV.apply(this, arguments);
  if (!RIFT || !key) return;
  const R = RIFT; R.evs = [];
  const kinds = [key.ev && RIFT_EV[key.ev] ? key.ev : evPickKind([])];
  if (key.ev2 && RIFT_EV[key.ev2] && !kinds.includes(key.ev2)) kinds.push(key.ev2); // 輿圖節點固定事件
  while (kinds.length < RIFT_EV_N) kinds.push(evPickKind(kinds));
  for (const k of kinds) evPlace(R, k);
  setTimeout(() => { if (RIFT === R) notice(`秘境事件：${kinds.map((k) => RIFT_EV[k].n).join("、")}（小地圖金點）`, "#ffe066"); }, 1200);
};
const EV_CURSES = [["妖獸血量 +50%", { hp: 1.5 }], ["妖獸傷害 +30%", { dmg: 1.3 }], ["妖獸移速 +30%", { spd: 1.3 }], ["多一隻精英", { extra: 1 }]];
function evReward(E, kind) {
  const R = RIFT, il = Math.floor(R.lv / 3) + 1, at = { x: E.x, y: E.y };
  if (kind === "item") { let it = null; for (let i = 0; i < 20 && !(it && it.q >= 2); i++) it = rollItem(1, il); wDropItem(it, at); }
  else if (kind === "gem") { for (let i = 0; i < 2; i++) wDrop({ kind: "gem", g: randGem(Math.random() < 0.3 ? 2 : 1) }, at); }
  else if (kind === "cur") { for (let i = 0; i < 3; i++) wDrop({ kind: "cur", c: "chaos" }, at); }
}
// 每幀
const _updateWorldV = updateWorld;
updateWorld = function (dt) {
  _updateWorldV.apply(this, arguments);
  if (!RIFT || !RIFT.evs || state !== "world" || !W0) return;
  for (const E of RIFT.evs) evTick(E, dt);
};
function evTick(E, dt) {
  const R = RIFT, p = W0, d = Math.hypot(p.x - E.x, p.y - E.y);
  E.t += dt;
  if (E.k === "crack") {
    if (E.st === "idle" && d < 20) { E.st = "run"; E.t = 0; E.spT = 0; shake = 6; sfx("crit"); floatText(E.x, E.y - 30, "天裂之隙開啟！撐住 10 秒", "#ff8ad8", true); }
    if (E.st === "run") {
      if ((E.spT -= dt) <= 0 && E.t < 10) { E.spT = 0.55; for (let i = 0; i < 2; i++) { const q = evRing(E.x, E.y, 110); E.mobs.push(evSpawn(q.x, q.y)); burst(q.x, q.y, "#ff8ad8", 10, 60); } }
      if (E.t >= 10 && E.mobs.every((m) => m.dead)) {
        E.st = "done"; const n = E.mobs.length; floatText(E.x, E.y - 30, `天裂之隙平息：斬殺 ${n} 隻`, "#ffe066", true); sfx("win");
        wDrop({ kind: "cur", c: "chaos" }, E); for (let i = 0; i < Math.floor(n / 8); i++) wDrop({ kind: "cur", c: randCur() }, E);
        if (MAT_Z[R.theme]) for (let i = 0; i < 3; i++) wDrop({ kind: "mat", k: MAT_Z[R.theme][1] }, E);
      }
    }
  } else if (E.k === "altar") {
    for (const a of E.alt) {
      if (a.st === "idle" && Math.hypot(p.x - a.x, p.y - a.y) < 14) {
        const cu = EV_CURSES[Math.floor(Math.random() * EV_CURSES.length)]; a.curse = cu[0]; a.st = "run"; sfx("crit");
        floatText(a.x, a.y - 30, `祭劍台詛咒：${cu[0]}`, "#ffb060", true);
        for (let i = 0; i < 5 + (cu[1].extra || 0); i++) { const q = evRing(a.x, a.y, 60); a.mobs.push(evSpawn(q.x, q.y, { hp: cu[1].hp, dmg: cu[1].dmg, spd: cu[1].spd, elite: i === 0 || (cu[1].extra && i === 1) })); }
      }
      if (a.st === "run" && a.mobs.every((m) => m.dead)) { a.st = "done"; floatText(a.x, a.y - 24, "劍台淨化", "#ffe9a0"); }
    }
    if (E.st === "idle" && E.alt.every((a) => a.st === "done")) {
      E.st = "done"; sfx("win");
      evDialog("祭劍台：選一個獎勵", "三座劍台都淨化了", [{ t: "紫裝以上 1 件", cls: "gold", f: () => evReward(E, "item") }, { t: "技能寶石 2 顆", f: () => evReward(E, "gem") }, { t: "混元石 3 顆", f: () => evReward(E, "cur") }]);
    }
  } else if (E.k === "seal") {
    if (E.st === "idle" && d < 22 && !evAskEl) {
      E.st = "ask";
      evDialog("封妖石", "裡面封著一隻精英。放出來會更強（多 2 個詞綴），打倒必掉精髓。", [{ t: "放出來打", cls: "red", f: () => {
        E.st = "run"; const m = evSpawn(E.x, E.y - 10, { elite: true, hp: 2, dmg: 1.3, spd: 1.15 }); m.mod2 = ELITE_MODS.filter((x) => x !== m.mod).slice(0, 2).join("、"); E.mobs = [m];
        shake = 8; sfx("crit"); floatText(E.x, E.y - 36, `封印解除！（${m.mod}、${m.mod2}）`, "#9fdcff", true);
      } }, { t: "不理牠", f: () => { E.st = "skip"; } }]);
    }
    if (E.st === "skip" && d > 60) E.st = "idle";
    if (E.st === "run" && E.mobs.every((m) => m.dead)) { E.st = "done"; sfx("win"); for (let i = 0; i < 2; i++) wDrop({ kind: "ess", k: randEss() }, E.mobs[0]); wDropItem(rollItem(1, Math.floor(R.lv / 3) + 1), E.mobs[0]); floatText(E.x, E.y - 30, "封妖成功：精髓 ×2", "#7dffd8", true); }
  } else if (E.k === "goblin") {
    if (E.st === "idle" && d < 120) {
      E.st = "run"; E.t = 0; const m = evSpawn(E.x, E.y, { hp: 3, idle: true }); m.type = "hunter"; m.gob = true; E.mobs = [m];
      floatText(E.x, E.y - 30, "寶藏妖！10 秒內打倒牠", "#ffe066", true); sfx("arrive");
    }
    if (E.st === "run") {
      const m = E.mobs[0];
      if (m.dead) { E.st = "done"; sfx("win"); floatText(m.x, m.y - 30, "寶藏妖被斬了！", "#ffe066", true); for (let i = 0; i < 4; i++) wDrop({ kind: "cur", c: i < 2 ? "gold" : randCur() }, m); wDrop({ kind: "cur", c: "chaos" }, m); wDrop({ kind: "stone", v: 80 + R.lv * 4 }, m); }
      else if (E.t > 10) { E.st = "done"; m.dead = true; fxPuff(m.x, m.y, true); floatText(m.x, m.y - 30, "寶藏妖逃走了⋯⋯", "#cfc4dc", true); }
      else { m.st = "idle"; m.atkT = 9; m.wind = 0; const a = Math.atan2(m.y - p.y, m.x - p.x) + Math.sin(E.t * 2) * 0.6; moveBody(m, Math.cos(a) * 72 * dt, Math.sin(a) * 72 * dt, 6); m.wx = m.x; m.wy = m.y; }
    }
  } else if (E.k === "tomb") {
    const inside = d < 40;
    if (E.st === "idle" && inside) { E.st = "run"; E.hold = 0; E.spT = 0; sfx("crit"); floatText(E.x, E.y - 30, "守住劍冢 15 秒！", "#c8dcff", true); }
    if (E.st === "run") {
      if (inside) E.hold += dt;
      if ((E.spT -= dt) <= 0) { E.spT = 1; const q = evRing(E.x, E.y, 130); E.mobs.push(evSpawn(q.x, q.y)); }
      if (E.hold >= 15) {
        E.st = "done"; sfx("win"); floatText(E.x, E.y - 30, "劍冢認主！", "#ffe066", true);
        const nm = R.key.mods.length; let it = null; for (let i = 0; i < 30 && !(it && it.slot === "sword" && it.q >= (nm >= 3 ? 2 : 1)); i++) it = rollItem(1, Math.floor(R.lv / 3) + 1, curWeapon());
        wDropItem(it, E);
      }
    }
  }
}
// 畫事件（世界座標）
const _drawCampsV = drawCamps;
drawCamps = function () {
  _drawCampsV.apply(this, arguments);
  if (!RIFT || !RIFT.evs) return;
  for (const E of RIFT.evs) evDraw(E);
};
function evDraw(E) {
  const V = RIFT_EV[E.k], done = E.st === "done";
  ctx.save();
  const c = done ? "150,150,150" : V.c;
  if (E.k === "altar") for (const a of E.alt) { const ac = a.st === "done" ? "150,150,150" : V.c; ctx.fillStyle = `rgba(${ac},0.25)`; ctx.beginPath(); ctx.ellipse(a.x, a.y, 10, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = `rgb(${ac})`; ctx.fillRect(a.x - 1, a.y - 14, 2, 12); ctx.fillRect(a.x - 4, a.y - 10, 8, 1.5); }
  else if (E.k === "tomb") { ctx.strokeStyle = `rgba(${c},${0.4 + 0.3 * Math.sin(time * 4)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(E.x, E.y, 40, 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, x = E.x + Math.cos(a) * 26, y = E.y + Math.sin(a) * 18; ctx.fillStyle = `rgb(${c})`; ctx.fillRect(x - 0.7, y - 10, 1.5, 10); } if (E.st === "run") { ctx.strokeStyle = "#ffe066"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(E.x, E.y, 44, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, E.hold / 15)); ctx.stroke(); } }
  else if (E.k === "crack" && E.st !== "done") { ctx.strokeStyle = `rgba(${c},0.9)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(E.x - 12, E.y - 4); ctx.lineTo(E.x - 3, E.y + 2); ctx.lineTo(E.x + 2, E.y - 5); ctx.lineTo(E.x + 12, E.y + 3); ctx.stroke(); if (E.st === "run") { ctx.strokeStyle = "#ff8ad8"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(E.x, E.y, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, E.t / 10)); ctx.stroke(); } }
  else if (E.k === "seal" && (E.st === "idle" || E.st === "ask" || E.st === "skip")) { ctx.fillStyle = "#3a4a5a"; ctx.fillRect(E.x - 7, E.y - 16, 14, 18); ctx.strokeStyle = `rgba(${c},${0.6 + 0.4 * Math.sin(time * 5)})`; ctx.lineWidth = 1.5; ctx.strokeRect(E.x - 7, E.y - 16, 14, 18); }
  else if (E.k === "goblin" && E.st === "idle") { ctx.fillStyle = `rgba(${c},${0.5 + 0.4 * Math.sin(time * 6)})`; ctx.beginPath(); ctx.arc(E.x, E.y - 4, 4, 0, Math.PI * 2); ctx.fill(); }
  ctx.font = "bold 8px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(0,0,0,0.8)";
  const lab = done ? `${V.n}（完成）` : E.k === "tomb" && E.st === "run" ? `劍冢 ${Math.ceil(15 - E.hold)} 秒` : E.k === "goblin" && E.st === "run" ? "" : V.n;
  if (lab) { ctx.strokeText(lab, E.x, E.y - 22); ctx.fillStyle = `rgb(${c})`; ctx.fillText(lab, E.x, E.y - 22); }
  ctx.restore();
}
// HUD：秘境資訊下面加事件，小地圖金點
const _drawWorldHudV = drawWorldHud;
drawWorldHud = function () {
  _drawWorldHudV.apply(this, arguments);
  if (!RIFT || !RIFT.evs) return;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  RIFT.evs.forEach((E, i) => {
    const V = RIFT_EV[E.k];
    const bw = Math.min(200, W * 0.46), bx = 10 + SAFE.l, by = 10 + SAFE.t + (curQuest() ? 94 : 50) + (riskyItems().length ? 22 : 0) + 42 + i * 17;
    ctx.fillStyle = "rgba(14,8,24,0.7)"; ctx.fillRect(bx, by, bw, 16);
    ctx.textAlign = "left"; ctx.font = "bold 9px 'Noto Sans TC', sans-serif"; ctx.fillStyle = E.st === "done" ? "#9a9a9a" : `rgb(${V.c})`;
    const st = E.st === "done" ? "完成" : E.k === "goblin" && E.st === "run" ? `追！${Math.max(0, Math.ceil(10 - E.t))} 秒` : E.k === "crack" && E.st === "run" ? `${Math.max(0, Math.ceil(10 - E.t))} 秒` : E.k === "altar" ? `${E.alt.filter((a) => a.st === "done").length}/3` : E.k === "tomb" && E.st === "run" ? `${Math.floor(E.hold)}/15 秒` : "地圖金點";
    ctx.fillText(`事件：${V.n}・${st}`, bx + 7, by + 11);
    if (E.st !== "done") {
      const mw = Math.min(104, W * 0.26), mx0 = W - mw - 12 - SAFE.r, my0 = 58 + SAFE.t, sc = mw / (RIFT_IW * TS);
      const a = mx0 + (E.x - RIFT_IX0 * TS) * sc, b = my0 + (E.y - RIFT_IY0 * TS) * sc;
      ctx.fillStyle = `rgba(255,216,74,${0.6 + 0.4 * Math.sin(time * 6)})`; ctx.fillRect(a - 2.5, b - 2.5, 5, 5);
    }
  });
};
// 精髓放在鑰匙上指定事件（秘境畫面）
const _renderRiftV = renderRift;
renderRift = function (msg) {
  _renderRiftV.apply(this, arguments);
  if (ovKind !== "rift" || RIFT) return;
  const sel = save.keys.find((k) => k.id === riftSel); if (!sel) return;
  const c = ov.querySelector(".col.c.rift"); if (!c) return;
  const essN = Object.values(save.ess || {}).reduce((a, b) => a + b, 0);
  const div = document.createElement("div"); div.className = "evpick";
  div.innerHTML = `<div class="winhead">秘境事件（每張 2 種）${sel.ev ? `：其中一個必出 <b>${RIFT_EV[sel.ev].n}</b>` : "：隨機"}</div>
    <div class="evlist">${RIFT_EV_KEYS.map((k) => `<button data-ev="${k}" class="${sel.ev === k ? "on" : ""}" ${essN && sel.ev !== k && !sel.cor ? "" : "disabled"} title="${RIFT_EV[k].d}"><b>${RIFT_EV[k].n}</b><small>${RIFT_EV[k].d}</small></button>`).join("")}</div>
    <p class="dim">用 1 顆精髓（任何種類，你有 ${essN} 顆）放在鑰匙上，這張秘境必定出現你選的事件${sel.cor ? "（渡劫過的鑰匙不能再改）" : ""}。</p>`;
  c.appendChild(div);
  div.querySelectorAll("[data-ev]").forEach((b) => b.addEventListener("click", () => {
    const k = Object.keys(save.ess || {}).find((x) => save.ess[x] > 0); if (!k) return;
    save.ess[k]--; sel.ev = b.dataset.ev; writeSave(); sfx("good"); renderRift(`這把鑰匙必出：${RIFT_EV[sel.ev].n}`);
  }));
};
