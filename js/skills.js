// 萬劍仙途 — 技能頁：升級拿技能點（每升 1 級 1 點，每次轉職 +3），分頁＝基礎／一轉～四轉，每招最多 10 級
// 技能點不另外存：總點數＝(Lv−1)＋轉職×3，花掉的＝w.sk 加總（舊存檔自動有點數）
const SKILL_TABS = [["基礎", 0], ["一轉", 1], ["二轉", 2], ["三轉", 3], ["四轉", 4]];
const SKT = {
  sword: { t: 0, g: "劍", c: "#ffcf6b", n: "劍心", d: (l) => `攻擊 +${l * 3}%`, f: (b, l) => { b.atk *= 1 + l * 0.03; } },
  body: { t: 0, g: "體", c: "#ff7a6a", n: "金剛體", d: (l) => `生命 +${l * 4}%`, f: (b, l) => { b.maxHp = Math.round(b.maxHp * (1 + l * 0.04)); } },
  step: { t: 0, g: "行", c: "#9fe8ff", n: "疾行", d: (l) => `移動速度 +${(l * 1.5).toFixed(1)}%`, f: (b, l) => { b.spdMul *= 1 + l * 0.015; } },
  qi: { t: 0, g: "氣", c: "#7aa8ff", n: "吐納", d: (l) => `真氣上限 +${l * 4}、真氣回復 +${l * 8}%`, f: (b, l) => { b.maxMp += l * 4; b.mpRegen *= 1 + l * 0.08; } },
  qmast: { t: 1, g: "斬", c: "#ffcf6b", n: "劍氣斬精通", d: (l) => `Q 冷卻 −${l * 4}%、真氣消耗 −${l * 4}%`, f: (b, l) => { b.skCd.spin = 1 - l * 0.04; b.skMp.spin = 1 - l * 0.04; } },
  dodge: { t: 1, g: "影", c: "#b8ffd0", n: "靈巧身法", d: (l) => `閃身冷卻 −${l * 4}%、閃避 +${(l * 0.8).toFixed(1)}%`, f: (b, l) => { b.rollCd *= 1 - l * 0.04; b.dodge = Math.min(0.6, (b.dodge || 0) + l * 0.008); } },
  guard: { t: 1, g: "罡", c: "#d8c8a0", n: "護體罡氣", d: (l) => `護甲 +${l * 6}、法術壓制 +${l}%`, f: (b, l) => { b.armor = (b.armor || 0) + l * 6; b.supp = Math.min(0.7, (b.supp || 0) + l * 0.01); } },
  crit: { t: 2, g: "會", c: "#ffe066", n: "會心", d: (l) => `爆擊率 +${l}%`, f: (b, l) => { b.crit = (b.crit || 0) + l * 0.01; } },
  pierce: { t: 2, g: "破", c: "#ff9a4a", n: "破甲", d: (l) => `爆擊傷害 +${l * 6}%`, f: (b, l) => { b.critDmg = (b.critDmg || 2) + l * 0.06; } },
  gale: { t: 2, g: "風", c: "#9fffc8", n: "疾風劍", d: (l) => `攻擊速度 +${l * 2}%`, f: (b, l) => { b.aspd = (b.aspd || 1) * (1 + l * 0.02); } },
  tian: { t: 3, g: "雷", c: "#c8a0ff", n: "天罰精通", d: (l) => `天罰能量獲得 +${l * 6}%、E 冷卻 −${l * 3}%`, f: (b, l) => { b.enMul *= 1 + l * 0.06; b.skCd.ult = 1 - l * 0.03; } },
  blood: { t: 3, g: "血", c: "#ff5a6a", n: "嗜血", d: (l) => `吸血 +${(l * 0.5).toFixed(1)}%`, f: (b, l) => { b.leech = (b.leech || 0) + l * 0.005; } },
  wuxing: { t: 3, g: "五", c: "#7fd890", n: "五行抗性", d: (l) => `元素抗性 +${l * 2}%`, f: (b, l) => { b.res = Math.min(0.75, (b.res || 0) + l * 0.02); } },
  origin: { t: 4, g: "源", c: "#ffd27a", n: "起源劍意", d: (l) => `攻擊 +${l * 4}%`, f: (b, l) => { b.atk *= 1 + l * 0.04; } },
  undying: { t: 4, g: "滅", c: "#a0d8ff", n: "不滅", d: (l) => `生命 +${l * 5}%、能量護盾 +${l * 12}`, f: (b, l) => { b.maxHp = Math.round(b.maxHp * (1 + l * 0.05)); b.maxEs = (b.maxEs || 0) + l * 12; } },
  dan: { t: 4, g: "丹", c: "#ff8a7a", n: "丹道", d: (l) => `丹藥上限 +${Math.floor(l / 2)}、攻速 +${l}%`, f: (b, l) => { b.potMax += Math.floor(l / 2); b.aspd = (b.aspd || 1) * (1 + l * 0.01); } },
};
const SK_MAX = 10;
let skTab = 0;
const skLv = (k) => (save.w && save.w.sk && save.w.sk[k]) || 0;
const spTotal = () => Math.max(0, save.w.lv - 1) + jobLv() * 3;
const spUsed = () => Object.values(save.w.sk || {}).reduce((a, b) => a + b, 0);
const spFree = () => spTotal() - spUsed();
// 技能效果接在轉職被動後面（worldStats 最後會呼叫 jobStats）
const _jobStatsSk = jobStats;
jobStats = function (b) {
  b = _jobStatsSk(b);
  b.skCd = {}; b.skMp = {}; b.enMul = 1;
  for (const k in SKT) { const l = skLv(k); if (l) SKT[k].f(b, l); }
  return b;
};
function renderSkills(msg = "") {
  const w = save.w, j = jobLv(), free = spFree();
  w.sk = w.sk || {};
  if (typeof B !== "undefined") B = worldStats();
  const tabs = `<div class="btabs"><button class="btab${skTab === "tri" ? " on" : ""}" data-st="tri">招式${typeof triPending === "function" && triPending().length ? " ●" : ""}</button>${SKILL_TABS.map(([n, r], i) => `<button class="btab${i === skTab ? " on" : ""}" data-st="${i}">${n}${j < r ? " 🔒" : ""}</button>`).join("")}</div>`;
  if (skTab === "tri") {
    screenEl.innerHTML = `<div class="panel wide equip skwin"><div class="winhead">技能</div>${tabs}${renderTri(msg)}<div class="btns"><button id="close" class="big">離開</button></div></div>`;
    screenEl.classList.remove("hidden");
    screenEl.querySelectorAll("[data-st]").forEach((b) => b.addEventListener("click", () => { sfx("click"); skTab = b.dataset.st === "tri" ? "tri" : +b.dataset.st; renderSkills(); }));
    bindTri(); document.getElementById("close").onclick = worldReturn; return;
  }
  const [tn, need] = SKILL_TABS[skTab], locked = j < need;
  const list = Object.keys(SKT).filter((k) => SKT[k].t === need).map((k) => {
    const s = SKT[k], l = skLv(k), full = l >= SK_MAX;
    return `<div class="skrow${l ? " has" : ""}" style="--c:${s.c}"><span class="skico">${s.g}</span>
      <div class="skmain"><b>${s.n}</b><small>${l ? s.d(l) : "未學"}${full ? "（滿級）" : `　下一級：${s.d(l + 1)}`}</small></div>
      <span class="sklv">${l}<small>/${SK_MAX}</small></span>
      <button class="skup" data-sk="${k}" ${!locked && free > 0 && !full ? "" : "disabled"}>＋</button></div>`;
  }).join("");
  screenEl.innerHTML = `<div class="panel wide equip skwin"><div class="winhead">技能</div>
    ${tabs}
    <div class="skjob">${need ? (typeof JOBS !== "undefined" && JOBS[need - 1] ? JOBS[need - 1].n : tn) : "基礎心法"}${locked ? `<small>完成${tn}（Lv.${JOBS[need - 1].lv}）才能學</small>` : ""}</div>
    ${msg ? `<div class="emsg">${msg}</div>` : ""}
    <div class="sklist${locked ? " locked" : ""}">${list}</div>
    <div class="apfoot"><span>技能點數</span><b>${free}</b><button id="skReset" class="sbtn" ${spUsed() ? "" : "disabled"}>重置技能 −${30 * w.lv} 靈石</button></div>
    <p class="sub">每升 1 級得 1 點，每次轉職再 +3。招式本身跟著武器走，這裡學的是心法（全部武器都吃）。</p>
    <div class="btns"><button id="close" class="big">離開</button></div></div>`;
  screenEl.classList.remove("hidden");
  screenEl.querySelectorAll("[data-st]").forEach((b) => b.addEventListener("click", () => { sfx("click"); skTab = b.dataset.st === "tri" ? "tri" : +b.dataset.st; renderSkills(); }));
  screenEl.querySelectorAll("[data-sk]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.sk; if (spFree() <= 0 || skLv(k) >= SK_MAX) return;
    w.sk[k] = skLv(k) + 1; writeSave(); sfx("good"); renderSkills(`${SKT[k].n} 升到 ${w.sk[k]} 級`);
  }));
  document.getElementById("skReset").onclick = () => {
    const c = 30 * w.lv; if (save.stone < c) { sfx("bad"); renderSkills(`靈石不夠（要 ${c}）`); return; }
    save.stone -= c; w.sk = {}; writeSave(); renderSkills("技能點數全部退回");
  };
  document.getElementById("close").onclick = worldReturn;
}
// 右上快捷鈕紅點：有能力點／可以轉職 → 角色；有技能點 → 技能
setInterval(() => {
  const w = save.w; if (!w || !w.created) return;
  const J = JOBS[jobLv()], q = (k) => document.querySelector(`#quick .qbtn[data-q="${k}"]`);
  const a = q("ap"), s = q("skill");
  if (a) a.classList.toggle("dot", (w.free || 0) > 0 || (!!J && w.lv >= J.lv));
  if (s) s.classList.toggle("dot", spFree() > 0 || (typeof triPending === "function" && triPending().length > 0));
}, 1000);
