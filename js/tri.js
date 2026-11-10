// 萬劍仙途 — 技能清單＋技能鏈（企劃 21 §8，總表第 12 項；取代 04 的改招三選一）
// 每把武器的技能照等級開，開過永遠能用；普攻／Q／E／身法 各一格自由選（第一版：每格從同一類裡選）
// 存檔：save.w.tri = { sword: { a: "dance", q: "boom" }, bow: {...}, r: "surge" }；沒選＝原本的招式
// save.w.triOwn：舊存檔三選一選過的（直接當已開，不看等級）；save.w.triSeen：看過技能鏈時的等級（紅點用）
"use strict";
const TRI = {
  sword: {
    a: [
      { k: "dance", n: "劍舞", d: "每按一次原地急速 3 段連斬，範圍周圍 240°，三段傷害平分（近身割草）" },
      { k: "ray", n: "劍芒", d: "每下都多射一道短劍氣（距離 80、傷害 52%），本體 70%，不用貼臉" },
      { k: "break", n: "破軍", d: "攻速變慢；每第 3 下重劈一道金色巨劍（前方長條，最前面那隻全傷害、後面 20%，精英／王 +30%），打中必定打斷精英／王的出招蓄力（破霸體）；平常 2 下是普通斬" },
    ],
    q: [
      { k: "wan", n: "萬劍", d: "5 道穿透劍氣、扇形更寬，每道傷害 60%（清怪）" },
      { k: "boom", n: "回旋劍", d: "射出 1 把旋轉的大飛劍，飛到終點自動飛回手上，去回各打一次（雙段，打一排）" },
      { k: "rush", n: "御劍突", d: "往前衝 60，路上的怪都斬到，衝刺中無敵；冷卻 +0.3 秒（位移、躲招）" },
    ],
  },
  bow: {
    a: [
      { k: "tri3", n: "三連珠", d: "每次攻擊同時射出平行（微扇形）的 3 支箭，每支 53%（貼近時 3 支都打得到同一隻）" },
      { k: "home", n: "追蹤箭", d: "箭帶綠色微光，射出後自動轉彎鎖定附近的怪（免瞄準，傷害和原本一樣）" },
      { k: "snipe", n: "狙擊", d: "攻速變慢（×0.5），重箭帶破空特效，百分之百穿透一整列的怪；傷害 ×2.3、距離 +50%、爆擊 +10%（打王、打成排）" },
    ],
    q: [
      { k: "rain", n: "箭雨", d: "朝指定小區域射出一束短暫箭雨落下（8 支），風箏和堆連擊用（定點範圍）" },
      { k: "refr", n: "折光", d: "5 支箭，打中怪或撞牆時朝隨機角度反彈折射（每支 2 次），在狹窄的地方很強（清怪）" },
      { k: "swal", n: "燕返", d: "射出迴力鏢狀的弧形氣刃箭，飛出去繞一圈回到你身上，沿途切割怪群（去、回各切最多 3 隻）" },
    ],
  },
  staff: { // 企劃 08-B
    a: [
      { k: "split", n: "分光", d: "一顆法球，打中第一隻後分裂成 3 顆小法球往後方怪群飛（每顆 35%）" },
      { k: "frost", n: "寒星", d: "射速變慢、傷害 ×1.8，打中讓怪緩速 1 秒（單體、打王）" },
      { k: "burst", n: "爆裂", d: "法球帶火、飛更遠，打中時十字形火焰爆炸（範圍傷害、擊退）" },
    ],
    q: [
      { k: "shower", n: "流星群", d: "目標周圍隨機落下 6 顆小火球（清怪）" },
      { k: "doom", n: "天隕", d: "蓄力 1 秒後一顆半螢幕大的隕石砸下，強烈震動，砸到的怪全部點燃；冷卻 +0.6 秒（範圍、打王）" },
      { k: "wall", n: "火牆", d: "面前橫著一道火牆 2 秒，怪走過去會燒、變慢（擋追兵、放風箏）" },
    ],
  },
  blade: {
    a: [
      { k: "sweep", n: "橫掃", d: "普攻變成 180° 大範圍橫掃（範圍 +20%），一刀揮開身前半圈的怪" },
      { k: "quake", n: "崩山", d: "出刀變慢、傷害 ×2，每一刀重劈落地都往前激盪出一道碎裂的地裂波（40%）（單體、打王）" },
      { k: "crack", n: "破甲", d: "大刀附帶血色流光，傷害 70%；打中的怪 4 秒物理防禦 −40%（受到的物理傷害 +40%，王 +20%，頭上有裂甲標記）" },
    ],
    q: [
      { k: "gale", n: "颶風", d: "旋風斬轉 1.5 秒時產生小型風眼，一邊轉一邊把身邊小怪往刀口拉；移動不變慢，每下傷害較低（邊走邊割草）" },
      { k: "whirl", n: "大迴旋", d: "持續旋轉 1.2 秒，犧牲移動速度（×0.4），旋轉半徑 2 倍，揮出巨大的紅色風暴圈（割草）" },
      { k: "leap", n: "斷空", d: "旋轉 0.9 秒，邊轉邊往四面八方彈射微型真空風刃：一道自動切 200 內較遠的怪、一道隨機方向（不再跳）" },
    ],
  },
  fist: {
    a: [
      { k: "lean", n: "鐵山靠", d: "出拳速度一半，但每拳打一小圈範圍（清怪）" },
      { k: "inch", n: "寸勁", d: "每第 5 拳 ×3、擊退強（單體、打王）" },
      { k: "qi", n: "氣功波", d: "每拳射一顆短氣彈（距離 55、傷害 85%），不用貼臉" },
      { k: "sanshou", n: "散手", d: "直拳、勾拳、掃腿（緩速）、側踹（擊退）4 段循環；會累積「勢」，滿 5 層下一個 Q／E 變終結技（拳腳摔混著打）" },
    ],
    q: [
      { k: "chain", n: "連環衝", d: "衝完 1 秒內再按 Q 可以再衝一次，不扣真氣（清怪、連續位移）" },
      { k: "tiger", n: "虎撲", d: "自動衝到最近的怪身上，傷害較高（單體）" },
      { k: "roar", n: "震天", d: "不衝；前方大範圍擊退＋暈 0.5 秒＋緩速 2 秒（控場、保命）" },
      { k: "throw", n: "摔投", d: "抓前面的小怪往身後摔（落地範圍傷害、暈 0.8 秒）；精英改過肩頂、王改鞭腿（王受傷 +10% 2 秒）" },
    ],
  },
  fan: {
    a: [
      { k: "twin", n: "雙刃", d: "一次飛出兩道風刃，每道 55%，都會回來（清怪）" },
      { k: "gust", n: "疾風", d: "不回來，直線飛得又快又遠，傷害 ×2.3（單體、打王）" },
      { k: "spring", n: "回春", d: "風刃飛回來碰到自己時，按打中的怪數回血（每隻 0.5% 生命，一次最多 3%）" },
    ],
    q: [
      { k: "suck", n: "聚風", d: "旋風吸怪力量 ×2、範圍變大，飛到終點停住再吸 3 秒（清怪、聚怪）" },
      { k: "storm", n: "風雷", d: "指定區域持續 5 秒不斷落下小劍雨（範圍、持續）" },
      { k: "ward", n: "風陣", d: "旋風不往前飄，繞著自己轉 3 秒，靠近的敵方子彈會被吹散（打王保命）" },
    ],
  },
  r: [
    { k: "ghost", n: "殘影", d: "閃身經過的路上留下劍光，碰到的怪受傷；起點留一個殘影 1.5 秒，附近追你的小怪改去打殘影" },
    { k: "surge", n: "乘勢", d: "閃身後 1.5 秒內，下一招（普攻或 Q）整招必定爆擊" },
    { k: "wave", n: "凌波", d: "閃身可以存 2 次（連閃兩下），每次閃身回 5 真氣" },
    { k: "blink", n: "縮地", d: "瞬間移到前面一段（無敵時間比閃身短）；冷卻 ×1.3（全部武器通用）" },
    { k: "pull", n: "聚妖", d: "閃出去，路線兩側的怪被拉到路上、變慢 1.5 秒；冷卻 ×1.8（全部武器通用）" },
    { k: "guard", n: "護體", d: "閃出去＋2 秒護盾，擋下 15% 生命的傷害；冷卻 ×2.5（全部武器通用）" },
  ],
};
// 企劃 21 第二版：每把武器再 3 招（E 格，Lv.70／85／100）；企劃 35：中期再 3 招（Lv.20／35／55，排在前面）
const TRI_E = {
  sword: [{ k: "array", n: "劍陣", d: "在目標一帶插下一圈靈劍 5 秒，每 0.3 秒切陣裡的怪（最多 6 隻）；你走開陣還在（持續、範圍）" }, { k: "cold", n: "一劍光寒", d: "畫面瞬間轉黑白 0.3 秒 → 全螢幕冰霜劍氣打中所有怪，30% 凍結 1.5 秒（王 0.3 秒）（範圍爆發）" }, { k: "domain", n: "劍域", d: "跟著你走的劍氣場 5 秒：每 0.2 秒切身邊的怪，裡面的怪受傷 +20%，你攻速 +12%（近戰、輔助）" }, { k: "storm", n: "劍雨", d: "朝天指劍，目標區域源源不絕落下密集小劍雨，持續 5 秒（範圍、持續）" }, { k: "nova", n: "萬劍歸心", d: "把 160 內的小怪拉到身邊（精英拉一半、王不拉），接著 16 道劍氣從外面收回來穿過怪群（投射、範圍）" }, { k: "judg", n: "天劍", d: "0.6 秒後一把巨劍砸在目標，傷害極高（範圍、打王）" }],
  staff: [{ k: "freeze", n: "冰封", d: "前方扇形冰霜，打中的怪受傷害並冰凍 1.5 秒、之後緩速（王只凍 0.5 秒）（範圍、控場）" }, { k: "tstorm", n: "雷暴", d: "原地爆發巨大電磁球炸裂（一次大範圍），打中必定感電（受傷 +20% 4 秒）" }, { k: "hole", n: "黑洞", d: "目標點產生黑洞 2 秒，把全螢幕的怪持續吸到中心（王不吸），最後爆炸（聚怪）" }, { k: "blizz", n: "暴風雪", d: "目標一帶 1.5 秒內落下 10 團冰，打中變慢（範圍）" }, { k: "chainl", n: "雷鏈", d: "超強電弧，在全螢幕怪堆間連鎖彈跳 12 次，每跳傷害 −15%（投射、清怪）" }, { k: "inferno", n: "焚天", d: "火浪從你往四面八方擴散到全螢幕，經過的怪全部點燃，身邊留下燃燒的火圈 3 秒（範圍、持續）" }],
  bow: [{ k: "blast", n: "爆裂箭", d: "射出一支爆裂箭，打中目標或飛到終點時引爆大範圍火藥爆炸（投射、範圍）" }, { k: "turret", n: "弩台", d: "在地上放一座自動機弩塔 6 秒，自動朝附近的怪傾瀉箭矢，並吸引仇恨：附近追你的小怪改去打弩台（精英、王不吃）（召喚）" }, { k: "pierce9", n: "九天穿雲", d: "0.5 秒蓄力後一道貫穿全畫面的光箭（投射、打王）" }, { k: "barr", n: "千鈞箭陣", d: "目標一帶落下一片箭，留下 4 秒拒馬陣：裡面的怪變慢、每 0.5 秒受傷（範圍、持續）" }, { k: "seekr", n: "天狼追魂", d: "射出 8 支化成幽靈天狼的追蹤箭，自己找怪撕咬（投射、不用瞄）" }, { k: "star", n: "墜星箭", d: "朝天空射出一箭引導星辰，天色變暗，1.5 秒後無數藍色流星雨砸滿全螢幕（220 內的怪都砸得到）（範圍）" }],
  blade: [{ k: "fury", n: "怒斬", d: "往前一刀大扇形，打中的怪擊飛（近戰、範圍）" }, { k: "blades", n: "刀陣", d: "6 把大刀的血色殘影繞身急速旋轉 5 秒，形成跟著你走的刀刃風暴圈，碰到的怪每 0.25 秒一下（近戰、持續）" }, { k: "titan", n: "霸體", d: "5 秒受傷 −30%、傷害 +20%，不吃減速（凍傷、電圈、毒池）、不會被蟾王舌縛拉走（輔助）" }, { k: "cyclone", n: "天刀旋", d: "跳起 0.5 秒（無敵、往前 60），落地刀光巨輪砸地：大範圍重擊＋外圈衝擊波擊退（位移、範圍）" }, { k: "rift", n: "斷界", d: "往前一路 8 段炸開（範圍）" }, { k: "exec", n: "斬魂", d: "大範圍一刀；剩 30% 血以下的一般怪直接斬殺，精英、王傷害 ×2（近戰、打王）" }],
  fist: [{ k: "palm", n: "金剛掌", d: "前方巨大掌印衝擊波，把怪震退（範圍）" }, { k: "thous", n: "千手", d: "前方 1.5 秒落下 15 個小掌印（範圍、持續）" }, { k: "dragf", n: "化龍", d: "5 秒攻速 +40%、每拳多一道龍氣（輔助）" }, { k: "hund", n: "百裂拳", d: "1 秒內對前面打 12 拳（近戰）" }, { k: "dragon", n: "升龍", d: "衝到怪身上，落地大範圍（位移、範圍）" }, { k: "gong", n: "氣功炮", d: "一顆大氣彈穿透一整排（投射）" }],
  fan: [{ k: "healz", n: "迴風陣", d: "腳下 4 秒小陣，站在裡面每秒回 3% 生命（輔助）" }, { k: "petal", n: "花舞", d: "前方錐形花瓣 2 秒持續打（持續）" }, { k: "wwall", n: "天風壁", d: "面前一道風牆 4 秒，擋住所有敵方子彈，碰到的小怪被推開（防禦）" }, { k: "typh", n: "颱風", d: "腳下一個大颶風 3 秒，把 120 內的小怪吸過來（精英一半、王不吸），每 0.3 秒切一次（範圍、持續）" }, { k: "bloom", n: "花雨", d: "回 15% 血，12 道風刃往四周飛再飛回來（投射）" }, { k: "zephyr", n: "清風結界", d: "旋風繞著自己轉 5 秒（持續）" }],
};
for (const wt in TRI_E) TRI[wt].e = TRI_E[wt];
// 開放等級（第 i 張卡）；E＝Lv.5
const TRI_LV = { a: [10, 15, 20], q: [30, 40, 50], e: [20, 35, 55, 70, 85, 100], r: [25, 45, 60, 15, 35, 50] };
const TRI_LV_X = { fist: { a: [25], q: [45] } }; // 企劃 55：拳套第 4 個選項（散手、摔投）；其他武器不動
const triLvAt = (wt, l, i) => { const L = TRI_LV[l]; if (i < L.length) return L[i]; const x = TRI_LV_X[wt] && TRI_LV_X[wt][l]; return (x && x[i - L.length]) || 999; };
const E_LV = 5;
const TRI_LAYER_N = { a: "普攻", q: "Q 招", e: "E 招", r: "身法" };
const triList = (wt, l) => (l === "r" ? TRI.r : TRI[wt] && TRI[wt][l]) || null;
const wLv = () => (save.w && save.w.lv) || 1;
function triMig() { // 舊存檔：三選一選過的直接當已開
  const w = save.w; if (!w || w.triV) return;
  w.triOwn = w.triOwn || [];
  for (const wt in w.tri || {}) {
    if (wt === "r") { if (w.tri.r) w.triOwn.push("r:" + w.tri.r); continue; }
    for (const l in w.tri[wt]) if (w.tri[wt][l]) w.triOwn.push(`${wt}:${l}:${w.tri[wt][l]}`);
  }
  w.triV = 1;
}
const triOwnKey = (wt, l, k) => (l === "r" ? "r:" + k : `${wt}:${l}:${k}`);
function triNeed(wt, l, k) { const L = triList(wt, l); const i = L ? L.findIndex((o) => o.k === k) : -1; return i < 0 ? 999 : triLvAt(wt, l, i); }
function triOpen(wt, l, k) {
  if (!save.w) return false; triMig();
  return wLv() >= triNeed(wt, l, k) || (save.w.triOwn || []).includes(triOwnKey(wt, l, k));
}
function triOf(wt, l) {
  const w = save.w; if (!w || !w.tri) return null;
  const v = l === "r" ? w.tri.r : w.tri[wt] && w.tri[wt][l];
  const L = triList(wt, l);
  return v && L && L.some((o) => o.k === v) && triOpen(wt, l, v) ? v : null;
}
const triName = (wt, l) => { const v = triOf(wt, l), L = triList(wt, l); return v ? L.find((o) => o.k === v).n : null; };
// 上次看技能鏈之後新開的技能（目前武器＋身法）
function triNew() {
  const w = save.w; if (!w) return [];
  const seen = w.triSeen || 1, lv = wLv(), wt = curWeapon(), out = [];
  for (const l of ["a", "q", "e", "r"]) { const L = triList(wt, l); if (L) L.forEach((o, i) => { if (triLvAt(wt, l, i) > seen && triLvAt(wt, l, i) <= lv) out.push(o.n); }); }
  if (E_LV > seen && E_LV <= lv) out.push(WSKILLS[wt].ult[0]);
  return out;
}
const triPending = () => triNew(); // 舊名字（紅點）
function triSet(wt, l, k) {
  const w = save.w; if (!w.tri) w.tri = {};
  if (l === "r") { if (k) w.tri.r = k; else delete w.tri.r; }
  else { if (!w.tri[wt]) w.tri[wt] = {}; if (k) w.tri[wt][l] = k; else delete w.tri[wt][l]; }
  writeSave(); applyWeapon(); setPadLabels(true);
}
// 換招：營地隨時；野外脫戰 3 秒；打區域王時不行
function triSwapWhy() {
  if (typeof W0 === "undefined" || !W0) return null;
  if (typeof atCamp === "function" && atCamp()) return null;
  if (typeof wbArena === "function" && wbArena()) return "打王的時候不能換招";
  if ((W0.combatT || 0) > 0 || (W0.fightAgo !== undefined && W0.fightAgo < 3)) return "戰鬥中不能換招（離開戰鬥 3 秒後就可以）";
  return null;
}
// 原本的招式說明
const TRI_BASE_D = { a: "原本的普攻", q: "原本的 Q 招", r: "原本的閃身：往前閃一段，短暫無敵" };
// ───────── 輔助寶石：每一招一條鏈（企劃 21 第二版）─────────
// 標籤：p 投射、m 近戰、a 範圍、v 位移、d 持續、b 輔助
const TAG_N = { p: "投射", m: "近戰", a: "範圍", v: "位移", d: "持續", b: "輔助" };
const SK_TAG = {
  sword: { a: { base: "m", dance: "m", ray: "mp", break: "m" }, q: { base: "p", wan: "p", boom: "p", rush: "vm" }, e: { array: "ad", cold: "a", domain: "mb", base: "a", storm: "ad", nova: "pa", judg: "a" } },
  staff: { a: { base: "p", split: "p", frost: "p", burst: "pa" }, q: { base: "a", shower: "a", doom: "a", wall: "da" }, e: { freeze: "a", tstorm: "a", hole: "a", base: "a", blizz: "ad", chainl: "p", inferno: "ad" } },
  bow: { a: { base: "p", tri3: "p", home: "p", snipe: "p" }, q: { base: "p", rain: "a", refr: "p", swal: "pd" }, e: { blast: "pa", turret: "p", pierce9: "p", base: "p", barr: "ad", seekr: "p", star: "a" } },
  blade: { a: { base: "m", sweep: "m", quake: "m", crack: "m" }, q: { base: "md", gale: "md", whirl: "md", leap: "md" }, e: { fury: "ma", blades: "md", titan: "b", base: "a", cyclone: "va", rift: "a", exec: "m" } },
  fist: { a: { base: "m", lean: "ma", inch: "m", qi: "p", sanshou: "ma" }, q: { base: "vm", chain: "vm", tiger: "vm", roar: "a", throw: "ma" }, e: { palm: "a", thous: "ad", dragf: "b", base: "a", hund: "m", dragon: "va", gong: "p" } },
  fan: { a: { base: "p", twin: "p", gust: "p", spring: "p" }, q: { base: "d", suck: "d", storm: "da", ward: "d" }, e: { healz: "b", petal: "d", wwall: "b", base: "a", typh: "ad", bloom: "p", zephyr: "d" } },
};
const R_TAG = { base: "v", ghost: "v", surge: "v", wave: "v", blink: "v", pull: "a", guard: "b" };
const GEM_TAGS = { haste: "*", thrift: "*", multi: "pma", chain: "pma", burst: "pma", lmp: "p", pierce: "p", split: "p", bounce: "p", boomer: "p", seek: "p", volley: "p",
  enlarge: "amd", after: "a", focus: "a", trail: "v", rshield: "v", icepath: "v", rapid: "m", bell: "m", totem: "pa" }; // 沒寫的＝全部攻擊招 pmad
const eRaw = (wt) => { const w = save.w; return (w && w.tri && w.tri[wt] && w.tri[wt].e) || ""; };
const E_SPEC = ["base", "origin", "uq"];
const slotsN = () => Math.min(5, 1 + jobLv()); // 0 轉 1 格 → 四轉 5 格
function slotSkill(sl, wt = curWeapon()) {
  if (sl === "e") { // 企劃 35 §2-2：原本的 E、起源、傳說專屬都是各自一格（eRaw＝"base"／"origin"／"uq"）
    const v = triOf(wt, "e"); if (v) return v;
    const r = eRaw(wt); if (r === "base") return "base"; if (r === "origin" && jobLv() >= 4) return "origin"; if (r === "uq" && curUq()) return "uq";
    return jobLv() >= 4 ? "origin" : curUq() ? "uq" : "base";
  }
  if (sl === "q" && ((B.uq && B.uq.voidQ) || (typeof supOn === "function" && (supOn("meteor") || supOn("swordrain"))))) return "over";
  return triOf(wt, sl) || "base";
}
function slotTags(sl, wt = curWeapon()) {
  const k = slotSkill(sl, wt);
  if (sl === "r") return R_TAG[k] || "v";
  if (k === "uq") return "pa"; if (k === "origin" || k === "over") return "a";
  return (SK_TAG[wt] && SK_TAG[wt][sl] && SK_TAG[wt][sl][k]) || "m";
}
function chainRaw(sl, wt = curWeapon()) {
  const w = save.w; if (!w.chain) w.chain = {};
  if (sl === "r") return w.chain.r || (w.chain.r = []);
  const c = w.chain[wt] || (w.chain[wt] = {}); return c[sl] || (c[sl] = []);
}
const chainRow = (sl, wt) => chainRaw(sl, wt).slice(0, slotsN());
// 企劃 21 §11：互斥組（同一招每組只能一顆）、法術／攻擊（法杖、扇＝法術）
const GEM_GRP = { lmp: "數量", volley: "數量", split: "數量", enlarge: "範圍", focus: "範圍", totem: "放法", trigc: "放法", trigh: "放法", rapid: "放法", ice: "元素", fire: "元素", volt: "元素", venom: "元素", efocus: "元素" };
const isSpellWt = (wt) => wt === "staff" || wt === "fan";
// 為什麼這顆不能串在這一招（空字串＝可以）；skipI：檢查同列重複時略過自己那格
function gemWhy(g, sl, skipI = -1, wt = curWeapon()) {
  const k = g.split(":")[0], tags = slotTags(sl, wt), al = GEM_TAGS[k] || "pmad";
  if (sl === "e" && slotSkill(sl, wt) === "origin") return "起源覺醒不能串輔助";
  if (k === "multi" && sl !== "r" && !isSpellWt(wt)) return "連發只能串法術（法杖、扇）";
  if (k === "rapid" && isSpellWt(wt)) return "連打只能串攻擊（不能串法杖、扇）";
  if ((k === "trigc" || k === "trigh") && sl !== "e") return "只能串在 E";
  if (k === "totem" && sl !== "a" && sl !== "q") return "只能串在普攻或 Q";
  if (k === "multi" && sl === "r") return "身法不能串";
  if ((k === "rapid" || k === "totem") && tags.includes("v")) return "位移招不能串";
  if (al !== "*" && ![...tags].some((t) => al.includes(t))) return `要${[...al].map((t) => TAG_N[t]).join("／")}招`;
  const row = chainRaw(sl, wt);
  if (row.some((x, i) => i !== skipI && x && x.split(":")[0] === k)) return "這招已經串了同一種";
  { const o = gemElse(k, sl, wt); if (o) return `已經串在 ${o.label}`; } // 企劃 21 §10-1：每種輔助寶石整個角色只能一顆
  { const gp = GEM_GRP[k]; if (gp) { const o = row.find((x, i) => i !== skipI && x && x.split(":")[0] !== k && GEM_GRP[x.split(":")[0]] === gp); if (o) return `跟${gemFullN(o.split(":")[0])}同一組：${gp}`; } }
  const e = ELE_GEM[k]; if (e && row.some((x, i) => i !== skipI && x && ELE_GEM[x.split(":")[0]] && ELE_GEM[x.split(":")[0]] !== e)) return "一招只能一種元素";
  if (k === "spread" && !row.some((x) => x && x.startsWith("fire:"))) return "要先串火元素";
  return "";
}
const gemFits = (g, sl) => { const k = g.split(":")[0]; if (k === "spread") return chainRow(sl).some((x) => x && x.startsWith("fire:")); return !gemWhy(g, sl, chainRaw(sl).indexOf(g)); };
// 同一種輔助寶石還串在哪裡（這把武器的普攻／Q／E＋全武器共用的身法；在身法列找的時候看每把武器）
const SL_ORD = ["a", "q", "e", "r"];
function slLabel(sl, wt) {
  const k = triOf(wt, sl), L = sl === "r" ? TRI.r : sl === "e" ? (TRI_E[wt] || []) : ((TRI[wt] || {})[sl] || []), o = k && L.find((x) => x.k === k);
  return `${sl === "r" ? "身法" : sl.toUpperCase() === "A" ? "普攻" : sl.toUpperCase()}${o ? `（${o.n}）` : ""}`;
}
function gemElse(k, sl, wt = curWeapon()) {
  const w = save.w; if (!w || !w.chain) return null;
  const has = (row) => row && row.slice(0, slotsN()).findIndex((x) => x && x.split(":")[0] === k);
  const spots = sl === "r" ? Object.keys(w.chain).filter((x) => x !== "r").flatMap((x) => ["a", "q", "e"].map((l) => [l, x])) : SL_ORD.filter((l) => l !== sl).map((l) => [l, wt]);
  for (const [l, x] of spots) { const row = l === "r" ? w.chain.r : w.chain[x] && w.chain[x][l]; const i = has(row); if (i >= 0) return { l, wt: x, i, label: (sl === "r" && x !== wt ? WEAPONS[x].n + "的" : "") + slLabel(l, x) }; }
  return null;
}
// 舊存檔：同一種只留 a→q→e→r 第一顆，其他退回背包（每把武器各自算，身法共用）
function gemDupMig() {
  const w = save.w; if (!w || !w.chain || w.gemOne) return 0;
  let n = 0;
  const seenR = new Set((w.chain.r || []).filter(Boolean).map((g) => g.split(":")[0]));
  for (const wt of Object.keys(w.chain)) {
    if (wt === "r") continue; const seen = new Set();
    for (const l of ["a", "q", "e"]) { const row = w.chain[wt][l] || []; row.forEach((g, i) => { if (!g) return; const k = g.split(":")[0]; if (seen.has(k)) { addGem(g); row[i] = null; n++; } else seen.add(k); }); }
  }
  // 身法列：跟任何一把武器重複的退回（a→q→e 在前面，留武器那顆）
  const used = new Set(); for (const wt of Object.keys(w.chain)) if (wt !== "r") for (const l of ["a", "q", "e"]) for (const g of w.chain[wt][l] || []) if (g) used.add(g.split(":")[0]);
  (w.chain.r || []).forEach((g, i) => { if (g && used.has(g.split(":")[0])) { addGem(g); w.chain.r[i] = null; n++; } });
  w.gemOne = 1; return n;
}
// 企劃 21 §11 舊存檔：衝突的（互斥組、連發／連打、起源）保留第一顆，其他退回背包
function gemGrpMig() {
  const w = save.w; if (!w || !w.chain || w.gemGrp) return 0;
  let n = 0;
  for (const wt of Object.keys(w.chain)) {
    const ls = wt === "r" ? [["r", null]] : ["a", "q", "e"].map((l) => [l, wt]);
    for (const [l, x] of ls) {
      const row = wt === "r" ? w.chain.r : w.chain[wt][l]; if (!row) continue;
      const W = x || curWeapon();
      const orig = row.slice(); row.fill(null); // 一顆一顆放回去：只跟前面已經放的比，保留第一顆
      for (let i = 0; i < orig.length; i++) { const g = orig[i]; if (!g) continue; if (WEAPONS[W] && gemWhy(g, l, i, W)) { addGem(g); n++; } else row[i] = g; }
    }
  }
  w.gemGrp = 1; return n;
}
// 企劃 66 A：招式自帶元素（名字有元素的才有）。串元素寶石＝轉化成那個元素；自帶元素不送燃燒／冰凍／感電／中毒（那些還是要串寶石）
const SK_ELE = {
  sword: { e: { base: "T", cold: "W" } },
  staff: { a: { frost: "W", burst: "F" }, q: { base: "F", shower: "F", doom: "F", wall: "F" }, e: { base: "W", tstorm: "T", chainl: "T", inferno: "F" } },
  bow: { e: { blast: "F", trap: "T" } },
  fist: { e: { dragf: "F" } },
  fan: { q: { storm: "T" } },
};
function skEleOf(wt, sl, k) { const T = SK_ELE[wt] && SK_ELE[wt][sl]; return (T && T[k || "base"]) || null; }
function skEle(sl, wt = curWeapon()) { if (!sl || sl === "r") return null; return skEleOf(wt, sl, slotSkill(sl, wt)); }
function slotEle(sl) { return slotGemEle(sl) || skEle(sl); }
function slotGemEle(sl) { let best = null, bl = 0; for (const g of chainRow(sl)) { if (!g || !gemReqOk(g)) continue; const [k, l] = g.split(":"); if (ELE_GEM[k] && +l > bl && gemFits(g, sl)) { bl = +l; best = ELE_GEM[k]; } } return best; }
// 企劃 61 §A-2：同一招串的第 3 顆起，每多一顆這招傷害 ×0.92（更多，相乘；省元不算）
const CHAIN_DM = 0.95; // v9.13.1：0.92 時劍、弓串 5 顆只有 2 顆的 0.9 倍（企劃 61 §8 規則）
function chainGemN(sl) { if (!save.w) return 0; let n = 0; for (const g of chainRow(sl)) if (g && gemReqOk(g) && gemFits(g, sl) && !g.startsWith("thrift:")) n++; return n; }
const chainDmMul = (sl) => Math.round(Math.pow(CHAIN_DM, Math.max(0, chainGemN(sl) - 2)) * 100) / 100;
function chainMpMul(sl) { // 真氣倍率：每顆相乘，省元 −15%／級
  if (!save.w) return 1; let m = 1, th = 0;
  for (const g of chainRow(sl)) { if (!g || !gemReqOk(g) || !gemFits(g, sl)) continue; const [k, l] = g.split(":"); if (k === "thrift") th += +l; else m *= gemMp(k); }
  return Math.round(m * Math.max(0.3, 1 - 0.15 * th) * 100) / 100;
}
// 舊存檔：武器上的寶石 → 自動串到普攻那列（放不下、不能串的放到 Q、E，再不行回背包）
function chainMig() {
  const w = save.w; if (!w || w.chV) return 0;
  const list = [], take = (it, keep) => { if (it && it.so) { for (const g of it.so) if (g) (keep ? list.push(g) : addGem(g)); it.so = []; } };
  take(save.eq.sword, true);
  for (const it of save.bag || []) if (it.slot === "sword") take(it);
  for (const it of w.ws || []) if (it && it !== save.eq.sword) take(it);
  list.sort((a, b) => +b.split(":")[1] - +a.split(":")[1]);
  let n = 0;
  for (const g of list) {
    let ok = false;
    for (const sl of ["a", "q", "e"]) { const row = chainRaw(sl); const used = row.slice(0, slotsN()).filter(Boolean).length; if (used < slotsN() && !gemWhy(g, sl)) { let i = 0; while (row[i]) i++; row[i] = g; ok = true; n++; break; } }
    if (!ok) addGem(g);
  }
  w.chV = 2; return list.length ? [n, list.length] : 0;
}
let triPick = null; // { l, i } 正在選輔助寶石的格子
const JOB_N = ["", "一轉", "二轉", "三轉", "四轉"];
function chainCells(l) {
  const row = chainRaw(l), n = slotsN(); let cells = "";
  for (let i = 0; i < 5; i++) {
    const g = row[i];
    if (i >= n) cells += `<span class="rcell lock">🔒<small>${JOB_N[i]}</small></span>`;
    else if (g) { const [k, lv] = g.split(":"), why = !gemReqOk(g) ? gemNeedTxt(g) : gemWhy(g, l, i) ? "這招用不到" : ""; cells += `<button class="rcell has${why ? " bad" : ""}" data-cs="${l}:${i}" style="--c:${gemCol(g)[1]}">${gemIco(g, "rico")}<b style="color:${GEMS[k].c}">${GEMS[k].n}</b><small>${lv} 級${why ? "・" + why : ""}</small></button>`; }
    else cells += `<button class="rcell empty${triPick && triPick.l === l && triPick.i === i ? " pick" : ""}" data-cs="${l}:${i}">＋<small>輔助</small></button>`;
    if (i < 4) cells += `<i class="rlink"></i>`;
  }
  return `<div class="rchain">${cells}</div>`;
}
// ───────── 企劃 63：輔助寶石選單改成彈窗（分頁、一種一列、點開才看說明、搜尋、合成分頁）─────────
let gemTab = (() => { try { return localStorage.getItem("pr_gemTab") || "ok"; } catch (e) { return "ok"; } })(), gemOpenK = null, gemOpenG = null, gemQ = "";
const GP_TABS = [["ok", "可以串"], ["r", "紅"], ["g", "綠"], ["b", "藍"], ["all", "全部"], ["mg", "合成"]];
const gpShort = (k, lv) => String(GEMS[k].d(+lv)).replace(/<[^>]+>/g, "").split(/[；。]/)[0];
const gpSkillN = (l) => (l === "a" ? WSKILL.attack.n : l === "q" ? WSKILL.spin.n : l === "e" ? WSKILL.ult.n : WSKILL.roll.n || "閃身") || TRI_LAYER_N[l];
function gpWhy(g) { const { l, i } = triPick; const why = gemCantMsg(g) ? gemNeedTxt(g) : gemWhy(g, l, i); const mv = !!why && why.startsWith("已經串在") && !gemCantMsg(g); return { why, mv }; }
function gpKinds() { // 背包裡的寶石照種類分組：最高等級在前
  const by = {};
  for (const g of Object.keys(save.gems || {})) { if (!(save.gems[g] > 0)) continue; const [k, lv] = g.split(":"); (by[k] = by[k] || []).push({ g, lv: +lv, n: save.gems[g], ...gpWhy(g) }); }
  return Object.keys(by).map((k) => { const L = by[k].sort((a, b) => b.lv - a.lv), best = L.find((x) => !x.why) || L.find((x) => x.mv) || null; return { k, L, best, ok: !!best, col: GEM_COL[k] || "b" }; })
    .sort((a, b) => (b.ok - a.ok) || (gemSortKey(a.L[0].g) < gemSortKey(b.L[0].g) ? -1 : 1));
}
function gpListHtml() {
  if (gemTab === "mg") {
    const gs = Object.keys(save.gems || {}).filter((g) => save.gems[g] >= 3 && +g.split(":")[1] < GEM_MAX).sort(gemSort);
    return gs.length ? gs.map((g) => { const [k, lv] = g.split(":"); return `<button class="gprow gmg" data-gm="${g}">${gemIco(g, "gico")}<b style="color:${GEMS[k].c}">${GEMS[k].n}</b><span>${lv} 級 ×3 → ${+lv + 1} 級</span><i>有 ${save.gems[g]} 顆</i></button>`; }).join("") : `<p class="sub">沒有可以合成的（同一種同一級要 3 顆）</p>`;
  }
  const q = gemQ.trim();
  let K = gpKinds();
  if (gemTab === "ok") K = K.filter((x) => x.ok); else if (gemTab !== "all") K = K.filter((x) => x.col === gemTab);
  if (q) K = K.filter((x) => (GEMS[x.k].n + gpShort(x.k, x.L[0].lv) + (GEM_TAGS[x.k] || "").split("").map((t) => TAG_N[t] || "").join("")).includes(q));
  if (!K.length) return `<p class="sub">${Object.keys(save.gems || {}).length ? (gemTab === "ok" ? "這一格現在沒有串得上的（看「全部」分頁有寫原因）" : "沒有符合的寶石") : "背包裡沒有輔助寶石（精英、王、秘境會掉）"}</p>`;
  return K.map((x) => {
    const top = x.best || x.L[0], open = gemOpenK === x.k, sel = (open && x.L.find((y) => y.g === gemOpenG)) || top;
    const more = x.L.filter((y) => y !== top).map((y) => `${y.lv}級×${y.n}`).join(" ");
    const st = !x.ok ? `<em>${x.L[0].why}</em>` : top.mv ? `<em class="mv">在 ${top.why.replace("已經串在", "").trim()} → 搬過來</em>` : "";
    let body = "";
    if (open) {
      const lvs = x.L.length > 1 ? `<div class="gplv">${x.L.map((y) => `<button data-gl="${y.g}" class="${y === sel ? "on" : ""}${y.why && !y.mv ? " no" : ""}">${y.lv} 級 ×${y.n}</button>`).join("")}</div>` : "";
      const act = sel.why && !sel.mv ? `<p class="gpno">不能串：${sel.why}</p>` : `<button class="gold gpput" data-rg="${sel.g}">${sel.mv ? `從 ${sel.why.replace("已經串在", "").trim()} 搬過來` : "串上去"}</button>`;
      body = `<div class="gpbody">${lvs}<small class="gtype">${GEM_TYPE}・${gemCol(sel.g)[0]}・Lv.${gemReq(sel.g)}</small><p>${gemDesc(sel.g)}</p>${act}</div>`;
    }
    return `<div class="gpitem${x.ok ? "" : " dim"}${open ? " open" : ""}"><button class="gprow" data-gk="${x.k}" style="--c:${gemCol(top.g)[1]}">${gemIco(top.g, "gico")}<b style="color:${GEMS[x.k].c}">${GEMS[x.k].n}</b><span class="gplvn">${top.lv} 級 ×${top.n}${more ? `<small>＋${more}</small>` : ""}</span><span class="gpd">${st || gpShort(x.k, top.lv)}</span></button>${body}</div>`;
  }).join("");
}
function gemPopHtml() {
  if (!triPick) return "";
  const { l, i } = triPick;
  return `<div class="gpop" data-gpx="bg"><div class="gpbox"><div class="gphead"><b>串到：${gpSkillN(l)}（${TRI_LAYER_N[l]}）第 ${i + 1} 格</b><button class="gpx" data-gpx="x" aria-label="關閉">✕</button></div>
    <div class="gptabs">${GP_TABS.map(([k, n]) => `<button data-gt="${k}" class="${gemTab === k ? "on" : ""}${k.length === 1 ? " c" + k : ""}">${n}</button>`).join("")}<input class="gpq" type="search" placeholder="搜尋（投射、火…）" value="${gemQ.replace(/"/g, "&quot;")}"></div>
    <div class="gplist">${gpListHtml()}</div></div></div>`;
}
function gemPopClose() { if (!triPick) return false; triPick = null; gemOpenK = gemOpenG = null; renderSkills(); return true; }
function gemPopBind(again) {
  const pop = ov.querySelector(".gpop"); if (!pop) return;
  const relist = () => { pop.querySelector(".gplist").innerHTML = gpListHtml(); };
  const q = pop.querySelector(".gpq");
  q.addEventListener("input", () => { gemQ = q.value; gemOpenK = null; relist(); });
  q.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Escape") q.blur(); });
  pop.addEventListener("click", (e) => {
    const t = e.target.closest("[data-gpx],[data-gt],[data-gk],[data-gl],[data-rg],[data-gm]");
    if (!t || (t.dataset.gpx === "bg" && e.target !== pop)) return;
    if (t.dataset.gpx) { sfx("click"); gemPopClose(); return; }
    if (t.dataset.gt) { gemTab = t.dataset.gt; try { localStorage.setItem("pr_gemTab", gemTab); } catch (er) {} gemOpenK = null; sfx("click"); pop.querySelectorAll("[data-gt]").forEach((b) => b.classList.toggle("on", b.dataset.gt === gemTab)); relist(); return; }
    if (t.dataset.gk) { gemOpenK = gemOpenK === t.dataset.gk ? null : t.dataset.gk; gemOpenG = null; sfx("click"); relist(); const o = pop.querySelector(".gpitem.open"); if (o && o.scrollIntoView) o.scrollIntoView({ block: "nearest" }); return; }
    if (t.dataset.gl) { gemOpenG = t.dataset.gl; sfx("click"); relist(); return; }
    if (t.dataset.rg) { triPutGem(t.dataset.rg, again); return; }
    if (t.dataset.gm) { triMergeGem(t.dataset.gm, again, relist); return; }
  });
}
function triPutGem(g, again) {
  if (!triPick || !(save.gems[g] > 0)) return;
  const { l, i } = triPick;
  let why = gemCantMsg(g) || gemWhy(g, l, i);
  const o = why && why.startsWith("已經串在") ? gemElse(g.split(":")[0], l) : null;
  if (o) { // 搬過來：舊的那格退回背包，這格串上
    const orow = o.l === "r" ? save.w.chain.r : save.w.chain[o.wt][o.l]; addGem(orow[o.i]); orow[o.i] = null;
    why = gemCantMsg(g) || gemWhy(g, l, i);
    if (!why) { chainRaw(l)[i] = g; save.gems[g]--; if (!save.gems[g]) delete save.gems[g]; triPick = null; gemOpenK = null; sfx("good"); again(`從${o.label}搬到${TRI_LAYER_N[l]}：${gemName(g)}`); return; }
  }
  if (why) { sfx("bad"); triPick = null; renderSkills(why); return; }
  chainRaw(l)[i] = g; save.gems[g]--; if (!save.gems[g]) delete save.gems[g];
  triPick = null; gemOpenK = null; sfx("good"); again(`${TRI_LAYER_N[l]}串上 ${gemName(g)}`);
}
function triMergeGem(g, again, relist) {
  const [k, l] = g.split(":"); if ((save.gems[g] || 0) < 3) return;
  save.gems[g] -= 3; if (!save.gems[g]) delete save.gems[g]; const ng = `${k}:${+l + 1}`; addGem(ng); sfx("arrive"); writeSave();
  if (triPick && relist) { relist(); notice(`合成出 ${gemName(ng)}！`); } else again(`合成出 ${gemName(ng)}！`);
}
// 技能卡名字旁的元素小字：自帶元素；正在用的那招串了別的元素寶石 →「（轉成雷）」
function eleTag(l, k, on) {
  if (l === "r") return "";
  const wt = curWeapon(), e = skEleOf(wt, l, k), g = on ? slotGemEle(l) : null, t = (x, s) => `<i class="eletag" style="color:${ELE_C[x]}">${s}</i>`;
  if (g && g !== e) return t(g, `（${e ? ELE_N[e] + "→" : ""}轉成${ELE_N[g]}）`);
  return e ? t(e, ELE_N[e]) : "";
}
function renderTri(msg = "") {
  const wt = curWeapon(), lv = wLv(), why = triSwapWhy(), ws = WSKILLS[wt];
  if (save.w) save.w.triSeen = Math.max(save.w.triSeen || 1, lv);
  const card = (l, k, n, d, need) => {
    const cur = (triOf(wt, l) || "") === k, open = !k || triOpen(wt, l, k), key = skgKey(wt, l, k), buy = k && !open && !skgHas(key);
    const lockTxt = buy ? `${lv >= need ? "" : `Lv.${need} `}可在營地技能商人購買・${(need * SKG_PRICE).toLocaleString()} 靈石（點這裡）` : `🔒 Lv.${need} 開放`;
    return `<button class="tricard${cur ? " on" : ""}${open ? "" : " lock"}${buy ? " buy" : ""}" data-tl="${l}" data-tk="${k}" ${buy ? `data-shop="${l === "r" ? "r" : wt}"` : ""} ${(open && !cur) || buy ? "" : "disabled"}><b>${l === "e" && !k && (jobLv() >= 4 || curUq()) ? "" : skIco(wt, l, k, "tico")}${n}${eleTag(l, k, cur)}</b><small>${open ? d : lockTxt}</small>${open ? skgBar(key) : ""}</button>`;
  };
  const row = (l) => {
    const L = triList(wt, l);
    let base = l === "a" ? ws.attack[0] : l === "q" ? ws.spin[0] : l === "e" ? ws.ult[0] : "閃身", bd = TRI_BASE_D[l] || "原本的 E 招";
    const over = l === "q" && slotSkill("q") === "over" ? `<p class="sub">目前被傳說／超技能改寫的 Q 取代，選了也不會生效</p>` : "";
    const idx = (L || []).map((o, i) => [o, triLvAt(wt, l, i)]).sort((a, b) => a[1] - b[1]);
    let first = [card(l, "", base, bd, 1)];
    if (l === "e") { // 企劃 35：原本的 E 永遠一格；起源（四轉）、傳說專屬各自另一格
      const cur = slotSkill("e"), ec = (k, n, d, ic) => `<button class="tricard${cur === k ? " on" : ""}${lv < E_LV ? " lock" : ""}" data-tl="e" data-tk="${k}" ${cur === k || lv < E_LV ? "disabled" : ""}><b>${ic}${n}</b><small>${lv < E_LV ? `🔒 Lv.${E_LV} 開放` : d}</small>${k === "base" && lv >= E_LV ? skgBar(skgKey(wt, "e", "base")) : ""}</button>`;
      first = [ec("base", ws.ult[0] + eleTag("e", "base", cur === "base"), "原本的 E 招", skIco(wt, "e", "", "tico"))];
      if (curUq()) first.push(ec("uq", WUQ[curUq()][0], "傳說武器的專屬 E 招", ""));
      if (jobLv() >= 4) first.push(ec("origin", "起源覺醒", "四轉：全螢幕時停的起源大招（不能串輔助）", ""));
    }
    const cards = first.concat(idx.map(([o, need]) => card(l, o.k, o.n, o.d, need))).join("");
    const tags = [...slotTags(l)].map((t) => TAG_N[t]).join("・"), mm = chainMpMul(l);
    const se = l === "r" ? null : slotEle(l);
    const sub = `${l === "r" ? "全部武器共用" : WEAPONS[wt].n + "的技能"}・標籤：${tags}${se ? `・元素：<b style="color:${ELE_C[se]}">${ELE_N[se]}</b>` : ""}${(() => { const n = chainGemN(l), dm = chainDmMul(l); return n ? `・串 ${n} 顆：傷害 ×${dm}・真氣 ×${mm}` : ""; })()}`;
    return `<div class="trirow"><div class="trihead"><b>${TRI_LAYER_N[l]}</b><small>${sub}</small></div>${over}<div class="tricards c4">${cards}</div>${chainCells(l)}</div>`;
  };
  return `${msg ? `<div class="emsg">${msg}</div>` : ""}<div class="trilist"><p class="sub">技能要有<b>技能寶石</b>才能用（原本的招免費，其他到營地「技能商人」買），點卡片換招${why ? `：<b style="color:#ff9a7a">${why}</b>` : "（營地隨時、野外脫戰 3 秒）"}。招式下面的格子串<b>輔助寶石</b>，只影響那一招；0 轉 1 格、每轉多 1 格。每顆都有代價，真氣倍率串幾顆就相乘。</p>${row("a")}${row("q")}${row("e")}${row("r")}</div>${gemPopHtml()}`;
}
function bindTri() {
  const again = (m) => { writeSave(); setPadLabels(true); renderSkills(m); };
  ov.querySelectorAll("[data-tk]").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.shop) { sfx("click"); shopWt = b.dataset.shop; skTab = "shop"; renderSkills(); return; }
    const wt = curWeapon(), l = b.dataset.tl, k = b.dataset.tk, why = triSwapWhy();
    if (why) { sfx("bad"); renderSkills(why); return; }
    const sp = l === "e" && E_SPEC.includes(k);
    if (k && !sp && !triOpen(wt, l, k)) return;
    const o = k && !sp ? triList(wt, l).find((x) => x.k === k) : null;
    const spN = { base: WSKILLS[wt].ult[0], origin: "起源覺醒", uq: curUq() ? WUQ[curUq()][0] : "" }[k];
    triSet(wt, l, k); sfx("good"); renderSkills(`${TRI_LAYER_N[l]}換成「${o ? o.n : sp ? spN : "原本的招式"}」`);
  }));
  ov.querySelectorAll("[data-cs]").forEach((b) => b.addEventListener("click", () => {
    const [l, si] = b.dataset.cs.split(":"), i = +si, row = chainRaw(l), g = row[i];
    if (g) { addGem(g); row[i] = null; triPick = null; sfx("click"); again(`拆下 ${gemName(g)}`); return; }
    triPick = triPick && triPick.l === l && triPick.i === i ? null : { l, i }; gemOpenK = gemOpenG = null; gemQ = ""; sfx("click"); renderSkills();
  }));
  gemPopBind(again);
}
// 舊存檔搬家：進世界時
const _enterWorldCh = enterWorld;
enterWorld = function () {
  const r = save.w && save.w.created ? chainMig() : 0, dn = save.w && save.w.created ? gemDupMig() : 0;
  if (dn) setTimeout(() => { if (typeof writeSave === "function") writeSave(); if (typeof say === "function") say(`輔助寶石改成每一種整個角色只能串一顆：重複的 ${dn} 顆退回背包了（技能 → 技能鏈）`, "#ffe066"); }, 1500);
  const out = _enterWorldCh.apply(this, arguments);
  const gn = save.w && save.w.created ? gemGrpMig() : 0;
  if (gn) setTimeout(() => { if (typeof writeSave === "function") writeSave(); if (typeof say === "function") say(`輔助寶石新規則：同一招每組只能一顆（數量／範圍／放法／元素）、連發只能串法術、連打只能串攻擊、起源覺醒不能串。衝突的 ${gn} 顆退回背包了（技能 → 技能鏈）`, "#ffe066"); }, 2600);
  if (r) { if (typeof writeSave === "function") writeSave(); if (typeof notice === "function") notice(`輔助寶石改成每一招各自串！原本武器上的 ${r[1]} 顆，${r[0]} 顆幫你串到普攻那列${r[1] > r[0] ? "，其他的放回背包" : ""}（技能 → 技能鏈）`, "#ffe066"); }
  return out;
};
// E 招 Lv.5 才開：之前天罰能量不會累積，按鈕寫「Lv.5」
const _applyWeaponT = applyWeapon;
applyWeapon = function () { _applyWeaponT.apply(this, arguments); if (save.w && wLv() < E_LV && WSKILL.ult) WSKILL.ult.n = `Lv.${E_LV} 開放`; };
const _updateWorldT = updateWorld;
updateWorld = function () { const r = _updateWorldT.apply(this, arguments); if (W0 && save.w && wLv() < E_LV) W0.en = 0; return r; };
// 升級開新技能：劍靈提示＋技能鈕紅點
setInterval(() => {
  const w = save.w; if (!w || !w.created || typeof W0 === "undefined" || !W0 || !inWorld) return;
  const lv = wLv();
  if (W0.triLv === undefined) { W0.triLv = lv; return; }
  if (lv > W0.triLv) {
    const wt = curWeapon(), got = [];
    for (const l of ["a", "q", "e", "r"]) { const L = triList(wt, l); if (L) L.forEach((o, i) => { if (triLvAt(wt, l, i) > W0.triLv && triLvAt(wt, l, i) <= lv) got.push(o.n); }); }
    if (E_LV > W0.triLv && E_LV <= lv) { got.push(WSKILLS[wt].ult[0]); applyWeapon(); setPadLabels(true); }
    W0.triLv = lv;
    if (got.length) (typeof notice === "function" ? notice(`可以買新技能「${got.join("、")}」了（營地 → 技能 → 技能商人）`, "#ffe066") : floatText(W0.x, W0.y - 40, `可以買新技能「${got.join("、")}」`, "#ffe066", true));
  }
}, 1000);
