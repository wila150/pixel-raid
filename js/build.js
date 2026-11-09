// 萬劍仙途 — 構築：武器組 1/2/3、輔助寶石（元素轉化／多重投射／引爆）、超技能寶石、轉職、護身法術（保命技）、起源大招、多角色
"use strict";

// ───────── 護身法術（保命技，V／手機下方按鈕；隨轉職解鎖，安全營地可換）─────────
// v4.7 拿掉「選英雄」：保命技改成可以換的護身法術；舊英雄的被動改成傳說裝備（時之沙漏、萬毒蟾衣、血玉佩）
const SAVES = {
  rewind: { n: "時間回溯", cd: 30, job: 0, d: "回到 3 秒前的位置和生命" },
  mist: { n: "化身霧氣", cd: 40, job: 1, d: "4 秒免疫物理傷害、移動加快" },
  blood: { n: "血霧無敵", cd: 60, job: 2, d: "5 秒無敵，期間吸血 +10%" },
};
const SAVE_KEYS = Object.keys(SAVES);
const HERO_SAVE = { ronin: "rewind", witch: "mist", vampire: "blood" };
const HERO_GIFT = { ronin: "hourglass", witch: "toadrobe", vampire: "bloodjade" };
const svHas = (k, w = save.w) => !!w && (jobLvOf(w) >= SAVES[k].job || (w.svU || []).includes(k));
const svKey = () => { const w = save.w; return w && SAVES[w.sv] && svHas(w.sv) ? w.sv : "rewind"; };
// 舊存檔：原本的英雄 → 那個保命技直接解鎖＋送對應傳說；插著的傳授寶石拆掉換碎屑
function migHero() {
  let note = "";
  const one = (w, eq) => {
    if (!w || w.hv) return; w.hv = 1;
    const hk = HEROES_OLD[w.hero] ? w.hero : w.created ? "ronin" : null; // 很舊的角色沒選過＝預設浪人
    if (hk) {
      const sk = HERO_SAVE[hk]; w.svU = [sk]; w.sv = sk;
      const it = giftUnique(HERO_GIFT[hk], w.lv); if (it) { save.bag.push(it); note = `英雄改版：保命技「${SAVES[sk].n}」保留，另外送你一件「${it.name}」（在行囊）`; }
    }
    const ch = eq && eq.charm; if (ch && ch.link) { delete ch.link; save.shards = (save.shards || 0) + 40; note = (note ? note + "；" : "") + "傳授寶石拆下，補償 40 碎屑"; }
    delete w.hero; delete w.heroSet;
  };
  one(save.w, save.eq);
  for (const c of save.chars || []) if (c) one(c.w, c.eq);
  delete save.links;
  return note;
}
const HEROES_OLD = { ronin: 1, witch: 1, vampire: 1 };
function giftUnique(u, lv) {
  if (!UNIQUES[u]) return null;
  const il = Math.floor((lv || 1) / 3) + 1, sl = UNIQUES[u].slot, bv = BASE_VAL[SLOTS[sl].base];
  const it = rollItem(0, il); it.slot = sl; it.u = u; it.q = 3; delete it.wt; delete it.so;
  it.base = Math.round((bv[0] + bv[1] * il) * 2); rollAffixes(it, 2); nameItem(it); return it;
}

// ───────── 轉職（不換職業，是擴充插槽與被動）─────────
const JOBS = [
  { lv: 10, n: "一轉・築基", d: "武器輔助插槽 3→4、移動 +5%、解鎖護身法術「化身霧氣」" },
  { lv: 30, n: "二轉・金丹", d: "輔助插槽 5、攻速 +8%、解鎖武器的「超技能插槽」、解鎖護身法術「血霧無敵」" },
  { lv: 70, n: "三轉・元嬰", d: "輔助插槽 6、所有招式段數 +1" },
  { lv: 120, n: "四轉・化神", d: "段數再 +1、傷害 +15%、起源覺醒：天罰能量集滿按 E，放出全螢幕時停的起源大招" },
];
// 舊存檔是 6 轉制，換成 4 轉制（一次性）
const migJob = (w) => { if (w && w.job && !w.jv) { w.job = [0, 1, 2, 2, 3, 4, 4][w.job] || 4; } if (w) w.jv = 2; return w; };
const jobLvOf = (w) => (w && migJob(w).job) || 0;
const jobLv = () => jobLvOf(save.w);
const sockN = () => { const j = jobLv(); return j >= 3 ? 6 : j >= 2 ? 5 : j >= 1 ? 4 : 3; };
function jobStats(b) {
  const j = jobLv();
  if (j >= 1) b.spdMul *= 1.05;
  if (j >= 2) b.aspd *= 1.08;
  if (j >= 4) b.atk *= 1.15;
  if (b.uq && b.uq.vamp) b.leech += 0.03; // 血玉佩
  return b;
}
function doJob() {
  const w = save.w, j = jobLv(), J = JOBS[j];
  if (!J || w.lv < J.lv) return false;
  w.job = j + 1;
  const ns = SAVE_KEYS.find((k) => SAVES[k].job === w.job);
  writeSave();
  if (W0) {
    B = worldStats(); W0.maxHp = B.maxHp; W0.hp = B.maxHp; applyWeapon(); setPadLabels(true);
    flashT = 0.35; flashColor = "255,235,170"; shake = 10; sfx("win");
    burst(W0.x, W0.y, "#ffe066", 60, 160, 1); W0.rings.push({ x: W0.x, y: W0.y, t: 0, max: 0.8, r: 140, c: "255,230,150" });
    floatText(W0.x, W0.y - 40, `${J.n}！`, "#ffe066", true);
    if (ns) notice(`解鎖護身法術「${SAVES[ns].n}」（角色→修行）`, "#9fe8ff");
  }
  if (w.job >= 2 && typeof netAnnounce === "function") netAnnounce(`完成${J.n}！`);
  return true;
}

// ───────── 段數（楓之谷）：一下打出好幾行數字 ─────────
function curLines() {
  if (!W0) return 1;
  if (W0.originT > 0) return 8;
  const j = jobLv();
  let L = 1 + (j >= 3 ? 1 : 0) + (j >= 4 ? 1 : 0);
  if (W0.lbT > 0) L *= 2;
  return L;
}

// ───────── 輔助寶石：元素轉化、引爆、多重投射（GEMS 在 equip.js）─────────
function elemHit(m, dmg) {
  const gi = gemLv("ice"), gf = gemLv("fire"), gd = gemLv("det");
  if (B.uq.psnConv && (gi || gf || SPELL_WT[curWeapon()])) { // 萬毒蟾衣：屬性傷害全部變毒
    m.psn = Math.min(5, (m.psn || 0) + 1); m.psnT = 3; m.psnD = Math.max(m.psnD || 0, dmg * 0.12 * (1 + (gi + gf) * 0.15));
    return dmg;
  }
  if (gf && m.frz > 0) { // 冰凍的怪被火打到：融化爆發
    dmg *= 2.5; m.frz = 0;
    floatText(m.x, m.y - 22, "融化！", "#ff9a3a", true); burst(m.x, m.y, "#ffb070", 18, 110, 0.5); burst(m.x, m.y, "#bfefff", 10, 80, 0.4);
  }
  if (gi) { m.slowT = Math.max(m.slowT || 0, 1.5); if (Math.random() < (m.boss ? 0.03 : 0.1) * (1 + gi * 0.6)) { if (!(m.frz > 0)) floatText(m.x, m.y - 18, "冰凍", "#bfefff"); m.frz = m.boss ? 0.5 : 1.4; } }
  if (gf) { m.burnT = 3; m.burnD = Math.max(m.burnD || 0, dmg * 0.1 * (1 + gf * 0.2)); }
  if (gd && m.burnT > 0 && Math.random() < 0.12 + gd * 0.05) W0.fires.push({ x: m.x, y: m.y, t: 0.05, r: 28 + gd * 3, dmg: 8 + gd * 5, c: "#ff8a3d" });
  if (supOn("thunder") && !chainLock && Math.random() < 0.15) { bolts.push({ x: m.x, y: m.y, life: 0.25 }); chainLock = true; setTimeout(() => { if (!m.dead && W0) { chainLock = true; hitMob(m, wDmg(14), 0, null, true); chainLock = false; } }, 60); chainLock = false; }
  return dmg;
}
// 燃燒、中毒每 0.5 秒跳一次；冰凍的怪不能動（回傳 true＝這一幀不要動）
function dotTick(m, dt) {
  if (m.burnT > 0) m.burnT -= dt;
  if (m.psnT > 0) m.psnT -= dt; else m.psn = 0;
  m.dotT = (m.dotT || 0.5) - dt;
  if (m.dotT <= 0) {
    m.dotT = 0.5;
    const tot = (m.burnT > 0 ? m.burnD : 0) + (m.psnT > 0 ? m.psnD * m.psn * 1.5 : 0);
    if (tot >= 1) {
      const v = Math.round(tot); m.hp -= v;
      floatText(m.x + rand(-4, 4), m.y - 6, `${v}`, m.psnT > 0 ? "#8dff6a" : "#ff9a3a");
      if (m.hp <= 0 && !m.dead) { killMob(m); return true; }
    }
  }
  if (m.frz > 0) { m.frz -= dt; return !m.boss; }
  return false;
}
// 多重投射：飛行招式多射 2 道（3 級以上 4 道），每道 70%
function multiShots(a, o, push) {
  const g = gemLv("lmp"); if (!g || o.noMulti) return;
  const n = g >= 3 ? 2 : 1;
  for (let i = 1; i <= n; i++) for (const s of [-1, 1]) push(a + s * i * 0.22, Object.assign({}, o, { dmg: o.dmg * 0.7, noMulti: true }));
}

// ───────── 超技能寶石（二轉解鎖，一把武器一顆，改變技能機制）─────────
const SUPERS = {
  meteor: { n: "天降隕石", c: "#ff7a3a", d: "Q 招變成天降隕石：0.8 秒後在目標砸下巨大隕石" },
  swordrain: { n: "萬劍天降", c: "#bfe6ff", d: "Q 招變成萬劍天降：身邊落下 16 把飛劍" },
  thunder: { n: "雷霆萬鈞", c: "#e0d0ff", d: "所有招式打中時 15% 再劈一道落雷" },
};
const SUPER_COST = 120; // 天罰碎屑
const supOn = (k) => jobLv() >= 2 && save.eq.sword && save.eq.sword.sup === k;
const addSup = (k, n = 1) => { save.sups = save.sups || {}; save.sups[k] = (save.sups[k] || 0) + n; };
function superSpin(p, t) { // doSpin 開頭呼叫；回傳 true＝已經放了
  const tx = t ? t.x : p.x + Math.cos(p.face) * 60, ty = t ? t.y : p.y + Math.sin(p.face) * 60;
  if (supOn("meteor")) { W0.fires.push({ x: tx, y: ty, t: 0.8, r: 56, dmg: 70 }); sfx("volley"); netCast("q", p.face, tx, ty); return true; }
  if (supOn("swordrain")) { for (let i = 0; i < 16; i++) { const a = rand(0, 6.28), r = rand(10, 75); W0.fires.push({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r * 0.7, t: 0.1 + i * 0.05, r: 16, dmg: 14, c: "#ffe9a0" }); } sfx("volley"); netCast("e", p.face, p.x, p.y); return true; }
  return false;
}

// ───────── 武器組：同時帶 3 把，1／2／3 即時切換 ─────────
const wsArr = () => { const w = save.w; if (!w.ws) w.ws = [null, null, null]; if (w.wi === undefined) w.wi = 0; return w.ws; };
const wsGet = (i) => (i === save.w.wi ? save.eq.sword : wsArr()[i]) || null;
const wsItems = () => wsArr().filter(Boolean);
function switchW(i) {
  const ws = wsArr(), w = save.w;
  if (i === w.wi || !W0) return;
  if (!ws[i]) { floatText(W0.x, W0.y - 26, `第 ${i + 1} 把武器是空的（背包裡設定）`, "#cfc4dc"); return; }
  if ((W0.swT || 0) > 0) return;
  ws[w.wi] = save.eq.sword || null; save.eq.sword = ws[i]; ws[i] = null; w.wi = i; W0.swT = 0.25;
  B = worldStats(); W0.maxHp = B.maxHp; W0.hp = Math.min(W0.hp, B.maxHp); setPadLabels(true);
  if (B.uq.lbDouble) { W0.lbReady = true; floatText(W0.x, W0.y - 34, "段數翻倍待發", "#9fe8ff"); }
  floatText(W0.x, W0.y - 24, `${i + 1}・${save.eq.sword.name}`, RARITY[save.eq.sword.q].c, true); sfx("dash");
  burst(W0.x, W0.y, "#ffcf6b", 10, 50); fxCast(WPN_FX[curWeapon()]);
  writeSave(); wbarDraw(true);
}
function setWSlot(i, it) { // 從背包放到第 i 把
  const ws = wsArr(), w = save.w;
  if (i === w.wi) { equipItem(it); return; }
  save.bag = save.bag.filter((b) => b !== it);
  if (ws[i]) save.bag.push(ws[i]);
  ws[i] = it; writeSave();
}

// ───────── 保命技（V／手機下方按鈕）─────────
function heroSave() {
  const p = W0, k = svKey(), h = SAVES[k];
  if (!p || (p.saveCd || 0) > 0) { if (p) floatText(p.x, p.y - 24, `${h.n}冷卻中 ${Math.ceil(p.saveCd)} 秒`, "#cfc4dc"); return; }
  p.saveCd = h.cd;
  if (k === "rewind") {
    const o = (p.hist && p.hist[0]) || { x: p.x, y: p.y, hp: p.hp };
    burst(p.x, p.y, "#9fe8ff", 20, 90); p.x = o.x; p.y = o.y; p.hp = Math.max(p.hp, o.hp); p.iframe = 0.6; cam.x = p.x; cam.y = p.y;
    W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.5, r: 50, c: "150,220,255" }); flashT = 0.15; flashColor = "150,220,255";
  } else if (k === "mist") { p.mistT = 4; burst(p.x, p.y, "#a0ff9a", 30, 80, 0.6); }
  else { p.invT = 5; burst(p.x, p.y, "#ff3a4a", 30, 90, 0.6); flashT = 0.12; flashColor = "200,20,40"; }
  floatText(p.x, p.y - 30, h.n + "！", "#ffe066", true); sfx("arrive");
}

// ───────── 起源覺醒（四轉）：全螢幕時停＋段數炸裂 ─────────
const ORIGIN_N = { sword: "起源．萬劍歸墟", staff: "起源．終焉隕石滅絕", bow: "起源．射日九天", blade: "起源．斷岳開天", fist: "起源．百裂金剛", fan: "起源．乾坤歸一" };
function originStart() {
  W0.originT = 2.2; W0.originN = ORIGIN_N[curWeapon()]; W0.originTick = 0;
  sfx("win"); shake = 6; netCast("e", W0.face, W0.x, W0.y);
  if (typeof netAnnounce === "function" && Math.random() < 0.2) netAnnounce(`放出了 ${W0.originN}！`);
}
function originTick(dt) {
  if (!(W0.originT > 0)) return;
  W0.originT -= dt; W0.originTick -= dt;
  const vis = W0.mobs.filter((m) => !m.dead && Math.abs(m.x - W0.x) < 260 && Math.abs(m.y - W0.y) < 170);
  if (W0.originTick <= 0 && W0.originT > 0.4) {
    W0.originTick = 0.12;
    const m = vis[Math.floor(Math.random() * vis.length)];
    if (m) { bolts.push({ x: m.x, y: m.y, life: 0.3 }); fxBoom(m.x, m.y, 22, "255,220,140"); hitMob(m, wDmg(16), 0, W0, true); }
  }
  if (W0.originT <= 0) { // 最後一擊
    for (const m of vis) hitMob(m, wDmg(60), 120, W0, true);
    flashT = 0.3; flashColor = "255,240,200"; shake = 14; sfx("crit");
    W0.rings.push({ x: W0.x, y: W0.y, t: 0, max: 0.6, r: 220, c: "255,220,140" });
  }
}
function drawOrigin() {
  if (!W0 || !(W0.originT > 0)) return;
  const q = Math.min(1, (2.2 - W0.originT) * 3);
  ctx.fillStyle = `rgba(10,6,20,${0.32 * q})`; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8);
  g.addColorStop(0, "rgba(255,210,120,0)"); g.addColorStop(1, `rgba(255,190,90,${0.35 * q})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.textAlign = "center"; ctx.font = `900 ${Math.round(Math.min(W, H) * 0.075)}px 'Noto Serif TC', serif`;
  ctx.lineWidth = 6; ctx.strokeStyle = "rgba(40,20,0,0.8)"; ctx.strokeText(W0.originN, W / 2, H * 0.32);
  ctx.fillStyle = "#ffe9a0"; ctx.fillText(W0.originN, W / 2, H * 0.32); ctx.restore();
}

// ───────── 每幀（updateWorld 呼叫）─────────
function heroTick(dt, inMenu) {
  const p = W0;
  p.saveCd = Math.max(0, (p.saveCd || 0) - dt); p.swT = Math.max(0, (p.swT || 0) - dt);
  if (p.mistT > 0) { p.mistT -= dt; if (Math.random() < 0.5) particles.push({ x: p.x + rand(-8, 8), y: p.y + rand(-8, 4), vx: rand(-10, 10), vy: -15, life: 0.5, max: 0.5, color: "#9aff9a", size: 2 }); }
  if (p.invT > 0) { p.invT -= dt; if (Math.random() < 0.5) particles.push({ x: p.x + rand(-7, 7), y: p.y + rand(-8, 4), vx: 0, vy: -20, life: 0.4, max: 0.4, color: "#ff3a4a", size: 2 }); }
  if (p.lbT > 0) p.lbT -= dt;
  p.histT = (p.histT || 0) - dt;
  if (p.histT <= 0) { p.histT = 0.1; p.hist = p.hist || []; p.hist.push({ x: p.x, y: p.y, hp: p.hp }); if (p.hist.length > 30) p.hist.shift(); }
  originTick(dt);
  if (inMenu) return;
  for (const k of ["1", "2", "3"]) if (pressed.has(k)) switchW(+k - 1);
  if (pressed.has("v")) heroSave();
}
// 出招時：浪人「下一招段數翻倍」
function skillUsed(k) { if (W0.lbReady && k !== "roll" && k !== "potion") { W0.lbReady = false; W0.lbT = 0.8; } }

// ───────── 怪物狀態畫面：冰凍、燃燒、中毒 ─────────
const _drawWMob = drawWMob;
drawWMob = function (m) {
  _drawWMob(m);
  const r = (WMOBS[m.type] && WMOBS[m.type].r) || 8;
  if (m.frz > 0) { ctx.fillStyle = "rgba(170,225,255,0.45)"; ctx.fillRect(m.x - r - 1, m.y - r - 1, r * 2 + 2, r * 2 + 2); ctx.strokeStyle = "rgba(230,250,255,0.9)"; ctx.lineWidth = 1; ctx.strokeRect(m.x - r - 1, m.y - r - 1, r * 2 + 2, r * 2 + 2); }
  if (m.burnT > 0 && Math.random() < 0.4) particles.push({ x: m.x + rand(-r, r), y: m.y + rand(-r, 0), vx: 0, vy: -25, life: 0.3, max: 0.3, color: "#ff8a3d", size: 1.5 });
  if (m.psnT > 0 && Math.random() < 0.3) particles.push({ x: m.x + rand(-r, r), y: m.y + rand(-r, 0), vx: 0, vy: -12, life: 0.5, max: 0.5, color: "#8dff6a", size: 1.5 });
  if (m.psn > 1) { ctx.font = "bold 5px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#8dff6a"; ctx.fillText(`毒×${m.psn}`, m.x, m.y + r + 7); }
};
const _drawWorldHud = drawWorldHud;
drawWorldHud = function () { _drawWorldHud(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); drawOrigin(); };

// ───────── 下方武器列（電腦、手機都能點）─────────
const wbar = document.createElement("div"); wbar.id = "wbar"; wbar.className = "hidden"; document.body.appendChild(wbar);
let wbarKey = "";
function wbarDraw(force) {
  const on = typeof inWorld !== "undefined" && inWorld && state === "world" && save.w;
  wbar.classList.toggle("hidden", !on); if (!on) return;
  const h = SAVES[svKey()], cd = Math.ceil((W0 && W0.saveCd) || 0);
  const pot = save.w.potions, ap = save.w.autoPot !== false, rc = W0 && W0.recall > 0;
  const key = [0, 1, 2].map((i) => { const it = wsGet(i); return it ? it.id + it.q : "-"; }).join() + save.w.wi + cd + svKey() + pot + ap + rc;
  if (!force && key === wbarKey) return; wbarKey = key;
  wbar.innerHTML = [0, 1, 2].map((i) => { const it = wsGet(i); return `<button class="ws${i === save.w.wi ? " on" : ""}${it ? "" : " empty"}" data-ws="${i}" style="--c:${it ? RARITY[it.q].c : "#555"}">${it ? itemIcon(it) : ""}<small>${i + 1}</small></button>`; }).join("")
    + `<button class="save${cd ? " cd" : ""}" data-save="1"><b>${h.n}</b><small>${cd ? cd + "s" : TOUCH ? "" : "V"}</small></button>`
    + `<button class="qit pot${ap ? " auto" : ""}" data-it="pot" title="丹藥（長按切換自動）"><b>丹</b><small>×${pot}</small>${ap ? "<i>自</i>" : ""}</button>`
    + `<button class="qit rc${rc ? " on" : ""}" data-it="rc" title="回城符：原地不動 3 秒回青雲城"><b>回</b><small>${rc ? "…" : "城"}</small></button>`;
}
wbar.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b || state !== "world") return; if (b.dataset.it) { if (wbarLong) { wbarLong = false; return; } quickItem(b.dataset.it); } else if (b.dataset.save) heroSave(); else switchW(+b.dataset.ws); wbarDraw(true); });
// 企劃 15 第 9 節：快捷道具欄（丹藥：點＝喝、長按＝切換自動；回城符）
let wbarLong = false, wbarLT = null;
wbar.addEventListener("pointerdown", (e) => { const b = e.target.closest('[data-it="pot"]'); if (!b) return; wbarLong = false; clearTimeout(wbarLT); wbarLT = setTimeout(() => { wbarLong = true; save.w.autoPot = save.w.autoPot === false; writeSave(); sfx("click"); if (W0) floatText(W0.x, W0.y - 30, save.w.autoPot ? "自動丹藥：開（血量低於 30%）" : "自動丹藥：關", "#ffcf9a", true); wbarDraw(true); }, 500); });
["pointerup", "pointercancel", "pointerleave"].forEach((ev) => wbar.addEventListener(ev, () => clearTimeout(wbarLT)));
function quickItem(k) {
  if (!W0) return;
  if (k === "pot") { padAct.add("potion"); return; }
  if (k === "rc") {
    if (safeAt(W0.x, W0.y)) { floatText(W0.x, W0.y - 26, "已經在安全區了", "#cfc4dc", true); return; }
    if (W0.recall > 0) return;
    W0.recall = 3; W0.recallTo = null; floatText(W0.x, W0.y - 26, "回城符：原地不動 3 秒", "#9fe8ff", true);
  }
}
setInterval(() => wbarDraw(), 250);

// ───────── 多角色（帳號共用行囊；每個角色自己的等級、配點、裝備、轉職）─────────
function charList() { if (!save.chars) { save.chars = [null]; save.ci = 0; } return save.chars; }
function switchChar(j) {
  const cs = charList();
  if (j === save.ci || !cs[j]) return;
  if (W0 && !safeAt(W0.x, W0.y)) return "回到安全營地才能換角色";
  if (riskyItems().length) bankLoot("換角色");
  cs[save.ci] = { w: save.w, eq: save.eq }; save.w = cs[j].w; save.eq = cs[j].eq; cs[j] = null; save.ci = j;
  writeSave(); if (W0) { W0.orbs = []; W0.voids = []; } enterWorld(); return "";
}
function newChar() {
  const cs = charList();
  if (cs.length >= 3) return "最多 3 個角色";
  if (W0 && !safeAt(W0.x, W0.y)) return "回到安全營地才能建新角色";
  cs[save.ci] = { w: save.w, eq: save.eq }; cs.push(null); save.ci = cs.length - 1;
  save.w = null; save.eq = {}; writeSave(); ovClose(); renderCreate(); return "";
}
