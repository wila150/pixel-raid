// 萬劍仙途（pixel-raid）— 新手引導：新角色一步一步教（移動 → 攻擊 → 技能 → 閃身 → 背包 → 出城打妖）
"use strict";

const TUT = [
  { t: () => (TOUCH || (navigator.maxTouchPoints > 0 && !matchMedia("(hover: hover)").matches) ? "用左下搖桿走走看（按住畫面左半邊拖曳）" : "用 WASD 走走看"), ev: "move", n: 80 },
  { t: () => `按「${WSKILL.attack.n}」攻擊（${TOUCH ? "右下大按鈕" : "滑鼠左鍵"}）`, ev: "attack", n: 3, hi: "attack" },
  { t: () => `放技能「${WSKILL.spin.n}」（${TOUCH ? "按鈕" : "數字鍵 1"}），會花真氣（右下藍色的真氣球）`, ev: "spin", n: 1, hi: "spin" },
  { t: () => `按「閃身」（${TOUCH ? "按鈕" : "空白鍵"}）：閃身的瞬間不會受傷，看到紅圈就閃`, ev: "roll", n: 1, hi: "roll" },
  { t: () => `打開行囊（${TOUCH ? "右上角「行囊」" : "按 I"}）：撿到的裝備、寶石都在這裡`, ev: "bag", n: 1, hiHud: "bag" },
  { t: () => "照左上角的主線任務，出城打第一隻妖獸", ev: "kill", n: 1 },
];
let tutCnt = 0, tutLast = null, tutDoneT = 0, tutHiOnce = false;
const tutOn = () => save.w && save.w.tut !== undefined && save.w.tut < TUT.length;
function tutEvent(ev, amt = 1) {
  if (!tutOn()) return;
  const s = TUT[save.w.tut];
  if (s.ev !== ev) return;
  tutCnt += amt;
  if (tutCnt >= s.n) {
    tutCnt = 0; save.w.tut++; sfx("click");
    if (save.w.tut >= TUT.length) { tutDoneT = 3; floatText(W0.x, W0.y - 30, "新手引導完成！", "#ffe066", true); }
    writeSave(); tutHighlight();
  }
}
function tutTick() { // world.js 每幀呼叫：算走了多遠
  if (!tutHiOnce) { tutHiOnce = true; tutHighlight(); }
  if (!tutOn() || !W0) return;
  if (tutLast && save.w.tut === 0) { const d = Math.hypot(W0.x - tutLast.x, W0.y - tutLast.y); if (d > 0.05 && d < 30) tutWalkT += Math.min(0.1, Math.max(0, time - tutWalkAt)); } // 搖桿提示：走了幾秒
  tutWalkAt = time;
  if (tutLast) tutEvent("move", Math.hypot(W0.x - tutLast.x, W0.y - tutLast.y));
  tutLast = { x: W0.x, y: W0.y };
}
function tutHighlight() { // 讓該按的按鈕閃
  const s = tutOn() ? TUT[save.w.tut] : null;
  pad.querySelectorAll(".btn").forEach((b) => b.classList.toggle("tut-hi", !!s && b.dataset.act === s.hi));
  document.querySelectorAll("#hud .hbtn").forEach((b) => b.classList.toggle("tut-hi", !!s && b.dataset.h === s.hiHud));
  document.querySelectorAll("#quick .qbtn").forEach((b) => b.classList.toggle("tut-hi", !!s && b.dataset.q === (s.hiHud === "tp" ? "map" : s.hiHud)));
}
// 1.0 企劃第 4 項：新手第 1 步（走路），觸控裝置在左下畫半透明搖桿圈＋手指拖曳動畫；走過 3 秒（或這一步做完）就消失
let tutWalkT = 0, tutWalkAt = 0;
const tutTouch = () => TOUCH || (navigator.maxTouchPoints > 0 && !matchMedia("(hover: hover)").matches);
function drawTutStick() {
  if (!tutTouch() || tutWalkT >= 3 || stick.id !== null) return; // 手指已經按著：畫面上有真的搖桿，不重複畫
  const land = W > H, R = 44, cx = SAFE.l + (land ? Math.min(190, W * 0.24) : W * 0.3), cy = H - (land ? Math.min(118, H * 0.32) : Math.min(250, H * 0.3)) - SAFE.b;
  const fade = Math.min(1, (3 - tutWalkT) / 0.6), q = (time % 2.4) / 2.4; // 2.4 秒一輪：按下 → 往右上拖 → 放開
  const drag = q < 0.15 ? 0 : q < 0.6 ? (q - 0.15) / 0.45 : q < 0.85 ? 1 : 1 - (q - 0.85) / 0.15, e = drag * drag * (3 - 2 * drag);
  const kx = cx + e * R * 0.72, ky = cy - e * R * 0.5, press = q > 0.08 && q < 0.9;
  ctx.save(); ctx.globalAlpha = 0.55 * fade;
  ctx.fillStyle = "rgba(20,14,30,0.35)"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.setLineDash([6, 5]); ctx.lineDashOffset = -time * 14; ctx.strokeStyle = "#ffe9a8"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = press ? "rgba(255,233,168,0.75)" : "rgba(255,255,255,0.4)"; ctx.beginPath(); ctx.arc(kx, ky, 18, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.9 * fade; // 手指：指尖在圓鈕中間，沒按下時稍微抬起來
  const fx = kx + 4, fy = ky + (press ? 4 : 12);
  ctx.fillStyle = "#fff"; ctx.strokeStyle = "#1b1424"; ctx.lineWidth = 2; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(fx - 5, fy + 2); ctx.arc(fx, fy + 2, 5, Math.PI, 0); ctx.lineTo(fx + 5, fy + 14); ctx.lineTo(fx + 15, fy + 17); ctx.lineTo(fx + 15, fy + 30); ctx.lineTo(fx - 9, fy + 30); ctx.lineTo(fx - 12, fy + 20); ctx.lineTo(fx - 5, fy + 16); ctx.closePath(); ctx.stroke(); ctx.fill();
  ctx.font = "bold 11px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 3; ctx.strokeText("按住拖曳", cx, cy - R - 8); ctx.fillStyle = "#ffe9a8"; ctx.fillText("按住拖曳", cx, cy - R - 8);
  ctx.restore();
}
function drawTut() {
  if (tutDoneT > 0) tutDoneT -= 1 / 60;
  if (!tutOn()) return;
  const i = save.w.tut, s = TUT[i], txt = s.t();
  if (i === 0) drawTutStick();
  ctx.font = "bold 13px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
  const tw = Math.min(W - 24, ctx.measureText(txt).width + 70), x = W / 2, y = W > H ? Math.max(H * 0.24, 84 + SAFE.t) : Math.min(H * 0.62, H - 300); // v6.1 直向放角色下方、技能鈕上方（不撞地名大字，企劃 15 第 13 節）；v6.1 往下移，不蓋右上快捷列（企劃 15 第 12 節）
  const pulse = 0.6 + 0.4 * Math.sin(time * 5);
  ctx.fillStyle = "rgba(14,10,24,0.88)"; ctx.fillRect(x - tw / 2, y - 16, tw, 32);
  ctx.strokeStyle = `rgba(255,207,107,${pulse})`; ctx.lineWidth = 2; ctx.strokeRect(x - tw / 2, y - 16, tw, 32);
  ctx.fillStyle = "#ffcf6b"; ctx.font = "bold 10px 'Noto Sans TC', sans-serif"; ctx.textAlign = "left";
  ctx.fillText(`新手 ${i + 1}/${TUT.length}`, x - tw / 2 + 8, y + 4);
  ctx.textAlign = "center"; ctx.font = "bold 13px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#fff";
  ctx.fillText(txt, x + 26, y + 5, tw - 70);
  if (s.ev === "move" || s.ev === "attack") { const f = Math.min(1, tutCnt / s.n); ctx.fillStyle = "#ffcf6b"; ctx.fillRect(x - tw / 2, y + 14, tw * f, 2); }
}
