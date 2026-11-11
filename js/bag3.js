// 企劃 73 A：行囊四分頁 裝備（格子）｜消耗品（腰帶丹藥）｜魔石（素材＋通貨圖示格）｜寶石
"use strict";
B2_TABS.length = 0; B2_TABS.push(["eq", "裝備"], ["pot", "消耗品"], ["mat", "魔石"], ["gem", "寶石"]);
if (!B2_TABS.some(([k]) => k === b2Tab)) b2Tab = "eq";
const B4_SORT = [["slot", "依部位"], ["q", "依品質"], ["lv", "依等級"], ["cp", "依戰力"]];
const B4_SLOT_O = ["sword", "crown", "robe", "boots", "charm", "ring", "ear"];
const b4SortK = () => (save.w && save.w.bagSort) || "slot";
function b4Sorted(L) {
  const k = b4SortK(), so = (it) => { const i = B4_SLOT_O.indexOf(it.slot); return i < 0 ? 9 : i; };
  const f = { slot: (a, b) => so(a) - so(b) || b.q - a.q || itemCP(b) - itemCP(a), q: (a, b) => b.q - a.q || itemCP(b) - itemCP(a), lv: (a, b) => itLv(b) - itLv(a) || b.q - a.q, cp: (a, b) => itemCP(b) - itemCP(a) }[k];
  return L.slice().sort(f);
}
function b4Cell(it) {
  const better = sameWt(it) && itemCP(it) > itemCP(save.eq[it.slot]);
  return `<div class="b2row b4c q${it.q}${eqSel === it.id ? " open" : ""}${b2Match(b2Text(it)) ? "" : " dim"}${typeof keepHit === "function" && keepHit(it) ? " keep" : ""}" data-s="b" data-id="${it.id}" title="${it.name}" style="--c:${RARITY[it.q].c}">${itemIcon(it)}${it.en ? `<i class="en">+${it.en}</i>` : ""}<span class="b4t">${better ? '<em class="up">↑</em>' : ""}${it.risk ? '<em class="risk">!</em>' : ""}${it.lock ? `<em class="lk">${LOCK_SVG}</em>` : ""}${inWset(it) ? '<em class="ws">組</em>' : ""}</span></div>`;
}
function b4EqGrid() {
  const L = b4Sorted(save.bag), cells = L.map(b4Cell), n = Math.max(BAG_MAX, Math.ceil(cells.length / 8) * 8);
  while (cells.length < n) cells.push('<span class="b4c empty"></span>');
  const sel = eqSel && !String(eqSel).startsWith("eq:") ? save.bag.find((x) => x.id === eqSel) : null;
  return `<div class="b4bar"><span>空間 <b>${save.bag.length}</b>／${BAG_MAX}</span><span class="sp"></span><button data-b4="tidy">整理</button><select class="b4sort" aria-label="排序">${B4_SORT.map(([k, n]) => `<option value="${k}" ${b4SortK() === k ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <div class="b4grid">${cells.join("")}</div>${sel ? `<div class="b2det b4det">${b2Detail(sel, true)}</div>` : ""}
    <p class="dim b4help">${TOUCH ? "點一下看說明・長按穿上" : "點一下看說明・右鍵（或長按）穿上・滑過看詞綴"}</p>`;
}
function b4PotTab() {
  const belt = POT_KEYS.map((k) => { const P = POTS[k], n = potN(k), m = potMaxOf(k); return `<div class="b4pot" data-pot="${k}" style="--c:${P.c}"><span class="b4pi" style="background:${P.c}">${P.n[0]}</span><span class="b2mid"><b style="color:${P.c}">${P.n}</b>${TOUCH ? "" : `<kbd>${k === "hp" ? "4／H" : P.key}</kbd>`}<small>${P.d}</small></span><span class="b4pn ${n >= m ? "full" : ""}"><b>${n}</b>／${m}</span></div>`; }).join("");
  const bf = save.w.buffs || {}, now = Date.now();
  const other = [];
  for (const k in BUFFS) if (bf[k] > now) other.push(`<div class="b4pot buff" style="--c:${BUFFS[k].c}"><span class="b4pi" style="background:${BUFFS[k].c}">${BUFFS[k].g}</span><span class="b2mid"><b style="color:${BUFFS[k].c}">${BUFFS[k].n}</b><small>${BUFFS[k].d}</small></span><span class="b4pn">剩 ${Math.ceil((bf[k] - now) / 60000)} 分</span></div>`);
  if (curN("regret")) other.push(`<div class="b4pot" style="--c:#9aff9a"><span class="b4pi" style="background:#9aff9a">洗</span><span class="b2mid"><b style="color:#9aff9a">洗心丹</b><small>${CUR.regret.d}</small></span><span class="b4pn"><b>${curN("regret")}</b></span></div>`);
  other.push(`<div class="b4pot" data-rc="1" style="--c:#9fe8ff"><span class="b4pi" style="background:#9fe8ff">回</span><span class="b2mid"><b style="color:#9fe8ff">回城符</b><small>原地不動 3 秒回青雲城（被打或移動會中斷）；點這裡使用</small></span><span class="b4pn">∞</span></div>`);
  return `<div class="b2sec">腰帶丹藥<small>按鍵或點下方快捷欄喝・回城、營地免費補滿・殺精英、王補 1 瓶・四種共用 ${WSKILL.potion.cd} 秒冷卻（打區域王 6 秒）</small></div>${belt}
    <div class="b2sec">其他<small>煉丹做的增益丹在鐵匠鋪 → 鍛造（吃下立刻生效 30 分鐘）</small></div>${other.join("")}`;
}
function b4MatTab() {
  const cell = (p, have) => `<div class="b2row prop b4m${propSel === p.k ? " open" : ""}${have ? "" : " none"}${b2Match(p.name + " " + (p.d || "")) ? "" : " dim"}" data-prop="${p.k}" style="--c:${p.c}"><span class="b2ico">${propG(p)}</span><span class="b2mid"><small>${p.name}</small><b>${p.n}</b></span></div>`;
  const L = propList();
  const mats = matList().concat(L.filter((p) => /^(shard|ess:|sup:)/.test(p.k)));
  const curs = CUR_KEYS.filter((k) => !["regret", "tide", "tjseal"].includes(k) || curN(k) > 0).map((k) => ({ k: "cur:" + k, g: CUR[k].g, c: CUR[k].c, n: curN(k), name: CUR[k].n, d: CUR[k].d + "（到鐵匠鋪用）" }));
  const have = curs.filter((p) => p.n > 0).length;
  const sel = propSel && propList().concat(matList(), curs).find((p) => p.k === propSel);
  return `<div class="b2sec">材料<small>素材、碎屑、精髓：鐵匠鋪鍛造、煉丹、精煉用</small></div><div class="b4mg">${mats.length ? mats.map((p) => cell(p, true)).join("") : `<p class="dim">還沒有素材（打怪、採集會掉）</p>`}</div>
    <div class="b2sec">通貨<small>擁有 ${have}／${curs.length} 種</small></div><div class="b4mg">${curs.map((p) => cell(p, p.n > 0)).join("")}</div>
    ${sel ? `<div class="b2det"><p><b style="color:${sel.c}">${sel.name}</b>　×${sel.n}</p><p>${sel.d}</p>${sel.k.startsWith("cur:") ? `<div class="acts row"><button data-go="smith">到鐵匠鋪使用</button></div>` : ""}</div>` : ""}`;
}
const _b2List73 = b2List;
b2List = function () { // eslint-disable-line no-func-assign
  if (b2Mode === "stash") return _b2List73.apply(this, arguments);
  if (b2Tab === "eq") return b4EqGrid();
  if (b2Tab === "pot") return b4PotTab();
  if (b2Tab === "mat") return b4MatTab();
  return _b2List73.apply(this, arguments);
};
const _renderEquip73 = renderEquip;
renderEquip = function () { // eslint-disable-line no-func-assign
  const r = _renderEquip73.apply(this, arguments);
  if (!ov || (ovKind !== "bag" && ovKind !== "stash")) return r;
  const again = (m) => renderEquip(m || ""), findB = (id) => save.bag.find((x) => String(x.id) === id);
  const box = ov.querySelector(".b2");
  if (box) box.classList.toggle("b4", b2Mode !== "stash");
  const sortSel = ov.querySelector(".b4sort");
  if (sortSel) sortSel.onchange = () => { save.w.bagSort = sortSel.value; writeSave(); again(); };
  ov.querySelectorAll('[data-b4="tidy"]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); save.bag = b4Sorted(save.bag); writeSave(); sfx("click"); again("整理好了"); });
  ov.querySelectorAll(".b4c[data-id]").forEach((c) => c.addEventListener("contextmenu", (e) => { // 右鍵穿上
    e.preventDefault(); const it = findB(c.dataset.id); if (!it) return;
    if (!equipItem(it)) { again(`${SLOTS[it.slot].n}格要${slotLockTxt(it.slot)}`); return; }
    eqSel = null; b3Pop = it.slot; again(`穿上了 ${it.name}`);
  }));
  ov.querySelectorAll(".b4pot[data-pot]").forEach((r2) => r2.addEventListener("click", () => {
    const k = r2.dataset.pot; if (!inWorld || !W0) return;
    if (k === "hp") padAct.add("potion"); else W0.potReq = k;
    setTimeout(() => { if (ovKind === "bag") again(); }, 120);
  }));
  ov.querySelectorAll(".b4pot[data-rc]").forEach((r2) => r2.addEventListener("click", () => { quickItem("rc"); ovClose(); }));
  return r;
};
