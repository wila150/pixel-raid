// 萬劍仙途 — 技能頁（企劃 21 §8-2，v6.7）：心法點數拿掉，改成每升 1 級自動成長；分頁＝技能鏈｜大節點｜巔峰
// 舊存檔點過的心法（save.w.sk）自動退掉，不用重置費
"use strict";
// 每級自動成長（取代 16 招心法；舊心法平均點法 Lv.120 約傷害 ×2.3、生命 ×1.9，這裡抓接近）
const SK_AUTO = { atk: 0.01, hp: 0.008, mp: 1 / 3, mpRegen: 0.006, spd: 0.001 };
const autoTxt = (lv) => `攻擊 +${Math.round(lv * SK_AUTO.atk * 100)}%、生命 +${Math.round(lv * SK_AUTO.hp * 100)}%、真氣上限 +${Math.floor(lv * SK_AUTO.mp)}、真氣回復 +${Math.round(lv * SK_AUTO.mpRegen * 100)}%、移動 +${(lv * SK_AUTO.spd * 100).toFixed(1)}%`;
// 舊程式還會查的名字（大節點以前看技能點門檻）
const SK_NEED = [0, 0, 0, 0, 0];
const spBelow = () => 0;
const skGateOk = () => true;
const spFree = () => 0;
let skTab = "tri";
const _jobStatsSk = jobStats;
jobStats = function (b) {
  b = _jobStatsSk(b);
  b.skCd = {}; b.skMp = {}; b.enMul = 1;
  const lv = Math.max(0, ((save.w && save.w.lv) || 1) - 1);
  b.atk *= 1 + lv * SK_AUTO.atk; b.maxHp = Math.round(b.maxHp * (1 + lv * SK_AUTO.hp));
  b.maxMp += Math.floor(lv * SK_AUTO.mp); b.mpRegen *= 1 + lv * SK_AUTO.mpRegen; b.spdMul *= 1 + lv * SK_AUTO.spd;
  return b;
};
function skMig() { // 舊存檔：心法點數退掉
  const w = save.w; if (!w || !w.sk) return;
  const had = Object.values(w.sk).some((v) => v > 0);
  delete w.sk; delete w.skFree; delete w.skChk; writeSave();
  if (had && typeof notice === "function") notice("心法改成每升一級自動成長了，點過的點數已經退掉；招式改到「技能 → 技能鏈」自己選", "#ffe066");
}
function renderSkills(msg = "") {
  const w = save.w;
  if (ovKind !== "skill" && !ovOpen("skill")) return; // 企劃 15：改用覆蓋層
  skMig();
  if (skTab !== "job") skTab = "tri"; // v7.2：大節點、巔峰點搬到天賦樹；v7.6：轉職、護身法術從角色頁搬來
  if (typeof B !== "undefined") B = worldStats();
  const nw = typeof triNew === "function" && triNew().length, J = JOBS[jobLv()], jd = !!J && w.lv >= J.lv;
  const tabs = `<div class="btabs">${[["tri", "技能鏈", nw], ["job", "轉職", jd]].map(([k, n, d]) => `<button class="btab${skTab === k ? " on" : ""}" data-st="${k}">${n}${d ? " ●" : ""}</button>`).join("")}</div>`;
  const body = skTab === "tri" ? renderTri(msg) : `${msg ? `<div class="emsg">${msg}</div>` : ""}<div class="skjob">${chCult()}</div>`;
  ov.innerHTML = `<div class="col cw"><div class="panel wide equip skwin">${tabs}${body}</div></div>`;
  ov.querySelectorAll("[data-st]").forEach((b) => b.addEventListener("click", () => { sfx("click"); skTab = b.dataset.st; renderSkills(); }));
  if (skTab === "tri") bindTri(); else bindCult((m) => renderSkills(m));
}
// 右上快捷鈕紅點：有能力點／可以轉職 → 角色；有新技能／巔峰點 → 技能
setInterval(() => {
  const w = save.w; if (!w || !w.created) return;
  const J = JOBS[jobLv()], q = (k) => document.querySelector(`#quick .qbtn[data-q="${k}"]`);
  const a = q("ap"), s = q("skill");
  if (a) a.classList.remove("dot");
  if (s) s.classList.toggle("dot", (!!J && w.lv >= J.lv) || (typeof triNew === "function" && triNew().length > 0));
}, 1000);
