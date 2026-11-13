// 企劃 75：右鍵移動、自己的鼠標、手機技能兩頁（11/13）
"use strict";
// ───────── 右鍵移動（電腦）：按住＝一直往鼠標走；點一下＝走到那裡（地上落點圈）─────────
let rmHeld = false, rmT0 = 0, rmX0 = 0, rmY0 = 0, rmMark = null;
const scrToWorld = (cx, cy) => { const Z = SCALE * 1.35; return [cam.x + (cx - W / 2) / Z, cam.y + (cy - H / 2) / Z]; };
cvs.addEventListener("contextmenu", (e) => { if (state === "world") e.preventDefault(); });
cvs.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "mouse" || e.button !== 2 || state !== "world" || !W0) return;
  if (typeof AUTO !== "undefined" && AUTO && AUTO.pick) return; // 點到掉落物名字：pickup.js 已經處理（走過去撿）
  rmHeld = true; rmT0 = performance.now(); rmX0 = e.clientX; rmY0 = e.clientY;
  const [wx, wy] = scrToWorld(e.clientX, e.clientY); AUTO = { x: wx, y: wy, follow: 1, mv: 1, near: 4 };
});
window.addEventListener("pointerup", (e) => {
  if (e.pointerType !== "mouse" || e.button !== 2 || !rmHeld) return;
  rmHeld = false;
  const quick = performance.now() - rmT0 < 260 && Math.hypot(e.clientX - rmX0, e.clientY - rmY0) < 8;
  if (state !== "world" || !W0) return;
  if (quick) { const [wx, wy] = scrToWorld(e.clientX, e.clientY); AUTO = { x: wx, y: wy, mv: 1, near: 6, pt: 1 }; rmMark = { x: wx, y: wy, t: 0.4 }; }
  else if (typeof AUTO !== "undefined" && AUTO && AUTO.follow) autoStop();
});
window.addEventListener("blur", () => { rmHeld = false; });
const _autoStepRm = autoStep;
autoStep = function (p, dt) { // eslint-disable-line no-func-assign
  const A = AUTO;
  if (A && A.follow) { // 按住右鍵：每幀對準鼠標，直線走（牆壁照一般移動擋）
    if (!rmHeld) { autoStop(); return null; }
    const [wx, wy] = scrToWorld(mouse.x, mouse.y), dx = wx - p.x, dy = wy - p.y, d = Math.hypot(dx, dy);
    A.x = wx; A.y = wy; if (d < 4) return null; return [dx / d, dy / d];
  }
  if (A && A.pt && typeof RIFT !== "undefined" && RIFT) { // 秘境裡點一下：直線走過去（秘境不能尋路）
    const dx = A.x - p.x, dy = A.y - p.y, d = Math.hypot(dx, dy);
    if (d < 6) { autoStop(); return null; } return [dx / d, dy / d];
  }
  return _autoStepRm.apply(this, arguments);
};
const _drawWorldHudRm = drawWorldHud;
drawWorldHud = function () { // eslint-disable-line no-func-assign
  const r = _drawWorldHudRm.apply(this, arguments);
  if (rmMark && W0) { // 落點圈
    rmMark.t -= 1 / 60; if (rmMark.t <= 0) rmMark = null;
    else { const Z = SCALE * 1.35, sx = W / 2 + (rmMark.x - cam.x) * Z, sy = H / 2 + (rmMark.y - cam.y) * Z, k = rmMark.t / 0.4;
      ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.strokeStyle = `rgba(160,230,255,${k})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(sx, sy, 6 + (1 - k) * 10, (6 + (1 - k) * 10) * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  }
  return r;
};

// ───────── 自己的鼠標：平常小劍、指到怪變紅劍、指到掉落物變手（素材 img/cursor/）─────────
let curMode = "";
function curSet(m) { if (m === curMode) return; curMode = m; document.body.classList.toggle("cur-atk", m === "atk"); document.body.classList.toggle("cur-pick", m === "pick"); }
cvs.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse") return;
  if (state !== "world" || !W0) { curSet(""); return; }
  const [wx, wy] = scrToWorld(e.clientX, e.clientY);
  if ((W0.drops || []).some((o) => !o.got && ((o.lb && wx >= o.lb[0] - 2 && wx <= o.lb[0] + o.lb[2] + 2 && wy >= o.lb[1] - 2 && wy <= o.lb[1] + o.lb[3] + 2) || Math.hypot(o.x - wx, o.y - wy) < 8))) { curSet("pick"); return; }
  if ((W0.mobs || []).some((m) => !m.dead && Math.hypot(m.x - wx, m.y - wy) < 14)) { curSet("atk"); return; }
  curSet("");
});

// ───────── 手機：技能兩頁（同 5 個位置換招，楓之谷M 那樣）─────────
const PG_ACTS = [["spin", "ult", "s3", "s4", "s5"], ["s6", "s7", "s8", "s9", "s10"]];
const PG_BTN = [".btn-skill", ".btn-ult", ".btn-sk3", ".btn-sk4", ".btn-sk5"];
let skPage = (() => { try { return +(localStorage.getItem("pr_skpage") || 0) ? 1 : 0; } catch (e) { return 0; } })();
const pgBtn = document.createElement("button"); pgBtn.className = "btn btn-pg"; pgBtn.setAttribute("aria-label", "技能換頁"); pad.appendChild(pgBtn);
function skPageApply() {
  PG_BTN.forEach((q, i) => { const b = pad.querySelector(q); if (b) { b.dataset.act = PG_ACTS[skPage][i]; b.dataset.pg = skPage ? "Ⅱ" : ""; } });
  pgBtn.innerHTML = `<b>${skPage ? "Ⅱ" : "Ⅰ"}</b><small>換頁</small>`;
  if (typeof setPadLabels === "function" && typeof inWorld !== "undefined" && inWorld) setPadLabels(true);
}
pgBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault(); e.stopPropagation();
  skPage = 1 - skPage; try { localStorage.setItem("pr_skpage", String(skPage)); } catch (x) {}
  padHeld.clear(); skPageApply(); sfx("click");
  pad.classList.remove("pgflash"); void pad.offsetWidth; pad.classList.add("pgflash");
});
skPageApply();
setInterval(() => { // 另一頁有招冷卻好了：換頁鈕亮小點
  if (!W0 || !W0.cds || typeof WSKILL === "undefined") return;
  const other = PG_ACTS[1 - skPage], ready = other.some((k) => WSKILL[k] && !WSKILL[k].empty && !(W0.cds[k] > 0));
  pgBtn.classList.toggle("ready", ready);
  pgBtn.hidden = !SLOTS6.slice(6).some((s) => slotUnlocked(s)) && !skPage; // 第 6 格（Lv.55）開了才出現換頁鈕
}, 300);
const _setPadLabelsRm = setPadLabels;
setPadLabels = function () { // eslint-disable-line no-func-assign
  const r = _setPadLabelsRm.apply(this, arguments);
  PG_BTN.forEach((q) => { const b = pad.querySelector(q); if (b && b.dataset.pg) b.insertAdjacentHTML("beforeend", `<i class="pgno">${b.dataset.pg}</i>`); });
  pgBtn.innerHTML = `<b>${skPage ? "Ⅱ" : "Ⅰ"}</b><small>換頁</small>`;
  return r;
};
