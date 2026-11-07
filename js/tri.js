// 萬劍仙途 — 改招三選一（企劃 04）：一轉＝普攻、二轉＝Q（每種武器各自一組）、三轉＝身法（全武器共用）
// 存檔用選項代碼：save.w.tri = { sword: { a: "dance", q: "boom" }, bow: {...}, r: "surge" }；沒選＝原本的招式
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
const TRI_NEED = { a: 1, q: 2, r: 3 }; // 幾轉解鎖
const TRI_LAYER_N = { a: "普攻", q: "Q 招", r: "身法" };
const triList = (wt, l) => (l === "r" ? TRI.r : TRI[wt] && TRI[wt][l]) || null;
function triOf(wt, l) {
  const w = save.w; if (!w || !w.tri || jobLv() < TRI_NEED[l]) return null;
  const v = l === "r" ? w.tri.r : w.tri[wt] && w.tri[wt][l];
  const L = triList(wt, l);
  return L && L.some((o) => o.k === v) ? v : null;
}
const triName = (wt, l) => { const v = triOf(wt, l), L = triList(wt, l); return v ? L.find((o) => o.k === v).n : null; };
// 還沒選的層（目前武器）
function triPending() {
  const wt = curWeapon(), out = [];
  for (const l of ["a", "q", "r"]) if (jobLv() >= TRI_NEED[l] && triList(wt, l) && !triOf(wt, l)) out.push(l);
  return out;
}
function triSet(wt, l, k) {
  const w = save.w; if (!w.tri) w.tri = {};
  if (l === "r") w.tri.r = k; else { if (!w.tri[wt]) w.tri[wt] = {}; w.tri[wt][l] = k; }
  writeSave(); applyWeapon(); setPadLabels(true);
}
// 技能頁「招式」分頁
function renderTri(msg = "") {
  const wt = curWeapon(), j = jobLv(), camp = typeof atCamp === "function" ? atCamp() : true;
  const rows = ["a", "q", "r"].map((l) => {
    const L = triList(wt, l), lock = j < TRI_NEED[l], cur = triOf(wt, l);
    const head = `<div class="trihead"><b>${TRI_LAYER_N[l]}</b><small>${l === "r" ? "全部武器共用" : WEAPONS[wt].n + "專屬"}　${lock ? `${JOBS[TRI_NEED[l] - 1].n}（Lv.${JOBS[TRI_NEED[l] - 1].lv}）解鎖` : cur ? "已選" : "還沒選"}</small></div>`;
    if (!L) return `<div class="trirow">${head}<p class="sub">這種武器的${TRI_LAYER_N[l]}選項即將開放</p></div>`;
    const over = l === "q" && (B.uq.voidQ || (typeof supOn === "function" && (supOn("meteor") || supOn("swordrain")))) ? `<p class="sub">目前被傳說／超技能改寫的 Q 取代，選了也不會生效</p>` : "";
    const can = !lock && (!cur || camp);
    return `<div class="trirow">${head}${over}<div class="tricards">${L.map((o) => `<button class="tricard${cur === o.k ? " on" : ""}" data-tl="${l}" data-tk="${o.k}" ${can && cur !== o.k ? "" : "disabled"}><b>${o.n}</b><small>${o.d}</small></button>`).join("")}</div></div>`;
  }).join("");
  return `${msg ? `<div class="emsg">${msg}</div>` : ""}<div class="trilist">${rows}</div>
    <p class="sub">轉職會解鎖新的一層。第一次選在哪裡都可以；之後要換，回到安全營地免費換${camp ? "" : "（你現在不在營地）"}。</p>`;
}
function bindTri() {
  screenEl.querySelectorAll("[data-tk]").forEach((b) => b.addEventListener("click", () => {
    const wt = curWeapon(), l = b.dataset.tl, k = b.dataset.tk, o = triList(wt, l).find((x) => x.k === k);
    triSet(wt, l, k); sfx("good"); renderSkills(`${TRI_LAYER_N[l]}換成「${o.n}」`);
  }));
}
// 轉職當下：直接打開招式分頁
const _doJobTri = doJob;
doJob = function () {
  const r = _doJobTri.apply(this, arguments);
  if (r !== false && triPending().length) { skTab = "tri"; setTimeout(() => { if (state === "pick" || state === "paused") renderSkills("轉職解鎖新招式，選一張"); }, 0); }
  return r;
};
// 有沒選的招式：技能鈕紅點；在安全營地裡才飄字提醒（野外不蓋住戰鬥資訊）
setInterval(() => {
  const w = save.w; if (!w || !w.created || typeof W0 === "undefined" || !W0 || !inWorld) return;
  const pend = triPending().length > 0;
  const key = curWeapon() + jobLv();
  if (pend && state === "world" && atCamp() && W0.triHint !== key) { W0.triHint = key; floatText(W0.x, W0.y - 40, "可以選新招式了（技能 → 招式）", "#ffe066", true); }
}, 1000);
