// 11/13 技能寶石面板（照 Slay Monsters 的排法，美術用自己的）：左邊技能欄 左鍵／1～5＋被動欄（空白身法、自動），右邊寶石袋
// 先點寶石袋的寶石再點欄位放進去（或直接點欄位挑）；右鍵拿下；寶石袋右鍵＝自動放
"use strict";
let sgSel = null, sgTab = "all", sgSort = "col", sgFocus = null;
const SG_ROWS = SLOTS6;
const SG_COLC = { str: "#ff6b6b", agi: "#7dff8a", wis: "#6ab8ff" };
const sgWtCol = (wt) => SG_COLC[(typeof TR_WMAIN !== "undefined" && TR_WMAIN[wt]) || "agi"] || "#e8dcc0";
function sgSkillList(wt) { // 寶石袋裡的技能寶石：這把武器已經能用的招＋身法
  const out = [];
  for (const x of triPoolList(wt)) {
    const k = x.spec ? x.k : x.k === "base" ? "" : x.k;
    const open = x.c === "e" && (k === "" || x.spec) ? wLv() >= E_LV : !k || triOpen(wt, x.c, k);
    if (!open) continue;
    out.push({ t: "s", c: x.c, k: x.k || "", n: x.n, d: x.d, need: x.need || 1, spec: x.spec, col: sgWtCol(wt), key: x.spec ? null : skgKey(wt, x.c, k) });
  }
  out.push({ t: "r", c: "r", k: "", n: "閃身", d: TRI_BASE_D.r, need: 1, col: "#cfe8ff", key: skgKey(wt, "r", "") });
  (TRI.r || []).forEach((o) => { if (triOpen(wt, "r", o.k)) out.push({ t: "r", c: "r", k: o.k, n: o.n, d: o.d, need: 1, col: "#cfe8ff", key: skgKey(wt, "r", o.k) }); });
  return out;
}
function sgWhere(x, wt) { // 這顆技能寶石放在哪一格
  if (x.t === "r") return (triOf(wt, "r") || "") === x.k ? "r" : null;
  const want = { c: x.c, k: x.c === "e" ? x.k || "base" : x.k };
  return SG_ROWS.concat(["o"]).find((s) => { const pk = slotPick(wt, s); return pk.c && pickEq(pk, want); }) || null;
}
const sgLvOf = (x) => (x.key && typeof skgLv === "function" ? skgLv(x.key) : 0);
function sgPouch(wt) {
  let items = [];
  if (sgTab !== "sup") items = items.concat(sgSkillList(wt));
  if (sgTab !== "skill") for (const g in save.gems || {}) if (save.gems[g] > 0) items.push({ t: "g", g, n: gemName(g), d: gemDesc ? gemDesc(g) : "", col: gemCol(g)[1], lv: +g.split(":")[1], cnt: save.gems[g] });
  const lvOf = (x) => (x.t === "g" ? x.lv : sgLvOf(x));
  const colOrd = (x) => ["#ff6b6b", "#7dff8a", "#6ab8ff"].indexOf(x.col);
  items.sort(sgSort === "lv" ? (a, b) => lvOf(b) - lvOf(a) : sgSort === "name" ? (a, b) => a.n.localeCompare(b.n, "zh-Hant") : (a, b) => (a.t === "g") - (b.t === "g") || colOrd(a) - colOrd(b) || lvOf(b) - lvOf(a));
  return items;
}
const sgItemId = (x) => (x.t === "g" ? "g:" + x.g : x.t + ":" + x.c + ":" + (x.k || ""));
function sgCell(x, wt) {
  const id = sgItemId(x), on = sgSel && sgSel.id === id, at = x.t === "g" ? null : sgWhere(x, wt);
  const ic = x.t === "g" ? gemIco(x.g, "sgpi") : x.spec ? `<b class="sgtxt">${x.n.slice(0, 2)}</b>` : skIco(x.t === "r" ? "" : wt, x.t === "r" ? "r" : x.c, x.k === "base" ? "" : x.k, "sgpi") || `<b class="sgtxt">${x.n.slice(0, 2)}</b>`;
  const lv = x.t === "g" ? x.lv : sgLvOf(x);
  return `<button class="sgc${x.t === "g" ? " sup" : " act"}${on ? " on" : ""}${at ? " used" : ""}" data-sgi="${id}" style="--c:${x.col}" title="${x.n}">${ic}${lv ? `<i class="sglv">${lv}</i>` : ""}${x.cnt > 1 ? `<i class="sgcnt">×${x.cnt}</i>` : ""}${at ? `<i class="sgat">${SLOT_N[at]}</i>` : ""}</button>`;
}
function sgRow(sl, wt) {
  const isR = sl === "r", isO = sl === "o";
  const lockLv = isO ? AUTO_LV : SLOT_LV[sl] || 1, locked = wLv() < lockLv;
  const label = isR ? "空白" : SLOT_N[sl];
  if (locked) return `<div class="sgrow lock"><span class="sgkey">${label}</span><span class="sgcir lock">🔒</span><div class="sginfo"><b class="dim">這個欄位還沒有解鎖</b><small>Lv.${lockLv} 開放</small></div></div>`;
  const pk = isR ? { c: "r", k: triOf(wt, "r") || "" } : slotPick(wt, sl);
  const has = isR || !!pk.c;
  const k = isR ? pk.k : pk.k === "base" ? "" : pk.k;
  const name = isR ? (WSKILL.roll.n || "閃身") : has ? pickName(wt, pk.c, pk.c === "e" ? pk.k || "base" : pk.k) : "";
  const gk = has && pk.k !== "origin" && pk.k !== "uq" ? skgKey(wt, isR ? "r" : pk.c, k) : null, glv = gk && typeof skgLv === "function" ? skgLv(gk) : 0;
  const ic = !has ? "＋" : (pk.k === "origin" || pk.k === "uq") ? `<b class="sgtxt">${name.slice(0, 2)}</b>` : skIco(isR ? "" : wt, isR ? "r" : pk.c, k, "sgci") || `<b class="sgtxt">${name.slice(0, 2)}</b>`;
  const gems = chainRow(sl).filter(Boolean).map((g) => GEMS[g.split(":")[0]].n);
  let stat = "";
  try { stat = isR ? `<span class="sgstat">冷卻 <b>${cdFull("roll").toFixed(2)} 秒</b></span>` : has ? slotStat(sl) : ""; } catch (e) { stat = ""; }
  const sel = sgSel && sgSel.t !== "g" && ((sgSel.t === "r") === isR) ? " target" : "";
  const sub = isO ? (has && !chainRow("o").some((g) => g && /^trig[ch]:/.test(g)) ? `<small class="warn">還沒串觸發寶石（暴擊時／受傷時），不會自動放</small>` : `<small>放一招＋觸發寶石＝暴擊或受傷時自動放</small>`) : "";
  return `<div class="sgrow${sgFocus === sl ? " focus" : ""}" data-row="${sl}"><span class="sgkey">${label}</span>
    <button class="sgcir${has ? "" : " empty"}${sel}" data-sgc="${sl}" title="${has ? name + "：點一下換招，右鍵拿下" : "空的技能欄：點一下挑技能"}">${ic}${glv ? `<i class="sglv">${glv}</i>` : ""}</button>
    <div class="sgsock">${chainCells(sl)}</div>
    <div class="sginfo">${has ? `<b>${name}${glv ? ` <small>Lv${glv}</small>` : ""}</b>${stat}<small class="dim">${gems.length ? "輔助：" + gems.join("、") : "沒有輔助寶石"}</small>` : `<b class="dim">空的技能欄</b><small>從寶石袋拿一顆技能寶石放進來</small>`}${sub}</div></div>`;
}
const _renderTriOld = renderTri;
renderTri = function (msg = "") { // eslint-disable-line no-func-assign
  const wt = curWeapon(), why = triSwapWhy();
  if (save.w) save.w.triSeen = Math.max(save.w.triSeen || 1, wLv());
  const items = sgPouch(wt), selX = sgSel && items.find((x) => sgItemId(x) === sgSel.id);
  if (sgSel && !selX && !(sgSel.t === "g" && save.gems[sgSel.g] > 0)) sgSel = null;
  const hint = sgSel ? `已選擇「${sgSel.n}」：點一個${sgSel.t === "g" ? "輔助寶石的空孔" : sgSel.t === "r" ? "身法（空白）欄" : "技能欄的圓圈"}放進去・再點一次寶石取消` : `把右邊寶石袋的寶石放進欄位（先點寶石再點欄位，或直接點欄位挑）・右鍵拿下${why ? `・<b class="warn">${why}</b>` : ""}`;
  const cells = items.map((x) => sgCell(x, wt)), n = Math.max(30, Math.ceil(cells.length / 6) * 6); while (cells.length < n) cells.push('<span class="sgc blank"></span>');
  const info = selX ? `<div class="sgdesc" style="--c:${selX.col}"><b>${selX.n}</b><small>${selX.t === "g" ? GEM_TYPE + "・" + gemCol(selX.g)[0] + "・Lv." + gemReq(selX.g) : selX.t === "r" ? "身法技能寶石" : (CLS_N[selX.c] || "") + "技能寶石"}</small><p>${String(selX.d || "").replace(/\n/g, "<br>")}</p>${selX.t === "g" && selX.cnt >= 3 && selX.lv < GEM_MAX ? `<button class="gmerge" data-sgm="${selX.g}">3 合 1（升一級）</button>` : ""}</div>` : `<div class="sgdesc dim"><small>點寶石看說明。右鍵＝自動放進第一個能放的欄位。</small><small>更多技能寶石到營地的「技能商人」買；輔助寶石打怪會掉。</small></div>`;
  return `${msg ? `<div class="emsg">${msg}</div>` : ""}<div class="sgw2">
    <div class="sgl"><p class="sghint">${hint}</p>
      ${SG_ROWS.slice(0, 6).map((s) => sgRow(s, wt)).join("")}<div class="sgsec">第二頁（電腦 6～0 鍵；手機按「Ⅰ／Ⅱ」換頁）</div>${SG_ROWS.slice(6).map((s) => sgRow(s, wt)).join("")}
      <div class="sgsec">被動欄</div>${sgRow("r", wt)}${sgRow("o", wt)}</div>
    <div class="sgr"><div class="sgh"><b>寶石袋</b><small>${items.length}</small></div>
      <div class="sgtabs">${[["all", "全部"], ["skill", "技能"], ["sup", "輔助"]].map(([k, t]) => `<button data-sgt="${k}" class="${sgTab === k ? "on" : ""}">${t}</button>`).join("")}</div>
      <div class="sgsort"><span>排序</span>${[["col", "顏色"], ["lv", "等級"], ["name", "名稱"]].map(([k, t]) => `<button data-sgs="${k}" class="${sgSort === k ? "on" : ""}">${t}</button>`).join("")}</div>
      <div class="sggrid">${cells.join("")}</div>${info}
      <div class="sglegend"><span style="color:#ff6b6b">● 力量</span><span style="color:#7dff8a">● 敏捷</span><span style="color:#6ab8ff">● 智力</span></div></div>
  </div>${triPoolHtml()}${gemPopHtml()}`;
};
// 身法的招式池（triPoolHtml 原本只處理左鍵～5）
const _triPoolHtmlSg = triPoolHtml;
triPoolHtml = function () { // eslint-disable-line no-func-assign
  if (triPool !== "r") return _triPoolHtmlSg.apply(this, arguments);
  const wt = curWeapon(), cur = triOf(wt, "r") || "";
  const card = (k, n, d) => `<button class="tricard${cur === k ? " on" : ""}" data-tl="r" data-tc="r" data-tk="${k}" ${cur === k ? "disabled" : ""}><b>${skIco("", "r", k, "tico")}${n}</b><small>${d}</small></button>`;
  const L = [card("", "閃身", TRI_BASE_D.r)].concat((TRI.r || []).filter((o) => triOpen(wt, "r", o.k)).map((o) => card(o.k, o.n, o.d)));
  return `<div class="gpop tpop" data-tpop="1"><div class="gpbox"><div class="gphead"><b>身法（空白）要放哪一招</b><button class="gpx" data-tpx="1">✕</button></div><div class="gplist tplist">${L.join("")}</div></div></div>`;
};
function sgPlace(x, sl) { // 把寶石袋的技能寶石放進某格
  const wt = curWeapon(), why = triSwapWhy();
  if (why) { sfx("bad"); renderSkills(why); return; }
  if (x.t === "r") { triSet(wt, "r", x.k); sgSel = null; sfx("good"); renderSkills(`身法換成「${x.n}」`); return; }
  triSetPick(wt, sl, x.c, x.c === "e" ? x.k || "base" : x.k === "base" ? "" : x.k); sgSel = null; sfx("good");
  renderSkills(`${TRI_LAYER_N[sl]}放上「${x.n}」`);
}
function sgAutoSkill(x) {
  if (x.t === "r") { sgPlace(x, "r"); return; }
  const wt = curWeapon(), at = sgWhere(x, wt);
  if (at) { renderSkills(`「${x.n}」已經在${TRI_LAYER_N[at]}了`); return; }
  const sl = SLOT_NUM.find((s) => slotUnlocked(s) && !slotPick(wt, s).c) || null;
  if (!sl) { sfx("bad"); renderSkills("沒有空的技能欄了：點一個欄位換掉"); return; }
  sgPlace(x, sl);
}
function sgAutoGem(g) {
  const again = (m) => { writeSave(); setPadLabels(true); renderSkills(m); };
  for (const sl of SG_ROWS.concat(["o", "r"])) {
    if (sl !== "r" && (!slotPick(curWeapon(), sl).c || !slotUnlocked(sl))) continue;
    const row = chainRaw(sl); for (let i = 0; i < slotsN(); i++) if (!row[i] && !gemWhy(g, sl, i) && !gemCantMsg(g)) { triPick = { l: sl, i }; triPutGem(g, again); return; }
  }
  sfx("bad"); renderSkills("目前技能欄上沒有它能輔助的技能（或孔滿了）");
}
const _bindTriSg = bindTri;
bindTri = function () { // eslint-disable-line no-func-assign
  const box = ov.querySelector(".sgw2");
  if (box) { // 寶石袋、欄位：先處理「已選寶石」的情況（capture，擋掉原本的開選單）
    const again = (m) => { writeSave(); setPadLabels(true); renderSkills(m); };
    const wt = curWeapon(), items = sgPouch(wt), find = (id) => items.find((x) => sgItemId(x) === id);
    box.querySelectorAll("[data-sgi]").forEach((b) => {
      b.addEventListener("click", (e) => { e.stopPropagation(); const x = find(b.dataset.sgi); if (!x) return; sfx("click"); sgSel = sgSel && sgSel.id === b.dataset.sgi ? null : { id: b.dataset.sgi, t: x.t, n: x.n, g: x.g }; renderSkills(); });
      b.addEventListener("contextmenu", (e) => { e.preventDefault(); e.stopPropagation(); const x = find(b.dataset.sgi); if (!x) return; if (x.t === "g") sgAutoGem(x.g); else sgAutoSkill(x); });
    });
    box.querySelectorAll("[data-sgt]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); sgTab = b.dataset.sgt; sfx("click"); renderSkills(); }));
    box.querySelectorAll("[data-sgs]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); sgSort = b.dataset.sgs; sfx("click"); renderSkills(); }));
    box.querySelectorAll("[data-sgm]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); triMergeGem(b.dataset.sgm, again); }));
    box.querySelectorAll("[data-sgc]").forEach((b) => {
      const sl = b.dataset.sgc;
      b.addEventListener("click", (e) => {
        e.stopPropagation(); sgFocus = sl;
        const x = sgSel && sgSel.t !== "g" ? find(sgSel.id) : null;
        if (x && (x.t === "r") === (sl === "r")) { sgPlace(x, sl); return; }
        sfx("click"); triPool = sl; poolTab = "all"; renderSkills();
      });
      b.addEventListener("contextmenu", (e) => {
        e.preventDefault(); e.stopPropagation();
        if (sl === "a" || sl === "r") { renderSkills(sl === "a" ? "左鍵一定要有技能（點一下換招）" : "身法一定要有一招（點一下換）"); return; }
        const why = triSwapWhy(); if (why) { sfx("bad"); renderSkills(why); return; }
        const w = save.w; if (!w.tri) w.tri = {}; if (!w.tri[wt]) w.tri[wt] = {}; w.tri[wt][sl] = "none"; writeSave(); applyWeapon(); setPadLabels(true); sfx("click"); renderSkills(`${TRI_LAYER_N[sl]}拿下來了`);
      });
    });
    box.querySelectorAll("[data-cs]").forEach((b) => {
      b.addEventListener("click", (e) => { // 已選輔助寶石 → 直接放進空孔
        if (!sgSel || sgSel.t !== "g") return;
        const [l, si] = b.dataset.cs.split(":"), i = +si; if (chainRaw(l)[i]) return;
        e.stopImmediatePropagation(); triPick = { l, i }; const g = sgSel.g; sgSel = null; triPutGem(g, again);
      }, true);
      b.addEventListener("contextmenu", (e) => { e.preventDefault(); const [l, si] = b.dataset.cs.split(":"), i = +si, row = chainRaw(l), g = row[i]; if (!g) return; addGem(g); row[i] = null; sfx("click"); again(`拆下 ${gemName(g)}`); });
    });
  }
  return _bindTriSg.apply(this, arguments);
};
// 分頁名稱、標題
if (typeof OV_NAME !== "undefined") OV_NAME.skill = "技能寶石";
const _renderSkillsSg = renderSkills;
renderSkills = function () { // eslint-disable-line no-func-assign
  const r = _renderSkillsSg.apply(this, arguments);
  const t = ov && ov.querySelector('.btab[data-st="tri"]'); if (t) t.firstChild.textContent = "技能寶石";
  const w = ov && ov.querySelector(".skwin"); if (w) w.classList.toggle("sgwin", skTab === "tri");
  return r;
};
