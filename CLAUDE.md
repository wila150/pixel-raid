# 萬劍仙途（pixel-raid）

**11/06 使用者定名「萬劍仙途」**（舊名御劍渡劫）。

使用者自己的網頁手機遊戲（不是客戶案子）。回覆一律用繁體中文、白話，使用者不是工程師。

## 現況（2026-11-06，v1.2）
- 純 HTML/CSS/JS，沒有 build。程式照使用者給的架構拆成 `js/`（index.html 依序載入，共用全域變數，順序不能亂）：
  `core.js` 畫面／工具／像素圖／輸入／共用狀態 → `save.js` 數值與存檔 → `equip.js` 流派／裝備／戰力／裝備畫面 → `audio.js` 合成音效＋背景音樂 → `combat.js` 打王（玩家、靈獸、飛劍、魔王、碰撞）→ `run.js` 御劍跑酷（生成器＋碰撞＋畫面）→ `perks.js` 三選一功法 → `hunt.js` 斬妖試煉＋秘境戰鬥 → `maps.js` 秘境鑰／秘境畫面／通關結算 → `world.js` 仙界大世界 → `render.js` 打王繪圖與光影 → `ui.js` 結算／主畫面／暫停／HUD → `main.js` 狀態機與主迴圈。
- **v1.0 起主玩法是「進入仙界」大世界**（使用者要沙盒世界、自己出招、RO／暗黑／楓之谷那種練等打寶；舊模式收在主畫面「小遊戲」）。`world.js`：150×112 格地圖（固定種子生成：樹／石／熔岩／水／城牆／房子），地區 `ZONES`（青雲城安全區、靈草原 1–6、幽暗森林 6–12、亂石荒原 11–17、焚天火山 16–24），58 個怪物營地（`makeCamps`，怪會巡邏、靠近才追、追太遠回營、死了 22–32 秒重生、8% 精英）。怪物 AI：melee／ranged（樹妖、火鴉射子彈）／bomber（爆石靈靠近引爆）。玩家自己出招 `WSKILL`（J 劍擊、K 劍氣斬 10 真氣、U 掌心雷 22 真氣、空白 閃身、H 丹藥），手機按鈕標籤用 `setPadLabels` 切換。等級／經驗 `expNext`，每級 4 點能力點 `AP`（力量／體魄／身法／悟性，找長老配、可花靈石重配）。NPC：煉器師（裝備畫面）、丹師（回滿＋補丹藥）、秘境使者（秘境畫面）、長老（配點、換流派）；走過去自動打開。傳送陣走近解鎖。火山祭壇 → `startWorldBoss()` 用原本打王場地，打完回仙界。死了扣 10% 經驗回城。存檔 `save.w`（lv/exp/x/y/wp/ap/free/potions），每 5 秒存位置。`inWorld` 決定各畫面「返回」回哪。機器人測試 15 分鐘到 Lv.10。
- **v1.1 架構整理（使用者：首頁不要那麼多分支跟按鈕；參考《我的勇者》類的橫向 HUD，只借版面不抄美術）**：主畫面只剩一顆「開始／繼續冒險」→ 直接進仙界。其他功能都在遊戲畫面上：左上頭像＋等級＋生命真氣、任務欄（`QUESTS` 主線 13 步一路帶到世界王，做完變無限懸賞，`save.w.q/qp/bounty`）、右上 `#hud` 按鈕（背包、角色＝配點、傳送、換武器）、小地圖（任務地點黃框）、最下面經驗條、觸控裝置左下畫搖桿底座。煉器師、長老 NPC 拿掉（功能移到按鈕），剩丹師、秘境使者。跑酷／斬妖試煉／每日渡劫的入口拿掉（程式還在，之後可刪）。
- **沒有職業，武器決定招式**（使用者：穿什麼裝就變什麼職業、自由搭配）：武器欄 `it.wt` = sword／staff／bow（`WEAPONS` 在 equip.js，`WSKILLS` 在 world.js）。劍：劍擊／劍氣斬／掌心雷；法杖：法球／火雨（`W0.fires`）／冰環（減速 `m.slowT`）；弓：連射／散射／穿雲箭。流派選擇取消（`applyBuild` 的 sc = ""），數值全靠裝備詞綴＋配點。一鍵換武器（Q 或按鈕，`quickSwap` 換成背包裡下一種武器最強那把）。主線第 1、2 步送法杖和弓，新角色送一把凡品劍。
- **搜打撤（簡化版）**：野外撿到的裝備標 `risk`（可以馬上穿），死掉全部消失（穿在身上的也會）；回到青雲城、走傳送陣、或野外按傳送用回城符（原地不動 3 秒，被打或移動會中斷）才算帶回（`bankLoot`）。任務和世界王給的裝備直接安全。
- **v1.2**：武器 6 種（`WEAPONS`／`WSKILLS`：劍、法杖、弓、大刀〔重斬／旋風斬 `W0.spinT`／裂地斬〕、拳套〔連拳／衝拳 `p.dashHit`／震地〕、扇〔迴旋風刃 `s.back`／旋風 `W0.tornados`／清風回血〕）。傳說武器 6 把（`UNIQUES` 有 `wt`），U 換成專屬招式（`WUQ`、`uniqueUlt`）。越深掉越多（`ZONE_LOOT`）。獵寶妖（`spawnHunter`）：野外身上有 2 件以上未帶回裝備，每 70–100 秒派一隻追你、不回營、進城就跑掉，打倒掉 3 件好裝。
- **v1.3 登入／註冊**（使用者：不要標題畫面，要登入註冊；選了用使用者自己的 Firebase）：`js/firebase-config.js`（`FIREBASE_CONFIG`，null 時照舊本機存檔＋標題）、`js/auth.js`（帳號名稱轉成 `名稱@pixelraid.game` 給 Firebase Auth 的 email/密碼登入；Firestore `users/{uid}` 存 `save` JSON，`writeSave` 後 10 秒合併上傳、切走 App 時馬上上傳；新帳號會把這台裝置原本的進度帶上去；登入後直接進仙界；暫停選單「登出」會清掉本機快取）。Firebase SDK 用 gstatic CDN compat 10.12.2。Firestore 規則：只有本人能讀寫自己的 users/{uid}。**11/06 已啟用**：Firebase 專案 `pixel-raid`（編號 335631978907），網頁應用程式「御劍渡劫 網頁版」、Email/密碼登入已開、授權網域加了 wila150.github.io、Firestore 在 asia-east1（台灣）、規則已發佈（用 gcloud token 打 REST API 設定的，測過：本人可讀寫、別人和未登入 403）。
- **v1.4 強化＋技能寶石**（使用者選的下一步）：強化 `it.en` 0–10（`EN_RATE` 成功率、`enCost`，每級全部數值 +10%，在 `itemStats` 乘；失敗只扣靈石；名字自動加「+N」）。技能寶石 `GEMS` 9 種（連發、巨力、疾風、省元、寒霜、連鎖、爆裂、穿透、嗜血），存 `save.gems`（`"key:lv"` → 數量），鑲在武器 `it.so`（孔數 `SOCKETS` 依品質 1/2/2/3），效果用 `gemLv(k)` 算、作用在那把武器全部招式（world.js：`applyWeapon` 冷卻/耗真、`wDmg` 傷害、`hitMob` 寒霜/連鎖/嗜血、`killMob` 爆裂、`shoot` 穿透、`doSpin`＋`W0.recastT` 連發）。3 顆同級合成高一級（最高 5）。掉落：精英 25%、一般 1.2%×地區倍率、獵寶妖 2 顆、懸賞 50%；新角色送連發＋巨力各 1。寶石不算搜打撤（撿到就安全），賣掉/死掉弄丟武器時寶石會拆回袋子（`ungem`）。只在仙界大世界有效。
- **v1.5 美術＋特效**（使用者：想要多一點圖片、攻擊特效）：新檔 `js/art.js`（在 world.js 後面載入）。手上武器 `WPN_IMG`（6 種，揮砍時跟著轉，`drawHeldWeapon`）、揮砍月牙 `drawSlash`（`p.swingMax`）、地區樹 `TREE_IMG`／石頭 `ROCK_IMG`／`ROCK_RED`、地面裝飾 `DECO`＋`drawDeco`（花草、蘑菇、骨頭、火星）、城牆磚 `drawWallTile`、房子屋瓦門窗 `drawHouseTile`、背包圖示 `itemIcon`（canvas→dataURL）。特效 `fxs`：`fxHit` 命中星芒、`fxPuff` 死亡煙＋妖魂、`fxBoom` 爆炸＋焦痕、`fxCast` 施法光圈；飛行物拖尾 `drawTrail`、`glow` 光暈、`drawArrow`；火雨變隕石、旋風斬雙刀光、衝擊波。
- **v1.6 怪物出招預警＋換裝外觀**：近戰怪不再碰到就扣血，改成蓄力 `m.wind`／`m.windMax`（一般 0.45 秒、精英 0.38、重型 0.7）→ 撲咬（往前衝、扇形判定，`m.wa` 鎖定方向）或重擊砸地（`heavy`：石甲妖、熔岩獸，圓形範圍）；遠程怪開火前 0.35 秒眼睛發光。預警畫面 `drawTelegraph`（紅色扇形／圓形慢慢填滿＋「!」），閃身可以躲。怪物走路會跳、蓄力會抖和壓扁。角色外觀 `heroImg`：袍子顏色看袍的品質、頭冠看冠的品質、靴子顏色看靴的品質（快取在 `heroCache`）；穿傳說裝腳下有光環、武器 +7 以上會冒光點（`drawHeroAura`）。
- **v1.7 難度與掉寶（使用者：太簡單、頂級裝備太容易噴）**：怪血量 `1.2×(1+0.35×(lv−1))`、精英 ×4；傷害 `mobDmg`＝`dmg×(1+0.22×(lv−1))`、精英 ×1.6；蓄力縮短（一般 0.36、精英 0.3、重型 0.6），出手間隔變短。發現距離 75→100，打一隻整個營地一起追（`packAggro`）。精英詞綴 `ELITE_MODS`：狂暴（快 40%、出手快）、鐵壁（受傷 ×0.55）、召喚（半血叫 3 隻小弟，`noRespawn`）。掉寶：品質機率一般 72/23/4.7/0.3%、精英 48/37/13.5/1.5%（`rollItem`）；野外一般怪掉裝 2.8%×地區倍率、精英 40%，只有精英用好機率（以前火山全部都用）；獵寶妖 3→2 件。升級變慢 `expNext = 36×lv^1.7`。
- **v1.8 看得到其他玩家（連線第一步）**：`js/net.js`（auth.js 後面載入）。Firebase Realtime Database `pixel-raid-default-rtdb`（asia-southeast1，11/06 用 REST 建的，`databaseURL` 在 firebase-config.js），路徑 `presence/{uid}` = {x,y,f 面向,wt 武器,g 裝備外觀 `gearKey()`,lv,n 名字,s 揮砍次數,r 閃身,t 伺服器時間}，`onDisconnect().remove()`。規則：登入者可讀全部 presence、只能寫自己的，其他路徑全擋（測過）。每 0.25 秒送一次（沒變就不送），20 秒心跳；90 秒沒更新視為離線。別人用 `heroImgFor` 畫（平滑移動、傳送直接跳），綠色名字＋Lv；小地圖綠點；小地圖下「● 線上 N 人」。登出呼叫 `netStop`。只看得到、不能互動（還沒有組隊／聊天／一起打怪）。RTDB 免費：同時 100 人、每月下載 10GB。
- **v1.9 世界王改成自己打＋暱稱＋時裝**（使用者：打王不要渡劫飛劍自動打，要自己放招）：`js/wboss.js`（art.js 後面）。祭壇按「挑戰」→ `startWorldBossField()` 在 ALTAR 生出 `W0.mobs` 裡的 `type:"wboss"`（`boss:true`，所以所有招式、寶石都打得到；不吃擊退）。血量 `8000×(1+0.1×(lv−18))`、Lv.22。招式（都有紅色預警 `wbZones`）：砸地（圈前半段跟著你）、火球扇、熔岩雨（隕石）、半血後衝撞（直線）、20% 後螺旋火焰；70%／35% 召喚熔岩小妖。離祭壇太遠或死掉王就消失（`WB_ARENA`）。打倒 `wbKilled`：4 件安全好裝＋2 寶石＋靈石、完成主線、冷卻 90 秒 `W0.wbCool`。舊的 `startWorldBoss`（渡劫場地）還在但沒入口了。頭上血條 `drawWBossBar`。機器人測試（Lv.20、力量 40、凡品劍站著打）約 30 秒打完，站著不躲會被打很痛。
  自己頭上金色名字＋小箭頭（`drawMyName`），別人綠色。角色畫面加「暱稱」（`save.w.nick`，`myName()`，連線送這個）和「時裝」`SKINS` 8 套（蓋掉袍子／頭髮顏色，只是外觀；白雪免費、其他 150～800 靈石，`save.w.skins/skin`），`gearKey()` 第 4 欄是時裝，別人看得到。
- **v2.0 排行榜＋建立角色**：右上 🏆「排行」→ `renderRank()`（net.js），RTDB `lb/{uid}` = {n,lv,cp,g,wt,t}，`lbPush` 每 30 秒（有變才寫）＋打開排行時；等級榜／戰力榜各前 50（`orderByChild` + `.indexOn`），顯示自己第幾名。規則：只能寫自己、n ≤12 字、lv 1–200、cp ≤1e7（測過亂寫 9999 會被擋；但數值是前端算的，真的要防作弊要伺服器）。建立角色 `renderCreate()`（art.js）：`save.w.created` 沒有時，`enterWorld` 先跳這裡：取名（`save.w.nick`）、選 6 種初始武器其中一把凡品、選外觀（素衣／白雪／墨夜／青竹）；舊存檔有進度的自動視為已建立。
- **v2.1 連線不暫停＋外部瀏覽器**（使用者：已經連線了不能暫停）：`liveWorld()`（ui.js）＝有登入連線。連線時暫停鍵變「選單」、開背包／角色／排行（state paused/pick 且 pausedFrom world）時 `main.js` 照樣跑 `updateWorld`，但 `inMenu` 會清掉輸入、不開 NPC，`hurtW` 照扣血（死了關選單）。`renderEquip` 在仙界不再改 state。選單背後畫仙界（render.js 的 title 分支，以前會畫出舊打王場地殘影）。index.html 開頭偵測 App 內建瀏覽器：LINE 加 `openExternalBrowser=1` 自動跳外部；FB／IG／Messenger／Threads／微信／KakaoTalk／TikTok：Android 用 intent 叫 Chrome，iPhone 蓋一層教學（點⋯選在 Safari 開＋複製網址）。
- **快取**：GitHub Pages 讓瀏覽器快取 10 分鐘，index.html 的 js/css 都加 `?v=版本`，**改版時要一起改**（和 ui.js 的「原型 vX」同步）。
- 狀態：title → run →（pick 三選一）→ runEnd →（pick）→ intro → play → win/lose；paused 可從 run/intro/play 進入（Esc、P、右上角按鈕、切走 App 自動暫停）。M 或右上角喇叭切換靜音。
- 本機測試：`python3 -m http.server 8090`。`?run&sim=秒` 快轉跑酷（約 10 秒會碰到第一個機緣）；`?demo&sim=秒&swords=N&pet=fox|crane` 直接打王。
- 截圖：Windows Edge headless（`--headless=new --virtual-time-budget=4000`），rAF 幾乎不跑要用 sim；headless 視窗寬度小於約 500 會被撐寬，手機直放要用 iframe 包一層 390×844 的頁面。
- 題材修仙（11/05 決定）。玩法：前段「御劍跑酷」穿加乘門、飛劍自動打封印石和妖群（打碎／全滅有獎勵）、會動的門、兩個「機緣」三選一功法＋抵達渡劫台再選一次；湊齊兩種功法會出現「進化」卡（天河劍陣、不滅金身、九霄雷域、萬劍歸宗）。跑酷第 9 排有小王「守關妖將」（擋整條路，斬殺給飛劍＋額外機緣，沒打倒撞上去扣剩餘血量一半的劍）。後段打王「焚天石魔」三階段（50% 暴走、20% 元神燃燒＋螺旋火焰），飛劍自動齊射。功法 14 種＋4 進化在 `perks.js`；打王功法效果在 `combat.js`（`thunderStrike`、`checkPhase`）。
- 斬妖試煉（v0.7，使用者看廣告遊戲覺得好玩，只借玩法、不抄畫面）：主畫面第二個按鈕。狀態 hunt → huntEnd/huntFail。整個畫面都能拖曳當搖桿，環身飛劍＋劍氣自動攻擊，妖獸（小妖、狼妖、石甲妖，每 55 秒一隻妖將）越晚越硬，撿妖丹升級、每級三選一（`HUPS` 10 種），撐 180 秒後把等級／斬妖數換成飛劍去打焚天石魔（最後一次功法會排除「跑酷」類，`run.fromHunt`）。機器人測試：5 場有 4 場撐過，約 14 級、150 把飛劍。
- 流派與裝備（v0.8，參考使用者給的《半夜別修仙》截圖／影片＋PoE 打寶，只借玩法）：六大流派 `SCHOOLS`（體反傷、道回血、法爆發、妖減速、氣無視防禦、禪越打越強）三模式都有效，存 `save.school`。裝備 5 部位、4 品質（凡／靈／玄／傳說），隨機詞綴 `AFFIX` 12 種，傳說 5 件有特殊效果 `UNIQUES`；`applyBuild()` 在 `bonus()` 最後把裝備＋流派換成 B 的數值（每日渡劫不吃裝備，只吃流派）。掉落：斬妖妖將必掉、小怪 0.6%，跑酷封印 8%／妖將必掉，渡劫勝利必掉＋靈石。出售換靈石，洗練（重骰詞綴）、點金（升品質）。戰力 `totalCP()` 顯示在主畫面和裝備畫面。存檔欄位 school/eq/bag/stone。
- 秘境（v0.9，使用者要「像 PoE」：刷圖→噴寶→變強→刷更深）：主畫面「秘境」。秘境鑰 `save.keys`（層數＋凡/靈/玄＋詞綴 `MAP_MODS`，詞綴越多掉寶加成越高，可點金／洗練）。`startHunt(key)` 共用斬妖戰鬥：斬妖到門檻（90+15×層）→ 秘境之主（`BEASTS.lord`，放火球圈、畫面外有箭頭）→ 打倒噴寶＋必掉下一層鑰匙 → `showMapDone()`。裝備掉在地上有光柱和名字，要走過去撿（通關後自動收）。死了鑰匙沒了、裝備保留；沒有第 1 層鑰匙時可免費領。裝備名字依詞綴自動取（`nameItem`，前綴＋底材＋・後綴）。機器人測試：從第 1 層一路刷到第 5 層，戰力 1000→4100。
- 使用者想要的大方向（11/06）：PoE／暗黑破壞神／RO 那種打寶 ARPG，之後想要世界 BOSS、沙盒 MMORPG（要伺服器，還沒做）。使用者貼過 AI 寫的架構文件（建議 Godot），決定先繼續用網頁版。
- 局外繼承：境界（練氣→渡劫）、法寶 5 種、靈獸 2 種，存 localStorage `pixelraid_save_v1`。每日渡劫用日期當種子，本機紀錄＋分享按鈕。
- 參考方向（使用者提供）：隨機技能三選一＋局外數值繼承（倖存者類、卡牌 roguelike）。
- 網址：https://wila150.github.io/pixel-raid/ （GitHub Pages，倉庫公開，push 到 master 約 1 分鐘自動更新）。標題畫面版本字在 `ui.js` 的「原型 vX」，改版要一起改。線上排行榜要用使用者自己的 Firebase，要先問。

## 下一步（使用者還在決定）
使用者貼過《我的勇者》《搜打撤》類介紹：PVP、交易所、建造（木材石材蓋牆、箭塔）都要伺服器或很大工程，還沒做；使用者不要每日任務。可做：更多武器種類（大劍、拳、扇）、武器自帶特殊技能、裝備強化、技能寶石＋輔助、經脈天賦盤、屬性計算改成「基礎×(1+加算%)×乘算」、世界 BOSS／多人（要伺服器）、線上排行榜。世界觀與正式名字還沒定。

## 規則
- 角色與美術一律原創，不能用 Pokémon 等既有遊戲的角色、名字、圖。光序的小蛇吉祥物是客戶的，不能拿來用。
- commit：`git -c user.name=XieChengFang -c user.email=114204364+wila150@users.noreply.github.com commit`。GitHub：https://github.com/wila150/pixel-raid （私人，分支 master）；push 要用 Windows GCM（見記憶 wsl-machine-setup-gaps）。

## v2.2 手機畫面
- `manifest.json`（display fullscreen、orientation landscape）＋ `icons/`（icon-192、icon-512、apple-touch-icon；圖示是用 Edge 截圖 canvas 畫的）。
- `js/screen.js`（main.js 前載入）：點畫面自動全螢幕（Android）；橫向／直向設定存 localStorage `pr_orient`（預設橫向），方向不對時蓋 `#rotate` 提示；加入主畫面引導 `#a2hs`（Android 用 beforeinstallprompt，iPhone 顯示教學；關掉 3 天內不再跳，`pr_a2hs_t`）；暫停選單裡 `screenSettingsHtml()`。
- core.js `SAFE {l,r,t,b}`：瀏海安全區，world.js 左上 HUD 與小地圖已避開。
- main.js dt 加 Math.max(0)：換畫面時 last 可能比 rAF 時間晚，dt 變負會讓飄字越長越大。
- 測試直向：headless Edge 視窗最小寬度約 500，要用 iframe 包 390px 寬。

## v2.3 雪域、新手引導、介面
- 地圖加寬到 TW=200（3200 寬）。x≥2400 是「寒霜雪域」Lv.22–30（`SNOW_X`），中間有雪山山脊，只有山口 `SNOW_PASS`(2400,640) 能過；傳送陣 snow (2820,640)。
- 新怪：霜狼、冰靈、雪巨猿，都有 `chill`：打中玩家會凍傷 1.6 秒（`W0.chillT`，移動 ×0.6）。冰靈的冰彈靠 `chillHit` 旗標。
- 主線多 4 個雪域任務；懸賞也會派雪域。雪域會下雪（畫在 drawWorldHud 的螢幕座標）。怪物名字和地區副標加了黑邊。
- `js/tutorial.js`：新角色 `save.w.tut=0` 開始 6 步引導（移動→攻擊→技能→閃身→背包→殺第一隻），該按的按鈕加 `.tut-hi` 閃光。舊存檔沒有 tut 不會跳。
- `js/icons.js`：右上與 HUD 的 emoji 換成像素圖示（`UI_ICON`、`uiIcon(k)`、`setMuteIcon`）。
- HUD 按鈕列移到下面：橫向在技能按鈕左邊，直向在技能按鈕上面。小地圖改在 y=58。
- 分享縮圖 `icons/og.png`（og:image）。

## v2.4 割草手感
- 連斬：`W0.kc`／`W0.kcT`（4 秒 `KC_WIN` 內殺下一隻才接上），`kcBonus()` 每 5 連斬傷害 +2%（最多 +30%），乘在 `wDmg`。右邊小地圖下面顯示；每 25 連斬飄字。
- 傷害數字 `f.num`：往外噴、往下掉（combat.js updateFx）；爆擊大字加描邊，一擊超過半血是紅字。
- 低血量（<30%）螢幕邊緣泛紅；`save.w.autoPot`（預設開，選單可關）低於 30% 自動喝丹藥。
- 大地圖 `bigMap`：Tab／M 或點小地圖開關；小地圖、大地圖都標精英（紅點）、王。仙界裡 M 不再是靜音。
- 快捷鍵：I/B 背包、O 角色、T 傳送、R 排行、Q 換武器（`openHud(h)`）。
- 掉落：仙品以上有衝天光柱、底色標籤；凡品灰字。
- 營地每營 4～7 隻，重生 15～22 秒。

## v2.5 手機註冊修正
- 加入主畫面提示、自動全螢幕、轉方向提示（`body.playing`）都只在進到仙界後才出現，不擋登入／註冊／建立角色。
- 所有 input 可選字（iOS 打字）；`.screen` 可捲動（鍵盤跳出來時按得到按鈕）；矮螢幕登入畫面縮小。
- 測真的登入流程：headless 的 virtual-time 會卡住 Firebase，要用真實時間跑 Edge，頁面用 fetch 把結果送到本機 node 小伺服器（8091）。測完記得刪測試帳號（identitytoolkit batchDelete＋Firestore users＋RTDB lb）。

## v3.0 介面與世界重構（11/07，使用者貼了完整企劃書：英勇之地＋暗黑＋PoE＋我的勇者，只借玩法）
- 新檔 `js/inv.js`（screen.js 後、main.js 前）：雙球 HUD `drawOrbs`（左下紅血球、右下天罰能量球＋外圈藍弧＝真氣；電腦在球左邊畫招式冷卻；手機球畫在透明的普攻按鈕底下）、`drawCamps`／`drawShield`、覆蓋層 `#ov`（`ovOpen/ovClose`，毛玻璃、左中右 3:4:3，點空白處或再按快捷鍵收起，沒有 X）、背包 `renderEquip`（覆蓋 equip.js 舊版：左角色剪影＋星芒裝備位、中瀑布流 `.loot` 卡片〔長按 450ms 直接穿〕、右詞條對比綠↑紅↓）、星盤 `openStarMap`（也取代 `openTeleport`；地形縮圖＋戰爭迷霧 `save.w.fog` 64px 一格字串，`fogTick` 走過就打開；點飛劍符文 → 左邊資訊＋「一鍵御劍傳送」`flyTo`，野外要原地 3 秒 `W0.recallTo`）、選單 `openMenu`（右上 ☰／Esc：行囊、角色、星盤、排行、換武器、音效、自動丹藥、半自動割草 `save.w.autoAtk`、畫面方向、登出）。舊 `#hud` 按鈕列永遠隱藏。
- 安全營地（world.js）：每個傳送點半徑 `CAMP_R`=72，`safeAt()`：怪物被推出去、子彈進不來、`hurtW` 不扣血，走進去就 `bankLoot`；怪物營地不會生在附近。傳送點不再走上去就跳視窗。
- 太極護罩 `W0.shield`：進世界／復活／傳送落地 3 秒，移動或出招就解除。
- 死亡：未帶回裝備掉一半在倒下處（`corpse` 掉落物 10 分鐘、`W0.grave` 魂火標記），另一半還在身上。
- 天罰能量 `W0.en`（`EN_FULL`=100）：殺怪 +6、精英／獵寶妖 +25、王 +100；E（或 U）集滿才能放，放武器大招＋`tianfa()` 劈整個畫面。大招不再花真氣。
- 鍵位：WASD、滑鼠左鍵普攻（按住連打、朝游標，`mouse`／`mouseAim`／`mouseTarget`，core.js 滑鼠不當搖桿）、Q 劍陣、E 天罰、空白 閃身、1 丹藥、F 換武器、I/B 行囊、C/O 角色、M/Tab/T 星盤、R 排行。電腦（pointer:fine）不顯示 #pad。
- 深夜配色：style.css 最後一段（玄武黑、墨玉毛玻璃、暗木色線，按鈕不再是亮色）。暴擊黃字會閃。
- 測試：複製到 scratchpad、firebase-config 改 null、加 test.js 用 `?t=hud|bag|map|menu|death|camp` 跑，Edge headless 截圖。
- v3.0 當時的待辦大多在 v3.1 做完，剩：數值指數成長、手機技能長按拉方向、野外隨機世界王、採集資源。

## v3.1 打寶深度＋RO＋社交（11/07，使用者貼了 PoE／我的勇者／RO／社交／分流企劃）
- **品質白藍紫橘**（`RARITY`：凡白、靈藍、玄紫、傳說橘）。詞綴分前綴 `t:"p"`（攻擊、生命、能量護盾 es、護甲 def、吸血、反震）／後綴 `t:"s"`（移速、攻速 aspd、元素抗性 res、閃避 dodge、法術壓制 supp、爆擊、爆傷、天罰充能、撿取）；`AFF_CAP` 每邊上限（藍 1、紫 3、橘 2），`affTier` 顯示 T1–T3。傳說基礎 ×2、詞條 1–4。名字＝前綴字＋底材＋・後綴字。背包右欄顯示「物品等級」＋前後綴列表（`affHtml`）。
- **會改招式的傳說**（`UNIQUES[*].mods` → `B.uq[mod]`）：`split` 擊中分裂 3 把副劍、`bounce` 彈跳 2 次（怪之間＋撞牆折射，`s.bn`）、`voidQ` Q 變引力黑洞（`W0.voids`）、`orbit` 普攻每 3 下環身飛劍（`W0.orbs`）、`wave` 重斬放刀浪。太古·乾坤化元劍＝split＋bounce＋voidQ；分光劍匣（佩）、連星折光冠、歸墟道袍、御劍步雲靴、斬浪玄鐵劍（大刀）。
- **三防**（`hurtW(dmg, from, kind)`，kind＝phys／spell／ele）：護甲 `armor/(armor+5×dmg)` 最多 75%（擋下有火花）、閃避只擋物理（飄綠字 DODGE）、壓制法術減半（藍字 SUPPRESSED）、元素抗性擋 ele（火鴉、冰靈、熔岩、世界王火焰）。能量護盾 `W0.es` 先扣、脫戰 3 秒以每秒 33% 回充；左下血球外圈淡藍殼。
- **配點**：`AP` 還是 str/agi/wis/vit 四個 key（存檔相容），顯示 STR／AGI／INT／VIT。STR 物理武器 +3%、護甲 +3；AGI 攻速 1.5%、閃避 0.4%、壓制 0.3%；INT 法術武器（法杖、扇，`SPELL_WT`）+3%、ES +6；VIT 生命 +12。背包左欄可直接 ＋／＋5（`apHtml`）。
- **RO 體型**：`WMOBS[*].sz/race/ele`，`SIZE_MOD[武器][S/M/L]`（輕型飛劍 100/75/50、玄鐵重劍 75/100/125、弓／拳 大型 75、法杖扇不吃）。怪名後面顯示（小/中/大）。**魔物卡片** `CARDS`（每種怪一張，只插武器或道袍，一件一張 `it.card`，換卡舊的碎掉）：效果是卡片專用詞綴（對小/中/大型、對大型爆擊、對妖獸/植物/岩石系、對火/水屬性、掉寶率）。一般 0.3%、精英 3%、獵寶妖 20%、世界王 15%。拖曳或點選插卡（`insertCard`）。
- **工藝台（只有安全營地能用，`atCamp()`）**：精煉（強化改名，上限 +12，`EN_RATE` 到 12%）、洗練、點金、精髓注入（`essCraft`：白藍直接變紫、保底那條詞條取兩次較高）。精髓 `save.ess`：精英 20%、一般 0.6%×地區、獵寶妖必掉、世界王 3 個。天罰碎屑 `save.shards`：一般 5% 掉 1、精英 3、獵寶妖 5、王 20；60 換指定部位保底紫、250 換保底傳說（`shardItem`）。
- **掉落過濾器** `save.w.filt`（0 全部、1 藏白、2 藏白藍）：低於設定的直接變靈石（`wDropItem`）。
- 彈幕配色：玩家淺藍／金（法球改淺藍、朱雀火球改金），怪物亮紅／亮紫／粉紅。
- **連線**（`js/social.js`，inv.js 後面載入）：
  - 招式同步：`netCast(k,a,x,y)` 放招時記到 `netCq`（最近 4 筆，隨 presence 送出 `cq`），別人收到用 `ghostCast` 重播（`ghost:true` 的物件只有畫面不打怪）。隊友特效 `save.w.allyFx` full/dim(預設 0.3)/off（`allyA()`）。
  - 分流 `save.w.ch` 1–3（presence 送 `ch`、`z` 地區），`othersList()` 只回傳同分流。**只是畫面分開，資料還是全部下載**；真正的 AOI／自動分流要遊戲伺服器。
  - 社交面板 G（選單「好友聊天」）：左好友卡片（綠點在線、N服·地圖、飛劍按鈕 `flyToFriend` → 飛到好友最近的傳送點，自動切同分流，野外要原地 3 秒）、中聊天（RTDB `chat`，Enter 直接打字、頭上泡泡、左邊聊天流）、右線上玩家（加好友，好友存 `save.w.fr`）。
  - 全服流光廣播：精煉到 +10 以上成功 `netAnnounce` → RTDB `ann`，大家畫面上方水墨字滑過（`#ann`）。
  - **RTDB 規則在 `database.rules.json`（加了 chat、ann）**；用 REST PUT 到 `.settings/rules.json` 發佈。**11/07 已發佈並測過**（臨時帳號：自己能發 chat/ann、不能改別人的、未登入讀不到；測完已刪帳號和訊息）。
- 打字時（INPUT）core/ui/inv/world 的鍵盤處理都會跳過。
- 還沒做：公會仙盟／拳館預約、交易所＋POS 收據、真的遊戲伺服器（AOI、自動分流）。

## v3.2 構築：武器組、輔助寶石、轉職、英雄、多角色（11/07，英勇之地×PoE×楓之谷企劃）
- 新檔 `js/build.js`（social.js 後、main.js 前），會包住 `drawWMob`、`drawWorldHud`、`renderAP`。
- **武器組**：`save.w.ws`（3 格，啟用中那格是 null，真正的武器在 `save.eq.sword`）＋`save.w.wi`。1／2／3 切換 `switchW`（0.25 秒冷卻），F 輪流切；背包裡武器按「放到武器 N」`setWSlot`。下方 DOM 列 `#wbar`（3 把武器＋保命技，手機電腦都能點）。丹藥鍵改成 H（或 4）。死亡／帶回也算武器組裡的未帶回裝備。
- **輔助寶石**（`GEMS` 新增）：`lmp` 多重投射（`multiShots`）、`ice` 冰（減速＋冰凍 `m.frz`，不能動）、`fire` 火（燃燒 `m.burnT/burnD`；打冰凍的怪「融化」×2.5）、`det` 引爆（打燃燒中的怪機率爆炸）。在 `elemHit`（hitMob 裡）、`dotTick`（怪物迴圈，每 0.5 秒跳傷）。孔數看轉職 `sockN()`：3→4（一轉）→5（二轉）→6（三轉），不看品質。
- **轉職** `JOBS`（`save.w.job` 0–4，Lv.10/30/70/120，角色畫面按鈕 `doJob`；11/07 從 6 轉併成 4 轉，舊存檔由 `migJob` 換算、`w.jv=2` 標記）：一轉移速、二轉攻速＋超技能插槽＋傳授寶石（`save.links`）、三轉段數 +1、四轉段數 +1＋傷害 15%＋起源覺醒。二轉以上全服廣播。
- **段數** `curLines()`：hitMob 一下打 L 行數字，總傷害 ×(1+0.3×(L−1))。浪人切武器後下一招 ×2（`W0.lbReady`→`lbT`）、起源期間 8 段。
- **超技能寶石** `SUPERS`（`it.sup`，三轉後生效 `supOn`）：天降隕石、萬劍天降（Q 改招 `superSpin`）、雷霆萬鈞（打中 15% 落雷）。`save.sups`；工藝台 120 碎屑隨機一顆、世界王 25%。
- **起源覺醒**（六轉）：能量滿按 E → `originStart`，2.2 秒時停（怪物、怪物子彈不動），每 0.12 秒劈一隻、最後全畫面爆炸；畫面中央大字 `ORIGIN_N`。六轉後 E 不再放一般天罰。
- **英雄核心** `HEROES`（`save.w.hero`，建立角色時選；舊存檔可在角色畫面免費選一次 `heroSet`）：時空浪人（V 時間回溯 `p.hist`；切武器段數翻倍）、劇毒魔女（V 霧化 4 秒免疫物理 `mistT`；法術武器／元素轉化改成 5 層毒 `m.psn`）、吸血鬼（V 5 秒無敵 `invT`；吸血 3%、斬妖回 1%）。`heroHas(k)` 也看佩的傳授插槽 `it.link`。
- **多角色**（最多 3 個，行囊／靈石／寶石共用）：`save.chars`（啟用中那格 null）＋`save.ci`，每角色自己的 `w` 和 `eq`。角色畫面 `switchChar`／`newChar`（要在安全營地；新角色走 `renderCreate`）。
- **v3.4 右上快捷列**（11/07，使用者：選單東西放出來、設定變小齒輪）：`#quick`（topbar 裡，只在 `body.inworld` 顯示）＝行囊／角色／星盤／聊天／排行／換武器（inv.js `QUICK`）；原本 ☰ 變成線條齒輪，`openMenu()` 只剩設定（音效、防疲勞、掉落、畫面、登出）。≤700px 寬只顯示圖示。
- **v3.5 道具欄式行囊＋裝備格**（11/07，使用者貼了楓之谷式介面截圖當參考，只參考排法、不照抄美術）：行囊中欄 `.bagwin`＝分頁 `BAG_TABS`（全部／武器／防具／飾品／道具，`bagTab`）＋6 欄格子 `bagCells`（品質色框、+精煉、↑ 比身上強、! 未帶回；空格補滿）＋底部靈石列；道具分頁列丹藥、碎屑、精髓、寶石、超技能（`propList`，點了右欄 `propInfo` 說明）。左欄裝備改成 `.eqwin` 4×5 格（`EQ_CELL`，人物半透明在後面；`EQ_LOCK` 耳飾／戒指／護手／坐騎是還沒開放的虛線格）。
- **v3.6 角色資料視窗**（11/07）：`renderAP`（world.js）上半改成 `.charwin` 雙欄表格：左＝名稱／招式／英雄／轉職／等級／生命／真氣／經驗／戰力＋STR/AGI/INT/VIT 列（＋、＋5 按鈕 `.apb`、說明小字）＋能力點＋重新配點；右＝攻擊、爆擊率、爆傷、攻速、移速、護甲、閃避、壓制、抗性、ES、吸血、真氣回復。下面照舊接暱稱、時裝、英雄核心、轉職、角色列表。註：Edge headless 視窗最小 496px 寬，`--window-size=400` 的截圖會被裁掉右邊，不是真的溢出。
- **v3.7 自動更新＋設定靠左**（11/07）：`js/update.js`（main.js 後面）每 60 秒＋切回 App 時 fetch `index.html?t=` 比 `main.js?v=`，不同就顯示 `#updBar`，在安全時機（標題／登入、仙界營地裡、仙界切到背景；打王副本中不換）存檔＋`cloudFlush` 後 `location.replace(?r=新版)`。所以**改版一定要照舊把 index.html 全部 ?v= 一起改**。設定（齒輪）內容全部靠左。
- **v3.8 技能頁**（11/07）：`js/skills.js`（build.js 後面）。技能點不存：總點＝(Lv−1)＋轉職×3，花掉＝`w.sk` 加總，舊存檔自動有點數。`SKT` 16 招心法分 基礎／一轉～四轉（`t`），每招 10 級，沒轉職的分頁鎖住；效果包在 `jobStats` 後面（攻擊、生命、移速、真氣、Q 冷卻／耗氣 `B.skCd`/`B.skMp`（useSkill 和冷卻顯示都乘）、閃身、護甲、壓制、爆擊、爆傷、攻速、天罰能量 `B.enMul`、吸血、抗性、ES、丹藥上限）。重置 30×Lv 靈石。按 N 或右上「技」打開（`openHud("skill")`→`renderSkills`）。招式本身仍跟武器走。
- **v3.9 東方三區（Lv.30–120）**（11/07）：地圖 `TW` 200→300（4800 寬）。`zoneAt`：x≥4000 天外仙域 `sky`（Lv.72–120）、x≥3200 北 `thunder` 雷霆峽谷（48–75）／南 `swamp` 幽冥沼澤（30–50），用 `MID_Y`=896 分。山脊各留山口 `PASS2`(3200,1300)／`PASS3`(3600,896)／`PASS4`(4000,420)，`PASSES` 統一排除營地。新怪 10 種用 `recolor(舊精靈, 色相, 飽和, 亮度)` 換色（`RC` 快取），exp 30–80；每種都有卡片（equip.js `CARDS`）。主線任務接到 Lv.120（找傳送陣、斬妖、精英、升級）。迷霧 `fogLoad` 會把舊 50 欄的存檔一列列搬到新寬度。升級提示加「技能點 +1」、到轉職等級提示；右上角色／技能鈕有紅點（有點數或可轉職）。
- **v4.0 任務視窗**（11/07）：`js/quests.js`（skills.js 後面）`renderQuests()`：分頁＝地區章節 `Q_CH`（每個主線用 `questCh` 推算章節：看 z/id，沒有就跟上一個），沒到的章節鎖住；左邊列表（✓ 完成／▶ 進行中／？？？ 未解鎖），右邊地點、進度、獎勵、做法、「在星盤上看地點」。主線做完顯示懸賞。開法：點左上任務欄（`questRect`）、按 Y、右上「任」。
