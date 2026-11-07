// 版本更新：每分鐘看一次網站上的 index.html 版本號（?v=），有新版就在畫面上方顯示小橫幅。
// 不自動更新（11/07 使用者決定）：玩家自己點才存檔＋重新載入；「稍後」收起 10 分鐘。打王中點更新會先確認。
(() => {
  const mj = document.querySelector('script[src*="main.js"]'), ME = mj && new URL(mj.src).searchParams.get("v"); // 和 check() 比的是同一個 main.js 版本號
  let newV = null, going = false, bar = null, snoozeUntil = 0;
  function go() {
    if (going) return;
    const boss = typeof W0 !== "undefined" && W0 && W0.mobs && W0.mobs.some((m) => m.boss && !m.dead);
    if (boss && !confirm("打王中，更新會中斷戰鬥，確定嗎？")) return;
    going = true;
    try { writeSave(); if (typeof cloudFlush === "function") cloudFlush(); } catch (e) { /* 存不了也要更新 */ }
    if (bar) bar.querySelector(".upd-go").textContent = "存檔中，馬上更新⋯⋯";
    setTimeout(() => location.replace(location.pathname + "?r=" + newV), 1200); // 換網址參數，連 index.html 的快取也一起繞過
  }
  function showBar() {
    if (going || Date.now() < snoozeUntil) return;
    if (!bar) {
      bar = document.createElement("div"); bar.id = "updBar";
      bar.innerHTML = `<button class="upd-go"></button><button class="upd-later">稍後</button>`;
      bar.querySelector(".upd-go").onclick = go;
      bar.querySelector(".upd-later").onclick = () => { snoozeUntil = Date.now() + 10 * 60 * 1000; bar.remove(); bar = null; };
    }
    bar.querySelector(".upd-go").textContent = `新版本 v${newV}・點這裡更新（會先存檔）`;
    if (!bar.isConnected) document.body.appendChild(bar);
  }
  async function check() {
    if (going || !ME) return;
    try {
      const t = await (await fetch("index.html?t=" + Date.now(), { cache: "no-store" })).text();
      const m = t.match(/main\.js\?v=([\w.]+)/);
      if (m && m[1] !== ME) { newV = m[1]; showBar(); }
    } catch (e) { /* 離線就下次再看 */ }
  }
  setInterval(check, 60000); setTimeout(check, 15000);
  setInterval(() => { if (newV) showBar(); }, 30000); // 「稍後」10 分鐘到了再出現
  document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
})();
