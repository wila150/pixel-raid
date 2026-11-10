// 御劍渡劫（pixel-raid）— UI 管理：結算、主畫面、暫停選單、打王 HUD
"use strict";

// ───────── 結束 ─────────
const screenEl = document.getElementById("screen");
function end(win) {
  state = win ? "win" : "lose";
  sfx(win ? "win" : "lose");
  slowmo = 1.2;
  if (win) { burst(boss.x, boss.y, "#ffd84a", 60, 160, 1.2); burst(boss.x, boss.y, "#ff7a2e", 60, 120, 1.2); shake = 14; }
  setTimeout(() => showEnd(win), 1300);
}
// 結算：給修為、看有沒有突破、掉法寶或靈獸、記每日成績。回傳要顯示的文字（HTML）
function settle(win, rank, ranFail = false) {
  let gain = ranFail ? 15 : win ? Math.round(100 + player.swords * 0.5 + { S: 120, A: 80, B: 40, C: 0 }[rank]) : Math.round(stats.dealt / 10 + player.swords * 0.2);
  if (mode === "daily") gain = Math.round(gain / 2);
  const before = realmIdx();
  save.xiuwei += gain;
  const after = realmIdx();
  let html = `<div class="gain">修為 +${gain}</div>`;
  if (after > before) html += `<div class="breakthrough">突破！進入「${REALMS[after].n}期」<br><small>飛劍、生命、攻擊都變強了，但魔王也會更強</small></div>`;
  if (win && mode === "normal") {
    const pool = Object.keys(TREASURES).filter((k) => !TREASURES[k].max || (save.tr[k] || 0) < TREASURES[k].max);
    if (Math.random() < 0.7 && pool.length) {
      const k = pool[Math.floor(Math.random() * pool.length)];
      save.tr[k] = (save.tr[k] || 0) + 1;
      html += `<div class="drop">獲得法寶：<b>${TREASURES[k].n}</b> Lv.${save.tr[k]}<br><small>${TREASURES[k].d}</small></div>`;
    } else if (!save.pet) {
      const k = Math.random() < 0.5 ? "fox" : "crane";
      save.pet = k; save.petLv = 1;
      html += `<div class="drop">靈獸認主：<b>${PETS[k].n}</b><br><small>${PETS[k].d}</small></div>`;
    } else if (save.petLv < PET_MAX) {
      save.petLv++;
      html += `<div class="drop">靈獸成長：<b>${PETS[save.pet].n}</b> Lv.${save.petLv}</div>`;
    }
  }
  if (win && run && run.fromWorld) { // 世界王：多掉高級裝備
    const il = Math.floor(save.w.lv / 3) + 1;
    for (let i = 0; i < 3; i++) grantLoot(rollItem(1, il));
    questEvent("boss");
  }
  if (win && mode === "normal") {
    grantLoot(rollItem(rank === "S" || rank === "A" ? 1 : 0));
    if (Math.random() < 0.4) grantLoot(rollItem());
    const st = 10 + realmIdx() * 5; save.stone += st;
    html += `<div class="drop">靈石 +${st}</div>`;
  }
  html += lootHtml();
  if (mode === "daily") {
    const score = ranFail ? 0 : win ? Math.max(0, Math.round(3000 - time * 20 - stats.taken * 3)) + player.swords * 2 : Math.round(stats.dealt / 2);
    const k = todayKey(), old = save.daily[k] || 0;
    if (score > old) save.daily[k] = score;
    html += `<div class="drop">每日渡劫得分 <b>${score}</b>${score > old ? "（今日新紀錄！）" : `（今日最佳 ${old}）`}</div>`;
    lastShare = `萬劍仙途・每日渡劫 ${k}：${score} 分（飛劍 ${player.swords} 把${win ? `，${time.toFixed(1)} 秒渡劫成功` : ""}）`;
  }
  writeSave();
  return html;
}
let lastShare = "";
function endButtons() {
  return `<div class="btns"><button id="again" class="big">再挑戰</button>
    ${mode === "daily" ? `<button id="share" class="big alt">分享成績</button>` : ""}
    <button id="home" class="big alt">${run && run.fromWorld ? "回到仙界" : "回主畫面"}</button></div>`;
}
function bindEndButtons() {
  document.getElementById("again").onclick = () => (run && run.fromWorld ? startWorldBoss() : run && run.fromHunt ? startHunt() : start(mode));
  document.getElementById("home").onclick = () => (run && run.fromWorld ? enterWorld() : renderTitle());
  const sh = document.getElementById("share");
  if (sh) sh.onclick = async () => {
    try {
      if (navigator.share) await navigator.share({ text: lastShare });
      else { await navigator.clipboard.writeText(lastShare); sh.textContent = "已複製"; }
    } catch { /* 使用者取消分享 */ }
  };
}

function showEnd(win) {
  pad.classList.add("hidden");
  const t = time.toFixed(1);
  let rank = "C";
  if (win) {
    const score = stats.taken + time * 0.8;
    rank = score < 60 ? "S" : score < 110 ? "A" : score < 170 ? "B" : "C";
  }
  const reward = settle(win, rank);
  screenEl.innerHTML = `<div class="panel">
    <h1>${win ? "渡劫成功！" : "渡劫失敗…"}</h1>
    <div class="result">
      ${win ? `評價<br><span class="rank">${rank}</span><br>` : `石魔剩下 ${Math.ceil((boss.hp / boss.maxHp) * 100)}% 血量<br>`}
      飛劍 ${player.swords} 把　時間 ${t} 秒<br>受到傷害 ${stats.taken}　造成傷害 ${stats.dealt}　爆擊 ${stats.crits} 次
    </div>
    ${reward}
    ${endButtons()}
  </div>`;
  screenEl.classList.remove("hidden");
  bindEndButtons();
}
// 主畫面：只有一個按鈕，點了直接進仙界（其他東西都在遊戲畫面右上角）
function renderTitle() {
  if (typeof AUTH_ON !== "undefined" && AUTH_ON) { // 有登入系統：已登入就直接進仙界，不然到登入畫面
    if (!authReady) renderLoading("連線中…");
    else if (fbUser) { if (!inWorld) enterWorld(); else worldReturn(); } else renderLogin();
    return;
  }
  if (inWorld && W0 && save.w) { save.w.x = Math.round(W0.x); save.w.y = Math.round(W0.y); writeSave(); }
  inWorld = false;
  setPadLabels(false);
  pad.classList.add("hidden");
  state = "title";
  screenEl.innerHTML = `<div class="panel">
    <h1>萬劍<br>仙途</h1>
    <p class="sub">PIXEL RAID · 原型 v9.2</p>
    <div class="btns title-tap"><button id="world" class="big hero">${save.w ? `繼續冒險<small>Lv.${save.w.lv}・戰力 ${typeof cpTxt === "function" ? cpTxt() : totalCP()}</small>` : "開始冒險"}</button></div>
    <p class="keys">手機：左邊拖曳移動、右下按鈕出招<br>電腦：WASD 移動　滑鼠左鍵 普攻　Q 劍陣　E 天罰　空白 閃身　1 丹藥</p>
  </div>`;
  screenEl.classList.remove("hidden");
  document.getElementById("world").onclick = enterWorld;
}

// 畫面上的介面（不跟鏡頭移動）
function drawHud() {
  const s = DPR;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  // 魔王血條
  const bw = Math.min(W * 0.7, 520), bx = (W - bw) / 2, by = 14;
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(bx - 3, by - 3, bw + 6, 20);
  ctx.fillStyle = "#3a1a1a"; ctx.fillRect(bx, by, bw, 14);
  ctx.fillStyle = boss.phase >= 2 ? "#ff3a2a" : "#ff8a2e"; ctx.fillRect(bx, by, bw * (boss.hp / boss.maxHp), 14);
  ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.fillRect(bx, by, bw * (boss.hp / boss.maxHp), 4);
  ctx.fillStyle = "#fff"; ctx.fillRect(bx + bw / 2 - 1, by, 2, 14); // 50% 標記（第二階段）
  ctx.font = "bold 13px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
  const bname = `焚天石魔 ${["", "", "【暴走】", "【元神燃燒】"][boss.phase]}  ${boss.hp} / ${boss.maxHp}`;
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
  if (viewState() === "intro") {
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

// ───────── 暫停 ─────────
const pauseBtn = document.getElementById("pauseBtn");
const muteBtn = document.getElementById("muteBtn");
let pausedFrom = null;
const liveWorld = () => typeof NET_ON !== "undefined" && NET_ON && typeof fbUser !== "undefined" && !!fbUser; // 有登入連線：仙界不暫停
const viewState = () => (state === "paused" || state === "pick" ? pausedFrom : state);
const canPause = () => ["run", "hunt", "world", "intro", "play"].includes(state);
function pauseGame() {
  if (!canPause()) return;
  pausedFrom = state;
  state = "paused";
  keys.clear(); stick.id = null; runDrag.id = null;
  pad.classList.add("hidden");
  screenEl.innerHTML = `<div class="panel">
    <h1>${pausedFrom === "world" && liveWorld() ? "選單" : "暫停"}</h1>
    <div class="btns"><button id="resume" class="big">${pausedFrom === "world" && liveWorld() ? "回到遊戲" : "繼續"}</button><button id="home" class="big alt">${typeof AUTH_ON !== "undefined" && AUTH_ON ? "登出" : inWorld ? "回標題（會存檔）" : "放棄，回主畫面"}</button></div>
    <p class="sub">${pausedFrom === "world" && liveWorld() ? "連線中，遊戲不會暫停，小心附近的妖獸" : "按 Esc／P 也可以繼續"}</p>
    ${typeof screenSettingsHtml === "function" ? screenSettingsHtml() : ""}
  </div>`;
  screenEl.classList.remove("hidden");
  document.getElementById("resume").onclick = resumeGame;
  if (typeof bindScreenSettings === "function") bindScreenSettings();
  document.getElementById("home").onclick = () => (typeof AUTH_ON !== "undefined" && AUTH_ON ? logout() : renderTitle());
}
function resumeGame() {
  if (state !== "paused") return;
  state = pausedFrom;
  screenEl.classList.add("hidden");
  if (state === "intro" || state === "play" || state === "world") pad.classList.remove("hidden");
  last = performance.now();
}
window.addEventListener("keydown", (e) => {
  if (e.target && e.target.tagName === "INPUT") return;
  const k = e.key.toLowerCase();
  if (k === "escape" || (k === "p" && !(typeof inWorld !== "undefined" && inWorld))) { if (typeof ovKind !== "undefined" && ovKind) return; if (state === "world") { openMenu(); return; } if (state === "pick" && pausedFrom === "world") { worldReturn(); return; } state === "paused" ? resumeGame() : pauseGame(); }
  if (k === "m" && state !== "world") setMuted(!muted); // 仙界裡 M 是大地圖
});
document.addEventListener("visibilitychange", () => { if (document.hidden) pauseGame(); }); // 切到別的 App 自動暫停
pauseBtn.addEventListener("click", () => (state === "world" ? openMenu() : state === "paused" ? resumeGame() : pauseGame()));
muteBtn.addEventListener("click", () => setMuted(!muted));
function updateTopButtons() {
  pauseBtn.classList.toggle("hidden", !canPause());
  if (typeof setMuteIcon === "function") setMuteIcon(); else muteBtn.textContent = muted ? "🔇" : "🔊";
  updateWorldButtons();
}
// 所有按鈕點了都有聲音
screenEl.addEventListener("click", (e) => { if (e.target.closest("button")) sfx("click"); });
