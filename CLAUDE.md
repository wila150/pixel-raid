# 御劍渡劫（pixel-raid，名稱暫定）

使用者自己的網頁手機遊戲（不是客戶案子）。回覆一律用繁體中文、白話，使用者不是工程師。

## 現況（2026-11-05，v0.6）
- 純 HTML/CSS/JS，沒有 build。程式照使用者給的架構拆成 `js/`（index.html 依序載入，共用全域變數，順序不能亂）：
  `core.js` 畫面／工具／像素圖／輸入／共用狀態 → `save.js` 數值與存檔 → `audio.js` 合成音效＋背景音樂 → `combat.js` 打王（玩家、靈獸、飛劍、魔王、碰撞）→ `run.js` 御劍跑酷（生成器＋碰撞＋畫面）→ `perks.js` 三選一功法 → `render.js` 打王繪圖與光影 → `ui.js` 結算／主畫面／暫停／HUD → `main.js` 狀態機與主迴圈。
- 狀態：title → run →（pick 三選一）→ runEnd →（pick）→ intro → play → win/lose；paused 可從 run/intro/play 進入（Esc、P、右上角按鈕、切走 App 自動暫停）。M 或右上角喇叭切換靜音。
- 本機測試：`python3 -m http.server 8090`。`?run&sim=秒` 快轉跑酷（約 10 秒會碰到第一個機緣）；`?demo&sim=秒&swords=N&pet=fox|crane` 直接打王。
- 截圖：Windows Edge headless（`--headless=new --virtual-time-budget=4000`），rAF 幾乎不跑要用 sim；headless 視窗寬度小於約 500 會被撐寬，手機直放要用 iframe 包一層 390×844 的頁面。
- 題材修仙（11/05 決定）。玩法：前段「御劍跑酷」穿加乘門、飛劍自動打封印石和妖群（打碎／全滅有獎勵）、會動的門、兩個「機緣」三選一功法＋抵達渡劫台再選一次；湊齊兩種功法會出現「進化」卡（天河劍陣、不滅金身、九霄雷域、萬劍歸宗）。跑酷第 9 排有小王「守關妖將」（擋整條路，斬殺給飛劍＋額外機緣，沒打倒撞上去扣剩餘血量一半的劍）。後段打王「焚天石魔」三階段（50% 暴走、20% 元神燃燒＋螺旋火焰），飛劍自動齊射。功法 14 種＋4 進化在 `perks.js`；打王功法效果在 `combat.js`（`thunderStrike`、`checkPhase`）。
- 局外繼承：境界（練氣→渡劫）、法寶 5 種、靈獸 2 種，存 localStorage `pixelraid_save_v1`。每日渡劫用日期當種子，本機紀錄＋分享按鈕。
- 參考方向（使用者提供）：隨機技能三選一＋局外數值繼承（倖存者類、卡牌 roguelike）。
- 還沒放上網路（要用使用者自己的帳號，不能用光序／客戶的 Cloudflare）。線上排行榜要用使用者自己的 Firebase，要先問。

## 下一步（使用者還在決定）
放上網路、線上排行榜、更多魔王／關卡、組隊打王、PVP。世界觀與正式名字還沒定。

## 規則
- 角色與美術一律原創，不能用 Pokémon 等既有遊戲的角色、名字、圖。光序的小蛇吉祥物是客戶的，不能拿來用。
- commit：`git -c user.name=XieChengFang -c user.email=114204364+wila150@users.noreply.github.com commit`。GitHub：https://github.com/wila150/pixel-raid （私人，分支 master）；push 要用 Windows GCM（見記憶 wsl-machine-setup-gaps）。
