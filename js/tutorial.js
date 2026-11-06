// 萬劍仙途（pixel-raid）— 新手引導：新角色一步一步教（移動 → 攻擊 → 技能 → 閃身 → 背包 → 出城打妖）
"use strict";

const TUT = [
  { t: () => (TOUCH ? "按住畫面左半邊拖曳，走走看" : "用 WASD 走走看"), ev: "move", n: 80 },
  { t: () => `按「${WSKILL.attack.n}」攻擊（${TOUCH ? "右下大按鈕" : "滑鼠左鍵"}）`, ev: "attack", n: 3, hi: "attack" },
  { t: () => `放技能「${WSKILL.spin.n}」（${TOUCH ? "按鈕" : "Q"}），會花真氣（能量球外圈的藍弧）`, ev: "spin", n: 1, hi: "spin" },
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
  if (tutLast) tutEvent("move", Math.hypot(W0.x - tutLast.x, W0.y - tutLast.y));
  tutLast = { x: W0.x, y: W0.y };
}
function tutHighlight() { // 讓該按的按鈕閃
  const s = tutOn() ? TUT[save.w.tut] : null;
  pad.querySelectorAll(".btn").forEach((b) => b.classList.toggle("tut-hi", !!s && b.dataset.act === s.hi));
  document.querySelectorAll("#hud .hbtn").forEach((b) => b.classList.toggle("tut-hi", !!s && b.dataset.h === s.hiHud));
  document.querySelectorAll("#quick .qbtn").forEach((b) => b.classList.toggle("tut-hi", !!s && b.dataset.q === (s.hiHud === "tp" ? "map" : s.hiHud)));
}
function drawTut() {
  if (tutDoneT > 0) tutDoneT -= 1 / 60;
  if (!tutOn()) return;
  const i = save.w.tut, s = TUT[i], txt = s.t();
  ctx.font = "bold 13px 'Noto Sans TC', sans-serif"; ctx.textAlign = "center";
  const tw = Math.min(W - 24, ctx.measureText(txt).width + 70), x = W / 2, y = W > H ? 26 + SAFE.t : Math.max(H * 0.2, 60 + SAFE.t);
  const pulse = 0.6 + 0.4 * Math.sin(time * 5);
  ctx.fillStyle = "rgba(14,10,24,0.88)"; ctx.fillRect(x - tw / 2, y - 16, tw, 32);
  ctx.strokeStyle = `rgba(255,207,107,${pulse})`; ctx.lineWidth = 2; ctx.strokeRect(x - tw / 2, y - 16, tw, 32);
  ctx.fillStyle = "#ffcf6b"; ctx.font = "bold 10px 'Noto Sans TC', sans-serif"; ctx.textAlign = "left";
  ctx.fillText(`新手 ${i + 1}/${TUT.length}`, x - tw / 2 + 8, y + 4);
  ctx.textAlign = "center"; ctx.font = "bold 13px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#fff";
  ctx.fillText(txt, x + 26, y + 5, tw - 70);
  if (s.ev === "move" || s.ev === "attack") { const f = Math.min(1, tutCnt / s.n); ctx.fillStyle = "#ffcf6b"; ctx.fillRect(x - tw / 2, y + 14, tw * f, 2); }
}
