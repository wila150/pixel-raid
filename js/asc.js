// 萬劍仙途 — 昇華（總表第 32 項，企劃 42 §2-C）
// 每個天賦樹起點各有一張 8 格的昇華樹（一轉～四轉各 2 格），每格 2 點；昇華點＝轉職 ×2（四轉 8 點＝選 4 格）。
// 第 t 列要轉職到 t 轉才能點。存 save.w.asc = { s: 起點 id, n: [格子 id] }；起點換了（天賦樹全部重置）昇華一起清掉。
// 重置：營地免費。tree3.js 後載入（包在所有 hitMob／hurtW／jobStats 外層）。
"use strict";

const ASC_COST = 2;
// 效果代碼：數值類在 jobStats 處理；條件「更多」在 hitMob；受傷在 hurtW；其他在對應的包裝
const ASC = {
  s0: { n: "天機", c: "#6aa8ff", d: "能量護盾、範圍、大招", rows: [
    [{ k: "lingtai", n: "靈台", d: "能量護盾 +20%；被打後 2 秒就開始回充（原本 3 秒）", st: { es: 20 }, esFast: 1 },
     { k: "fawang", n: "法網", d: "範圍 +15%", area: 1.15 }],
    [{ k: "zhishui", n: "心如止水", d: "真氣高於 50% 時，傷害更多 10%", hit: "mpHalf", m: 1.1 },
     { k: "huaqi", n: "化氣", d: "能量護盾擋下的傷害，20% 變成真氣", esMp: 0.2 }],
    [{ k: "tianji", n: "天機算盡", d: "Q、E 冷卻 −15%", cdQE: 0.85 },
     { k: "wuxingpo", n: "五行破", d: "元素傷害無視敵人 15% 元素抗性", pen: 0.15 }],
    [{ k: "wanfa", n: "萬法歸宗", d: "大招（E）傷害更多 25%", hit: "slotE", m: 1.25 },
     { k: "daoxin", n: "不滅道心", d: "生命掉到 35% 以下時，能量護盾立刻回滿（每 45 秒一次）", esSave: 45 }],
  ] },
  s1: { n: "箭聖", c: "#6ad8c8", d: "遠距離、持續、普攻", rows: [
    [{ k: "yingyan", n: "鷹眼", d: "打離你 150 以外的敵人，傷害更多 12%", hit: "far", m: 1.12 },
     { k: "jibu", n: "疾步", d: "移動速度 +8%", st: { spd: 8 } }],
    [{ k: "shigu", n: "蝕骨", d: "持續招（火牆、旋風、黑洞…）每跳傷害更多 20%", hit: "dot", m: 1.2 },
     { k: "lianzhu", n: "連珠", d: "攻擊速度 +8%", st: { aspd: 8 } }],
    [{ k: "fengxing", n: "風行", d: "閃身後 3 秒內，傷害更多 15%", hit: "roll", m: 1.15 },
     { k: "liesha", n: "獵殺", d: "打血量低於 30% 的敵人，傷害更多 20%", hit: "low", m: 1.2 }],
    [{ k: "jiansheng", n: "箭聖", d: "普攻傷害更多 15%", hit: "slotA", m: 1.15 },
     { k: "liuxing", n: "流星", d: "爆擊傷害 +30%", st: { cdmg: 30 } }],
  ] },
  s2: { n: "劍仙", c: "#6adf7a", d: "閃避、爆擊、先手", rows: [
    [{ k: "lingyun", n: "凌雲", d: "閃避 +5%", st: { dodge: 5 } },
     { k: "tongming", n: "劍心通明", d: "爆擊率 +3%", st: { crit: 3 } }],
    [{ k: "canying", n: "殘影", d: "閃避成功後 2 秒內，傷害更多 15%", hit: "dodge", m: 1.15 },
     { k: "jijian", n: "疾劍", d: "攻擊速度 +8%", st: { aspd: 8 } }],
    [{ k: "guanghan", n: "一劍光寒", d: "爆擊傷害 +25%", st: { cdmg: 25 } },
     { k: "jiandun", n: "劍遁", d: "閃身冷卻 −25%", roll: 0.75 }],
    [{ k: "xianren", n: "劍仙", d: "打滿血的敵人，傷害更多 40%（第一下最痛）", hit: "full", m: 1.4 },
     { k: "tianjian", n: "天劍", d: "打精英和王，傷害更多 12%", hit: "elite", m: 1.12 }],
  ] },
  s3: { n: "武聖", c: "#d8c85a", d: "吸血、殘血、連殺", rows: [
    [{ k: "shizhan", n: "嗜戰", d: "吸血 +1.5%", st: { leech: 1.5 } },
     { k: "xunshen", n: "迅身", d: "移動速度 +6%；閃身冷卻 −10%", st: { spd: 6 }, roll: 0.9 }],
    [{ k: "kuangxue", n: "狂血", d: "生命低於 50% 時，傷害更多 15%", hit: "selfLow", m: 1.15 },
     { k: "zhanyi", n: "戰意", d: "每殺一隻怪，4 秒內傷害更多 3%（最多 5 層）", hit: "kills" }],
    [{ k: "suigu", n: "碎骨", d: "爆擊傷害 +25%", st: { cdmg: 25 } },
     { k: "shisha", n: "嗜殺", d: "每殺一隻怪回 3% 生命", killHeal: 0.03 }],
    [{ k: "wusheng", n: "武聖", d: "近戰招傷害更多 15%", hit: "melee", m: 1.15 },
     { k: "xiuluo", n: "修羅", d: "吸血 +2%；生命低於 50% 時受到的傷害 −15%", st: { leech: 2 }, lowDr: 0.85 }],
  ] },
  s4: { n: "金剛", c: "#ff6a5a", d: "生命、護甲、硬扛", rows: [
    [{ k: "buhuai", n: "金剛不壞", d: "生命 +12%", st: { hp: 12 } },
     { k: "tiebu", n: "鐵布衫", d: "護甲 +40%", st: { armor: 40 } }],
    [{ k: "bati", n: "霸體", d: "受到的傷害 −8%", dr: 0.92 },
     { k: "zhennu", n: "震怒", d: "被打後 3 秒內，傷害更多 12%", hit: "hurt", m: 1.12 }],
    [{ k: "buqu", n: "不屈", d: "受到致命傷害時留 1 滴血、2 秒無敵（每 60 秒一次）", cheat: 60 },
     { k: "juli", n: "巨力", d: "範圍 +15%", area: 1.15 }],
    [{ k: "numu", n: "金剛怒目", d: "每 1000 生命上限，傷害更多 2%（最多 20%）", hit: "hpPer" },
     { k: "fanzhen", n: "反震", d: "被近身打到時，反彈傷害（反震 +50%）", st: { thorns: 50 } }],
  ] },
  s5: { n: "法王", c: "#c87aff", d: "抗性、真氣、Q 招", rows: [
    [{ k: "hufa", n: "護法", d: "火、冰、雷抗性 +10%", st: { res: 10 } },
     { k: "fali", n: "法力", d: "真氣上限 +40；真氣回復 +25%", st: { mp: 40, mpr: 25 } }],
    [{ k: "juyan", n: "聚焰", d: "打燃燒中的敵人，傷害更多 12%", hit: "burn", m: 1.12 },
     { k: "fati", n: "法體", d: "受到的元素傷害 −10%", eleDr: 0.9 }],
    [{ k: "leiting", n: "雷霆萬鈞", d: "打感電的敵人，傷害更多 15%", hit: "shock", m: 1.15 },
     { k: "xuefa", n: "血法", d: "每放一次 Q 或 E，回 3% 生命", castHeal: 0.03 }],
    [{ k: "fawangq", n: "法王", d: "Q 招傷害更多 20%", hit: "slotQ", m: 1.2 },
     { k: "fashen", n: "不滅法身", d: "生命掉到 35% 以下時，5 秒內受到的傷害 −40%（每 30 秒一次）", lowShield: 30 }],
  ] },
};
const ASC_NODE = {}; // 格子 id（s0_lingtai）→ { ...效果, id, row, cls }
for (const s in ASC) ASC[s].rows.forEach((row, t) => row.forEach((N) => { N.id = s + "_" + N.k; N.row = t + 1; N.cls = s; ASC_NODE[N.id] = N; }));

// ───────── 存檔、點數 ─────────
function ascSt() {
  const w = save.w; if (!w) return null;
  const T = treeSt(), s = T ? T.s : null;
  if (!w.asc || w.asc.s !== s) w.asc = { s, n: [] }; // 換起點＝昇華清掉
  return w.asc;
}
const ascTotal = () => (save.w ? ASC_COST * jobLv() : 0);
const ascFree = () => { const A = ascSt(); return A ? ascTotal() - A.n.length * ASC_COST : 0; };
let ASC_ON = {}, ASC_ONK = "";
function ascOn() { // 目前點亮的格子（快取）
  const A = save.w ? ascSt() : null, key = A ? A.s + ":" + A.n.join(",") + ":" + jobLv() : "";
  if (key === ASC_ONK) return ASC_ON;
  ASC_ONK = key; ASC_ON = {};
  if (A) for (const id of A.n) { const N = ASC_NODE[id]; if (N && N.cls === A.s && N.row <= jobLv()) ASC_ON[N.k] = N; }
  return ASC_ON;
}
const ascHas = (k) => !!save.w && !!ascOn()[k];
const ascList = () => Object.values(ascOn());
function ascWhyNot(id) {
  const A = ascSt(), N = ASC_NODE[id];
  if (!A.s) return "先在天賦樹選一個起點";
  if (N.cls !== A.s) return "這不是你起點的昇華";
  if (A.n.includes(id)) return "";
  if (jobLv() < N.row) return `要${JOBS[N.row - 1].n}才能點`;
  if (ascFree() < ASC_COST) return `昇華點不夠（每格 ${ASC_COST} 點，轉職一次給 ${ASC_COST} 點）`;
  return "";
}
function ascAlloc(id) { const m = ascWhyNot(id); if (m) return m; ascSt().n.push(id); trAfter(); return ""; }
function ascReset() {
  if (!(typeof atCamp === "function" && atCamp())) return "在城裡或營地結界裡才能重置昇華（免費）";
  ascSt().n = []; trAfter(); return "";
}

// ───────── 數值 ─────────
const _jobStatsAsc = jobStats;
jobStats = function (b) {
  b = _jobStatsAsc(b);
  if (!save.w) return b;
  const L = ascList(); if (!L.length) return b;
  const s = {}; for (const N of L) if (N.st) for (const k in N.st) s[k] = (s[k] || 0) + N.st[k];
  const p = (k) => (s[k] || 0) / 100;
  if (s.crit) b.crit = (b.crit || 0) + p("crit");
  if (s.cdmg) b.critDmg = (b.critDmg || 2) + p("cdmg");
  if (s.aspd) b.aspd = (b.aspd || 1) * (1 + p("aspd"));
  if (s.spd) b.spdMul *= 1 + p("spd");
  if (s.hp) b.maxHp = Math.round(b.maxHp * (1 + p("hp")));
  if (s.armor) b.armor = (b.armor || 0) * (1 + p("armor"));
  if (s.dodge) b.dodge = Math.min(0.5, (b.dodge || 0) + p("dodge"));
  if (s.es) b.maxEs = Math.round((b.maxEs || 0) * (1 + p("es")));
  if (s.mp) b.maxMp += s.mp;
  if (s.mpr) b.mpRegen *= 1 + p("mpr");
  if (s.leech) b.leech = (b.leech || 0) + p("leech");
  if (s.thorns) b.thorns = (b.thorns || 0) + p("thorns");
  if (s.res) for (const e of ["F", "W", "T"]) b["res" + e] = (b["res" + e] || 0) + p("res");
  for (const N of L) {
    if (N.roll) b.rollCd = (b.rollCd || 1) * N.roll;
    if (N.cdQE) { b.skCd = b.skCd || {}; for (const k of ["spin", "ult"]) b.skCd[k] = (b.skCd[k] || 1) * N.cdQE; }
    if (N.pen) { const o = Object.assign({}, b.pen || {}); for (const e of ["F", "W", "T", "P"]) o[e] = (o[e] || 0) + N.pen; b.pen = o; }
  }
  return b;
};
const ascArea = () => { let f = 1; if (save.w) for (const N of ascList()) if (N.area) f *= N.area; return f; };

// ───────── 打怪：條件「更多」 ─────────
function ascHitMul(m) {
  const p = W0, sl = CUR_SL; let f = 1;
  for (const N of ascList()) {
    if (!N.hit) continue;
    let ok = false, mul = N.m || 1;
    switch (N.hit) {
      case "mpHalf": ok = B.maxMp > 0 && p.mp >= B.maxMp * 0.5; break;
      case "slotE": ok = sl === "e"; break;
      case "slotQ": ok = sl === "q"; break;
      case "slotA": ok = sl === "a"; break;
      case "far": ok = dist(m, p) > 150; break;
      case "dot": ok = !!DOT_HIT; break;
      case "roll": ok = p.ascRollT > time; break;
      case "low": ok = m.max > 0 && m.hp < m.max * 0.3; break;
      case "full": ok = m.max > 0 && m.hp >= m.max; break;
      case "elite": ok = !!(m.elite || m.boss); break;
      case "dodge": ok = p.ascDodgeT > time; break;
      case "selfLow": ok = p.hp < p.maxHp * 0.5; break;
      case "hurt": ok = p.ascHurtT > time; break;
      case "burn": ok = m.burnT > 0; break;
      case "shock": ok = m.shockT > time; break;
      case "melee": { let tg = ""; try { tg = sl && typeof slotTags === "function" ? slotTags(sl) : ""; } catch (x) { tg = ""; } ok = tg.includes("m"); break; }
      case "kills": { const K = (p.ascKills || []).filter((t) => t > time); p.ascKills = K; ok = K.length > 0; mul = 1 + 0.03 * Math.min(5, K.length); break; }
      case "hpPer": ok = true; mul = 1 + Math.min(0.2, 0.02 * Math.floor((B.maxHp || 0) / 1000)); break;
    }
    if (ok) f *= mul;
  }
  return f;
}
const _hitMobAsc = hitMob;
hitMob = function (m, dmg) {
  if (m && !m.dead && !m.air && save.w && W0 && save.w.asc && save.w.asc.n.length && ascList().length) { const f = ascHitMul(m); if (f !== 1) arguments[1] = dmg * f; }
  return _hitMobAsc.apply(this, arguments);
};

// ───────── 受傷 ─────────
const _hurtWAsc = hurtW;
hurtW = function (dmg, from, kind) {
  const p = W0;
  if (!p || !save.w || !save.w.asc || !save.w.asc.n.length || p.iframe > 0 || p.shield > 0 || p.invT > 0 || safeAt(p.x, p.y)) return _hurtWAsc.apply(this, arguments);
  const L = ascList(); let f = 1;
  for (const N of L) {
    if (N.dr) f *= N.dr;
    if (N.eleDr && hitEle(from, kind)) f *= N.eleDr;
    if (N.lowDr && p.hp < p.maxHp * 0.5) f *= N.lowDr;
    if (N.lowShield && p.ascFsT > time) f *= 0.6;
  }
  arguments[0] = dmg * f;
  const hp0 = p.hp, es0 = p.es, mp0 = p.mp, cheat = ascHas("buqu") && !(p.ascCheatCd > time);
  if (cheat) p.hp += 1e6; // 不屈：先墊血，算完再看會不會死
  let r;
  try { r = _hurtWAsc.apply(this, arguments); } finally { if (cheat) p.hp -= 1e6; }
  if (!W0) return r;
  if (cheat && p.hp <= 0) {
    p.hp = 1; p.invT = 2; p.ascCheatCd = time + 60;
    if (state === "worldDead") state = "world";
    floatText(p.x, p.y - 30, "不屈！", "#ffe066", true); burst(p.x, p.y, "#ffe066", 30, 120, 0.6);
  }
  const hit = p.hp < hp0 || p.es < es0;
  if (hit) p.ascHurtT = time + 3;
  if (!hit && p.iframe > 0 && p.iframe <= 0.26 && p.es === es0 && p.hp === hp0) p.ascDodgeT = time + 2; // 閃避成功（hurtW 閃避那行 iframe 0.25）
  for (const N of L) {
    if (N.esFast && p.esT === 3) p.esT = 2;
    if (N.esMp && p.es < es0 && B.maxMp > 0) p.mp = Math.min(B.maxMp, (p.mp || 0) + (es0 - p.es) * N.esMp);
    if (N.esSave && p.hp > 0 && p.hp < p.maxHp * 0.35 && !(p.ascEsCd > time) && B.maxEs > 0) { p.es = B.maxEs; p.ascEsCd = time + N.esSave; floatText(p.x, p.y - 30, "不滅道心", "#9fdcff", true); burst(p.x, p.y, "#9fdcff", 20, 90, 0.5); }
    if (N.lowShield && p.hp > 0 && p.hp < p.maxHp * 0.35 && !(p.ascFsCd > time)) { p.ascFsT = time + 5; p.ascFsCd = time + N.lowShield; floatText(p.x, p.y - 30, "不滅法身", "#c87aff", true); burst(p.x, p.y, "#c87aff", 20, 90, 0.5); }
  }
  void mp0;
  return r;
};

// ───────── 殺怪、放招、閃身 ─────────
const _killMobAsc = killMob;
killMob = function (m) {
  const was = m.dead;
  const r = _killMobAsc.apply(this, arguments);
  if (was || !m.dead || !W0 || !save.w || m.sum) return r;
  if (ascHas("zhanyi")) { (W0.ascKills = W0.ascKills || []).push(time + 4); if (W0.ascKills.length > 5) W0.ascKills.shift(); }
  for (const N of ascList()) if (N.killHeal && W0.hp > 0) W0.hp = Math.min(W0.maxHp, W0.hp + Math.round(W0.maxHp * N.killHeal));
  return r;
};
const _skillUsedAsc = skillUsed;
skillUsed = function (k) { // eslint-disable-line no-func-assign
  const r = _skillUsedAsc.apply(this, arguments);
  if (W0 && save.w && (k === "spin" || k === "ult")) for (const N of ascList()) if (N.castHeal && W0.hp > 0) W0.hp = Math.min(W0.maxHp, W0.hp + Math.round(W0.maxHp * N.castHeal));
  if (W0 && k === "roll") W0.ascRollT = time + 3 + 0.4;
  return r;
};

// ───────── 畫面：天賦樹上方「昇華」按鈕 → 昇華面板 ─────────
let ascView = false;
const _trPanelAsc = trPanel;
trPanel = function () { // eslint-disable-line no-func-assign
  _trPanelAsc.apply(this, arguments);
  const top = ov.querySelector(".trtop"); if (!top) return;
  const A = ascSt(), free = ascFree();
  const b = document.createElement("button"); b.id = "trAsc"; b.className = "trb" + (free >= ASC_COST && A.s ? " gold" : "");
  b.innerHTML = `昇華${A.s ? `・${ASC[A.s].n}` : ""}<small>${A.s ? `剩 ${free} 點` : "選起點後"}</small>`;
  b.onclick = (e) => { e.stopPropagation(); sfx("click"); ascView = !ascView; renderTree(); };
  top.insertBefore(b, top.children[1] || null);
  { const q = ov.querySelector(".trq"); if (q) q.style.top = top.offsetHeight + 14 + "px"; }
  ascRender();
};
function ascRender() {
  const wrap = ov.querySelector(".trwrap"); if (!wrap) return;
  let box = wrap.querySelector(".ascbox");
  if (!ascView) { if (box) box.remove(); return; }
  if (!box) { box = document.createElement("div"); box.className = "ascbox"; box.addEventListener("pointerdown", (e) => e.stopPropagation()); box.addEventListener("wheel", (e) => e.stopPropagation()); wrap.appendChild(box); }
  const A = ascSt(), j = jobLv();
  if (!A.s) { box.innerHTML = `<div class="aschead"><b>昇華</b><button class="trb" data-x>關閉</button></div><p class="dim">先在天賦樹選一個起點，昇華會跟著起點決定。</p>`; }
  else {
    const C = ASC[A.s];
    box.innerHTML = `<div class="aschead"><b style="color:${C.c}">昇華・${C.n}</b><small>${C.d}</small><span>剩 <b class="${ascFree() >= ASC_COST ? "hot" : ""}">${ascFree()}</b> 點・共 ${ascTotal()}</span>
      <button class="trb" data-r ${A.n.length ? "" : "disabled"}>重置<small>營地免費</small></button><button class="trb" data-x>關閉</button></div>
      <p class="dim">每次轉職 +${ASC_COST} 點，每格 ${ASC_COST} 點；四轉 8 點只能選 4 格，第幾列要第幾轉。</p>
      ${C.rows.map((row, t) => `<div class="ascrow${j > t ? "" : " lock"}"><div class="asct">${JOBS[t].n.split("・")[0]}</div>${row.map((N) => {
        const on = A.n.includes(N.id), why = on ? "" : ascWhyNot(N.id);
        return `<button class="ascn${on ? " on" : ""}${why ? " no" : ""}" data-id="${N.id}" style="--ac:${C.c}"><b>${N.n}</b><span>${N.d}</span>${on ? "<em>已點亮</em>" : why ? `<em class="bad">${why}</em>` : `<em>點亮（${ASC_COST} 點）</em>`}</button>`;
      }).join("")}</div>`).join("")}`;
  }
  box.querySelectorAll("[data-x]").forEach((x) => (x.onclick = (e) => { e.stopPropagation(); sfx("click"); ascView = false; renderTree(); }));
  box.querySelectorAll("[data-r]").forEach((x) => (x.onclick = (e) => { e.stopPropagation(); const m = ascReset(); sfx(m ? "bad" : "good"); renderTree(m || "昇華重置了"); }));
  box.querySelectorAll(".ascn").forEach((x) => (x.onclick = (e) => {
    e.stopPropagation(); const id = x.dataset.id; if (ascSt().n.includes(id)) return;
    const m = ascAlloc(id); sfx(m ? "bad" : "good"); renderTree(m || `昇華：${ASC_NODE[id].n}`);
  }));
}

// 轉職後提示有昇華點
const _doJobAsc = doJob;
doJob = function () { // eslint-disable-line no-func-assign
  const r = _doJobAsc.apply(this, arguments);
  if (r !== false && save.w && typeof notice === "function") { const A = ascSt(); notice(A && A.s ? `昇華點 +${ASC_COST}：打開天賦樹（P）→「昇華・${ASC[A.s].n}」選一格特色天賦` : `昇華點 +${ASC_COST}：先在天賦樹選起點，再點上面的「昇華」`, "#ffe066"); }
  return r;
};
// 天賦按鈕紅點也算昇華點
setInterval(() => { const b = document.querySelector('#quick .qbtn[data-q="tree"]'); if (b && save.w && save.w.created && ascFree() >= ASC_COST && ascSt().s) b.classList.add("dot"); }, 1000);
