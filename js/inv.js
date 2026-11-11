// 萬劍仙途 — v3.0 介面重構：暗黑式雙球 HUD、營地結界畫面、三段式背包、星盤迷霧大地圖、功能選單
// 全部畫在同一層 #ov（毛玻璃蓋在戰場上，戰場不消失）；點空白處或再按一次快捷鍵就收起來
"use strict";

// ───────── 滑鼠瞄準 ─────────
const mouseAim = () => !TOUCH && performance.now() - mouse.t < 4000;
function mouseTarget(max) { // 游標在世界裡的位置（最遠 max）
  const Z = 1.35, wx = cam.x + (mouse.x - W / 2) / (SCALE * Z), wy = cam.y + (mouse.y - H / 2) / (SCALE * Z);
  const a = Math.atan2(wy - W0.y, wx - W0.x), d = Math.min(max, Math.hypot(wx - W0.x, wy - W0.y));
  return { x: W0.x + Math.cos(a) * d, y: W0.y + Math.sin(a) * d };
}

// ───────── 營地結界、太極護罩、魂火（世界座標）─────────
function drawCamps() {
  for (const wp of WAYPOINTS) {
    const on = save.w.wp.includes(wp.id);
    if (wp.id !== "town") { // 結界光圈
      ctx.save();
      ctx.globalAlpha = on ? 0.16 : 0.07; ctx.fillStyle = "#ffe0a0";
      ctx.beginPath(); ctx.arc(wp.x, wp.y, CAMP_R, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = on ? 0.55 + Math.sin(time * 2) * 0.15 : 0.25; ctx.strokeStyle = "#ffd890"; ctx.lineWidth = 1; ctx.setLineDash([4, 3]); ctx.lineDashOffset = -time * 6;
      ctx.beginPath(); ctx.arc(wp.x, wp.y, CAMP_R, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      // 營火＋帳篷
      ctx.fillStyle = "#5a3a22"; ctx.fillRect(wp.x - 30, wp.y - 18, 16, 3);
      ctx.fillStyle = "#8a5a32"; ctx.beginPath(); ctx.moveTo(wp.x - 34, wp.y - 16); ctx.lineTo(wp.x - 22, wp.y - 32); ctx.lineTo(wp.x - 10, wp.y - 16); ctx.fill();
      ctx.fillStyle = "#3a2414"; ctx.fillRect(wp.x - 24, wp.y - 22, 4, 6);
      ctx.fillStyle = "#4a3020"; ctx.fillRect(wp.x + 20, wp.y - 10, 8, 2);
      const fl = Math.sin(time * 14) * 1.5;
      ctx.fillStyle = "#ff8a2e"; ctx.beginPath(); ctx.moveTo(wp.x + 20, wp.y - 10); ctx.lineTo(wp.x + 24, wp.y - 19 - fl); ctx.lineTo(wp.x + 28, wp.y - 10); ctx.fill();
      ctx.fillStyle = "#ffd84a"; ctx.beginPath(); ctx.moveTo(wp.x + 22, wp.y - 10); ctx.lineTo(wp.x + 24, wp.y - 15 - fl); ctx.lineTo(wp.x + 26, wp.y - 10); ctx.fill();
    }
    // 飛劍符文陣
    ctx.save(); ctx.translate(wp.x, wp.y);
    ctx.strokeStyle = on ? `rgba(150,225,255,${0.6 + Math.sin(time * 3) * 0.3})` : "rgba(150,150,170,0.35)"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(0, 0, 13, 6.5, 0, 0, Math.PI * 2); ctx.stroke();
    if (on) { ctx.rotate(time * 0.8); for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillStyle = "rgba(180,235,255,0.8)"; ctx.fillRect(7, -0.5, 5, 1); } }
    ctx.restore();
  }
  drawAltars();
  const g = W0.grave;
  if (g) { // 遺落的戰利品：魂火
    const y = g.y - 10 + Math.sin(time * 3) * 2;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(140,200,255,0.35)"; ctx.beginPath(); ctx.arc(g.x, y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(200,235,255,0.9)"; ctx.beginPath(); ctx.arc(g.x, y, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.font = "bold 6px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#bfe4ff"; ctx.fillText("遺落的戰利品", g.x, y - 10);
  }
}
function drawShield() {
  const p = W0;
  if (!(p.shield > 0)) return;
  ctx.save(); ctx.translate(p.x, p.y - 3);
  const a = Math.min(1, p.shield * 2);
  ctx.globalAlpha = 0.18 * a; ctx.fillStyle = "#e8f4ff"; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.75 * a; ctx.strokeStyle = "#f4e6c0"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.stroke();
  ctx.rotate(time * 1.5); ctx.globalAlpha = 0.35 * a; // 太極
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, 6, -Math.PI / 2, Math.PI / 2); ctx.arc(0, 3, 3, Math.PI / 2, -Math.PI / 2, true); ctx.arc(0, -3, 3, Math.PI / 2, -Math.PI / 2); ctx.fill();
  ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(0, 0, 6, Math.PI / 2, -Math.PI / 2); ctx.arc(0, -3, 3, -Math.PI / 2, Math.PI / 2, true); ctx.arc(0, 3, 3, -Math.PI / 2, Math.PI / 2); ctx.fill();
  ctx.restore();
}

// ───────── 暗黑式雙球（螢幕座標）─────────
let orbBadLogged = false;
function drawOrb(cx, cy, R, f, c1, c2, rim) {
  if (!isFinite(f)) { // 企劃 48 ERR_LOG：剛進世界前幾幀有 NaN，記一次是誰傳的
    if (!orbBadLogged && typeof errCatch === "function") { orbBadLogged = true; errCatch(new Error(`drawOrb f=${f} hp=${W0 && W0.hp}/${W0 && W0.maxHp} en=${W0 && W0.en} es=${W0 && W0.es}/${B && B.maxEs} mp=${W0 && W0.mp}/${B && B.maxMp}`), "orb"); }
    f = 0;
  }
  if (!isFinite(cx) || !isFinite(cy) || !isFinite(R)) return;
  f = clamp(f, 0, 1);
  ctx.save();
  ctx.fillStyle = "rgba(10,8,14,0.72)"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, R - 2, 0, Math.PI * 2); ctx.clip();
  const top = cy + R - f * 2 * R, g = ctx.createLinearGradient(0, top, 0, cy + R);
  g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g;
  ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.moveTo(cx - R, cy + R);
  for (let x = -R; x <= R; x += 3) ctx.lineTo(cx + x, top + Math.sin(x * 0.12 + time * 3) * 2);
  ctx.lineTo(cx + R, cy + R); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 0.18; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(cx - R * 0.3, cy - R * 0.45, R * 0.42, R * 0.22, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = rim; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
}
let atkRect = null, atkRectT = 0;
// 企劃 15 第 9 節：連段發光（下一下會變強的招式，按鈕外框亮）
function comboGlow() {
  const p = W0, g = { attack: false, spin: false };
  if (!p || typeof triOf !== "function") return g;
  const wt = curWeapon(), ta = triOf(wt, "a");
  if (ta === "dance" && p.danceWt === wt && (p.danceN || 0) === 2) g.attack = true; // 劍舞第 3 下
  if (ta === "inch" && p.inchWt === wt && (p.inchN || 0) === 4) g.attack = true; // 寸勁第 5 拳
  if (p.sureT > 0 || p.lbReady) { g.attack = true; g.spin = true; } // 乘勢必爆、時之沙漏切武器加倍
  if (p.dash2T > 0 && wt === "fist") g.spin = true; // 連環衝可以再衝
  return g;
}
let comboLast = "";
function drawOrbs() {
  const p = W0, padOn = !pad.classList.contains("hidden") && getComputedStyle(pad).display !== "none";
  let R = clamp(Math.min(W, H) * 0.11, 34, 56);
  // 左下：生命血球
  const hx = SAFE.l + R + 14, hy = H - R - 18;
  drawOrb(hx, hy, R, p.hp / p.maxHp, "#c8282c", "#5a0a10", p.hp / p.maxHp < 0.3 ? `rgba(255,90,80,${0.6 + Math.sin(time * 8) * 0.4})` : "rgba(200,150,120,0.55)");
  if (B.maxEs > 0) { // 能量護盾：血球外圍半透明淡藍外殼
    const ef2 = clamp((p.es || 0) / B.maxEs, 0, 1);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(hx, hy, R * 0.85, hx, hy, R + 9);
    g.addColorStop(0, "rgba(120,200,255,0)"); g.addColorStop(0.7, `rgba(120,200,255,${0.35 * ef2})`); g.addColorStop(1, "rgba(120,200,255,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, R + 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(170,225,255,${0.4 + 0.5 * ef2})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy, R + 4, Math.PI / 2, Math.PI / 2 + Math.PI * 2 * ef2); ctx.stroke();
    ctx.restore();
    ctx.font = "bold 9px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#bfe6ff"; ctx.fillText(`護盾 ${Math.ceil(p.es || 0)}`, hx, hy - R - 8);
  }
  ctx.textAlign = "center"; ctx.font = "bold 11px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#f2dede";
  ctx.fillText(`${Math.ceil(p.hp)}`, hx, hy + 2); ctx.font = "8px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#c8a8a8"; ctx.fillText(`/ ${p.maxHp}`, hx, hy + 12);
  // 右下：真氣球（企劃 69 A：天罰能量拿掉）
  let ex = W - SAFE.r - R - 14, ey = H - R - 18;
  if (padOn) {
    if (!atkRect || time - atkRectT > 1) { const b = pad.querySelector(".btn-atk"); atkRect = b && b.getBoundingClientRect(); atkRectT = time; }
    if (atkRect && atkRect.width) { ex = atkRect.left + atkRect.width / 2; ey = atkRect.top + atkRect.height / 2; R = atkRect.width / 2; }
  }
  const ef = clamp((p.mp || 0) / (B.maxMp || 1), 0, 1), full = false;
  if (full) { // 集滿：金色火焰＋電光
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + time * 0.6, fl = R * (0.22 + 0.14 * Math.abs(Math.sin(time * 9 + i * 1.7)));
      ctx.fillStyle = i % 2 ? "rgba(255,170,40,0.55)" : "rgba(255,225,110,0.6)";
      ctx.beginPath(); ctx.moveTo(ex + Math.cos(a - 0.12) * R, ey + Math.sin(a - 0.12) * R); ctx.lineTo(ex + Math.cos(a) * (R + fl), ey + Math.sin(a) * (R + fl)); ctx.lineTo(ex + Math.cos(a + 0.12) * R, ey + Math.sin(a + 0.12) * R); ctx.fill();
    }
    if (Math.random() < 0.35) {
      ctx.strokeStyle = "rgba(255,245,190,0.9)"; ctx.lineWidth = 1.2; ctx.beginPath();
      let a = Math.random() * Math.PI * 2, r = R; ctx.moveTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r);
      for (let k = 0; k < 4; k++) { a += rand(-0.3, 0.3); r += rand(4, 8); ctx.lineTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r); }
      ctx.stroke();
    }
    ctx.restore();
  }
  { const dry = p.dryT > 0, fl = dry && Math.sin(time * 14) > 0; drawOrb(ex, ey, R, ef, dry ? (fl ? "#6a7488" : "#4a5468") : "#3a78e8", dry ? "#1a1e28" : "#0a1848", dry ? "rgba(160,170,190,0.6)" : "rgba(140,180,255,0.6)"); } // 企劃 70：乾涸變灰閃
  if (!padOn) { // 電腦：球上寫字＋左邊招式冷卻
    ctx.textAlign = "center"; ctx.font = "bold 11px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#d8e4ff";
    ctx.fillText(`${Math.floor(p.mp || 0)}`, ex, ey + 2); ctx.font = "8px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#a8b8d8"; ctx.fillText(`/ ${B.maxMp}`, ex, ey + 12);
    const sk = [["左鍵", WSKILL.attack.n, "attack"], ["Q", WSKILL.spin.n, "spin"], ["E", WSKILL.ult.n, "ult"], ["空白", WSKILL.roll.n || "閃身", "roll"]]; // 丹藥改在下方快捷道具欄（v5.8）
    let x = ex - R - 16 - sk.length * 50;
    const cg = comboGlow();
    for (const [k, n, id] of sk) {
      if (cg[id]) { const a = 0.55 + 0.45 * Math.sin(performance.now() / 80); ctx.save(); ctx.shadowColor = "#ffd84a"; ctx.shadowBlur = 12; ctx.strokeStyle = `rgba(255,224,102,${a})`; ctx.lineWidth = 2.5; ctx.strokeRect(x - 1.5, H - 51.5, 49, 33); ctx.restore(); }
      const f = p.cds[id] / Math.max(0.01, cdFull(id)), lack = !mpCan(p, ((id === "attack" && WSKILL.attack.mpS ? atkMpNow() : WSKILL[id].mp) || 0) * ((B.skMp && B.skMp[id]) || 1) * (1 - (B.mpCut || 0)));
      { const sl = { attack: "a", spin: "q", ult: "e", roll: "r" }[id], sk = typeof slotSkill === "function" ? slotSkill(sl) : null; // 使用者畫的技能圖示（企劃 33）
        if (sk && sk !== "over" && sk !== "origin" && sk !== "uq" && typeof icoHas === "function") { const key = sl === "r" ? "r:" + (sk === "base" ? "" : sk) : `${curWeapon()}:${slotCls(sl)}:${sk === "base" ? "" : sk}`; ctx.globalAlpha = f > 0 || lack ? 0.45 : 1; icoDrawS(ctx, "skill", key, x + 7, H - 84, 32, 32); ctx.globalAlpha = 1; } }
      ctx.fillStyle = "rgba(14,12,18,0.72)"; ctx.fillRect(x, H - 50, 46, 30);
      if (f > 0) { ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(x, H - 50, 46, 30 * clamp(f, 0, 1)); }
      ctx.strokeStyle = "rgba(200,170,120,0.35)"; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, H - 49.5, 45, 29);
      ctx.fillStyle = lack ? "#6a6070" : "#e8dcc0"; ctx.font = "bold 10px 'Noto Sans TC', sans-serif"; ctx.fillText(n, x + 23, H - 36);
      if (id === "roll" && p.wCh !== undefined) { ctx.fillStyle = p.wCh ? "#9fe8ff" : "#6a6070"; ctx.font = "bold 9px 'Noto Sans TC', sans-serif"; ctx.fillText("×" + p.wCh, x + 39, H - 43); } // 凌波剩幾次
      ctx.fillStyle = "#9a8e78"; ctx.font = "8px 'Noto Sans TC', sans-serif"; ctx.fillText(k, x + 23, H - 25);
      x += 50;
    }
  }
  if (padOn) { const cg = comboGlow(), key = (cg.attack ? "a" : "") + (cg.spin ? "s" : ""); if (key !== comboLast) { comboLast = key; pad.querySelector('[data-act="attack"]').classList.toggle("combo", cg.attack); pad.querySelector('[data-act="spin"]').classList.toggle("combo", cg.spin); } }
  const ub = pad.querySelector('[data-act="ult"]');
  if (ub && ub.classList.contains("ready")) ub.classList.remove("ready"); // 企劃 69 A：E 改成冷卻轉圈（world.js 按鈕冷卻那段）
}

// ───────── 覆蓋層 #ov ─────────
const ov = document.createElement("div");
ov.id = "ov"; ov.className = "ov hidden";
document.body.appendChild(ov);
let ovKind = null, ovJust = false, ovMsg = "", ovSw = false;
// 企劃 15：介面種類 → 右上快捷分頁、標題
const OV_TAB = { tree: "tree", bag: "bag", char: "ap", skill: "skill", quest: "quest", map: "map", social: "social", rank: "rank", rift: "rift" };
const OV_NAME = { tree: "天賦樹", bag: "行囊", char: "角色", skill: "技能", quest: "任務", map: "星盤", social: "聊天", rank: "排行", rift: "秘境", menu: "設定" };
function ovOpen(kind) {
  padHeld.clear();
  if (!(state === "world" || (state === "pick" && pausedFrom === "world"))) return false;
  pausedFrom = "world"; state = "pick";
  keys.clear(); stick.id = null; mouse.down = false; pad.classList.add("hidden"); screenEl.classList.add("hidden");
  ovKind = kind; ovJust = true; setTimeout(() => { ovJust = false; }, 0);
  ov.className = `ov k-${kind}${ovSw ? " show" : ""}`; if (!ovSw) requestAnimationFrame(() => ov.classList.add("show"));
  ovBar();
  return true;
}
function ovClose() {
  if (!ovKind) return;
  ovKind = null; eqSel = null; mapSel = null;
  if (typeof qTab !== "undefined" && !ovSw) qTab = null;
  ov.classList.remove("show");
  setTimeout(() => { if (!ovKind) { ov.className = "ov hidden"; ov.innerHTML = ""; } }, 220);
  if (state === "pick" && pausedFrom === "world") worldReturn();
  ovBar();
}
// 直接換頁（不用先關）：快捷分頁、快捷鍵都走這裡
function ovGo(q) {
  if (ovKind) { if (OV_TAB[ovKind] === q) return; ovSw = true; ovClose(); }
  if (state === "world") { if (q === "map") { sfx("click"); openStarMap(); } else if (q === "social") { sfx("click"); openSocial(); } else if (q === "rift") { sfx("click"); renderRift(); } else openHud(q); }
  ovSw = false;
}
// 標題列：開介面時 #topbar 變成整條（標題＋分頁＋大 ✕），內容從標題列下面開始
const ovTitle = document.createElement("span"); ovTitle.id = "ovTitle";
const ovX = document.createElement("button"); ovX.id = "ovX"; ovX.className = "tbtn"; ovX.setAttribute("aria-label", "關閉"); ovX.innerHTML = "✕";
document.getElementById("topbar").prepend(ovTitle); document.getElementById("topbar").appendChild(ovX);
ovX.addEventListener("click", (e) => { e.stopPropagation(); sfx("click"); ovClose(); });
function ovBar() {
  document.body.classList.toggle("ovopen", !!ovKind);
  ovTitle.textContent = ovKind ? OV_NAME[ovKind] || "" : "";
  const inMore = !!ovKind && (ovKind === "more" || !QUICK.some(([k]) => k === OV_TAB[ovKind])); // 「更多」裡的頁面：亮「更多」
  document.querySelectorAll("#quick .qbtn").forEach((b) => b.classList.toggle("on", b.dataset.q === "more" ? inMore : !!ovKind && OV_TAB[ovKind] === b.dataset.q));
}
// 子視窗（選中的物品、星盤選的點、數值說明、離開確認）：返回鍵先關這些
function ovSub() {
  if (exitAsk) { exitAskClose(); return true; }
  if (ovKind === "bag" && (eqSel || propSel)) { eqSel = null; propSel = null; renderEquip(); return true; }
  if (ovKind === "map" && mapSel) { mapSel = null; openStarMap(); return true; }
  if (ovKind === "tree" && trSel) { trSel = null; renderTree(); return true; }
  if (ovKind === "char" && typeof chHelp !== "undefined" && chHelp) { chHelp = null; renderChar(); return true; }
  if (ovKind === "skill" && typeof triPool !== "undefined" && triPool && typeof triPoolClose === "function") return triPoolClose(); // 企劃 69 B：招式池
  if (ovKind === "skill" && typeof triPick !== "undefined" && triPick && typeof gemPopClose === "function") return gemPopClose(); // 企劃 63：寶石彈窗
  return false;
}
// Android 返回鍵：最上面永遠留一筆「陷阱」紀錄，按返回 → 補回去，再關子視窗／介面／舊畫面；都沒有就問要不要離開
let histArmed = false, exitAsk = null, leaving = false;
function histArm() { if (histArmed || leaving || !inWorld) return; histArmed = true; history.pushState({ pr: 1 }, ""); }
["pointerdown", "keydown"].forEach((ev) => window.addEventListener(ev, histArm, true)); // 要在使用者操作時塞，Chrome 才不會跳過
window.addEventListener("popstate", () => {
  if (leaving || !histArmed) return;
  histArmed = false; histArm();
  if (ovSub()) return;
  if (ovKind) { sfx("click"); ovClose(); return; }
  if (state === "pick" && pausedFrom === "world") { worldReturn(); return; }
  if (state === "world" || state === "paused") exitAskOpen();
});
function exitAskOpen() {
  if (exitAsk) return;
  exitAsk = document.createElement("div"); exitAsk.id = "exitAsk";
  exitAsk.innerHTML = `<div class="exbox"><h3>要離開遊戲嗎？</h3><p>進度會自動存檔。</p><div class="acts row"><button id="exStay" class="gold">繼續玩</button><button id="exGo" class="red">離開</button></div></div>`;
  document.body.appendChild(exitAsk);
  exitAsk.querySelector("#exStay").onclick = () => { sfx("click"); exitAskClose(); };
  exitAsk.querySelector("#exGo").onclick = () => {
    writeSave(); if (typeof cloudFlush === "function") cloudFlush();
    leaving = true; exitAskClose();
    setTimeout(() => { history.go(histArmed ? -2 : -1); setTimeout(() => { if (document.visibilityState === "visible") { window.close(); leaving = false; histArmed = false; floatText(W0.x, W0.y - 30, "已存檔，可以直接關掉分頁", "#ffe9a0", true); } }, 600); }, 150);
  };
}
window.addEventListener("keydown", (e) => { if (exitAsk && e.key === "Escape") { e.stopImmediatePropagation(); exitAskClose(); } }, true);
function exitAskClose() { if (exitAsk) { exitAsk.remove(); exitAsk = null; } }
// 點到沒有字、沒有按鈕的地方 → 收起來
ov.addEventListener("click", (e) => {
  if (e.target.closest(".b2, .b2tip, .sellpop, .trwrap, button, input, form, .wset, .supslot, .fcard, .chatlog, .apbox, .defbox, .cardchip, .craft, .affs, .loot, .star, .cmp-item, .info, .tile, .bagwin, .eqwin, .setrow, .starmap, .gems, .stat, .chap, .chjob, .chhelp, .chme, .fashion, .btabs, .panel, .rmods, .rsum, .rbest, .evpick, h2, h3, p, b, small, img")) return;
  sfx("click"); ovClose();
});
const OV_KEYS = { bag: ["i", "escape"], map: ["m", "tab", "t", "escape"], menu: ["escape", "p"], social: ["escape", "g"], skill: ["escape", "n"], quest: ["escape", "y"], rank: ["escape", "r"] };
window.addEventListener("keydown", (e) => {
  if (e.target && e.target.tagName === "INPUT") return;
  const k = e.key.toLowerCase();
  if (!ovKind || ovJust || e.repeat) return;
  if (k === "tab") e.preventDefault();
  if (k === "escape" && ovSub()) return; // 子視窗先關
  if ((OV_KEYS[ovKind] || []).includes(k)) { ovClose(); return; }
  const sw = { p: "tree", i: "bag", b: "smith", l: "cards", c: "ap", o: "ap", n: "skill", y: "quest", m: "map", tab: "map", g: "social", r: "rank" }[k];
  if (sw && sw !== OV_TAB[ovKind]) ovGo(sw);
});

// ───────── 背包：左 星芒裝備位／中 瀑布流／右 詞條對比 ─────────
const EQ_CELL = { crown: [2, 1], ear: [4, 1], charm: [4, 2], robe: [1, 3], sword: [4, 3], ring: [1, 4], boots: [2, 5] }; // 坐騎在 [4, 5]
const MOUNT_CELL = [4, 5];
const STAR_POS = { sword: [-0.95, -0.2], crown: [0, -1], charm: [0.95, -0.2], robe: [-0.62, 0.86], boots: [0.62, 0.86] };
const statVal = (k, v) => (AFFIX[k].dec || k === "crit" ? Math.round(v * 10) / 10 : Math.round(v));
function cmpRows(sel, cur) {
  const a = itemStats(sel), b = cur && cur !== sel ? itemStats(cur) : null, keys2 = [...new Set([...Object.keys(a), ...(b ? Object.keys(b) : [])])];
  return keys2.map((k) => {
    const va = a[k] || 0, vb = b ? b[k] || 0 : null, d = b ? va - vb : 0, pct = AFFIX[k].pct ? "%" : "";
    const tag = !b || Math.abs(d) < 0.05 ? "" : d > 0 ? `<em class="up">+${statVal(k, d)}${pct} ↑</em>` : `<em class="down">${statVal(k, d)}${pct} ↓</em>`;
    return `<div class="stat${k === SLOTS[sel.slot].base ? " main" : ""}"><span>${AFFIX[k].n}</span><b>${va ? `+${statVal(k, va)}${pct}` : "—"}</b>${tag}</div>`;
  }).join("") + (sel.u ? `<div class="stat uq">${UNIQUES[sel.u].d}</div>` : "");
}
// 詞條分前綴／後綴列出（PoE）
function affHtml(it) {
  const ks = Object.keys(it.aff || {}).filter((k) => AFFIX[k]);
  const row = (k) => `<div class="aff ${AFFIX[k].t}"><em>${AFFIX[k].t === "p" ? "前綴" : AFFIX[k].t === "s" ? "後綴" : "舊"}</em>${fmtAff(k, it.aff[k])}<i>${affTier(k, it.aff[k], it.il)}</i></div>`;
  const pre = ks.filter((k) => AFFIX[k].t === "p"), suf = ks.filter((k) => AFFIX[k].t !== "p");
  return `<div class="affs">${pre.map(row).join("")}${suf.map(row).join("")}${!ks.length ? `<div class="dim">（白裝沒有詞條：拿去鐵匠鋪注入精髓）</div>` : ""}
    ${CARD_SLOTS.includes(it.slot) ? `<div class="rune${it.card ? " on" : ""}">◈ 卡片：${it.card ? `<b>${CARDS[it.card].n}</b>（${cardDesc(it.card)}）` : "空（到卡片頁插卡・L 鍵）"}</div>` : ""}</div>`;
}
// 武器組、超技能插槽、傳授插槽
function wsetHtml() {
  if (!save.w) return "";
  return `<div class="wset"><small>武器組（按 1／2／3 切換；放武器：點背包裡的武器 →「放到武器 N」）</small><div>${[0, 1, 2].map((i) => { const it = wsGet(i); return `<button class="wsc${i === save.w.wi ? " on" : ""}" data-wsw="${i}" style="--c:${it ? RARITY[it.q].c : "#444"}">${it ? itemIcon(it) : ""}<b>${i + 1}</b><small>${it ? dispName(it) : "空"}</small></button>`; }).join("")}</div></div>`;
}
function extraSlots(it) {
  let h = "";
  if (it === save.eq.sword) {
    const ss = Object.keys(save.sups || {}).filter((k) => save.sups[k] > 0);
    h += `<div class="supslot${it.sup ? " on" : ""}"><b>✦ 超技能插槽</b>${jobLv() < 2 ? `<small>二轉（Lv.30）解鎖</small>` : it.sup ? `<small style="color:${SUPERS[it.sup].c}">${SUPERS[it.sup].n}：${SUPERS[it.sup].d}</small><button data-supoff="1">拆下</button>` : `<small>空：${ss.length ? "點下面的超技能寶石插上" : "沒有超技能寶石（鐵匠鋪用碎屑換、世界王會掉）"}</small>`}
      ${jobLv() >= 2 && !it.sup ? ss.map((k) => `<button data-sup="${k}" style="color:${SUPERS[k].c}">${SUPERS[k].n} ×${save.sups[k]}<small>${SUPERS[k].d}</small></button>`).join("") : ""}</div>`;
  }
  if (it.slot === "sword" && save.bag.includes(it)) h += `<div class="acts row">${[0, 1, 2].map((i) => `<button data-wsset="${i}">放到武器 ${i + 1}</button>`).join("")}</div>`;
  return h;
}
let cardSel = null;
const atCamp = () => W0 && safeAt(W0.x, W0.y);
// 工藝台（右欄沒選裝備時）：碎屑換保底裝＋精髓、卡片庫存
function craftHtml() {
  const sh = save.shards || 0, camp = atCamp(), es = Object.keys(save.ess || {}).filter((k) => save.ess[k] > 0);
  return `<div class="craft"><h3>鐵匠工藝台</h3>${camp ? "" : `<p class="warn">回到安全營地（傳送點或青雲城）才能用工藝台、精煉</p>`}${econHtml(camp)}
    <div class="shards">天罰碎屑 <b>${sh}</b><small>斬妖會掉，精英、獵寶妖、世界王掉更多</small></div>
    <div class="exch">${SLOT_KEYS.filter(slotOpen).map((k) => `<div class="exrow"><span>${k === "sword" ? WEAPONS[curWeapon()].n : SLOTS[k].n}</span>
      <button data-ex="${k}:2" ${camp && sh >= SHARD_RARE ? "" : "disabled"} style="color:${RARITY[2].c}">保底紫裝<small>${SHARD_RARE}</small></button>
      <button data-ex="${k}:3" ${camp && sh >= SHARD_UNIQ ? "" : "disabled"} style="color:${RARITY[3].c}">保底傳說<small>${SHARD_UNIQ}</small></button></div>`).join("")}</div>
    <div class="exrow"><span>超技能</span><button data-buysup="1" ${camp && sh >= SUPER_COST ? "" : "disabled"} style="color:#ffe066">隨機超技能寶石<small>${SUPER_COST}</small></button></div>
    <h3>精髓 <small>${es.reduce((a, k) => a + save.ess[k], 0)}</small></h3>
    <div class="esslist">${es.map((k) => `<span class="ess">${essName(k)} ×${save.ess[k]}<small>${AFFIX[k].t === "p" ? "前綴" : "後綴"}・${AFFIX[k].n}</small></span>`).join("") || `<p class="dim">還沒有精髓。精英怪、獵寶妖、世界王會掉</p>`}</div>
    <p class="dim">用法：點一件白裝或藍裝 → 按精髓注入，直接變紫裝並保底洗出那條詞條</p></div>`;
}
// 行囊右欄沒選東西時：一句說明＋兩個小連結（企劃 26 §8：行囊只管東西）
function bagHint() {
  return `<div class="baghint"><p>點一件裝備看說明、穿上、比較戰力。</p><p class="dim">長按格子＝直接穿上</p>
    <div class="golinks"><button class="golink" data-go="smith">鐵匠鋪（B）›</button><button class="golink" data-go="cards">魔物卡片（L）›</button></div>
    <div class="bkmoney"><span>靈石 <b>${save.stone}</b></span><span>碎屑 <b>${save.shards || 0}</b></span></div></div>`;
}
function cardChips() {
  const cs = Object.keys(save.cards || {}).filter((c) => save.cards[c] > 0);
  if (!cs.length) return `<div class="cards0 dim">魔物卡片：還沒有（打怪很低機率掉，精英較高）</div>`;
  return `<div class="cardbox"><small>魔物卡片：拖到左上的武器或道袍（或點卡片再點裝備）</small>${cs.map((c) => `<div class="cardchip${cardSel === c ? " sel" : ""}" data-card="${c}">${ico("card", c, "cardico")}<b>${CARDS[c].n} ×${save.cards[c]}</b><small>${CARDS[c].slot === "sword" ? "武器" : "道袍"}・${cardDesc(c)}</small></div>`).join("")}</div>`;
}
function insertCard(c, slot) {
  const it = save.eq[slot];
  if (!it) return "那個位置沒有裝備";
  if (CARDS[c].slot !== slot) return `${CARDS[c].n}只能插在${CARDS[c].slot === "sword" ? "武器" : "道袍"}上`;
  const old = it.card;
  if (old) { // 26 §9：換卡＝先花靈石拔下舊卡（回收集冊），不再碎掉
    if (typeof atCamp === "function" && !atCamp()) return "回安全營地才能換卡（要先拔下舊卡）";
    const cost = cardPullCost(old); if (save.stone < cost) return `要 ${cost} 靈石才能拔下${CARDS[old].n}`;
    save.stone -= cost; save.cards[old] = (save.cards[old] || 0) + 1;
  }
  it.card = c; save.cards[c]--; if (!save.cards[c]) delete save.cards[c];
  cardSel = null; writeSave(); sfx("arrive"); if (typeof B !== "undefined" && W0) { B = worldStats(); W0.maxHp = B.maxHp; }
  return `${CARDS[c].n} 融進 ${it.name}${old ? `（${CARDS[old].n}拔下來放回收集冊，−${cardPullCost(old)} 靈石）` : ""}`;
}
function apHtml() {
  const w = save.w; if (!w) return "";
  const b = worldStats();
  return `<div class="defbox"><span>生命 <b>${b.maxHp}</b></span><span>能量護盾 <b>${b.maxEs}</b></span><span>物理減免 <b>${Math.round(physRed(b) * 100)}%</b></span>${ELES.map((e) => `<span${effRes(e, b) < 0 ? ' class="rneg"' : ""}>${RES_S[e]}抗 <b style="color:${effRes(e, b) < 0 ? "#ff6b6b" : effRes(e, b) >= RES_CAP ? "#ffd84a" : ""}">${Math.round(effRes(e, b) * 100)}%</b></span>`).join("")}<span>閃避 <b>${Math.round(b.dodge * 100)}%</b></span><span>法術壓制 <b>${Math.round(b.supp * 100)}%</b></span><span>攻速 <b>×${b.aspd.toFixed(2)}</b></span><span>爆擊 <b>${Math.round(b.crit * 100)}%</b></span></div>`;
}
function heroURL() { const g = gearKey().split(","), c = (typeof heroSprFor === "function" && heroSprFor(+g[0], +g[1], +g[2], g[3], 2)) || heroImg(false); return c.toDataURL ? c.toDataURL() : ""; } // 企劃 71 C：新圖正面
// 背包分頁＋格子（每格一件；道具分頁是丹藥、碎屑、精髓、寶石、超技能）
const BAG_TABS = [["all", "全部"], ["wpn", "武器"], ["arm", "防具"], ["acc", "飾品"], ["use", "道具"], ["mat", "素材"]];
let bagTab = "all", propSel = null, bagPt = "bag";
const PORTRAIT = () => window.matchMedia("(orientation: portrait) and (max-width: 700px)").matches;
const tabOf = (it) => (it.slot === "sword" ? "wpn" : it.slot === "charm" || (SLOTS[it.slot] && SLOTS[it.slot].acc) ? "acc" : "arm");
function propList() {
  const L = curList(), w = save.w;
  if (w.potions) L.push({ k: "pot", g: "丹", c: "#ff6a5a", n: w.potions, name: "回春丹", d: "按 1 吃，回血。血量低於 30% 會自動吃（設定裡可關）" });
  if (save.shards) L.push({ k: "shard", g: "屑", c: "#b8a6ff", n: save.shards, name: "碎屑", d: "分解裝備得到；鐵匠鋪用來換超技能寶石" });
  for (const k in save.ess || {}) if (save.ess[k] > 0) L.push({ k: "ess:" + k, g: "精", c: "#7fd890", n: save.ess[k], name: essName(k), d: `點選裝備後注入：保底「${AFFIX[k].n}」詞條，直接變紫裝（要在營地）` });
  for (const g in save.gems || {}) if (save.gems[g] > 0) { const [k, l] = g.split(":"); L.push({ k: "gem:" + g, g: "◆", c: GEMS[k].c, n: save.gems[g], name: gemName(g), d: `${GEM_TYPE}・${gemCol(g)[0]}・Lv.${gemReq(g)}${gemAttrNeed(g) ? `、${TR_ATTR[gemAttrNeed(g)[0]].n} ${gemAttrNeed(g)[1]}` : ""}${gemReqOk(g) ? "" : `（${gemNeedTxt(g)}）`}<br>${gemDesc(g)}<br>（技能 → 技能鏈，點那一招後面的空格串上去）` }); }
  for (const k in save.sups || {}) if (save.sups[k] > 0) L.push({ k: "sup:" + k, g: "✦", c: SUPERS[k].c, n: save.sups[k], name: SUPERS[k].n, d: SUPERS[k].d + "（二轉後點武器插上）" });
  return L;
}
function propInfo(k) { const p = propList().concat(matList()).find((x) => x.k === k); return p && `<div class="cmp-item"><div class="big-ico prop" style="--c:${p.c}">${propG(p)}</div><h3 style="color:${p.c}">${p.name}</h3><small>持有 ${p.n}</small><p class="sub">${p.d}</p></div>`; }
function bagCells(bag) {
  let cells;
  if (bagTab === "mat") cells = matList().map((p) => `<button class="bcell prop mat${propSel === p.k ? " sel" : ""}" data-prop="${p.k}" title="${p.name}" style="--c:${p.c}">${propG(p)}<span class="cnt">${p.n}</span></button>`);
  else if (bagTab === "use") cells = propList().map((p) => `<button class="bcell prop${propSel === p.k ? " sel" : ""}" data-prop="${p.k}" title="${p.name}" style="--c:${p.c}">${propG(p)}<span class="cnt">${p.n}</span></button>`);
  else cells = bag.filter((it) => bagTab === "all" || tabOf(it) === bagTab).map((it) => {
    const better = sameWt(it) && itemCP(it) > itemCP(save.eq[it.slot]);
    return `<div class="loot bcell q${it.q}${eqSel === it.id ? " sel" : ""}" data-id="${it.id}" title="${it.name}・戰 ${itemCP(it)}" style="--c:${RARITY[it.q].c}">${itemIcon(it)}${it.en ? `<span class="en">+${it.en}</span>` : ""}${reqTag(it)}${better ? '<em class="up">↑</em>' : ""}${it.risk ? '<em class="risk">!</em>' : ""}</div>`;
  });
  const n = Math.max(24, Math.ceil(cells.length / 6) * 6);
  while (cells.length < n) cells.push('<span class="bcell empty"></span>');
  return cells.join("");
}
function renderEquip(msg = "") {
  if (typeof tutEvent === "function") tutEvent("bag");
  if (ovKind !== "bag" && !ovOpen("bag")) return;
  if (msg) ovMsg = msg;
  const bag = save.bag.slice().sort((a, b) => b.q - a.q || itemCP(b) - itemCP(a));
  const selItem = eqSel && eqSel.startsWith("eq:") ? save.eq[eqSel.slice(3)] : save.bag.find((b) => b.id === eqSel);
  // 裝備視窗：人物在中間，格子圍一圈，空格寫部位名稱
  const eqCells = SLOT_KEYS.map((k) => {
    const it = save.eq[k], [cx, cy] = EQ_CELL[k], c = it ? RARITY[it.q].c : "#6a6078";
    if (!slotOpen(k)) return `<span class="eqc lock" style="grid-column:${cx};grid-row:${cy}" title="${SLOTS[k].n}（${slotLockTxt(k)}）"><b>🔒</b><small>${slotLockTxt(k)}</small></span>`;
    return `<button class="eqc${eqSel === "eq:" + k ? " sel" : ""}${it ? " on" : ""}${cardSel && CARDS[cardSel] && CARDS[cardSel].slot === k ? " cardok" : ""}" data-eq="${k}" title="${it ? it.name : SLOTS[k].n}" style="grid-column:${cx};grid-row:${cy};--c:${c}">${it ? itemIcon(it) + (it.en ? `<span class="en">+${it.en}</span>` : "") : `<small>${SLOTS[k].n}</small>`}</button>`;
  }).join("") + (typeof mountCell === "function" ? mountCell(MOUNT_CELL) : "");
  let right = bagHint();
  if (propSel && !selItem) right = propInfo(propSel) || right;
  if (selItem) {
    const worn = eqSel.startsWith("eq:"), cur = save.eq[selItem.slot], diff = itemCP(selItem) - itemCP(cur);
    right = `<div class="cmp-item">
      <div class="ilvl">物品等級 ${itLv(selItem)}${selItem.bt ? `・基底第 ${selItem.bt} 階` : ""}<br><small>${tierNote(selItem)}</small></div>
      <div class="big-ico" style="--c:${RARITY[selItem.q].c}">${itemIcon(selItem)}</div>
      <h3 style="color:${RARITY[selItem.q].c}">${dispName(selItem)}</h3>
      <small>${RARITY[selItem.q].n}・${selItem.slot === "sword" ? `${WEAPONS[wtOf(selItem)].n}（${WEAPONS[wtOf(selItem)].job}）` : SLOTS[selItem.slot].n}・物品等級 ${itLv(selItem)}${selItem.risk ? '・<span class="risk">未帶回</span>' : ""}</small>
      ${reqLine(selItem)}${selItem.cor ? `<div class="corline">已渡劫${selItem.jie ? `・劫紋：${AFFIX[selItem.jie].n}` : ""}（不能再用通貨改）</div>` : ""}
      <div class="cp">裝備評分 ${itemCP(selItem)}${worn || !cur ? "" : ` <em class="${diff >= 0 ? "up" : "down"}">${diff >= 0 ? "+" : ""}${diff} ${diff >= 0 ? "↑" : "↓"}</em>`}</div>
      ${!worn ? (() => { const now = totalCP(), nx = typeof cpIf === "function" ? cpIf(selItem) : now + itemCP(selItem) - itemCP(cur), d = nx - now, F = typeof fmtN === "function" ? fmtN : (x) => x; return `<div class="cpafter">穿上後戰力 ${F(now)} → <b class="${d > 0 ? "up" : d < 0 ? "down" : "same"}">${F(nx)}</b>（<b class="${d > 0 ? "up" : d < 0 ? "down" : "same"}">${d > 0 ? "+" : d < 0 ? "−" : "±"}${F(Math.abs(d))}</b>）</div>`; })() : ""}
      ${!worn && cur ? `<small class="vs">對比身上：<span style="color:${RARITY[cur.q].c}">${cur.name}</span></small>` : ""}
      ${affHtml(selItem)}${extraSlots(selItem)}${selItem.slot === "sword" ? wsetHtml() : ""}
      <div class="stats">${cmpRows(selItem, cur)}</div>
      <div class="acts">
        ${worn ? `<button id="unequip">卸下</button>` : `<button id="equip" class="gold">穿上</button><button id="sell" class="red">出售 +${sellPrice(selItem)}</button>`}
      </div>
      <div class="golinks"><button class="golink" data-go="smith">到鐵匠鋪強化 ›</button>${CARD_SLOTS.includes(selItem.slot) ? `<button class="golink" data-go="cards">插卡片 ›</button>` : ""}</div></div>`;
  }
  // 企劃 15 第 3-4 節＋26 §8：直向分頁「裝備｜背包」，點物品＝從下面滑出的說明面板
  const pt = PORTRAIT(), hasSel = !!(selItem || (propSel && propInfo(propSel)));
  if (bagPt === "craft") bagPt = "bag";
  ov.classList.toggle("pt", pt); ov.classList.toggle("pt-sheet", pt && hasSel);
  ["eq", "bag"].forEach((k) => ov.classList.toggle("pt-" + k, bagPt === k));
  const ptabs = pt ? `<div class="ptabs">${[["eq", "裝備"], ["bag", "背包"]].map(([k, n]) => `<button class="ptab${bagPt === k ? " on" : ""}" data-pt="${k}">${n}</button>`).join("")}</div>` : "";
  ov.innerHTML = `${ptabs}<div class="col l"><div class="eqwin"><div class="winhead">裝備</div><div class="eqgrid"><img class="eqhero" src="${heroURL()}" alt="">${eqCells}</div></div>
      <div class="info"><b>戰力 ${cpTxt()}</b><small>靈石 ${save.stone}・碎屑 ${save.shards || 0}・招式 ${WEAPONS[curWeapon()].job}</small></div>
      </div>
    <div class="col c"><div class="bagwin"><h2>行囊 <small>${save.bag.length} / ${BAG_MAX}</small></h2>
      <div class="btabs">${BAG_TABS.map(([k, n]) => `<button class="btab${bagTab === k ? " on" : ""}" data-bt="${k}">${n}</button>`).join("")}</div>
      <div class="bgrid">${bagCells(bag)}</div>
      <div class="bmoney"><span class="coin"></span><b>${save.stone}</b><small>靈石</small></div></div>
      <div class="acts row"><button id="autoEq" class="gold">一鍵換最強</button><button id="sellJunk">賣掉凡品、靈品</button></div></div>
    <div class="col r">${pt && hasSel ? `<button class="sheetbar" aria-label="收起說明"><i></i>收起</button>` : ""}${right}</div>
    ${ovMsg ? `<div class="toast">${ovMsg}</div>` : ""}`;
  ovMsg = "";
  bindEquip(selItem);
  cpRollRun();
}
// 穿上裝備：戰力數字滾動＋綠字（黑色沙漠式回饋）
let cpRoll = null;
const _equipItemCp = equipItem;
equipItem = function (it) { const a = totalCP(), r = _equipItemCp(it); const b = totalCP(); if (a !== b) cpRoll = { a, b }; return r; };
function cpRollRun() {
  if (!cpRoll) return;
  const { a, b } = cpRoll; cpRoll = null;
  const el = ov.querySelector(".info b"); if (!el) return;
  el.classList.add("cproll"); if (b < a) el.classList.add("down");
  const t0 = performance.now(), D = 700;
  const step = (t) => { if (!el.isConnected) return; const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3); const F = typeof fmtN === "function" ? fmtN : (x) => Math.round(x); el.textContent = `戰力 ${F(a + (b - a) * e)}${k >= 1 ? `（${b > a ? "+" : "−"}${F(Math.abs(b - a))}）` : ""}`; if (k < 1) requestAnimationFrame(step); else setTimeout(() => { if (el.isConnected) { el.classList.remove("cproll", "down"); el.textContent = `戰力 ${b}`; } }, 1600); };
  requestAnimationFrame(step);
}
function bindEquip(selItem) {
  const again = (m) => renderEquip(m);
  ov.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); const g = b.dataset.go; if (g === "smith") smSel = selItem || null; else if (g === "cards" && selItem && CARDS) cdSlot = selItem.slot; ovGo(g); }));
  bindEcon(again);
  ov.querySelectorAll("[data-pt]").forEach((b) => b.addEventListener("click", () => { sfx("click"); bagPt = b.dataset.pt; eqSel = null; propSel = null; again(); }));
  const sb = ov.querySelector(".sheetbar"); if (sb) sb.onclick = () => { sfx("click"); eqSel = null; propSel = null; again(); };
  ov.querySelectorAll("[data-bt]").forEach((b) => b.addEventListener("click", () => { sfx("click"); bagTab = b.dataset.bt; propSel = null; again(); }));
  ov.querySelectorAll("[data-prop]").forEach((b) => b.addEventListener("click", () => { sfx("click"); eqSel = null; propSel = propSel === b.dataset.prop ? null : b.dataset.prop; again(); }));
  ov.querySelectorAll(".loot").forEach((c) => {
    let t = null, long = false;
    c.addEventListener("pointerdown", () => { long = false; t = setTimeout(() => { long = true; const it = save.bag.find((b) => b.id === c.dataset.id); if (it) { if (!equipItem(it)) { again(`${SLOTS[it.slot].n}格要${slotLockTxt(it.slot)}`); return; } eqSel = null; again(`穿上了 ${it.name}`); } }, 450); });
    const stop = () => clearTimeout(t);
    c.addEventListener("pointerup", stop); c.addEventListener("pointerleave", stop); c.addEventListener("pointercancel", stop);
    c.addEventListener("contextmenu", (e) => e.preventDefault());
    c.addEventListener("click", () => { if (long) return; sfx("click"); propSel = null; eqSel = eqSel === c.dataset.id ? null : c.dataset.id; again(); });
  });
  ov.querySelectorAll(".eqc[data-eq]").forEach((b) => b.addEventListener("click", () => { sfx("click"); if (cardSel) { again(insertCard(cardSel, b.dataset.eq)); return; } eqSel = save.eq[b.dataset.eq] && eqSel !== "eq:" + b.dataset.eq ? "eq:" + b.dataset.eq : null; again(); }));
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = () => { sfx("click"); fn(); }; };
  on("equip", () => { if (!equipItem(selItem)) { again(`${SLOTS[selItem.slot].n}格要${slotLockTxt(selItem.slot)}`); return; } eqSel = null; again(`穿上了 ${selItem.name}`); });
  // 魔物卡片：拖曳到星芒裝備位，或點卡片再點裝備
  ov.querySelectorAll(".cardchip").forEach((c) => {
    c.addEventListener("pointerdown", (e) => {
      e.preventDefault(); const sx = e.clientX, sy = e.clientY; let ghost = null;
      const mv = (ev) => {
        if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) { ghost = c.cloneNode(true); ghost.className = "cardchip drag"; document.body.appendChild(ghost); }
        if (ghost) { ghost.style.left = ev.clientX + "px"; ghost.style.top = ev.clientY + "px"; }
      };
      const up = (ev) => {
        window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up);
        if (!ghost) { sfx("click"); cardSel = cardSel === c.dataset.card ? null : c.dataset.card; again(cardSel ? `選了${CARDS[cardSel].n}，點${CARDS[cardSel].slot === "sword" ? "武器" : "道袍"}插進去` : ""); return; }
        ghost.remove(); const t = document.elementFromPoint(ev.clientX, ev.clientY), st = t && t.closest(".eqc[data-eq]");
        if (st) again(insertCard(c.dataset.card, st.dataset.eq)); else again("拖到左上的武器或道袍上");
      };
      window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up);
    });
  });
  ov.querySelectorAll("[data-wsw]").forEach((b) => b.addEventListener("click", () => { sfx("click"); switchW(+b.dataset.wsw); again(); }));
  ov.querySelectorAll("[data-wsset]").forEach((b) => b.addEventListener("click", () => { sfx("good"); setWSlot(+b.dataset.wsset, selItem); eqSel = null; if (W0) { B = worldStats(); setPadLabels(true); } again(`放到武器 ${+b.dataset.wsset + 1}`); }));
  ov.querySelectorAll("[data-sup]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.sup; selItem.sup = k; save.sups[k]--; if (!save.sups[k]) delete save.sups[k]; writeSave(); sfx("arrive"); again(`插上超技能：${SUPERS[k].n}`); }));
  ov.querySelectorAll("[data-supoff]").forEach((b) => b.addEventListener("click", () => { addSup(selItem.sup); delete selItem.sup; writeSave(); again("拆下超技能寶石"); }));
  ov.querySelectorAll("[data-buysup]").forEach((b) => b.addEventListener("click", () => {
    if (!atCamp() || (save.shards || 0) < SUPER_COST) return;
    save.shards -= SUPER_COST; const k = Object.keys(SUPERS)[Math.floor(Math.random() * 3)]; addSup(k); writeSave(); sfx("win"); again(`換到超技能寶石：${SUPERS[k].n}`);
  }));
  // 一鍵配點
  const apAdd = (k, n) => { const w = save.w; n = Math.min(n, w.free); if (!n) return; w.free -= n; w.ap[k] += n; writeSave(); sfx("good"); if (W0) { B = worldStats(); W0.maxHp = B.maxHp; setPadLabels(true); } again(); };
  ov.querySelectorAll("[data-ap]").forEach((b) => b.addEventListener("click", () => apAdd(b.dataset.ap, 1)));
  ov.querySelectorAll("[data-ap5]").forEach((b) => b.addEventListener("click", () => apAdd(b.dataset.ap5, 5)));
  // 工藝台：碎屑兌換、精髓注入
  ov.querySelectorAll("[data-ex]").forEach((b) => b.addEventListener("click", () => {
    const [slot, q] = b.dataset.ex.split(":"), cost = +q === 3 ? SHARD_UNIQ : SHARD_RARE;
    if (!atCamp() || (save.shards || 0) < cost) return;
    if (!bagRoomAny()) { again("行囊和倉庫都滿了"); return; }
    save.shards -= cost; const it = shardItem(slot, +q); if (bagAdd(it) === "bag") eqSel = it.id; writeSave(); sfx("win");
    again(`兌換出 ${RARITY[it.q].n}・${it.name}！`);
  }));
  ov.querySelectorAll("[data-ess]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.ess; if (!atCamp() || !(save.ess[k] > 0) || !selItem) return;
    if (!essCraft(selItem, k)) { again("傳說裝不能注入精髓"); return; }
    save.ess[k]--; if (!save.ess[k]) delete save.ess[k]; writeSave(); sfx("arrive");
    if (W0) { B = worldStats(); W0.maxHp = B.maxHp; }
    again(`注入${essName(k)}：${selItem.name}`);
  }));
  on("unequip", () => {
    if (save.bag.length >= BAG_MAX) { again("行囊滿了，先賣掉一些"); return; }
    save.bag.push(selItem); delete save.eq[selItem.slot]; eqSel = null; writeSave(); again();
  });
  on("sell", () => { ungem(selItem); save.stone += sellPrice(selItem); save.bag = save.bag.filter((b) => b !== selItem); eqSel = null; writeSave(); again(`賣掉 ${selItem.name}，靈石 +${sellPrice(selItem)}`); });
  on("enh", () => {
    if ((selItem.en || 0) >= enMax(selItem)) { again(`已經 +${enMax(selItem)}，精煉到頂了`); return; }
    const c = enCost(selItem), nd = enhNeed(selItem);
    if (save.stone < c) { again("靈石不夠"); return; }
    if (nd && !matHas(nd)) { again(`精煉 +${(selItem.en || 0) + 1} 需要 ${matTxt(nd)}`); return; }
    if (nd && atCamp()) matUse(nd);
    save.stone -= c;
    if (!atCamp()) { save.stone += c; again("回營地才能精煉"); return; }
    if (Math.random() < EN_RATE[selItem.en || 0]) {
      selItem.en = (selItem.en || 0) + 1; nameItem(selItem); writeSave(); sfx("arrive");
      if (selItem.en >= 10 && typeof netAnnounce === "function") netAnnounce(`成功鍛造出 ${selItem.name}！`); // 全服流光廣播
      again(`精煉成功！${selItem.name}`);
    }
    else { writeSave(); sfx("hurt"); again(`精煉失敗⋯⋯靈石 −${c}（裝備沒事）`); }
  });
  bindCur(selItem, again);
  on("autoEq", () => {
    let n = 0;
    for (const k of SLOT_KEYS.filter(slotOpen)) {
      const best = save.bag.filter((b) => b.slot === k && sameWt(b)).sort((a, b) => itemCP(b) - itemCP(a))[0];
      if (best && itemCP(best) > itemCP(save.eq[k])) { equipItem(best); n++; }
    }
    eqSel = null; again(n ? `換上了 ${n} 件更強的裝備` : "身上已經是最強的了");
  });
  on("sellJunk", () => {
    const junk = save.bag.filter((b) => b.q <= 1 && sameWt(b) && itemCP(b) <= itemCP(save.eq[b.slot]));
    const gain = junk.reduce((s, b) => s + sellPrice(b), 0); junk.forEach(ungem);
    save.bag = save.bag.filter((b) => !junk.includes(b)); save.stone += gain; eqSel = null; writeSave();
    again(junk.length ? `賣掉 ${junk.length} 件，靈石 +${gain}（比身上好的會留著）` : "沒有可以賣的");
  });
  ov.querySelectorAll(".gsock").forEach((b) => b.addEventListener("click", () => {
    const w = save.eq.sword, g = w && w.so && w.so[+b.dataset.i];
    if (!g) return; addGem(g); w.so[+b.dataset.i] = null; writeSave(); again(`拆下 ${gemName(g)}`);
  }));
  ov.querySelectorAll(".gem").forEach((b) => b.addEventListener("click", () => {
    const w = save.eq.sword, g = b.dataset.g;
    if (!w) { again("先裝備一把武器"); return; }
    { const ec = eleClash(w, g); if (ec) { again(ec); return; } }
    { const rq = gemCantMsg(g); if (rq) { sfx("bad"); again(rq); return; } }
    w.so = w.so || []; const n = sockN();
    let i = -1; for (let j = 0; j < n; j++) if (!w.so[j]) { i = j; break; }
    if (i < 0) { again(`武器的孔都滿了（${n} 孔），點孔裡的寶石可以拆下`); return; }
    w.so[i] = g; save.gems[g]--; if (!save.gems[g]) delete save.gems[g]; writeSave(); sfx("good"); again(`鑲上 ${gemName(g)}`);
  }));
  ov.querySelectorAll(".gmerge").forEach((b) => b.addEventListener("click", (e) => {
    e.stopPropagation(); const g = b.dataset.g, [k, l] = g.split(":");
    if ((save.gems[g] || 0) < 3) return;
    save.gems[g] -= 3; if (!save.gems[g]) delete save.gems[g]; const ng = `${k}:${+l + 1}`; addGem(ng); writeSave(); sfx("arrive"); again(`合成出 ${gemName(ng)}！`);
  }));
}

// ───────── 戰爭迷霧：地圖切成 64×64 的格子，走過的地方記起來 ─────────
const FOG_C = 64, FOG_W = Math.ceil(TW * TS / FOG_C), FOG_H = Math.ceil(TH * TS / FOG_C);
let fogArr = null, fogT = 0;
function fogLoad() {
  const w = save.w; fogArr = new Uint8Array(FOG_W * FOG_H);
  if (w.fog && w.fog.length === fogArr.length) { for (let i = 0; i < fogArr.length; i++) fogArr[i] = w.fog.charCodeAt(i) === 49 ? 1 : 0; return; }
  if (w.fog && w.fog.length % FOG_H === 0 && w.fog.length / FOG_H < FOG_W) { // 地圖往東加寬：舊的迷霧一列一列搬過來
    const ow = w.fog.length / FOG_H;
    for (let y = 0; y < FOG_H; y++) for (let x = 0; x < ow; x++) fogArr[y * FOG_W + x] = w.fog.charCodeAt(y * ow + x) === 49 ? 1 : 0;
    fogSave(); return;
  }
  fogReveal(TOWN.x, TOWN.y, 4); // 舊存檔：城鎮和已點亮的營地附近先打開
  for (const wp of WAYPOINTS) if (w.wp.includes(wp.id)) fogReveal(wp.x, wp.y, 3);
  fogSave();
}
function fogReveal(x, y, r = 3) {
  const cx = Math.floor(x / FOG_C), cy = Math.floor(y / FOG_C); let ch = false;
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    if (i * i + j * j > r * r + 1) continue;
    const X = cx + i, Y = cy + j; if (X < 0 || Y < 0 || X >= FOG_W || Y >= FOG_H) continue;
    if (!fogArr[Y * FOG_W + X]) { fogArr[Y * FOG_W + X] = 1; ch = true; }
  }
  return ch;
}
function fogSave() { save.w.fog = Array.from(fogArr, (v) => (v ? "1" : "0")).join(""); }
function fogTick(dt) { // updateWorld 每幀呼叫
  if (!save.w) return;
  if (!fogArr) fogLoad();
  if ((fogT -= dt) > 0) return;
  fogT = 0.5;
  if (fogReveal(W0.x, W0.y, 3)) fogSave();
}
const fogSeen = (x, y) => { if (!fogArr) fogLoad(); const X = Math.floor(x / FOG_C), Y = Math.floor(y / FOG_C); return !!fogArr[Y * FOG_W + X]; };

// ───────── 星盤迷霧大地圖 ─────────
let mapSel = null, mapRaf = 0, mapTerrain = null, fogCvs = null;
const TILE_COL = { 1: null, 2: "#5a5560", 3: "#c8501e", 4: "#2a4a7a", 5: "#6a6478", 6: "#7a4a3a" };
function buildTerrain() { // 地形縮圖（一格一點），只做一次
  const c = document.createElement("canvas"); c.width = TW; c.height = TH;
  const g = c.getContext("2d"), img = g.createImageData(TW, TH);
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
    const t = wmap[y * TW + x], z = zoneAt(x * TS + 8, y * TS + 8);
    let col = hex(ZONES[z].g[0]);
    if (t === 1) col = col.map((v) => v * 0.6); else if (TILE_COL[t]) col = hex(TILE_COL[t]);
    const i = (y * TW + x) * 4; img.data[i] = col[0] * 0.8; img.data[i + 1] = col[1] * 0.8; img.data[i + 2] = col[2] * 0.8; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
}
const ZONE_BOSS = { town: "無（安全區）", grass: "精英小妖、狼妖首領", forest: "精英樹妖", waste: "精英石甲妖、獵寶妖", volcano: "焚天石魔 Lv.22（祭壇）", snow: "精英雪巨猿", swamp: "腐骨蟾王 Lv.50（祭壇）", thunder: "九雷鵬王 Lv.75（祭壇）", sky: "無相劍尊 Lv.110（祭壇）" };
function openTeleport() { openStarMap(); }
function openStarMap() {
  if (ovKind !== "map" && !ovOpen("map")) return;
  if (!mapTerrain) mapTerrain = buildTerrain();
  if (!fogArr) fogLoad();
  const s = mapSel && WAYPOINTS.find((wp) => wp.id === mapSel), safe = safeAt(W0.x, W0.y);
  const info = s ? `<div class="info rune-info"><h3>${s.n}${s.id === "town" ? "" : "營地"}</h3>
      <div class="stat"><span>妖獸等級</span><b>${s.id === "town" ? "—" : `Lv.${ZONES[s.id].lv.join("–")}`}</b></div>
      <div class="stat"><span>首領</span><b>${ZONE_BOSS[s.id]}</b></div>
      <div class="stat"><span>出沒</span><b>${s.id === "town" ? "丹師、秘境使者" : [...new Set(ZONES[s.id].mobs)].map((m) => WMOBS[m].n).join("、")}</b></div>
      <div class="stat"><span>掉落</span><b>${s.id === "town" ? "—" : `裝備・寶石・靈石（掉寶 ×${ZONE_LOOT[s.id]}）`}</b></div>
      <p class="dim">${safe ? "落地有太極護罩，營地結界內妖獸進不來" : "你在野外：御劍要原地凝神 3 秒，被打或移動會中斷"}</p>
      <button id="fly" class="fly">一鍵御劍傳送</button></div>`
    : `<div class="info"><h3>星盤</h3><p>發光的飛劍是已點亮的營地，點一下看資訊、御劍過去</p><p class="dim">黑霧是還沒去過的地方；走到營地附近就會點亮</p><p class="dim">點旁邊空白處、或再按一次 M 收起</p></div>`;
  ov.innerHTML = `<div class="col l">${info}</div><div class="col cr"><canvas class="starmap"></canvas></div>`;
  const cv = ov.querySelector(".starmap");
  cv.addEventListener("click", (e) => {
    const r = cv.getBoundingClientRect(), L = cv._L; if (!L) return;
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const hit = WAYPOINTS.find((wp) => save.w.wp.includes(wp.id) && Math.hypot(L.x + wp.x * L.s - mx, L.y + wp.y * L.s - my) < 18);
    if (hit) { sfx("click"); mapSel = hit.id; openStarMap(); }
  });
  const fly = document.getElementById("fly");
  if (fly) fly.onclick = () => { sfx("arrive"); flyTo(s); };
  cancelAnimationFrame(mapRaf);
  const loop = () => { if (ovKind !== "map" || !cv.isConnected) return; drawStarMap(cv); mapRaf = requestAnimationFrame(loop); };
  loop();
}
function flyTo(wp) {
  const safe = safeAt(W0.x, W0.y);
  ovClose();
  if (safe) {
    W0.x = wp.x; W0.y = wp.y + 22; cam.x = W0.x; cam.y = W0.y; W0.shield = 3; W0.recall = 0;
    burst(W0.x, W0.y, "#9fe8ff", 30, 100); burst(W0.x, W0.y, "#ffe9a0", 16, 60); bankLoot("御劍傳送");
  } else { W0.recall = 3; W0.recallTo = { x: wp.x, y: wp.y + 22 }; floatText(W0.x, W0.y - 26, `御劍前往${wp.n}：原地不動 3 秒`, "#9fe8ff", true); }
}
function drawStarMap(cv) {
  const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  if (cv.width !== Math.round(r.width * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
  const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cw = r.width, ch = r.height, s = Math.min((cw - 20) / (TW * TS), (ch - 20) / (TH * TS)), mw = TW * TS * s, mh = TH * TS * s, x0 = (cw - mw) / 2, y0 = (ch - mh) / 2;
  cv._L = { x: x0, y: y0, s };
  g.clearRect(0, 0, cw, ch);
  // 不規則卷軸邊：用很多圓角裁一個流線形
  g.save(); g.beginPath();
  for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2, wob = 1 + 0.025 * Math.sin(a * 5) + 0.015 * Math.sin(a * 11); { const c = Math.cos(a), sn = Math.sin(a); g.lineTo(cw / 2 + Math.sign(c) * Math.abs(c) ** 0.35 * mw * 0.515 * wob, ch / 2 + Math.sign(sn) * Math.abs(sn) ** 0.35 * mh * 0.52 * wob); } }
  g.closePath(); g.clip();
  g.imageSmoothingEnabled = false; g.globalAlpha = 0.9; g.drawImage(mapTerrain, x0, y0, mw, mh); g.globalAlpha = 1;
  // 迷霧：低解析度遮罩放大（自動柔邊），再疊一層慢慢飄的，看起來在翻滾
  const t = performance.now() / 1000, cs = FOG_C * s;
  if (!fogCvs) { fogCvs = document.createElement("canvas"); fogCvs.width = FOG_W + 2; fogCvs.height = FOG_H + 2; }
  const fg = fogCvs.getContext("2d"), id = fg.createImageData(FOG_W + 2, FOG_H + 2);
  for (let Y = -1; Y <= FOG_H; Y++) for (let X = -1; X <= FOG_W; X++) {
    const seen = X >= 0 && Y >= 0 && X < FOG_W && Y < FOG_H && fogArr[Y * FOG_W + X], i = ((Y + 1) * (FOG_W + 2) + X + 1) * 4;
    id.data[i] = 10; id.data[i + 1] = 7; id.data[i + 2] = 16; id.data[i + 3] = seen ? 0 : 245;
  }
  fg.putImageData(id, 0, 0);
  g.imageSmoothingEnabled = true;
  g.drawImage(fogCvs, x0 - cs * 1.5, y0 - cs * 1.5, cs * (FOG_W + 2), cs * (FOG_H + 2));
  g.globalAlpha = 0.5; g.drawImage(fogCvs, x0 - cs * 1.5 + Math.sin(t * 0.5) * cs * 0.35, y0 - cs * 1.5 + Math.cos(t * 0.4) * cs * 0.3, cs * (FOG_W + 2), cs * (FOG_H + 2)); g.globalAlpha = 1;
  // 霧上的怨氣漩渦
  g.globalCompositeOperation = "source-over";
  for (let i = 0; i < 14; i++) {
    const fx = x0 + ((hash(i) * mw + t * (6 + i)) % mw), fy = y0 + hash(i * 7.3) * mh;
    if (fogSeen((fx - x0) / s, (fy - y0) / s)) continue;
    g.fillStyle = `rgba(90,50,120,${0.12 + 0.08 * Math.sin(t + i)})`; g.beginPath(); g.ellipse(fx, fy, cs * 1.4, cs * 0.6, Math.sin(t * 0.3 + i), 0, Math.PI * 2); g.fill();
  }
  g.restore();
  g.strokeStyle = "rgba(190,160,110,0.35)"; g.lineWidth = 1; g.beginPath();
  for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2, wob = 1 + 0.025 * Math.sin(a * 5) + 0.015 * Math.sin(a * 11); { const c = Math.cos(a), sn = Math.sin(a); g.lineTo(cw / 2 + Math.sign(c) * Math.abs(c) ** 0.35 * mw * 0.515 * wob, ch / 2 + Math.sign(sn) * Math.abs(sn) ** 0.35 * mh * 0.52 * wob); } }
  g.closePath(); g.stroke();
  // 祭壇、魂火、飛劍符文、自己
  for (const k of RB_KEYS) { const R = RBOSS[k]; if (fogSeen(R.x, R.y)) { g.fillStyle = rbCool(k) > 0 ? "rgba(150,150,160,0.8)" : `rgba(${R.col},${0.6 + 0.3 * Math.sin(t * 4)})`; g.beginPath(); g.arc(x0 + R.x * s, y0 + R.y * s, 4, 0, Math.PI * 2); g.fill(); } }
  if (W0.grave) { g.fillStyle = "#bfe4ff"; g.beginPath(); g.arc(x0 + W0.grave.x * s, y0 + W0.grave.y * s, 3, 0, Math.PI * 2); g.fill(); }
  for (const wp of WAYPOINTS) {
    const on = save.w.wp.includes(wp.id), px = x0 + wp.x * s, py = y0 + wp.y * s;
    if (!on && !fogSeen(wp.x, wp.y)) continue;
    if (!on) { g.fillStyle = "rgba(150,140,160,0.5)"; g.beginPath(); g.arc(px, py, 3, 0, Math.PI * 2); g.fill(); continue; }
    const sel = mapSel === wp.id, gl = g.createRadialGradient(px, py, 0, px, py, sel ? 22 : 15);
    gl.addColorStop(0, `rgba(150,230,255,${0.55 + 0.2 * Math.sin(t * 3 + wp.x)})`); gl.addColorStop(1, "rgba(150,230,255,0)");
    g.fillStyle = gl; g.beginPath(); g.arc(px, py, sel ? 22 : 15, 0, Math.PI * 2); g.fill();
    g.save(); g.translate(px, py); g.rotate(-Math.PI / 4); // 飛劍符文
    g.fillStyle = "#e8f8ff"; g.beginPath(); g.moveTo(0, -9); g.lineTo(2, -2); g.lineTo(0.8, 5); g.lineTo(-0.8, 5); g.lineTo(-2, -2); g.closePath(); g.fill();
    g.fillStyle = "#ffd890"; g.fillRect(-3.5, 4, 7, 1.4); g.fillRect(-0.7, 5, 1.4, 3);
    g.restore();
    g.font = "bold 11px 'Noto Sans TC', sans-serif"; g.textAlign = "center"; g.fillStyle = sel ? "#ffe9a0" : "#cfe8f4"; g.fillText(wp.n, px, py + 20);
  }
  const ol = typeof othersList === "function" ? othersList() : [];
  g.fillStyle = "#7dff8a"; for (const o of ol) g.fillRect(x0 + o.x * s - 1.5, y0 + o.y * s - 1.5, 3, 3);
  g.fillStyle = "#fff"; g.beginPath(); g.arc(x0 + W0.x * s, y0 + W0.y * s, 3 + Math.sin(t * 5), 0, Math.PI * 2); g.fill();
}

// ───────── 右上快捷列（原本選單裡的功能直接放出來）＋齒輪設定 ─────────
// 企劃 26 §3：右上只留 7 顆最常用＋「⋯更多」（卡片、任務、手冊、聊天、排行、設定）
const QUICK = [["bag", "行囊", "I"], ["ap", "角色", "C"], ["skill", "技能", "N"], ["tree", "天賦", "P"], ["smith", "鐵匠", "B"], ["rift", "秘境", ""], ["map", "星盤", "M"], ["more", "更多", ""]];
const quickEl = document.getElementById("quick");
const qIco = (k) => { const ik = k === "map" ? "tp" : k; if ((k === "tree" || k === "smith" || k === "rift" || k === "more") && typeof icoHas === "function" && icoHas("ui", k)) return ico("ui", k, "qico2"); return typeof UI_ICON !== "undefined" && UI_ICON[ik] ? uiIcon(ik) : k === "social" ? "💬" : k === "tree" ? '<b class="qglyph">天</b>' : k === "skill" ? '<b class="qglyph">技</b>' : k === "quest" ? '<b class="qglyph">任</b>' : k === "rift" ? '<b class="qglyph">秘</b>' : k === "smith" ? '<b class="qglyph">鍛</b>' : k === "more" ? '<b class="qglyph">⋯</b>' : ""; };
quickEl.innerHTML = QUICK.map(([k, n, key]) => `<button class="qbtn" data-q="${k}" aria-label="${n}" title="${n}${key ? "（" + key + "）" : ""}">${qIco(k)}<small>${n}</small></button>`).join("");
quickEl.querySelectorAll(".qbtn").forEach((b) => b.addEventListener("click", () => {
  const m = b.dataset.q;
  if (state !== "world" && !ovKind) return;
  ovGo(m);
}));
function openMenu() {
  if (ovKind !== "menu" && !ovOpen("menu")) return;
  const w = save.w, ap = w.autoPot !== false, aa = !!w.autoAtk;
  ov.innerHTML = `<div class="col l"></div><div class="col c menu"><h2>設定</h2>
    <div class="setrow"><span>音效</span><button class="tab${!muted ? " on" : ""}" data-mu="0">開</button><button class="tab${muted ? " on" : ""}" data-mu="1">關</button></div>
    <div class="setrow"><span>背景音樂（每個地區不同）</span><button class="tab${A11.bgm ? " on" : ""}" data-bg="1">開</button><button class="tab${!A11.bgm ? " on" : ""}" data-bg="0">關</button></div>
    <h3>手機與閱讀</h3>
    <div class="setrow"><span>低階手機模式（解析度降低、特效減半、不畫花草、隊友特效關掉）</span><button class="tab${A11.low ? " on" : ""}" data-lw="1">開</button><button class="tab${!A11.low ? " on" : ""}" data-lw="0">關</button></div>
    <div class="setrow"><span>字體大小</span>${[["s", "小"], ["m", "中"], ["l", "大"]].map(([v, n]) => `<button class="tab${A11.font === v ? " on" : ""}" data-fz="${v}">${n}</button>`).join("")}</div>
    <div class="setrow"><span>色弱預警（危險範圍加閃爍白色虛線）</span><button class="tab${A11.cb ? " on" : ""}" data-cb="1">開</button><button class="tab${!A11.cb ? " on" : ""}" data-cb="0">關</button></div>
    <h3>防疲勞</h3>
    <div class="setrow"><span>血量低於 30% 自動吃丹藥</span><button class="tab${ap ? " on" : ""}" data-ap="1">開</button><button class="tab${!ap ? " on" : ""}" data-ap="0">關</button></div>
    <div class="setrow"><span>半自動朝最近的敵人割草</span><button class="tab${aa ? " on" : ""}" data-aa="1">開</button><button class="tab${!aa ? " on" : ""}" data-aa="0">關</button></div>
    <h3>掉落與畫面</h3>
    <div class="setrow"><span>掉落過濾（低於這個品質直接換成靈石）</span>${["全部顯示", "藏白裝", "藏白藍"].map((n, i) => `<button class="tab${(w.filt || 0) === i ? " on" : ""}" data-fl="${i}">${n}</button>`).join("")}</div>
    <div class="setrow"><span>隊友招式特效</span>${[["full", "全部"], ["dim", "淡化"], ["off", "關閉"]].map(([v, n]) => `<button class="tab${(w.allyFx || "dim") === v ? " on" : ""}" data-af="${v}">${n}</button>`).join("")}</div>
    <div class="setrow"><span>畫面方向</span><button class="tab${orient === "land" ? " on" : ""}" data-o="land">橫向</button><button class="tab${orient === "port" ? " on" : ""}" data-o="port">直向</button></div>
    <div class="acts row"><button id="logout" class="red">${typeof AUTH_ON !== "undefined" && AUTH_ON ? "登出" : "回標題（會存檔）"}</button></div>
    <p class="dim">${liveWorld() ? "連線中，遊戲不會暫停" : ""}　點空白處回到戰鬥</p></div><div class="col r"></div>`;
  const tog = (attr, fn) => ov.querySelectorAll(`[data-${attr}]`).forEach((b) => b.addEventListener("click", () => { sfx("click"); fn(b.dataset[attr]); writeSave(); openMenu(); }));
  tog("mu", (v) => { setMuted(v === "1"); });
  tog("bg", (v) => a11Set("bgm", v === "1"));
  tog("lw", (v) => a11Set("low", v === "1"));
  tog("fz", (v) => a11Set("font", v));
  tog("cb", (v) => a11Set("cb", v === "1"));
  tog("ap", (v) => { w.autoPot = v === "1"; });
  tog("aa", (v) => { w.autoAtk = v === "1"; });
  tog("fl", (v) => { w.filt = +v; });
  tog("af", (v) => { w.allyFx = v; });
  tog("o", (v) => { setOrient(v); updateRotHint(); });
  document.getElementById("logout").onclick = () => { ovKind = null; ov.className = "ov hidden"; typeof AUTH_ON !== "undefined" && AUTH_ON ? logout() : renderTitle(); };
}

// 右上角小齒輪：設定
pauseBtn.innerHTML = '<svg class="gear" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#e8dcc0" stroke-width="1.4"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/><circle cx="12" cy="12" r="6.5"/></svg>';
pauseBtn.setAttribute("aria-label", "設定");
// 背包、角色等舊畫面（screenEl）也一樣：點背景空白處就回到戰鬥
screenEl.addEventListener("click", (e) => { if (e.target === screenEl && state === "pick" && pausedFrom === "world") worldReturn(); });
setInterval(() => document.body.classList.toggle("inworld", typeof inWorld !== "undefined" && inWorld && (state === "world" || pausedFrom === "world")), 300);
