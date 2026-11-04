// 暗焰魔像討伐戰（原型 v0.1）
// 俯視像素風單人打王：玩家（藍披風劍士）對上暗焰魔像。魔王攻擊前地上會出現紅色警示，躲開後趁空檔輸出。
// 全部用 canvas 畫，不需要任何外部檔案；之後換成正式美術只要替換 drawHero / drawBoss。
"use strict";

// ───────── 基本設定 ─────────
const ARENA = { w: 640, h: 420 }; // 競技場大小（世界座標，1 單位＝1 像素點）
const VIEW_H = 175; // 畫面高度大約看得到多少世界單位（越小越放大）
const cvs = document.getElementById("game");
const ctx = cvs.getContext("2d");
let W = 0, H = 0, SCALE = 3, DPR = 1;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  cvs.width = Math.round(W * DPR);
  cvs.height = Math.round(H * DPR);
  SCALE = Math.max(1.8, Math.min(H / VIEW_H, W / 240));
}
window.addEventListener("resize", resize);
resize();

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);

// ───────── 像素圖 ─────────
function sprite(rows, pal) {
  const c = document.createElement("canvas");
  c.width = rows[0].length;
  c.height = rows.length;
  const g = c.getContext("2d");
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); }
  }));
  return c;
}
const HERO_PAL = { k: "#1b1424", H: "#6b3f22", h: "#8f5a32", S: "#f4c9a0", e: "#1b1424", B: "#3c6fd1", b: "#2a4f9c", R: "#e8433a", L: "#3a2f4a", W: "#ffffff" };
const HERO = sprite([
  "....kkkk....",
  "...kHhhHk...",
  "..kHhHHhHk..",
  "..kHSSSSHk..",
  "..kSeSSeSk..",
  "..kSSSSSSk..",
  "...kRRRRk...",
  "..kBRRBBBk..",
  ".kSkBBBBkSk.",
  ".kkkbBBbkkk.",
  "...kBBBBk...",
  "...kLk.kLk..",
  "...kLk.kLk..",
  "...kk...kk..",
], HERO_PAL);
const HERO_WALK = sprite([
  "....kkkk....",
  "...kHhhHk...",
  "..kHhHHhHk..",
  "..kHSSSSHk..",
  "..kSeSSeSk..",
  "..kSSSSSSk..",
  "...kRRRRk...",
  "..kBRRBBBk..",
  ".kSkBBBBkSk.",
  ".kkkbBBbkkk.",
  "...kBBBBk...",
  "..kLk..kLk..",
  "..kLk...kk..",
  "..kk........",
], HERO_PAL);

// ───────── 輸入 ─────────
const keys = new Set();
const pressed = new Set(); // 這一幀剛按下
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
  if (!keys.has(k)) pressed.add(k);
  keys.add(k);
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());

// 虛擬搖桿：左半邊螢幕按住拖曳
const stick = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
cvs.addEventListener("pointerdown", (e) => {
  if (e.clientX < W * 0.55 && stick.id === null) {
    stick.id = e.pointerId;
    stick.ox = stick.x = e.clientX;
    stick.oy = stick.y = e.clientY;
    cvs.setPointerCapture(e.pointerId);
  }
});
cvs.addEventListener("pointermove", (e) => {
  if (e.pointerId === stick.id) { stick.x = e.clientX; stick.y = e.clientY; }
});
const endStick = (e) => { if (e.pointerId === stick.id) stick.id = null; };
cvs.addEventListener("pointerup", endStick);
cvs.addEventListener("pointercancel", endStick);

// 技能按鈕
const pad = document.getElementById("pad");
const padAct = new Set();
pad.querySelectorAll(".btn").forEach((b) => {
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    padAct.add(b.dataset.act);
    b.classList.add("down");
  });
  const up = () => b.classList.remove("down");
  b.addEventListener("pointerup", up);
  b.addEventListener("pointerleave", up);
});
const act = (name, ...ks) => padAct.has(name) || ks.some((k) => pressed.has(k));

// ───────── 遊戲狀態 ─────────
let state = "title"; // title / play / win / lose
let player, boss, hazards, shots, particles, floaters, shake, time, stats, cam, slowmo;

const SKILLS = {
  attack: { cd: 0.32 },
  spin: { cd: 6 },
  roll: { cd: 1.1 },
  potion: { cd: 1 },
};

function reset() {
  player = { x: ARENA.w / 2, y: ARENA.h - 70, r: 6, hp: 120, maxHp: 120, speed: 95, face: -Math.PI / 2, flip: false,
    cds: { attack: 0, spin: 0, roll: 0, potion: 0 }, potions: 3, roll: 0, rollDir: 0, iframe: 0, hurt: 0, swing: 0, spinT: 0, walk: 0 };
  boss = { x: ARENA.w / 2, y: 120, r: 22, hp: 1600, maxHp: 1600, phase: 1, state: "idle", t: 1.6, flash: 0, dashV: null, pattern: 0, rage: false, stagger: 0 };
  hazards = [];
  shots = [];
  particles = [];
  floaters = [];
  shake = 0;
  time = 0;
  slowmo = 0;
  stats = { taken: 0, dealt: 0, crits: 0 };
  cam = { x: player.x, y: player.y };
}

// ───────── 戰鬥共用 ─────────
function burst(x, y, color, n = 10, spd = 60, life = 0.5) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), s = rand(spd * 0.3, spd);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(life * 0.5, life), max: life, color, size: rand(1, 2.5) });
  }
}
function floatText(x, y, text, color, big = false) {
  floaters.push({ x: x + rand(-6, 6), y, text, color, life: 0.9, big });
}
function hurtPlayer(dmg, from) {
  if (player.iframe > 0 || state !== "play") return;
  player.hp = Math.max(0, player.hp - dmg);
  stats.taken += dmg;
  player.iframe = 0.7;
  player.hurt = 0.25;
  shake = Math.max(shake, 6);
  floatText(player.x, player.y - 14, `-${dmg}`, "#ff6b6b");
  burst(player.x, player.y, "#ff6b6b", 8, 50);
  if (from) {
    const a = angTo(from, player);
    player.x += Math.cos(a) * 14;
    player.y += Math.sin(a) * 14;
  }
  if (player.hp <= 0) end(false);
}
function hitBoss(base, x, y) {
  if (state !== "play") return;
  const crit = Math.random() < 0.15;
  const dmg = Math.round(base * rand(0.9, 1.15) * (crit ? 2 : 1));
  boss.hp = Math.max(0, boss.hp - dmg);
  boss.flash = 0.1;
  stats.dealt += dmg;
  if (crit) stats.crits++;
  floatText(x, y - 10, crit ? `${dmg}!` : `${dmg}`, crit ? "#ffd84a" : "#ffffff", crit);
  burst(x, y, crit ? "#ffd84a" : "#ffb070", crit ? 14 : 8, crit ? 90 : 60);
  shake = Math.max(shake, crit ? 4 : 2);
  if (boss.phase === 1 && boss.hp <= boss.maxHp * 0.5) enterPhase2();
  if (boss.hp <= 0) end(true);
}
function enterPhase2() {
  boss.phase = 2;
  boss.state = "roar";
  boss.t = 1.4;
  hazards = [];
  shots = [];
  shake = 10;
  floatText(boss.x, boss.y - 40, "魔像暴走了！", "#ff8a3d", true);
}

// ───────── 玩家 ─────────
function updatePlayer(dt) {
  const p = player;
  for (const k in p.cds) p.cds[k] = Math.max(0, p.cds[k] - dt);
  p.iframe = Math.max(0, p.iframe - dt);
  p.hurt = Math.max(0, p.hurt - dt);
  p.swing = Math.max(0, p.swing - dt);
  p.spinT = Math.max(0, p.spinT - dt);

  // 移動方向
  let mx = 0, my = 0;
  if (keys.has("a") || keys.has("arrowleft")) mx -= 1;
  if (keys.has("d") || keys.has("arrowright")) mx += 1;
  if (keys.has("w") || keys.has("arrowup")) my -= 1;
  if (keys.has("s") || keys.has("arrowdown")) my += 1;
  if (stick.id !== null) {
    const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = Math.hypot(dx, dy);
    if (d > 8) { mx = dx / Math.max(d, 50); my = dy / Math.max(d, 50); }
  }
  const mlen = Math.hypot(mx, my);
  if (mlen > 1) { mx /= mlen; my /= mlen; }
  if (mlen > 0.1) p.face = Math.atan2(my, mx);

  if (p.roll > 0) {
    p.roll -= dt;
    p.x += Math.cos(p.rollDir) * 260 * dt;
    p.y += Math.sin(p.rollDir) * 260 * dt;
    if (Math.random() < 0.6) particles.push({ x: p.x, y: p.y + 5, vx: 0, vy: -10, life: 0.3, max: 0.3, color: "#8fa7ff", size: 2 });
  } else {
    const slow = p.swing > 0 ? 0.55 : 1;
    p.x += mx * p.speed * slow * dt;
    p.y += my * p.speed * slow * dt;
    if (mlen > 0.1) p.walk += dt * 10;
  }
  p.x = clamp(p.x, 16, ARENA.w - 16);
  p.y = clamp(p.y, 20, ARENA.h - 12);
  if (Math.cos(p.face) < -0.2) p.flip = true;
  else if (Math.cos(p.face) > 0.2) p.flip = false;

  // 攻擊時自動轉向魔王（手機比較好打）
  const aim = () => { if (dist(p, boss) < 90) p.face = angTo(p, boss); };

  if (act("attack", "j", "z") && p.cds.attack <= 0 && p.roll <= 0) {
    aim();
    p.cds.attack = SKILLS.attack.cd;
    p.swing = 0.18;
    const reach = 30 + boss.r;
    const d = dist(p, boss);
    let diff = Math.abs(((angTo(p, boss) - p.face + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    if (d < reach && (diff < 1.0 || d < boss.r + 8)) hitBoss(22, boss.x + Math.cos(angTo(boss, p)) * boss.r, boss.y + Math.sin(angTo(boss, p)) * boss.r);
  }
  if (act("spin", "k", "x") && p.cds.spin <= 0 && p.roll <= 0) {
    p.cds.spin = SKILLS.spin.cd;
    p.spinT = 0.4;
    p.iframe = Math.max(p.iframe, 0.35);
    burst(p.x, p.y, "#9fd0ff", 20, 110, 0.4);
    if (dist(p, boss) < 46 + boss.r) hitBoss(60, boss.x, boss.y);
    shots = shots.filter((s) => dist(s, p) > 50); // 旋風斬可以掃掉附近的火球
  }
  if (act("roll", " ", "l", "shift") && p.cds.roll <= 0 && p.roll <= 0) {
    p.cds.roll = SKILLS.roll.cd;
    p.roll = 0.26;
    p.rollDir = mlen > 0.1 ? Math.atan2(my, mx) : p.face;
    p.iframe = Math.max(p.iframe, 0.32);
  }
  if (act("potion", "h", "c") && p.cds.potion <= 0 && p.potions > 0 && p.hp < p.maxHp) {
    p.cds.potion = SKILLS.potion.cd;
    p.potions--;
    const heal = Math.min(45, p.maxHp - p.hp);
    p.hp += heal;
    floatText(p.x, p.y - 16, `+${heal}`, "#7dff8a");
    burst(p.x, p.y, "#7dff8a", 12, 40);
  }
}

// ───────── 魔王 ─────────
const PATTERNS_1 = ["slam", "fireballs", "charge", "slam", "fireballs"];
const PATTERNS_2 = ["slam", "nova", "charge", "fireballs", "meteor", "charge", "nova"];

function nextAttack() {
  const list = boss.phase === 1 ? PATTERNS_1 : PATTERNS_2;
  const name = list[boss.pattern % list.length];
  boss.pattern++;
  const p2 = boss.phase === 2;
  if (name === "slam") {
    // 在玩家腳下和周圍砸出火焰圈
    const n = p2 ? 5 : 3;
    for (let i = 0; i < n; i++) {
      const off = i === 0 ? 0 : 38;
      const a = (i / (n - 1 || 1)) * Math.PI * 2;
      hazards.push({ type: "circle", x: player.x + Math.cos(a) * off, y: player.y + Math.sin(a) * off, r: 26, warn: p2 ? 0.75 : 0.95, life: 0.25, dmg: 22, delay: i * 0.08 });
    }
    boss.state = "cast"; boss.t = 1.3;
  } else if (name === "fireballs") {
    boss.state = "cast"; boss.t = 1.2;
    const count = p2 ? 9 : 5;
    const base = angTo(boss, player);
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * (p2 ? 0.2 : 0.26);
      shots.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * (p2 ? 125 : 105), vy: Math.sin(a) * (p2 ? 125 : 105), r: 5, dmg: 14, life: 5, delay: 0.35 });
    }
  } else if (name === "charge") {
    const a = angTo(boss, player);
    hazards.push({ type: "line", x: boss.x, y: boss.y, a, len: 300, w: boss.r * 2 + 6, warn: p2 ? 0.7 : 0.9, life: 0.01, dmg: 0, delay: 0 });
    boss.state = "windup"; boss.t = p2 ? 0.7 : 0.9; boss.dashA = a;
  } else if (name === "nova") {
    boss.state = "cast"; boss.t = 1.6;
    for (let ring = 0; ring < 2; ring++) {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + ring * (Math.PI / 16);
        shots.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * 95, vy: Math.sin(a) * 95, r: 5, dmg: 12, life: 5, delay: 0.5 + ring * 0.55 });
      }
    }
  } else if (name === "meteor") {
    boss.state = "cast"; boss.t = 2.0;
    for (let i = 0; i < 10; i++) {
      hazards.push({ type: "circle", x: rand(40, ARENA.w - 40), y: rand(50, ARENA.h - 30), r: 30, warn: 1.0, life: 0.25, dmg: 20, delay: i * 0.12 });
    }
    hazards.push({ type: "circle", x: player.x, y: player.y, r: 30, warn: 1.0, life: 0.25, dmg: 20, delay: 0.6 });
  }
}

function updateBoss(dt) {
  const b = boss;
  b.flash = Math.max(0, b.flash - dt);
  b.t -= dt;
  const speed = b.phase === 2 ? 46 : 34;

  if (b.state === "idle") {
    // 慢慢走向玩家，保持一點距離
    const d = dist(b, player);
    if (d > 70) {
      const a = angTo(b, player);
      b.x += Math.cos(a) * speed * dt;
      b.y += Math.sin(a) * speed * dt;
    }
    if (b.t <= 0) nextAttack();
  } else if (b.state === "windup") {
    if (b.t <= 0) { b.state = "dash"; b.t = 0.55; }
  } else if (b.state === "dash") {
    const v = b.phase === 2 ? 560 : 480;
    b.x += Math.cos(b.dashA) * v * dt;
    b.y += Math.sin(b.dashA) * v * dt;
    if (Math.random() < 0.8) burst(b.x, b.y + 10, "#ff7a2e", 2, 30, 0.35);
    if (dist(b, player) < b.r + player.r + 2) hurtPlayer(28, b);
    const hitWall = b.x < b.r + 8 || b.x > ARENA.w - b.r - 8 || b.y < b.r + 16 || b.y > ARENA.h - b.r - 4;
    if (b.t <= 0 || hitWall) {
      if (hitWall) {
        // 撞牆會暈一下，是輸出的好機會
        shake = 8;
        burst(b.x, b.y, "#c9a27a", 18, 90);
        b.state = "stun"; b.t = 1.6;
        floatText(b.x, b.y - 34, "暈眩！", "#9fd0ff", true);
      } else { b.state = "idle"; b.t = b.phase === 2 ? 0.8 : 1.2; }
    }
  } else if (b.state === "stun" || b.state === "cast" || b.state === "roar") {
    if (b.t <= 0) { b.state = "idle"; b.t = b.phase === 2 ? 0.7 : 1.1; }
  }
  b.x = clamp(b.x, b.r + 8, ARENA.w - b.r - 8);
  b.y = clamp(b.y, b.r + 16, ARENA.h - b.r - 4);

  // 碰到魔王身體也會受傷
  if (b.state !== "stun" && dist(b, player) < b.r + player.r - 2) hurtPlayer(10, b);
}

function updateHazards(dt) {
  for (const h of hazards) {
    if (h.delay > 0) { h.delay -= dt; continue; }
    if (h.warn > 0) {
      h.warn -= dt;
      if (h.warn <= 0) {
        if (h.type === "circle") {
          burst(h.x, h.y, "#ff7a2e", 16, 90, 0.5);
          shake = Math.max(shake, 4);
          if (Math.hypot(player.x - h.x, player.y - h.y) < h.r + player.r * 0.5) hurtPlayer(h.dmg, h);
        }
      }
    } else h.life -= dt;
  }
  hazards = hazards.filter((h) => h.delay > 0 || h.warn > 0 || h.life > 0);

  for (const s of shots) {
    if (s.delay > 0) { s.delay -= dt; s.x = boss.x; s.y = boss.y; continue; }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    if (Math.random() < 0.5) particles.push({ x: s.x, y: s.y, vx: 0, vy: 0, life: 0.25, max: 0.25, color: "#ff9d2e", size: 2 });
    if (Math.hypot(player.x - s.x, player.y - s.y) < s.r + player.r) { hurtPlayer(s.dmg, s); s.life = 0; }
  }
  shots = shots.filter((s) => s.life > 0 && s.x > -20 && s.x < ARENA.w + 20 && s.y > -20 && s.y < ARENA.h + 20);
}

function updateFx(dt) {
  for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; p.life -= dt; }
  particles = particles.filter((p) => p.life > 0);
  for (const f of floaters) { f.y -= 26 * dt; f.life -= dt; }
  floaters = floaters.filter((f) => f.life > 0);
  shake = Math.max(0, shake - dt * 30);
}

// ───────── 結束 ─────────
const screenEl = document.getElementById("screen");
function end(win) {
  state = win ? "win" : "lose";
  slowmo = 1.2;
  if (win) { burst(boss.x, boss.y, "#ffd84a", 60, 160, 1.2); burst(boss.x, boss.y, "#ff7a2e", 60, 120, 1.2); shake = 14; }
  setTimeout(() => showEnd(win), 1300);
}
function showEnd(win) {
  pad.classList.add("hidden");
  const t = time.toFixed(1);
  let rank = "C";
  if (win) {
    const score = stats.taken + time * 0.8;
    rank = score < 60 ? "S" : score < 110 ? "A" : score < 170 ? "B" : "C";
  }
  screenEl.innerHTML = `<div class="panel">
    <h1>${win ? "討伐成功！" : "討伐失敗…"}</h1>
    <div class="result">
      ${win ? `評價<br><span class="rank">${rank}</span><br>` : `魔像剩下 ${Math.ceil((boss.hp / boss.maxHp) * 100)}% 血量<br>`}
      時間 ${t} 秒　受到傷害 ${stats.taken}　造成傷害 ${stats.dealt}　爆擊 ${stats.crits} 次
    </div>
    <button id="again" class="big">${win ? "再打一次" : "再挑戰"}</button>
  </div>`;
  screenEl.classList.remove("hidden");
  document.getElementById("again").onclick = start;
}
function start() {
  reset();
  state = "play";
  screenEl.classList.add("hidden");
  pad.classList.remove("hidden");
}
document.getElementById("start").onclick = start;

// ───────── 繪圖 ─────────
const floorTile = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d");
  g.fillStyle = "#2a2233"; g.fillRect(0, 0, 32, 32);
  g.fillStyle = "#30283b"; g.fillRect(0, 0, 15, 15); g.fillRect(16, 16, 16, 16);
  g.fillStyle = "#221b2a"; g.fillRect(15, 0, 1, 32); g.fillRect(0, 15, 32, 1); g.fillRect(31, 0, 1, 32); g.fillRect(0, 31, 32, 1);
  g.fillStyle = "#3a3046"; g.fillRect(4, 5, 2, 1); g.fillRect(22, 24, 3, 1); g.fillRect(9, 20, 1, 2);
  return c;
})();

function drawArena() {
  for (let y = 0; y < ARENA.h; y += 32) for (let x = 0; x < ARENA.w; x += 32) ctx.drawImage(floorTile, x, y);
  // 牆與熔岩邊
  ctx.fillStyle = "#120d18";
  ctx.fillRect(-200, -200, ARENA.w + 400, 200);
  ctx.fillRect(-200, ARENA.h, ARENA.w + 400, 200);
  ctx.fillRect(-200, 0, 200, ARENA.h);
  ctx.fillRect(ARENA.w, 0, 200, ARENA.h);
  const glow = 0.5 + Math.sin(time * 2) * 0.15;
  ctx.fillStyle = `rgba(255,110,40,${glow})`;
  ctx.fillRect(0, 0, ARENA.w, 4); ctx.fillRect(0, ARENA.h - 3, ARENA.w, 3); ctx.fillRect(0, 0, 3, ARENA.h); ctx.fillRect(ARENA.w - 3, 0, 3, ARENA.h);
  // 柱子裝飾
  for (const [x, y] of [[40, 40], [ARENA.w - 40, 40], [40, ARENA.h - 30], [ARENA.w - 40, ARENA.h - 30]]) {
    ctx.fillStyle = "#4a3d58"; ctx.fillRect(x - 9, y - 22, 18, 26);
    ctx.fillStyle = "#5c4d6c"; ctx.fillRect(x - 9, y - 22, 18, 4);
    ctx.fillStyle = `rgba(255,140,60,${0.6 + Math.sin(time * 6 + x) * 0.3})`; ctx.fillRect(x - 3, y - 30, 6, 7);
    ctx.fillStyle = "#ffd27a"; ctx.fillRect(x - 1, y - 28, 2, 3);
  }
}

function drawHazards() {
  for (const h of hazards) {
    if (h.delay > 0) continue;
    if (h.type === "circle") {
      if (h.warn > 0) {
        const total = 1.0, k = 1 - Math.min(1, h.warn / total);
        ctx.fillStyle = "rgba(255,60,50,0.18)";
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,60,50,0.35)";
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r * k, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(255,90,70,0.9)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(255,170,60,${h.life * 3})`;
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.fill();
      }
    } else if (h.type === "line" && h.warn > 0) {
      ctx.save();
      ctx.translate(h.x, h.y); ctx.rotate(h.a);
      ctx.fillStyle = "rgba(255,60,50,0.22)"; ctx.fillRect(0, -h.w / 2, h.len, h.w);
      ctx.strokeStyle = "rgba(255,90,70,0.9)"; ctx.lineWidth = 1; ctx.strokeRect(0, -h.w / 2, h.len, h.w);
      ctx.fillStyle = "rgba(255,90,70,0.8)";
      for (let i = 0; i < 4; i++) { // 箭頭
        const x = 40 + i * 60 + ((time * 120) % 60);
        ctx.beginPath(); ctx.moveTo(x, -6); ctx.lineTo(x + 8, 0); ctx.lineTo(x, 6); ctx.fill();
      }
      ctx.restore();
    }
  }
}

function drawBoss() {
  const b = boss;
  const bob = b.state === "stun" ? 0 : Math.sin(time * 3) * 1.5;
  const x = Math.round(b.x), y = Math.round(b.y + bob);
  // 影子
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath(); ctx.ellipse(b.x, b.y + b.r - 2, b.r * 0.95, 6, 0, 0, Math.PI * 2); ctx.fill();
  const rock = b.flash > 0 ? "#ffffff" : b.phase === 2 ? "#5a3a3a" : "#4b4250";
  const rockHi = b.flash > 0 ? "#ffffff" : b.phase === 2 ? "#7a4a42" : "#625868";
  const lava = b.phase === 2 ? "#ff4a1e" : "#ff8a2e";
  // 手臂
  const armSwing = b.state === "cast" ? Math.sin(time * 14) * 4 : Math.sin(time * 3) * 2;
  ctx.fillStyle = rock;
  ctx.fillRect(x - 32, y - 6 + armSwing, 12, 22);
  ctx.fillRect(x + 20, y - 6 - armSwing, 12, 22);
  ctx.fillStyle = rockHi;
  ctx.fillRect(x - 32, y - 6 + armSwing, 12, 4);
  ctx.fillRect(x + 20, y - 6 - armSwing, 12, 4);
  // 身體
  ctx.fillStyle = rock;
  ctx.fillRect(x - 20, y - 22, 40, 40);
  ctx.fillRect(x - 16, y - 28, 32, 8);
  ctx.fillRect(x - 16, y + 18, 12, 6);
  ctx.fillRect(x + 4, y + 18, 12, 6);
  ctx.fillStyle = rockHi;
  ctx.fillRect(x - 16, y - 28, 32, 3);
  ctx.fillRect(x - 20, y - 22, 3, 40);
  // 熔岩裂縫
  const pulse = 0.6 + Math.sin(time * (b.phase === 2 ? 9 : 5)) * 0.4;
  ctx.globalAlpha = b.flash > 0 ? 0 : pulse;
  ctx.fillStyle = lava;
  ctx.fillRect(x - 6, y - 4, 2, 14); ctx.fillRect(x - 4, y + 8, 8, 2); ctx.fillRect(x + 6, y - 10, 2, 10);
  ctx.fillRect(x - 14, y + 2, 6, 2); ctx.fillRect(x + 10, y + 6, 6, 2);
  ctx.globalAlpha = 1;
  // 眼睛
  ctx.fillStyle = b.state === "stun" ? "#9fd0ff" : b.phase === 2 ? "#ff2a1a" : "#ffd23a";
  if (b.state === "stun") { ctx.fillRect(x - 11, y - 16, 6, 2); ctx.fillRect(x + 5, y - 16, 6, 2); }
  else { ctx.fillRect(x - 11, y - 18, 6, 5); ctx.fillRect(x + 5, y - 18, 6, 5); ctx.fillStyle = "#fff6c0"; ctx.fillRect(x - 9, y - 17, 2, 2); ctx.fillRect(x + 7, y - 17, 2, 2); }
  // 頭上的火焰
  for (let i = 0; i < 3; i++) {
    const fx = x - 8 + i * 8, fh = 6 + Math.sin(time * 10 + i * 2) * 3;
    ctx.fillStyle = lava; ctx.fillRect(fx, y - 28 - fh, 4, fh);
    ctx.fillStyle = "#ffd27a"; ctx.fillRect(fx + 1, y - 28 - fh * 0.6, 2, fh * 0.6);
  }
  if (b.state === "stun") {
    for (let i = 0; i < 3; i++) {
      const a = time * 4 + (i * Math.PI * 2) / 3;
      ctx.fillStyle = "#ffe066"; ctx.fillRect(x + Math.cos(a) * 16 - 1, y - 38 + Math.sin(a) * 4, 3, 3);
    }
  }
  if (b.state === "windup") {
    ctx.fillStyle = `rgba(255,80,40,${0.3 + Math.sin(time * 30) * 0.2})`;
    ctx.fillRect(x - 34, y - 30, 68, 56);
  }
}

function drawPlayer() {
  const p = player;
  // 影子
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 7, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  if (p.iframe > 0 && p.roll <= 0 && p.spinT <= 0 && Math.floor(time * 20) % 2 === 0) return; // 無敵時閃爍
  const img = Math.floor(p.walk) % 2 === 0 ? HERO : HERO_WALK;
  ctx.save();
  ctx.translate(Math.round(p.x), Math.round(p.y));
  if (p.roll > 0) ctx.rotate((1 - p.roll / 0.26) * Math.PI * 2 * (p.flip ? -1 : 1));
  if (p.flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -6, -9);
  if (p.hurt > 0) { ctx.globalCompositeOperation = "source-atop"; ctx.fillStyle = "rgba(255,80,80,0.6)"; ctx.fillRect(-6, -9, 12, 14); }
  ctx.restore();

  // 劍
  if (p.roll <= 0) {
    ctx.save();
    ctx.translate(p.x, p.y);
    let a = p.face;
    if (p.swing > 0) a = p.face - 1.1 + (1 - p.swing / 0.18) * 2.2;
    if (p.spinT > 0) a = p.face + (1 - p.spinT / 0.4) * Math.PI * 4;
    ctx.rotate(a);
    ctx.fillStyle = "#6b4a2a"; ctx.fillRect(3, -1, 3, 2);
    ctx.fillStyle = "#d9e4f2"; ctx.fillRect(6, -1, p.swing > 0 || p.spinT > 0 ? 14 : 10, 2);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(6, -1, p.swing > 0 || p.spinT > 0 ? 14 : 10, 1);
    ctx.restore();
  }
  // 揮劍弧光
  if (p.swing > 0) {
    ctx.strokeStyle = `rgba(255,255,255,${p.swing * 4})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y, 22, p.face - 1.1, p.face - 1.1 + (1 - p.swing / 0.18) * 2.2); ctx.stroke();
  }
  if (p.spinT > 0) {
    ctx.strokeStyle = `rgba(160,210,255,${p.spinT * 2})`;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(p.x, p.y, 46 * (1 - p.spinT / 0.4) + 10, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawShots() {
  for (const s of shots) {
    if (s.delay > 0) continue;
    ctx.fillStyle = "#ff5a1e"; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffd27a"; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawFx() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  for (const f of floaters) {
    ctx.globalAlpha = Math.min(1, f.life * 2);
    ctx.font = `bold ${f.big ? 12 : 9}px "Noto Sans TC", sans-serif`;
    ctx.fillStyle = "#1b1424"; ctx.fillText(f.text, f.x + 1, f.y + 1);
    ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

// 畫面上的介面（不跟鏡頭移動）
function drawHud() {
  const s = DPR;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  // 魔王血條
  const bw = Math.min(W * 0.7, 520), bx = (W - bw) / 2, by = 14;
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(bx - 3, by - 3, bw + 6, 20);
  ctx.fillStyle = "#3a1a1a"; ctx.fillRect(bx, by, bw, 14);
  ctx.fillStyle = boss.phase === 2 ? "#ff3a2a" : "#ff8a2e"; ctx.fillRect(bx, by, bw * (boss.hp / boss.maxHp), 14);
  ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.fillRect(bx, by, bw * (boss.hp / boss.maxHp), 4);
  ctx.fillStyle = "#fff"; ctx.fillRect(bx + bw / 2 - 1, by, 2, 14); // 50% 標記（第二階段）
  ctx.font = "bold 13px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
  ctx.fillStyle = "#1b1424"; ctx.fillText(`暗焰魔像 ${boss.phase === 2 ? "【暴走】" : ""}  ${boss.hp} / ${boss.maxHp}`, W / 2 + 1, by + 32);
  ctx.fillStyle = "#ffe0b0"; ctx.fillText(`暗焰魔像 ${boss.phase === 2 ? "【暴走】" : ""}  ${boss.hp} / ${boss.maxHp}`, W / 2, by + 31);

  // 玩家血條（左上）
  const px = 14, py = H - 46;
  const pw = Math.min(220, W * 0.38);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(px - 3, py - 3, pw + 6, 18);
  ctx.fillStyle = "#1e3a22"; ctx.fillRect(px, py, pw, 12);
  ctx.fillStyle = player.hp / player.maxHp < 0.3 ? "#ff5a4a" : "#5fdc6a"; ctx.fillRect(px, py, pw * (player.hp / player.maxHp), 12);
  ctx.font = "bold 12px 'Noto Sans TC', sans-serif";
  ctx.fillStyle = "#fff"; ctx.fillText(`劍士 HP ${player.hp}/${player.maxHp}　藥水 ×${player.potions}`, px, py - 8);
  ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fillText(`${time.toFixed(1)} 秒`, px, py + 30);

  // 搖桿
  if (stick.id !== null) {
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(stick.ox, stick.oy, 50, 0, Math.PI * 2); ctx.stroke();
    const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = Math.hypot(dx, dy), k = d > 50 ? 50 / d : 1;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath(); ctx.arc(stick.ox + dx * k, stick.oy + dy * k, 22, 0, Math.PI * 2); ctx.fill();
  }

  // 技能冷卻（按鈕上的黑色遮罩）
  for (const name of ["spin", "roll", "potion"]) {
    const el = pad.querySelector(`[data-act="${name}"] .cd`);
    if (el) el.style.transform = `scaleY(${player.cds[name] / SKILLS[name].cd})`;
  }
  const cnt = pad.querySelector(".count");
  if (cnt) cnt.textContent = player.potions;
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#120d18";
  ctx.fillRect(0, 0, cvs.width, cvs.height);
  if (!player) return;
  // 鏡頭跟著玩家，稍微往魔王方向偏
  const tx = player.x * 0.75 + boss.x * 0.25, ty = player.y * 0.75 + boss.y * 0.25;
  cam.x += (tx - cam.x) * 0.1;
  cam.y += (ty - cam.y) * 0.1;
  const k = SCALE * DPR;
  const sx = shake > 0 ? rand(-shake, shake) : 0, sy = shake > 0 ? rand(-shake, shake) : 0;
  ctx.setTransform(k, 0, 0, k, Math.round(W * DPR / 2 - cam.x * k + sx), Math.round(H * DPR / 2 - cam.y * k + sy));
  ctx.imageSmoothingEnabled = false;
  drawArena();
  drawHazards();
  // 依 y 排序：誰在下面誰後畫
  if (player.y < boss.y) { drawPlayer(); if (state !== "win" || slowmo > 0.6) drawBoss(); }
  else { if (state !== "win" || slowmo > 0.6) drawBoss(); drawPlayer(); }
  drawShots();
  drawFx();
  drawHud();
}

// ───────── 主迴圈 ─────────
let last = performance.now();
function frame(now) {
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state === "play") {
    time += dt;
    updatePlayer(dt);
    updateBoss(dt);
    updateHazards(dt);
  } else if (slowmo > 0) {
    slowmo -= dt;
    dt *= 0.3;
  }
  updateFx(dt);
  render();
  pressed.clear();
  padAct.clear();
  requestAnimationFrame(frame);
}

// 標題畫面背景先放一場示範
reset();
const params = new URLSearchParams(location.search);
if (params.has("demo")) {
  start();
  // 測試用：?demo&sim=秒數 先快轉（玩家會自動繞著魔王走、偶爾攻擊）
  const sim = Number(params.get("sim") || 0);
  for (let t = 0; t < sim && state === "play"; t += 1 / 60) {
    const a = time * 0.8;
    keys.clear();
    if (Math.cos(a) > 0.3) keys.add("d"); else if (Math.cos(a) < -0.3) keys.add("a");
    if (Math.sin(a) > 0.3) keys.add("s"); else if (Math.sin(a) < -0.3) keys.add("w");
    if (Math.random() < 0.08) pressed.add("j");
    time += 1 / 60;
    updatePlayer(1 / 60); updateBoss(1 / 60); updateHazards(1 / 60); updateFx(1 / 60);
    pressed.clear();
  }
  keys.clear();
}
requestAnimationFrame(frame);
