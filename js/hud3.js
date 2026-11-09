// 萬劍仙途 — 聊天常駐小框＋右側按鈕列（v7.8，總表第 23 項，企劃 36）
// 小框：下方中間 3 行（世界藍／分流綠／系統金），點一下開完整聊天；▾ 收成一行（記在這台裝置）；8 秒沒新訊息變淡；打王時自動收成一行
// 右側：小地圖下面一排小圓鈕（卡片、任務、手冊、排行、祭壇、設定）取代「⋯更多」；右邊緣 ◀▶ 收起（記在這台裝置）；打王時自動收起
"use strict";
const CM_KEY = "pr_chatMini", RAIL_KEY = "pr_rail", CHCH_KEY = "pr_chatCh";
const CM_CH = { w: ["世界", "#7ab8ff"], c: ["分流", "#7dff8a"], s: ["系統", "#ffd84a"] };
let railBox = null; // 右側列打開時的範圍（劍靈泡泡會避開）
const railLeftX = () => (railBox && !railEl.classList.contains("hidden") ? railBox.x : 1e9);
let cmMsgs = [], cmLast = -1e9, chatCh = localStorage.getItem(CHCH_KEY) === "c" ? "c" : "w";
const cmOpen = () => localStorage.getItem(CM_KEY) !== "1";
const railOpen = () => localStorage.getItem(RAIL_KEY) !== "1";
const bossOn = () => !!(W0 && W0.mobs && W0.mobs.some((m) => m.boss && !m.dead));

// ───────── DOM ─────────
const cmEl = document.createElement("div"); cmEl.id = "chatMini"; cmEl.className = "hidden";
cmEl.innerHTML = `<button class="cmT" aria-label="收起或展開聊天">▾</button><div class="cmL"></div>`;
document.body.appendChild(cmEl);
const railEl = document.createElement("div"); railEl.id = "railR"; railEl.className = "hidden";
const RAIL = [["cards", "卡片", "卡"], ["quest", "任務", "任"], ["book", "手冊", "冊"], ["rank", "排行", "榜"], ["altar", "祭壇", "壇"], ["menu", "設定", "設"]];
railEl.innerHTML = `<button class="rlH" aria-label="收起或展開右側按鈕">▶</button><div class="rlB">${RAIL.map(([k, n, g]) => `<button class="rlb" data-rl="${k}" aria-label="${n}"><b>${g}</b><small>${n}</small></button>`).join("")}</div>`;
document.body.appendChild(railEl);
{ const f = document.getElementById("chatfeed"); if (f) f.classList.add("hidden"); } // 舊的左下聊天流不用了

// ───────── 訊息 ─────────
function cmPush(ch, n, m) {
  cmMsgs.push({ ch, n, m }); if (cmMsgs.length > 30) cmMsgs.shift();
  cmLast = performance.now(); cmDraw();
}
const cmSys = (m) => cmPush("s", "", m);
function cmDraw() {
  const L = cmEl.querySelector(".cmL"), k = cmOpen() && !bossOn() ? 3 : 1;
  const last = cmMsgs.slice(-k);
  L.innerHTML = last.length ? last.map((d) => `<div><i style="color:${CM_CH[d.ch][1]}">${CM_CH[d.ch][0]}</i>${d.n ? `<b>${esc(d.n)}</b>：` : ""}<span${d.ch === "s" ? ' class="sys"' : ""}>${esc(d.m)}</span></div>`).join("")
    : `<div class="dim">點這裡聊天${typeof SOC_ON === "function" && !SOC_ON() ? "（登入帳號後才能說話）" : ""}</div>`;
}
// 收到的聊天（social.js 的 child_added 會呼叫 chatFeed）：分流訊息只看同一條分流
chatFeed = function (d) {
  if (!d) return;
  if (d.n === "系統" && !d.uid) { cmSys(d.m); return; }
  if (d.ch && d.ch !== myCh()) return;
  cmPush(d.ch ? "c" : "w", d.n, d.m);
};
// 送出：世界或分流（分流多帶 ch，RTDB 規則不擋多的欄位）
sendChat = function (m) {
  m = String(m || "").trim().slice(0, 60);
  if (!m) return;
  if (!SOC_ON()) { cmSys("登入帳號後才能聊天"); return; }
  const o = { uid: fbUser.uid, n: myName().slice(0, 12), m, t: firebase.database.ServerValue.TIMESTAMP };
  if (chatCh === "c") o.ch = myCh();
  firebase.database().ref("chat").push(o).catch((e) => cmSys("送不出去：" + (e.code || e.message)));
};
// 完整聊天頁：每行標頻道、別條分流的不顯示、輸入框左邊切頻道
renderChatLog = function () {
  const el = document.getElementById("chatlog"); if (!el) return;
  const L = chatMsgs.filter((d) => !d.ch || d.ch === myCh());
  el.innerHTML = L.map((d) => { const c = d.ch ? "c" : "w"; return `<div${SOC_ON() && d.uid === fbUser.uid ? ' class="me"' : ""}><i class="chtag" style="color:${CM_CH[c][1]}">${CM_CH[c][0]}</i><b>${esc(d.n)}</b><span>${esc(d.m)}</span></div>`; }).join("") || `<p class="dim">還沒有人說話</p>`;
  el.scrollTop = el.scrollHeight;
};
const _openSocialH3 = openSocial;
openSocial = function () {
  const r = _openSocialH3.apply(this, arguments);
  const f = document.getElementById("chatin");
  if (f && !f.querySelector(".chsel")) {
    const b = document.createElement("button"); b.type = "button"; b.className = "chsel";
    const lab = () => { b.textContent = CM_CH[chatCh][0]; b.style.color = CM_CH[chatCh][1]; };
    lab(); b.onclick = () => { sfx("click"); chatCh = chatCh === "w" ? "c" : "w"; localStorage.setItem(CHCH_KEY, chatCh); lab(); };
    f.prepend(b);
    const h = ov.querySelector(".col.c.social h2 small"); if (h) h.textContent = `世界＋${myCh()} 服分流`;
  }
  return r;
};
// 系統：全服廣播、撿到傳說、首殺
const _showAnnH3 = showAnn;
showAnn = function (n, m) { cmSys(`${n} ${m}`); return _showAnnH3.apply(this, arguments); };
const _grantLootH3 = grantLoot;
grantLoot = function (it) { const r = _grantLootH3.apply(this, arguments); if (it && it.q === 3) cmSys(`撿到傳說「${it.name}」`); return r; };
const _wbKilledH3 = wbKilled;
wbKilled = function (m) {
  const k = m && !m.R && m.rb, had = k && save.w && save.w.rbK && save.w.rbK[k];
  const r = _wbKilledH3.apply(this, arguments);
  if (k && !had && save.w.rbK && save.w.rbK[k]) cmSys(`首殺 ${RBOSS[k].n}！`);
  return r;
};

// ───────── 點擊 ─────────
cmEl.addEventListener("click", (e) => {
  e.stopPropagation(); sfx("click");
  if (e.target.closest(".cmT")) { localStorage.setItem(CM_KEY, cmOpen() ? "1" : "0"); cmLast = performance.now(); cmDraw(); hud3Tick(); return; }
  ovGo("social");
});
railEl.addEventListener("click", (e) => {
  e.stopPropagation();
  if (e.target.closest(".rlH")) { sfx("click"); localStorage.setItem(RAIL_KEY, railOpen() ? "1" : "0"); hud3Tick(); return; }
  const b = e.target.closest("[data-rl]"); if (!b) return; sfx("click");
  const k = b.dataset.rl; if (k === "menu") openMenu(); else ovGo(k);
});
["pointerdown", "touchstart"].forEach((ev) => { cmEl.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }); railEl.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }); });

// ───────── 位置：每 0.25 秒照畫面上的東西重排，不蓋到技能按鈕、武器組、DPS ─────────
const rectHit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
function padRects() {
  const out = [];
  document.querySelectorAll("#pad .btn, #wbar").forEach((el) => { const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0 && getComputedStyle(el).display !== "none") out.push({ x: r.left - 4, y: r.top - 4, w: r.width + 8, h: r.height + 8 }); });
  return out;
}
function hud3Tick() {
  const show = typeof state !== "undefined" && (state === "world" || state === "worldDead") && save.w && save.w.created && !document.body.classList.contains("ovopen") && document.body.classList.contains("inworld");
  cmEl.classList.toggle("hidden", !show); railEl.classList.toggle("hidden", !show);
  if (!show) return;
  const vw = innerWidth, vh = innerHeight, port = vh > vw, boss = bossOn();
  { // 直向手機：武器組移到技能按鈕上面一排（原本疊在血球和劍氣斬上）
    const wb = document.getElementById("wbar"); let pt = 1e9;
    if (port) document.querySelectorAll("#pad .btn").forEach((el) => { const r = el.getBoundingClientRect(); if (r.height > 0) pt = Math.min(pt, r.top); });
    if (wb) wb.style.bottom = port && pt < 1e9 ? Math.round(vh - pt + 8) + "px" : "";
  }
  const obs = padRects();
  // 聊天框：寬 40%（直向 70%），底部在武器組和技能按鈕上面
  const one = !cmOpen() || boss;
  cmEl.classList.toggle("one", one); cmEl.classList.toggle("faded", performance.now() - cmLast > 8000);
  const cw = Math.round(vw * (port ? 0.7 : 0.4)), ch = one ? 26 : 62;
  const wb = document.getElementById("wbar"), wr = wb ? wb.getBoundingClientRect() : null;
  let bottom = wr && wr.height ? wr.top - 6 : vh - 40;
  let cx = Math.round((vw - cw) / 2);
  if (port) { for (const o of obs) if (o.x < cx + cw && o.x + o.w > cx) bottom = Math.min(bottom, o.y - 2); }
  else { // 橫向：左邊不要蓋到血球、右邊不要蓋到技能按鈕
    const right = Math.min(...obs.filter((o) => o.y < bottom && o.y + o.h > bottom - ch).map((o) => o.x), vw - 14);
    if (cx + cw > right - 6) cx = Math.max(116, right - 6 - cw);
  }
  cmEl.style.left = cx + "px"; cmEl.style.width = cw + "px"; cmEl.style.top = Math.round(bottom - ch) + "px"; cmEl.style.height = ch + "px";
  cmDraw();
  // 右側列：小地圖（canvas，miniRect）下面
  const open = railOpen() && !boss;
  railEl.classList.toggle("shut", !open); railEl.classList.toggle("port", port);
  railEl.querySelector(".rlH").textContent = open ? "▶" : "◀";
  const mr = typeof miniRect !== "undefined" && miniRect ? miniRect : { x: vw - 120, y: 56, w: 108, h: 76 };
  const top = Math.round(mr.y + mr.h + 15), G = 4, cols = port ? 1 : 2, rows = Math.ceil(RAIL.length / cols);
  // 先試原本大小靠右；撞到技能按鈕就縮一點（最小 32），還是撞到才往左挪
  let B, bw, bh, rx, best = null;
  const box = () => ({ x: rx, y: top, w: bw, h: bh });
  for (const b0 of port ? [40, 36, 32] : [36, 34, 32]) {
    B = b0; bw = cols * B + (cols - 1) * G; bh = rows * B + (rows - 1) * G; rx = Math.round(Math.min(mr.x + mr.w, vw - 24) - bw); // 右邊留給把手
    let i = 0; for (; i < 60 && obs.some((o) => rectHit(box(), o)); i++) rx -= 4;
    if (!best || i < best.i) best = { B, bw, bh, rx, i };
    if (i <= 20) break;
  }
  ({ B, bw, bh, rx } = best);
  railEl.style.top = top + "px"; railBox = open ? box() : null;
  const body = railEl.querySelector(".rlB"); body.style.left = rx + "px"; body.style.width = bw + "px"; body.style.gridTemplateColumns = `repeat(${cols}, ${B}px)`;
  railEl.querySelector(".rlH").style.top = Math.round(bh / 2 - 22) + "px";
  railEl.querySelector(".rlH").style.display = boss ? "none" : ""; // 打王時自動收起，把手也藏起來（不蓋到 DPS）
  // 紅點
  for (const b of railEl.querySelectorAll("[data-rl]")) { const k = b.dataset.rl; b.classList.toggle("dot", k === "cards" ? cardsNew() : k === "book" ? bookBtn.classList.contains("dot") : false); }
  railEl.querySelector(".rlH").classList.toggle("dot", !open && [...railEl.querySelectorAll("[data-rl].dot")].length > 0);
}
setInterval(hud3Tick, 250);
// 「⋯更多」拿掉：快捷列只剩 7 顆
{ const mb = document.querySelector('#quick .qbtn[data-q="more"]'); if (mb) mb.remove(); const i = QUICK.findIndex(([k]) => k === "more"); if (i >= 0) QUICK.splice(i, 1); }
function chatMiniTest(tab) { // 截圖用：塞幾則假訊息
  cmPush("w", "青衫客", "有人要一起打雷鵬王嗎？"); cmPush("c", "小石頭", "2 服營地集合"); cmSys("恭喜 劍心 精煉 +10 成功！");
  if (tab === "one" || tab === "min") localStorage.setItem(CM_KEY, "1"); if (tab === "shut" || tab === "min") localStorage.setItem(RAIL_KEY, "1"); if (tab === "old") cmLast = -1e9;
  hud3Tick();
}
