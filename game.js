// 御劍渡劫（原型 v0.3，名稱暫定）
// 前半段「御劍跑酷」：修士往前飛，左右選門（+N、×2、−N、÷2）累積飛劍，閃開妖群。
// 後半段打王：俯視像素風，修士對上焚天石魔；累積的飛劍會自動射向魔王。魔王攻擊前地上會出現紅色警示。
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
const HERO_PAL = { k: "#1b1424", H: "#2b2433", h: "#4a3f5c", S: "#f4c9a0", e: "#1b1424", W: "#eef2fa", w: "#a9bcd8", B: "#3c8fd1", L: "#3a2f4a" };
const HERO_TOP = [
  "....kkkk....",
  "...kHhhHk...",
  "....kHHk....",
  "..kHHhhHHk..",
  "..kHSSSSHk..",
  "..kSeSSeSk..",
  "..kSSSSSSk..",
  "..kWWBBWWk..",
  ".kWWWBBWWWk.",
  ".kSkwWWwkSk.",
  ".kkkBBBBkkk.",
  "...kWWWWk...",
];
const HERO = sprite([...HERO_TOP, "...kwk.kwk..", "...kk...kk.."], HERO_PAL);
const HERO_WALK = sprite([...HERO_TOP, "..kwk..kwk..", "..kk.....k.."], HERO_PAL);

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
let state = "title"; // title / run / runEnd / runFail / intro / play / win / lose
let player, boss, hazards, shots, pshots, particles, floaters, shake, time, stats, cam, slowmo;
let hitstop = 0, combo = 0, comboT = 0, comboPop = 0, flashT = 0, flashColor = "255,255,255", introT = 0, ultFx = 0, ultA = 0, embers = [], cracks = [];

const SKILLS = {
  attack: { cd: 0.32 },
  spin: { cd: 6 },
  roll: { cd: 1.1 },
  potion: { cd: 1 },
};
const ULT_MAX = 100;

function reset() {
  player = { x: ARENA.w / 2, y: ARENA.h - 70, r: 6, hp: 120, maxHp: 120, speed: 95, face: -Math.PI / 2, flip: false,
    cds: { attack: 0, spin: 0, roll: 0, potion: 0 }, potions: 3, ult: 0, roll: 0, rollDir: 0, iframe: 0, hurt: 0, swing: 0, spinT: 0, walk: 0,
    swords: 0, volT: 1.5 };
  boss = { x: ARENA.w / 2, y: 120, r: 22, hp: 1600, maxHp: 1600, phase: 1, state: "idle", t: 1.6, flash: 0, dashV: null, pattern: 0, rage: false, stagger: 0 };
  hazards = [];
  shots = [];
  pshots = [];
  particles = [];
  floaters = [];
  shake = 0;
  time = 0;
  slowmo = 0;
  stats = { taken: 0, dealt: 0, crits: 0 };
  cam = { x: boss.x, y: boss.y, zoom: 1 };
  hitstop = 0; combo = 0; comboT = 0; flashT = 0; ultFx = 0; embers = [];
  // 地板上的熔岩裂縫（每場隨機）
  cracks = [];
  for (let i = 0; i < 16; i++) {
    let x = rand(30, ARENA.w - 30), y = rand(40, ARENA.h - 30), a = rand(0, Math.PI * 2);
    const pts = [[x, y]];
    for (let j = 0; j < 5 + Math.floor(rand(0, 4)); j++) {
      a += rand(-0.8, 0.8);
      x += Math.cos(a) * rand(8, 18); y += Math.sin(a) * rand(8, 18);
      pts.push([x, y]);
    }
    cracks.push({ pts, phase: rand(0, 6) });
  }
}

// ───────── 戰鬥共用 ─────────
function burst(x, y, color, n = 10, spd = 60, life = 0.5) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), s = rand(spd * 0.3, spd);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(life * 0.5, life), max: life, color, size: rand(1, 2.5) });
  }
}
function floatText(x, y, text, color, big = false) {
  floaters.push({ x: x + rand(-6, 6), y, text, color, life: 0.9, big, age: 0 });
}
function hurtPlayer(dmg, from) {
  if (player.iframe > 0 || state !== "play") return;
  player.hp = Math.max(0, player.hp - dmg);
  stats.taken += dmg;
  player.iframe = 0.7;
  player.hurt = 0.25;
  combo = 0;
  flashT = 0.12; flashColor = "255,40,40";
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
function hitBoss(base, x, y, quiet = false) {
  if (state !== "play") return;
  const crit = !quiet && Math.random() < 0.15;
  const dmg = Math.max(1, Math.round(base * rand(0.9, 1.15) * (crit ? 2 : 1)));
  boss.hp = Math.max(0, boss.hp - dmg);
  boss.flash = 0.1;
  stats.dealt += dmg;
  if (crit) stats.crits++;
  if (quiet) {
    player.ult = Math.min(ULT_MAX, player.ult + dmg / 16);
    burst(x, y, "#9fe8ff", 4, 50);
    if (boss.phase === 1 && boss.hp <= boss.maxHp * 0.5) enterPhase2();
    if (boss.hp <= 0) end(true);
    return;
  }
  floatText(x, y - 10, crit ? `${dmg}!` : `${dmg}`, crit ? "#ffd84a" : "#ffffff", crit);
  hitstop = Math.max(hitstop, crit ? 0.07 : 0.035);
  combo++; comboT = 2.2; comboPop = 1;
  player.ult = Math.min(ULT_MAX, player.ult + dmg / (crit ? 7 : 9));
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
  shake = 12;
  flashT = 0.3; flashColor = "255,90,40";
  slowmo = 0.6;
  floatText(boss.x, boss.y - 40, "石魔暴走了！", "#ff8a3d", true);
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
  if (act("ult", "u", "i") && p.ult >= ULT_MAX && p.roll <= 0) {
    p.ult = 0;
    ultFx = 0.7;
    ultA = angTo(p, boss);
    p.iframe = Math.max(p.iframe, 0.8);
    flashT = 0.35; flashColor = "255,250,220";
    hitstop = 0.18;
    shake = 16;
    burst(boss.x, boss.y, "#fff6c0", 40, 180, 0.8);
    burst(boss.x, boss.y, "#ffd84a", 30, 140, 0.8);
    floatText(p.x, p.y - 24, "御劍・天罰！", "#fff6c0", true);
    hitBoss(260, boss.x, boss.y);
  }
  if (act("potion", "h", "c") && p.cds.potion <= 0 && p.potions > 0 && p.hp < p.maxHp) {
    p.cds.potion = SKILLS.potion.cd;
    p.potions--;
    const heal = Math.min(45, p.maxHp - p.hp);
    p.hp += heal;
    floatText(p.x, p.y - 16, `+${heal}`, "#7dff8a");
    burst(p.x, p.y, "#7dff8a", 12, 40);
  }

  // 跑酷累積的飛劍：每隔一段時間自動齊射魔王，飛劍越多傷害越高
  if (p.swords > 0) {
    p.volT -= dt;
    if (p.volT <= 0) {
      p.volT = 2.2;
      const n = Math.min(p.swords, 12);
      const total = 8 + Math.min(p.swords, 400) * 0.6;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + time * 2;
        pshots.push({ x: p.x + Math.cos(a) * 14, y: p.y + Math.sin(a) * 10 - 4, delay: i * 0.05, dmg: total / n, vx: 0, vy: 0, last: i === n - 1 ? Math.round(total) : 0 });
      }
    }
  }
}

function updateSwords(dt) {
  for (const s of pshots) {
    if (s.delay > 0) { s.delay -= dt; continue; }
    const a = angTo(s, boss), sp = 300;
    s.vx += (Math.cos(a) * sp - s.vx) * Math.min(1, dt * 10);
    s.vy += (Math.sin(a) * sp - s.vy) * Math.min(1, dt * 10);
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (dist(s, boss) < boss.r) {
      s.done = true;
      if (s.last) floatText(boss.x, boss.y - 30, `飛劍 ${s.last}`, "#9fe8ff", true); // 一輪齊射只顯示一次總傷害
      hitBoss(s.dmg, s.x, s.y, true);
    }
  }
  pshots = pshots.filter((s) => !s.done);
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
  for (const f of floaters) f.age += dt;
  comboPop = Math.max(0, comboPop - dt * 5);
  if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 0; }
  flashT = Math.max(0, flashT - dt);
  ultFx = Math.max(0, ultFx - dt);
  // 往上飄的火星
  const rate = boss && boss.phase === 2 ? 40 : 22;
  for (let i = 0; i < rate * dt; i++) embers.push({ x: rand(0, ARENA.w), y: rand(20, ARENA.h + 10), vx: rand(-6, 6), vy: rand(-28, -12), life: rand(1.5, 3), max: 3, s: Math.random() < 0.3 ? 2 : 1 });
  if (Math.random() < rate * dt - Math.floor(rate * dt)) embers.push({ x: rand(0, ARENA.w), y: rand(20, ARENA.h + 10), vx: rand(-6, 6), vy: rand(-28, -12), life: rand(1.5, 3), max: 3, s: 1 });
  for (const e of embers) { e.x += (e.vx + Math.sin(time * 2 + e.y * 0.05) * 6) * dt; e.y += e.vy * dt; e.life -= dt; }
  embers = embers.filter((e) => e.life > 0);
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
    <h1>${win ? "渡劫成功！" : "渡劫失敗…"}</h1>
    <div class="result">
      ${win ? `評價<br><span class="rank">${rank}</span><br>` : `石魔剩下 ${Math.ceil((boss.hp / boss.maxHp) * 100)}% 血量<br>`}
      飛劍 ${player.swords} 把　時間 ${t} 秒<br>受到傷害 ${stats.taken}　造成傷害 ${stats.dealt}　爆擊 ${stats.crits} 次
    </div>
    <button id="again" class="big">${win ? "再修一次" : "再挑戰"}</button>
  </div>`;
  screenEl.classList.remove("hidden");
  document.getElementById("again").onclick = start;
}
function start() {
  resetRun();
  state = "run";
  screenEl.classList.add("hidden");
  pad.classList.add("hidden");
}
function startBoss(swords) {
  reset();
  player.swords = swords;
  state = "intro";
  introT = 2.8;
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
  // 熔岩裂縫
  for (const c of cracks) {
    const glow = 0.45 + Math.sin(time * 2.2 + c.phase) * 0.3 + (boss.phase === 2 ? 0.2 : 0);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#140c12"; ctx.lineWidth = 3.5;
    ctx.beginPath(); c.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    ctx.strokeStyle = `rgba(255,${boss.phase === 2 ? 70 : 120},40,${glow})`; ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  // 中央魔法陣
  const cx = ARENA.w / 2, cy = ARENA.h / 2 + 10;
  const runeCol = boss.phase === 2 ? "255,70,50" : "170,110,255";
  ctx.strokeStyle = `rgba(${runeCol},${0.25 + Math.sin(time * 1.5) * 0.08})`; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, 78, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 64, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = time * 0.25 + (i * Math.PI) / 3, b = a + (Math.PI * 2) / 3;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 64, cy + Math.sin(a) * 64); ctx.lineTo(cx + Math.cos(b) * 64, cy + Math.sin(b) * 64); ctx.stroke();
  }
  ctx.fillStyle = `rgba(${runeCol},0.45)`;
  for (let i = 0; i < 12; i++) { const a = -time * 0.4 + (i * Math.PI) / 6; ctx.fillRect(cx + Math.cos(a) * 71 - 1.5, cy + Math.sin(a) * 71 - 1.5, 3, 3); }
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
  if (p.swords > 0) drawOrbit(p.x, p.y, p.swords);
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

// 一把小飛劍（劍尖朝 a 方向）
function drawSword(x, y, a, len = 7) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(a);
  ctx.fillStyle = "#3c8fd1"; ctx.fillRect(-len / 2 - 1, -1, 2, 2);
  ctx.fillStyle = "#cfefff"; ctx.fillRect(-len / 2 + 1, -0.5, len, 1);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(len / 2 + 1, -0.5, 1, 1);
  ctx.restore();
}
// 修士身邊環繞的飛劍
function drawOrbit(x, y, count) {
  const n = Math.min(count, 40);
  for (let i = 0; i < n; i++) {
    const ring = Math.floor(i / 12), inRing = Math.min(12, n - ring * 12);
    const a = ((i % 12) / inRing) * Math.PI * 2 + time * (1.6 - ring * 0.4) * (ring % 2 ? -1 : 1);
    const r = 13 + ring * 6;
    drawSword(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.55 - 3, -Math.PI / 2, 6);
  }
}
function drawShots() {
  for (const s of pshots) if (s.delay <= 0) drawSword(s.x, s.y, Math.atan2(s.vy, s.vx), 8);
  for (const s of shots) {
    if (s.delay > 0) continue;
    ctx.fillStyle = "#ff5a1e"; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffd27a"; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawEmbers() {
  for (const e of embers) {
    ctx.globalAlpha = Math.min(1, e.life / e.max * 2) * 0.9;
    ctx.fillStyle = e.s > 1 ? "#ffd27a" : "#ff8a3d";
    ctx.fillRect(e.x, e.y, e.s, e.s);
  }
  ctx.globalAlpha = 1;
}
function drawUlt() {
  if (ultFx <= 0) return;
  const k = ultFx / 0.7;
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.rotate(ultA);
  ctx.fillStyle = `rgba(255,216,74,${k * 0.6})`; ctx.fillRect(-420, -10 * k - 3, 840, 20 * k + 6);
  ctx.fillStyle = `rgba(255,255,255,${k})`; ctx.fillRect(-420, -4 * k - 1, 840, 8 * k + 2);
  ctx.restore();
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
    const pop = 1 + Math.max(0, 0.12 - f.age) * (f.big ? 8 : 5);
    ctx.font = `bold ${Math.round((f.big ? 12 : 9) * pop)}px "Noto Sans TC", sans-serif`;
    ctx.fillStyle = "#1b1424"; ctx.fillText(f.text, f.x + 1, f.y + 1);
    ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

// 光影：先蓋一層暗色，再在光源處挖洞；最後疊一層彩色光暈
const lightCvs = document.createElement("canvas");
const lctx = lightCvs.getContext("2d");
function drawLights(k, ox, oy) {
  if (lightCvs.width !== cvs.width || lightCvs.height !== cvs.height) { lightCvs.width = cvs.width; lightCvs.height = cvs.height; }
  const lights = [];
  const L = (x, y, r, a = 1, color = null) => lights.push({ x, y, r, a, color });
  for (const [x, y] of [[40, 40], [ARENA.w - 40, 40], [40, ARENA.h - 30], [ARENA.w - 40, ARENA.h - 30]]) L(x, y - 26, 85 + Math.sin(time * 7 + x) * 4, 1, "255,140,50");
  L(player.x, player.y, 75, 0.95, "120,160,255");
  L(boss.x, boss.y, boss.phase === 2 ? 110 : 90, 0.85, boss.phase === 2 ? "255,60,30" : "255,120,40");
  L(ARENA.w / 2, ARENA.h / 2 + 10, 95, 0.35, boss.phase === 2 ? "255,60,40" : "160,100,255");
  for (const c of cracks) { const [x, y] = c.pts[Math.floor(c.pts.length / 2)]; L(x, y, 28, 0.45, "255,110,40"); }
  for (const sh of shots) if (sh.delay <= 0) L(sh.x, sh.y, 30, 0.9, "255,120,30");
  for (const sh of pshots) if (sh.delay <= 0) L(sh.x, sh.y, 18, 0.7, "140,220,255");
  for (const h of hazards) if (h.delay <= 0 && h.type === "circle") L(h.x, h.y, h.r * 1.5, h.warn > 0 ? 0.5 : 1, h.warn > 0 ? "255,40,40" : "255,170,60");
  if (ultFx > 0) L(boss.x, boss.y, 260, ultFx, "255,240,180");

  lctx.globalCompositeOperation = "source-over";
  lctx.clearRect(0, 0, lightCvs.width, lightCvs.height);
  lctx.fillStyle = boss.phase === 2 ? "rgba(22,4,6,0.8)" : "rgba(6,3,16,0.8)";
  lctx.fillRect(0, 0, lightCvs.width, lightCvs.height);
  lctx.globalCompositeOperation = "destination-out";
  for (const l of lights) {
    const X = ox + l.x * k, Y = oy + l.y * k, R = l.r * k;
    const g = lctx.createRadialGradient(X, Y, 0, X, Y, R);
    g.addColorStop(0, `rgba(0,0,0,${l.a})`); g.addColorStop(0.5, `rgba(0,0,0,${l.a * 0.6})`); g.addColorStop(1, "rgba(0,0,0,0)");
    lctx.fillStyle = g; lctx.fillRect(X - R, Y - R, R * 2, R * 2);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(lightCvs, 0, 0);
  ctx.globalCompositeOperation = "lighter";
  for (const l of lights) {
    if (!l.color) continue;
    const X = ox + l.x * k, Y = oy + l.y * k, R = l.r * k * 0.7;
    const g = ctx.createRadialGradient(X, Y, 0, X, Y, R);
    g.addColorStop(0, `rgba(${l.color},${0.16 * l.a})`); g.addColorStop(1, `rgba(${l.color},0)`);
    ctx.fillStyle = g; ctx.fillRect(X - R, Y - R, R * 2, R * 2);
  }
  ctx.globalCompositeOperation = "source-over";
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
  const bname = `焚天石魔 ${boss.phase === 2 ? "【暴走】" : ""}  ${boss.hp} / ${boss.maxHp}`;
  ctx.fillStyle = "#1b1424"; ctx.fillText(bname, W / 2 + 1, by + 32);
  ctx.fillStyle = "#ffe0b0"; ctx.fillText(bname, W / 2, by + 31);

  // 玩家血條（左上）
  const px = 14, py = H - 46;
  const pw = Math.min(220, W * 0.38);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(px - 3, py - 3, pw + 6, 18);
  ctx.fillStyle = "#1e3a22"; ctx.fillRect(px, py, pw, 12);
  ctx.fillStyle = player.hp / player.maxHp < 0.3 ? "#ff5a4a" : "#5fdc6a"; ctx.fillRect(px, py, pw * (player.hp / player.maxHp), 12);
  ctx.font = "bold 12px 'Noto Sans TC', sans-serif";
  ctx.fillStyle = "#fff"; ctx.fillText(`修士 HP ${player.hp}/${player.maxHp}　丹藥 ×${player.potions}　飛劍 ×${player.swords}`, px, py - 8);
  // 必殺能量
  const full = player.ult >= ULT_MAX;
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(px - 3, py + 15, pw + 6, 10);
  ctx.fillStyle = full ? `rgba(255,${200 + Math.sin(time * 12) * 55},80,1)` : "#c9a2ff"; ctx.fillRect(px, py + 17, pw * (player.ult / ULT_MAX), 6);
  ctx.fillStyle = full ? "#ffe066" : "rgba(255,255,255,0.6)";
  ctx.fillText(full ? "天罰準備好了！按 U／天罰" : `${time.toFixed(1)} 秒`, px, py + 40);
  // 連擊
  if (combo >= 3) {
    const sc = 1 + comboPop * 0.5;
    ctx.save();
    ctx.translate(W - 30, H * 0.32);
    ctx.scale(sc, sc);
    ctx.textAlign = "right";
    ctx.font = "900 34px 'Noto Sans TC', sans-serif";
    ctx.fillStyle = "#1b1424"; ctx.fillText(`${combo}`, 2, 2);
    ctx.fillStyle = combo >= 30 ? "#ff5a4a" : combo >= 15 ? "#ffd84a" : "#ffffff"; ctx.fillText(`${combo}`, 0, 0);
    ctx.font = "bold 13px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#ffcf6b"; ctx.fillText("連擊", 0, 18);
    ctx.restore();
    ctx.textAlign = "left";
  }

  // 搖桿
  if (stick.id !== null) {
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(stick.ox, stick.oy, 50, 0, Math.PI * 2); ctx.stroke();
    const dx = stick.x - stick.ox, dy = stick.y - stick.oy, d = Math.hypot(dx, dy), k = d > 50 ? 50 / d : 1;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath(); ctx.arc(stick.ox + dx * k, stick.oy + dy * k, 22, 0, Math.PI * 2); ctx.fill();
  }

  // 開場：魔王登場卡片
  if (state === "intro") {
    const t = 2.8 - introT;
    const bar = Math.min(1, t * 3) * H * 0.12;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
    if (t > 0.9) {
      const a = Math.min(1, (t - 0.9) * 3) * Math.min(1, introT * 3);
      ctx.globalAlpha = a;
      ctx.textAlign = "center";
      ctx.font = "bold 14px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#ffcf6b";
      ctx.fillText("— 渡劫台的守關妖魔 —", W / 2, H * 0.7);
      ctx.font = "900 44px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#1b1424"; ctx.fillText("焚天石魔", W / 2 + 3, H * 0.7 + 49);
      ctx.fillStyle = "#ffb347"; ctx.fillText("焚天石魔", W / 2, H * 0.7 + 46);
      ctx.globalAlpha = 1;
    }
  }
  if (flashT > 0) { ctx.fillStyle = `rgba(${flashColor},${Math.min(0.7, flashT * 2.5)})`; ctx.fillRect(0, 0, W, H); }
  // 技能冷卻（按鈕上的黑色遮罩）
  for (const name of ["spin", "roll", "potion"]) {
    const el = pad.querySelector(`[data-act="${name}"] .cd`);
    if (el) el.style.transform = `scaleY(${player.cds[name] / SKILLS[name].cd})`;
  }
  const ultBtn = pad.querySelector('[data-act="ult"]');
  if (ultBtn) { ultBtn.style.setProperty("--ult", player.ult / ULT_MAX); ultBtn.classList.toggle("ready", player.ult >= ULT_MAX); }
  const cnt = pad.querySelector(".count");
  if (cnt) cnt.textContent = player.potions;
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#120d18";
  ctx.fillRect(0, 0, cvs.width, cvs.height);
  if (state === "run" || state === "runEnd" || state === "runFail") { renderRun(); return; }
  if (!player) return;
  // 鏡頭跟著玩家，稍微往魔王方向偏
  const intro = state === "intro";
  const tx = intro ? boss.x : player.x * 0.75 + boss.x * 0.25, ty = intro ? boss.y : player.y * 0.75 + boss.y * 0.25;
  cam.x += (tx - cam.x) * (intro ? 0.06 : 0.1);
  cam.y += (ty - cam.y) * (intro ? 0.06 : 0.1);
  cam.zoom += ((intro ? 1.35 : ultFx > 0 ? 1.12 : 1) - cam.zoom) * 0.08;
  const k = SCALE * DPR * cam.zoom;
  const sx = shake > 0 ? rand(-shake, shake) * DPR : 0, sy = shake > 0 ? rand(-shake, shake) * DPR : 0;
  const ox = Math.round(W * DPR / 2 - cam.x * k + sx), oy = Math.round(H * DPR / 2 - cam.y * k + sy);
  ctx.setTransform(k, 0, 0, k, ox, oy);
  ctx.imageSmoothingEnabled = false;
  drawArena();
  drawHazards();
  // 依 y 排序：誰在下面誰後畫
  if (player.y < boss.y) { drawPlayer(); if (state !== "win" || slowmo > 0.6) drawBoss(); }
  else { if (state !== "win" || slowmo > 0.6) drawBoss(); drawPlayer(); }
  drawShots();
  drawEmbers();
  drawUlt();
  drawLights(k, ox, oy);
  ctx.setTransform(k, 0, 0, k, ox, oy);
  drawFx();
  drawHud();
}

// ───────── 御劍跑酷：左右選門累積飛劍，閃開妖群，終點是渡劫台 ─────────
const ROAD = 80; // 路的一半寬（世界單位）
const RUN_SPEED = 115;
let run = null;
const runDrag = { id: null, lastX: 0, dx: 0 };
cvs.addEventListener("pointerdown", (e) => {
  if (state === "run" && runDrag.id === null) { runDrag.id = e.pointerId; runDrag.lastX = e.clientX; }
});
cvs.addEventListener("pointermove", (e) => {
  if (e.pointerId === runDrag.id) { runDrag.dx += e.clientX - runDrag.lastX; runDrag.lastX = e.clientX; }
});
const endDrag = (e) => { if (e.pointerId === runDrag.id) runDrag.id = null; };
cvs.addEventListener("pointerup", endDrag);
cvs.addEventListener("pointercancel", endDrag);

function pairGates(tier) {
  const good = () => (Math.random() < 0.2 + tier * 0.15
    ? { op: "×", v: Math.random() < 0.25 ? 3 : 2 }
    : { op: "+", v: Math.round(rand(5, 12) + tier * 40) });
  const bad = () => (Math.random() < 0.35 ? { op: "÷", v: 2 } : { op: "−", v: Math.round(rand(4, 10) + tier * 35) });
  const pair = Math.random() < 0.3 ? [good(), good()] : [good(), bad()];
  return Math.random() < 0.5 ? pair : pair.reverse();
}
function resetRun() {
  run = { x: 0, y: 0, swords: 5, shown: 5, rows: [], endY: 0, endT: 0 };
  const N = 14;
  let y = -240;
  for (let i = 0; i < N; i++) {
    const tier = i / N; // 越後面數字越大
    if (i % 4 === 3) run.rows.push({ y, type: "mob", x: rand(-40, 40), n: Math.round(rand(6, 14) + tier * 50), w: 50, hit: false });
    else run.rows.push({ y, type: "gate", gates: pairGates(tier), pick: -1 });
    y -= 190;
  }
  run.endY = y - 40;
  particles = []; floaters = []; embers = []; shake = 0; time = 0; flashT = 0; hitstop = 0;
  cam = { x: 0, y: -45, zoom: Math.min(0.85, (W * 0.96) / ((ROAD + 14) * 2) / SCALE) };
}
const isGood = (g) => g.op === "+" || g.op === "×";
function applyGate(g) {
  let s = run.swords;
  if (g.op === "+") s += g.v; else if (g.op === "−") s -= g.v; else if (g.op === "×") s *= g.v; else s = Math.ceil(s / 2);
  run.swords = clamp(Math.round(s), 1, 999);
}
function updateRun(dt) {
  let mx = 0;
  if (keys.has("a") || keys.has("arrowleft")) mx -= 1;
  if (keys.has("d") || keys.has("arrowright")) mx += 1;
  run.x += mx * 150 * dt;
  run.x += (runDrag.dx / (SCALE * cam.zoom)) * 1.2; runDrag.dx = 0;
  run.x = clamp(run.x, -ROAD + 10, ROAD - 10);
  const prevY = run.y;
  run.y -= RUN_SPEED * dt;
  for (const r of run.rows) {
    if (!(prevY > r.y && run.y <= r.y)) continue;
    if (r.type === "gate") {
      r.pick = run.x < 0 ? 0 : 1;
      const g = r.gates[r.pick], good = isGood(g);
      applyGate(g);
      floatText(run.x, run.y - 18, `${g.op}${g.v}`, good ? "#9fe8ff" : "#ff6b6b", true);
      burst(run.x, run.y, good ? "#9fe8ff" : "#ff6b6b", good ? 18 : 10, 80);
      flashT = 0.1; flashColor = good ? "120,220,255" : "255,40,40";
      if (!good) shake = 5;
    } else if (!r.hit && Math.abs(run.x - r.x) < r.w / 2 + 6) {
      r.hit = true;
      run.swords -= r.n;
      floatText(run.x, run.y - 18, `−${r.n}`, "#ff6b6b", true);
      burst(r.x, r.y, "#b07dff", 30, 100, 0.7);
      shake = 8; flashT = 0.15; flashColor = "255,40,40";
      if (run.swords <= 0) { run.swords = 0; state = "runFail"; setTimeout(showRunFail, 900); return; }
    }
  }
  run.shown += (run.swords - run.shown) * Math.min(1, dt * 8);
  if (Math.random() < 0.7) particles.push({ x: run.x + rand(-5, 5), y: run.y + 10, vx: rand(-8, 8), vy: 40, life: 0.4, max: 0.4, color: "#9fe8ff", size: 1.5 });
  if (prevY > run.endY && run.y <= run.endY) {
    state = "runEnd"; run.endT = 1.8;
    floatText(run.x, run.y - 26, `飛劍 ${run.swords} 把，開始渡劫！`, "#ffe066", true);
    flashT = 0.3; flashColor = "255,250,220"; shake = 10;
  }
}
function showRunFail() {
  screenEl.innerHTML = `<div class="panel">
    <h1>飛劍耗盡…</h1>
    <div class="result">被妖群吃光了飛劍，到不了渡劫台。<br>下次記得閃開紫色妖群，或先多穿幾道加乘門。</div>
    <button id="again" class="big">再挑戰</button>
  </div>`;
  screenEl.classList.remove("hidden");
  document.getElementById("again").onclick = start;
}

const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const MOB_PAL = { k: "#1b1424", P: "#7a3fb8", p: "#a96be0", E: "#ffe066" };
const MOB = sprite([
  "..k....k..",
  ".kPk..kPk.",
  ".kPPkkPPk.",
  "kPpPPPPpPk",
  "kPEkPPkEPk",
  "kPPPPPPPPk",
  "kPPkkkkPPk",
  ".kPPPPPPk.",
  "..kk..kk..",
], MOB_PAL);

function renderRun() {
  // 路固定置中；手機直放時自動縮小，確保整條路（兩道門）都看得到
  const fit = Math.min(0.85, (W * 0.96) / ((ROAD + 14) * 2) / SCALE);
  cam.x += (0 - cam.x) * 0.15; cam.y += (run.y - 45 - cam.y) * 0.3;
  cam.zoom += ((state === "runEnd" ? fit * 1.3 : fit) - cam.zoom) * 0.06;
  const k = SCALE * DPR * cam.zoom;
  // 夜空與星星（螢幕座標）
  const sky = ctx.createLinearGradient(0, 0, 0, cvs.height);
  sky.addColorStop(0, "#070a1e"); sky.addColorStop(1, "#1a1438");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, cvs.width, cvs.height);
  for (let i = 0; i < 70; i++) {
    const sx = hash(i) * cvs.width, sy = ((hash(i + 99) * cvs.height + -cam.y * 0.15 * k) % cvs.height + cvs.height) % cvs.height;
    ctx.fillStyle = `rgba(220,230,255,${0.3 + 0.5 * Math.abs(Math.sin(time * 2 + i))})`;
    ctx.fillRect(sx, sy, 2 * DPR, 2 * DPR);
  }
  const sx = shake > 0 ? rand(-shake, shake) * DPR : 0, sy = shake > 0 ? rand(-shake, shake) * DPR : 0;
  const ox = Math.round(W * DPR / 2 - cam.x * k + sx), oy = Math.round(H * DPR / 2 - cam.y * k + sy);
  ctx.setTransform(k, 0, 0, k, ox, oy);
  ctx.imageSmoothingEnabled = false;
  const halfH = H / (2 * SCALE * cam.zoom) + 40, top = cam.y - halfH, bot = cam.y + halfH;

  // 兩側雲海
  for (let j = Math.floor(top / 30); j <= Math.ceil(bot / 30); j++) {
    for (const side of [-1, 1]) {
      const x = side * (ROAD + 20 + hash(j * 2 + (side > 0 ? 1 : 0)) * 90) + Math.sin(time * 0.5 + j) * 6;
      ctx.fillStyle = "rgba(150,160,220,0.12)";
      ctx.beginPath(); ctx.ellipse(x, j * 30, 40, 12, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  // 石板仙路
  for (let j = Math.floor(top / 16); j <= Math.ceil(bot / 16); j++) {
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = (i + j) % 2 ? "#3b3550" : "#353048";
      ctx.fillRect(-ROAD + i * 16, j * 16, 16, 16);
    }
  }
  ctx.fillStyle = "#6d6390"; ctx.fillRect(-ROAD - 3, top, 3, bot - top); ctx.fillRect(ROAD, top, 3, bot - top);
  // 路邊燈籠
  for (let j = Math.floor(top / 120); j <= Math.ceil(bot / 120); j++) {
    for (const side of [-1, 1]) {
      const x = side * (ROAD + 8), y = j * 120;
      ctx.fillStyle = "#2a2233"; ctx.fillRect(x - 1, y - 12, 2, 12);
      ctx.fillStyle = `rgba(255,170,80,${0.75 + Math.sin(time * 5 + j) * 0.2})`; ctx.fillRect(x - 3, y - 18, 6, 7);
      ctx.fillStyle = "rgba(255,170,80,0.12)"; ctx.beginPath(); ctx.arc(x, y - 14, 14, 0, Math.PI * 2); ctx.fill();
    }
  }
  // 渡劫台
  const ey = run.endY;
  if (ey > top - 80) {
    ctx.fillStyle = "#4a4168"; ctx.beginPath(); ctx.ellipse(0, ey - 30, ROAD + 10, 40, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(255,220,120,${0.5 + Math.sin(time * 3) * 0.2})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, ey - 30, ROAD - 10, 30, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, ey - 30, ROAD - 30, 20, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(40,30,60,0.8)"; ctx.beginPath(); ctx.ellipse(0, ey - 110, 110, 26, 0, 0, Math.PI * 2); ctx.fill();
    if (Math.sin(time * 3.7) > 0.85) { // 劫雷
      ctx.strokeStyle = "#e9e2ff"; ctx.lineWidth = 2; ctx.beginPath();
      let lx = rand(-50, 50), ly = ey - 100; ctx.moveTo(lx, ly);
      for (let i = 0; i < 5; i++) { lx += rand(-12, 12); ly += 14; ctx.lineTo(lx, ly); }
      ctx.stroke();
    }
    ctx.font = "bold 12px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
    ctx.fillStyle = "#ffe066"; ctx.fillText("渡 劫 台", 0, ey - 26);
  }
  // 門與妖群
  for (const r of run.rows) {
    if (r.y < top - 30 || r.y > bot + 30) continue;
    if (r.type === "gate") {
      r.gates.forEach((g, i) => {
        const x0 = i === 0 ? -ROAD : 0, good = isGood(g), picked = r.pick === i, faded = r.pick >= 0 && !picked;
        const col = good ? "95,208,255" : "255,80,70";
        ctx.globalAlpha = faded ? 0.25 : 1;
        ctx.fillStyle = `rgba(${col},${picked ? 0.15 : 0.32})`; ctx.fillRect(x0 + 3, r.y - 22, ROAD - 6, 22);
        ctx.fillStyle = `rgb(${col})`; ctx.fillRect(x0 + 3, r.y - 24, ROAD - 6, 2);
        ctx.fillStyle = "#5c5478"; ctx.fillRect(x0 + 1, r.y - 26, 4, 28); ctx.fillRect(x0 + ROAD - 5, r.y - 26, 4, 28);
        ctx.font = "900 15px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
        ctx.fillStyle = "#1b1424"; ctx.fillText(`${g.op}${g.v}`, x0 + ROAD / 2 + 1, r.y - 6);
        ctx.fillStyle = good ? "#e6f8ff" : "#ffd0cc"; ctx.fillText(`${g.op}${g.v}`, x0 + ROAD / 2, r.y - 7);
        ctx.globalAlpha = 1;
      });
    } else if (!r.hit) {
      const m = Math.min(r.n, 14);
      for (let i = 0; i < m; i++) {
        const mx = r.x + ((i % 5) - 2) * 10 + (Math.floor(i / 5) % 2) * 5, my = r.y - 8 - Math.floor(i / 5) * 8 + Math.sin(time * 6 + i) * 1;
        ctx.drawImage(MOB, Math.round(mx - 5), Math.round(my - 4));
      }
      ctx.font = "900 13px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
      ctx.fillStyle = "#1b1424"; ctx.fillText(`妖 ${r.n}`, r.x + 1, r.y - 32);
      ctx.fillStyle = "#e0b8ff"; ctx.fillText(`妖 ${r.n}`, r.x, r.y - 33);
    }
  }
  // 修士踩在飛劍上
  if (state !== "runFail") {
    const bob = Math.sin(time * 6) * 1;
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(run.x, run.y + 10, 8, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    drawOrbit(run.x, run.y + bob, Math.round(run.shown));
    ctx.fillStyle = "#3c8fd1"; ctx.fillRect(run.x - 8, run.y + 5 + bob, 3, 2);
    ctx.fillStyle = "#cfefff"; ctx.fillRect(run.x - 5, run.y + 5 + bob, 12, 2);
    ctx.drawImage(HERO, Math.round(run.x - 6), Math.round(run.y - 9 + bob));
    ctx.font = "900 11px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
    ctx.fillStyle = "#1b1424"; ctx.fillText(`${Math.round(run.shown)}`, run.x + 1, run.y - 26 + bob);
    ctx.fillStyle = "#9fe8ff"; ctx.fillText(`${Math.round(run.shown)}`, run.x, run.y - 27 + bob);
  }
  drawFx();

  // 介面
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const bw = Math.min(W * 0.6, 360), bx = (W - bw) / 2;
  const prog = clamp(run.y / run.endY, 0, 1);
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(bx - 3, 11, bw + 6, 12);
  ctx.fillStyle = "#ffd27a"; ctx.fillRect(bx, 14, bw * prog, 6);
  ctx.font = "bold 13px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
  ctx.fillStyle = "#ffe0b0"; ctx.fillText(`飛劍 ×${run.swords}　前往渡劫台`, W / 2, 42);
  if (time < 3.5 && state === "run") {
    ctx.globalAlpha = Math.min(1, (3.5 - time) * 2);
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px 'Noto Sans TC', sans-serif";
    ctx.fillText("左右拖曳（或 A／D）選門", W / 2, H * 0.74);
    ctx.fillText("藍門加劍、紅門扣劍，閃開紫色妖群", W / 2, H * 0.74 + 22);
    ctx.globalAlpha = 1;
  }
  if (flashT > 0) { ctx.fillStyle = `rgba(${flashColor},${Math.min(0.5, flashT * 2.5)})`; ctx.fillRect(0, 0, W, H); }
}

// ───────── 主迴圈 ─────────
let last = performance.now();
function frame(now) {
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (hitstop > 0) { hitstop -= dt; render(); pressed.clear(); padAct.clear(); requestAnimationFrame(frame); return; }
  if (state === "intro") {
    introT -= dt;
    if (introT < 1.6 && introT + dt >= 1.6) { shake = 12; burst(boss.x, boss.y - 20, "#ff8a3d", 40, 150, 0.9); flashT = 0.15; flashColor = "255,120,40"; }
    if (introT <= 0) state = "play";
  } else if (state === "play") {
    time += dt;
    updatePlayer(dt);
    updateBoss(dt);
    updateHazards(dt);
    updateSwords(dt);
  } else if (state === "run") {
    time += dt;
    updateRun(dt);
  } else if (state === "runEnd") {
    time += dt;
    run.y -= RUN_SPEED * 0.35 * dt;
    run.endT -= dt;
    if (run.endT <= 0) startBoss(run.swords);
  } else if (state === "runFail") {
    time += dt;
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
if (params.has("run")) {
  // 測試用：?run&sim=秒數 先快轉跑酷（自動左右亂飄）
  start();
  const sim = Number(params.get("sim") || 0);
  for (let t = 0; t < sim && state === "run"; t += 1 / 60) {
    keys.clear();
    keys.add(Math.sin(t * 1.3) > 0 ? "d" : "a");
    time += 1 / 60;
    updateRun(1 / 60); updateFx(1 / 60);
  }
  keys.clear();
  cam.x = 0; cam.y = run.y - 45;
} else if (params.has("demo")) {
  startBoss(Number(params.get("swords") || 60));
  if (params.has("sim")) { state = "play"; cam.zoom = 1; }
  // 測試用：?demo&sim=秒數 先快轉（玩家會自動繞著魔王走、偶爾攻擊）
  const sim = Number(params.get("sim") || 0);
  for (let t = 0; t < sim && state === "play"; t += 1 / 60) {
    const a = time * 0.8;
    keys.clear();
    if (Math.cos(a) > 0.3) keys.add("d"); else if (Math.cos(a) < -0.3) keys.add("a");
    if (Math.sin(a) > 0.3) keys.add("s"); else if (Math.sin(a) < -0.3) keys.add("w");
    if (Math.random() < 0.08) pressed.add("j");
    time += 1 / 60;
    if (Math.random() < 0.01) pressed.add("u");
    hitstop = 0;
    updatePlayer(1 / 60); updateBoss(1 / 60); updateHazards(1 / 60); updateSwords(1 / 60); updateFx(1 / 60);
    pressed.clear();
  }
  keys.clear();
}
requestAnimationFrame(frame);
