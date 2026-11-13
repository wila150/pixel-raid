// 企劃 72：冷卻照強度、冷卻恢復速度（world.js cdFull／cdrOf）、輔助寶石孔看等級、自動欄（觸發寶石）、技能寶石視窗的每秒傷害／真氣／冷卻
// SK_RAW[武器][類][招] = [基礎冷卻（普攻類＝出手間隔）, 價值（以這把武器原本普攻一下＝1）]
// 怎麼來的：bot（Lv.100 三轉、全身最高階玄品、沒爆擊）量每一招放一次打 1 隻／10 隻的總傷害 D1／D10，
//   價值 V＝D1×(1＋0.15×min(9, D10/D1−1))，位移 ×0.8、控場 ×1.2、有增益／回血 ×1.5；增益類（霸體、詛咒、時緩、金鐘罩、天風壁、戰吼、風遁）企劃給秒數
//   每把武器用自己原本的 Q／普攻當基準（保留武器之間原本的平衡），再乘全域係數 0.571（E 不用集能量後，原本的 Q＋E 每秒總量不變）
"use strict";
const SK_RAW = {sword:{a:{base:[0.3,1],dance:[0.52,1.72],ray:[0.37,1.24],break:[0.67,2.23]},q:{base:[1.23,4.56],wan:[0.9,3.36],boom:[1.49,5.53],rush:[1.45,5.39]},e:{base:[1.22,4.55],array:[17.15,63.78],cold:[3.47,12.91],domain:[2.54,9.43],storm:[5.61,20.86],nova:[17.24,64.12],judg:[3.98,14.79]}},staff:{a:{base:[0.42,1],split:[0.47,1.13],frost:[1.32,3.14],burst:[1.25,2.97]},q:{base:[1.93,16.47],shower:[2.36,20.21],doom:[3.6,30.78],wall:[6.97,59.63]},e:{base:[0.39,3.38],curse:[10,0],tstorm:[1.73,14.82],hole:[2.18,18.61],tslow:[12,0],chainl:[1.33,11.37],inferno:[11.07,94.73]}},bow:{a:{base:[0.2,1],tri3:[0.23,1.16],home:[0.23,1.17],snipe:[1.24,6.19]},q:{base:[1.4,4.31],rain:[1.42,4.37],refr:[1.4,4.31],swal:[0.84,2.59]},e:{base:[4.54,13.98],blast:[5.17,15.91],turret:[4.08,12.56],trap:[2.06,6.34],barr:[9.88,30.41],seekr:[3.03,9.32],star:[3.15,9.68]}},blade:{a:{base:[0.55,1],sweep:[0.58,1.06],quake:[1.06,1.93],crack:[0.53,0.97]},q:{base:[2.1,4],gale:[2.62,4.98],whirl:[2.87,5.45],leap:[1.55,2.96]},e:{base:[1.19,2.26],tthrow:[0.86,1.63],blades:[2.59,4.92],titan:[12,0],cyclone:[2.35,4.47],roar:[10,0.71],exec:[2.75,5.24]}},fist:{a:{base:[0.15,1],lean:[0.21,1.41],inch:[0.12,0.82],qi:[0.07,0.37],sanshou:[0.18,1.18]},q:{base:[1.58,8.49],chain:[1.43,7.7],tiger:[1.31,7.05],roar:[1.29,6.93],throw:[1.42,7.67]},e:{base:[0.99,5.35],gbell:[12,0],thous:[1.18,6.33],dragf:[10.67,57.47],grab:[1.35,7.27],dragon:[2.58,13.89],gong:[1.93,10.4]}},fan:{a:{base:[0.45,1],twin:[0.43,0.96],gust:[0.37,0.82],spring:[0.45,1]},q:{base:[2.63,6.35],suck:[3.28,7.94],storm:[2.18,5.26],ward:[2.35,5.7]},e:{base:[0.65,1.57],crane:[0.79,1.91],petal:[1.74,4.21],wwall:[12,0],typh:[3.2,7.73],bloom:[1.2,2.91],stealth:[10,0.69]}}};
const SK_CD = {}, SK_VR = {};
for (const wt in SK_RAW) { SK_CD[wt] = {}; SK_VR[wt] = {}; for (const c in SK_RAW[wt]) { SK_CD[wt][c] = {}; SK_VR[wt][c] = {}; for (const k in SK_RAW[wt][c]) { SK_CD[wt][c][k] = SK_RAW[wt][c][k][0]; SK_VR[wt][c][k] = SK_RAW[wt][c][k][1]; } } }
const skBaseMp = (wt, cd) => Math.max(1, Math.round(WSKILLS[wt].spin[2] * Math.sqrt(cd / SK_CD[wt].q.base) * mpLvMul()));
function skCostTxt(wt, c, k) { // 招式卡上的冷卻、真氣
  if (c === "e" && (k === "origin" || k === "uq")) { const [cd, m] = eCost(k); return `冷卻 ${cd} 秒・真氣 ${Math.round(WSKILLS[wt].spin[2] * m * mpLvMul())}`; }
  const T = SK_CD[wt] && SK_CD[wt][c], cd = T && T[k || "base"];
  if (cd === undefined) return "";
  if (c === "a") return `出手間隔 ${cd} 秒（吃攻速）`;
  return `冷卻 ${cd} 秒・真氣 ${skBaseMp(wt, cd)}`;
}
const SLK72 = Object.assign({ o: "ult" }, SLOT_KEY);
function slotStat(sl) { // 這一格：約每秒傷害、真氣、冷卻（含冷卻恢復速度、tick 檔位）
  const wt = curWeapon(), pk = slotPick(wt, sl), k = pk.k || "base", S = WSKILL[SLK72[sl]];
  if (!S || !SK_CD[wt]) return "";
  const vr = (SK_VR[wt][pk.c] || {})[k], base = SK_CD[wt][pk.c] && SK_CD[wt][pk.c][k];
  let cdE, txt;
  if (pk.c === "a") { cdE = Math.max(0.07, (base || S.cd) / ((B.aspd || 1) * eAspd())); txt = `出手間隔 ${cdE.toFixed(2)} 秒`; }
  else if (sl === "o") { cdE = Math.max(4 * TICK, tickUp(1 / (1 + cdrAll()))); txt = `觸發間隔 ${cdE.toFixed(2)} 秒`; }
  else {
    const r = cdrOf(SLK72[sl]), b0 = S.cd; cdE = Math.max(0.2, tickUp(b0 / (1 + r)));
    txt = `冷卻 ${cdE.toFixed(2)} 秒`;
    if (cdE < 2 && cdE > 0.2 + 1e-6) { const n = Math.round(cdE / TICK), need = b0 / ((n - 1) * TICK) - 1 - r; txt += `<small class="tick">（${n} tick；再 +${Math.max(1, Math.ceil(need * 100))}% 冷卻恢復 → ${n - 1} tick）</small>`; }
  }
  const mp = sl === "o" ? Math.round(TRIG_MP * chainMpMul("o") * mpLvMul()) : pk.c === "a" ? (S.mpS ? Math.round(S.mpS) + "/秒" : 0) : Math.round(S.mp * (1 - (B.mpCut || 0)));
  let dps = "";
  if (vr && typeof cpParts === "function") { const P = cpParts(B), bi = SK_CD[wt].a.base / ((B.aspd || 1) * eAspd()); if (P) dps = `約 ${typeof fmtN === "function" ? fmtN(P.dps * bi * vr / cdE * (CHAIN_DMS[sl] || 1)) : Math.round(P.dps * bi * vr / cdE)}/秒`; }
  else if (vr === 0) dps = "輔助（不打傷害）";
  return `<span class="sgstat">${dps ? `每秒傷害 <b>${dps}</b>・` : ""}真氣 <b>${mp}</b>・${txt}</span>`;
}
// 自動欄：Lv.40 開，放一招＋觸發寶石（暴擊時／受傷時），那招就自動放
const AUTO_LV = 40;
const autoSlotOn = () => !!(save.w && wLv() >= AUTO_LV && /^[aqe]:/.test(triRaw(curWeapon(), "o")) && chainRow("o").some((g) => g && /^trig[ch]:/.test(g)));
function autoRowHtml() {
  const wt = curWeapon(), lv = wLv();
  if (lv < AUTO_LV) return `<div class="trirow auto lock"><div class="trihead"><b>自動</b><small>Lv.${AUTO_LV} 開放：放一招＋觸發寶石（暴擊時／受傷時），那招就自動放，不用按鍵</small></div></div>`;
  const raw = triRaw(wt, "o"), pk = /^[aqe]:/.test(raw) ? slotPick(wt, "o") : null;
  const name = pk ? pickName(wt, pk.c, pk.c === "e" ? pk.k || "base" : pk.k) : "還沒放招";
  const trig = chainRow("o").some((g) => g && /^trig[ch]:/.test(g));
  return `<div class="trirow auto"><div class="trihead"><b>自動</b><small>放一招＋觸發寶石（暴擊時／受傷時）＝自動放，不佔按鍵${pk && !trig ? '・<b style="color:#ff9a7a">還沒串觸發寶石，不會自動放</b>' : ""}</small>${pk ? slotStat("o") : ""}</div>
    <div class="tricards c4"><button class="tricard on" data-pool="o"><b>${pk ? skIco(wt, pk.c, pk.k === "base" ? "" : pk.k, "tico") : ""}${name}</b><small>點這裡換招</small></button></div>${chainCells("o")}</div>`;
}
const _renderTri72 = renderTri;
renderTri = function () { // eslint-disable-line no-func-assign
  let h = _renderTri72.apply(this, arguments);
  for (const [sl, n] of [["a", "左鍵"], ["q", "Q"], ["e", "E"]]) h = h.replace(`<div class="trihead"><b>${n}</b><small>`, (m) => `<div class="trihead"><b>${n}</b>${(() => { try { return slotStat(sl); } catch (e) { return ""; } })()}<small>`);
  const at = h.lastIndexOf('<div class="trirow"><div class="trihead"><b>' + TRI_LAYER_N.r);
  if (at >= 0) h = h.slice(0, at) + autoRowHtml() + h.slice(at);
  return h.replace('<div class="trilist">', '<div class="trilist sgw">');
};
// 舊存檔：E 列的觸發寶石搬到自動欄，自動欄放原本 E 那招（每個角色一次）
function trigMig72() {
  const w = save.w; if (!w || w.trig72) return; w.trig72 = 1;
  let moved = 0;
  for (const wt in w.chain || {}) { if (wt === "r") continue; const C = w.chain[wt]; if (!C || !C.e) continue;
    const keep = [], go = []; for (const g of C.e) (g && /^trig[ch]:/.test(g) ? go : keep).push(g);
    if (!go.length) continue;
    C.e = keep; C.o = (C.o || []).concat(go); moved += go.length;
    if (!w.tri) w.tri = {}; if (!w.tri[wt]) w.tri[wt] = {};
    if (!w.tri[wt].o) { const pk = slotPick(wt, "e"); w.tri[wt].o = "e:" + (pk.k || "base"); }
  }
  if (moved) { writeSave(); if (typeof notice === "function") notice(`觸發寶石搬到新的「自動」欄了（技能頁），自動欄放的是你原本的 E 招${wLv() < AUTO_LV ? `；自動欄 Lv.${AUTO_LV} 開放` : ""}`, "#c8a0ff"); }
}
const _enterWorld72 = enterWorld;
enterWorld = function () { const r = _enterWorld72.apply(this, arguments); try { trigMig72(); } catch (e) {} if (typeof applyWeapon === "function") applyWeapon(); return r; }; // eslint-disable-line no-func-assign
applyWeapon();
