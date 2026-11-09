// 萬劍仙途 — 劍靈＋主線劇情＋更新公告（企劃 12 第 2-1、2-4 節、15 第 9 節）
// 一句話世界觀：天道崩壞，萬劍歸墟；你是青雲城最後一批御劍修士，一路往東，追查是誰在「斬仙」。
"use strict";
const GAME_VER = "6.9"; // 改版時跟 index.html 的 ?v= 一起改；更新公告看這個
const UPDATES = [
  { v: "6.9", t: ["輔助寶石改成每一招各自串：普攻、Q、E、身法各有自己的一條，只影響那一招（技能 → 技能鏈，點招式下面的格子）。格子 0 轉 1 格、每轉多 1 格，四轉 5 格", "輔助寶石有標籤限制（例如多重投射只能串飛出去的招、殘影只能串位移招），每顆都有代價：真氣倍率串幾顆就相乘", "新的輔助寶石 19 顆：分裂、彈射、迴旋、追蹤、擴大、餘震、集中、齊射、連打、殘影、護盾、冰徑、觸發（暴擊／受傷，只能串 E）、法壇、斬殺、金鐘、火勢蔓延、元素集中（Lv.30 以後開始掉）", "每把武器多 3 個 E 招（Lv.70／85／100），身法多 3 招全武器通用：縮地、聚妖、護體", "以前鑲在武器上的寶石，已經自動幫你串到普攻那列（放不下的放回背包）"] },
  { v: "6.8", t: ["抗性改版：防禦變成五個數字——物理減免、火焰、冰冷、閃電、混沌抗性（角色 → 屬性第一排，負的紅字、滿 75% 金字）", "怪物和王的元素攻擊真的算元素了：雷谷的怪、九雷鵬王是閃電，沼澤、毒池、蟾王是混沌，雪域是冰冷，火山是火焰", "越深的地方抗性會被扣：雪域、沼澤 −20%、雷谷 −40%、仙域、秘境 11 層以上、天劫王 −60%。沒補抗性會很痛！", "詞綴拆成火抗、冰抗、雷抗、全元素抗性（比較少）、混沌抗性（最少）；戒指、耳飾比較常出抗性", "舊的「元素抗性」自動變成全元素抗性一半；冰靈卡變冰抗 25%、蟾王卡變混沌抗 20%", "避火／避雷／避毒丹改成該抗性 +30%（上限變 80%），新增避寒丹（寒冰髓煉）；舊玩家送避雷丹、避毒丹材料各一份", "換裝時會顯示穿上後抗性變多少", "因為每級自動成長，區域王血量調高（石魔 1.1 萬、蟾王 75 萬…）"] },
  { v: "6.7.1", t: ["新增等級差：怪比你高 5 級以上，每多 1 級你的傷害 −3%、受到的傷害 +3%（最多各 60%）。越級打王會很辛苦，秘境和天劫王不算", "打到比你高很多級的王時，劍靈會提醒你差幾級"] },
  { v: "6.7", t: ["技能改成「技能清單」：每把武器的技能照等級開放（Lv.5 開 E 招，Lv.10／15／20 開新普攻，Lv.30／40／50 開新 Q，身法 Lv.25／45／60），開過的永遠能用，在「技能 → 技能鏈」自由換", "以前三選一選過的招式直接保留，不用等級", "心法點數拿掉了，改成每升一級自動變強（攻擊 +1%、生命 +0.8%、真氣也會長），點過的點數不會浪費", "技能寶石有了需要等級和顏色（紅力量、綠敏捷、藍智力），等級不夠的鑲著不會生效", "技能鏈畫面可以直接把寶石串到武器上"] },
  { v: "6.6", t: ["秘境鑰匙多了 5 種詞綴：元素加持、元素免疫、詛咒怪（死掉留毒池）、雷擊（死掉落雷）、破體加速", "秘境 11–20 層每層 +5 級（到 Lv.125），21 層以上每層 +3 級", "秘境 11–15 層是沼澤／雷谷地形，16 層以上是仙域", "天劫・腐骨蟾王的毒池消失得比較快、同時最多 6 個"] },
  { v: "6.5.1", t: ["修正：大節點也要先點滿前面的技能點才能選；以前選過的會保留，點數補到就生效", "天劫・腐骨蟾王變簡單一點（受到的傷害 ×1.3 → ×1.1）"] },
  { v: "6.5", t: ["每個地區有自己的背景音樂：草原輕快、森林幽靜、火山緊張、雪域和仙域空靈，打王有鼓聲", "設定（齒輪）新增「低階手機模式」：畫面卡的時候會自動問你要不要開", "設定新增字體大小（小／中／大）", "設定新增「色弱預警」：危險範圍外多一圈閃爍的白色虛線", "背景音樂可以跟音效分開關"] },
  { v: "6.4", t: ["技能頁一轉～四轉多了「大節點」：每轉二選一（狂心／劍意、孤注／磐石、無心／會心、天道／殺意），在城裡或營地結界可以免費換", "沼澤、雷谷、仙域和秘境 Lv.50 以上的精英多了 5 種詞綴：毒池、雷擊、護主、瞬影、不死，還有 30% 會有兩個詞綴", "打倒過的區域王可以用「天劫印」召喚天劫版：Lv.130、多 1–3 個王詞綴、傳說機率 ×3；天劫印在秘境第 8 層以上的秘境之主身上掉"] },
  { v: "6.3", t: ["新增「冒險手冊」（右上「冊」或 K）：妖物圖鑑、傳說圖鑑，收集會給永久加成", "每種妖物斬 100、1000 隻、拿到卡片各點亮一顆星：對那種妖物傷害 +1%，全書每 10 顆星生命 +1%", "收集過的傳說每件攻擊 +0.3%", "稱號：達成條件就解鎖，戴上會顯示在名字上面，別人看得到", "閉關：在城裡或營地按閉關，或直接下線，回來給經驗（最多算 8 小時，約等於玩 30 分鐘）"] },
  { v: "6.2", t: ["新增坐騎：打倒區域王首殺各送一隻（熔岩獸、毒蟾、雷鵬、劍雲），沒戰鬥時移動 +60%，角色→外觀換", "新部位：三轉開戒指、四轉開耳飾，只有詞綴、沒有主屬性", "時之沙漏改成戒指、血玉佩改成耳飾（已經有的不變）", "傳說武器：說明寫清楚要集滿天罰能量；四轉後起源覺醒變成專屬版本（例如「起源・朱雀環」）"] },
  { v: "6.1.2", t: ["心法要先學前面的才能學後面的：一轉前要先點 5 點、二轉 15、三轉 30、四轉 50（前面幾階加起來）", "已經跳著點的不會被扣，但送你一次免費重置技能", "手機新手教學改成「用左下搖桿走走看」"] },
  { v: "6.1.1", t: ["排行榜多了「秘境層數榜」：比比看誰的秘境爬得最深", "新手教學提示（直向）移到角色下方，不再跟地名疊在一起"] },
  { v: "6.1", t: ["打倒無相劍尊後開啟「秘境輿圖」：一點一點往外推，鎮妖塔會加成周圍的秘境", "秘境 11 層以上沒有上限", "輿圖天賦：點你喜歡的秘境事件；天劫雷印可以拿來渡劫鑰匙", "每張秘境改成 2 個事件、地圖更大；Lv.120 以後有巔峰點", "點金符、稀有素材掉落調少一點"] },
  { v: "6.0", t: ["劍靈登場：一把會說話的小劍跟著你，提示和劇情都由它說", "主線有故事了：一路往東追查「斬仙之人」", "任務視窗多了每一章的故事", "右上齒輪可以再看一次更新內容"] },
  { v: "5.9", t: ["秘境每張多一個隨機事件：天裂之隙、祭劍台、封妖石、寶藏妖、劍冢", "精髓可以放在鑰匙上，指定這張必出的事件", "通貨、稀有素材掉落調少一點"] },
  { v: "5.8", t: ["新增 7 種通貨（點金符、混元石…）拿來改裝備詞綴", "打怪會掉素材，可以鍛造王裝、部位鍛造、煉丹", "裝備有建議等級：等級不夠只能發揮部分威力"] },
  { v: "5.7", t: ["任務可以「前往」自動尋路", "頭像旁邊有狀態圖示，打王顯示 DPS", "下方多了丹藥、回城符快捷格；直向背包分頁"] },
  { v: "5.6", t: ["秘境改版：用自己的角色進入獨立地圖，清怪→王門→秘境之主，3 條命"] },
];
// 每個主線任務開始時，劍靈說的話（照 QUESTS 的位置；QUESTS 只能往後加）
const QUEST_STORY = {
  0: "我是你的劍靈。天道崩壞，萬劍歸墟——城外妖獸突然變多了，長老要你先去看看。",
  1: "傳送陣能讓你御劍回來。找到它，以後就不用一路走。",
  3: "那些精英身上有黑色的劍氣⋯⋯不像是妖獸自己長出來的。",
  4: "幽暗森林的樹妖身上全是劍痕。有人在這裡用邪劍。",
  7: "亂石荒原的爆石靈⋯⋯是被封進石頭裡的修士殘魂。誰會做這種事？",
  10: "焚天石魔被人喚醒了。邪劍的氣息就在火山北邊。",
  12: "石魔被邪劍控制著。打倒它，看看是誰在背後。",
  13: "石魔倒下時說了一個名字：「劍尊」。我們往東追。",
  14: "封印雪山的古陣被劈開了，裂口是一道劍痕。",
  17: "沼澤的屍氣，來自被斬落的仙人屍骨。斬仙之人就在東邊。",
  21: "雷霆峽谷的天劫是被人引來的，雷鷹都發狂了。",
  26: "天外仙域⋯⋯無相劍尊就是「斬仙之人」。他想斬盡天下仙人，讓萬劍只歸他一人。",
  30: "你已經能和劍尊一戰了。雲台之上，結束這一切吧。",
};
const CH_STORY = {
  grass: "城外妖獸突然變多，長老派你出城查看。妖獸身上帶著不屬於牠們的黑色劍氣。",
  forest: "樹妖身上刻滿黑色劍痕——有人在森林裡用邪劍試刀。",
  waste: "爆石靈其實是被封進石頭的修士殘魂，是誰把他們封起來的？",
  volcano: "焚天石魔被邪劍喚醒。打倒它，就能知道邪劍從哪裡來。",
  snow: "封印雪山的古陣被一劍劈開，寒氣湧進了人間。",
  swamp: "沼澤的屍氣來自被斬落的仙人屍骨。斬仙之人越來越近了。",
  thunder: "天劫被人刻意引來，雷霆峽谷的妖獸全都發狂。",
  sky: "無相劍尊就是斬仙之人：他想斬盡天下仙人，讓萬劍只歸他一人。打倒他，主線就結束了。",
};
const BOSS_STORY = {
  volcano: ["焚天石魔倒下了，身上的邪劍碎片寫著「劍尊」。"],
  swamp: ["腐骨蟾王吞了太多仙人屍骨⋯⋯牠只是被利用的。"],
  thunder: ["九雷鵬王恢復清醒飛走了。引天劫的人，在更東邊的雲台。"],
  sky: ["劍尊倒下了⋯⋯他最後說：「天道早就壞了，我只是先動手。」", "天道在他倒下的地方裂開了——裂隙深處還有他沒斬完的東西。", "秘境會越來越深。主線到這裡結束，接下來我陪你一路往下走。"],
};
function say(t, c = "#cff4ff") { if (typeof notice === "function") notice(t, c); }
// 任務推進 → 劍靈說故事
const _checkQuestS = checkQuest;
checkQuest = function () {
  const w = save.w, q0 = w ? w.q || 0 : 0;
  _checkQuestS.apply(this, arguments);
  if (w && (w.q || 0) !== q0 && QUEST_STORY[w.q]) setTimeout(() => say(QUEST_STORY[w.q]), 1500);
};
// 首殺區域王 → 劇情
const _wbKilledS = wbKilled;
wbKilled = function (m) {
  const k = m.rb || "volcano", first = !m.R && !((save.w.rbK || {})[k]);
  _wbKilledS.apply(this, arguments);
  if (first && BOSS_STORY[k]) BOSS_STORY[k].forEach((t, i) => setTimeout(() => say(t, "#ffe9a8"), 1800 + i * 300));
};
// 新角色第一次進世界、舊存檔第一次看到劍靈
setInterval(() => {
  const w = save.w; if (!w || !w.created || !inWorld || state !== "world" || !W0) return;
  if (!w.spirit) { w.spirit = 1; writeSave(); say((w.q || 0) === 0 ? QUEST_STORY[0] : "我是你的劍靈。從今天起，提示和故事都由我告訴你。"); }
}, 1500);

// ───────── 劍靈：跟在角色肩膀旁邊的小劍，提示用它的對話泡泡說 ─────────
const SPIRIT = { x: 0, y: 0, init: false };
function spiritScreen() {
  const z = SCALE * 1.35, px = W / 2 + (W0.x - cam.x) * z, py = H / 2 + (W0.y - cam.y) * z;
  const tx = px + (W0.flip ? 22 : -22), ty = py - 34 + Math.sin(time * 2.4) * 4;
  if (!SPIRIT.init) { SPIRIT.x = tx; SPIRIT.y = ty; SPIRIT.init = true; }
  SPIRIT.x += (tx - SPIRIT.x) * 0.12; SPIRIT.y += (ty - SPIRIT.y) * 0.12;
  return SPIRIT;
}
function drawSpirit(s) {
  const x = s.x, y = s.y, t = time;
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 1, x, y, 16); g.addColorStop(0, "rgba(170,235,255,0.55)"); g.addColorStop(1, "rgba(170,235,255,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill();
  ctx.translate(x, y); ctx.rotate(Math.sin(t * 1.7) * 0.18);
  ctx.fillStyle = "#e8fbff"; ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(2.6, -4); ctx.lineTo(2.6, 4); ctx.lineTo(-2.6, 4); ctx.lineTo(-2.6, -4); ctx.closePath(); ctx.fill(); // 劍身
  ctx.fillStyle = "#7ad0ff"; ctx.fillRect(-6, 4, 12, 2.5); // 護手
  ctx.fillStyle = "#c89a5a"; ctx.fillRect(-1.3, 6.5, 2.6, 5); // 劍柄
  ctx.fillStyle = "#1a2a3a"; ctx.fillRect(-1.6, -3, 1.1, 1.6); ctx.fillRect(0.6, -3, 1.1, 1.6); // 眼睛
  ctx.restore();
  if (Math.random() < 0.3) { ctx.fillStyle = "rgba(200,245,255,0.7)"; ctx.fillRect(x + rand(-5, 5), y + 10 + rand(0, 6), 1.5, 1.5); }
}
function wrapText(t, maxW) {
  const lines = []; let cur = "";
  for (const ch of t) { if (ctx.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch; } else cur += ch; }
  if (cur) lines.push(cur); return lines.slice(0, 3);
}
// 取代 hud2.js 的 drawNotice：提示從畫面中間的橫條改成劍靈的對話泡泡
drawNotice = function () {
  if (!W0 || state !== "world") { noticeRect = null; return; }
  const s = spiritScreen();
  drawSpirit(s);
  if (!noticeCur && noticeQ.length) { noticeCur = noticeQ.shift(); noticeCur.t0 = time; sfx("click"); }
  if (!noticeCur) { noticeRect = null; return; }
  const n = noticeCur, dur = Math.min(6, 2.6 + n.t.length * 0.06), age = time - n.t0;
  if (age > dur) { noticeCur = null; return; }
  ctx.font = "bold 12px 'Noto Sans TC', sans-serif";
  const maxW = Math.min(W - 40, 280), lines = wrapText(n.t, maxW - 20), bw = Math.min(maxW, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 22), bh = 10 + lines.length * 16 + (noticeQ.length ? 12 : 0);
  let bx = clamp(s.x - bw / 2, 10 + SAFE.l, W - bw - 10 - SAFE.r), by = s.y - 22 - bh;
  if (by < 62 + SAFE.t) by = s.y + 22;
  const a = Math.min(1, age * 6, (dur - age) * 4);
  ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(10,18,26,0.9)"; ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = "rgba(160,225,255,0.6)"; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  const tipY = by < s.y ? by + bh : by; ctx.fillStyle = "rgba(10,18,26,0.9)"; ctx.beginPath(); ctx.moveTo(clamp(s.x, bx + 8, bx + bw - 8) - 5, tipY); ctx.lineTo(clamp(s.x, bx + 8, bx + bw - 8) + 5, tipY); ctx.lineTo(s.x, tipY + (by < s.y ? 7 : -7)); ctx.fill();
  ctx.fillStyle = n.c; ctx.fillRect(bx, by + bh - 2, bw * (1 - age / dur), 2);
  ctx.textAlign = "left"; ctx.fillStyle = n.c; lines.forEach((l, i) => ctx.fillText(l, bx + 11, by + 19 + i * 16));
  if (noticeQ.length) { ctx.font = "9px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#8fb0c0"; ctx.fillText(`還有 ${noticeQ.length} 句・點一下`, bx + 11, by + bh - 6); }
  ctx.globalAlpha = 1; noticeRect = { x: bx, y: by, w: bw, h: bh };
};

// ───────── 更新公告卡 ─────────
function showUpdates(all) {
  const old = document.getElementById("updCard"); if (old) old.remove();
  const list = all ? UPDATES : UPDATES.filter((u) => !save.lastVer || verGt(u.v, save.lastVer)).slice(0, 3);
  if (!list.length) return;
  const el = document.createElement("div"); el.id = "updCard";
  el.innerHTML = `<div class="ubox"><div class="uhead"><span class="uspirit">🗡</span><b>劍靈：這次更新了這些</b></div>${list.map((u) => `<div class="uver">v${u.v}</div><ul>${u.t.map((x) => `<li>${x}</li>`).join("")}</ul>`).join("")}<button id="updOk" class="gold">知道了</button></div>`;
  document.body.appendChild(el);
  el.querySelector("#updOk").onclick = () => { sfx("click"); el.remove(); save.lastVer = GAME_VER; writeSave(); };
}
const verGt = (a, b) => { const x = a.split(".").map(Number), y = String(b).split(".").map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };
setInterval(() => {
  if (!save.w || !save.w.created || !inWorld || state !== "world" || document.getElementById("updCard")) return;
  if (!save.lastVer) { save.lastVer = GAME_VER; writeSave(); return; } // 新玩家不用看更新
  if (verGt(GAME_VER, save.lastVer)) showUpdates(false);
}, 2000);
const _openMenuS = openMenu;
openMenu = function () {
  _openMenuS.apply(this, arguments);
  const row = ov.querySelector(".acts.row"); if (!row) return;
  const b = document.createElement("button"); b.textContent = "更新內容"; b.onclick = () => { sfx("click"); showUpdates(true); };
  row.prepend(b);
};
// 任務視窗：每章的故事
const _renderQuestsS = renderQuests;
renderQuests = function () {
  _renderQuestsS.apply(this, arguments);
  if (ovKind !== "quest" || !CH_STORY[qTab]) return;
  const r = ov.querySelector(".qcols"); if (!r) return;
  const p = document.createElement("p"); p.className = "qstory"; p.textContent = `「${CH_STORY[qTab]}」`;
  r.parentNode.insertBefore(p, r);
};
