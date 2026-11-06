// 萬劍仙途 — 社交：好友卡片＋一鍵御劍、深夜密語聊天、分流切換、全服流光廣播
// 資料：RTDB chat/{id}、ann/{id}（規則見 database.rules.json）；好友名單存在自己的存檔 save.w.fr
"use strict";

const SOC_ON = () => typeof NET_ON !== "undefined" && NET_ON && typeof fbUser !== "undefined" && fbUser;
const esc = (t) => String(t == null ? "" : t).replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]));
let chatMsgs = [], chatRef = null, annRef = null, socStart = 0;
const bubbles = {}; // uid → { m, t }

function socListen() {
  if (chatRef || !SOC_ON()) return;
  const db = firebase.database();
  socStart = Date.now();
  chatRef = db.ref("chat").orderByChild("t").limitToLast(40);
  chatRef.on("child_added", (snap) => {
    const d = snap.val(); if (!d || !d.m) return;
    chatMsgs.push(Object.assign({ id: snap.key }, d)); if (chatMsgs.length > 40) chatMsgs.shift();
    if (d.t > socStart - 5000) { bubbles[d.uid] = { m: d.m, t: 6 }; chatFeed(d); }
    if (ovKind === "social") renderChatLog();
    // 順手清掉一天以前的訊息（規則只允許刪舊的）
    if (d.t < Date.now() - 86400000) db.ref("chat/" + snap.key).remove().catch(() => {});
  });
  annRef = db.ref("ann").orderByChild("t").startAt(socStart - 10000);
  annRef.on("child_added", (snap) => { const d = snap.val(); if (d && d.m) showAnn(d.n, d.m); });
}
function socStop() { if (chatRef) chatRef.off(); if (annRef) annRef.off(); chatRef = annRef = null; chatMsgs = []; }

function sendChat(m) {
  m = String(m || "").trim().slice(0, 60);
  if (!m) return;
  if (!SOC_ON()) { chatFeed({ n: "系統", m: "登入帳號後才能聊天" }); return; }
  firebase.database().ref("chat").push({ uid: fbUser.uid, n: myName().slice(0, 12), m, t: firebase.database.ServerValue.TIMESTAMP })
    .catch((e) => chatFeed({ n: "系統", m: "送不出去：" + (e.code || e.message) }));
}
// 全服廣播（精煉 +10、+12 成功時）
function netAnnounce(m) {
  showAnn(myName(), m);
  if (!SOC_ON()) return;
  firebase.database().ref("ann").push({ uid: fbUser.uid, n: myName().slice(0, 12), m: String(m).slice(0, 40), t: firebase.database.ServerValue.TIMESTAMP }).catch(() => {});
}
// 畫面上方滑過一道水墨字公告
const annEl = document.createElement("div"); annEl.id = "ann"; document.body.appendChild(annEl);
let annQ = [], annBusy = false, annLastKey = "";
function showAnn(n, m) {
  const key = n + m; if (key === annLastKey) return; annLastKey = key; setTimeout(() => { if (annLastKey === key) annLastKey = ""; }, 4000);
  annQ.push(`恭喜 <b>${esc(n)}</b> ${esc(m)}`); if (!annBusy) annNext();
}
function annNext() {
  const h = annQ.shift(); if (!h) { annBusy = false; return; }
  annBusy = true; annEl.innerHTML = `<span>${h}</span>`; annEl.className = "go";
  if (typeof sfx === "function") sfx("arrive");
  setTimeout(() => { annEl.className = ""; setTimeout(annNext, 400); }, 9000);
}
// 左下角聊天流（不開面板也看得到最近幾句，10 秒後淡掉）
const feedEl = document.createElement("div"); feedEl.id = "chatfeed"; document.body.appendChild(feedEl);
function chatFeed(d) {
  const el = document.createElement("div");
  el.innerHTML = `<b>${esc(d.n)}</b>：${esc(d.m)}`;
  feedEl.appendChild(el); while (feedEl.children.length > 5) feedEl.firstChild.remove();
  setTimeout(() => el.classList.add("fade"), 10000); setTimeout(() => el.remove(), 11000);
}
setInterval(() => feedEl.classList.toggle("hidden", !(typeof inWorld !== "undefined" && inWorld && state === "world")), 300);

// 頭上對話泡泡（自己和別人）
function drawBubble(uid, x, y) {
  const b = bubbles[uid]; if (!b) return;
  ctx.font = "bold 6px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
  const t = b.m.length > 18 ? b.m.slice(0, 18) + "…" : b.m, w = ctx.measureText(t).width + 8;
  ctx.globalAlpha = Math.min(1, b.t); ctx.fillStyle = "rgba(14,26,24,0.85)"; ctx.fillRect(x - w / 2, y - 28, w, 10);
  ctx.strokeStyle = "rgba(140,230,210,0.5)"; ctx.lineWidth = 0.5; ctx.strokeRect(x - w / 2, y - 28, w, 10);
  ctx.fillStyle = "#bff5e8"; ctx.fillText(t, x, y - 20.5); ctx.globalAlpha = 1;
}
const _drawOther = drawOther;
drawOther = function (o) { _drawOther(o); const uid = Object.keys(others).find((k) => others[k] === o); if (uid) drawBubble(uid, o.x, o.y); };
const _drawMyName = drawMyName;
drawMyName = function (p) { _drawMyName(p); if (SOC_ON()) drawBubble(fbUser.uid, p.x, p.y); };
setInterval(() => { for (const k in bubbles) if ((bubbles[k].t -= 0.25) <= 0) delete bubbles[k]; }, 250);

// ───────── 好友 ─────────
const friends = () => (save.w.fr = save.w.fr || {});
function addFriend(uid, n) { friends()[uid] = String(n || "修士").slice(0, 12); writeSave(); }
function delFriend(uid) { delete friends()[uid]; writeSave(); }
// 一鍵御劍：飛到好友附近最近的安全營地（同一條分流），落地有太極護罩；野外要原地 3 秒
function flyToFriend(uid) {
  const o = others[uid]; if (!o || !W0) return;
  const d = o.d, wp = WAYPOINTS.slice().sort((a, b) => Math.hypot(a.x - d.x, a.y - d.y) - Math.hypot(b.x - d.x, b.y - d.y))[0];
  if ((d.ch || 1) !== myCh()) setCh(d.ch || 1);
  flyTo(Object.assign({}, wp, { n: `${friends()[uid] || d.n} 身邊` }));
}

// ───────── 社交面板（左：好友＋分流　中：聊天　右：線上玩家）─────────
function openSocial(focus) {
  if (ovKind !== "social" && !ovOpen("social")) return;
  socListen();
  const fr = friends(), now = Date.now();
  const online = (uid) => others[uid] && (!others[uid].d.t || now - others[uid].d.t < 90000);
  const zn = (d) => (d && ZONES[d.z] ? ZONES[d.z].n : "仙界");
  const fcards = Object.keys(fr).map((uid) => {
    const on = online(uid), d = on ? others[uid].d : null;
    return `<div class="fcard${on ? " on" : ""}"><i class="dot"></i><div><b>${esc(fr[uid])}</b><small>${on ? `${d.ch || 1}服·${zn(d)}・Lv.${d.lv}` : "離線"}</small></div>
      ${on ? `<button class="fly" data-fly="${uid}" title="御劍過去">${typeof uiIcon === "function" && UI_ICON.tp ? uiIcon("tp") : "➶"}</button>` : ""}<button class="del" data-del="${uid}" title="刪除">×</button></div>`;
  }).join("") || `<p class="dim">還沒有好友。右邊線上玩家按「加好友」</p>`;
  const chs = Array.from({ length: CH_MAX }, (_, i) => i + 1).map((c) => `<button class="tab${c === myCh() ? " on" : ""}" data-ch="${c}">${c} 服<small>${chCount(c)} 人</small></button>`).join("");
  const plist = Object.keys(others).map((uid) => {
    const d = others[uid].d;
    return `<div class="fcard on"><i class="dot"></i><div><b>${esc(d.n)}</b><small>${d.ch || 1}服·${zn(d)}・Lv.${d.lv}</small></div>${fr[uid] ? `<span class="dim">好友</span>` : `<button class="add" data-add="${uid}">加好友</button>`}</div>`;
  }).join("") || `<p class="dim">${SOC_ON() ? "現在沒有其他人在線上" : "登入帳號後才看得到其他玩家"}</p>`;
  ov.innerHTML = `<div class="col l social"><h2>好友 <small>${Object.keys(fr).length}</small></h2><div class="flist">${fcards}</div>
      <h2>分流</h2><div class="setrow chrow">${chs}</div><p class="dim">同一條分流的人才看得到彼此、看得到招式</p></div>
    <div class="col c social"><h2>密語 <small>全服頻道</small></h2><div class="chatlog" id="chatlog"></div>
      <form class="chatin" id="chatin"><input id="chatTxt" maxlength="60" placeholder="${SOC_ON() ? "說點什麼⋯（Enter 送出）" : "登入後才能聊天"}" autocomplete="off"><button class="gold">送出</button></form></div>
    <div class="col r social"><h2>線上修士 <small>${Object.keys(others).length}</small></h2><div class="flist">${plist}</div></div>`;
  renderChatLog();
  ov.querySelectorAll("[data-fly]").forEach((b) => b.addEventListener("click", () => { sfx("click"); flyToFriend(b.dataset.fly); }));
  ov.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => { sfx("click"); delFriend(b.dataset.del); openSocial(); }));
  ov.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => { sfx("good"); addFriend(b.dataset.add, others[b.dataset.add] && others[b.dataset.add].d.n); openSocial(); }));
  ov.querySelectorAll("[data-ch]").forEach((b) => b.addEventListener("click", () => { sfx("click"); setCh(+b.dataset.ch); openSocial(); }));
  const f = document.getElementById("chatin"), inp = document.getElementById("chatTxt");
  f.onsubmit = (e) => { e.preventDefault(); sendChat(inp.value); inp.value = ""; };
  inp.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Escape") { inp.blur(); ovClose(); } });
  if (focus) setTimeout(() => inp.focus(), 50);
}
function renderChatLog() {
  const el = document.getElementById("chatlog"); if (!el) return;
  el.innerHTML = chatMsgs.map((d) => `<div${SOC_ON() && d.uid === fbUser.uid ? ' class="me"' : ""}><b>${esc(d.n)}</b><span>${esc(d.m)}</span></div>`).join("") || `<p class="dim">還沒有人說話</p>`;
  el.scrollTop = el.scrollHeight;
}
// Enter：打開聊天直接打字；G：好友面板
window.addEventListener("keydown", (e) => {
  if (e.target && e.target.tagName === "INPUT") return;
  const k = e.key.toLowerCase();
  if (state !== "world" || e.repeat) return;
  if (k === "enter") { e.preventDefault(); openSocial(true); }
  else if (k === "g") openSocial();
});
const _netStop = netStop;
netStop = function () { _netStop(); socStop(); };
