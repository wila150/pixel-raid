// 萬劍仙途 — 祭壇頁＋怪潮祭品（v7.7，總表第 19 項，企劃 27 C）
// 祭壇頁：4 隻區域王的天劫挑戰集中在一頁（要天劫印、看冷卻），「御劍前往」到那座祭壇；在祭壇旁邊可以直接挑戰
// 怪潮祭品：秘境第 5 層以上的秘境之主會掉；在野外（營地結界外）放下，30 秒內一波一波湧出這區的怪，最後一隻潮王；殺越多掉越多
"use strict";
OV_TAB.altar = "altar"; OV_NAME.altar = "祭壇"; OV_KEYS.altar = ["escape"];
CUR.tide = { n: "怪潮祭品", g: "潮", c: "#ff9a4a", r: 0, d: "在野外（營地結界外）放下：30 秒內湧出這一區的妖獸，最後出一隻潮王，殺越多掉越多。秘境第 5 層以上的秘境之主會掉；到「祭壇」頁使用" };
if (!CUR_KEYS.includes("tide")) CUR_KEYS.push("tide");
const TIDE_T = 30, TIDE_R = 420;

function tideWhy() {
  if (!W0 || state !== "world" && !(state === "pick" && pausedFrom === "world")) return "要在仙界裡";
  if (RIFT) return "秘境裡不能用";
  if (W0.tide) return "怪潮還沒結束";
  if (W0.mobs.some((m) => m.boss && !m.dead)) return "打王的時候不能用";
  if (safeAt(W0.x, W0.y) || zoneAt(W0.x, W0.y) === "town") return "要走出營地結界、到野外放";
  if (curN("tide") < 1) return "沒有怪潮祭品（秘境第 5 層以上的秘境之主會掉）";
  return "";
}
function tideCamp(z) { return W0.camps.filter((c) => c.z === z).sort((a, b) => Math.hypot(a.x - W0.x, a.y - W0.y) - Math.hypot(b.x - W0.x, b.y - W0.y))[0]; }
function tideSpawn(T, boss) {
  const c = T.camp; if (!c) return;
  spawnWMob(c); const m = W0.mobs[W0.mobs.length - 1];
  let ok = false;
  for (let i = 0; i < 8 && !ok; i++) { const a = Math.random() * Math.PI * 2, x = T.x + Math.cos(a) * rand(90, 140), y = T.y + Math.sin(a) * rand(70, 110); if (!blockedCircle(x, y, 7) && !safeAt(x, y)) { m.x = x; m.y = y; ok = true; } }
  if (!ok) { m.x = T.x + rand(-20, 20); m.y = T.y + rand(-20, 20); }
  m.st = "chase"; m.noRespawn = true; m.tide = 1; m.wx = m.x; m.wy = m.y;
  { const l0 = m.lv; m.lv += 3; const k = mobHpMul(m.lv) / mobHpMul(l0); m.hp *= k; m.max *= k; } // 企劃 27 驗收：等級 +3
  if (!boss && !m.elite && Math.random() < 0.076) { m.elite = true; m.mod = ELITE_MODS[Math.floor(Math.random() * ELITE_MODS.length)]; m.hp *= 4; m.max *= 4; } // 精英約 15%
  if (boss) {
    const mul = (m.elite ? 1 : 4) * 4.5; m.elite = true; m.mod = m.mod || ELITE_MODS[Math.floor(Math.random() * ELITE_MODS.length)];
    m.hp = m.max = m.max * mul; m.named = "潮王・" + WMOBS[m.type].n; m.tideBoss = 1;
    burst(m.x, m.y, "#ff9a4a", 30, 120); shake = 10;
  } else burst(m.x, m.y, "#ff9a4a", 8, 50);
  T.mobs.push(m);
}
const TIDE_NOCUR = ["divine", "mirror", "vaal"]; // 怪潮不掉造化、太虛鏡、天劫雷印
function tideCur() { for (let i = 0; i < 30; i++) { const k = randCur(); if (!TIDE_NOCUR.includes(k)) return k; } return "chaos"; }
function startTide() {
  const why = tideWhy(); if (why) return why;
  const z = zoneAt(W0.x, W0.y), camp = tideCamp(z); if (!camp) return "這附近沒有妖獸";
  useCur("tide"); writeSave();
  W0.tide = { x: W0.x, y: W0.y, z, camp, t: 0, spT: 0, mobs: [], boss: false };
  sfx("crit"); shake = 8; flashT = 0.2; flashColor = "255,150,70";
  floatText(W0.x, W0.y - 34, `怪潮來了！撐住 ${TIDE_T} 秒`, "#ff9a4a", true);
  return "";
}
function tideTick(dt) {
  const T = W0.tide; if (!T) return;
  T.t += dt;
  if (Math.hypot(W0.x - T.x, W0.y - T.y) > TIDE_R || state === "worldDead") { // 跑太遠／死掉：怪潮散了，沒獎勵
    for (const m of T.mobs) if (!m.dead) m.noRespawn = true;
    floatText(W0.x, W0.y - 30, "離開祭品太遠，怪潮散了", "#ff9a7a", true); W0.tide = null; return;
  }
  if (T.t < TIDE_T - 5 && (T.spT -= dt) <= 0) { T.spT = 1.4; const n = T.t < 10 ? 3 : T.t < 20 ? 4 : 6; for (let i = 0; i < n; i++) tideSpawn(T, false); }
  if (!T.boss && T.t >= TIDE_T - 5) { T.boss = true; tideSpawn(T, true); floatText(T.x, T.y - 40, "潮王出現了！", "#ff7a3a", true); sfx("crit"); }
  if (T.t >= TIDE_T && T.mobs.every((m) => m.dead)) {
    const n = T.mobs.length, lv = T.camp.lv; W0.tide = null; sfx("win");
    floatText(T.x, T.y - 34, `怪潮平息：斬殺 ${n} 隻`, "#ffe066", true);
    const at = { x: W0.x, y: W0.y };
    wDrop({ kind: "cur", c: "chaos" }, at); for (let i = 0; i < Math.floor(n / 12); i++) wDrop({ kind: "cur", c: tideCur() }, at);
    for (let i = 0; i < 1 + Math.floor(n / 15); i++) wDropItem(rollItem(1, lv), at);
    if (MAT_Z[T.z]) for (let i = 0; i < 3; i++) wDrop({ kind: "mat", k: MAT_Z[T.z][Math.random() < 0.2 ? 1 : 0] || MAT_Z[T.z][0] }, at);
    if (Math.random() < 0.3) wDrop({ kind: "gem", g: randGem() }, at);
    if (typeof netAnnounce === "function" && n >= 40) netAnnounce(`平息了一場怪潮（斬殺 ${n} 隻）`);
  }
}
const _updateWorldTd = updateWorld;
updateWorld = function (dt) { const r = _updateWorldTd.apply(this, arguments); if (W0 && W0.tide) tideTick(dt); return r; };
const _drawCampsTd = drawCamps;
drawCamps = function () {
  _drawCampsTd.apply(this, arguments);
  const T = W0 && W0.tide; if (!T) return;
  const left = Math.max(0, TIDE_T - T.t), k = Math.min(1, T.t / TIDE_T);
  ctx.save(); ctx.strokeStyle = `rgba(255,150,70,${0.35 + 0.2 * Math.sin(time * 4)})`; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.ellipse(T.x, T.y, 150, 110, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = "#ff9a4a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(T.x, T.y, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke();
  ctx.fillStyle = "#ffcf9a"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center";
  ctx.fillText(left > 0 ? `怪潮 ${Math.ceil(left)} 秒` : `清掉剩下的 ${T.mobs.filter((m) => !m.dead).length} 隻`, T.x, T.y - 22);
  ctx.restore();
};
// 名字：潮王（event.js 的 drawWMob 包裝看 m.named）
// 秘境第 5 層以上的秘境之主掉怪潮祭品
const _killMobTd = killMob;
killMob = function (m) {
  const was = m.dead; _killMobTd.apply(this, arguments);
  if (was || !m.dead) return;
  if (m.boss && m.R && RIFT && RIFT.tier >= 5 && Math.random() < (RIFT.tier >= 10 ? 0.5 : 0.3)) wDrop({ kind: "cur", c: "tide" }, m);
};

// ───────── 祭壇頁 ─────────
const altarNear = (k) => W0 && Math.hypot(W0.x - RBOSS[k].x, W0.y - RBOSS[k].y) < 160;
function altarHtml() {
  const seal = curN("tjseal"), tide = curN("tide");
  const rows = RB_KEYS.map((k) => {
    const R = RBOSS[k], killed = rbKilled(k), cd = rbCool(k), near = altarNear(k);
    let btn;
    if (!killed) btn = `<button class="alb" disabled>還沒打倒過</button>`;
    else if (near) btn = `<button class="alb gold" data-tj="${k}" ${seal && cd <= 0 ? "" : "disabled"}>${cd > 0 ? `沉睡 ${Math.ceil(cd)} 秒` : seal ? "天劫挑戰（−1 印）" : "沒有天劫印"}</button>`;
    else btn = `<button class="alb" data-fly="${k}">御劍前往</button>`;
    return `<div class="alrow${killed ? "" : " dim"}"><div class="altx"><b>${R.n}</b><small>Lv.${R.lv}・${R.where}</small><small>${killed ? cd > 0 ? `沉睡中 ${Math.ceil(cd)} 秒` : "可以挑戰" : "先打倒一次一般版"}</small></div>${btn}</div>`;
  }).join("");
  const why = tideWhy();
  return `<div class="col cw"><div class="panel wide altar">
    <h3>天劫挑戰 <small>天劫印 ×${seal}</small></h3>
    <p class="dim">天劫版：Lv.${TJ_LV}、多 1–3 個王詞綴、掉落等級 130、傳說機率 ×3。天劫印在秘境第 8 層以上的秘境之主身上掉。</p>
    ${rows}
    <h3>怪潮祭品 <small>×${tide}</small></h3>
    <p class="dim">在野外放下：${TIDE_T} 秒內湧出這一區的妖獸，最後出一隻潮王。殺越多掉越多（通貨、裝備、這區的素材）。跑離太遠就散了。秘境第 5 層以上的秘境之主會掉。</p>
    <button class="alb gold big2" id="alTide" ${why ? "disabled" : ""}>${why || "在這裡放下祭品"}</button>
  </div></div>`;
}
function renderAltar(msg = "") {
  if (!save.w) return;
  if (ovKind !== "altar" && !ovOpen("altar")) return;
  if (msg) ovMsg = msg;
  ov.innerHTML = altarHtml() + (ovMsg ? `<div class="toast">${ovMsg}</div>` : ""); ovMsg = "";
  ov.querySelectorAll("[data-fly]").forEach((b) => b.addEventListener("click", () => { const R = RBOSS[b.dataset.fly]; sfx("arrive"); flyTo({ x: R.x, y: R.y + 70, n: R.n + "祭壇" }); }));
  ov.querySelectorAll("[data-tj]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.tj; ovClose(); const e = startTianjie(k); if (e) floatText(W0.x, W0.y - 30, e, "#ff9a7a", true); }));
  const t = document.getElementById("alTide"); if (t) t.onclick = () => { const e = startTide(); if (e) { sfx("bad"); renderAltar(e); return; } ovClose(); };
}
const _openHudAl = openHud;
openHud = function (h) { if (h === "altar") return renderAltar(); return _openHudAl.apply(this, arguments); };
