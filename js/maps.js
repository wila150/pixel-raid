// 御劍渡劫（pixel-raid）— 秘境：秘境鑰（層數＋隨機詞綴）、秘境畫面、秘境結算
// 玩法：用鑰匙開秘境 → 斬妖到門檻 → 秘境之主現身 → 打倒噴寶＋掉更高層的鑰匙。詞綴越危險，掉寶越多。
"use strict";

const MAP_MODS = {
  hp: { n: "妖獸血量 +40%", q: 15 },
  fast: { n: "妖獸移動 +25%", q: 15 },
  dmg: { n: "妖獸傷害 +30%", q: 15 },
  elites: { n: "妖將成群（每 25 秒一隻）", q: 20 },
  golem: { n: "石甲大軍", q: 10 },
  wolf: { n: "狼群出沒", q: 10 },
  noregen: { n: "回血效果 −60%", q: 12 },
  lord: { n: "秘境之主血量 +60%", q: 18 },
  swarm: { n: "妖獸數量 +40%", q: 18 },
};
const KEY_MAX = 20;
const KEY_RARITY = [{ n: "凡", c: "#d8d2e0", mods: [0, 0] }, { n: "靈", c: "#6fb8ff", mods: [1, 2] }, { n: "玄", c: "#ffd84a", mods: [3, 4] }];
function makeKey(tier, q = null) {
  if (q === null) { const r = Math.random(); q = r < 0.15 ? 2 : r < 0.55 ? 1 : 0; }
  const k = { id: "k" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), tier: Math.max(1, tier), q, mods: [] };
  const [a, b] = KEY_RARITY[q].mods;
  rollKeyMods(k, a + Math.floor(Math.random() * (b - a + 1)));
  return k;
}
function rollKeyMods(k, n) {
  const pool = Object.keys(MAP_MODS);
  k.mods = [];
  for (let i = 0; i < n && pool.length; i++) k.mods.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
}
const keyQuant = (k) => k.mods.reduce((s, m) => s + MAP_MODS[m].q, 0) + k.q * 10; // 掉寶加成 %
const keyName = (k) => `第 ${k.tier} 層秘境`;
const keyCost = (k, up) => Math.round((up ? 20 : 8) * (1 + k.tier * 0.4));
const hasMod = (m) => hunt && hunt.map && hunt.map.mods.includes(m);
function addKey(k) {
  if (save.keys.length >= KEY_MAX) { save.keys.sort((a, b) => a.tier - b.tier); save.keys.shift(); }
  save.keys.push(k);
  writeSave();
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
    <div class="btns"><button id="equipBtn2" class="big alt">裝備</button><button id="back" class="big alt">返回</button></div>
  </div>`;
  screenEl.classList.remove("hidden");
  screenEl.querySelectorAll(".bitem").forEach((b) => b.addEventListener("click", () => { keySel = keySel === b.dataset.id ? null : b.dataset.id; renderMaps(); }));
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
  on("back", () => { keySel = null; renderTitle(); });
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
    <div class="btns"><button id="maps" class="big">繼續刷秘境</button><button id="equipBtn3" class="big alt">裝備</button><button id="home" class="big alt">回主畫面</button></div>
  </div>`;
  screenEl.classList.remove("hidden");
  document.getElementById("maps").onclick = () => renderMaps();
  document.getElementById("equipBtn3").onclick = () => { eqSel = null; renderEquip(); };
  document.getElementById("home").onclick = renderTitle;
}
