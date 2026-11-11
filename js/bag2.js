// 萬劍仙途 — 行囊改成「側邊大面板＋直列清單」（企劃 54，總表第 42 項，v9.8）
// 橫向：右邊 45%（最少 360px）、鏡頭往左偏；直向：下面 62%、鏡頭往上偏。遊戲畫面不再整個蓋掉。
// 一件一列（圖示、品質底色、名字、最重要 2 條詞綴、物品等級＋最高 T 幾、↑ / ! / 鎖）。
// 電腦：滑鼠移到那一列 → 遊戲那一側跳大字說明；手機：點一下在那一列下面展開說明＋按鈕；長按＝直接穿上。
// 分頁：裝備｜寶石｜鑰匙｜素材與通貨｜丹藥。工具列：搜尋、一鍵出售、一鍵分解、全部送倉庫、一鍵換最強。
// 在營地：頂端切換「行囊｜倉庫」（倉庫規則照 stash.js v9.7；倉庫模式點一下＝搬到行囊）。
// stash.js 後面載入：整個換掉 renderEquip（舊的格子版留在 inv.js 沒人叫），sellall／stash 的包裝功能在這裡重做。
"use strict";
let b2Tab = "eq", b2Mode = "bag", b2Q = "", b2Salv = false, b2LP = null, b2LPfired = false;
const B2_TABS = [["eq", "裝備"], ["gem", "寶石"], ["key", "鑰匙"], ["mat", "素材<span class=\"lg\">與通貨</span>"], ["pot", "丹藥"]];
const b2Hover = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const b2Pt = () => PORTRAIT();
// v9.12 企劃 59：行囊改回全螢幕（左邊角色穿著、右邊清單），鏡頭不用再偏
function bagCamOff() { return [0, 0]; }
let b3Pop = null; // 剛穿上的部位（格子跳一下）
// 最重要 2 條詞綴（照戰力權重×數值）
function b2Top2(it) {
  const ks = Object.keys(it.aff || {}).filter((k) => AFFIX[k]).sort((a, b) => it.aff[b] * (AFFIX[b].w || 1) - it.aff[a] * (AFFIX[a].w || 1));
  return ks.slice(0, 2).map((k) => fmtAff(k, it.aff[k])).join("　");
}
const b2Text = (it) => `${it.name} ${dispName(it)} ${RARITY[it.q].n} ${it.slot === "sword" ? WEAPONS[wtOf(it)].n : SLOTS[it.slot].n} ${Object.keys(it.aff || {}).map((k) => (AFFIX[k] ? AFFIX[k].n : "")).join(" ")} ${it.u ? UNIQUES[it.u].d : ""}`;
const b2Match = (txt) => !b2Q || txt.includes(b2Q);
function b2Row(it, side) {
  const better = sameWt(it) && itemCP(it) > itemCP(save.eq[it.slot]), t = it.u ? "固定" : tierName(tierTop(itLv(it)));
  const open = side === "b" && eqSel === it.id;
  return `<div class="b2row q${it.q}${open ? " open" : ""}${b2Match(b2Text(it)) ? "" : " dim"}" data-s="${side}" data-id="${it.id}" style="--c:${RARITY[it.q].c}">
    <span class="b2ico">${itemIcon(it)}${it.en ? `<i class="en">+${it.en}</i>` : ""}</span>
    <span class="b2mid"><b>${dispName(it)}</b><small>${b2Top2(it) || (it.u ? "傳說" : "沒有詞綴")}</small></span>
    <span class="b2rt"><small>Lv${itLv(it)}・${t}</small><span class="b2tags">${better ? '<em class="up">↑</em>' : ""}${it.risk ? '<em class="risk">!</em>' : ""}${it.lock ? `<em class="lk">${LOCK_SVG}</em>` : ""}${inWset(it) ? '<em class="ws">組</em>' : ""}${reqTag(it)}</span></span>
  </div>${open ? `<div class="b2det">${b2Detail(it, true)}</div>` : ""}`;
}
// 說明（展開或懸停用）：acts＝要不要按鈕
function b2Detail(sel, acts) {
  const worn = SLOT_KEYS.some((k) => save.eq[k] === sel), cur = save.eq[sel.slot], diff = itemCP(sel) - itemCP(cur), camp = atCamp();
  const now = totalCP(), nx = !worn && typeof cpIf === "function" ? cpIf(sel) : now, d = nx - now, F = typeof fmtN === "function" ? fmtN : (x) => x;
  return `<div class="b2d">
    <h3 style="color:${RARITY[sel.q].c}">${dispName(sel)}</h3>
    <small>${RARITY[sel.q].n}・${sel.slot === "sword" ? `${WEAPONS[wtOf(sel)].n}（${WEAPONS[wtOf(sel)].job}）` : SLOTS[sel.slot].n}・物品等級 ${itLv(sel)}${sel.bt ? `・第 ${sel.bt} 階` : ""}${sel.risk ? '・<span class="risk">未帶回</span>' : ""}</small>
    <div class="dim">${tierNote(sel)}</div>
    ${reqLine(sel)}${sel.cor ? `<div class="corline">已渡劫${sel.jie ? `・劫紋：${AFFIX[sel.jie].n}` : ""}</div>` : ""}
    ${worn ? `<div class="cp">裝備評分 ${itemCP(sel)}（穿在身上）</div>` : `<div class="cpafter">穿上後戰力 ${F(now)} → <b class="${d > 0 ? "up" : d < 0 ? "down" : "same"}">${F(nx)}</b>（${d > 0 ? "+" : d < 0 ? "−" : "±"}${F(Math.abs(d))}）${cur ? `<br><small>對比身上：<span style="color:${RARITY[cur.q].c}">${cur.name}</span>（評分 ${diff >= 0 ? "+" : ""}${diff}）</small>` : ""}</div>`}
    ${affHtml(sel)}
    <div class="stats">${cmpRows(sel, worn ? null : cur)}</div>
    ${acts ? `${extraSlots(sel)}<div class="acts row b2acts">
      ${worn ? `<button data-b2="unequip">卸下</button>` : `<button data-b2="equip" class="gold">穿上</button><button data-b2="sell" class="red" ${sel.lock ? "disabled" : ""}>${sel.lock ? "已鎖定" : `出售 +${sellPrice(sel)}`}</button><button data-b2="lock">${LOCK_SVG}${sel.lock ? "解鎖" : "鎖定"}</button>${camp ? `<button data-b2="tostash" ${inWset(sel) ? "disabled" : ""}>送倉庫</button>` : ""}`}
      <button data-go="smith">鐵匠鋪 ›</button>${CARD_SLOTS.includes(sel.slot) ? `<button data-go="cards">插卡 ›</button>` : ""}</div>` : ""}
  </div>`;
}
// v9.12 企劃 59：左欄紙娃娃——角色大圖，左排 武器／佩／戒指／耳飾、右排 冠／袍／靴／坐騎、角色下面 武器組 2、3
function b3Doll(selIt) {
  const cmpK = selIt && !SLOT_KEYS.some((k) => save.eq[k] === selIt) ? selIt.slot : null;
  const cell = (k) => {
    const it = save.eq[k];
    if (!slotOpen(k)) return `<span class="b2eqc lock" title="${SLOTS[k].n}（${slotLockTxt(k)}）"><small>${SLOTS[k].n}</small><i>🔒</i><small>${slotLockTxt(k)}</small></span>`;
    return `<button class="b2eqc${it ? " has" : ""}${eqSel === "eq:" + k ? " sel" : ""}${cmpK === k ? " cmp" : ""}${b3Pop === k ? " pop" : ""}" data-eq="${k}" title="${it ? it.name : SLOTS[k].n}" style="--c:${it ? RARITY[it.q].c : "#5a5068"}">${it ? itemIcon(it) + (it.en ? `<i class="en">+${it.en}</i>` : "") : ""}<small class="sn">${SLOTS[k].n}</small></button>`;
  };
  const ws = [1, 2].map((i) => { const it = typeof wsGet === "function" ? wsGet(i) : null; return `<button class="b2eqc ws${it ? " has" : ""}" data-wsw="${i}" title="武器組 ${i + 1}${it ? "：" + it.name : ""}" style="--c:${it ? RARITY[it.q].c : "#3a3448"}">${it ? itemIcon(it) : ""}<b>${i + 1}</b><small class="sn">武器組</small></button>`; }).join("");
  const mt = save.w.mount && typeof MOUNTS !== "undefined" && MOUNTS[save.w.mount] ? MOUNTS[save.w.mount].n : "";
  let cmp = "";
  if (cmpK) { const now = totalCP(), nx = typeof cpIf === "function" ? cpIf(selIt) : now, d = nx - now, F = typeof fmtN === "function" ? fmtN : (x) => x; cmp = `<div class="b3cmp">穿上後戰力 ${F(now)} → <b class="${d > 0 ? "up" : d < 0 ? "down" : "same"}">${F(nx)}</b></div>`; }
  if (b3Pop) setTimeout(() => { b3Pop = null; }, 300); // 0.3 秒內重畫也保留跳一下
  return `<div class="b3doll">
    <div class="b3col">${["sword", "charm", "ring", "ear"].map(cell).join("")}</div>
    <div class="b3hb"><div class="b3hero"><img src="${typeof heroURL === "function" ? heroURL() : ""}" alt=""></div>${cmp}<div class="b3ws">${ws}</div></div>
    <div class="b3col">${["crown", "robe", "boots"].map(cell).join("")}<button class="b2eqc mt" data-go="char" title="坐騎（角色 → 外觀）"><small>${mt || "坐騎"}</small><small class="sn">坐騎</small></button></div>
  </div>
  <div class="b3cp"><b>戰力 ${cpTxt()}</b><small>靈石 ${save.stone}・碎屑 ${save.shards || 0}</small><button class="b2fold" data-b2="stat">${save.w.b2stat ? "收起屬性" : "屬性"}</button></div>
  ${save.w.b2stat ? `<div class="b3stat">${apHtml()}</div>` : ""}
  ${eqSel && eqSel.startsWith("eq:") && save.eq[eqSel.slice(3)] ? `<div class="b3card"><button class="b3x" data-b2="cardx" aria-label="關閉">✕</button>${b2Detail(save.eq[eqSel.slice(3)], true)}</div>` : ""}`;
}
// 舊版（v9.8）表頭小格，沒人叫了
function b2EqBar() {
  const cell = (k) => {
    const it = save.eq[k];
    if (!slotOpen(k)) return `<span class="b2eqc lock" title="${SLOTS[k].n}（${slotLockTxt(k)}）"><small>${SLOTS[k].n}</small><i>🔒</i></span>`;
    return `<button class="b2eqc${it ? " has" : ""}${eqSel === "eq:" + k ? " sel" : ""}" data-eq="${k}" title="${it ? it.name : SLOTS[k].n}" style="--c:${it ? RARITY[it.q].c : "#5a5068"}">${it ? itemIcon(it) + (it.en ? `<i class="en">+${it.en}</i>` : "") : `<small>${SLOTS[k].n}</small>`}</button>`;
  };
  const ws = [1, 2].map((i) => { const it = typeof wsGet === "function" ? wsGet(i) : null; return `<button class="b2eqc ws" data-wsw="${i}" title="武器組 ${i + 1}${it ? "：" + it.name : ""}" style="--c:${it ? RARITY[it.q].c : "#3a3448"}">${it ? itemIcon(it) : ""}<b>${i + 1}</b></button>`; }).join("");
  const mt = save.w.mount && typeof MOUNTS !== "undefined" && MOUNTS[save.w.mount] ? MOUNTS[save.w.mount].n : "";
  return [`<div class="b2eqg">${["sword", "crown", "robe", "boots", "charm", "ring", "ear"].map(cell).join("")}${ws}<button class="b2eqc mt" data-go="char" title="坐騎（角色 → 外觀）"><small>${mt || "坐騎"}</small></button></div>`,
    `<div class="b2cp"><b>戰力 ${cpTxt()}</b><small>靈石 ${save.stone}・碎屑 ${save.shards || 0}</small><button class="b2fold" data-b2="stat">${save.w.b2stat ? "收起屬性" : "屬性"}</button></div>`,
    `${save.w.b2stat ? apHtml() : ""}${eqSel && eqSel.startsWith("eq:") && save.eq[eqSel.slice(3)] ? `<div class="b2det">${b2Detail(save.eq[eqSel.slice(3)], true)}</div>` : ""}`];
}
const b2Prop = (p) => `<div class="b2row prop${b2Match(p.name + " " + (p.d || "")) ? "" : " dim"}${propSel === p.k ? " open" : ""}" data-prop="${p.k}" style="--c:${p.c}"><span class="b2ico">${propG(p)}</span><span class="b2mid"><b style="color:${p.c}">${p.name}</b><small>${String(p.d || "").replace(/<br>/g, "　").replace(/<[^>]+>/g, "").slice(0, 40)}</small></span><span class="b2rt"><b class="cnt">×${p.n}</b></span></div>${propSel === p.k ? `<div class="b2det"><p>${p.d}</p>${p.k.startsWith("gem:") && p.n >= 3 && +p.k.split(":")[2] < GEM_MAX ? `<div class="acts row"><button class="gmerge" data-g="${p.k.slice(4)}">3 合 1（升一級）</button></div>` : ""}</div>` : ""}`;
const b2Sec = (t, h) => (h ? `<div class="b2sec">${t}</div>${h}` : "");
function b2List() {
  if (b2Mode === "stash") { const P = stashSt().pg[stPage] || []; return P.length ? P.map((it) => b2Row(it, "s")).join("") : `<p class="dim b2empty">這一頁是空的。切到「行囊」點裝備 →「送倉庫」，或按下面「全部送倉庫」</p>`; }
  if (b2Tab === "eq") { const bag = save.bag.slice().sort((a, b) => b.q - a.q || itemCP(b) - itemCP(a)); return bag.length ? bag.map((it) => b2Row(it, "b")).join("") : `<p class="dim b2empty">行囊是空的</p>`; }
  const L = propList();
  if (b2Tab === "gem") {
    const sk = Object.keys((typeof skgStore === "function" && skgStore()) || {}).map((k) => { const o = skgStore()[k]; return { k: "skg:" + k, g: "技", c: "#9fdcff", n: `Lv${o.lv}`, name: `技能寶石「${skgName(k)}」`, d: `等級 ${o.lv}（技能頁 → 技能鏈換上；打怪會升級）` }; });
    return b2Sec("技能寶石", sk.map((p) => b2Prop(p).replace(`<b class="cnt">×${p.n}</b>`, `<b class="cnt">${p.n}</b>`)).join("")) + b2Sec("輔助寶石（串在技能鏈上）", L.filter((p) => p.k.startsWith("gem:")).map(b2Prop).join("")) + b2Sec("天賦玉（天賦樹玉槽）", L.filter((p) => p.k.startsWith("jw:")).map(b2Prop).join("")) || `<p class="dim b2empty">沒有寶石</p>`;
  }
  if (b2Tab === "key") {
    const ks = (save.keys || []).slice().sort((a, b) => b.tier - a.tier || b.q - a.q);
    return ks.map((k) => `<div class="b2row key${b2Match(keyName(k) + k.mods.map((m) => MAP_MODS[m] ? MAP_MODS[m].n : "").join(" ")) ? "" : " dim"}" data-key="${k.id}" style="--c:${keyGod(k) ? "#ffd84a" : KEY_RARITY[k.q].c}"><span class="b2ico keyico">鑰</span><span class="b2mid"><b style="color:${keyGod(k) ? "#ffd84a" : KEY_RARITY[k.q].c}">【${KEY_RARITY[k.q].n}】${keyName(k)}</b><small>詞綴 ${keyModN(k)}／${KEY_MODS_MAX}・數量 +${keyQuant(k)}%・${"★".repeat(keyStars(k))}</small></span><span class="b2rt"><small>Lv${riftMobLv(k.tier)}</small></span></div>`).join("") + `<div class="acts row"><button data-go="rift">到秘境頁改鑰匙、開門 ›</button></div>` || `<p class="dim b2empty">沒有鑰匙</p>`;
  }
  if (b2Tab === "mat") return b2Sec("通貨", L.filter((p) => p.k.startsWith("cur:")).map(b2Prop).join("")) + b2Sec("碎屑、精髓、超技能", L.filter((p) => /^(shard|ess:|sup:)/.test(p.k)).map(b2Prop).join("")) + b2Sec("素材", matList().map(b2Prop).join("")) || `<p class="dim b2empty">沒有素材、通貨</p>`;
  return L.filter((p) => p.k === "pot").map(b2Prop).join("") || `<p class="dim b2empty">沒有丹藥（丹師、懸賞會給）</p>`;
}
// 一鍵分解：白 0、藍 1、紫 3 碎屑，傳說不拆；不拆鎖住、武器組、比身上強的（跟一鍵出售同一套排除）
const SALV_SH = [0, 1, 3];
const salvPref = () => { const w = save.w; if (!w.salv) w.salv = { q: [0, 1] }; return w.salv; };
const salvPick = () => save.bag.filter((it) => it && it.q < 3 && !it.lock && !(typeof keepHit === "function" && keepHit(it)) && !inWset(it) && salvPref().q.includes(it.q) && !isBetterIt(it));
function salvPopHtml() {
  const L = salvPick(), sh = L.reduce((s, it) => s + SALV_SH[it.q], 0);
  return `<div class="sellpop salvpop"><div class="sellbox"><h3>一鍵分解</h3>
    <div class="sellq">${RARITY.slice(0, 3).map((r, q) => `<label style="--c:${r.c}"><input type="checkbox" data-vq="${q}" ${salvPref().q.includes(q) ? "checked" : ""}><span>${r.n}（${SALV_SH[q]}）</span></label>`).join("")}</div>
    <div class="sellsum">會拆掉 <b>${L.length}</b> 件，得到天罰碎屑 <b class="gold">${sh}</b></div>
    <small class="dim">傳說不拆。不會拆：身上穿的、武器組的、上鎖的、比身上強的。碎屑在鐵匠鋪換保底紫裝／傳說。</small>
    <div class="sellacts"><button id="salvCancel">取消</button><button id="salvGo" class="red" ${L.length ? "" : "disabled"}>分解</button></div></div></div>`;
}
function salvDo() { const L = salvPick(); let sh = 0; for (const it of L) { ungem(it); sh += SALV_SH[it.q]; } const S = new Set(L); save.bag = save.bag.filter((it) => !S.has(it)); save.shards = (save.shards || 0) + sh; eqSel = null; writeSave(); sfx("arrive"); return `拆了 ${L.length} 件，天罰碎屑 +${sh}`; }

// ───────── 主畫面 ─────────
renderEquip = function (msg = "") {
  if (typeof tutEvent === "function") tutEvent("bag");
  const want = b2Mode === "stash" ? "stash" : "bag";
  if (b2Mode === "stash" && !atCamp()) b2Mode = "bag";
  if (ovKind !== want && ovKind !== "bag" && ovKind !== "stash") { if (!ovOpen(want)) return; }
  else if (ovKind !== want) { ovKind = want; ov.className = `ov k-${want} show`; ovBar(); }
  if (msg) ovMsg = msg;
  const camp = atCamp(), S = stashSt(), st = b2Mode === "stash";
  if (stPage >= S.pg.length) stPage = 0;
  const next = S.pg.length < STASH_MAXPG ? STASH_COST[S.pg.length - STASH_BASE] : 0;
  const head = camp ? `<div class="b2mode"><button data-mode="bag" class="${st ? "" : "on"}">行囊 ${save.bag.length}／${BAG_MAX}</button><button data-mode="stash" class="${st ? "on" : ""}">倉庫 ${stashCount()}／${stashCap()}</button></div>` : `<div class="b2mode one"><b>行囊 ${save.bag.length}／${BAG_MAX}</b><small>倉庫在營地（傳送點、青雲城）</small></div>`;
  const tabs = st ? `<div class="b2tabs pages">${S.pg.map((p, i) => `<button data-pg="${i}" class="${i === stPage ? "on" : ""}">${stashName(i)}<small>${p.length}</small></button>`).join("")}</div>`
    : `<div class="b2tabs">${B2_TABS.map(([k, n]) => `<button data-bt="${k}" class="${b2Tab === k ? "on" : ""}">${n}${k === "eq" ? `<small>${save.bag.length}/${BAG_MAX}</small>` : ""}</button>`).join("")}</div>`;
  const tools = st ? `<button data-b2="sorts">排序</button><button data-b2="ren">改名</button>${next ? `<button data-b2="buy" ${save.stone >= next ? "" : "disabled"}>加開第 ${S.pg.length + 1} 頁・${next}</button>` : ""}<span class="dim">點一下＝搬回行囊</span>`
    : `<button data-b2="sellall">一鍵出售</button><button data-b2="salv">一鍵分解</button>${camp ? `<button data-b2="allstash">全部送倉庫</button>` : ""}<button data-b2="auto" class="gold">一鍵換最強</button>`;
  const selIt = !st && eqSel && !String(eqSel).startsWith("eq:") ? save.bag.find((x) => x.id === eqSel) : null;
  const bagL = st ? `<div class="b3lh"><b>行囊 ${save.bag.length}／${BAG_MAX}</b><small>點一下＝送到倉庫</small></div><div class="b2list">${save.bag.length ? save.bag.slice().sort((a, b) => b.q - a.q || itemCP(b) - itemCP(a)).map((it) => b2Row(it, "bs")).join("") : `<p class="dim b2empty">行囊是空的</p>`}</div>` : "";
  ov.innerHTML = `<div class="b2 b3${st ? " st" : ""}"><div class="b3l">${st ? bagL : b3Doll(selIt)}</div>
    <div class="b3r"><div class="b3head">${head}${tabs}</div>
    <div class="b2list">${b2List()}</div>
    <div class="b2tool"><input class="b2q" type="search" placeholder="搜尋：抗、雷、攻速…" value="${b2Q.replace(/"/g, "")}">${tools}</div></div>
  </div><div id="b2tip" class="b2tip"></div>${ovMsg ? `<div class="toast">${ovMsg}</div>` : ""}`;
  ovMsg = "";
  if (typeof cpRoll !== "undefined" && cpRoll) { const { a, b } = cpRoll; cpRoll = null; const el = ov.querySelector(".b3cp b"); if (el) { el.classList.add("cproll"); if (b < a) el.classList.add("down"); const t0 = performance.now(), F = typeof fmtN === "function" ? fmtN : (x) => Math.round(x); const step = (t) => { if (!el.isConnected) return; const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3); el.textContent = `戰力 ${F(a + (b - a) * e)}${k >= 1 ? `（${b > a ? "+" : "−"}${F(Math.abs(b - a))}）` : ""}`; if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); } }
  if (sellOpen) { ov.insertAdjacentHTML("beforeend", sellPopHtml()); sellBind(); }
  if (b2Salv) { ov.insertAdjacentHTML("beforeend", salvPopHtml()); b2SalvBind(); }
  b2Bind();
  const w = save.w; if (w && w.created && !w.b2Hint) { w.b2Hint = 1; writeSave(); if (typeof say === "function") say("行囊：左邊是身上穿的，右邊是清單。點一下看說明（電腦滑鼠移過去就看得到），長按直接穿上；下面可以搜尋、出售、分解", "#ffe9a8"); }
};
function b2SalvBind() {
  const pop = ov.querySelector(".salvpop"); if (!pop) return;
  pop.addEventListener("click", (e) => { e.stopPropagation(); if (e.target === pop) { b2Salv = false; renderEquip(); } });
  pop.querySelectorAll("[data-vq]").forEach((x) => x.addEventListener("change", () => { const P = salvPref(), q = +x.dataset.vq; P.q = x.checked ? [...new Set(P.q.concat(q))] : P.q.filter((v) => v !== q); writeSave(); pop.outerHTML = salvPopHtml(); b2SalvBind(); }));
  document.getElementById("salvCancel").onclick = () => { sfx("click"); b2Salv = false; renderEquip(); };
  document.getElementById("salvGo").onclick = () => { const m = salvDo(); b2Salv = false; renderEquip(m); };
}
function b2Bind() {
  const again = (m) => renderEquip(m), findB = (id) => save.bag.find((x) => String(x.id) === id), findS = (id) => (stashSt().pg[stPage] || []).find((x) => String(x.id) === id);
  const tip = document.getElementById("b2tip");
  ov.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => { sfx("click"); b2Mode = b.dataset.mode; eqSel = null; propSel = null; again(); }));
  ov.querySelectorAll("[data-bt]").forEach((b) => b.addEventListener("click", () => { sfx("click"); b2Tab = b.dataset.bt; eqSel = null; propSel = null; again(); }));
  ov.querySelectorAll("[data-pg]").forEach((b) => b.addEventListener("click", () => { sfx("click"); stPage = +b.dataset.pg; again(); }));
  ov.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); const g = b.dataset.go, it = eqSel && (eqSel.startsWith("eq:") ? save.eq[eqSel.slice(3)] : findB(eqSel)); if (g === "smith") smSel = it || null; else if (g === "cards" && it) cdSlot = it.slot; if (g === "char") { openHud("ap"); return; } ovGo(g); }));
  ov.querySelectorAll("[data-wsw]").forEach((b) => b.addEventListener("click", () => { sfx("click"); switchW(+b.dataset.wsw); again(); }));
  // 搜尋：即時變暗（不重畫整頁，游標才不會跑掉）
  const q = ov.querySelector(".b2q");
  if (q) q.addEventListener("input", () => {
    b2Q = q.value.trim();
    ov.querySelectorAll(".b2row[data-id]").forEach((r) => { const it = r.dataset.s === "s" ? findS(r.dataset.id) : findB(r.dataset.id); r.classList.toggle("dim", !!it && !b2Match(b2Text(it))); });
    ov.querySelectorAll(".b2row[data-prop], .b2row[data-key]").forEach((r) => r.classList.toggle("dim", !!b2Q && !r.textContent.includes(b2Q)));
  });
  // 列：點一下展開（倉庫模式＝搬回行囊）、長按穿上、電腦懸停說明
  ov.querySelectorAll(".b2row[data-id]").forEach((r) => {
    const side = r.dataset.s, id = r.dataset.id, it = side === "s" ? findS(id) : findB(id); if (!it) return;
    if (side === "b") {
      r.addEventListener("pointerdown", () => { b2LPfired = false; clearTimeout(b2LP); b2LP = setTimeout(() => { b2LPfired = true; if (!equipItem(it)) { again(`${SLOTS[it.slot].n}格要${slotLockTxt(it.slot)}`); return; } eqSel = null; b3Pop = it.slot; again(`穿上了 ${it.name}`); }, 450); });
      for (const ev of ["pointerup", "pointerleave", "pointercancel"]) r.addEventListener(ev, () => clearTimeout(b2LP));
      r.addEventListener("contextmenu", (e) => e.preventDefault());
    }
    r.addEventListener("click", () => {
      if (b2LPfired) { b2LPfired = false; return; }
      sfx("click");
      if (side === "bs") { if (inWset(it)) { sfx("bad"); again("武器組的不能搬"); return; } if (stashPut(it, stPage) < 0) { sfx("bad"); again("倉庫滿了"); return; } save.bag.splice(save.bag.indexOf(it), 1); writeSave(); again(`${it.name} → 倉庫`); return; }
      if (side === "s") { if (save.bag.length >= BAG_MAX) { sfx("bad"); again("行囊滿了"); return; } const P = stashSt().pg[stPage]; P.splice(P.indexOf(it), 1); save.bag.push(it); writeSave(); again(`${it.name} → 行囊`); return; }
      propSel = null; eqSel = eqSel === it.id ? null : it.id; again();
    });
    if (tip && side === "b" && b2Hover() && !b2Pt()) {
      r.addEventListener("mouseenter", () => { tip.innerHTML = b2Detail(it, false); tip.classList.add("on"); });
      r.addEventListener("mouseleave", () => tip.classList.remove("on"));
    }
  });
  ov.querySelectorAll(".b2row[data-prop]").forEach((r) => r.addEventListener("click", () => { sfx("click"); eqSel = null; propSel = propSel === r.dataset.prop ? null : r.dataset.prop; again(); }));
  ov.querySelectorAll(".b2row[data-key]").forEach((r) => r.addEventListener("click", () => { sfx("click"); riftSel = r.dataset.key; ovGo("rift"); }));
  ov.querySelectorAll(".b2eqc[data-eq]").forEach((b) => b.addEventListener("click", () => { sfx("click"); const k = b.dataset.eq; if (cardSel) { again(insertCard(cardSel, k)); return; } propSel = null; eqSel = save.eq[k] && eqSel !== "eq:" + k ? "eq:" + k : null; again(); }));
  ov.querySelectorAll(".gmerge").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); const g = b.dataset.g, [k, l] = g.split(":"); if ((save.gems[g] || 0) < 3) return; save.gems[g] -= 3; if (!save.gems[g]) delete save.gems[g]; const ng = `${k}:${+l + 1}`; addGem(ng); propSel = "gem:" + ng; writeSave(); sfx("arrive"); again(`合成出 ${gemName(ng)}！`); }));
  // 選中物品的按鈕
  const sel = eqSel && (eqSel.startsWith("eq:") ? save.eq[eqSel.slice(3)] : findB(eqSel));
  const on = (k, f) => ov.querySelectorAll(`[data-b2="${k}"]`).forEach((e) => (e.onclick = (ev) => { ev.stopPropagation(); sfx("click"); f(); }));
  on("cardx", () => { eqSel = null; again(); });
  on("stat", () => { save.w.b2stat = save.w.b2stat ? 0 : 1; writeSave(); again(); });
  if (sel) {
    on("equip", () => { if (!equipItem(sel)) { again(`${SLOTS[sel.slot].n}格要${slotLockTxt(sel.slot)}`); return; } eqSel = null; b3Pop = sel.slot; again(`穿上了 ${sel.name}`); });
    on("unequip", () => { if (save.bag.length >= BAG_MAX) { again("行囊滿了"); return; } save.bag.push(sel); delete save.eq[sel.slot]; eqSel = null; writeSave(); if (W0) { B = worldStats(); W0.maxHp = B.maxHp; } again(); });
    on("sell", () => { if (sel.lock) return; ungem(sel); save.stone += sellPrice(sel); save.bag = save.bag.filter((b) => b !== sel); eqSel = null; writeSave(); again(`賣掉 ${sel.name}，靈石 +${sellPrice(sel)}`); });
    on("lock", () => { if (sel.lock) delete sel.lock; else sel.lock = 1; writeSave(); again(sel.lock ? `${sel.name} 鎖定了（不會被賣、被分解）` : `${sel.name} 解鎖了`); });
    on("tostash", () => { if (!atCamp() || inWset(sel)) return; if (stashPut(sel, stPage) < 0) { again("倉庫滿了"); return; } save.bag = save.bag.filter((b) => b !== sel); eqSel = null; writeSave(); again(`${sel.name} → 倉庫`); });
    ov.querySelectorAll("[data-wsset]").forEach((b) => b.addEventListener("click", () => { sfx("good"); setWSlot(+b.dataset.wsset, sel); eqSel = null; if (W0) { B = worldStats(); setPadLabels(true); } again(`放到武器 ${+b.dataset.wsset + 1}`); }));
    ov.querySelectorAll("[data-sup]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.sup; sel.sup = k; save.sups[k]--; if (!save.sups[k]) delete save.sups[k]; writeSave(); sfx("arrive"); again(`插上超技能：${SUPERS[k].n}`); }));
    ov.querySelectorAll("[data-supoff]").forEach((b) => b.addEventListener("click", () => { addSup(sel.sup); delete sel.sup; writeSave(); again("拆下超技能寶石"); }));
  }
  on("sellall", () => { sellOpen = true; sellEx = new Set(); again(); });
  on("salv", () => { b2Salv = true; again(); });
  on("allstash", () => { if (!atCamp()) return; let n = 0; for (const it of save.bag.slice()) { if (it.lock || inWset(it)) continue; if (stashPut(it, stPage) < 0) break; save.bag.splice(save.bag.indexOf(it), 1); n++; } eqSel = null; writeSave(); again(n ? `送了 ${n} 件到倉庫（鎖住的、武器組的留著）` : "沒有能送的（或倉庫滿了）"); });
  on("auto", () => { let n = 0; for (const k of SLOT_KEYS.filter(slotOpen)) { const best = save.bag.filter((b) => b.slot === k && sameWt(b)).sort((a, b) => itemCP(b) - itemCP(a))[0]; if (best && itemCP(best) > itemCP(save.eq[k])) { equipItem(best); n++; } } eqSel = null; again(n ? `換上了 ${n} 件更強的裝備` : "身上已經是最強的了"); });
  on("sorts", () => { stSort(stashSt().pg[stPage]); writeSave(); again(); });
  on("ren", () => { const S = stashSt(), t = window.prompt("這一頁的名字（最多 6 個字）", stashName(stPage)); if (t === null) return; const s = t.trim().slice(0, 6); S.nm[stPage] = s || undefined; writeSave(); again(s ? `改名：${s}` : "名字恢復預設"); });
  on("buy", () => { const S = stashSt(), c = STASH_COST[S.pg.length - STASH_BASE]; if (S.pg.length >= STASH_MAXPG || save.stone < c) return; save.stone -= c; S.pg.push([]); stPage = S.pg.length - 1; writeSave(); sfx("arrive"); again(`倉庫加開第 ${S.pg.length} 頁（−${c} 靈石）`); });
}
// 倉庫入口（stash.js 的格子版不用了）：在營地開行囊、切到倉庫
renderStash = function (msg) { b2Mode = "stash"; renderEquip(msg); };
const _ovCloseB2 = ovClose;
ovClose = function () { b2Salv = false; b2Mode = "bag"; const t = document.getElementById("b2tip"); if (t) t.classList.remove("on"); return _ovCloseB2.apply(this, arguments); };
const _ovSubB2 = ovSub;
ovSub = function () { if ((ovKind === "bag" || ovKind === "stash") && b2Salv) { b2Salv = false; renderEquip(); return true; } if (ovKind === "stash") { b2Mode = "bag"; renderEquip(); return true; } return _ovSubB2.apply(this, arguments); };
// 進世界先把超過 30 件的搬進倉庫（v9.7 驗收：頭 2 秒會顯示 40／30）
const _enterWorldB2 = enterWorld;
enterWorld = function () { const r = _enterWorldB2.apply(this, arguments); try { if (save.w && W0) stashMig(); } catch (e) {} return r; };
