// 企劃 76：手機介面精簡（只改觸控版，電腦不動）
// 右上只留 行囊、技能、☰（格子選單）；小地圖下那排收進 ☰；下方只留 4 種丹藥（置中、不碰血球和技能）；
// 技能兩圈弧繞普攻（每 0.25 秒照實際位置算，含安全區）；換武器、護身法術變成技能區的小鈕
"use strict";
const M76 = typeof TOUCH !== "undefined" && TOUCH;
if (M76) document.body.classList.add("touch76");
// ───────── ☰ 格子選單 ─────────
const M76_ITEMS = [["ap", "角色"], ["tree", "天賦"], ["smith", "鐵匠"], ["rift", "秘境"], ["map", "星盤"], ["cards", "卡片"], ["quest", "任務"], ["book", "手冊"], ["rank", "排行"], ["altar", "祭壇"], ["menu", "設定"], ["rc", "回城符"], ["mute", "靜音"]];
const m76Ico = (k) => {
  if (k === "rc") return (typeof ico === "function" && ico("mat", "recall", "m76i")) || "<b>回</b>";
  if (k === "mute") return `<b class="m76t">${typeof muted !== "undefined" && muted ? "🔇" : "🔊"}</b>`;
  if (typeof RAIL_IK !== "undefined" && RAIL_IK[k]) return (typeof ico === "function" && ico("ui", RAIL_IK[k], "m76i")) || `<b>${k}</b>`;
  return typeof qIco === "function" ? qIco(k) : `<b>${k}</b>`;
};
const m76Dot = (k) => {
  const q = document.querySelector(`#quick .qbtn[data-q="${k}"]`), r = document.querySelector(`#railR [data-rl="${k}"]`);
  return !!((q && q.classList.contains("dot")) || (r && r.classList.contains("dot")));
};
const m76Btn = document.createElement("button"); m76Btn.id = "m76btn"; m76Btn.className = "qbtn"; m76Btn.setAttribute("aria-label", "選單");
m76Btn.innerHTML = `<b class="m76h">☰</b><small>選單</small><i class="m76n" hidden></i>`;
const m76Pan = document.createElement("div"); m76Pan.id = "m76"; m76Pan.hidden = true;
if (M76) { const tb = document.getElementById("topbar"); tb.insertBefore(m76Btn, document.getElementById("pauseBtn")); document.body.appendChild(m76Pan); }
function m76Draw() {
  m76Pan.innerHTML = `<div class="m76g">${M76_ITEMS.map(([k, n]) => `<button data-m76="${k}" class="${m76Dot(k) ? "dot" : ""}">${m76Ico(k)}<small>${k === "mute" && typeof muted !== "undefined" && muted ? "開聲音" : n}</small></button>`).join("")}</div>`;
}
function m76Toggle(on) { m76Pan.hidden = on === undefined ? !m76Pan.hidden : !on; if (!m76Pan.hidden) m76Draw(); m76Btn.classList.toggle("on", !m76Pan.hidden); }
m76Btn.addEventListener("click", (e) => { e.stopPropagation(); sfx("click"); m76Toggle(); });
m76Pan.addEventListener("click", (e) => {
  e.stopPropagation(); const b = e.target.closest("[data-m76]"); if (!b) return; sfx("click");
  const k = b.dataset.m76;
  if (k === "mute") { setMuted(!muted); if (typeof setMuteIcon === "function") setMuteIcon(); m76Draw(); return; }
  m76Toggle(false);
  if (k === "menu") openMenu(); else if (k === "rc") quickItem("rc"); else ovGo(k);
});
["pointerdown", "touchstart"].forEach((ev) => { m76Pan.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }); m76Btn.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }); });
document.addEventListener("pointerdown", (e) => { if (!m76Pan.hidden && !m76Pan.contains(e.target) && e.target !== m76Btn) m76Toggle(false); }, true);
const _ovSub76 = typeof ovSub === "function" ? ovSub : null;
if (_ovSub76) ovSub = function () { if (!m76Pan.hidden) { m76Toggle(false); return true; } return _ovSub76.apply(this, arguments); }; // eslint-disable-line no-func-assign

// ───────── 技能區的小鈕：換武器（點＝輪流、長按＝選）、護身法術 ─────────
const wswBtn = document.createElement("button"); wswBtn.className = "btn btn-wsw"; wswBtn.setAttribute("aria-label", "換武器組");
const svBtn = document.createElement("button"); svBtn.className = "btn btn-sv"; svBtn.setAttribute("aria-label", "護身法術");
const wsPick = document.createElement("div"); wsPick.id = "wsPick76"; wsPick.hidden = true;
if (M76) { pad.appendChild(wswBtn); pad.appendChild(svBtn); document.body.appendChild(wsPick); }
const wsNext = () => [1, 2].map((d) => (save.w.wi + d) % 3).find((i) => wsGet(i));
let wswLP = null, wswLong = false;
wswBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault(); e.stopPropagation(); wswLong = false; clearTimeout(wswLP);
  wswLP = setTimeout(() => { wswLong = true; sfx("click");
    wsPick.innerHTML = [0, 1, 2].map((i) => { const it = wsGet(i); return `<button data-wp="${i}" class="${i === save.w.wi ? "on" : ""}${it ? "" : " empty"}" style="--c:${it ? RARITY[it.q].c : "#555"}">${it ? itemIcon(it) : ""}<small>組${i + 1}</small></button>`; }).join("");
    const r = wswBtn.getBoundingClientRect(); wsPick.style.right = Math.round(innerWidth - r.right) + "px"; wsPick.style.bottom = Math.round(innerHeight - r.top + 6) + "px"; wsPick.hidden = false;
  }, 450);
});
wswBtn.addEventListener("pointerup", (e) => { e.stopPropagation(); clearTimeout(wswLP); if (wswLong) return; const n = wsNext(); if (n !== undefined) { switchW(n); sfx("click"); } else popWord(W0, "只有一組武器（行囊裡把武器放到武器組 2、3）", "#cfc4dc"); });
["pointerleave", "pointercancel"].forEach((ev) => wswBtn.addEventListener(ev, () => clearTimeout(wswLP)));
wsPick.addEventListener("pointerdown", (e) => { e.stopPropagation(); const b = e.target.closest("[data-wp]"); if (b && wsGet(+b.dataset.wp)) { switchW(+b.dataset.wp); sfx("click"); } wsPick.hidden = true; });
document.addEventListener("pointerdown", (e) => { if (!wsPick.hidden && !wsPick.contains(e.target) && e.target !== wswBtn) wsPick.hidden = true; }, true);
svBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); if (typeof heroSave === "function") heroSave(); });
let m76Key = "";
function m76SmallDraw() {
  if (!save.w || !W0) return;
  const n = wsNext(), it = n !== undefined ? wsGet(n) : null, h = SAVES[svKey()], cd = Math.ceil(W0.saveCd || 0);
  const key = (it ? it.id : "-") + "|" + svKey() + "|" + cd;
  if (key === m76Key) return; m76Key = key;
  wswBtn.innerHTML = `${it ? itemIcon(it) : "<b>⇄</b>"}<small>換</small>`;
  svBtn.innerHTML = `<b>${h.n.slice(0, 2)}</b>${cd ? `<i class="svcd">${cd}</i>` : ""}`;
  svBtn.classList.toggle("cd", !!cd);
}

// ───────── 排版：技能兩圈弧＋小鈕＋丹藥列 ─────────
const M76_ARC = [[".btn-skill", 180, 1], [".btn-ult", 135, 1], [".btn-roll", 90, 1, 58], [".btn-sk3", 180, 2], [".btn-sk4", 135, 2], [".btn-sk5", 90, 2], [".btn-wsw", 157.5, 1.5, 36], [".btn-sv", 115, 1.5, 36], [".btn-pg", 180, 3, 34]];
function m76Layout() {
  const show = M76 && typeof state !== "undefined" && state === "world" && document.body.classList.contains("inworld") && !document.body.classList.contains("ovopen");
  if (!M76) return;
  if (!show) { if (!m76Pan.hidden) m76Toggle(false); wsPick.hidden = true; return; }
  m76SmallDraw();
  m76Btn.querySelector(".m76n").hidden = !M76_ITEMS.some(([k]) => m76Dot(k));
  const atk = pad.querySelector(".btn-atk"); if (!atk) return;
  const ar = atk.getBoundingClientRect(), pr = pad.getBoundingClientRect(); if (!ar.width) return;
  const cx = ar.left + ar.width / 2, cy = ar.top + ar.height / 2, vh = innerHeight;
  const mr = typeof miniRect !== "undefined" && miniRect ? miniRect : { y: 56, h: 76 };
  const topLim = mr.y + mr.h + 18 + 8; // 小地圖＋地名下面
  let S = 46, R1 = Math.min(92, vh * 0.25), R2 = Math.max(R1 + 58, Math.min(150, vh * 0.4));
  for (let k = 0; k < 40 && cy - R2 - S / 2 < topLim; k++) { // 太高就先縮外圈，再縮內圈、按鈕
    if (R2 > R1 + 54) R2 -= 2; else if (R1 > 78) { R1 -= 2; R2 = Math.max(R1 + 54, R2 - 2); } else if (S > 42) S -= 2; else break;
  }
  const put = (el, ang, r, sz) => { const a = ang * Math.PI / 180, x = cx + Math.cos(a) * r, y = cy - Math.sin(a) * r;
    el.style.width = el.style.height = sz + "px"; el.style.right = Math.round(pr.right - x - sz / 2) + "px"; el.style.bottom = Math.round(pr.bottom - y - sz / 2) + "px"; };
  for (const [q, ang, ring, sz0] of M76_ARC) {
    const el = pad.querySelector(q); if (!el) continue;
    const r = ring === 1 ? R1 : ring === 2 ? R2 : ring === 1.5 ? (R1 + R2) / 2 : R2 + 44;
    put(el, ang, r, sz0 || S);
  }
  const pk = document.getElementById("pickBtn");
  if (pk) { const a = 150 * Math.PI / 180, r = R2 + 46, x = cx + Math.cos(a) * r, y = cy - Math.sin(a) * r; pk.style.right = Math.round(innerWidth - x - 23) + "px"; pk.style.bottom = Math.round(vh - y - 23) + "px"; }
  // 丹藥列：4 格，下方置中，左不碰血球、右不碰技能區
  const wb = document.getElementById("wbar"); if (!wb || wb.classList.contains("hidden")) return;
  const Ro = clamp(Math.min(innerWidth, vh) * 0.11, 34, 56), L = SAFE.l + 2 * Ro + 14 + 8;
  let Rb = innerWidth - 8, top = vh;
  pad.querySelectorAll(".btn").forEach((el) => { const r = el.getBoundingClientRect(); if (!r.width || getComputedStyle(el).display === "none") return; top = Math.min(top, r.top); if (r.bottom > vh - 64) Rb = Math.min(Rb, r.left - 8); });
  const natW = 4 * 44 + 3 * 6, room = Rb - L;
  wb.style.maxWidth = "none"; wb.style.flexWrap = "nowrap";
  if (room >= natW * 0.75) { // 橫向：放在血球和技能中間，置中
    const sc = Math.min(1, room / natW), w = natW * sc, x = clamp(innerWidth / 2, L + w / 2, Rb - w / 2);
    wb.style.left = Math.round(x) + "px"; wb.style.right = "auto"; wb.style.bottom = `calc(10px + env(safe-area-inset-bottom, 0px))`; wb.style.transform = `translateX(-50%) scale(${sc.toFixed(3)})`; wb.style.transformOrigin = "50% 100%";
  } else { // 直向：放在技能區上面、畫面正中間
    wb.style.left = "50%"; wb.style.right = "auto"; wb.style.bottom = Math.round(vh - top + 8) + "px"; wb.style.transform = "translateX(-50%)"; wb.style.transformOrigin = "50% 100%";
  }
}
setInterval(m76Layout, 250);
if (M76) { try { if (localStorage.getItem("pr_chatMini") === null) localStorage.setItem("pr_chatMini", "1"); } catch (e) {} } // 聊天小框手機預設收起
