// 御劍渡劫（pixel-raid）— 斬妖試煉：在山林裡斬妖獸、撿妖丹升級、三選一變強，撐到妖王出現再去渡劫
"use strict";

const HUNT = { w: 900, h: 900, time: 180 }; // 地圖大小、撐多久（秒）
let hunt = null;

// ───────── 妖獸 ─────────
const WOLF = sprite([
  "k.........k..",
  "kGk......kGk.",
  "kGGkkkkkkGGk.",
  "kGEGGGGGGEGk.",
  ".kGGGgGGGGGkk",
  "..kGGGGGGGGGk",
  "..kGkGkkGkGk.",
  "..kk.kk.kk.k.",
], { k: "#1b1424", G: "#4f7a5a", g: "#7fb08a", E: "#ff5a4a" });
const GOLEM = sprite([
  "....kkkkkk....",
  "...kSSSSSSk...",
  "..kSsSSSSsSk..",
  "..kSEkSSkESk..",
  ".kkSSSSSSSSkk.",
  "kSSkSSOOSSkSSk",
  "kSSkSOOOOSkSSk",
  "kSSkSSOOSSkSSk",
  ".kk.kSSSSk.kk.",
  "....kSkkSk....",
  "....kkk.kkk...",
], { k: "#1b1424", S: "#7a6a5a", s: "#a8957f", E: "#ffe066", O: "#ff8a2e" });
const BEASTS = {
  imp: { img: () => MOB, hp: 8, spd: 32, dmg: 6, r: 6, exp: 1 },
  wolf: { img: () => WOLF, hp: 14, spd: 58, dmg: 7, r: 6, exp: 2 },
  golem: { img: () => GOLEM, hp: 50, spd: 20, dmg: 12, r: 8, exp: 5 },
  elite: { img: () => ELITE, hp: 420, spd: 26, dmg: 18, r: 14, exp: 30, big: true },
};

// ───────── 升級三選一（只在斬妖試煉有效）─────────
const HUPS = {
  orbit: { n: "環身飛劍", d: "多一把繞著你轉的飛劍", max: 6 },
  bolt: { n: "劍氣齊發", d: "每次射出的劍氣多 1 道", max: 5 },
  edge: { n: "鋒刃", d: "所有傷害 +25%", max: 5 },
  haste: { n: "疾劍", d: "劍氣發射快 20%", max: 4 },
  field: { n: "劍域", d: "飛劍轉的圈變大 20%、轉得更快", max: 3 },
  step: { n: "身法", d: "移動快 12%", max: 3 },
  magnet: { n: "吸靈", d: "撿妖丹的範圍 +50%", max: 3 },
  body: { n: "體魄", d: "生命上限 +25，回血 25", max: 4 },
  regen: { n: "回春", d: "每秒回 1 點生命", max: 3 },
  thunder: { n: "掌心雷", d: "每 2.5 秒天雷劈最近的妖獸", max: 4 },
};
const HL = (k) => (hunt && hunt.ups[k]) || 0;

function startHunt() {
  mode = "normal";
  B = bonus();
  loot = [];
  rng = Math.random;
  run = { x: 0, y: 0, swords: 0, perks: {}, shield: 0, rows: [], fromHunt: true }; // 最後渡劫前的功法要用
  hunt = {
    x: HUNT.w / 2, y: HUNT.h / 2, hp: B.maxHp, maxHp: B.maxHp, face: 0, flip: false, walk: 0, iframe: 0, hurt: 0,
    lv: 1, exp: 0, next: 4, kills: 0, ups: {}, enemies: [], orbs: [], bolts: [], spawnT: 0, shotT: 0, thunderT: 2.5,
    regenT: 1, eliteT: 55, elites: 0, petT: 2, petX: HUNT.w / 2 - 16, petY: HUNT.h / 2, endT: 0, bossCall: false,
  };
  particles = []; floaters = []; embers = []; shake = 0; time = 0; flashT = 0; hitstop = 0;
  cam = { x: hunt.x, y: hunt.y, zoom: 1 };
  state = "hunt";
  screenEl.classList.add("hidden");
  pad.classList.add("hidden");
}
const huntDmg = () => 10 * (B ? B.atk : 1) * (1 + 0.25 * HL("edge")) * zenMul() * (B && B.uq.devour ? 1 + 0.03 * Math.floor(hunt.kills / 30) : 1);

function spawnBeast(type) {
  const t = BEASTS[type], a = rand(0, Math.PI * 2), d = rand(150, 190);
  const scale = 1 + time / 90; // 越晚出來的妖獸越硬
  hunt.enemies.push({
    type, x: clamp(hunt.x + Math.cos(a) * d, 10, HUNT.w - 10), y: clamp(hunt.y + Math.sin(a) * d, 10, HUNT.h - 10),
    hp: t.hp * scale, max: t.hp * scale, flash: 0, hitT: {}, kb: 0, ka: 0,
  });
}
function hurtBeast(e, dmg, kb = 0, from = null) {
  const crit = Math.random() < B.crit;
  if (crit) dmg *= B.critDmg;
  if (crit && B.uq.thunder && Math.random() < 0.3) { dmg += huntDmg() * 2; bolts.push({ x: e.x, y: e.y, life: 0.25 }); } // 九霄引雷劍
  const arm = e.type === "golem" ? 0.3 : e.type === "elite" ? 0.4 : 0; // 防禦（氣修無視）
  if (!B.ignoreDef) dmg *= 1 - arm;
  e.hp -= dmg; e.flash = 0.08;
  if (B.leech > 0) hunt.hp = Math.min(hunt.maxHp, hunt.hp + dmg * B.leech);
  if (kb && from) { e.kb = kb; e.ka = angTo(from, e); }
  if (crit) floatText(e.x, e.y - 10, `${Math.round(dmg)}!`, "#ffd84a");
  else if (Math.random() < 0.25) floatText(e.x, e.y - 10, `${Math.round(dmg)}`, "#ffffff");
  if (e.hp > 0) return;
  const t = BEASTS[e.type];
  e.dead = true;
  hunt.kills++;
  burst(e.x, e.y, t.big ? "#ff8a3d" : "#b07dff", t.big ? 40 : 10, t.big ? 140 : 70);
  if (Math.random() < 0.3) sfx("tick");
  // 掉妖丹（越強的妖獸掉越大顆），偶爾掉靈果回血
  const n = t.big ? 10 : 1;
  for (let i = 0; i < n; i++) hunt.orbs.push({ x: e.x + rand(-8, 8) * (n > 1), y: e.y + rand(-8, 8) * (n > 1), v: t.big ? 3 : t.exp, kind: "exp", pull: false });
  if (t.big || Math.random() < 0.025) hunt.orbs.push({ x: e.x, y: e.y + 4, v: t.big ? 40 : 15, kind: "fruit", pull: false });
  if (t.big) grantLoot(rollItem(1), e.x, e.y - 10);
  else if (Math.random() < 0.006) grantLoot(rollItem(), e.x, e.y);
  if (t.big) {
    floatText(e.x, e.y - 24, "斬殺妖將！", "#ffe066", true);
    sfx("break"); shake = 10; flashT = 0.15; flashColor = "255,200,120";
  }
}

function huntLevelUp() {
  hunt.lv++;
  hunt.exp -= hunt.next;
  hunt.next = Math.round(4 + hunt.lv * 3);
  sfx("arrive");
  burst(hunt.x, hunt.y, "#ffe066", 30, 110, 0.7);
  floatText(hunt.x, hunt.y - 26, `升到 ${hunt.lv} 級！`, "#ffe066", true);
  openHuntPick();
}
function openHuntPick() {
  const pool = Object.keys(HUPS).filter((k) => HL(k) < HUPS[k].max), opts = [];
  while (opts.length < 3 && pool.length) opts.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  if (!opts.length) { hunt.hp = Math.min(hunt.maxHp, hunt.hp + 30); return; }
  pausedFrom = state; state = "pick";
  keys.clear(); stick.id = null;
  screenEl.innerHTML = `<div class="panel wide">
    <h1 class="pick-title">升到 ${hunt.lv} 級！</h1>
    <p class="sub">選一項變強</p>
    <div class="cards">${opts.map((k) => {
      const u = HUPS[k], lv = HL(k);
      return `<button class="card tag-打王" data-k="${k}"><span class="tag">斬妖</span><b>${u.n}</b><i>Lv.${lv} → ${lv + 1}</i><span class="desc">${u.d}</span></button>`;
    }).join("")}</div>
  </div>`;
  screenEl.classList.remove("hidden");
  screenEl.querySelectorAll(".card").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.k;
    hunt.ups[k] = HL(k) + 1;
    if (k === "body") { hunt.maxHp += 25; hunt.hp = Math.min(hunt.maxHp, hunt.hp + 25); }
    screenEl.classList.add("hidden");
    state = pausedFrom;
    last = performance.now();
    floatText(hunt.x, hunt.y - 30, `${HUPS[k].n} Lv.${hunt.ups[k]}`, "#9fe8ff", true);
  }));
}

function updateHunt(dt) {
  const h = hunt;
  // 移動（整個螢幕都能拖曳當搖桿）
  let mx = 0, my = 0;
  if (keys.has("a") || keys.has("arrowleft")) mx -= 1;
  if (keys.has("d") || keys.has("arrowright")) mx += 1;
  if (keys.has("w") || keys.has("arrowup")) my -= 1;
  if (keys.has("s") || keys.has("arrowdown")) my += 1;
  if (stick.id !== null) {
    const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = Math.hypot(dx, dy);
    if (d > 8) { mx = dx / Math.max(d, 50); my = dy / Math.max(d, 50); }
  }
  const ml = Math.hypot(mx, my);
  if (ml > 1) { mx /= ml; my /= ml; }
  const spd = 80 * (1 + 0.12 * HL("step")) * B.spdMul * (B.uq.cloud ? 1.25 : 1);
  h.x = clamp(h.x + mx * spd * dt, 12, HUNT.w - 12);
  h.y = clamp(h.y + my * spd * dt, 12, HUNT.h - 12);
  if (ml > 0.1) { h.walk += dt * 10; h.face = Math.atan2(my, mx); if (mx < -0.2) h.flip = true; else if (mx > 0.2) h.flip = false; }
  h.iframe = Math.max(0, h.iframe - dt);
  h.hurt = Math.max(0, h.hurt - dt);

  // 出怪：越後面越多、越強
  if (!h.bossCall) {
    h.spawnT -= dt;
    if (h.spawnT <= 0 && h.enemies.length < 160) {
      h.spawnT = Math.max(0.22, 1.0 - time / 200);
      const n = 1 + Math.floor(time / 60);
      for (let i = 0; i < n; i++) {
        const r = Math.random();
        spawnBeast(time > 40 && r < 0.12 + time / 1500 ? "golem" : time > 20 && r < 0.45 ? "wolf" : "imp");
      }
    }
    h.eliteT -= dt;
    if (h.eliteT <= 0) {
      h.eliteT = 55; h.elites++;
      spawnBeast("elite");
      floatText(h.x, h.y - 40, "妖將來了！", "#ff8a3d", true);
      sfx("roar"); shake = 8;
    }
  }

  // 環身飛劍：碰到妖獸就砍，同一隻 0.35 秒內不重複
  const nOrb = 3 + HL("orbit"), orbR = 22 * (1 + 0.2 * HL("field")), orbSpd = 3.2 + 0.6 * HL("field");
  h.orbitPts = [];
  for (let i = 0; i < nOrb; i++) {
    const a = time * orbSpd + (i / nOrb) * Math.PI * 2;
    h.orbitPts.push({ x: h.x + Math.cos(a) * orbR, y: h.y + Math.sin(a) * orbR, a: a + Math.PI / 2 });
  }
  // 劍氣：射向最近的妖獸
  h.shotT -= dt;
  const alive = h.enemies.filter((e) => !e.dead);
  const nearest = (from, max = 1e9) => { let best = null, bd = max; for (const e of alive) { const d = dist(from, e); if (d < bd) { bd = d; best = e; } } return best; };
  if (h.shotT <= 0) {
    const tgt = nearest(h, 170);
    if (tgt) {
      h.shotT = 0.6 * Math.pow(0.8, HL("haste"));
      const n = 1 + HL("bolt"), base = angTo(h, tgt);
      for (let i = 0; i < n; i++) {
        const a = base + (i - (n - 1) / 2) * 0.18;
        h.bolts.push({ x: h.x, y: h.y - 4, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, life: 0.8, a });
      }
      sfx("tick");
    }
  }
  // 掌心雷
  if (HL("thunder")) {
    h.thunderT -= dt;
    if (h.thunderT <= 0) {
      h.thunderT = 2.5;
      const sorted = alive.slice().sort((a, b) => dist(h, a) - dist(h, b)).slice(0, HL("thunder"));
      for (const e of sorted) {
        bolts.push({ x: e.x, y: e.y, life: 0.25 });
        hurtBeast(e, huntDmg() * 4);
        burst(e.x, e.y, "#cfe0ff", 10, 80);
      }
      if (sorted.length) { sfx("crit"); flashT = Math.max(flashT, 0.05); flashColor = "200,220,255"; }
    }
  }
  // 回春
  const rg = HL("regen") + B.regen; // 回春＋道修
  if (rg) { h.regenT -= dt; if (h.regenT <= 0) { h.regenT = 1; h.hp = Math.min(h.maxHp, h.hp + rg); } }
  // 靈獸
  if (B.pet) {
    h.petX += (h.x - 16 - h.petX) * Math.min(1, dt * 5);
    h.petY += (h.y - 6 - h.petY) * Math.min(1, dt * 5);
    h.petT -= dt;
    if (h.petT <= 0) {
      if (B.pet === "fox") {
        h.petT = 2;
        const tgt = nearest({ x: h.petX, y: h.petY }, 160);
        if (tgt) { const a = angTo({ x: h.petX, y: h.petY }, tgt); h.bolts.push({ x: h.petX, y: h.petY, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, life: 1, a, fox: true }); }
      } else {
        h.petT = 5;
        const heal = Math.min(4 + B.petLv * 2, h.maxHp - h.hp);
        if (heal > 0) { h.hp += heal; floatText(h.x, h.y - 16, `+${heal}`, "#7dff8a"); }
      }
    }
  }

  // 劍氣飛行與命中
  for (const b of h.bolts) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    for (const e of alive) {
      if (e.dead || Math.hypot(e.x - b.x, e.y - b.y) > BEASTS[e.type].r + 3) continue;
      hurtBeast(e, huntDmg() * (b.fox ? 1.5 * (1 + 0.3 * (B.petLv - 1)) : 1), 60, h);
      b.life = 0; burst(b.x, b.y, b.fox ? "#ff7a2e" : "#cfefff", 4, 40);
      break;
    }
  }
  h.bolts = h.bolts.filter((b) => b.life > 0);

  // 妖獸移動、被飛劍砍、碰到玩家
  for (const e of alive) {
    const t = BEASTS[e.type];
    e.flash = Math.max(0, e.flash - dt);
    if (e.kb > 0) { e.x += Math.cos(e.ka) * e.kb * dt * 3; e.y += Math.sin(e.ka) * e.kb * dt * 3; e.kb = Math.max(0, e.kb - dt * 400); }
    else { const a = angTo(e, h); e.x += Math.cos(a) * t.spd * B.slow * dt; e.y += Math.sin(a) * t.spd * B.slow * dt; }
    for (const k in e.hitT) e.hitT[k] -= dt;
    h.orbitPts.forEach((o, i) => {
      if ((e.hitT[i] || 0) > 0 || Math.hypot(e.x - o.x, e.y - o.y) > t.r + 4) return;
      e.hitT[i] = 0.35;
      hurtBeast(e, huntDmg() * 0.9, t.big ? 0 : 90, h);
      burst(o.x, o.y, "#cfefff", 3, 40);
    });
    if (!e.dead && h.iframe <= 0 && dist(e, h) < t.r + 5) {
      const dmg = Math.max(1, Math.round(t.dmg * (1 + time / 200) * B.dmgTaken * (B.uq.vajra && h.hp < h.maxHp * 0.3 ? 0.5 : 1)));
      if (B.thorns > 0) hurtBeast(e, dmg * B.thorns * 3 * B.atk); // 反震
      h.hp -= dmg; h.iframe = 0.5; h.hurt = 0.2;
      floatText(h.x, h.y - 14, `-${dmg}`, "#ff6b6b");
      sfx("hurt"); shake = Math.max(shake, 4); flashT = 0.1; flashColor = "255,40,40";
      if (h.hp <= 0) { h.hp = 0; state = "huntFail"; sfx("lose"); setTimeout(showHuntFail, 1000); return; }
    }
  }
  // 妖獸互相推開一點，才不會疊成一團
  for (let i = 0; i < alive.length; i++) {
    for (let j = i + 1; j < Math.min(alive.length, i + 12); j++) {
      const a = alive[i], b = alive[j], d = dist(a, b), m = BEASTS[a.type].r + BEASTS[b.type].r;
      if (d > 0 && d < m) { const p = (m - d) / 2 / d; a.x -= (b.x - a.x) * p; a.y -= (b.y - a.y) * p; b.x += (b.x - a.x) * p; b.y += (b.y - a.y) * p; }
    }
  }
  h.enemies = h.enemies.filter((e) => !e.dead);

  // 妖丹：進入吸取範圍就飛過來
  const mag = 30 * (1 + 0.5 * HL("magnet")) * (1 + B.magnet);
  for (const o of h.orbs) {
    const d = dist(o, h);
    if (d < mag) o.pull = true;
    if (o.pull) { const a = angTo(o, h), s = 160 + (mag - Math.min(d, mag)) * 4; o.x += Math.cos(a) * s * dt; o.y += Math.sin(a) * s * dt; }
    if (d < 8) {
      o.got = true;
      if (o.kind === "fruit") {
        const heal = Math.min(o.v, h.maxHp - h.hp); h.hp += heal;
        floatText(h.x, h.y - 16, `靈果 +${heal}`, "#7dff8a"); sfx("heal");
      } else { h.exp += o.v; if (Math.random() < 0.4) sfx("tick"); }
    }
  }
  h.orbs = h.orbs.filter((o) => !o.got);
  if (h.exp >= h.next) { huntLevelUp(); return; }

  // 時間到：妖王現身 → 前往渡劫
  if (!h.bossCall && time >= HUNT.time) {
    h.bossCall = true; h.endT = 2.5;
    for (const e of h.enemies) { e.dead = true; burst(e.x, e.y, "#b07dff", 6, 60); }
    h.enemies = [];
    for (const o of h.orbs) o.pull = true;
    floatText(h.x, h.y - 30, "妖獸退散！焚天石魔現身了…", "#ffe066", true);
    sfx("roar"); shake = 14; flashT = 0.3; flashColor = "255,120,40";
  }
  if (h.bossCall) {
    h.endT -= dt;
    if (h.endT <= 0 && !h.orbs.length) {
      state = "huntEnd";
      // 等級和斬妖數換成渡劫時自動齊射的飛劍
      run.swords = Math.round(10 + h.lv * 6 + h.kills / 5 + HL("orbit") * 6 + HL("bolt") * 6 + B.swordsAff);
      openPick(`斬妖完成！換得飛劍 ${run.swords} 把`, () => startBoss(run.swords));
    }
  }
}

function showHuntFail() {
  player.swords = 0;
  stats.dealt = hunt.kills * 20; // 結算修為：斬越多拿越多
  const reward = settle(false, "C");
  screenEl.innerHTML = `<div class="panel">
    <h1>被妖獸圍攻…</h1>
    <div class="result">撐了 ${Math.floor(time)} 秒、${hunt.lv} 級、斬妖 ${hunt.kills} 隻。<br>撐滿 ${HUNT.time} 秒就能去打焚天石魔。<br>多撿妖丹升級、別被包圍，邊跑邊打。</div>
    ${reward}
    <div class="btns"><button id="again" class="big">再挑戰</button><button id="home" class="big alt">回主畫面</button></div>
  </div>`;
  screenEl.classList.remove("hidden");
  document.getElementById("again").onclick = startHunt;
  document.getElementById("home").onclick = renderTitle;
}

// ───────── 畫面 ─────────
function renderHunt() {
  const h = hunt;
  cam.x += (h.x - cam.x) * 0.15; cam.y += (h.y - cam.y) * 0.15;
  const HZ = 1.35, k = SCALE * DPR * HZ;
  const sx = shake > 0 ? rand(-shake, shake) * DPR : 0, sy = shake > 0 ? rand(-shake, shake) * DPR : 0;
  const ox = Math.round(W * DPR / 2 - cam.x * k + sx), oy = Math.round(H * DPR / 2 - cam.y * k + sy);
  ctx.setTransform(k, 0, 0, k, ox, oy);
  ctx.imageSmoothingEnabled = false;
  const hw = W / (2 * SCALE * HZ) + 30, hh = H / (2 * SCALE * HZ) + 30;
  const l = cam.x - hw, r = cam.x + hw, t = cam.y - hh, b = cam.y + hh;
  // 地面：山林草地
  ctx.fillStyle = "#0c0a12"; ctx.fillRect(l, t, r - l, b - t);
  for (let j = Math.max(0, Math.floor(t / 20)); j <= Math.min(HUNT.h / 20 - 1, Math.ceil(b / 20)); j++) {
    for (let i = Math.max(0, Math.floor(l / 20)); i <= Math.min(HUNT.w / 20 - 1, Math.ceil(r / 20)); i++) {
      const v = hash(i * 31 + j * 17);
      ctx.fillStyle = (i + j) % 2 ? "#1d2a22" : "#1a261f";
      ctx.fillRect(i * 20, j * 20, 20, 20);
      if (v < 0.25) { ctx.fillStyle = "#2c4434"; ctx.fillRect(i * 20 + v * 60, j * 20 + 6, 2, 3); ctx.fillRect(i * 20 + v * 60 + 3, j * 20 + 5, 2, 4); }
      else if (v > 0.96) { ctx.fillStyle = "#3a3448"; ctx.fillRect(i * 20 + 5, j * 20 + 8, 7, 5); ctx.fillStyle = "#4e4760"; ctx.fillRect(i * 20 + 5, j * 20 + 8, 7, 2); }
      else if (v > 0.93) { ctx.fillStyle = `rgba(160,120,255,${0.3 + Math.sin(time * 3 + i) * 0.2})`; ctx.fillRect(i * 20 + 9, j * 20 + 9, 2, 2); }
    }
  }
  ctx.strokeStyle = "#5a4d78"; ctx.lineWidth = 3; ctx.strokeRect(0, 0, HUNT.w, HUNT.h);
  // 妖丹與靈果
  for (const o of h.orbs) {
    if (o.x < l || o.x > r || o.y < t || o.y > b) continue;
    if (o.kind === "fruit") {
      ctx.fillStyle = "#ff6b8a"; ctx.fillRect(o.x - 3, o.y - 3, 6, 6);
      ctx.fillStyle = "#7dff8a"; ctx.fillRect(o.x - 1, o.y - 5, 2, 2);
    } else {
      const big = o.v >= 3, s = big ? 4 : o.v >= 2 ? 3 : 2;
      ctx.fillStyle = big ? "#ffe066" : o.v >= 2 ? "#7fd8ff" : "#b07dff";
      ctx.fillRect(o.x - s / 2, o.y - s / 2 + Math.sin(time * 5 + o.x) * 0.8, s, s);
    }
  }
  // 妖獸
  for (const e of h.enemies) {
    if (e.x < l - 20 || e.x > r + 20 || e.y < t - 20 || e.y > b + 20) continue;
    const bt = BEASTS[e.type], img = bt.img(), sc = bt.big ? 2 : 1;
    ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.beginPath(); ctx.ellipse(e.x, e.y + bt.r * 0.8, bt.r, bt.r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(Math.round(e.x), Math.round(e.y + Math.sin(time * 8 + e.x) * 0.6));
    if (e.x > h.x && e.type === "wolf") ctx.scale(-1, 1);
    ctx.drawImage(img, -img.width * sc / 2, -img.height * sc / 2, img.width * sc, img.height * sc);
    if (e.flash > 0) { ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.8; ctx.drawImage(img, -img.width * sc / 2, -img.height * sc / 2, img.width * sc, img.height * sc); }
    ctx.restore();
    if (bt.big || e.type === "golem") {
      ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(e.x - 12, e.y - bt.r - 8, 24, 3);
      ctx.fillStyle = "#ff6a3a"; ctx.fillRect(e.x - 12, e.y - bt.r - 8, 24 * Math.max(0, e.hp / e.max), 3);
    }
  }
  // 修士
  if (state !== "huntFail") {
    if (h.iframe <= 0 || Math.floor(time * 20) % 2) {
      ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(h.x, h.y + 7, 6, 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(Math.round(h.x), Math.round(h.y)); if (h.flip) ctx.scale(-1, 1);
      ctx.drawImage(Math.floor(h.walk) % 2 ? HERO_WALK : HERO, -6, -9);
      ctx.restore();
    }
    for (const o of h.orbitPts || []) drawSword(o.x, o.y, o.a, 8);
    if (B.pet) ctx.drawImage(B.pet === "fox" ? FOX : CRANE, Math.round(h.petX - 4), Math.round(h.petY - 4));
  }
  for (const bo of h.bolts) {
    if (bo.fox) { ctx.fillStyle = "#ff9d2e"; ctx.fillRect(bo.x - 2, bo.y - 2, 4, 4); }
    else drawSword(bo.x, bo.y, bo.a, 9);
  }
  drawFx();

  // 介面
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const bw = Math.min(W * 0.8, 420), bx = (W - bw) / 2;
  ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(bx - 3, 10, bw + 6, 12);
  ctx.fillStyle = "#7fd8ff"; ctx.fillRect(bx, 13, bw * Math.min(1, h.exp / h.next), 6);
  ctx.font = "bold 13px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
  const left = Math.max(0, Math.ceil(HUNT.time - time));
  ctx.fillStyle = "#ffe0b0";
  ctx.fillText(`Lv.${h.lv}　斬妖 ${h.kills}　${h.bossCall ? "妖王現身！" : `妖王現身倒數 ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`}`, W / 2, 40);
  // 生命
  const hw2 = Math.min(W * 0.5, 220), hx = (W - hw2) / 2, hy = H - 34;
  ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(hx - 3, hy - 3, hw2 + 6, 14);
  ctx.fillStyle = h.hp / h.maxHp < 0.3 ? "#ff5a4a" : "#6fe07a"; ctx.fillRect(hx, hy, hw2 * (h.hp / h.maxHp), 8);
  ctx.fillStyle = "#fff"; ctx.font = "bold 11px 'Noto Sans TC', sans-serif";
  ctx.fillText(`生命 ${Math.ceil(h.hp)} / ${h.maxHp}`, W / 2, hy - 7);
  if (time < 4 && viewState() === "hunt") {
    ctx.globalAlpha = Math.min(1, (4 - time) * 2);
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px 'Noto Sans TC', sans-serif";
    ctx.fillText("拖曳畫面（或 WASD）移動，飛劍會自動攻擊", W / 2, H * 0.7);
    ctx.fillText("撿紫色妖丹升級，撐到妖王現身！", W / 2, H * 0.7 + 22);
    ctx.globalAlpha = 1;
  }
  if (stick.id !== null) {
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(stick.ox, stick.oy, 50, 0, Math.PI * 2); ctx.stroke();
    const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = Math.hypot(dx, dy), kk = d > 50 ? 50 / d : 1;
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.arc(stick.ox + dx * kk, stick.oy + dy * kk, 22, 0, Math.PI * 2); ctx.fill();
  }
  if (flashT > 0) { ctx.fillStyle = `rgba(${flashColor},${Math.min(0.5, flashT * 2.5)})`; ctx.fillRect(0, 0, W, H); }
}
