// 御劍渡劫（pixel-raid）— 秘境：秘境鑰（層數＋隨機詞綴）、秘境畫面、秘境結算
// 玩法：用鑰匙開秘境 → 斬妖到門檻 → 秘境之主現身 → 打倒噴寶＋掉更高層的鑰匙。詞綴越危險，掉寶越多。
"use strict";

// 企劃 16：前綴＝好處（金字）、後綴＝危險（紅字）。q＝物品數量 %、r＝物品品質 %
const MAP_MODS = {
  // 前綴（好處）
  qty: { t: "p", n: "物品數量 +30%", q: 30 },
  rar: { t: "p", n: "物品品質 +40%", r: 40 },
  elites: { t: "p", n: "精英成群（精英 ×3）", q: 10 },
  swarm: { t: "p", n: "怪物數量 +40%", q: 20 },
  keyf: { t: "p", n: "鑰匙掉率 +30%（高一層）", q: 5 },
  // 後綴（危險）
  hp: { t: "s", n: "怪物血量 +40%", q: 12 },
  fast: { t: "s", n: "怪物移速 +25%", q: 10 },
  dmg: { t: "s", n: "怪物傷害 +30%", q: 14 },
  noregen: { t: "s", n: "回血、吸血 −60%", q: 12 },
  nomp: { t: "s", n: "真氣回復 −40%", q: 10 },
  lowres: { t: "s", n: "元素抗性 −20%", q: 10 },
  physw: { t: "s", n: "物理護體（物理傷害 −40%）", q: 16, bad: (wt) => !SPELL_WT[wt] },
  spellw: { t: "s", n: "法術護體（法術傷害 −40%）", q: 16, bad: (wt) => !!SPELL_WT[wt] },
  reflect: { t: "s", n: "反震（你造成傷害的 5% 彈回）", q: 14 },
  lordhp: { t: "s", n: "秘境之主血量 +60%", q: 12 },
  // v6.6 補企劃 16 §3-5、§9（效果在 riftmod.js）；g 同一組只會骰到一條
  curse: { t: "s", n: "詛咒怪（死掉留下毒池）", q: 12 },
  thund: { t: "s", n: "雷擊（怪死掉 0.6 秒後落雷）", q: 12 },
  brkfast: { t: "s", n: "破體加速（小怪也會疊破體，4 秒才清）", q: 12 },
  ...Object.fromEntries(["F", "W", "T", "P"].flatMap((e) => [
    ["eleup_" + e, { t: "s", g: "eleup", e, n: `元素加持（怪物全部變${ELE_N[e]}屬性）`, q: 8 }],
    ["eleimm_" + e, { t: "s", g: "eleimm", e, n: `${ELE_N[e]}元素免疫（${ELE_N[e]}元素武器傷害 −70%）`, q: 14, bad: () => typeof wEle === "function" && wEle() === e }],
  ])),
};
const KEY_MAX = 20, RIFT_MAX = 10;
const KEY_RARITY = [{ n: "凡", c: "#d8d2e0", mods: [0, 0] }, { n: "靈", c: "#6fb8ff", mods: [1, 2] }, { n: "玄", c: "#ffd84a", mods: [3, 4] }];
const riftLv = (tier) => (tier <= 10 ? 25 + 5 * tier : tier <= 20 ? 75 + 5 * (tier - 10) : 125 + 3 * (tier - 20)); // 1–10 層 Lv.30→75；11–20 層每層 +5（→125）；21 層以上每層 +3（企劃 16 §3-2）
const riftCap = () => (save.w && typeof rbKilled === "function" && rbKilled("sky") ? 9999 : RIFT_MAX); // 打倒無相劍尊才沒有上限
const keyTierFor = (lv) => (lv < 28 ? 0 : clamp(Math.round((lv - 25) / 5), 1, RIFT_MAX));
function makeKey(tier, q = null) {
  if (q === null) { const r = Math.random(); q = r < 0.15 ? 2 : r < 0.55 ? 1 : 0; }
  const k = { id: "k" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), tier: clamp(tier, 1, riftCap()), q, mods: [], v: 2 };
  const [a, b] = KEY_RARITY[q].mods;
  rollKeyMods(k, a + Math.floor(Math.random() * (b - a + 1)));
  return k;
}
function rollKeyMods(k, n) { // 一半前綴一半後綴（單數時後綴多一條）
  const pre = Object.keys(MAP_MODS).filter((m) => MAP_MODS[m].t === "p" && !MAP_MODS[m].x); let suf = Object.keys(MAP_MODS).filter((m) => MAP_MODS[m].t === "s" && !MAP_MODS[m].x);
  const grp = {}; suf = suf.filter((m) => { const g = MAP_MODS[m].g; if (!g) return true; (grp[g] = grp[g] || []).push(m); return false; }); // 同一組（四種元素）只留一條，機率跟一般詞綴一樣
  for (const g in grp) suf.push(grp[g][Math.floor(Math.random() * grp[g].length)]);
  const ns = Math.ceil(n / 2), np = n - ns, pick = (arr) => arr.splice(Math.floor(Math.random() * arr.length), 1)[0];
  k.mods = [];
  for (let i = 0; i < ns; i++) k.mods.push(pick(suf));
  for (let i = 0; i < np; i++) k.mods.push(pick(pre));
  if (k.mods.includes("physw") && k.mods.includes("spellw")) k.mods = k.mods.filter((m) => m !== "spellw"); // 兩個護體不會同時出現
}
const keyQuant = (k) => k.mods.reduce((s, m) => s + (MAP_MODS[m].q || 0), 0) + k.q * 10; // 物品數量 %
const keyRar = (k) => k.mods.reduce((s, m) => s + (MAP_MODS[m].r || 0), 0); // 物品品質 %
const keyStars = (k) => Math.min(5, 1 + k.mods.filter((m) => MAP_MODS[m].t === "s").length + (k.tier >= 8 ? 1 : 0));
const keyWarn = (k) => k.mods.filter((m) => MAP_MODS[m].bad && MAP_MODS[m].bad(curWeapon()));
const keyName = (k) => `第 ${k.tier} 層秘境`;
const keyCost = (k, up) => Math.round((up ? 20 : 8) * (1 + k.tier * 0.4));
const hasMod = (m) => (typeof RIFT !== "undefined" && RIFT ? RIFT.key.mods.includes(m) : hunt && hunt.map && hunt.map.mods.includes(m));
function addKey(k) {
  if (save.keys.length >= KEY_MAX) { save.keys.sort((a, b) => a.tier - b.tier); save.keys.shift(); }
  save.keys.push(k);
  writeSave();
}
// 舊鑰匙（斬妖試煉版）轉成新鑰匙：層數壓到 1–10、詞綴照品質重骰
function migKeys() {
  if (!save.keys) save.keys = [];
  let n = 0;
  for (const k of save.keys) if (k.v !== 2) { k.tier = clamp(k.tier || 1, 1, RIFT_MAX); const [a, b] = KEY_RARITY[k.q || 0].mods; rollKeyMods(k, Math.min(b, Math.max(a, (k.mods || []).length))); k.v = 2; n++; }
  if (n) writeSave();
}

// ───────── 秘境畫面 ─────────
let keySel = null;
function renderMaps(msg = "") {
  state = "title";
  pad.classList.add("hidden");
  const keys = save.keys.slice().sort((a, b) => b.tier - a.tier || b.q - a.q);
  const sel = save.keys.find((k) => k.id === keySel);
  const detail = sel ? `<div class="compare"><div class="ccol new">
      <div class="ihead" style="color:${KEY_RARITY[sel.q].c}">【${KEY_RARITY[sel.q].n}】${keyName(sel)}<small>裝備等級約 ${sel.tier - 1 + realmIdx()}　妖獸強度 ×${(1 + 0.35 * (sel.tier - 1)).toFixed(2)}</small></div>
      ${sel.mods.length ? sel.mods.map((m) => `<div class="srow"><span>${MAP_MODS[m].n}</span><b>寶 +${MAP_MODS[m].q}%</b></div>`).join("") : `<div class="srow none">（沒有詞綴）</div>`}
      <div class="srow"><span>掉寶加成合計</span><b>+${keyQuant(sel)}%</b></div>
      <div class="cbtns">
        <button id="enter" class="sbtn gold">進入秘境</button>
        ${sel.q < 2 ? `<button id="kup" class="sbtn">點金 −${keyCost(sel, true)}</button>` : ""}
        ${sel.q > 0 ? `<button id="kroll" class="sbtn">洗練 −${keyCost(sel, false)}</button>` : ""}
        <button id="kdel" class="sbtn red">丟掉</button>
      </div>
      <small class="hint">死掉鑰匙會消失，但撿到的裝備都留著。點金：多一條詞綴（更危險、更多寶）</small>
    </div></div>` : "";
  screenEl.innerHTML = `<div class="panel wide equip">
    <h1 class="pick-title">秘境</h1>
    <div class="cpline">戰力 <b>${totalCP()}</b>　最深 <b>${save.maxTier || 0}</b> 層　靈石 <b class="stone">${save.stone}</b></div>
    ${msg ? `<div class="emsg">${msg}</div>` : ""}
    ${detail}
    <div class="baghead">秘境鑰 ${save.keys.length} / ${KEY_MAX}</div>
    <div class="bag">${keys.map((k) => `<button class="bitem${keySel === k.id ? " sel" : ""}" data-id="${k.id}" style="border-color:${KEY_RARITY[k.q].c}"><small>${KEY_RARITY[k.q].n}・${k.mods.length} 詞綴</small><b style="color:${KEY_RARITY[k.q].c}">第 ${k.tier} 層</b><i>寶 +${keyQuant(k)}%</i></button>`).join("")}</div>
    ${save.keys.some((k) => k.tier === 1) ? "" : `<div class="btns"><button id="freeKey" class="big">領取第 1 層秘境鑰（免費）</button></div>`}
    <div class="btns"><button id="equipBtn2" class="big alt">裝備</button><button id="back" class="big alt">${inWorld ? "回到仙界" : "返回"}</button></div>
  </div>`;
  screenEl.classList.remove("hidden");
  screenEl.querySelectorAll(".bitem").forEach((b) => b.addEventListener("click", () => { keySel = keySel === b.dataset.id ? null : b.dataset.id; renderMaps(); }));
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
  on("back", () => { keySel = null; inWorld ? worldReturn() : renderTitle(); });
  on("equipBtn2", () => { eqSel = null; renderEquip(); });
  on("freeKey", () => { const k = makeKey(1, 0); addKey(k); keySel = k.id; renderMaps("領到一把第 1 層秘境鑰"); });
  on("enter", () => { save.keys = save.keys.filter((k) => k !== sel); writeSave(); keySel = null; startHunt(sel); });
  on("kdel", () => { save.keys = save.keys.filter((k) => k !== sel); writeSave(); keySel = null; renderMaps(); });
  on("kup", () => {
    const c = keyCost(sel, true);
    if (save.stone < c) { renderMaps("靈石不夠"); return; }
    save.stone -= c; sel.q++;
    rollKeyMods(sel, Math.max(KEY_RARITY[sel.q].mods[0], sel.mods.length + 1));
    writeSave(); sfx("arrive"); renderMaps(`點金成功，升為${KEY_RARITY[sel.q].n}鑰！`);
  });
  on("kroll", () => {
    const c = keyCost(sel, false);
    if (save.stone < c) { renderMaps("靈石不夠"); return; }
    save.stone -= c;
    rollKeyMods(sel, sel.mods.length);
    writeSave(); sfx("good"); renderMaps("洗練完成！");
  });
}

// 秘境完成
function showMapDone() {
  const h = hunt, t = h.map.tier;
  if (t > (save.maxTier || 0)) save.maxTier = t;
  const gain = Math.round(40 + t * 25 + h.kills / 4);
  save.xiuwei += gain;
  writeSave();
  screenEl.innerHTML = `<div class="panel">
    <h1>${keyName(h.map)} 通關！</h1>
    <div class="result">斬妖 ${h.kills} 隻　${h.lv} 級　${Math.floor(time)} 秒</div>
    <div class="gain">修為 +${gain}　靈石 +${h.stoneGot}</div>
    ${h.keysGot.length ? `<div class="drop">得到秘境鑰：${h.keysGot.map((k) => `<b style="color:${KEY_RARITY[k.q].c}">第 ${k.tier} 層</b>`).join("、")}</div>` : ""}
    ${lootHtml()}
    <div class="btns"><button id="maps" class="big">繼續刷秘境</button><button id="equipBtn3" class="big alt">裝備</button><button id="home" class="big alt">${inWorld ? "回到仙界" : "回主畫面"}</button></div>
  </div>`;
  screenEl.classList.remove("hidden");
  document.getElementById("maps").onclick = () => renderMaps();
  document.getElementById("equipBtn3").onclick = () => { eqSel = null; renderEquip(); };
  document.getElementById("home").onclick = () => (inWorld ? enterWorld() : renderTitle());
}
