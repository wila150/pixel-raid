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
  ],
};
// 開放等級（第 i 張卡）；E＝Lv.5
const TRI_LV = { a: [10, 15, 20], q: [30, 40, 50], r: [25, 45, 60] };
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
  for (const l of ["a", "q", "r"]) { const L = triList(wt, l); if (L) L.forEach((o, i) => { if (TRI_LV[l][i] > seen && TRI_LV[l][i] <= lv) out.push(o.n); }); }
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
// 技能頁「技能鏈」分頁
let triPick = null; // 正在選符文的格子
function renderTri(msg = "") {
  const wt = curWeapon(), lv = wLv(), why = triSwapWhy(), ws = WSKILLS[wt];
  if (save.w) save.w.triSeen = Math.max(save.w.triSeen || 1, lv);
  const card = (l, k, n, d, need) => {
    const cur = (triOf(wt, l) || "") === k, open = !k || triOpen(wt, l, k);
    return `<button class="tricard${cur ? " on" : ""}${open ? "" : " lock"}" data-tl="${l}" data-tk="${k}" ${open && !cur ? "" : "disabled"}><b>${n}</b><small>${open ? d : `🔒 Lv.${need} 開放`}</small>${open && !k ? "" : open ? "" : ""}</button>`;
  };
  const row = (l) => {
    const L = triList(wt, l), base = l === "a" ? ws.attack[0] : l === "q" ? ws.spin[0] : "閃身";
    const over = l === "q" && (B.uq.voidQ || (typeof supOn === "function" && (supOn("meteor") || supOn("swordrain")))) ? `<p class="sub">目前被傳說／超技能改寫的 Q 取代，選了也不會生效</p>` : "";
    const cards = [card(l, "", base, TRI_BASE_D[l], 1)].concat((L || []).map((o, i) => card(l, o.k, o.n, o.d, TRI_LV[l][i]))).join("");
    return `<div class="trirow"><div class="trihead"><b>${TRI_LAYER_N[l]}</b><small>${l === "r" ? "全部武器共用" : WEAPONS[wt].n + "的技能"}</small></div>${over}<div class="tricards c4">${cards}</div></div>`;
  };
  const eRow = () => {
    const u = WSKILL.ult && WSKILL.ult.uq, n = u ? WSKILL.ult.n : ws.ult[0];
    return `<div class="trirow"><div class="trihead"><b>E 招</b><small>集滿天罰能量放；更多 E 招之後開放</small></div><div class="tricards c4"><button class="tricard on" disabled><b>${n}</b><small>${lv < E_LV ? `🔒 Lv.${E_LV} 開放` : u ? "傳說武器的專屬 E 招" : "原本的 E 招"}</small></button></div></div>`;
  };
  return `${msg ? `<div class="emsg">${msg}</div>` : ""}<div class="trilist">${row("a")}${row("q")}${eRow()}${row("r")}${chainHtml()}</div>
    <p class="sub">技能照等級開放，開過的永遠能用。${why ? `<b style="color:#ff9a7a">${why}</b>` : "現在可以換招。"}（營地裡隨時能換；野外離開戰鬥 3 秒後能換）</p>`;
}
// 符文鏈（第一版：整把武器共用，孔數看轉職）
function chainHtml() {
  const w = save.eq.sword; if (!w) return `<div class="chainbox"><div class="trihead"><b>符文鏈</b><small>先裝備一把武器</small></div></div>`;
  const n = sockN(), so = w.so || [], NEED = [["", 0], ["一轉", 4], ["二轉", 5], ["三轉", 6]];
  let cells = "";
  for (let i = 0; i < 6; i++) {
    const g = so[i];
    if (i >= n) { const nx = NEED.find((x) => x[1] > i) || NEED[3]; cells += `<span class="rcell lock">🔒<small>${nx[0]}</small></span>`; }
    else if (g) { const [k, l] = g.split(":"); cells += `<button class="rcell has${gemReqOk(g) ? "" : " bad"}" data-rs="${i}" style="--c:${gemCol(g)[1]}" title="${GEMS[k].d(+l)}"><b style="color:${GEMS[k].c}">${GEMS[k].n}</b><small>${l} 級${gemReqOk(g) ? "" : `・要 Lv.${gemReq(g)}`}</small></button>`; }
    else cells += `<button class="rcell empty${triPick === i ? " pick" : ""}" data-rs="${i}">＋<small>空格</small></button>`;
    if (i < 5) cells += `<i class="rlink"></i>`;
  }
  let pick = "";
  if (triPick !== null) {
    const gs = Object.keys(save.gems || {}).filter((g) => save.gems[g] > 0).sort(gemSort);
    pick = `<div class="rpick"><div class="trihead"><b>選一顆符文串上去</b><small>紅＝力量、綠＝敏捷、藍＝智力</small></div>${gs.length ? `<div class="gbag">${gs.map((g) => { const [k, l] = g.split(":"); return `<button class="gem" data-rg="${g}" style="border-color:${gemCol(g)[1]}" ${gemReqOk(g) ? "" : "disabled"}><b style="color:${GEMS[k].c}">${gemTag(g)} ${gemName(g)} ×${save.gems[g]}</b>${gemReqTxt(g)}<small>${GEMS[k].d(+l)}</small></button>`; }).join("")}</div>` : `<p class="sub">背包裡沒有符文：精英怪、獵寶妖、任務會掉</p>`}</div>`;
  }
  return `<div class="chainbox"><div class="trihead"><b>符文鏈</b><small>目前串在${w.name || "武器"}上，全部招式一起吃（之後會改成每招一條）；點格子串上／拆下</small></div><div class="rchain">${cells}</div>${pick}</div>`;
}
function bindTri() {
  ov.querySelectorAll("[data-tk]").forEach((b) => b.addEventListener("click", () => {
    const wt = curWeapon(), l = b.dataset.tl, k = b.dataset.tk, why = triSwapWhy();
    if (why) { sfx("bad"); renderSkills(why); return; }
    if (k && !triOpen(wt, l, k)) return;
    const o = k ? triList(wt, l).find((x) => x.k === k) : null;
    triSet(wt, l, k); sfx("good"); renderSkills(`${TRI_LAYER_N[l]}換成「${o ? o.n : "原本的招式"}」`);
  }));
  ov.querySelectorAll("[data-rs]").forEach((b) => b.addEventListener("click", () => {
    const w = save.eq.sword, i = +b.dataset.rs, g = w && w.so && w.so[i];
    if (g) { addGem(g); w.so[i] = null; triPick = null; writeSave(); applyWeapon(); sfx("click"); renderSkills(`拆下 ${gemName(g)}`); return; }
    triPick = triPick === i ? null : i; sfx("click"); renderSkills();
  }));
  ov.querySelectorAll("[data-rg]").forEach((b) => b.addEventListener("click", () => {
    const w = save.eq.sword, g = b.dataset.rg, i = triPick; if (!w || i === null) return;
    const ec = eleClash(w, g) || gemCantMsg(g); if (ec) { sfx("bad"); renderSkills(ec); return; }
    w.so = w.so || []; w.so[i] = g; save.gems[g]--; if (!save.gems[g]) delete save.gems[g];
    triPick = null; writeSave(); applyWeapon(); sfx("good"); renderSkills(`串上 ${gemName(g)}`);
  }));
}
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
    for (const l of ["a", "q", "r"]) { const L = triList(wt, l); if (L) L.forEach((o, i) => { if (TRI_LV[l][i] > W0.triLv && TRI_LV[l][i] <= lv) got.push(o.n); }); }
    if (E_LV > W0.triLv && E_LV <= lv) { got.push(WSKILLS[wt].ult[0]); applyWeapon(); setPadLabels(true); }
    W0.triLv = lv;
    if (got.length) (typeof notice === "function" ? notice(`解鎖新技能「${got.join("、")}」（技能 → 技能鏈 換上）`, "#ffe066") : floatText(W0.x, W0.y - 40, `解鎖新技能「${got.join("、")}」`, "#ffe066", true));
  }
}, 1000);
