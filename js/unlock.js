// 萬劍仙途（pixel-raid）— 1.0 企劃第 3 項：按鈕按等級解鎖（docs/企劃_1.0完整化.md）
// v1fix.js 後面載入（包 ovGo／openHud／m76Draw／setPadLabels）。
// 規則：還沒開放 → 電腦版按鈕藏起來（visibility，位置不動）；手機 ☰ 選單格子灰色＋「Lv.X」，點了說「Lv.X 開放」。
//       剛開放 → 按鈕閃 3 秒＋紅點（點一次就消失），有台詞的劍靈說。舊角色全部直接開放，不閃、不說。
// 不改任何按鈕的名字和位置（鐵律 1）。存 save.w.ul = { 按鈕: 1 已開 / 2 剛開還沒點 }。
"use strict";

const ulLv = () => (save.w && save.w.lv) || 1;
const ulHasCard = () => { const w = save.w; return !!((save.cards && Object.values(save.cards).some((n) => n > 0)) || (w.book && w.book.c && w.book.c.length) || ["sword", "robe"].some((s) => save.eq[s] && save.eq[s].card)); };
const ulHasKey = () => !!(save.keys && save.keys.length) || ((save.w.riftMax || 0) > 0);
const ulSawAltar = () => {
  if (typeof W0 === "undefined" || !W0 || (typeof RIFT !== "undefined" && RIFT) || typeof RB_KEYS === "undefined") return false;
  return RB_KEYS.some((k) => Math.hypot(RBOSS[k].x - W0.x, RBOSS[k].y - W0.y) < 300);
};
// [按鈕, 開放條件, 灰格上的字, 開放時劍靈台詞]（照企劃 CSV v1.1；行囊、技能、設定、任務、星盤一開始就有，不在表裡）
const UL = [
  ["ap", () => ulLv() >= 3, "Lv.3", ""],
  ["tree", () => ulLv() >= 5, "Lv.5", "天賦點開了，點一點變強"],
  ["smith", () => ulLv() >= 8, "Lv.8", ""],
  ["book", () => ulLv() >= 8, "Lv.8", ""],
  ["cards", ulHasCard, "拿到卡片", ""],
  ["rift", () => ulLv() >= 20 || ulHasKey(), "Lv.20", ""],
  ["rank", () => ulLv() >= 15, "Lv.15", ""],
  ["altar", () => (save.w.ul && save.w.ul.altar) || ulSawAltar(), "看到祭壇", ""],
];
const UL_K = Object.fromEntries(UL.map((u) => [u[0], u]));
const ulSt = () => {
  const w = save.w; if (!w || !w.created) return null;
  if (!w.ul) {
    // 新角色（v1fix 的新手出生點有跑到：Lv1、沒經驗、沒任務）照條件開；其他舊角色全部直接開放
    const fresh = w.spawn1 && ulLv() <= 2 && !(w.exp > 0) && !((w.q || 0) > 0);
    w.ul = {};
    for (const [k, ok] of UL) if (!fresh || ok()) w.ul[k] = 1;
  }
  return w.ul;
};
const ulOpen = (k) => { if (!UL_K[k]) return true; const s = ulSt(); return !s || !!s[k]; };
const ulTxt = (k) => (UL_K[k] ? UL_K[k][2] : "");
const ulSay = (k) => { const t = ulTxt(k); popWord(W0 || { x: 0, y: 0 }, t.startsWith("Lv.") ? `${t} 開放` : `${t}後開放`, "#cfc4dc"); };
const ulSeen = (k) => { const s = ulSt(); if (s && s[k] === 2) { s[k] = 1; writeSave(); ulPaint(); } };

// ───────── 點下去：還沒開就只說「Lv.X 開放」；剛開的點了紅點消失 ─────────
const UL_HUD = {};
const _ovGoUL = ovGo;
ovGo = function (q) { // eslint-disable-line no-func-assign
  if (!ulOpen(q)) { sfx("click"); ulSay(q); return; }
  ulSeen(q);
  return _ovGoUL.apply(this, arguments);
};
const _openHudUL = openHud;
openHud = function (h) { // eslint-disable-line no-func-assign
  const k = UL_HUD[h] || h;
  if (state === "world" && !ulOpen(k)) { sfx("click"); ulSay(k); return; }
  ulSeen(k);
  return _openHudUL.apply(this, arguments);
};

// ───────── 畫按鈕：電腦藏起來（不動位置）、手機 ☰ 灰格＋字 ─────────
let ulFlash = {}; // 按鈕 → 閃到什麼時候（performance.now）
const ulBtns = (k) => [document.querySelector(`#quick .qbtn[data-q="${k}"]`), document.querySelector(`#railR [data-rl="${k}"]`)].filter(Boolean);
function ulPaint() {
  const s = ulSt(); if (!s) return;
  const now = performance.now();
  let anyNew = false, anyFlash = false;
  for (const [k] of UL) {
    const open = !!s[k], fl = (ulFlash[k] || 0) > now;
    if (s[k] === 2) anyNew = true;
    if (fl) anyFlash = true;
    for (const b of ulBtns(k)) { b.classList.toggle("ullock", !open); b.classList.toggle("ulnew", fl); b.classList.toggle("uldot", s[k] === 2); }
  }
  const rh = document.querySelector("#railR .rlH"); // 右側列收起來時，把手上也有紅點
  if (rh) rh.classList.toggle("uldot", ["cards", "book", "rank", "altar"].some((k) => s[k] === 2));
  const mb = document.getElementById("m76btn"); // 手機：剛開的都在 ☰ 裡，閃 ☰
  if (mb) {
    mb.classList.toggle("ulnew", anyFlash); mb.classList.toggle("uldot", anyNew);
    // 還沒開的格子原本的紅點（例如手冊）不算：☰ 上原本的紅點只看開了的（m76Layout 是 setInterval 直接傳函式，包不到，用 class 蓋掉）
    if (typeof M76_ITEMS !== "undefined") mb.classList.toggle("ulnodot", !M76_ITEMS.some(([k]) => ulOpen(k) && m76Dot(k)));
  }
}
if (typeof m76Draw === "function") {
  const _m76DrawUL = m76Draw;
  m76Draw = function () { // eslint-disable-line no-func-assign
    _m76DrawUL.apply(this, arguments);
    const s = ulSt(); if (!s) return;
    const now = performance.now();
    m76Pan.querySelectorAll("[data-m76]").forEach((b) => {
      const k = b.dataset.m76; if (!UL_K[k]) return;
      const open = !!s[k];
      b.classList.toggle("ullock", !open); b.classList.toggle("uldot", s[k] === 2); b.classList.toggle("ulnew", (ulFlash[k] || 0) > now);
      if (!open) b.classList.remove("dot");
      if (!open) { const sm = b.querySelector("small"); if (sm) sm.innerHTML = `${sm.textContent}<i class="ullv">${ulTxt(k)}</i>`; }
    });
  };
  m76Pan.addEventListener("click", (e) => { // 灰格：只說幾級開放（capture，搶在原本的開頁前面）
    const b = e.target.closest("[data-m76]"); if (!b || ulOpen(b.dataset.m76)) return;
    e.stopImmediatePropagation(); e.stopPropagation(); sfx("click"); ulSay(b.dataset.m76);
  }, true);
}

// ───────── 手機技能格：還沒解鎖寫「Lv.X」（跟電腦一樣），解鎖了沒放招才是「＋」─────────
const _setPadLabelsUL = setPadLabels;
setPadLabels = function (world) { // eslint-disable-line no-func-assign
  const r = _setPadLabelsUL.apply(this, arguments);
  if (world && typeof SLOT_NUM !== "undefined") pad.querySelectorAll(".btn").forEach((b) => {
    const sl = SLOT_NUM.find((s) => SLOT_KEY[s] === b.dataset.act);
    if (!sl || slotUnlocked(sl)) return;
    const lab = b.querySelector(".plab"); if (!lab) return;
    b.classList.add("sklock");
    lab.innerHTML = `<b class="sklv">Lv.${SLOT_LV[sl]}</b><small>${PAD_KEYS[b.dataset.act] || ""}</small>`;
  });
  return r;
};
let ulPadLv = 0; // 升級跨過技能格等級時重畫手機按鈕
setInterval(() => {
  if (typeof inWorld === "undefined" || !inWorld || !save.w || !save.w.created) return;
  const s = ulSt(); if (!s) return;
  // 檢查有沒有新開的
  for (const [k, ok, , line] of UL) {
    if (s[k] || !ok()) continue;
    s[k] = 2; ulFlash[k] = performance.now() + 3000; writeSave();
    if (line) notice(line, "#ffe066");
    if (typeof m76Pan !== "undefined" && !m76Pan.hidden) m76Draw();
  }
  // 快捷鍵等其他路徑打開的頁面：剛開的算點過（紅點消失）；還沒開的關掉並說幾級開放
  // （鐵匠、秘境不關：城裡的鐵砧、秘境台、秘境使者本來就會打開，企劃只藏按鈕）
  if (typeof ovKind !== "undefined" && ovKind && typeof OV_TAB !== "undefined") {
    const k = OV_TAB[ovKind] || ovKind;
    if (UL_K[k] && !s[k] && k !== "smith" && k !== "rift") { ovClose(); ulSay(k); }
    else if (s[k] === 2) ulSeen(k);
  }
  ulPaint();
  if (ulLv() !== ulPadLv) { const was = ulPadLv; ulPadLv = ulLv(); if (was && typeof SLOT_LV !== "undefined" && Object.values(SLOT_LV).some((L) => L > was && L <= ulPadLv)) setPadLabels(true); }
}, 250);
