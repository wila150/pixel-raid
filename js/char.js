// 萬劍仙途 — 角色畫面（v4.7，企劃 05）：跟行囊一樣的覆蓋層 #ov，左＝角色本人、中＝分頁（屬性／修行／外觀）、右＝數值說明
"use strict";

let chTab = "attr", chHelp = null, chList = false, chDef = false;
// 數值說明：這是什麼、怎麼提高
const STAT_HELP = {
  str: ["STR 力量", "大刀、拳的主屬性：每點傷害 +3%。所有武器：每點護甲 +3。", "天賦樹紅色區（左下）最多。★＝你現在武器的主屬性。"],
  agi: ["AGI 敏捷", "劍、弓的主屬性：每點傷害 +1.7%、攻速 +0.3%（攻速上限 200%）。所有武器：閃避 +0.4%、法術壓制 +0.3%、移動 +0.5%（只算前 80 點）。", "天賦樹綠色區（右下）最多。"],
  wis: ["INT 智力", "法杖、扇的主屬性：每點傷害 +3%。所有武器：能量護盾 +6、真氣 +4。", "天賦樹藍色區（上方）最多。"],
  vit: ["VIT 體魄", "每點生命 +12、護甲 +1。", "天賦樹各區之間的走道上。"],
  atk: ["攻擊", "所有招式的傷害倍率。", "靠等級、力量／智慧、武器、攻擊詞綴、技能「劍心」提高。"],
  crit: ["爆擊率", "每一下打出爆擊的機率。", "靠飾品、爆擊詞綴、技能「會心」提高。"],
  critDmg: ["爆擊傷害", "爆擊時傷害是平常的幾倍（200% ＝ 2 倍）。", "靠爆傷詞綴、技能「破甲」、天狐卡提高。"],
  aspd: ["攻擊速度", "出招快多少（120% ＝ 快兩成）。最多 200%，超過的部分每 1% 換成 0.5% 攻擊。", "靠敏捷、攻速詞綴、二轉、技能「疾風劍」提高。"],
  spd: ["移動速度", "走路快多少。敏捷、裝備、自動成長加起來最多 175%（坐騎、凌波這類暫時效果另外算）。", "靠敏捷、靴子、一轉、技能「疾行」提高。"],
  hp: ["生命", "歸零就倒下、扣經驗回城。", "靠等級、體質、道袍、生命詞綴提高。"],
  mp: ["真氣", "放 Q、E 招要花真氣。", "靠等級、智慧、技能「吐納」提高。"],
  armor: ["護甲", "減少被近戰、物理攻擊打到的傷害，越多越硬。", "靠力量、體質、道袍和頭冠的護甲詞綴提高。"],
  dodge: ["閃避", "有這個機率完全不受傷（最多 50%）。", "靠敏捷、閃避詞綴、技能「靈巧身法」提高。"],
  supp: ["法術壓制", "被子彈、法術打中時，有這個機率傷害減半。", "靠敏捷、後綴詞綴、技能「護體罡氣」提高。"],
  phys: ["物理減免", "被沒有元素的攻擊（咬、砸、箭、劍氣）打到時少扣這麼多（最多 75%）。這裡顯示的是被同等級一般怪打一下的減免，越重的攻擊擋越少。", "靠護甲：力量、體質、道袍和頭冠的護甲詞綴、石甲妖卡。"],
  resF: ["火焰抗性", "火鴉、熔岩獸、焚天石魔、熔岩地面的傷害少扣這麼多（最多 75%）。", "靠火抗、全元素抗性詞綴（戒指、耳飾最常出）、避火丹 +30%。"],
  resW: ["冰冷抗性", "霜狼、冰靈、雪巨猿的傷害少扣這麼多（最多 75%）。寒霜雪域會扣 20%。", "靠冰抗、全元素抗性詞綴、冰靈卡 +25%、避寒丹 +30%。"],
  resT: ["閃電抗性", "雷鷹、雷甲巨像、雷靈、九雷鵬王、落雷的傷害少扣這麼多（最多 75%）。雷霆峽谷會扣 40%。", "靠雷抗、全元素抗性詞綴、避雷丹 +30%。"],
  resP: ["混沌抗性", "毒池、毒沼蟾、屍骨狼、腐沼樹妖、腐骨蟾王的傷害少扣這麼多（最多 75%）。幽冥沼澤會扣 20%。", "比較難拿：混沌抗性詞綴（很少見）、腐骨蟾王卡 +20%、避毒丹 +30%。全元素抗性不含混沌。"],
  es: ["能量護盾", "一層先扣的護盾，幾秒沒被打會自己回滿。", "靠智慧、護盾詞綴、天兵石像卡提高。"],
  leech: ["吸血", "打出傷害的這麼多 % 變成自己的生命。", "靠嗜血寶石、吸血詞綴、血玉佩、技能「嗜血」提高。"],
  mpRegen: ["真氣回復", "每秒回多少真氣。", "靠等級、智慧、技能「吐納」提高。"],
};
const TAB_HELP = {
  attr: ["數值", "屬性從天賦樹來：每升 1 級 1 點天賦點、每次轉職 +2。點任何一行，這裡會說明那個數值。", "武器看顏色吃主屬性：大刀拳＝力量、劍弓＝敏捷、法杖扇＝智力。"],
  cult: ["修行", "轉職不換職業，是讓角色變強：多輔助插槽、加段數、解鎖護身法術。", "護身法術就是 V（手機下方最右邊那顆）的保命技，在安全營地可以換。"],
  look: ["外觀", "暱稱是別的玩家看到的名字；時裝只改外觀，不影響數值。", ""],
};
function chStats() {
  const pc = (v) => Math.round(v * 100) + "%";
  return {
    main: [["atk", "攻擊", "×" + B.atk.toFixed(2)], ["crit", "爆擊率", pc(B.crit || 0)], ["critDmg", "爆擊傷害", pc(B.critDmg || 2)], ["aspd", "攻擊速度", pc(B.aspd || 1) + (B.aspdCap ? "（上限）" : ""), B.aspdCap ? "cap" : ""], ["spd", "移動速度", pc(B.spdMul || 1) + (B.spdCap ? "（上限）" : ""), B.spdCap ? "cap" : ""], ["hp", "生命", B.maxHp], ["mp", "真氣", B.maxMp]],
    res: [["phys", "物理減免", pc(physRed())]].concat(ELES.map((e) => ["res" + e, RES_N[e], pc(effRes(e)), effRes(e) < 0 ? "neg" : effRes(e) >= RES_CAP ? "cap" : ""])),
    def: [["armor", "護甲", Math.round(B.armor || 0)], ["dodge", "閃避", pc(B.dodge || 0)], ["supp", "法術壓制", pc(B.supp || 0)], ["es", "能量護盾", B.maxEs || 0], ["leech", "吸血", pc(B.leech || 0)], ["mpRegen", "真氣回復", (B.mpRegen || 0).toFixed(1) + "/秒"]],
  };
}
const chRow = ([k, n, v, c]) => `<button class="chrow${chHelp === k ? " sel" : ""}${c ? " " + c : ""}" data-help="${k}"><span>${n}</span><b>${v}</b></button>`;
function chAttr() {
  const w = save.w, s = chStats();
  const res5 = `<div class="res5">${s.res.map(([k, n, v, c]) => `<button class="r5${chHelp === k ? " sel" : ""}${c ? " " + c : ""}" data-help="${k}"><span>${k === "phys" ? "物理" : n}</span><b>${v}</b></button>`).join("")}</div>${resPen() > 0 ? `<div class="r5pen">此地元素抗性 −${Math.round(resPen() * 100)}%（上面已經算進去）</div>` : ""}`;
  const a = typeof treeAttr === "function" ? treeAttr() : w.ap, main = (typeof TR_WMAIN !== "undefined" && TR_WMAIN[curWeapon()]) || "str", fr = typeof treeFree === "function" ? treeFree() : 0;
  // 企劃 26 §8：五個防禦＋攻擊、攻速、移速、爆擊；其他收進「詳細數值」
  const top = ["atk", "aspd", "spd", "crit"], m = s.main.filter((r) => top.includes(r[0])).sort((x, y) => top.indexOf(x[0]) - top.indexOf(y[0]));
  return res5 + `<div class="chhead">攻擊</div><div class="chgrid">${m.map(chRow).join("")}</div>
    <button class="chhead fold" id="chDef">詳細數值 ${chDef ? "▾" : "▸"}</button>${chDef ? `<div class="chsec">${["str", "agi", "wis", "vit"].map((k) => `<div class="chap${chHelp === k ? " sel" : ""}"><button class="chname" data-help="${k}">${AP[k].n}${k === main ? " ★" : ""}</button><b>${a[k]}</b></div>`).join("")}
    <div class="chapfoot"><span>天賦點 <b class="${fr > 0 ? "hot" : ""}">${fr}</b></span><button id="toTree">天賦樹（P）</button></div></div>
    <div class="chgrid">${s.main.filter((r) => !top.includes(r[0])).concat(s.def).map(chRow).join("")}</div>` : ""}`;
}
function chCult() {
  const w = save.w, j = jobLv(), J = JOBS[j], camp = atCamp(), cur = svKey();
  const jobs = JOBS.map((x, i) => {
    const st = i < j ? "done" : i === j ? "next" : "";
    const bar = i === j ? `<div class="chbar"><i style="width:${Math.min(100, Math.round(w.lv / x.lv * 100))}%"></i></div><small>${w.lv >= x.lv ? "可以轉職了！" : `Lv.${w.lv} / ${x.lv}`}</small>` : "";
    return `<div class="chjob ${st}"><b>${i < j ? "✓ " : ""}${x.n}</b><small>Lv.${x.lv}・${x.d}</small>${bar}</div>`;
  }).join("");
  const saves = SAVE_KEYS.map((k) => {
    const s = SAVES[k], has = svHas(k), on = k === cur;
    return `<button class="chsave${on ? " on" : ""}${has ? "" : " lock"}" data-sv="${k}" ${has && !on ? "" : "disabled"}><b>${s.n}</b><small>${s.d}</small><em>${on ? "使用中" : has ? (camp ? "點一下換上" : "回營地才能換") : `${JOBS[s.job - 1].n.split("・")[0]}解鎖`}・冷卻 ${s.cd} 秒</em></button>`;
  }).join("");
  return `<div class="chhead">轉職 <small>${j ? JOBS[j - 1].n : "未轉職"}</small></div><div class="chjobs">${jobs}</div>
    ${J ? `<button id="doJob" class="chbig${w.lv >= J.lv ? " gold" : ""}" ${w.lv >= J.lv ? "" : "disabled"}>${w.lv >= J.lv ? `進行 ${J.n}` : `Lv.${J.lv} 可以 ${J.n}`}</button>` : `<p class="dim">已經完成四轉</p>`}
    <div class="chhead">護身法術 <small>V／手機下方最右邊那顆</small></div><div class="chsaves">${saves}</div>`;
}
function chLeft() {
  const w = save.w, en = expNext(w.lv), j = jobLv(), cs = charList();
  const list = chList ? `<div class="chchars">${cs.map((c, i) => { const cw = i === save.ci ? w : c && c.w; if (!cw) return ""; return `<button class="cchar${i === save.ci ? " on" : ""}" data-char="${i}"><b>${cw.nick || "修士"}</b><small>Lv.${cw.lv}${jobLvOf(cw) ? "・" + JOBS[cw.job - 1].n.split("・")[0] : ""}</small></button>`; }).join("")}
      ${cs.length < 3 ? `<button class="cchar new" id="newChar"><b>＋ 新角色</b><small>從 Lv.1 開始</small></button>` : ""}<p class="dim">行囊共用；每個角色有自己的等級、配點、裝備、轉職。要在安全營地換。</p></div>` : "";
  return `<div class="chme"><div class="chpic"><img src="${heroURL()}" alt=""></div>
    <div class="chid"><h3>${myName()}</h3><small>Lv.${w.lv}・${j ? JOBS[j - 1].n : "未轉職"}・${WEAPONS[curWeapon()].job}</small>
      <div class="chcp">戰力 <b>${cpTxt()}</b></div>${(() => { const p = cpParts(); return p ? `<div class="chdps" title="打木樁只用普攻的預估：攻擊倍率×攻速×爆擊期望×段數×普攻的輔助寶石／技能寶石">預估每秒傷害 <b>${fmtN(p.dps)}</b><small>攻擊分 ${fmtN(p.atk)}＋防禦分 ${fmtN(p.def)}</small></div>` : ""; })()}
      <div class="chbar exp"><i style="width:${Math.floor(w.exp / en * 100)}%"></i></div><small>經驗 ${w.exp} / ${en}（${Math.floor(w.exp / en * 100)}%）</small></div></div>
    <button id="chList" class="chsmall">${chList ? "收起角色列表" : `切換角色（${cs.filter(Boolean).length + (cs[save.ci] ? 0 : 1)}）`}</button>${list}`;
}
function chRight() {
  const h = (chHelp && STAT_HELP[chHelp]) || TAB_HELP[chTab];
  return `<div class="chhelp"><div class="winhead">${chHelp ? "數值說明" : "說明"}</div><h3>${h[0]}</h3><p>${h[1]}</p>${h[2] ? `<p class="dim">${h[2]}</p>` : ""}</div>`;
}
function renderChar(msg = "") {
  if (!save.w) return;
  if (ovKind !== "char" && !ovOpen("char")) return;
  if (msg) ovMsg = msg;
  B = worldStats();
  if (chTab === "cult") chTab = "attr"; // v7.6：轉職、護身法術搬到技能頁
  const tabs = [["attr", "數值", false], ["look", "外觀", false]];
  const body = chTab === "attr" ? chAttr() : fashionHtml();
  ov.innerHTML = `<div class="col l chbox">${chLeft()}</div>
    <div class="col c chbox"><div class="btabs">${tabs.map(([k, n, dot]) => `<button class="btab${chTab === k ? " on" : ""}" data-ct="${k}">${n}${dot ? " ●" : ""}</button>`).join("")}</div>${body}</div>
    <div class="col r chbox">${chRight()}</div>
    ${ovMsg ? `<div class="toast">${ovMsg}</div>` : ""}`;
  ovMsg = "";
  bindChar();
}
function bindChar() {
  const w = save.w, again = (m) => renderChar(m);
  ov.querySelectorAll("[data-ct]").forEach((b) => b.addEventListener("click", () => { sfx("click"); chTab = b.dataset.ct; chHelp = null; again(); }));
  ov.querySelectorAll("[data-help]").forEach((b) => b.addEventListener("click", () => { sfx("click"); chHelp = chHelp === b.dataset.help ? null : b.dataset.help; again(); }));
  const tt = document.getElementById("toTree"); if (tt) tt.onclick = () => { sfx("click"); ovGo("tree"); };
  const df = document.getElementById("chDef"); if (df) df.onclick = () => { sfx("click"); chDef = !chDef; again(); };
  bindCult(again);
  const cl = document.getElementById("chList"); if (cl) cl.onclick = () => { sfx("click"); chList = !chList; again(); };
  ov.querySelectorAll("[data-char]").forEach((b) => b.addEventListener("click", () => { const m = switchChar(+b.dataset.char); if (m) again(m); }));
  const nc = document.getElementById("newChar"); if (nc) nc.onclick = () => { const m = newChar(); if (m) again(m); };
  if (chTab === "look") bindFashion();
}
// 舊的 renderAP（world.js）換成新的角色覆蓋層；openHud("ap")、改暱稱、換時裝都會呼叫 renderAP
// 轉職＋護身法術（v7.6 起在技能頁「轉職」分頁）
function bindCult(again) {
  const w = save.w, dj = document.getElementById("doJob"); if (dj) dj.onclick = () => { if (doJob()) again(`完成${JOBS[jobLv() - 1].n}！`); };
  ov.querySelectorAll("[data-sv]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.sv; if (!svHas(k)) return;
    if (!atCamp()) { sfx("bad"); again("回到安全營地才能換護身法術"); return; }
    w.sv = k; writeSave(); sfx("arrive"); if (typeof wbarDraw === "function") wbarDraw(true); again(`護身法術：${SAVES[k].n}`);
  }));
}
renderAP = function (msg) { renderChar(typeof msg === "string" ? msg : ""); };
OV_KEYS.char = ["escape", "c", "o"];
