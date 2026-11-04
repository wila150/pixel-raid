# 暗焰魔像討伐戰（pixel-raid）

使用者自己的網頁手機遊戲（不是客戶案子）。回覆一律用繁體中文、白話，使用者不是工程師。

## 現況（2026-11-05，v0.2）
- 純 HTML/CSS/JS，沒有 build：`index.html`、`style.css`、`game.js`（全部 canvas 畫，像素圖用字串陣列）。
- 本機測試：`python3 -m http.server 8090`，開 http://localhost:8090 。`?demo&sim=30` 會跳過開場並快轉 30 秒（截圖測試用）。
- 截圖測試：Windows Edge headless（`/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe --headless=new --screenshot=... --window-size=900,500`），headless 裡 requestAnimationFrame 幾乎不跑，所以要用 sim 快轉。
- 玩法：俯視單人打王。玩家（藍披風劍士）：攻擊 J、旋風斬 K、翻滾 空白、藥水 H、必殺 U（集滿能量）；手機左半邊搖桿＋右下按鈕。
- 魔王「暗焰魔像」1600 血，攻擊前地上紅色警示：砸地圈、火球扇、衝撞（撞牆會暈）；50% 進第二階段加整圈火球、隕石雨。
- 已有：光影（暗色遮罩挖光源）、熔岩裂縫、魔法陣、火星、打擊停頓、連擊、必殺技、魔王登場動畫、結算評價 S/A/B/C。
- 還沒放上網路（要用使用者自己的帳號，不能用光序／客戶的 Cloudflare）。

## 下一步（使用者還在決定）
建議改成「倖存者類＋打王」：小怪一波波湧來、角色自動攻擊、升級三選一技能，第 5 分鐘魔王登場；再來是成長系統（升級、掉寶、存檔 Firebase）、排行榜、組隊打王、PVP。
世界觀與名字還沒定，目前的名稱是暫定。

## 規則
- 角色與美術一律原創，不能用 Pokémon 等既有遊戲的角色、名字、圖。光序的小蛇吉祥物是客戶的，不能拿來用。
- commit：`git -c user.name=XieChengFang -c user.email=114204364+wila150@users.noreply.github.com commit`（還沒有 GitHub repo）。
