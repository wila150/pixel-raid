// 御劍渡劫（pixel-raid）— 打王：玩家控制、靈獸、飛劍、魔王 AI、碰撞判定、特效粒子
"use strict";

// ───────── 打王初始化 ─────────
function reset() {
  const b = B || bonus();
  player = { x: ARENA.w / 2, y: ARENA.h - 70, r: 6, hp: b.maxHp, maxHp: b.maxHp, speed: 95, face: -Math.PI / 2, flip: false,
    cds: { attack: 0, spin: 0, roll: 0, potion: 0 }, potions: b.potions, ult: 0, roll: 0, rollDir: 0, iframe: 0, hurt: 0, swing: 0, spinT: 0, walk: 0,
    swords: 0, volT: 1.5, pet: b.pet, petLv: b.petLv, petT: 2, petX: ARENA.w / 2 - 16, petY: ARENA.h - 76 };
  boss = { x: ARENA.w / 2, y: 120, r: 22, hp: b.bossHp, maxHp: b.bossHp, phase: 1, state: "idle", t: 1.6, flash: 0, dashV: null, pattern: 0, rage: false, stagger: 0 };
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
  dmg = Math.round(dmg * (B ? B.bossDmg : 1)); // 境界越高，魔王也越強
  player.hp = Math.max(0, player.hp - dmg);
  stats.taken += dmg;
  player.iframe = 0.7;
  player.hurt = 0.25;
  combo = 0;
  flashT = 0.12; flashColor = "255,40,40";
  shake = Math.max(shake, 6);
  floatText(player.x, player.y - 14, `-${dmg}`, "#ff6b6b");
  sfx("hurt");
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
  base *= B ? B.atk : 1;
  const dmg = Math.max(1, Math.round(base * rand(0.9, 1.15) * (crit ? 2 : 1)));
  boss.hp = Math.max(0, boss.hp - dmg);
  boss.flash = 0.1;
  stats.dealt += dmg;
  if (crit) stats.crits++;
  if (quiet) {
    if (Math.random() < 0.3) sfx("tick");
    player.ult = Math.min(ULT_MAX, player.ult + (dmg / 16) * (B ? B.ult : 1));
    burst(x, y, "#9fe8ff", 4, 50);
    if (boss.phase === 1 && boss.hp <= boss.maxHp * 0.5) enterPhase2();
    if (boss.hp <= 0) end(true);
    return;
  }
  floatText(x, y - 10, crit ? `${dmg}!` : `${dmg}`, crit ? "#ffd84a" : "#ffffff", crit);
  sfx(crit ? "crit" : "hit");
  hitstop = Math.max(hitstop, crit ? 0.07 : 0.035);
  combo++; comboT = 2.2; comboPop = 1;
  player.ult = Math.min(ULT_MAX, player.ult + (dmg / (crit ? 7 : 9)) * (B ? B.ult : 1));
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
  sfx("roar");
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
    sfx("dash");
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
    sfx("ult");
    hitBoss(260, boss.x, boss.y);
  }
  if (act("potion", "h", "c") && p.cds.potion <= 0 && p.potions > 0 && p.hp < p.maxHp) {
    p.cds.potion = SKILLS.potion.cd;
    p.potions--;
    const heal = Math.min(45, p.maxHp - p.hp);
    p.hp += heal;
    floatText(p.x, p.y - 16, `+${heal}`, "#7dff8a");
    burst(p.x, p.y, "#7dff8a", 12, 40);
    sfx("heal");
  }

  // 跑酷累積的飛劍：每隔一段時間自動齊射魔王，飛劍越多傷害越高
  if (p.swords > 0) {
    p.volT -= dt;
    if (p.volT <= 0) {
      p.volT = B ? B.vol : 2.2;
      sfx("volley");
      const n = Math.min(p.swords, 12);
      const total = (8 + Math.min(p.swords, 400) * 0.6) * ((B && B.volMul) || 1);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + time * 2;
        pshots.push({ x: p.x + Math.cos(a) * 14, y: p.y + Math.sin(a) * 10 - 4, delay: i * 0.05, dmg: total / n, vx: 0, vy: 0, last: i === n - 1 ? Math.round(total) : 0 });
      }
    }
  }
}

// 靈獸：跟在修士旁邊
function updatePet(dt) {
  const p = player;
  if (!p.pet) return;
  p.petX += (p.x - 16 - p.petX) * Math.min(1, dt * 5);
  p.petY += (p.y - 6 - p.petY) * Math.min(1, dt * 5);
  p.petT -= dt;
  if (p.petT > 0) return;
  if (p.pet === "fox") {
    p.petT = 3;
    pshots.push({ x: p.petX, y: p.petY, delay: 0, dmg: 15 * (1 + 0.3 * (p.petLv - 1)), vx: 0, vy: 0, last: 0, fox: true });
  } else {
    p.petT = 5;
    const heal = Math.min(4 + p.petLv * 2, p.maxHp - p.hp);
    if (heal > 0) { p.hp += heal; floatText(p.x, p.y - 16, `+${heal}`, "#7dff8a"); burst(p.petX, p.petY, "#ffffff", 8, 40); }
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
