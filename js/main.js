// 御劍渡劫（pixel-raid）— 遊戲主程式：狀態機（主畫面 → 跑酷 → 打王 → 結算，可暫停）與主迴圈
"use strict";

// ───────── 狀態切換 ─────────
function start(m = "normal") {
  mode = m;
  B = bonus();
  loot = [];
  resetRun();
  state = "run";
  screenEl.classList.add("hidden");
  pad.classList.add("hidden");
}
function startBoss(swords) {
  if (!B) B = bonus();
  reset();
  player.swords = Math.round(swords * (P("myriad") ? 1.5 : 1) * (B.uq.heart ? 1.3 : 1));
  state = "intro";
  introT = 2.8;
  screenEl.classList.add("hidden");
  pad.classList.remove("hidden");
}
// ───────── 主迴圈 ─────────
let last = performance.now();
function frame(now) {
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state === "paused" || state === "pick") {
    if (pausedFrom === "world" && liveWorld() && W0) { time += dt; updateWorld(dt); updateFx(dt); } // 連線中：開選單時仙界照常進行
    render(); pressed.clear(); padAct.clear(); requestAnimationFrame(frame); return;
  }
  if (hitstop > 0) { hitstop -= dt; render(); pressed.clear(); padAct.clear(); requestAnimationFrame(frame); return; }
  if (state === "intro") {
    introT -= dt;
    if (introT < 1.6 && introT + dt >= 1.6) {
      sfx("roar"); shake = 12; burst(boss.x, boss.y - 20, "#ff8a3d", 40, 150, 0.9); flashT = 0.15; flashColor = "255,120,40"; }
    if (introT <= 0) state = "play";
  } else if (state === "play") {
    time += dt;
    updatePlayer(dt);
    updateBoss(dt);
    updateHazards(dt);
    updateSwords(dt);
    updatePet(dt);
  } else if (state === "run") {
    time += dt;
    updateRun(dt);
  } else if (state === "runEnd") {
    time += dt;
    run.y -= RUN_SPEED * 0.35 * dt;
    run.endT -= dt;
    if (run.endT <= 0) { run.endT = 99; openPick("渡劫前的最後機緣", () => startBoss(run.swords)); }
  } else if (state === "world") {
    time += dt;
    updateWorld(dt);
  } else if (state === "worldDead") {
    time += dt;
  } else if (state === "hunt") {
    time += dt;
    updateHunt(dt);
  } else if (state === "huntFail" || state === "huntEnd") {
    time += dt;
  } else if (state === "runFail") {
    time += dt;
  } else if (slowmo > 0) {
    slowmo -= dt;
    dt *= 0.3;
  }
  updateFx(dt);
  render();
  updateTopButtons();
  updateBgm();
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
  if (params.has("pet")) { save.pet = params.get("pet"); save.petLv = 3; }
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
if (!params.has("run") && !params.has("demo")) renderTitle();
requestAnimationFrame(frame); // 啟動主迴圈
