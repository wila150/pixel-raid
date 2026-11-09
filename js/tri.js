// 萬劍仙途 — 技能清單＋技能鏈（企劃 21 §8，總表第 12 項；取代 04 的改招三選一）
// 每把武器的技能照等級開，開過永遠能用；普攻／Q／E／身法 各一格自由選（第一版：每格從同一類裡選）
// 存檔：save.w.tri = { sword: { a: "dance", q: "boom" }, bow: {...}, r: "surge" }；沒選＝原本的招式
// save.w.triOwn：舊存檔三選一選過的（直接當已開，不看等級）；save.w.triSeen：看過技能鏈時的等級（紅點用）
"use strict";
const TRI = {
  sword: {
    a: [
      { k: "dance", n: "劍舞", d: "三段連擊，第 3 下範圍變大、傷害 ×1.65、擊退強；前兩下 90%（近身割草）" },
      { k: "ray", n: "劍芒", d: "每下都多射一道短劍氣（距離 80、傷害 45%），本體 70%，不用貼臉" },
      { k: "break", n: "破軍", d: "只打正前方（扇形很窄），傷害 ×1.2，對精英／王再 +30%（單體、打王）" },
    ],
    q: [
      { k: "wan", n: "萬劍", d: "5 道穿透劍氣、扇形更寬，每道傷害 60%（清怪）" },
      { k: "boom", n: "回旋劍", d: "3 道劍氣飛出去再飛回來，回程再打一次，每道 57%（打王、打一排）" },
      { k: "rush", n: "御劍突", d: "往前衝 60，路上的怪都斬到，衝刺中無敵；冷卻 +0.3 秒（位移、躲招）" },
    ],
  },
  bow: {
    a: [
      { k: "tri3", n: "三連珠", d: "每第 3 箭穿透、傷害 ×1.5（打成排的怪）" },
      { k: "home", n: "追蹤箭", d: "箭會轉向附近的怪（不太需要瞄，傷害和原本一樣）" },
      { k: "snipe", n: "狙擊", d: "射速 ×0.5、傷害 ×2.3、距離 +50%、爆擊 +10%（單體、打王）" },
    ],
    q: [
      { k: "rain", n: "箭雨", d: "目標一帶落下 8 支箭（定點範圍）" },
      { k: "refr", n: "折光", d: "5 支箭，每支打中後再彈到下一隻 1 次（清怪）" },
      { k: "swal", n: "燕返", d: "往後跳 50（短暫無敵），同時往前射 3 支（風箏、躲招）" },
    ],
  },
  staff: { // 企劃 08-B
    a: [
      { k: "split", n: "分光", d: "一次射 3 顆小法球（扇形），每顆 50%（清怪）" },
      { k: "frost", n: "寒星", d: "射速變慢、傷害 ×1.8，打中讓怪緩速 1 秒（單體、打王）" },
      { k: "burst", n: "爆裂", d: "法球飛更遠，打中小爆炸把身邊的怪炸退（傷害 85%，保持距離）" },
    ],
    q: [
      { k: "shower", n: "流星群", d: "目標周圍隨機落下 6 顆小火球（清怪）" },
      { k: "doom", n: "天隕", d: "一顆大隕石 0.7 秒後落下，傷害很高；冷卻 +0.6 秒（單體、打王）" },
      { k: "wall", n: "火牆", d: "面前橫著一道火牆 2 秒，怪走過去會燒、變慢（擋追兵、放風箏）" },
    ],
  },
  blade: {
    a: [
      { k: "sweep", n: "橫掃", d: "揮成 360° 一整圈，傷害 90%（被包圍時割草）" },
      { k: "quake", n: "崩山", d: "出刀變慢、傷害 ×2，命中時畫面震動（單體、打王）" },
      { k: "crack", n: "破甲", d: "傷害 80%；打中的怪 4 秒內受到的傷害 +15%（頭上有裂甲標記）" },
    ],
    q: [
      { k: "gale", n: "颶風", d: "轉 1.5 秒、轉的時候移動不變慢，每下傷害較低（邊走邊割草）" },
      { k: "whirl", n: "大迴旋", d: "一次大圈範圍斬，順便把怪拉到身邊（單體、聚怪）" },
      { k: "leap", n: "斷空", d: "往前跳斬 70，落地圓形傷害；跳的時候無敵（位移、躲招）" },
    ],
  },
  fist: {
    a: [
      { k: "lean", n: "鐵山靠", d: "出拳速度一半，但每拳打一小圈範圍（清怪）" },
      { k: "inch", n: "寸勁", d: "每第 5 拳 ×3、擊退強（單體、打王）" },
      { k: "qi", n: "氣功波", d: "每拳射一顆短氣彈（距離 55、傷害 85%），不用貼臉" },
    ],
    q: [
      { k: "chain", n: "連環衝", d: "衝完 1 秒內再按 Q 可以再衝一次，不扣真氣（清怪、連續位移）" },
      { k: "tiger", n: "虎撲", d: "自動衝到最近的怪身上，傷害較高（單體）" },
      { k: "roar", n: "震天", d: "不衝；前方大範圍擊退＋緩速 2 秒（控場、保命）" },
    ],
  },
  fan: {
    a: [
      { k: "twin", n: "雙刃", d: "一次飛出兩道風刃，每道 55%，都會回來（清怪）" },
      { k: "gust", n: "疾風", d: "不回來，直線飛得又快又遠，傷害 ×2.3（單體、打王）" },
      { k: "spring", n: "回春", d: "風刃飛回來碰到自己時，按打中的怪數回血（每隻 0.5% 生命，一次最多 3%）" },
    ],
    q: [
      { k: "suck", n: "聚風", d: "旋風吸怪力量 ×2、範圍變大（清怪、聚怪）" },
      { k: "storm", n: "風雷", d: "旋風停下時再爆炸一次（單體、打王）" },
      { k: "ward", n: "風陣", d: "旋風不往前飄，繞著自己轉 3 秒，靠近的敵方子彈會被吹散（打王保命）" },
    ],
  },
  r: [
    { k: "ghost", n: "殘影", d: "閃身經過的路上留下劍光，碰到的怪受傷" },
    { k: "surge", n: "乘勢", d: "閃身後 1.5 秒內，下一招（普攻或 Q）整招必定爆擊" },
    { k: "wave", n: "凌波", d: "閃身冷卻 −30%，每次閃身回 8 真氣" },
    { k: "blink", n: "縮地", d: "瞬間移到前面一段（無敵時間比閃身短）；冷卻 ×1.3（全部武器通用）" },
    { k: "pull", n: "聚妖", d: "不閃身：把附近的怪吸到身邊、變慢 1.5 秒；冷卻 ×2.5（全部武器通用）" },
    { k: "guard", n: "護體", d: "不閃身：3 秒護盾，擋下 20% 生命的傷害；冷卻 ×4.5（全部武器通用）" },
  ],
};
// 企劃 21 第二版：每把武器再 3 招（E 格，Lv.70／85／100）
const TRI_E = {
  sword: [{ k: "storm", n: "劍雨", d: "目標一帶落下 12 把飛劍（範圍清怪）" }, { k: "nova", n: "萬劍歸心", d: "16 道穿透劍氣往四面八方飛（投射）" }, { k: "judg", n: "天劍", d: "0.6 秒後一把巨劍砸在目標，傷害極高（範圍、打王）" }],
  staff: [{ k: "blizz", n: "暴風雪", d: "目標一帶 1.5 秒內落下 10 團冰，打中變慢（範圍）" }, { k: "chainl", n: "雷鏈", d: "一顆雷球打中後連跳 6 隻（投射）" }, { k: "inferno", n: "焚天", d: "身邊一圈火牆燒 3 秒（持續）" }],
  bow: [{ k: "barr", n: "千鈞箭陣", d: "連射 3 波，每波 7 支箭（投射）" }, { k: "seekr", n: "天狼追魂", d: "8 支追蹤箭（投射、不用瞄）" }, { k: "star", n: "墜星箭", d: "往前一排落下 5 顆星（範圍）" }],
  blade: [{ k: "cyclone", n: "天刀旋", d: "轉 2 秒、移動不變慢，每下比旋風斬痛（近戰、持續）" }, { k: "rift", n: "斷界", d: "往前一路 8 段炸開（範圍）" }, { k: "exec", n: "斬魂", d: "大範圍一刀；剩 30% 血以下的怪傷害 ×2（近戰、打王）" }],
  fist: [{ k: "hund", n: "百裂拳", d: "1 秒內對前面打 12 拳（近戰）" }, { k: "dragon", n: "升龍", d: "衝到怪身上，落地大範圍（位移、範圍）" }, { k: "gong", n: "氣功炮", d: "一顆大氣彈穿透一整排（投射）" }],
  fan: [{ k: "typh", n: "颱風", d: "放出 3 道旋風（持續）" }, { k: "bloom", n: "花雨", d: "回 15% 血，12 道風刃往四周飛再飛回來（投射）" }, { k: "zephyr", n: "清風結界", d: "旋風繞著自己轉 5 秒（持續）" }],
};
for (const wt in TRI_E) TRI[wt].e = TRI_E[wt];
// 開放等級（第 i 張卡）；E＝Lv.5
const TRI_LV = { a: [10, 15, 20], q: [30, 40, 50], e: [70, 85, 100], r: [25, 45, 60, 15, 35, 50] };
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
function triNeed(wt, l, k) { const L = triList(wt, l); const i = L ? L.findIndex((o) => o.k === k) : -1; return i < 0 ? 999 : TRI_LV[l][i]; }
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
  for (const l of ["a", "q", "e", "r"]) { const L = triList(wt, l); if (L) L.forEach((o, i) => { if (TRI_LV[l][i] > seen && TRI_LV[l][i] <= lv) out.push(o.n); }); }
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
  sword: { a: { base: "m", dance: "m", ray: "mp", break: "m" }, q: { base: "p", wan: "p", boom: "p", rush: "vm" }, e: { base: "a", storm: "a", nova: "p", judg: "a" } },
  staff: { a: { base: "p", split: "p", frost: "p", burst: "pa" }, q: { base: "a", shower: "a", doom: "a", wall: "da" }, e: { base: "a", blizz: "ad", chainl: "p", inferno: "da" } },
  bow: { a: { base: "p", tri3: "p", home: "p", snipe: "p" }, q: { base: "p", rain: "a", refr: "p", swal: "vp" }, e: { base: "p", barr: "p", seekr: "p", star: "a" } },
  blade: { a: { base: "m", sweep: "m", quake: "m", crack: "m" }, q: { base: "md", gale: "md", whirl: "ma", leap: "va" }, e: { base: "a", cyclone: "md", rift: "a", exec: "m" } },
  fist: { a: { base: "m", lean: "ma", inch: "m", qi: "p" }, q: { base: "vm", chain: "vm", tiger: "vm", roar: "a" }, e: { base: "a", hund: "m", dragon: "va", gong: "p" } },
  fan: { a: { base: "p", twin: "p", gust: "p", spring: "p" }, q: { base: "d", suck: "d", storm: "da", ward: "d" }, e: { base: "a", typh: "d", bloom: "p", zephyr: "d" } },
};
const R_TAG = { base: "v", ghost: "v", surge: "v", wave: "v", blink: "v", pull: "a", guard: "b" };
const GEM_TAGS = { haste: "*", thrift: "*", multi: "pma", chain: "pma", burst: "pma", lmp: "p", pierce: "p", split: "p", bounce: "p", boomer: "p", seek: "p", volley: "p",
  enlarge: "amd", after: "a", focus: "a", trail: "v", rshield: "v", icepath: "v", rapid: "m", bell: "m", totem: "pa" }; // 沒寫的＝全部攻擊招 pmad
const slotsN = () => Math.min(5, 1 + jobLv()); // 0 轉 1 格 → 四轉 5 格
function slotSkill(sl, wt = curWeapon()) {
  if (sl === "e") { const v = triOf(wt, "e"); return v || (jobLv() >= 4 ? "origin" : curUq() ? "uq" : "base"); }
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
// 為什麼這顆不能串在這一招（空字串＝可以）；skipI：檢查同列重複時略過自己那格
function gemWhy(g, sl, skipI = -1, wt = curWeapon()) {
  const k = g.split(":")[0], tags = slotTags(sl, wt), al = GEM_TAGS[k] || "pmad";
  if ((k === "trigc" || k === "trigh") && sl !== "e") return "只能串在 E";
  if (k === "totem" && sl !== "a" && sl !== "q") return "只能串在普攻或 Q";
  if (k === "multi" && sl === "r") return "身法不能串";
  if ((k === "rapid" || k === "totem") && tags.includes("v")) return "位移招不能串";
  if (al !== "*" && ![...tags].some((t) => al.includes(t))) return `要${[...al].map((t) => TAG_N[t]).join("／")}招`;
  const row = chainRaw(sl, wt);
  if (row.some((x, i) => i !== skipI && x && x.split(":")[0] === k)) return "這招已經串了同一種";
  const e = ELE_GEM[k]; if (e && row.some((x, i) => i !== skipI && x && ELE_GEM[x.split(":")[0]] && ELE_GEM[x.split(":")[0]] !== e)) return "一招只能一種元素";
  if (k === "spread" && !row.some((x) => x && x.startsWith("fire:"))) return "要先串火元素";
  return "";
}
const gemFits = (g, sl) => { const k = g.split(":")[0]; if (k === "spread") return chainRow(sl).some((x) => x && x.startsWith("fire:")); return !gemWhy(g, sl, chainRaw(sl).indexOf(g)); };
function slotEle(sl) { let best = null, bl = 0; for (const g of chainRow(sl)) { if (!g || !gemReqOk(g)) continue; const [k, l] = g.split(":"); if (ELE_GEM[k] && +l > bl && gemFits(g, sl)) { bl = +l; best = ELE_GEM[k]; } } return best; }
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
    else if (g) { const [k, lv] = g.split(":"), why = !gemReqOk(g) ? `要 Lv.${gemReq(g)}` : gemWhy(g, l, i) ? "這招用不到" : ""; cells += `<button class="rcell has${why ? " bad" : ""}" data-cs="${l}:${i}" style="--c:${gemCol(g)[1]}"><b style="color:${GEMS[k].c}">${GEMS[k].n}</b><small>${lv} 級${why ? "・" + why : ""}</small></button>`; }
    else cells += `<button class="rcell empty${triPick && triPick.l === l && triPick.i === i ? " pick" : ""}" data-cs="${l}:${i}">＋<small>輔助</small></button>`;
    if (i < 4) cells += `<i class="rlink"></i>`;
  }
  let pick = "";
  if (triPick && triPick.l === l) {
    const gs = Object.keys(save.gems || {}).filter((g) => save.gems[g] > 0).sort(gemSort);
    const btn = (g) => { const [k, lv] = g.split(":"), why = gemCantMsg(g) ? `需要 Lv.${gemReq(g)}` : gemWhy(g, l, triPick.i); return `<button class="gem" data-rg="${g}" style="border-color:${gemCol(g)[1]}" ${why ? "disabled" : ""}><b style="color:${GEMS[k].c}">${gemTag(g)}${GEMS[k].n} ${lv} 級 ×${save.gems[g]}</b><small>${gemDesc(g)}</small>${why ? `<em class="greq">${why}</em>` : ""}</button>`; };
    const merge = gs.filter((g) => save.gems[g] >= 3 && +g.split(":")[1] < GEM_MAX).map((g) => `<button class="gmerge2" data-gm="${g}">${GEMS[g.split(":")[0]].n} ${g.split(":")[1]} 級 ×3 → ${+g.split(":")[1] + 1} 級</button>`).join("");
    pick = `<div class="rpick"><div class="trihead"><b>選一顆輔助寶石串上去</b><small>紅＝力量、綠＝敏捷、藍＝智力；灰色的寫了為什麼不能串</small></div>${gs.length ? `<div class="gbag">${gs.map(btn).join("")}</div>` : `<p class="sub">背包裡沒有輔助寶石（精英、王、秘境會掉）</p>`}${merge ? `<div class="gmrow"><small>3 顆合成高一級：</small>${merge}</div>` : ""}</div>`;
  }
  return `<div class="rchain">${cells}</div>${pick}`;
}
function renderTri(msg = "") {
  const wt = curWeapon(), lv = wLv(), why = triSwapWhy(), ws = WSKILLS[wt];
  if (save.w) save.w.triSeen = Math.max(save.w.triSeen || 1, lv);
  const card = (l, k, n, d, need) => {
    const cur = (triOf(wt, l) || "") === k, open = !k || triOpen(wt, l, k);
    return `<button class="tricard${cur ? " on" : ""}${open ? "" : " lock"}" data-tl="${l}" data-tk="${k}" ${open && !cur ? "" : "disabled"}><b>${n}</b><small>${open ? d : `🔒 Lv.${need} 開放`}</small></button>`;
  };
  const row = (l) => {
    const L = triList(wt, l);
    let base = l === "a" ? ws.attack[0] : l === "q" ? ws.spin[0] : l === "e" ? ws.ult[0] : "閃身", bd = TRI_BASE_D[l] || "原本的 E 招";
    if (l === "e") { if (jobLv() >= 4) { base = "起源覺醒"; bd = "四轉：全螢幕時停的起源大招"; } else if (curUq()) { base = WUQ[curUq()][0]; bd = "傳說武器的專屬 E 招"; } if (lv < E_LV) bd = `🔒 Lv.${E_LV} 開放`; }
    const over = l === "q" && slotSkill("q") === "over" ? `<p class="sub">目前被傳說／超技能改寫的 Q 取代，選了也不會生效</p>` : "";
    const idx = (L || []).map((o, i) => [o, TRI_LV[l][i]]).sort((a, b) => a[1] - b[1]);
    const cards = [card(l, "", base, bd, 1)].concat(idx.map(([o, need]) => card(l, o.k, o.n, o.d, need))).join("");
    const tags = [...slotTags(l)].map((t) => TAG_N[t]).join("・"), mm = chainMpMul(l);
    const sub = `${l === "r" ? "全部武器共用" : WEAPONS[wt].n + "的技能"}・標籤：${tags}${mm !== 1 ? `・真氣 ×${mm}` : ""}`;
    return `<div class="trirow"><div class="trihead"><b>${TRI_LAYER_N[l]}</b><small>${sub}</small></div>${over}<div class="tricards c4">${cards}</div>${chainCells(l)}</div>`;
  };
  return `${msg ? `<div class="emsg">${msg}</div>` : ""}<div class="trilist"><p class="sub">技能照等級開，點卡片換招${why ? `：<b style="color:#ff9a7a">${why}</b>` : "（營地隨時、野外脫戰 3 秒）"}。招式下面的格子串<b>輔助寶石</b>，只影響那一招；0 轉 1 格、每轉多 1 格。每顆都有代價，真氣倍率串幾顆就相乘。</p>${row("a")}${row("q")}${row("e")}${row("r")}</div>`;
}
function bindTri() {
  const again = (m) => { writeSave(); setPadLabels(true); renderSkills(m); };
  ov.querySelectorAll("[data-tk]").forEach((b) => b.addEventListener("click", () => {
    const wt = curWeapon(), l = b.dataset.tl, k = b.dataset.tk, why = triSwapWhy();
    if (why) { sfx("bad"); renderSkills(why); return; }
    if (k && !triOpen(wt, l, k)) return;
    const o = k ? triList(wt, l).find((x) => x.k === k) : null;
    triSet(wt, l, k); sfx("good"); renderSkills(`${TRI_LAYER_N[l]}換成「${o ? o.n : "原本的招式"}」`);
  }));
  ov.querySelectorAll("[data-cs]").forEach((b) => b.addEventListener("click", () => {
    const [l, si] = b.dataset.cs.split(":"), i = +si, row = chainRaw(l), g = row[i];
    if (g) { addGem(g); row[i] = null; triPick = null; sfx("click"); again(`拆下 ${gemName(g)}`); return; }
    triPick = triPick && triPick.l === l && triPick.i === i ? null : { l, i }; sfx("click"); renderSkills();
  }));
  ov.querySelectorAll("[data-rg]").forEach((b) => b.addEventListener("click", () => {
    const g = b.dataset.rg; if (!triPick || !(save.gems[g] > 0)) return;
    const { l, i } = triPick, why = gemCantMsg(g) || gemWhy(g, l, i);
    if (why) { sfx("bad"); renderSkills(why); return; }
    chainRaw(l)[i] = g; save.gems[g]--; if (!save.gems[g]) delete save.gems[g];
    triPick = null; sfx("good"); again(`${TRI_LAYER_N[l]}串上 ${gemName(g)}`);
  }));
  ov.querySelectorAll("[data-gm]").forEach((b) => b.addEventListener("click", () => {
    const g = b.dataset.gm, [k, l] = g.split(":"); if ((save.gems[g] || 0) < 3) return;
    save.gems[g] -= 3; if (!save.gems[g]) delete save.gems[g]; const ng = `${k}:${+l + 1}`; addGem(ng); sfx("arrive"); again(`合成出 ${gemName(ng)}！`);
  }));
}
// 舊存檔搬家：進世界時
const _enterWorldCh = enterWorld;
enterWorld = function () {
  const r = save.w && save.w.created ? chainMig() : 0;
  const out = _enterWorldCh.apply(this, arguments);
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
    for (const l of ["a", "q", "e", "r"]) { const L = triList(wt, l); if (L) L.forEach((o, i) => { if (TRI_LV[l][i] > W0.triLv && TRI_LV[l][i] <= lv) got.push(o.n); }); }
    if (E_LV > W0.triLv && E_LV <= lv) { got.push(WSKILLS[wt].ult[0]); applyWeapon(); setPadLabels(true); }
    W0.triLv = lv;
    if (got.length) (typeof notice === "function" ? notice(`解鎖新技能「${got.join("、")}」（技能 → 技能鏈 換上）`, "#ffe066") : floatText(W0.x, W0.y - 40, `解鎖新技能「${got.join("、")}」`, "#ffe066", true));
  }
}, 1000);
