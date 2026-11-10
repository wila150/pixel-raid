// 萬劍仙途 — 天賦樹擴充（總表第 31 項，企劃 42 A＋B）
// A：新重要天賦（元素 8、武器專精 6、招式類型 6、防禦 3）的特殊效果、5 個新核心。
// B：天賦玉：樹上 8 個玉槽（tree.js 的 jw 格），精英／秘境之主／天劫王掉落，鑲上就生效（加到 treeSum）。
// dmg2.js 後載入（要包 hitFinal；攻速在 jobStats 裡改，cap.js 的上限照樣套得到）。
"use strict";

// ───────── 1. 新核心天賦（KEYSTONE.t3：ksOn／ksDef／jobStats 迴圈都看得到）─────────
KEYSTONE.t3 = [
  { k: "yuangui", n: "元素歸一", c: "#ffb070", d: "火、冰、閃電、混沌的傷害加成都改成四種裡最高的那個；沒有元素的招式傷害更少 20%", f: (b) => { b.eleOne = 1; } },
  { k: "budong", n: "不動明王", c: "#e8c87a", d: "不能閃身（身法招也不能放）；受到的傷害 −25%", f: (b) => { b.budong = 1; b.noRoll = 1; } },
  { k: "tiegu", n: "鐵骨", c: "#c8c0b0", d: "護甲也能擋元素傷害（效果一半）；四種元素抗性上限 −10%", f: (b) => { b.tiegu = 1; b.resCapAdd = (b.resCapAdd || 0) - 0.1; } },
  { k: "xunlei", n: "迅雷", c: "#bfe0ff", d: "攻擊速度 +30%（受上限）；傷害更少 15%", f: (b) => { b.aspd = (b.aspd || 1) * 1.3; b.more *= 0.85; } },
  { k: "hundun", n: "魂盾", c: "#9fdcff", d: "受到的傷害 30% 先扣真氣（真氣不夠才扣生命）；生命上限 −20%", f: (b) => { b.hundun = 1; b.maxHp = Math.round(b.maxHp * 0.8); } },
];

// ───────── 2. 小工具（world.js 的 areaMul、法壇會呼叫）─────────
const TR3_EK = { F: "fire", W: "ice", T: "thun", P: "chaos" };
const TR3_TAG = { a: "t_a", p: "t_p", m: "t_m", d: "t_d", v: "t_v" };
const TR3_MORE = 1.05; // 招式類型「更多」：企劃寫 8%，bot 打王 Lv.110 快 47%，降到 5%
const TR3_WT = { swd: "sword", bow: "bow", stf: "staff", bld: "blade", fst: "fist", fan: "fan" };
const trAreaX = () => (!save.w ? 1 : (curWeapon() === "blade" && trN("bld") ? 1.2 : 1) * (trN("t_a") ? 1.1 : 1) * (typeof ascArea === "function" ? ascArea() : 1)); // asc.js 昇華的範圍
const trTotemN = () => (save.w && trN("t_s") ? 2 : 1);
function trNoteVal(th) { // 推薦路線：重要天賦的特殊效果值多少（跟屬性值同一個單位）
  if (TR3_WT[th]) return TR3_WT[th] === curWeapon() ? 14 : 0;
  if (th && th.startsWith("t_") && th !== "t_s") return trTagUse("t" + th[2]) ? 7 : 0;
  const e = { fire: "fire", fire2: "fire", ice: "ice", ice2: "ice", thun: "thun", thun2: "thun", psn: "chaos", psn2: "chaos" }[th];
  if (e) return TR_EV[e] > 0 ? 8 : 0;
  return { qi: 2, regen: 3, still: 3 }[th] || 0;
}

// ───────── 3. 數值：法源、拳意、身法 ─────────
const _jobStatsT3 = jobStats;
jobStats = function (b) {
  b = _jobStatsT3(b);
  if (!save.w) return b;
  const wt = curWeapon();
  if (wt === "staff" && trN("stf")) b.more *= 1.1;
  if (wt === "fist" && trN("fst")) b.aspd = (b.aspd || 1) * 1.1;
  if (trN("t_v")) b.rollCd = (b.rollCd || 1) * 0.9;
  return b;
};

// ───────── 4. 打怪：元素加成、招式類型更多、凍土、腐骨、聚氣、拳意、劍心 ─────────
const _hitMobT3 = hitMob;
hitMob = function (m, dmg, kb, from, quiet) {
  if (!m || m.dead || m.air || !save.w || !W0) return _hitMobT3.apply(this, arguments);
  const s = treeSum(), e = typeof wEle === "function" ? wEle() : null, sl = CUR_SL;
  let tags = ""; try { tags = sl && typeof slotTags === "function" ? slotTags(sl) : ""; } catch (x) { tags = ""; }
  let f = 1;
  const ep = e ? (B.eleOne ? Math.max(s.fire || 0, s.ice || 0, s.thun || 0, s.chaos || 0) : s[TR3_EK[e]] || 0) : 0;
  if (ep) { const base = DOT_HIT ? 1 + (s.td || 0) / 100 : trTagMul(sl); f *= (base + ep / 100) / base; } // 跟標籤同一個「增加」池
  if (B.eleOne && !e) f *= 0.8;
  if (DOT_HIT) { if (trN("t_d")) f *= TR3_MORE; }
  else for (const t of new Set(tags)) if (TR3_TAG[t] && trN(TR3_TAG[t])) f *= TR3_MORE;
  if (trN("ice2") && (m.frz > 0 || m.slowT > 0)) f *= 1.1;
  if (trN("psn2") && m.psn > 0 && m.psnT > 0) f *= 1.12;
  if (trN("qi") && B.maxMp > 0 && W0.mp >= B.maxMp * 0.8) f *= 1.08;
  if (!quiet && !DOT_HIT && curWeapon() === "fist" && trN("fst")) {
    if (W0.trFM === m) W0.trFN = Math.min(10, (W0.trFN || 0) + 1); else { W0.trFM = m; W0.trFN = 0; }
    f *= 1 + 0.01 * W0.trFN;
  }
  if (!quiet && tags.includes("m")) W0.trMelT = time + 2;
  arguments[1] = dmg * f;
  const r = _hitMobT3.apply(this, arguments);
  if (!quiet && !DOT_HIT && !chainLock && curWeapon() === "sword" && trN("swd") && Math.random() < 0.15 && typeof wLater === "function")
    wLater(0.1, () => { if (!m.dead && W0) { const s0 = CUR_SL; CUR_SL = sl; burst(m.x, m.y, "#fff4c8", 6, 60, 0.25); try { hitMob(m, dmg * 0.6, 0, null, true); } finally { CUR_SL = s0; } } });
  return r;
};
// 奔雷：感電機率 +15%；雷殛：感電的敵人受傷再 +10%
const _hitFinalT3 = hitFinal;
hitFinal = function (m, dmg) {
  const sh0 = m.shockT > time;
  let r = _hitFinalT3.apply(this, arguments);
  if (!save.w || !W0) return r;
  if (!DOT_HIT && !chainLock && trN("thun") && wEle() === "T" && !(m.shockT > time) && Math.random() < 0.15) { floatText(m.x - 8, m.y - 26, "感電", "#bfe0ff"); m.shockT = time + 4; }
  if (sh0 && trN("thun2")) r *= 1.1;
  return r;
};
// 烈焰／寒冰／劇毒／綿延：燃燒、冰凍、毒層、持續時間
const _elemHitT3 = elemHit;
elemHit = function (m, dmg) {
  const b0 = m.burnT || 0, f0 = m.frz || 0, p0 = m.psn || 0;
  const r = _elemHitT3.apply(this, arguments);
  if (!save.w || !W0) return r;
  if (m.burnT === 3 && b0 !== 3) m.burnT = 3 * (trN("fire") ? 1.3 : 1) + (trN("t_d") ? 1 : 0);
  if (m.frz > f0 && trN("ice")) m.frz *= 1.4;
  if (m.psnT === 3) {
    if (trN("psn") && p0 >= 5 && m.psn === 5) m.psn = Math.min(8, p0 + 1);
    if (trN("t_d")) m.psnT = 4;
  }
  return r;
};

// ───────── 5. 受傷：不動、近身、不動明王、鐵骨、魂盾；回春記時間 ─────────
const _hurtWT3 = hurtW;
hurtW = function (dmg, from, kind) {
  const p = W0;
  if (!p || !save.w || p.iframe > 0 || p.shield > 0 || p.invT > 0 || safeAt(p.x, p.y)) return _hurtWT3.apply(this, arguments);
  let f = 1;
  if (trN("still") && p.trStill >= 0.5) f *= 0.92;
  if (trN("t_m") && p.trMelT > time) f *= 0.95;
  if (B.budong) f *= 0.75;
  if (B.tiegu && B.armor > 0 && hitEle(from, kind)) f *= 1 - armorRed(B.armor, dmg) * 0.5;
  dmg *= f;
  if (B.hundun && B.maxMp > 0 && p.mp > 0) { const a = Math.min(p.mp, dmg * 0.3); p.mp -= a; dmg -= a; if (a >= 1 && !(p.trHdT > time)) { p.trHdT = time + 0.5; floatText(p.x + 10, p.y - 10, `-${Math.round(a)}`, "#7aa8ff"); } }
  arguments[0] = dmg;
  const hp0 = p.hp, es0 = p.es;
  const r = _hurtWT3.apply(this, arguments);
  if (W0 && (W0.hp < hp0 || W0.es < es0)) W0.trHurtT = time;
  return r;
};

// ───────── 6. 每幀：回春、風骨（持續招時間）、千里（射程）─────────
const _updateWorldT3 = updateWorld;
updateWorld = function (dt) {
  if (!W0 || !save.w) return _updateWorldT3.apply(this, arguments);
  const r = _updateWorldT3.apply(this, arguments);
  const p = W0; if (!p) return r;
  if (trN("regen") && state === "world" && p.hp > 0 && p.hp < p.maxHp && !(time - (p.trHurtT == null ? -99 : p.trHurtT) <= 4)) {
    p.trRgA = (p.trRgA || 0) + p.maxHp * 0.02 * dt * (typeof brkMul === "function" ? brkMul() : 1);
    if (p.trRgA >= 1) { const a = Math.floor(p.trRgA); p.trRgA -= a; p.hp = Math.min(p.maxHp, p.hp + a); }
  }
  const fan = curWeapon() === "fan" && trN("fan");
  for (const k of ["fires", "tornados", "walls", "voids"]) for (const o of p[k] || []) if (!o.trx) { o.trx = 1; if (fan && !o.ghost && !o.isAf) { o.t *= 1.3; if (o.max) o.max *= 1.3; } }
  const tp = trN("t_p"); for (const s of p.pshots || []) if (!s.trx) { s.trx = 1; if (tp && !s.ghost) s.life *= 1.2; }
  return r;
};
// 箭神：拿弓時每次射擊多 1 道箭（同一幀只多一道）
const _multiShotsT3 = multiShots;
multiShots = function (a, o, push) {
  _multiShotsT3.apply(this, arguments);
  if (o.noMulti || o.child || o.ghost || !save.w || !W0 || curWeapon() !== "bow" || !trN("bow") || W0.trBowT === time) return;
  W0.trBowT = time;
  push(a + 0.12, Object.assign({}, o, { dmg: o.dmg * 0.7, noMulti: true, pdone: 1 }));
};
// 燎原：燃燒中的怪死掉，火燒到旁邊 2 隻；精英掉天賦玉
const JW_ELITE = 0.04;
const _killMobT3 = killMob;
killMob = function (m) {
  const was = m.dead, burn = m.burnT > 0, bd = m.burnD || 0;
  const r = _killMobT3.apply(this, arguments);
  if (was || !m.dead || !W0 || !save.w) return r;
  if (burn && bd > 0 && trN("fire2")) {
    const near = W0.mobs.filter((o) => o !== m && !o.dead && dist(o, m) < 60).sort((x, y) => dist(x, m) - dist(y, m)).slice(0, 2);
    for (const o of near) { o.burnT = Math.max(o.burnT || 0, 3); o.burnD = Math.max(o.burnD || 0, bd * 0.8); burst(o.x, o.y, "#ff9a3a", 6, 60, 0.3); }
  }
  if (m.elite && !m.boss && !m.sum && !m.hunter && WMOBS[m.type] && WMOBS[m.type].ai !== "pillar" && Math.random() < JW_ELITE) jwGive(jwRoll(1, 0.02), m);
  return r;
};
const _wbKilledT3 = wbKilled;
wbKilled = function (m) {
  const R = !!(m && m.R), tj = !!(m && m.tj);
  const r = _wbKilledT3.apply(this, arguments);
  if (!save.w || !W0) return r;
  if (R && (tj || Math.random() < 0.4)) jwGive(jwRoll(tj ? 2 : 1, tj ? 0.12 : 0.04), m);
  else if (tj) jwGive(jwRoll(2, 0.12), m);
  return r;
};

// ───────── 7. 天賦玉（企劃 42 B）─────────
// save.w.jewels = [{ id, q:1–3（碎玉、靈玉、寶玉）| 4 傳說, a:{效果}, u:傳說代碼 }]；save.w.tree.jw = { 玉槽 id: 玉 id }
const JW_Q = { 1: { n: "碎玉", c: "#d8dce4" }, 2: { n: "靈玉", c: "#6aa8ff" }, 3: { n: "寶玉", c: "#c87aff" }, 4: { n: "傳說", c: "#ff9a3a" } };
const JW_AFF = { atk: [4, 8], crit: [1, 2], cdmg: [6, 12], aspd: [3, 6], spd: [2, 4], hp: [3, 6], armor: [10, 20], es: [6, 12], dodge: [1, 3], res: [3, 6], mpr: [8, 15], leech: [0.2, 0.4], fire: [5, 10], ice: [5, 10], thun: [5, 10], chaos: [5, 10], tp: [2, 5], tm: [2, 5], ta: [2, 5], td: [2, 5], tv: [2, 5] }; // 標籤加成是獨立乘的，數字比其他小
const JW_R = 330; // 傳說玉的「範圍」（樹的座標）
const JW_U = {
  xinghe: { n: "星河玉", d: "範圍內已點的屬性格效果 ×2" },
  guiyuan: { n: "歸元玉", d: "範圍內已點的小天賦效果 +50%" },
  wanxiang: { n: "萬象玉", d: "每點一個重要天賦，攻擊 +1%" },
};
const JW_MAX = 40;
function jwList() { const w = save.w; if (!w) return []; if (!w.jewels) w.jewels = []; return w.jewels; }
function jwSock() { const T = treeSt(); if (!T) return {}; if (!T.jw) T.jw = {}; return T.jw; }
const jwById = (id) => jwList().find((j) => j.id === id) || null;
const jwWhere = (id) => { const S = jwSock(); for (const k in S) if (S[k] === id) return k; return null; };
function jwRoll(minQ, uChance) {
  const id = "jw" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  if (Math.random() < uChance) { const ks = Object.keys(JW_U), u = ks[Math.floor(Math.random() * ks.length)]; return { id, q: 4, a: {}, u }; }
  const W = [[1, 55], [2, 33], [3, 12]].filter(([q]) => q >= minQ), tot = W.reduce((s, x) => s + x[1], 0);
  let r = Math.random() * tot, q = W[0][0]; for (const [qq, w] of W) { if ((r -= w) < 0) { q = qq; break; } }
  const keys = Object.keys(JW_AFF).sort(() => Math.random() - 0.5).slice(0, q), a = {};
  for (const k of keys) { const [lo, hi] = JW_AFF[k], v = lo + Math.random() * (hi - lo); a[k] = hi < 1 ? Math.round(v * 10) / 10 : Math.round(v); }
  return { id, q, a };
}
const jwName = (j) => (j.u ? JW_U[j.u].n : JW_Q[j.q].n);
const jwColor = (j) => JW_Q[j.q].c;
const jwTxt = (j) => (j.u ? [`★ ${JW_U[j.u].d}`] : trEffTxt(j.a));
const jwPrice = (j) => (j.u ? 600 : j.q * 80);
const jwVal = (j) => (j.u ? 99 : j.q * 10 + Object.keys(j.a).length);
function jwGive(j, at) {
  const L = jwList(); L.push(j);
  let sold = 0;
  while (L.length > JW_MAX) { // 滿了：賣掉最差、沒鑲的
    const S = new Set(Object.values(jwSock())), c = L.filter((x) => !S.has(x.id) && x !== j).sort((x, y) => jwVal(x) - jwVal(y))[0];
    if (!c) break; L.splice(L.indexOf(c), 1); save.stone += jwPrice(c); sold++;
  }
  if (at) floatText(at.x, at.y - 34, `天賦玉・${jwName(j)}！`, jwColor(j), true);
  if (typeof notice === "function") notice(`得到天賦玉「${jwName(j)}」：${jwTxt(j).join("、")}${sold ? `（袋子滿 ${JW_MAX} 顆，賣掉最差的 ${sold} 顆）` : ""}。到天賦樹（P）點亮玉槽鑲上`, jwColor(j));
  if (typeof sfx === "function") sfx("good");
  writeSave();
}
// treeSum 會呼叫：把鑲在「已點亮」玉槽上的玉加進去
function trJwSum(T, s) {
  if (!T.jw) return;
  const have = new Set(T.n);
  for (const nid in T.jw) {
    if (!have.has(nid) || !TREE[nid]) continue;
    const j = jwById(T.jw[nid]); if (!j) continue;
    for (const k in j.a) s[k] = (s[k] || 0) + j.a[k];
    if (!j.u) continue;
    const S = TREE[nid];
    if (j.u === "wanxiang") { let n = 0; for (const id of T.n) if (TREE[id] && TREE[id].t === "note") n++; s.atk = (s.atk || 0) + n; continue; }
    for (const id of T.n) {
      const N = TREE[id]; if (!N || Math.hypot(N.x - S.x, N.y - S.y) > JW_R) continue;
      const mul = j.u === "xinghe" && N.t === "attr" ? 1 : j.u === "guiyuan" && N.t === "small" ? 0.5 : 0;
      if (mul) for (const k in N.e) s[k] = (s[k] || 0) + N.e[k] * mul;
    }
  }
}
// ── 天賦樹說明卡 ──
function trJwLines(nid) {
  const j = jwById(jwSock()[nid]), free = jwList().filter((x) => !jwWhere(x.id)).length, on = treeHas(nid);
  const L = [];
  if (j) { L.push(`鑲著：<b style="color:${jwColor(j)}">${jwName(j)}</b>${on ? "" : "（這格還沒點亮，沒有效果）"}`); L.push(...jwTxt(j)); if (j.u && j.u !== "wanxiang") L.push(`<small class="dim">範圍＝這個玉槽周圍（說明卡選到時畫圈）</small>`); }
  else L.push(on ? "空的：從下面選一顆天賦玉鑲上" : "點亮後可以鑲天賦玉");
  L.push(`<small class="dim">天賦玉：精英、秘境之主、天劫王會掉；身上還有 ${free} 顆沒鑲</small>`);
  return L;
}
function trJwAct(nid, has) {
  if (!has) return "";
  const cur = jwSock()[nid], L = jwList().filter((x) => x.id !== cur).sort((x, y) => jwVal(y) - jwVal(x));
  let h = cur ? `<button class="trb" id="jwOut">拿下來</button>` : "";
  if (L.length) h += `<div class="jwlist">${L.slice(0, 16).map((j) => { const w = jwWhere(j.id); return `<div class="jwrow">${ico("tree", jwIk(j), "jwico")}<b style="color:${jwColor(j)}">${jwName(j)}</b><small>${jwTxt(j).join("、")}${w ? "（鑲在別格）" : ""}</small><button class="trb gold" data-jwput="${j.id}">${cur ? "換上" : "鑲上"}</button>${w ? "" : `<button class="trb" data-jwsell="${j.id}">賣 ${jwPrice(j)}</button>`}</div>`; }).join("")}</div>`;
  else if (!cur) h += `<small class="dim">還沒有天賦玉</small>`;
  return h;
}
function jwPut(nid, jid) {
  if (!treeHas(nid)) return "這格還沒點亮";
  const S = jwSock(), old = jwWhere(jid); if (old) delete S[old];
  S[nid] = jid; trAfter(); return "";
}
function jwOut(nid) { const S = jwSock(); if (!S[nid]) return "這格沒有鑲"; delete S[nid]; trAfter(); return ""; }
function jwSell(jid) {
  if (jwWhere(jid)) return "鑲著的不能賣";
  const L = jwList(), j = jwById(jid); if (!j) return "找不到";
  L.splice(L.indexOf(j), 1); save.stone += jwPrice(j); writeSave(); return "";
}
function trJwBind(info, res) {
  const nid = trSel; if (!nid || !TREE[nid] || TREE[nid].t !== "jw") return;
  const b = info.querySelector("#jwOut"); if (b) b.onclick = (e) => { e.stopPropagation(); res(jwOut(nid), "拿下來了"); };
  info.querySelectorAll("[data-jwput]").forEach((x) => (x.onclick = (e) => { e.stopPropagation(); const j = jwById(x.dataset.jwput); res(jwPut(nid, x.dataset.jwput), `鑲上：${j ? jwName(j) : ""}`); }));
  info.querySelectorAll("[data-jwsell]").forEach((x) => (x.onclick = (e) => { e.stopPropagation(); const j = jwById(x.dataset.jwsell), p = j ? jwPrice(j) : 0; res(jwSell(x.dataset.jwsell), `賣掉了 +${p} 靈石`); }));
}
// ── 畫玉槽（六角形）──
function trJwDraw(g, N, x, y, rr, on, av, inP, sel) {
  const j = jwById(jwSock()[N.id]);
  if (sel && j && j.u && j.u !== "wanxiang") { g.beginPath(); g.arc(x, y, JW_R * trView.z, 0, Math.PI * 2); g.strokeStyle = "rgba(255,154,58,0.5)"; g.setLineDash([6, 6]); g.lineWidth = 1.5; g.stroke(); g.setLineDash([]); }
  const hex = (r) => { g.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); };
  hex(rr); g.fillStyle = on ? "#3a3020" : inP ? "#6a5a30" : "#1c1a16"; g.fill();
  g.lineWidth = Math.max(1.5, (sel ? 3.5 : 2.5) * Math.min(1.3, trView.z));
  g.strokeStyle = sel ? "#ffffff" : on ? "#ffd25a" : inP ? "#fff3c0" : av ? "#f4f0e6" : "#7a6a4a"; g.stroke();
  if (j && rr >= 6 && icoHas("tree", jwIk(j))) { g.globalAlpha = on ? 1 : 0.55; icoDraw(g, "tree", jwIk(j), x - rr * 0.95, y - rr * 0.95, rr * 1.9, rr * 1.9); g.globalAlpha = 1; }
  else if (j) { hex(rr * 0.6); g.fillStyle = jwColor(j); g.globalAlpha = on ? 1 : 0.5; g.fill(); g.globalAlpha = 1; g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 1; g.stroke(); }
  else { hex(rr * 0.5); g.strokeStyle = on ? "#ffd25a" : "#5a5446"; g.lineWidth = 1; g.setLineDash([3, 3]); g.stroke(); g.setLineDash([]); }
}
// ── 行囊道具分頁：看得到天賦玉 ──
const _propListT3 = propList;
propList = function () {
  const L = _propListT3.apply(this, arguments);
  if (!save.w) return L;
  for (const j of jwList()) { const w = jwWhere(j.id); L.push({ k: "jw:" + j.id, g: "玉", c: jwColor(j), n: 1, name: `天賦玉・${jwName(j)}`, d: jwTxt(j).join("、") + (w ? "（鑲在天賦樹上）" : "。到天賦樹（P）點亮玉槽後鑲上") }); }
  return L;
};

// ───────── 8. 狀態圖示 ─────────
if (typeof STATUS !== "undefined") STATUS.push(
  { k: "tstill2", g: "定", c: "#e8c87a", on: (p) => trN("still") && p.trStill >= 0.5 },
  { k: "tregen", g: "春", c: "#7dff9a", on: (p) => trN("regen") && p.hp < p.maxHp && !(time - (p.trHurtT == null ? -99 : p.trHurtT) <= 4) },
  { k: "tqi", g: "氣", c: "#7aa8ff", on: (p) => trN("qi") && B.maxMp > 0 && p.mp >= B.maxMp * 0.8 },
);
