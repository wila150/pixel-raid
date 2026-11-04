# 御劍渡劫（pixel-raid，名稱暫定）

使用者自己的網頁手機遊戲（不是客戶案子）。回覆一律用繁體中文、白話，使用者不是工程師。

## 現況（2026-11-05，v0.4）
- 純 HTML/CSS/JS，沒有 build：`index.html`、`style.css`、`game.js`（全部 canvas 畫，像素圖用字串陣列）。
- 本機測試：`python3 -m http.server 8090`。測試參數：`?run&sim=秒` 快轉跑酷；`?demo&sim=秒&swords=N` 直接打王（帶 N 把飛劍）。
- 截圖測試：Windows Edge headless（`/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe --headless=new --screenshot=... --window-size=900,500 --virtual-time-budget=4000`），rAF 幾乎不跑所以要用 sim。headless 視窗寬度小於約 500 會被撐寬，手機直放要用 iframe 包一層 390×844 的頁面來截。
- 題材：修仙（使用者 11/05 決定）。玩法參考修仙手遊廣告常見的「穿過加乘門跑酷」，角色、名字、美術全部原創。
- 流程：第一關「御劍跑酷」（左右選門 +N／×2／−N／÷2 累積飛劍，閃開紫色妖群，妖群吃光飛劍就失敗）→ 渡劫台 → 第二關打王「焚天石魔」1600 血（原暗焰魔像的美術，招式不變）。飛劍每 2.2 秒自動齊射，傷害 = 8 + min(飛劍,400)×0.6。
- 玩家是修士（白袍、髮髻）：劍擊 J、劍陣 K、閃身 空白、丹藥 H、天罰 U；手機左半邊搖桿＋右下按鈕。
- 還沒放上網路（要用使用者自己的帳號，不能用光序／客戶的 Cloudflare）。

## 下一步（使用者還在決定）
v0.4 已加：境界（練氣→渡劫，存 localStorage `pixelraid_save_v1`）、法寶 5 種、靈獸 2 種（赤焰狐、白羽鶴）、每日渡劫（日期當種子，本機最佳＋分享）、跑酷加會動的門和封印石。線上排行榜要用使用者自己的 Firebase，還沒做（要先問）。使用者 11/05 反應「跑酷段無聊」，待改。世界觀與正式名字還沒定。

## 規則
- 角色與美術一律原創，不能用 Pokémon 等既有遊戲的角色、名字、圖。光序的小蛇吉祥物是客戶的，不能拿來用。
- commit：`git -c user.name=XieChengFang -c user.email=114204364+wila150@users.noreply.github.com commit`（還沒有 GitHub repo）。
