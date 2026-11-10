// 萬劍仙途 — 經濟（企劃 11 通貨＋第 4 節裝備軟限制、企劃 17 素材＋鍛造＋煉丹＋追蹤配方）
"use strict";

// ───────── 通貨 ─────────
const CUR = {
  gold: { n: "點金符", g: "金", c: "#ffd84a", r: 0.0016, d: "白→藍、藍→紫（升一級品質，多一條詞綴）" },
  chaos: { n: "混元石", g: "混", c: "#c88aff", r: 0.0009, d: "重骰一件藍／紫裝的全部詞綴（數量也會重骰）" },
  regret: { n: "洗心丹", g: "洗", c: "#9aff9a", r: 0.001, d: "天賦樹退點用：退一格 1 個、全部重置 5 個（沒有就付靈石）" },
  exalt: { n: "淬靈石", g: "淬", c: "#7ab8ff", r: 0.00015, d: "在紫裝上加一條隨機詞綴（有空位才能用）" },
  vaal: { n: "天劫雷印", g: "劫", c: "#ff5a5a", r: 0.00009, d: "渡劫：25% 沒事、25% 多一條劫紋（超強詞綴）、25% 詞綴全部重洗、25% 裝備碎掉。渡劫過的不能再改" },
  divine: { n: "造化玉", g: "造", c: "#ffe9a0", r: 0.00003, d: "詞綴種類不變，只重骰數值高低（追 T1）" },
  mirror: { n: "太虛鏡", g: "鏡", c: "#a0ffff", r: 0.0000002, d: "複製一件非傳說、沒渡劫的裝備（複製品標「鏡影」，不能再複製）" },
};
const CUR_KEYS = Object.keys(CUR);
const curN = (k) => (save.cur && save.cur[k]) || 0;
function addCur(k, n = 1) { if (!save.cur) save.cur = {}; save.cur[k] = (save.cur[k] || 0) + n; }
function useCur(k, n = 1) { if (curN(k) < n) return false; save.cur[k] -= n; return true; }
const curList = () => CUR_KEYS.filter((k) => curN(k) > 0).map((k) => ({ k: "cur:" + k, g: CUR[k].g, c: CUR[k].c, n: curN(k), name: CUR[k].n, d: CUR[k].d + "（點一件裝備，在下面的按鈕用；要在營地）" }));
function randCur() { // 照機率比例抽一種
  const tot = CUR_KEYS.reduce((s, k) => s + CUR[k].r, 0); let r = Math.random() * tot;
  for (const k of CUR_KEYS) { r -= CUR[k].r; if (r <= 0) return k; } return "gold";
}

// ───────── 素材 ─────────
const MATS = {
  hide: { n: "妖獸皮", z: "grass", rare: 0, c: "#c8a070" }, horn: { n: "靈獸角", z: "grass", rare: 1, c: "#f0d090" },
  wood: { n: "樹妖木心", z: "forest", rare: 0, c: "#7aa060" }, resin: { n: "千年樹脂", z: "forest", rare: 1, c: "#e0b040" },
  grit: { n: "碎靈石屑", z: "waste", rare: 0, c: "#a8a0c0" }, soulcore: { n: "石魂核", z: "waste", rare: 1, c: "#d0c8ff" },
  lavac: { n: "熔岩晶", z: "volcano", rare: 0, c: "#ff7a3a" }, firesoul: { n: "火精魄", z: "volcano", rare: 1, c: "#ffb060" },
  icem: { n: "寒冰髓", z: "snow", rare: 0, c: "#9fdcff" }, wolffang: { n: "霜狼王牙", z: "snow", rare: 1, c: "#e0f4ff" },
  venomsac: { n: "蟾毒囊", z: "swamp", rare: 0, c: "#8dff6a" }, bonejade: { n: "屍骨玉", z: "swamp", rare: 1, c: "#d8f0c0" },
  tfeather: { n: "雷羽", z: "thunder", rare: 0, c: "#c8b8ff" }, tcore: { n: "雷核", z: "thunder", rare: 1, c: "#e8d8ff" },
  silk: { n: "仙雲絲", z: "sky", rare: 0, c: "#f0e8ff" }, jsoul: { n: "劍魄", z: "sky", rare: 1, c: "#ffe9a8" },
  b_volcano: { n: "石魔熔心", boss: "volcano", rare: 2, c: "#ff5a2a" }, b_swamp: { n: "蟾王毒腺", boss: "swamp", rare: 2, c: "#6ac04a" },
  b_thunder: { n: "鵬王翎", boss: "thunder", rare: 2, c: "#a8d0ff" }, b_sky: { n: "劍尊劍意", boss: "sky", rare: 2, c: "#ffd070" },
};
const MAT_Z = {}; for (const k in MATS) if (MATS[k].z) (MAT_Z[MATS[k].z] = MAT_Z[MATS[k].z] || [])[MATS[k].rare] = k;
const matN = (k) => (save.mat && save.mat[k]) || 0;
function addMat(k, n = 1) { if (!save.mat) save.mat = {}; save.mat[k] = (save.mat[k] || 0) + n; }
const matHas = (need) => Object.keys(need).every((k) => k === "stone" ? save.stone >= need[k] : matN(k) >= need[k]);
function matUse(need) { for (const k in need) { if (k === "stone") save.stone -= need[k]; else save.mat[k] -= need[k]; } }
const matName = (k) => (k === "stone" ? "靈石" : MATS[k].n);
const matTxt = (need) => Object.keys(need).map((k) => `${matName(k)} ${k === "stone" ? need[k] : `${matN(k)}/${need[k]}`}`).join("、");
const matWhere = (k) => { const M = MATS[k]; if (M.gz) return `採集點：${M.gz.map((z) => ZONES[z].n).join("、")}（地上的發光植物／礦石，站著不動 1.5 秒）`; return M.boss ? `${RBOSS[M.boss].n}（打倒必掉 3–6 個；秘境之主也會掉）` : `${ZONES[M.z].n}${M.rare ? "：精英 20%、一般怪 0.5%" : "：區內所有怪 20%"}`; };
function matList() {
  return Object.keys(MATS).filter((k) => matN(k) > 0).map((k) => ({ k: "mat:" + k, g: MATS[k].n[0], c: MATS[k].c, n: matN(k), name: MATS[k].n, d: `哪裡掉：${matWhere(k)}<br>用途：${matUses(k)}` }));
}
function matUses(k) { const r = RECIPES.filter((x) => x.need[k]).map((x) => x.n); return r.length ? r.slice(0, 5).join("、") + (r.length > 5 ? "…" : "") : "精煉高段"; }

// ───────── 配方（鍛造：王裝保底／部位鍛造；煉丹；鑰匙）─────────
const BUFFS = {
  fireres: { n: "避火丹", g: "火", c: "#ff7a3a", d: "火焰抗性 +30%（上限變 80%）", ele: "F" },
  iceres: { n: "避寒丹", g: "寒", c: "#9fdcff", d: "冰冷抗性 +30%（上限變 80%）", ele: "W" },
  thres: { n: "避雷丹", g: "雷", c: "#c8b8ff", d: "閃電抗性 +30%（上限變 80%）", ele: "T" },
  psnres: { n: "避毒丹", g: "毒", c: "#8dff6a", d: "混沌抗性 +30%（上限變 80%）", ele: "P" },
  atkup: { n: "破軍丹", g: "攻", c: "#ff9a6a", d: "攻擊 +10%" },
  dropup: { n: "尋寶丹", g: "寶", c: "#ffd84a", d: "掉寶 +15%" },
  expup: { n: "悟道丹", g: "悟", c: "#9fe8ff", d: "經驗 +20%" },
};
const BUFF_MS = 30 * 60 * 1000;
const RECIPES = [
  { id: "u_toadrobe", kind: "forge", n: "萬毒蟾衣（王裝保底）", u: "toadrobe", lv: 50, need: { b_swamp: 20, bonejade: 10, hide: 20, stone: 3000 } },
  { id: "u_tstep", kind: "forge", n: "踏雷靴（王裝保底）", u: "tstep", lv: 75, need: { b_thunder: 20, tcore: 10, hide: 20, stone: 6000 } },
  { id: "u_wuxiang", kind: "forge", n: "無相劍（王裝保底）", u: "wuxiang", lv: 110, need: { b_sky: 20, jsoul: 10, wood: 20, stone: 12000 } },
  { id: "p_fireres", kind: "pill", n: "避火丹", b: "fireres", need: { lavac: 10, stone: 200 } },
  { id: "p_iceres", kind: "pill", n: "避寒丹", b: "iceres", need: { icem: 10, stone: 250 } },
  { id: "p_psnres", kind: "pill", n: "避毒丹", b: "psnres", need: { venomsac: 10, stone: 300 } },
  { id: "p_thres", kind: "pill", n: "避雷丹", b: "thres", need: { tfeather: 10, stone: 400 } },
  { id: "p_atkup", kind: "pill", n: "破軍丹", b: "atkup", need: { horn: 3, wood: 10, stone: 300 } },
  { id: "p_dropup", kind: "pill", n: "尋寶丹", b: "dropup", need: { resin: 3, grit: 10, stone: 300 } },
  { id: "p_expup", kind: "pill", n: "悟道丹", b: "expup", need: { hide: 10, soulcore: 3, stone: 300 } },
];
// 部位鍛造：每區一條（一般 ×40、稀有 ×5），保底一條你指定的詞綴
for (const z of ["grass", "forest", "waste", "volcano", "snow", "swamp", "thunder", "sky"]) RECIPES.push({ id: "f_" + z, kind: "slot", z, n: `${ZONES[z].n}鍛造（紫裝＋指定詞綴）`, need: { [MAT_Z[z][0]]: 40, [MAT_Z[z][1]]: 5, stone: 100 + ZONES[z].lv[1] * 20 } });
// 秘境鑰（Lv.30 以上的區：一般素材 ×30）
for (const z of ["swamp", "thunder", "sky"]) RECIPES.push({ id: "k_" + z, kind: "key", z, n: `秘境鑰（${ZONES[z].n}素材）`, need: { [MAT_Z[z][0]]: 30 } });
const recipe = (id) => RECIPES.find((r) => r.id === id);
const zoneIl = (z) => Math.floor((ZONES[z].lv[0] + ZONES[z].lv[1]) / 2 / 3);
let forgeSlot = "sword", forgeAff = "atk", econTab = "forge";

// ───────── 裝備軟限制（企劃 11 第 4 節）─────────
// 企劃 44：需求等級＝基底那一階的需求；戒指耳飾（沒有基底）＝詞綴裡最高那一階的最低物品等級；還沒搬家的舊裝備照舊公式
const reqLv = (it) => { if (!it.bt) return Math.max(1, (it.il || 0) * 3 - 8); if (SLOTS[it.slot] && SLOTS[it.slot].acc && !it.u) { let r = 1; for (const k in it.aff || {}) { const i = affTierIdx(k, it.aff[k]); if (i >= 0) r = Math.max(r, TIER_LV[i]); } return r; } return BASE_REQ[it.bt - 1]; };
const reqMul = (it) => { const d = reqLv(it) - ((save.w && save.w.lv) || 1); return (d <= 0 ? 1 : Math.max(0.6, 1 - 0.04 * d)) * (typeof attrReqMul === "function" ? attrReqMul(it) : 1); };
const reqTag = (it) => (save.w && save.w.lv < reqLv(it) ? `<span class="rq">Lv${reqLv(it)}</span>` : typeof attrReqShort === "function" && attrReqShort(it) ? `<span class="rq">${TR_ATTR[attrReq(it)[0]].n}不足</span>` : "");
const reqLine = (it) => { const d = reqLv(it) - save.w.lv; return (typeof attrReqHtml === "function" ? attrReqHtml(it) : "") + (d > 0 ? `<div class="reqline">建議等級 ${reqLv(it)}・境界不足，只能發揮 ${Math.round(reqMul(it) * 100)}%（再升 ${d} 級完全發揮）</div>` : `<div class="reqline ok">建議等級 ${reqLv(it)}</div>`); };

// ───────── 精煉高段要素材（+7 以上稀有素材、+10 以上王素材）─────────
function zoneOfIl(il) { const lv = il * 3; let best = "grass"; for (const z of ["grass", "forest", "waste", "volcano", "snow", "swamp", "thunder", "sky"]) if (lv >= ZONES[z].lv[0]) best = z; return best; }
function enhNeed(it) {
  const n = (it.en || 0) + 1; if (n < 7) return null;
  const z = zoneOfIl(it.il || 0), need = { [MAT_Z[z][1]]: n - 5 };
  if (n >= 10) { const bz = { volcano: "b_volcano", snow: "b_volcano", swamp: "b_swamp", thunder: "b_thunder", sky: "b_sky" }[z] || "b_volcano"; need[bz] = n - 8; }
  return need;
}
const enhNeedTxt = (it) => { const nd = enhNeed(it); return nd ? `<br>${Object.keys(nd).map((k) => `${MATS[k].n} ${matN(k)}/${nd[k]}`).join("、")}` : ""; };

// ───────── 掉落 ─────────
const _killMobEc = killMob;
killMob = function (m) {
  const was = m.dead;
  _killMobEc.apply(this, arguments);
  if (was || !m.dead || !W0 || WMOBS[m.type].ai === "pillar") return;
  const zl = ZONE_LOOT[m.camp && m.camp.z] || 1, dm = 1 + (B.drop || 0), z = m.camp && m.camp.z;
  if (m.boss) {
    const k = m.rb || "volcano", bm = "b_" + k, n = m.R ? 2 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) wDrop({ kind: "mat", k: bm }, m);
    for (let i = 0; i < (m.R ? 2 : 3); i++) wDrop({ kind: "cur", c: "chaos" }, m);
    if (Math.random() < (m.R ? 0.1 : 0.2)) wDrop({ kind: "cur", c: "divine" }, m);
    if (m.R && Math.random() < 0.05) wDrop({ kind: "cur", c: "vaal" }, m);
    if (m.R && typeof RIFT !== "undefined" && RIFT) wDrop({ kind: "cur", c: randCur() }, m); // 企劃 50 B：秘境之主多掉 1 個（v9.4.1 第 10 層以上也只 1 個）
    return;
  }
  if (m.hunter) { for (let i = 0; i < 2; i++) wDrop({ kind: "cur", c: randCur() }, m); if (MAT_Z[z]) wDrop({ kind: "mat", k: MAT_Z[z][1] }, m); return; }
  const em = (m.elite ? 5 : 1) * (typeof RIFT !== "undefined" && RIFT ? 1 + 0.03 * (RIFT.tier || 0) : 1); // v5.8.1 企劃 bot 實測後下修（11 第 8 節）；企劃 50 B：秘境每層 +3%（v9.4.1，原本 5%）
  for (const k of CUR_KEYS) if (Math.random() < CUR[k].r * zl * em * dm) wDrop({ kind: "cur", c: k }, m);
  if (MAT_Z[z]) {
    if (Math.random() < 0.2 * dm) wDrop({ kind: "mat", k: MAT_Z[z][0] }, m);
    if (Math.random() < (m.elite ? 0.1 : 0.0025) * dm) wDrop({ kind: "mat", k: MAT_Z[z][1] }, m);
  }
};
function dropPick(o, p) {
  if (o.kind === "cur") {
    addCur(o.c); const C = CUR[o.c], hi = ["exalt", "divine", "vaal", "mirror"].includes(o.c);
    floatText(p.x, p.y - 16, `${C.n} +1`, C.c, hi || o.c === "chaos"); sfx(hi ? "win" : "arrive");
    if (o.c === "mirror" && typeof netAnnounce === "function") netAnnounce(`撿到了全服最稀有的太虛鏡！`);
  } else if (o.kind === "mat") {
    addMat(o.k); const tr = trackNeedOf(o.k);
    floatText(p.x, p.y - 16, `${MATS[o.k].n} +1${tr ? `（${matN(o.k)}/${tr}）` : ""}`, MATS[o.k].c, MATS[o.k].rare > 0); sfx("good");
    for (const id of (save.w.track || [])) { const r = recipe(id); if (r && r.need[o.k] && matHas(r.need) && !(W0.trackDone || {})[id]) { (W0.trackDone = W0.trackDone || {})[id] = 1; notice(`${r.n}：可以做了！回營地打開行囊 → 工藝`, "#ffe066"); sfx("win"); } }
  }
}
function dropDraw(o) {
  const by = o.y - 2 + Math.sin(time * 4 + o.x) * 1.5;
  if (o.kind === "cur") {
    const C = CUR[o.c], hi = o.c !== "gold" && o.c !== "regret";
    if (hi) { ctx.globalAlpha = 0.35; ctx.fillStyle = C.c; ctx.fillRect(o.x - 1, o.y - (o.c === "mirror" ? 60 : o.c === "divine" ? 40 : 24), 2, o.c === "mirror" ? 60 : o.c === "divine" ? 40 : 24); ctx.globalAlpha = 1; }
    if (!icoDrawS(ctx, "mat", o.c, o.x - 5.5, by - 5.5, 11, 11)) {
      ctx.fillStyle = "#1b1424"; ctx.beginPath(); ctx.arc(o.x, by, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.c; ctx.beginPath(); ctx.arc(o.x, by, 3.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.font = "bold 6px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = C.c; ctx.fillText(C.n, o.x, by - 7);
  } else {
    const M = MATS[o.k];
    if (!icoDrawS(ctx, "mat", o.k, o.x - 5, by - 5, 10, 10)) {
      ctx.fillStyle = "#1b1424"; ctx.fillRect(o.x - 3.5, by - 3.5, 7, 7);
      ctx.fillStyle = M.c; ctx.fillRect(o.x - 2.5, by - 2.5, 5, 5);
    }
    if (M.rare) { ctx.font = "bold 6px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = M.c; ctx.fillText(M.n, o.x, by - 6); }
  }
}

// ───────── 通貨打造（行囊右欄選了裝備）─────────
const lowTierTxt = (it) => (!it.u && it.q >= 2 && itLv(it) < 55 ? `這件最高只骰得到 ${tierName(tierTop(itLv(it)))}` : ""); // 企劃 50 C
function curBtns(it, camp) {
  if (it.cor) return "";
  const b = (id, k, label, ok, sub) => `<button id="${id}" ${camp && ok && curN(k) > 0 ? "" : "disabled"} style="--cc:${CUR[k].c}" class="curb">${label}<small>${CUR[k].n} ${curN(k)}${sub ? "・" + sub : ""}</small></button>`;
  const cap = AFF_CAP[it.q] || 0, cnt = { p: 0, s: 0 }; for (const k in it.aff || {}) if (AFFIX[k]) cnt[AFFIX[k].t] = (cnt[AFFIX[k].t] || 0) + 1;
  const room = cnt.p < cap || cnt.s < cap;
  return (!it.u && it.q < 2 ? b("cGold", "gold", "點金", true) : "")
    + (!it.u && it.q >= 1 ? b("cChaos", "chaos", "混元重骰", true, lowTierTxt(it)) : "")
    + (!it.u && it.q === 2 ? b("cExalt", "exalt", "淬靈加詞綴", room, room ? "" : "沒空位") : "")
    + (it.q >= 1 && Object.keys(it.aff || {}).length ? b("cDivine", "divine", "造化重骰數值", true, it.u ? "固定範圍" : lowTierTxt(it)) : "")
    + b("cVaal", "vaal", "渡劫", true)
    + (!it.u && !it.mir ? b("cMirror", "mirror", "太虛鏡複製", save.bag.length < BAG_MAX) : "");
}
function bindCur(it, again) {
  const on = (id, f) => { const e = document.getElementById(id); if (e) e.onclick = () => { if (!atCamp()) { again("回營地才能用鐵匠鋪"); return; } f(); }; };
  const done = (k, msg, s = "good") => { useCur(k); nameItem(it); writeSave(); sfx(s); if (W0) { B = worldStats(); W0.maxHp = B.maxHp; } again(msg); };
  on("cGold", () => { if (!curN("gold")) return; it.q++; if (it.bt) setBase(it); else it.base = SLOTS[it.slot].base === "crit" ? Math.round(it.base * 1.12 * 10) / 10 : Math.round(it.base * 1.12); rollAffixes(it, Math.max(RARITY[it.q].aff[0], Object.keys(it.aff).length + 1)); done("gold", `點金成功：${RARITY[it.q].n}裝`, "arrive"); });
  on("cChaos", () => { if (!curN("chaos")) return; const [a0, a1] = RARITY[it.q].aff; rollAffixes(it, a0 + Math.floor(Math.random() * (a1 - a0 + 1))); done("chaos", "混元重骰：詞綴全部換了"); });
  on("cExalt", () => {
    if (!curN("exalt")) return; const cap = AFF_CAP[it.q], cnt = { p: 0, s: 0 }; for (const k in it.aff) if (AFFIX[k]) cnt[AFFIX[k].t]++;
    const pool = Object.keys(AFFIX).filter((k) => (AFFIX[k].t === "p" || AFFIX[k].t === "s") && !(k in it.aff) && cnt[AFFIX[k].t] < cap);
    if (!pool.length) { again("沒有空位了"); return; }
    const k = pool[Math.floor(Math.random() * pool.length)]; it.aff[k] = rollAffVal(k, itLv(it)); done("exalt", `淬靈：多了「${AFFIX[k].n}」`, "arrive");
  });
  on("cDivine", () => { if (!curN("divine")) return; const F = it.u && UQ_FIX[it.u]; for (const k in it.aff) { if (!AFFIX[k] || !AFF_T[k] || it.jie === k) continue; if (F) { if (!F.aff[k]) continue; const [lo, hi] = F.aff[k], v = lo + Math.random() * (hi - lo); it.aff[k] = AFFIX[k].dec ? Math.round(v * 10) / 10 : Math.round(v); } else it.aff[k] = rollAffVal(k, itLv(it)); } done("divine", "造化：數值重骰了"); }); // 傳說只在自己的固定範圍裡骰
  on("cVaal", () => {
    if (!curN("vaal")) return; const r = Math.random();
    if (r < 0.25) { it.cor = 1; done("vaal", "渡劫：什麼都沒發生（已渡劫，不能再改）", "click"); }
    else if (r < 0.5) { const pool = Object.keys(AFFIX).filter((k) => (AFFIX[k].t === "p" || AFFIX[k].t === "s") && AFFIX[k].hi && !(k in (it.aff || {}))); const k = pool[Math.floor(Math.random() * pool.length)]; it.aff = it.aff || {}; it.aff[k] = Math.round(AFF_T[k][tierTop(itLv(it))][1] * 1.3 * (AFFIX[k].dec ? 10 : 1)) / (AFFIX[k].dec ? 10 : 1); it.jie = k; it.cor = 1; done("vaal", `渡劫成功！劫紋「${AFFIX[k].n}」`, "win"); if (typeof netAnnounce === "function") netAnnounce(`渡劫成功，得到劫紋「${AFFIX[k].n}」！`); }
    else if (r < 0.75) { if (!it.u) { const [a0, a1] = RARITY[it.q].aff; rollAffixes(it, a0 + Math.floor(Math.random() * (a1 - a0 + 1))); } it.cor = 1; done("vaal", "渡劫：詞綴全部重洗了", "arrive"); }
    else { useCur("vaal"); ungem(it); save.bag = save.bag.filter((b) => b !== it); for (const k of SLOT_KEYS) if (save.eq[k] === it) delete save.eq[k]; if (save.w.ws) save.w.ws = save.w.ws.map((b) => (b === it ? null : b)); eqSel = null; writeSave(); sfx("hurt"); if (W0) { B = worldStats(); W0.maxHp = B.maxHp; } again(`渡劫失敗⋯⋯${it.name}碎掉了`); }
  });
  on("cMirror", () => { if (!curN("mirror") || save.bag.length >= BAG_MAX) return; const c = JSON.parse(JSON.stringify(it)); c.id = "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); c.mir = 1; it.mir = 1; c.so = []; delete c.risk; save.bag.push(c); done("mirror", "太虛鏡：複製了一件（鏡影）", "win"); });
}

// ───────── 工藝分頁：兌換台／鍛造／煉丹／追蹤 ─────────
function econHtml(camp) {
  const tabs = [["forge", "鍛造"], ["pill", "煉丹"], ["exch", "兌換"]];
  return `<div class="econ">${curRow()}<div class="btabs">${tabs.map(([k, n]) => `<button class="btab${econTab === k ? " on" : ""}" data-et="${k}">${n}</button>`).join("")}</div>${econBody(econTab, camp)}</div>`;
}
const curRow = () => `<div class="curs">${CUR_KEYS.map((k) => `<span class="curc" style="--cc:${CUR[k].c}" title="${CUR[k].d}">${ico("mat", k, "curico") || CUR[k].g}<b>${curN(k)}</b></span>`).join("")}</div>`;
function econBody(econTab, camp) {
  let body = "";
  const row = (r, btn) => { const ok = matHas(r.need), tr = (save.w.track || []).includes(r.id); return `<div class="rcp${ok ? " ok" : ""}">${r.kind === "pill" && r.b ? ico("mat", r.b, "rcpico") : ""}<div><b>${r.n}</b><small>${matTxt(r.need)}</small></div><button data-trk="${r.id}" class="trk${tr ? " on" : ""}" title="追蹤（最多 2 個）"><svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M10.5 1 15 5.5l-1.4 1.4-1-.5-2.6 2.6.3 3.1L9 13.4 6.1 10.5 2 14.6 1.4 14l4.1-4.1L2.6 7l1.3-1.3 3.1.3L9.6 3.4l-.5-1z"/></svg></button>${btn(ok)}</div>`; };
  if (econTab === "forge") {
    const affs = Object.keys(AFFIX).filter((k) => AFFIX[k].t === "p" || AFFIX[k].t === "s");
    body = `<div class="fsel"><select id="fSlot">${SLOT_KEYS.filter(slotOpen).map((k) => `<option value="${k}"${forgeSlot === k ? " selected" : ""}>${k === "sword" ? WEAPONS[curWeapon()].n : SLOTS[k].n}</option>`).join("")}</select><select id="fAff">${affs.map((k) => `<option value="${k}"${forgeAff === k ? " selected" : ""}>保底：${AFFIX[k].n}</option>`).join("")}</select></div>`
      + RECIPES.filter((r) => r.kind === "slot" || r.kind === "forge").filter((r) => r.kind === "forge" || Object.keys(r.need).some((k) => k !== "stone" && matN(k) > 0) || save.w.wp.includes(r.z)).map((r) => row(r, (ok) => `<button data-rcp="${r.id}" ${camp && ok ? "" : "disabled"}>鍛造</button>`)).join("");
  } else if (econTab === "pill") {
    const bf = save.w.buffs || {};
    body = RECIPES.filter((r) => r.kind === "pill").map((r) => row(r, (ok) => `<button data-rcp="${r.id}" ${camp && ok ? "" : "disabled"}>煉丹${bf[r.b] > Date.now() ? `<small>剩 ${Math.ceil((bf[r.b] - Date.now()) / 60000)} 分</small>` : ""}</button>`)).join("")
      + `<p class="dim">吃了 30 分鐘有效（關掉遊戲也照算時間），同一種再吃會重新計時。王的難度照不吃丹設計。</p>`;
  } else {
    const lv = save.w.lv, pg = 150 + lv * 4, pc = 800 + lv * 20;
    body = `<div class="rcp"><div><b>3 點金符 → 1 混元石</b></div><button data-ex2="g2c" ${camp && curN("gold") >= 3 ? "" : "disabled"}>換</button></div>
      <div class="rcp"><div><b>20 混元石 → 1 淬靈石</b></div><button data-ex2="c2e" ${camp && curN("chaos") >= 20 ? "" : "disabled"}>換</button></div>
      <div class="rcp"><div><b>60 混元石 → 1 造化玉</b></div><button data-ex2="c2d" ${camp && curN("chaos") >= 60 ? "" : "disabled"}>換</button></div>
      <div class="rcp"><div><b>買點金符</b><small>${pg} 靈石</small></div><button data-ex2="bg" data-p="${pg}" ${camp && save.stone >= pg ? "" : "disabled"}>買</button></div>
      <div class="rcp"><div><b>買混元石</b><small>${pc} 靈石</small></div><button data-ex2="bc" data-p="${pc}" ${camp && save.stone >= pc ? "" : "disabled"}>買</button></div>
      ${RECIPES.filter((r) => r.kind === "key").map((r) => row(r, (ok) => `<button data-rcp="${r.id}" ${camp && ok ? "" : "disabled"}>做鑰匙</button>`)).join("")}
      <p class="dim">往上換很虧，撿到高階通貨還是賺。素材不能換通貨。</p>`;
  }
  return body;
}
function bindEcon(again) {
  ov.querySelectorAll("[data-et]").forEach((b) => b.addEventListener("click", () => { sfx("click"); econTab = b.dataset.et; again(); }));
  const fs = document.getElementById("fSlot"), fa = document.getElementById("fAff");
  if (fs) fs.onchange = () => { forgeSlot = fs.value; }; if (fa) fa.onchange = () => { forgeAff = fa.value; };
  ov.querySelectorAll("[data-trk]").forEach((b) => b.addEventListener("click", (e) => {
    e.stopPropagation(); sfx("click"); const w = save.w; w.track = w.track || []; const id = b.dataset.trk;
    if (w.track.includes(id)) w.track = w.track.filter((x) => x !== id); else { w.track.push(id); if (w.track.length > 2) w.track.shift(); }
    if (W0 && W0.trackDone) delete W0.trackDone[id]; writeSave(); again(w.track.includes(id) ? "追蹤中：左上任務欄下面會顯示進度" : "取消追蹤");
  }));
  ov.querySelectorAll("[data-rcp]").forEach((b) => b.addEventListener("click", () => {
    if (!atCamp()) { again("回營地才能用"); return; }
    const r = recipe(b.dataset.rcp); if (!r || !matHas(r.need)) return;
    if ((r.kind === "forge" || r.kind === "slot") && !bagRoomAny()) { again("行囊和倉庫都滿了"); return; }
    matUse(r.need);
    if (r.kind === "forge") { const it = rbUnique(r.u, Math.floor(r.lv / 3) + 2); bagAdd(it); sfx("win"); again(`鍛造成功：${it.name}`); }
    else if (r.kind === "slot") { const it = shardItem(forgeSlot, 2); it.il = zoneIl(r.z); it.lvI = Math.round((ZONES[r.z].lv[0] + ZONES[r.z].lv[1]) / 2); it.bt = pickBt(it.lvI); setBase(it); rollAffixes(it, 4 + Math.floor(Math.random() * 2), forgeAff, true); nameItem(it); delete it.risk; bagAdd(it); sfx("arrive"); again(`鍛造成功：${it.name}（保底 ${AFFIX[forgeAff].n}）`); }
    else if (r.kind === "pill") { const w = save.w; w.buffs = w.buffs || {}; w.buffs[r.b] = Date.now() + BUFF_MS; if (W0) { B = worldStats(); } sfx("heal"); again(`吃下${BUFFS[r.b].n}：${BUFFS[r.b].d}，30 分鐘`); }
    else if (r.kind === "key") { addKey(makeKey(keyTierFor(Math.round((ZONES[r.z].lv[0] + ZONES[r.z].lv[1]) / 2)))); sfx("arrive"); again("做好一把秘境鑰"); }
    if (W0 && W0.trackDone) delete W0.trackDone[r.id];
    writeSave();
  }));
  ov.querySelectorAll("[data-ex2]").forEach((b) => b.addEventListener("click", () => {
    if (!atCamp()) { again("回營地才能用"); return; }
    const k = b.dataset.ex2, p = +b.dataset.p || 0;
    if (k === "g2c" && useCur("gold", 3)) addCur("chaos");
    else if (k === "c2e" && useCur("chaos", 20)) addCur("exalt");
    else if (k === "c2d" && useCur("chaos", 60)) addCur("divine");
    else if (k === "bg" && save.stone >= p) { save.stone -= p; addCur("gold"); }
    else if (k === "bc" && save.stone >= p) { save.stone -= p; addCur("chaos"); }
    else return;
    writeSave(); sfx("good"); again("換好了");
  }));
}

// ───────── 增益丹效果 ─────────
const buffOn = (k) => !!(save.w && save.w.buffs && save.w.buffs[k] > Date.now());
const _worldStatsEc = worldStats;
worldStats = function () { const b = _worldStatsEc.apply(this, arguments); if (buffOn("atkup")) b.inc += 0.1; if (buffOn("dropup")) b.drop = (b.drop || 0) + 0.15; return b; };
const _gainExpEc = gainExp;
gainExp = function (n) { return _gainExpEc.call(this, buffOn("expup") ? Math.round(n * 1.2) : n); };
// 避火／避寒／避雷／避毒丹：world.js 的 effRes 直接加抗性（企劃 22）
// 狀態圖示欄（hud2.js）加增益丹
if (typeof STATUS !== "undefined") for (const k in BUFFS) STATUS.push({ k: "b_" + k, g: BUFFS[k].g, c: BUFFS[k].c, on: () => buffOn(k), sub: () => { const t = (save.w.buffs[k] - Date.now()) / 1000; return t > 600 ? 0 : t; }, txt: () => "" });
// 追蹤配方：左上任務欄下面
const _drawWorldHudEc = drawWorldHud;
drawWorldHud = function () {
  _drawWorldHudEc.apply(this, arguments);
  const tr = (save.w && save.w.track) || []; if (!tr.length || (typeof RIFT !== "undefined" && RIFT)) return;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const x0 = 10 + SAFE.l, qw = Math.min(190, W * 0.46);
  let y = 10 + SAFE.t + (curQuest() ? 94 : 50) + (riskyItems().length ? 22 : 0);
  for (const id of tr) {
    const r = recipe(id); if (!r) continue; const ok = matHas(r.need);
    const parts = Object.keys(r.need).filter((k) => k !== "stone").map((k) => `${MATS[k].n} ${Math.min(matN(k), r.need[k])}/${r.need[k]}`).join("、");
    ctx.fillStyle = ok ? "rgba(60,50,10,0.78)" : "rgba(10,8,18,0.7)"; ctx.fillRect(x0, y, qw, 28);
    ctx.fillStyle = ok ? "#ffe066" : "#c8a8ff"; ctx.fillRect(x0, y, 3, 28);
    ctx.textAlign = "left"; ctx.font = "bold 9px 'Noto Sans TC', sans-serif"; ctx.fillStyle = ok ? "#ffe066" : "#e8d8ff"; ctx.fillText(`追蹤 ${r.n}${ok ? "　可以做了！" : ""}`, x0 + 7, y + 11);
    ctx.font = "8px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#cfc4dc"; ctx.fillText(parts.length > 34 ? parts.slice(0, 34) + "…" : parts, x0 + 7, y + 23);
    y += 31;
  }
};
const trackNeedOf = (k) => { for (const id of (save.w.track || [])) { const r = recipe(id); if (r && r.need[k]) return r.need[k]; } return 0; };
// 舊存檔：送一小包素材（各區一般素材 ×10），讓大家看得到這個系統
setInterval(() => { if (save.w && save.w.created && !save.matGift) { save.matGift = 1; for (const z in MAT_Z) addMat(MAT_Z[z][0], 10); addCur("gold", 3); addCur("chaos", 1); writeSave(); if (W0 && inWorld) notice("新系統：素材與通貨！送你一包（行囊 → 素材／道具）", "#ffe066"); } }, 3000);
