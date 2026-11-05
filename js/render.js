// 御劍渡劫（pixel-raid）— 表現層：打王畫面的繪圖與光影
"use strict";

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
    const glow = 0.45 + Math.sin(time * 2.2 + c.phase) * 0.3 + (boss.phase >= 2 ? 0.2 : 0);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#140c12"; ctx.lineWidth = 3.5;
    ctx.beginPath(); c.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    ctx.strokeStyle = `rgba(255,${boss.phase >= 2 ? 70 : 120},40,${glow})`; ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  // 中央魔法陣
  const cx = ARENA.w / 2, cy = ARENA.h / 2 + 10;
  const runeCol = boss.phase >= 2 ? "255,70,50" : "170,110,255";
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
  const rock = b.flash > 0 ? "#ffffff" : b.phase >= 2 ? "#5a3a3a" : "#4b4250";
  const rockHi = b.flash > 0 ? "#ffffff" : b.phase >= 2 ? "#7a4a42" : "#625868";
  const lava = b.phase >= 2 ? "#ff4a1e" : "#ff8a2e";
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
  const pulse = 0.6 + Math.sin(time * (b.phase >= 2 ? 9 : 5)) * 0.4;
  ctx.globalAlpha = b.flash > 0 ? 0 : pulse;
  ctx.fillStyle = lava;
  ctx.fillRect(x - 6, y - 4, 2, 14); ctx.fillRect(x - 4, y + 8, 8, 2); ctx.fillRect(x + 6, y - 10, 2, 10);
  ctx.fillRect(x - 14, y + 2, 6, 2); ctx.fillRect(x + 10, y + 6, 6, 2);
  ctx.globalAlpha = 1;
  // 眼睛
  ctx.fillStyle = b.state === "stun" ? "#9fd0ff" : b.phase >= 2 ? "#ff2a1a" : "#ffd23a";
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
const FOX = sprite([
  "k.....k..",
  "kRk..kRk.",
  "kRRkkRRk.",
  "kRWRRWRk.",
  ".kRRRRk.k",
  "..kRRRkkR",
  "..kRkRkRk",
  "..kk.kk..",
], { k: "#1b1424", R: "#ff7a2e", W: "#fff6c0" });
const CRANE = sprite([
  "...kk....",
  "..kWRk...",
  "..kWWk...",
  "...kWkkk.",
  "..kWWWWWk",
  ".kWWWWkk.",
  "..kkkk...",
  "...k.k...",
], { k: "#1b1424", W: "#f4f6ff", R: "#e8433a" });
function drawPet() {
  const p = player;
  if (!p.pet) return;
  const bob = Math.sin(time * 5) * 1.5;
  ctx.drawImage(p.pet === "fox" ? FOX : CRANE, Math.round(p.petX - 4), Math.round(p.petY - 4 + bob));
}
function drawShots() {
  for (const s of pshots) {
    if (s.delay > 0) continue;
    if (s.fox) { ctx.fillStyle = "#ff7a2e"; ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#ffe066"; ctx.fillRect(s.x - 1, s.y - 1, 2, 2); }
    else drawSword(s.x, s.y, Math.atan2(s.vy, s.vx), 8);
  }
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
  for (const t of bolts) { // 天雷
    ctx.globalAlpha = Math.min(1, t.life * 6);
    ctx.strokeStyle = "#eef3ff"; ctx.lineWidth = 2.5; ctx.beginPath();
    let lx = t.x, ly = t.y - 140; ctx.moveTo(lx, ly);
    for (let i = 0; i < 7; i++) { lx += rand(-9, 9); ly += 20; ctx.lineTo(lx, Math.min(ly, t.y)); }
    ctx.stroke(); ctx.strokeStyle = "rgba(150,180,255,0.5)"; ctx.lineWidth = 6; ctx.stroke();
  }
  ctx.globalAlpha = 1;
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
  L(boss.x, boss.y, boss.phase >= 2 ? 110 : 90, 0.85, boss.phase >= 2 ? "255,60,30" : "255,120,40");
  L(ARENA.w / 2, ARENA.h / 2 + 10, 95, 0.35, boss.phase >= 2 ? "255,60,40" : "160,100,255");
  for (const c of cracks) { const [x, y] = c.pts[Math.floor(c.pts.length / 2)]; L(x, y, 28, 0.45, "255,110,40"); }
  for (const sh of shots) if (sh.delay <= 0) L(sh.x, sh.y, 30, 0.9, "255,120,30");
  for (const sh of pshots) if (sh.delay <= 0) L(sh.x, sh.y, 18, 0.7, "140,220,255");
  for (const h of hazards) if (h.delay <= 0 && h.type === "circle") L(h.x, h.y, h.r * 1.5, h.warn > 0 ? 0.5 : 1, h.warn > 0 ? "255,40,40" : "255,170,60");
  if (ultFx > 0) L(boss.x, boss.y, 260, ultFx, "255,240,180");

  lctx.globalCompositeOperation = "source-over";
  lctx.clearRect(0, 0, lightCvs.width, lightCvs.height);
  lctx.fillStyle = boss.phase >= 2 ? "rgba(22,4,6,0.8)" : "rgba(6,3,16,0.8)";
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

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#120d18";
  ctx.fillRect(0, 0, cvs.width, cvs.height);
  const vs = viewState();
  if (vs === "run" || vs === "runEnd" || vs === "runFail") { renderRun(); return; }
  if (vs === "hunt" || vs === "huntEnd" || vs === "huntFail") { renderHunt(); return; }
  if (vs === "world" || vs === "worldDead") { renderWorld(); return; }
  if (!player) return;
  // 鏡頭跟著玩家，稍微往魔王方向偏
  const intro = vs === "intro";
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
  drawPet();
  drawShots();
  drawEmbers();
  drawUlt();
  drawLights(k, ox, oy);
  ctx.setTransform(k, 0, 0, k, ox, oy);
  drawFx();
  drawHud();
}
