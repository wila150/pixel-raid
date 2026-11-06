// 自動更新：每分鐘看一次網站上的 index.html 版本號（?v=），有新版就存檔後重新載入。
// 戰鬥中不打斷：回到安全營地、切回 App、或在標題／登入畫面時才換；也可以按橫幅馬上更新。
(() => {
  const mj = document.querySelector('script[src*="main.js"]'), ME = mj && new URL(mj.src).searchParams.get("v"); // 和 check() 比的是同一個 main.js 版本號
  let newV = null, going = false, bar = null;
  const calm = () => {
    if (typeof state === "undefined") return true;
    if (state === "title" || document.querySelector(".panel.login")) return true; // 標題、登入畫面
    return state === "world" && (document.hidden || (typeof W0 !== "undefined" && W0 && safeAt(W0.x, W0.y))); // 仙界：營地裡或切到背景；打王、副本中不換
  };
  function go() {
    if (going) return; going = true;
    try { writeSave(); if (typeof cloudFlush === "function") cloudFlush(); } catch (e) { /* 存不了也要更新 */ }
    setTimeout(() => location.replace(location.pathname + "?r=" + newV), 1200); // 換網址參數，連 index.html 的快取也一起繞過
  }
  function showBar() {
    if (bar) return;
    bar = document.createElement("button"); bar.id = "updBar";
    bar.textContent = `有新版本 v${newV}：回營地會自動更新（點這裡馬上更新）`;
    bar.onclick = go; document.body.appendChild(bar);
  }
  async function check() {
    if (going || !ME) return;
    try {
      const t = await (await fetch("index.html?t=" + Date.now(), { cache: "no-store" })).text();
      const m = t.match(/main\.js\?v=([\w.]+)/);
      if (m && m[1] !== ME) { newV = m[1]; showBar(); }
    } catch (e) { /* 離線就下次再看 */ }
  }
  setInterval(() => { if (newV && calm()) go(); }, 2000);
  setInterval(check, 60000); setTimeout(check, 15000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
})();
