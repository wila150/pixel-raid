// 萬劍仙途 — 構築：武器組 1/2/3、輔助寶石（元素轉化／多重投射／引爆）、超技能寶石、轉職、英雄核心＋保命技、傳授寶石、起源大招、多角色
"use strict";

// ───────── 英雄核心（角色綁定、拆不掉）─────────
const HEROES = {
  ronin: { n: "時空浪人", save: "時間回溯", cd: 30, sd: "回到 3 秒前的位置和生命", pd: "每次切換武器，下一招段數翻倍" },
  witch: { n: "劇毒魔女", save: "化身霧氣", cd: 40, sd: "4 秒免疫物理傷害、移動加快", pd: "法術武器和元素轉化的傷害，全部變成可疊 5 層的毒素持續傷害（毒傷 +50%）" },
  vampire: { n: "吸血鬼", save: "血霧無敵", cd: 60, sd: "5 秒無敵，期間吸血 +10%", pd: "吸血 +3%，每斬一隻妖回 1% 生命" },
};
const HERO_KEYS = Object.keys(HEROES);
const heroKey = () => (save.w && HEROES[save.w.hero] ? save.w.hero : "ronin");
// 自己的英雄，或佩上插了那個英雄的傳授寶石
const heroHas = (k) => heroKey() === k || !!(save.eq.charm && save.eq.charm.link === k);

// ───────── 轉職（不換職業，是擴充插槽與被動）─────────
const JOBS = [
  { lv: 10, n: "一轉・築基", d: "武器輔助插槽 3→4、移動 +5%" },
  { lv: 20, n: "二轉・金丹", d: "輔助插槽 5、攻速 +8%" },
  { lv: 30, n: "三轉・元嬰", d: "解鎖武器的「超技能插槽」；英雄核心變成傳授寶石，可以插給其他角色" },
  { lv: 40, n: "四轉・化神", d: "輔助插槽 6、所有招式段數 +1" },
  { lv: 50, n: "五轉・合體", d: "段數再 +1、傷害 +15%" },
  { lv: 60, n: "六轉・渡劫", d: "起源覺醒：天罰能量集滿按 E，放出全螢幕時停的起源大招" },
];
const jobLv = () => (save.w && save.w.job) || 0;
const sockN = () => { const j = jobLv(); return j >= 4 ? 6 : j >= 2 ? 5 : j >= 1 ? 4 : 3; };
function jobStats(b) {
  const j = jobLv();
  if (j >= 1) b.spdMul *= 1.05;
  if (j >= 2) b.aspd *= 1.08;
  if (j >= 5) b.atk *= 1.15;
  if (heroHas("vampire")) b.leech += 0.03;
  return b;
}
function doJob() {
  const w = save.w, j = jobLv(), J = JOBS[j];
  if (!J || w.lv < J.lv) return false;
  w.job = j + 1;
  if (w.job >= 3) { save.links = save.links || {}; save.links[heroKey()] = 1; }
  writeSave();
  if (W0) {
    B = worldStats(); W0.maxHp = B.maxHp; W0.hp = B.maxHp; applyWeapon(); setPadLabels(true);
    flashT = 0.35; flashColor = "255,235,170"; shake = 10; sfx("win");
    burst(W0.x, W0.y, "#ffe066", 60, 160, 1); W0.rings.push({ x: W0.x, y: W0.y, t: 0, max: 0.8, r: 140, c: "255,230,150" });
    floatText(W0.x, W0.y - 40, `${J.n}！`, "#ffe066", true);
  }
  if (w.job >= 3 && typeof netAnnounce === "function") netAnnounce(`完成${J.n}！`);
  return true;
}

// ───────── 段數（楓之谷）：一下打出好幾行數字 ─────────
function curLines() {
  if (!W0) return 1;
  if (W0.originT > 0) return 8;
  const j = jobLv();
  let L = 1 + (j >= 4 ? 1 : 0) + (j >= 5 ? 1 : 0);
  if (W0.lbT > 0) L *= 2;
  return L;
}

// ───────── 輔助寶石：元素轉化、引爆、多重投射（GEMS 在 equip.js）─────────
function elemHit(m, dmg) {
  const gi = gemLv("ice"), gf = gemLv("fire"), gd = gemLv("det");
  if (heroHas("witch") && (gi || gf || SPELL_WT[curWeapon()])) { // 魔女：屬性傷害全部變毒
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

// ───────── 超技能寶石（三轉解鎖，一把武器一顆，改變技能機制）─────────
const SUPERS = {
  meteor: { n: "天降隕石", c: "#ff7a3a", d: "Q 招變成天降隕石：0.8 秒後在目標砸下巨大隕石" },
  swordrain: { n: "萬劍天降", c: "#bfe6ff", d: "Q 招變成萬劍天降：身邊落下 16 把飛劍" },
  thunder: { n: "雷霆萬鈞", c: "#e0d0ff", d: "所有招式打中時 15% 再劈一道落雷" },
};
const SUPER_COST = 120; // 天罰碎屑
const supOn = (k) => jobLv() >= 3 && save.eq.sword && save.eq.sword.sup === k;
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
  if (heroHas("ronin")) { W0.lbReady = true; floatText(W0.x, W0.y - 34, "段數翻倍待發", "#9fe8ff"); }
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
  const p = W0, h = HEROES[heroKey()];
  if (!p || (p.saveCd || 0) > 0) { if (p) floatText(p.x, p.y - 24, `${h.save}冷卻中 ${Math.ceil(p.saveCd)} 秒`, "#cfc4dc"); return; }
  p.saveCd = h.cd;
  if (heroKey() === "ronin") {
    const o = (p.hist && p.hist[0]) || { x: p.x, y: p.y, hp: p.hp };
    burst(p.x, p.y, "#9fe8ff", 20, 90); p.x = o.x; p.y = o.y; p.hp = Math.max(p.hp, o.hp); p.iframe = 0.6; cam.x = p.x; cam.y = p.y;
    W0.rings.push({ x: p.x, y: p.y, t: 0, max: 0.5, r: 50, c: "150,220,255" }); flashT = 0.15; flashColor = "150,220,255";
  } else if (heroKey() === "witch") { p.mistT = 4; burst(p.x, p.y, "#a0ff9a", 30, 80, 0.6); }
  else { p.invT = 5; burst(p.x, p.y, "#ff3a4a", 30, 90, 0.6); flashT = 0.12; flashColor = "200,20,40"; }
  floatText(p.x, p.y - 30, h.save + "！", "#ffe066", true); sfx("arrive");
}

// ───────── 起源覺醒（六轉）：全螢幕時停＋段數炸裂 ─────────
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
  const h = HEROES[heroKey()], cd = Math.ceil((W0 && W0.saveCd) || 0);
  const key = [0, 1, 2].map((i) => { const it = wsGet(i); return it ? it.id + it.q : "-"; }).join() + save.w.wi + cd + heroKey();
  if (!force && key === wbarKey) return; wbarKey = key;
  wbar.innerHTML = [0, 1, 2].map((i) => { const it = wsGet(i); return `<button class="ws${i === save.w.wi ? " on" : ""}${it ? "" : " empty"}" data-ws="${i}" style="--c:${it ? RARITY[it.q].c : "#555"}">${it ? itemIcon(it) : ""}<small>${i + 1}</small></button>`; }).join("")
    + `<button class="save${cd ? " cd" : ""}" data-save="1"><b>${h.save}</b><small>${cd ? cd + "s" : TOUCH ? "" : "V"}</small></button>`;
}
wbar.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b || state !== "world") return; if (b.dataset.save) heroSave(); else switchW(+b.dataset.ws); wbarDraw(true); });
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
// 角色畫面加上：英雄核心、轉職、角色列表
const _renderAP = renderAP;
renderAP = function (msg) {
  _renderAP();
  const w = save.w, h = HEROES[heroKey()], j = jobLv(), J = JOBS[j], panel = screenEl.querySelector(".panel"), btns = panel && panel.querySelector(".btns");
  if (!btns) return;
  const cs = charList();
  const box = document.createElement("div"); box.className = "herobox";
  box.innerHTML = `${msg ? `<div class="emsg">${msg}</div>` : ""}
    <div class="baghead">英雄核心：<b>${h.n}</b>（綁定角色，拆不掉）</div>
    <div class="hcore"><div><b>保命技・${h.save}</b>（V，冷卻 ${h.cd} 秒）<small>${h.sd}</small></div><div><b>核心被動</b><small>${h.pd}</small></div></div>
    ${!w.heroSet ? `<div class="baghead">還沒選過英雄：可以免費選一次</div><div class="hpick">${HERO_KEYS.map((k) => `<button class="tab${k === heroKey() ? " on" : ""}" data-hero="${k}">${HEROES[k].n}</button>`).join("")}</div>` : ""}
    <div class="baghead">轉職 <small>目前 ${j ? JOBS[j - 1].n : "未轉職"}</small></div>
    <div class="jobs">${JOBS.map((x, i) => `<span class="job${i < j ? " done" : i === j ? " next" : ""}"><b>${x.n}</b><small>Lv.${x.lv}・${x.d}</small></span>`).join("")}</div>
    ${J ? `<button id="doJob" class="big${w.lv >= J.lv ? "" : " alt"}" ${w.lv >= J.lv ? "" : "disabled"}>${w.lv >= J.lv ? `進行 ${J.n}` : `Lv.${J.lv} 可以 ${J.n}`}</button>` : `<p class="sub">已經完成六轉</p>`}
    <div class="baghead">角色（行囊共用；練到三轉，英雄核心會變成傳授寶石）</div>
    <div class="chars">${cs.map((c, i) => { const cw = i === save.ci ? w : c && c.w; if (!cw) return ""; return `<button class="cchar${i === save.ci ? " on" : ""}" data-char="${i}"><b>${cw.nick || "修士"}</b><small>${HEROES[cw.hero] ? HEROES[cw.hero].n : "時空浪人"}・Lv.${cw.lv}${cw.job ? "・" + JOBS[cw.job - 1].n.split("・")[0] : ""}</small></button>`; }).join("")}
      ${cs.length < 3 ? `<button class="cchar new" id="newChar"><b>＋ 新角色</b><small>從 Lv.1 開始</small></button>` : ""}</div>`;
  panel.insertBefore(box, btns);
  box.querySelectorAll("[data-hero]").forEach((b) => b.addEventListener("click", () => { w.hero = b.dataset.hero; w.heroSet = 1; writeSave(); B = worldStats(); sfx("arrive"); renderAP(`英雄核心：${HEROES[w.hero].n}`); }));
  const dj = document.getElementById("doJob"); if (dj) dj.onclick = () => { if (doJob()) renderAP(`完成${JOBS[jobLv() - 1].n}！`); };
  box.querySelectorAll("[data-char]").forEach((b) => b.addEventListener("click", () => { const m = switchChar(+b.dataset.char); if (m) renderAP(m); }));
  const nc = document.getElementById("newChar"); if (nc) nc.onclick = () => { const m = newChar(); if (m) renderAP(m); };
};
