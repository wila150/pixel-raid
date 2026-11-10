// 解除卡死＋出錯紀錄（企劃 48，總表第 37 項）：main.js 前載入
"use strict";

// ───────── 出錯紀錄 ─────────
let ERR_LOG = [];
try { ERR_LOG = JSON.parse(localStorage.getItem("pr_errlog") || "[]") || []; } catch { ERR_LOG = []; }
let errFrameBad = false, errStreak = 0, errStuckAt = 0, errSaveT = 0, stuckEl = null, unstuckCool = 0;
function errSaveLog() { try { localStorage.setItem("pr_errlog", JSON.stringify(ERR_LOG)); } catch { /* 無痕模式 */ } }
function errCatch(e, where) {
  errFrameBad = true;
  try {
    const msg = String((e && (e.message || e.reason)) || e).slice(0, 200);
    const st = (e && e.stack) || "", m = st.match(/js\/([\w.]+)\??[^:\s]*:(\d+)/), at = m ? `${m[1]}:${m[2]}` : "";
    const last = ERR_LOG[ERR_LOG.length - 1];
    if (last && last.m === msg && last.at === at) { last.n = (last.n || 1) + 1; last.t2 = Date.now(); }
    else {
      ERR_LOG.push({ m: msg, at, w: where, t: Date.now(), v: typeof GAME_VER !== "undefined" ? GAME_VER : "", s: typeof state !== "undefined" ? state : "",
        r: typeof RIFT !== "undefined" && RIFT ? RIFT.tier : 0, x: W0 ? Math.round(W0.x) : 0, y: W0 ? Math.round(W0.y) : 0, n: 1 });
      if (ERR_LOG.length > 20) ERR_LOG.splice(0, ERR_LOG.length - 20);
      console.error("[萬劍仙途]", where, e);
    }
    const now = performance.now();
    if (now - errSaveT > 2000) { errSaveT = now; errSaveLog(); }
  } catch { /* 記錄本身不能再丟錯 */ }
}
window.addEventListener("error", (ev) => errCatch(ev.error || ev.message, "window"));
window.addEventListener("unhandledrejection", (ev) => errCatch(ev.reason, "promise"));

// 每幀結尾：連續 1 秒每幀都出錯 → 跳小框
function errTick(dt) {
  if (errFrameBad) errStreak += dt; else errStreak = 0;
  errFrameBad = false;
  if (unstuckCool > 0) unstuckCool -= dt;
  if (errStreak >= 1 && !stuckEl && inWorld && W0 && save.w && save.w.created) { errStuckAt = performance.now(); errSaveLog(); showStuckBox(); }
}

// ───────── 原本的大地圖（判斷有沒有被秘境圖蓋掉）─────────
let WMAP0 = null;
const _buildWorldU = buildWorld;
buildWorld = function () { const r = _buildWorldU.apply(this, arguments); WMAP0 = wmap; return r; };
const mapWrong = () => !wmap || wmap.length !== TW * TH || (!RIFT && WMAP0 && wmap !== WMAP0);

// 異常＝剛偵測到卡住、在秘境、地圖不對、數值壞掉：免原地 3 秒
function stuckAbnormal() {
  return (errStuckAt > 0 && performance.now() - errStuckAt < 20000) || !!RIFT || !!RIFT_PEND || mapWrong() || !W0 || !isFinite(W0.x) || !isFinite(W0.y) || !isFinite(W0.hp);
}
function nearestCamp() {
  const own = (save.w && save.w.wp) || ["town"], x = W0 && isFinite(W0.x) ? W0.x : 1200, y = W0 && isFinite(W0.y) ? W0.y : 1530;
  const list = WAYPOINTS.filter((wp) => wp.id === "town" || own.includes(wp.id)).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
  const wp = list[0];
  return !wp || wp.id === "town" ? { x: 1200, y: 1530, n: "青雲城" } : { x: wp.x, y: wp.y + 22, n: `${wp.n}營地` };
}
const safeStep = (f) => { try { f(); } catch (e) { errCatch(e, "unstuck"); } };

// 解除卡住：一步失敗繼續下一步
function unstuck(force) {
  if (!W0 || !save.w) return "還沒進入仙界";
  if (state === "worldDead") return "倒下時不能用，先復活";
  if (unstuckCool > 0 && !force) return `等 ${Math.ceil(unstuckCool)} 秒後才能再用`;
  const abn = stuckAbnormal();
  if (!abn && !safeAt(W0.x, W0.y)) { // 一切正常、在野外：照回城符規則原地 3 秒
    if (W0.recall > 0) return "傳送中";
    const c = nearestCamp(); W0.recall = 3; W0.recallTo = { x: c.x, y: c.y };
    safeStep(() => ovClose());
    floatText(W0.x, W0.y - 26, `回到${c.n}：原地不動 3 秒`, "#9fe8ff", true);
    unstuckCool = 30; return "";
  }
  unstuckCool = 30;
  // 1. 介面、輸入
  safeStep(() => { if (ovKind) { ovKind = null; ov.className = "ov hidden"; ov.innerHTML = ""; if (typeof ovBar === "function") ovBar(); } });
  safeStep(() => riftAskClose());
  safeStep(() => { const ex = document.getElementById("exitAsk"); if (ex) ex.remove(); });
  safeStep(() => { screenEl.classList.add("hidden"); pressed.clear(); padAct.clear(); if (typeof padHeld !== "undefined" && padHeld.clear) padHeld.clear(); keys.clear(); stick.id = null; mouse.down = false; });
  // 2. 暫時特效
  safeStep(() => {
    particles = []; floaters = []; if (typeof fxs !== "undefined") fxs.length = 0;
    for (const k of ["eshots", "pshots", "fires", "walls", "rings", "tornados", "voids", "orbs", "totems", "zaps"]) if (Array.isArray(W0[k])) W0[k] = [];
    if (typeof wbZones !== "undefined") wbZones = [];
    W0.lat = []; hitstop = 0; shake = 0; flashT = 0;
  });
  // 3. 秘境
  safeStep(() => { RIFT_PEND = null; });
  safeStep(() => { if (RIFT) riftLeave(true); });
  safeStep(() => { if (RIFT) RIFT = null; }); // riftLeave 中途壞掉也要清
  safeStep(() => {
    if (!mapWrong()) return;
    wmap = null; buildWorld();
    W0.mobs = []; W0.camps = []; W0.drops = []; W0.pools = []; W0.grave = null; W0.healMul = 1;
    makeCamps();
  });
  // 4. 怪潮
  safeStep(() => { if (W0.tide) { for (const m of W0.tide.mobs || []) m.hp = 0; W0.tide = null; } W0.mobs = W0.mobs.filter((m) => !m.tide); });
  // 5. 位置
  safeStep(() => {
    const c = nearestCamp(); let x = c.x, y = c.y;
    for (let r = 0; r < 200 && blockedCircle(x, y, 5); r += 8) { x = c.x + Math.cos(r) * r; y = c.y + Math.sin(r) * r; }
    W0.x = x; W0.y = y; W0.recall = 0; W0.recallTo = null; W0.roll = 0; W0.shield = 3; W0.iframe = 1;
    save.w.x = Math.round(x); save.w.y = Math.round(y);
    safeStep(() => bankLoot("解除卡住"));
  });
  // 6. 數值
  safeStep(() => {
    B = worldStats(); W0.maxHp = B.maxHp;
    W0.hp = isFinite(W0.hp) ? Math.max(1, Math.min(W0.hp, B.maxHp)) : B.maxHp;
    W0.mp = isFinite(W0.mp) ? Math.max(0, Math.min(W0.mp, B.maxMp)) : B.maxMp;
    if (B.maxEs !== undefined) W0.es = isFinite(W0.es) ? Math.max(0, Math.min(W0.es, B.maxEs)) : B.maxEs;
  });
  safeStep(() => { cam = { x: W0.x, y: W0.y, zoom: 1 }; state = "world"; pausedFrom = null; pad.classList.remove("hidden"); setPadLabels(true); });
  last = performance.now(); errStreak = 0; errStuckAt = 0;
  // 7. 存檔＋說明
  safeStep(() => writeSave());
  safeStep(() => { sfx("arrive"); burst(W0.x, W0.y, "#9fe8ff", 30, 100); });
  safeStep(() => notice("已經幫你回到營地（解除卡住）", "#9fe8ff"));
  closeStuckBox();
  return "";
}

// ───────── 回報：複製紀錄文字 ─────────
function errReportText() {
  const d = (t) => { const x = new Date(t); return `${x.getMonth() + 1}/${x.getDate()} ${String(x.getHours()).padStart(2, "0")}:${String(x.getMinutes()).padStart(2, "0")}`; };
  const head = `萬劍仙途 v${typeof GAME_VER !== "undefined" ? GAME_VER : "?"}｜${navigator.userAgent.slice(0, 120)}`;
  if (!ERR_LOG.length) return `${head}\n（沒有錯誤紀錄）`;
  return [head, ...ERR_LOG.slice(-20).map((e) => `${d(e.t)} v${e.v} [${e.w}] ${e.m} @${e.at} ×${e.n || 1}｜${e.s}${e.r ? `・秘境${e.r}層` : ""}・(${e.x},${e.y})`)].join("\n");
}
async function errReport(btn) {
  const txt = errReportText();
  let ok = false;
  try { await navigator.clipboard.writeText(txt); ok = true; } catch { /* 有些瀏覽器不給 */ }
  if (!ok) { try { const ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); ok = document.execCommand("copy"); ta.remove(); } catch { /* 算了 */ } }
  if (btn) btn.textContent = ok ? "已複製，貼給我們" : "複製失敗";
  if (!ok) prompt("複製下面這段貼給我們：", txt);
}

// ───────── 自動跳出的小框 ─────────
function showStuckBox() {
  if (stuckEl) return;
  stuckEl = document.createElement("div"); stuckEl.id = "stuckAsk";
  stuckEl.innerHTML = `<div class="exbox"><h3>畫面好像卡住了</h3><p>按「解除卡住」會回到最近的營地（秘境裡撿到的都帶回）。也可以按「回報」把錯誤紀錄複製給我們。</p><div class="acts row"><button id="skGo" class="gold">解除卡住</button><button id="skRep">回報</button><button id="skNo">關閉</button></div></div>`;
  document.body.appendChild(stuckEl);
  stuckEl.querySelector("#skGo").onclick = () => { safeStep(() => sfx("click")); unstuck(true); };
  stuckEl.querySelector("#skRep").onclick = (e) => errReport(e.currentTarget);
  stuckEl.querySelector("#skNo").onclick = () => closeStuckBox();
}
function closeStuckBox() { if (stuckEl) { stuckEl.remove(); stuckEl = null; } }

// ───────── 繪圖出錯：至少把 HUD 畫出來 ─────────
const _renderWorldU = renderWorld;
renderWorld = function () {
  try { return _renderWorldU.apply(this, arguments); } catch (e) {
    errCatch(e, "renderWorld");
    try { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); drawWorldHud(); } catch (e2) { errCatch(e2, "hud"); }
  }
};

// ───────── 設定加按鈕 ─────────
const _openMenuU = openMenu;
openMenu = function () {
  _openMenuU.apply(this, arguments);
  const h = ov.querySelector(".menu h2");
  if (!h || ov.querySelector("#unstuckRow")) return;
  const row = document.createElement("div"); row.className = "setrow"; row.id = "unstuckRow";
  row.innerHTML = `<span>畫面卡住、人不見、回不去？<small class="dim">（冷卻 30 秒）</small></span><button class="tab on" id="unstuckBtn">解除卡住</button><button class="tab" id="errRepBtn">回報問題${ERR_LOG.length ? `（${ERR_LOG.length}）` : ""}</button>`;
  h.after(row);
  row.querySelector("#unstuckBtn").onclick = (e) => { safeStep(() => sfx("click")); const why = unstuck(false); if (why) e.currentTarget.textContent = why; };
  row.querySelector("#errRepBtn").onclick = (e) => errReport(e.currentTarget);
};
