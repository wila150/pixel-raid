// 萬劍仙途 — 鐵匠鋪（v7.6，企劃 26）：精煉｜改詞綴｜鍛造，一頁只做一件事
// 精煉、通貨、精髓從行囊搬來；鍛造／煉丹／兌換（econ.js）＋碎屑兌換排成一張清單，不再分子分頁
"use strict";
let smTab = "en", smSel = null, smPrev = null;
OV_TAB.smith = "smith"; OV_NAME.smith = "鐵匠鋪"; OV_KEYS.smith = ["escape", "b"];
const SM_TABS = [["en", "精煉"], ["aff", "改詞綴"], ["forge", "鍛造"]];
// 左邊清單：身上的在前面，背包照品質、戰力
function smItems() {
  const worn = SLOT_KEYS.map((k) => save.eq[k]).filter(Boolean);
  return worn.concat(save.bag.slice().sort((a, b) => b.q - a.q || itemCP(b) - itemCP(a)));
}
const smWorn = (it) => SLOT_KEYS.some((k) => save.eq[k] === it);
function smListHtml(items) {
  if (!items.length) return `<p class="dim">沒有裝備</p>`;
  return `<div class="smlist">${items.map((it, i) => `<button class="smit${it === smSel ? " sel" : ""}" data-si="${i}" style="--c:${RARITY[it.q].c}" title="${it.name}"><span class="smico">${itemIcon(it)}${it.en ? `<i>+${it.en}</i>` : ""}</span><span class="smn"><b>${dispName(it)}</b><small>${smWorn(it) ? "身上・" : ""}${it.slot === "sword" ? WEAPONS[wtOf(it)].n : SLOTS[it.slot].n}・戰 ${itemCP(it)}</small></span></button>`).join("")}</div>`;
}
const smHead = (it) => `<div class="smhead"><div class="big-ico" style="--c:${RARITY[it.q].c}">${itemIcon(it)}</div><div><h3 style="color:${RARITY[it.q].c}">${dispName(it)}</h3><small>${RARITY[it.q].n}・物品等級 ${itLv(it)}・戰力 ${itemCP(it)}${smWorn(it) ? "・穿在身上" : ""}<br>${tierNote(it)}</small></div></div>`;
const smCampLine = (camp) => (camp ? "" : `<p class="warn">在野外可以看、比較；回到安全營地（傳送點、青雲城）才能動手</p>`);
// 精煉：一顆主要按鈕
function smEnHtml(it, camp) {
  const en = it.en || 0;
  if (en >= enMax(it)) return `${smHead(it)}<p class="smbig">已經 +${enMax(it)}，精煉到頂了${it.u && enMax(it) < EN_MAX ? `<br><small>傳說的精煉上限看物品等級：40 以下 +6、80 以下 +9、80 以上 +12</small>` : ""}</p>`;
  const nx = Object.assign({}, it, { en: en + 1 }), c = enCost(it), nd = enhNeed(it), a = itemCP(it), b = itemCP(nx);
  const okStone = save.stone >= c, okMat = !nd || matHas(nd);
  return `${smHead(it)}
    <div class="smstep"><b>+${en}</b><span>→</span><b class="up">+${en + 1}</b></div>
    <div class="smcmp">戰力 ${a} → <b class="up">${b}</b>（+${b - a}）</div>
    <div class="smcost"><span>成功率 <b>${Math.round(EN_RATE[en] * 100)}%</b></span><span class="${okStone ? "" : "no"}">靈石 <b>${c}</b>／${save.stone}</span>${nd ? `<span class="${okMat ? "" : "no"}">${matTxt(nd)}</span>` : ""}</div>
    <button id="smEn" class="smmain gold" ${camp && okStone && okMat ? "" : "disabled"}>精煉 +${en + 1}</button>
    <p class="dim">失敗只扣靈石，裝備不會壞。</p>${smCampLine(camp)}`;
}
// 改詞綴：通貨＋精髓
function smAffHtml(it, camp) {
  const essK = Object.keys(save.ess || {}).filter((k) => save.ess[k] > 0);
  const cur = curBtns(it, camp);
  return `${smHead(it)}${affHtml(it)}
    ${it.cor ? `<p class="warn">已渡劫，不能再用通貨改</p>` : `<div class="smcur">${cur}</div>`}
    ${!it.u && !it.cor ? `<button class="chhead fold" id="smEss">精髓注入（保底詞條，直接變紫裝） ${essK.length ? `<b>${essK.length}</b>` : ""}</button><div class="essbar">${essK.map((k) => `<button data-ess="${k}" ${camp ? "" : "disabled"}>${essName(k)}<small>${AFFIX[k].n}・剩 ${save.ess[k]}</small></button>`).join("") || `<span class="dim">沒有精髓（精英怪、獵寶妖、世界王會掉）</span>`}</div>` : ""}
    ${smCampLine(camp)}`;
}
// 右欄：前後比較（剛改過這件）或這件現在的數值
function smRightHtml(it) {
  if (!it) return `<div class="smhelp"><h3>鐵匠鋪</h3><p>左邊選一件裝備。</p><p class="dim">精煉＝+1～+${EN_MAX}，越高越難；改詞綴＝用通貨、精髓重洗或加詞綴；鍛造＝用素材做裝備、煉丹、換通貨。</p></div>`;
  const pv = smPrev && smPrev.it === it ? smPrev : null;
  if (pv) return `<div class="smhelp"><div class="winhead">改之前 → 現在</div><div class="smcmp">戰力 ${pv.cp} → <b class="${itemCP(it) >= pv.cp ? "up" : "down"}">${itemCP(it)}</b></div><small class="dim">改之前</small>${pv.aff}<small class="dim">現在</small>${affHtml(it)}</div>`;
  return `<div class="smhelp"><div class="winhead">這件現在</div><div class="stats">${cmpRows(it, null)}</div></div>`;
}
// 鍛造：鍛造、碎屑兌換、煉丹、兌換排成一張清單
function smForgeHtml(camp) {
  const sh = save.shards || 0;
  return `${smCampLine(camp)}${curRow()}
    <h3 class="smsec">鍛造</h3>${econBody("forge", camp)}
    <h3 class="smsec">碎屑換裝備 <small>碎屑 ${sh}</small></h3>
    <div class="exch">${SLOT_KEYS.filter(slotOpen).map((k) => `<div class="exrow"><span>${k === "sword" ? WEAPONS[curWeapon()].n : SLOTS[k].n}</span>
      <button data-ex="${k}:2" ${camp && sh >= SHARD_RARE ? "" : "disabled"} style="color:${RARITY[2].c}">保底紫裝<small>${SHARD_RARE}</small></button>
      <button data-ex="${k}:3" ${camp && sh >= SHARD_UNIQ ? "" : "disabled"} style="color:${RARITY[3].c}">保底傳說<small>${SHARD_UNIQ}</small></button></div>`).join("")}
      <div class="exrow"><span>超技能</span><button data-buysup="1" ${camp && sh >= SUPER_COST ? "" : "disabled"} style="color:#ffe066">隨機超技能寶石<small>${SUPER_COST}</small></button></div></div>
    <h3 class="smsec">煉丹</h3>${econBody("pill", camp)}
    <h3 class="smsec">兌換</h3>${econBody("exch", camp)}`;
}
function renderSmith(msg = "") {
  if (!save.w) return;
  if (ovKind !== "smith" && !ovOpen("smith")) return;
  if (msg) ovMsg = msg;
  const camp = atCamp(), items = smItems();
  if (smSel && !items.includes(smSel)) smSel = null;
  if (!smSel && smTab !== "forge") smSel = save.eq.sword || items[0] || null;
  const tabs = `<div class="smtop"><div class="btabs">${SM_TABS.map(([k, n]) => `<button class="btab${smTab === k ? " on" : ""}" data-sm="${k}">${n}</button>`).join("")}</div></div>`;
  let body;
  if (smTab === "forge") body = `<div class="col cw"><div class="panel wide">${smForgeHtml(camp)}</div></div>`;
  else {
    const work = !smSel ? `<p class="dim">沒有裝備</p>` : smTab === "en" ? smEnHtml(smSel, camp) : smAffHtml(smSel, camp);
    body = `<div class="col l">${smListHtml(items)}</div><div class="col c"><div class="smwork">${work}</div></div><div class="col r">${smRightHtml(smSel)}</div>`;
  }
  ov.innerHTML = `${tabs}${body}${ovMsg ? `<div class="toast">${ovMsg}</div>` : ""}`;
  ovMsg = "";
  bindSmith(items);
}
function smStats() { writeSave(); if (W0) { B = worldStats(); W0.maxHp = B.maxHp; } }
function bindSmith(items) {
  const again = (m) => renderSmith(m), it = smSel;
  ov.querySelectorAll("[data-sm]").forEach((b) => b.addEventListener("click", () => { sfx("click"); smTab = b.dataset.sm; again(); }));
  ov.querySelectorAll("[data-si]").forEach((b) => b.addEventListener("click", () => { sfx("click"); smSel = items[+b.dataset.si]; smPrev = null; again(); }));
  const ef = document.getElementById("smEss"); if (ef) ef.onclick = () => { sfx("click"); ef.nextElementSibling.classList.toggle("open"); };
  // 動手前先記下來，右欄才能比較
  const snap = () => { if (it) smPrev = { it, cp: itemCP(it), aff: affHtml(it) }; };
  ov.querySelectorAll(".curb, [data-ess]").forEach((b) => b.addEventListener("click", snap, true));
  const en = document.getElementById("smEn");
  if (en) en.onclick = () => {
    if (!atCamp()) { again("回營地才能精煉"); return; }
    if ((it.en || 0) >= enMax(it)) { again(`已經 +${enMax(it)}，精煉到頂了`); return; }
    const c = enCost(it), nd = enhNeed(it);
    if (save.stone < c) { again("靈石不夠"); return; }
    if (nd && !matHas(nd)) { again(`精煉 +${(it.en || 0) + 1} 需要 ${matTxt(nd)}`); return; }
    if (nd) matUse(nd);
    save.stone -= c;
    if (Math.random() < EN_RATE[it.en || 0]) {
      it.en = (it.en || 0) + 1; nameItem(it); smStats(); sfx("arrive");
      if (it.en >= 10 && typeof netAnnounce === "function") netAnnounce(`成功鍛造出 ${it.name}！`);
      again(`精煉成功！${it.name}`);
    } else { writeSave(); sfx("hurt"); again(`精煉失敗⋯⋯靈石 −${c}（裝備沒事）`); }
  };
  if (it && smTab === "aff") bindCur(it, (m) => { if (!smItems().includes(smSel)) { smSel = null; smPrev = null; } again(m); });
  ov.querySelectorAll("[data-ess]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.ess; if (!atCamp() || !(save.ess[k] > 0) || !it) return;
    if (!essCraft(it, k)) { again("傳說裝不能注入精髓"); return; }
    save.ess[k]--; if (!save.ess[k]) delete save.ess[k]; smStats(); sfx("arrive");
    again(`注入${essName(k)}：${it.name}`);
  }));
  if (smTab !== "forge") return;
  bindEcon(again);
  ov.querySelectorAll("[data-ex]").forEach((b) => b.addEventListener("click", () => {
    const [slot, q] = b.dataset.ex.split(":"), cost = +q === 3 ? SHARD_UNIQ : SHARD_RARE;
    if (!atCamp() || (save.shards || 0) < cost) return;
    if (save.bag.length >= BAG_MAX) { again("行囊滿了，先賣掉一些"); return; }
    save.shards -= cost; const ni = shardItem(slot, +q); save.bag.push(ni); writeSave(); sfx("win");
    again(`兌換出 ${RARITY[ni.q].n}・${ni.name}！（在行囊裡）`);
  }));
  ov.querySelectorAll("[data-buysup]").forEach((b) => b.addEventListener("click", () => {
    if (!atCamp() || (save.shards || 0) < SUPER_COST) return;
    save.shards -= SUPER_COST; const k = Object.keys(SUPERS)[Math.floor(Math.random() * 3)]; addSup(k); writeSave(); sfx("win"); again(`換到超技能寶石：${SUPERS[k].n}`);
  }));
}
const _ovSubSm = ovSub;
ovSub = function () { if (ovKind === "smith" && smPrev) { smPrev = null; renderSmith(); return true; } return _ovSubSm.apply(this, arguments); };
const _ovCloseSm = ovClose;
ovClose = function () { if (ovKind === "smith") smPrev = null; return _ovCloseSm.apply(this, arguments); };
// 舊玩家第一次打開行囊：劍靈指一下搬家（企劃 26 §6）
const _renderEquipSm = renderEquip;
renderEquip = function () {
  const r = _renderEquipSm.apply(this, arguments);
  const w = save.w; if (w && w.created && !w.smithHint) { w.smithHint = 1; writeSave(); if (typeof say === "function") say("精煉、改詞綴、鍛造搬到「鐵匠鋪」了（右上「鍛」、B 鍵）；魔物卡片有自己的一頁（右上「⋯更多」、L 鍵）", "#ffe9a8"); }
  return r;
};
