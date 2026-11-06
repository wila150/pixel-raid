// 萬劍仙途（pixel-raid）— 手機畫面：全螢幕、橫向／直向設定、加入主畫面引導
"use strict";

const ORIENT_KEY = "pr_orient"; // 每台手機自己記，不存雲端
let orient = localStorage.getItem(ORIENT_KEY) || "land"; // 預設橫向
const isStandalone = () => matchMedia("(display-mode: fullscreen)").matches || matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isTouch = matchMedia("(pointer: coarse)").matches;
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

function applyOrient() {
  document.body.classList.toggle("want-land", orient === "land");
  document.body.classList.toggle("want-port", orient === "port");
  document.body.classList.toggle("touch", isTouch);
  if (screen.orientation && screen.orientation.lock) screen.orientation.lock(orient === "land" ? "landscape" : "portrait").catch(() => {});
}
function setOrient(o) {
  orient = o; localStorage.setItem(ORIENT_KEY, o);
  goFull(); applyOrient(); setTimeout(resize, 300);
}

// 點一下畫面就全螢幕（Android 有效；iPhone Safari 不支援，要加入主畫面才會滿版）
function goFull(e) {
  if (!isTouch || isStandalone() || document.fullscreenElement) return;
  if (typeof state === "undefined" || state !== "world") return; // 只在遊戲中切全螢幕，登入、打字時不要動畫面
  if (e && e.target && e.target.closest && e.target.closest("input, form")) return;
  const el = document.documentElement, f = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!f) return;
  try { const r = f.call(el, { navigationUI: "hide" }); if (r && r.then) r.then(applyOrient, () => {}); } catch { /* 不支援就算了 */ }
}
document.addEventListener("pointerup", goFull, true);
document.addEventListener("fullscreenchange", () => setTimeout(resize, 200));

// 轉錯方向時的提示
const rotEl = document.createElement("div");
rotEl.id = "rotate";
document.body.appendChild(rotEl);
function updateRotHint() {
  rotEl.innerHTML = `<div class="rot-ic">📱</div><p>請把手機轉成<b>${orient === "land" ? "橫向" : "直向"}</b></p><button id="rotSwitch">改用${orient === "land" ? "直向" : "橫向"}玩</button>`;
  document.getElementById("rotSwitch").onclick = () => { setOrient(orient === "land" ? "port" : "land"); updateRotHint(); };
}
updateRotHint();
applyOrient();
setInterval(() => document.body.classList.toggle("playing", typeof inWorld !== "undefined" && inWorld && state === "world"), 500); // 只有在遊戲中才提醒轉方向

// ───────── 加入主畫面 ─────────
let installEvt = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; showA2hs(); });
window.addEventListener("appinstalled", () => { installEvt = null; hideA2hs(); });
const a2hsEl = document.createElement("div");
a2hsEl.id = "a2hs"; a2hsEl.className = "hidden";
document.body.appendChild(a2hsEl);
function a2hsSteps() {
  if (installEvt) return "";
  if (isIOS) return `<ol><li>點 Safari 下方（或上方）的 <b>分享</b> 按鈕 <span class="ios-share">⬆</span></li><li>往下滑，選「<b>加入主畫面</b>」</li><li>從主畫面的「萬劍仙途」圖示打開，就會全螢幕</li></ol>`;
  return `<ol><li>點瀏覽器右上角的 <b>⋮</b></li><li>選「<b>加到主畫面</b>」或「<b>安裝應用程式</b>」</li><li>從主畫面的「萬劍仙途」圖示打開，就會全螢幕</li></ol>`;
}
function showA2hs(force) {
  if (isStandalone() || !isTouch) return;
  if (!force && (typeof state === "undefined" || state !== "world")) { setTimeout(() => showA2hs(), 3000); return; } // 等進到遊戲再跳，不擋登入／註冊
  if (!force && Date.now() - (+localStorage.getItem("pr_a2hs_t") || 0) < 3 * 864e5) return; // 關掉後 3 天內不再跳
  a2hsEl.innerHTML = `<div class="a2hs-box"><img src="icons/icon-192.png" alt=""><div class="a2hs-txt"><b>加入主畫面，玩起來更順</b><small>全螢幕、不會被網址列擋住，像 App 一樣打開</small>${a2hsSteps()}</div>
    <div class="a2hs-btns">${installEvt ? `<button id="a2hsGo" class="big">加入主畫面</button>` : ""}<button id="a2hsNo" class="alt">${installEvt ? "之後再說" : "知道了"}</button></div></div>`;
  a2hsEl.classList.remove("hidden");
  const go = document.getElementById("a2hsGo");
  if (go) go.onclick = () => { installEvt.prompt(); installEvt.userChoice.finally(() => { installEvt = null; hideA2hs(); }); };
  document.getElementById("a2hsNo").onclick = () => { localStorage.setItem("pr_a2hs_t", Date.now()); hideA2hs(); };
}
function hideA2hs() { a2hsEl.classList.add("hidden"); }
setTimeout(() => showA2hs(), 2500); // iPhone 沒有安裝事件，進來 2.5 秒後教他怎麼加

// 選單裡的設定（ui.js 的 pauseGame 用）
function screenSettingsHtml() {
  const ap = !(save.w && save.w.autoPot === false);
  return `${save.w ? `<div class="setrow"><span>血量低於 30% 自動喝丹藥</span><button class="tab${ap ? " on" : ""}" data-ap="1">開</button><button class="tab${!ap ? " on" : ""}" data-ap="0">關</button></div>` : ""}
    <div class="setrow"><span>畫面方向</span><button class="tab${orient === "land" ? " on" : ""}" data-o="land">橫向</button><button class="tab${orient === "port" ? " on" : ""}" data-o="port">直向</button></div>
    ${!isStandalone() && isTouch ? `<div class="setrow"><button id="a2hsMenu" class="alt">📲 加入主畫面（全螢幕玩）</button></div>` : ""}`;
}
function bindScreenSettings() {
  screenEl.querySelectorAll("[data-o]").forEach((b) => b.addEventListener("click", () => {
    setOrient(b.dataset.o); updateRotHint();
    screenEl.querySelectorAll("[data-o]").forEach((x) => x.classList.toggle("on", x.dataset.o === orient));
  }));
  screenEl.querySelectorAll("[data-ap]").forEach((b) => b.addEventListener("click", () => {
    save.w.autoPot = b.dataset.ap === "1"; writeSave(); sfx("click");
    screenEl.querySelectorAll("[data-ap]").forEach((x) => x.classList.toggle("on", x.dataset.ap === b.dataset.ap));
  }));
  const a = document.getElementById("a2hsMenu");
  if (a) a.onclick = () => showA2hs(true);
}
