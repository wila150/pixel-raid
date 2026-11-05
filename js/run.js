// 御劍渡劫（pixel-raid）— 御劍跑酷：生成器（門、妖群、封印石）、碰撞、跑酷畫面
"use strict";

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
  const good = () => (rng() < 0.2 + tier * 0.15
    ? { op: "×", v: rng() < 0.25 ? 3 : 2 }
    : { op: "+", v: Math.round(R(5, 12) + tier * 40) });
  const bad = () => (rng() < 0.35 ? { op: "÷", v: 2 } : { op: "−", v: Math.round(R(4, 10) + tier * 35) });
  const pair = rng() < 0.3 ? [good(), good()] : [good(), bad()];
  return rng() < 0.5 ? pair : pair.reverse();
}
// 會動的門：中間的分隔線左右滑動
const gateSplit = (r) => (r.move ? Math.sin(time * 1.6 + r.phase) * 45 : 0);
function resetRun() {
  const k = todayKey();
  rng = mode === "daily" ? mulberry32(Number(k.replace(/-/g, ""))) : Math.random;
  const start0 = B ? B.startSwords : 5;
  run = { x: 0, y: 0, swords: start0, shown: start0, rows: [], endY: 0, endT: 0, fireT: 0, perks: {}, shield: B ? B.runShield : 0 };
  const N = 16;
  let y = -240;
  for (let i = 0; i < N; i++) {
    const tier = i / N; // 越後面數字越大
    if (i === 5 || i === 10) run.rows.push({ y, type: "lotus", taken: false }); // 機緣：三選一功法
    else if (i === 9) {
      // 小王「守關妖將」：擋住整條路，飛劍遠遠就開始打；沒打倒撞上去損失大量飛劍
      const hp = Math.round(R(55, 70) + tier * 300);
      run.rows.push({ y, type: "elite", hp, max: hp, reward: Math.round(R(15, 25) + tier * 90), hit: false });
    } else if (i % 4 === 3) {
      if (i % 8 === 3) run.rows.push({ y, type: "mob", x: R(-40, 40), n: Math.round((R(6, 14) + tier * 50) * (B ? B.mobMul : 1)), w: 50, hit: false });
      else {
        // 封印石：在一邊擋路，靠近時飛劍會自動打它，打碎有獎勵；沒打碎撞上去會損失飛劍
        const hp = Math.round(R(25, 45) + tier * 250);
        run.rows.push({ y, type: "seal", x: rng() < 0.5 ? -40 : 40, hp, max: hp, reward: Math.round(R(8, 15) + tier * 60), hit: false });
      }
    } else run.rows.push({ y, type: "gate", gates: pairGates(tier), pick: -1, move: tier > 0.3 && rng() < 0.4, phase: R(0, 6) });
    y -= 190;
  }
  run.endY = y - 40;
  particles = []; floaters = []; embers = []; shake = 0; time = 0; flashT = 0; hitstop = 0;
  cam = { x: 0, y: -45, zoom: Math.min(0.85, (W * 0.96) / ((ROAD + 14) * 2) / SCALE) };
}
const isGood = (g) => g.op === "+" || g.op === "×";
function applyGate(g) {
  let s = run.swords;
  if (g.op === "+") s += g.v + 5 * P("split") + (B ? B.gatePlus : 0); else if (g.op === "−") s -= g.v; else if (g.op === "×") s *= g.v + 0.5 * P("mult"); else s = Math.ceil(s / 2);
  run.swords = clamp(Math.round(s), 1, 999);
}
const bountyOf = (n) => Math.round(n * (1 + 0.5 * P("bounty")));
// 飛劍射向目標的小光點
function swordFx(tx, ty) {
  run.fireT -= 1 / 60;
  if (run.fireT > 0) return;
  run.fireT = 0.06;
  particles.push({ x: run.x + rand(-8, 8), y: run.y - 6, vx: (tx - run.x) * 2, vy: -(run.y - ty) * 3.2, life: 0.3, max: 0.3, color: "#cfefff", size: 2 });
}
function updateRun(dt) {
  let mx = 0;
  if (keys.has("a") || keys.has("arrowleft")) mx -= 1;
  if (keys.has("d") || keys.has("arrowright")) mx += 1;
  const spd = 1 + 0.3 * P("wind");
  run.x += mx * 150 * spd * dt;
  run.x += (runDrag.dx / (SCALE * cam.zoom)) * 1.2 * spd; runDrag.dx = 0;
  run.x = clamp(run.x, -ROAD + 10, ROAD - 10);
  const prevY = run.y;
  run.y -= RUN_SPEED * dt;
  for (const r of run.rows) {
    // 封印石：在前方 130 以內、同一邊時，飛劍自動攻擊
    if (r.type === "seal" && r.hp > 0 && r.y < run.y && run.y - r.y < 130 && Math.abs(run.x - r.x) < 36) {
      r.hp -= run.swords * 1.5 * (1 + 0.5 * P("pierce")) * (B ? B.runPierce : 1) * dt;
      run.fireT -= dt;
      if (run.fireT <= 0) {
        run.fireT = 0.06;
        particles.push({ x: run.x + rand(-8, 8), y: run.y - 6, vx: (r.x - run.x) * 2, vy: -(run.y - r.y) * 3.2, life: 0.3, max: 0.3, color: "#cfefff", size: 2 });
      }
      if (r.hp <= 0) {
        r.hp = 0;
        const rw = bountyOf(r.reward);
        run.swords = clamp(run.swords + rw, 1, 999);
        floatText(r.x, r.y - 30, `封印破！+${rw}`, "#ffe066", true);
        if (mode === "normal" && Math.random() < 0.08) grantLoot(rollItem(), r.x, r.y - 10);
        sfx("break");
        burst(r.x, r.y - 12, "#ffe066", 30, 120, 0.7);
        shake = 6; flashT = 0.12; flashColor = "255,230,120";
      }
    }
    // 妖群：靠近時飛劍也會自動攻擊，全滅可以收服一部分
    if (r.type === "mob" && !r.hit && r.y < run.y && run.y - r.y < 130 && Math.abs(run.x - r.x) < r.w / 2 + 24) {
      if (r.nf === undefined) { r.nf = r.n; r.orig = r.n; }
      r.nf -= run.swords * 0.8 * (1 + 0.5 * P("pierce")) * (B ? B.runPierce : 1) * dt;
      r.n = Math.max(0, Math.ceil(r.nf));
      run.fireT -= dt;
      if (run.fireT <= 0) {
        run.fireT = 0.06;
        particles.push({ x: run.x + rand(-8, 8), y: run.y - 6, vx: (r.x - run.x) * 2, vy: -(run.y - r.y) * 3.2, life: 0.3, max: 0.3, color: "#cfefff", size: 2 });
        if (Math.random() < 0.3) burst(r.x + rand(-20, 20), r.y - 10, "#b07dff", 4, 50);
      }
      if (r.n <= 0) {
        r.hit = true;
        const gain = bountyOf(Math.ceil(r.orig / 4));
        run.swords = clamp(run.swords + gain, 1, 999);
        floatText(r.x, r.y - 30, `妖群全滅！+${gain}`, "#ffe066", true);
        burst(r.x, r.y - 10, "#b07dff", 40, 130, 0.8);
        shake = 6; sfx("break");
      }
    }
    // 守關妖將：前方 230 以內就開始打（整條路都打得到）
    if (r.type === "elite" && r.hp > 0 && r.y < run.y && run.y - r.y < 250) {
      if (!r.warned) { r.warned = true; floatText(0, run.y - 70, "守關妖將擋路！", "#ff8a3d", true); sfx("roar"); shake = 6; }
      r.hp -= run.swords * 1.2 * (1 + 0.5 * P("pierce")) * (B ? B.runPierce : 1) * dt;
      swordFx(rand(-20, 20), r.y - 16);
      if (Math.random() < 0.25) burst(rand(-20, 20), r.y - 20, "#ff8a3d", 3, 50);
      if (r.hp <= 0) {
        r.hp = 0; r.hit = true;
        const rw = bountyOf(r.reward);
        run.swords = clamp(run.swords + rw, 1, 999);
        floatText(0, r.y - 40, `斬殺妖將！+${rw}`, "#ffe066", true);
        if (mode === "normal") grantLoot(rollItem(1), 0, r.y - 20);
        sfx("break"); burst(0, r.y - 16, "#ff8a3d", 50, 160, 0.9); burst(0, r.y - 16, "#ffe066", 30, 120, 0.8);
        shake = 10; flashT = 0.2; flashColor = "255,200,120";
        openPick("斬殺妖將，掉落機緣！", () => {});
        return;
      }
    }
    if (!(prevY > r.y && run.y <= r.y)) continue;
    if (r.type === "lotus") {
      if (!r.taken) { r.taken = true; openPick("得到機緣！", () => {}); return; }
      continue;
    }
    // 金鐘罩：擋下一次損失
    const blocked = () => {
      if (run.shield <= 0) return false;
      run.shield--;
      floatText(run.x, run.y - 18, "金鐘罩擋下了！", "#ffe066", true);
      burst(run.x, run.y, "#ffe066", 24, 90); sfx("good");
      return true;
    };
    if (r.type === "elite") {
      if (r.hp > 0 && !blocked()) {
        const lose = Math.ceil(r.hp / 2 * (B ? B.runLose : 1));
        run.swords -= lose; r.hp = 0;
        floatText(run.x, run.y - 18, `被妖將重擊 −${lose}`, "#ff6b6b", true);
        sfx("bad"); burst(run.x, run.y, "#ff8a3d", 30, 110);
        shake = 12; flashT = 0.2; flashColor = "255,40,40";
        if (run.swords <= 0) { run.swords = 0; state = "runFail"; setTimeout(showRunFail, 900); return; }
      } else r.hp = 0;
      continue;
    }
    if (r.type === "seal") {
      if (r.hp > 0 && Math.abs(run.x - r.x) < 36 && !blocked()) {
        const lose = Math.ceil(r.hp / 3 * (B ? B.runLose : 1));
        run.swords -= lose;
        floatText(run.x, run.y - 18, `−${lose}`, "#ff6b6b", true);
        sfx("bad");
        burst(r.x, r.y - 12, "#c9c2d8", 24, 90);
        shake = 8; flashT = 0.15; flashColor = "255,40,40";
        if (run.swords <= 0) { run.swords = 0; state = "runFail"; setTimeout(showRunFail, 900); return; }
      }
      continue;
    }
    if (r.type === "gate") {
      r.splitAt = gateSplit(r);
      r.pick = run.x < r.splitAt ? 0 : 1;
      const g = r.gates[r.pick], good = isGood(g);
      applyGate(g);
      floatText(run.x, run.y - 18, `${g.op}${g.v}`, good ? "#9fe8ff" : "#ff6b6b", true);
      burst(run.x, run.y, good ? "#9fe8ff" : "#ff6b6b", good ? 18 : 10, 80);
      flashT = 0.1; flashColor = good ? "120,220,255" : "255,40,40";
      if (!good) shake = 5;
      sfx(good ? "good" : "bad");
    } else if (!r.hit && Math.abs(run.x - r.x) < r.w / 2 + 6 && (r.hit = blocked()) === false) {
      r.hit = true;
      const lose = Math.ceil((P("devour") ? r.n / 2 : r.n) * (B ? B.runLose : 1));
      run.swords -= lose;
      floatText(run.x, run.y - 18, `−${lose}`, "#ff6b6b", true);
      sfx("bad");
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
    sfx("arrive");
  }
}
function showRunFail() {
  player.swords = 0; stats.dealt = 0;
  const reward = settle(false, "C", true);
  screenEl.innerHTML = `<div class="panel">
    <h1>飛劍耗盡…</h1>
    <div class="result">飛劍被吃光了，到不了渡劫台。<br>下次閃開紫色妖群、沒把握打碎的封印石，或多穿幾道加乘門。</div>
    ${reward}
    ${endButtons()}
  </div>`;
  screenEl.classList.remove("hidden");
  bindEndButtons();
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

const ELITE_PAL = { k: "#1b1424", R: "#8a2a2a", r: "#c2443a", H: "#e0a050", E: "#ffe066", W: "#e9e2ff" };
const ELITE = sprite([
  "...H........H...",
  "...HH......HH...",
  "....HkkkkkkH....",
  "...kRRRRRRRRk...",
  "..kRREkRRkERRk..",
  "..kRRRRRRRRRRk..",
  "..kRRkWkkWkRRk..",
  ".kkRRRRRRRRRRkk.",
  "kRrkRRRRRRRRkrRk",
  "kRrkRRrrrrRRkrRk",
  ".kk.kRRRRRRk.kk.",
  "....kRRkkRRk....",
  "....kkk..kkk....",
], ELITE_PAL);
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
      const split = r.pick >= 0 ? r.splitAt : gateSplit(r);
      r.gates.forEach((g, i) => {
        const x0 = i === 0 ? -ROAD : split, w = i === 0 ? split + ROAD : ROAD - split;
        const good = isGood(g), picked = r.pick === i, faded = r.pick >= 0 && !picked;
        const col = good ? "95,208,255" : "255,80,70";
        ctx.globalAlpha = faded ? 0.25 : 1;
        ctx.fillStyle = `rgba(${col},${picked ? 0.15 : 0.32})`; ctx.fillRect(x0 + 3, r.y - 22, w - 6, 22);
        ctx.fillStyle = `rgb(${col})`; ctx.fillRect(x0 + 3, r.y - 24, w - 6, 2);
        ctx.fillStyle = "#5c5478"; ctx.fillRect(x0 + 1, r.y - 26, 4, 28); ctx.fillRect(x0 + w - 5, r.y - 26, 4, 28);
        ctx.font = `900 ${w < 60 ? 12 : 15}px 'Noto Sans TC', sans-serif`; ctx.textAlign = "center";
        ctx.fillStyle = "#1b1424"; ctx.fillText(`${g.op}${g.v}`, x0 + w / 2 + 1, r.y - 6);
        ctx.fillStyle = good ? "#e6f8ff" : "#ffd0cc"; ctx.fillText(`${g.op}${g.v}`, x0 + w / 2, r.y - 7);
        ctx.globalAlpha = 1;
      });
      if (r.move && r.pick < 0) { // 提示：這道門會動
        ctx.fillStyle = "#ffe066"; ctx.font = "bold 9px 'Noto Sans TC', sans-serif";
        ctx.fillText("◀ ▶", split, r.y - 30);
      }
    } else if (r.type === "lotus") {
      if (r.taken) continue;
      const glow = 0.5 + Math.sin(time * 4) * 0.25;
      ctx.fillStyle = `rgba(255,224,102,${glow * 0.25})`; ctx.fillRect(-ROAD, r.y - 20, ROAD * 2, 20);
      ctx.fillStyle = `rgba(255,224,102,${glow})`; ctx.fillRect(-ROAD, r.y - 2, ROAD * 2, 2);
      for (let i = 0; i < 5; i++) { // 蓮花
        const a = -Math.PI / 2 + (i - 2) * 0.5;
        ctx.fillStyle = i % 2 ? "#ffb3d1" : "#ffd6e7";
        ctx.beginPath(); ctx.ellipse(Math.cos(a) * 6, r.y - 12 + Math.sin(a) * 6, 3, 7, a + Math.PI / 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = "#ffe066"; ctx.fillRect(-2, r.y - 14, 4, 4);
      ctx.font = "900 12px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
      ctx.fillStyle = "#1b1424"; ctx.fillText("機 緣", 1, r.y - 27);
      ctx.fillStyle = "#ffe066"; ctx.fillText("機 緣", 0, r.y - 28);
    } else if (r.type === "elite") {
      if (r.hp <= 0) continue;
      const k2 = r.hp / r.max, bob = Math.sin(time * 3) * 1.5;
      ctx.fillStyle = "rgba(255,90,40,0.15)"; ctx.fillRect(-ROAD, r.y - 6, ROAD * 2, 6);
      ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.beginPath(); ctx.ellipse(0, r.y, 26, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(-16, r.y - 28 + bob); ctx.scale(2, 2); ctx.drawImage(ELITE, 0, 0); ctx.restore();
      ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(-36, r.y - 44, 72, 6);
      ctx.fillStyle = "#ff6a3a"; ctx.fillRect(-35, r.y - 43, 70 * k2, 4);
      ctx.font = "900 11px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
      ctx.fillStyle = "#1b1424"; ctx.fillText(`守關妖將 ${Math.ceil(r.hp)}`, 1, r.y - 48);
      ctx.fillStyle = "#ffb08a"; ctx.fillText(`守關妖將 ${Math.ceil(r.hp)}`, 0, r.y - 49);
      ctx.fillStyle = "#ffe066"; ctx.font = "bold 9px 'Noto Sans TC', sans-serif"; ctx.fillText(`斬殺 +${bountyOf(r.reward)} 再得機緣`, 0, r.y + 11);
    } else if (r.type === "seal") {
      if (r.hp <= 0) continue;
      const k2 = r.hp / r.max;
      ctx.fillStyle = "#1b1424"; ctx.fillRect(r.x - 22, r.y - 30, 44, 30);
      ctx.fillStyle = "#6f6888"; ctx.fillRect(r.x - 20, r.y - 28, 40, 26);
      ctx.fillStyle = "#8a83a6"; ctx.fillRect(r.x - 20, r.y - 28, 40, 4);
      ctx.fillStyle = `rgba(255,224,102,${0.5 + Math.sin(time * 4) * 0.3})`;
      ctx.fillRect(r.x - 1, r.y - 24, 2, 18); ctx.fillRect(r.x - 7, r.y - 16, 14, 2);
      if (k2 < 0.66) { ctx.fillStyle = "#1b1424"; ctx.fillRect(r.x - 14, r.y - 22, 2, 8); ctx.fillRect(r.x - 12, r.y - 14, 4, 2); }
      if (k2 < 0.33) { ctx.fillStyle = "#1b1424"; ctx.fillRect(r.x + 10, r.y - 26, 2, 10); ctx.fillRect(r.x + 6, r.y - 16, 4, 2); }
      ctx.font = "900 11px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
      ctx.fillStyle = "#1b1424"; ctx.fillText(`封印 ${Math.ceil(r.hp)}`, r.x + 1, r.y - 33);
      ctx.fillStyle = "#e9e2ff"; ctx.fillText(`封印 ${Math.ceil(r.hp)}`, r.x, r.y - 34);
      ctx.fillStyle = "#ffe066"; ctx.font = "bold 9px 'Noto Sans TC', sans-serif"; ctx.fillText(`打碎 +${bountyOf(r.reward)}`, r.x, r.y + 9);
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
  ctx.fillStyle = "#ffe0b0"; ctx.fillText(`${mode === "daily" ? "【每日渡劫】" : `【${REALMS[B ? B.realm : 0].n}期】`}飛劍 ×${run.swords}${run.shield ? `　金鐘罩 ×${run.shield}` : ""}`, W / 2, 42);
  if (time < 3.5 && viewState() === "run") {
    ctx.globalAlpha = Math.min(1, (3.5 - time) * 2);
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px 'Noto Sans TC', sans-serif";
    ctx.fillText("左右拖曳（或 A／D）選門", W / 2, H * 0.74);
    ctx.fillText("藍門加劍、紅門扣劍，閃開紫色妖群", W / 2, H * 0.74 + 22);
    ctx.fillText("靠近封印石會自動攻擊，打碎有獎勵", W / 2, H * 0.74 + 44);
    ctx.globalAlpha = 1;
  }
  if (flashT > 0) { ctx.fillStyle = `rgba(${flashColor},${Math.min(0.5, flashT * 2.5)})`; ctx.fillRect(0, 0, W, H); }
}
