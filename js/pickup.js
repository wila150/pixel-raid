// 企劃 74 A／D：裝備手動撿、自動撿設定、保留規則
// 自動撿：save.w.pick = { q0, q1, q2, q3, pot, cur, gem, card, key }（1＝自動撿）；靈石一律自動
// 保留規則：save.w.keep = { base: true, cards: [{ q:[品質], slot, wt, lv, t1, aff, uq }] }——符合任何一張：一鍵出售／分解不會碰，也會自動撿
"use strict";
const PICK_DEF = { q0: 0, q1: 0, q2: 0, q3: 0, pot: 1, cur: 1, gem: 1, card: 1, key: 1 };
const PICK_ROWS = [["q0", "凡品（白）", "#c8c0d0"], ["q1", "靈品（藍）", "#7cc4ff"], ["q2", "玄品（紫）", "#cf9bff"], ["q3", "傳說（橘）", "#ffa45c"], ["pot", "丹藥"], ["cur", "通貨、素材、精髓"], ["gem", "輔助寶石"], ["card", "魔物卡片"], ["key", "秘境鑰匙"]];
const pickCfg = () => Object.assign({}, PICK_DEF, (save.w && save.w.pick) || {});
const keepCfg = () => { const w = save.w; if (!w.keep) w.keep = { base: true, cards: [] }; return w.keep; };

function keepCardHit(c, it) {
  if (c.q && c.q.length && !c.q.includes(it.q)) return false;
  if (c.slot && it.slot !== c.slot) return false;
  if (c.wt && !(it.slot === "sword" && wtOf(it) === c.wt)) return false;
  if (c.lv && itLv(it) < c.lv) return false;
  if (c.uq && !it.u) return false;
  if (c.t1 && !Object.keys(it.aff || {}).some((k) => affTierIdx(k, it.aff[k]) >= 4)) return false;
  if (c.aff && !(it.aff && it.aff[c.aff] !== undefined)) return false;
  return true;
}
function keepHit(it) { // 這件裝備要保留嗎
  if (!it || !save.w) return false;
  const K = keepCfg();
  if (K.base && ((it.en || 0) > 0 || it.cu || it.cor || it.jie || it.mir || it.card)) return true;
  return (K.cards || []).some((c) => keepCardHit(c, it));
}
function pickAuto(o) { // 這個掉落物會自動撿嗎
  if (!save.w) return true;
  const P = pickCfg();
  switch (o.kind) {
    case "stone": return true;
    case "potion": return !!P.pot;
    case "cur": case "mat": case "ess": return !!P.cur;
    case "gem": return !!P.gem;
    case "card": return !!P.card;
    case "key": return !!P.key;
    case "item": return !!P["q" + o.it.q] || keepHit(o.it);
  }
  return true;
}
const dropDim = (o) => o.kind === "item" && o.it.q < ((save.w && save.w.filt) || 0) && !keepHit(o.it);
const dropNameOn = (o) => keys.has("alt") || (typeof SET74 === "undefined" || SET74.names) || o.it.q >= 2;

// 一鍵出售：保留的不賣
const _sellPick74 = sellPick;
sellPick = function () { return _sellPick74.apply(this, arguments).filter((it) => !keepHit(it)); }; // eslint-disable-line no-func-assign

// Alt：顯示所有掉落物名字（別讓瀏覽器把焦點移到選單列）
window.addEventListener("keydown", (e) => { if (e.key === "Alt" && state === "world") e.preventDefault(); });

// 電腦：點地上的物品名字＝走過去撿
cvs.addEventListener("pointerdown", (e) => {
  if (state !== "world" || !W0 || !W0.drops || (e.button !== 0 && e.button !== 2)) return; // 右鍵點名字也撿（企劃 75）
  const Z = SCALE * 1.35, wx = cam.x + (e.clientX - W / 2) / Z, wy = cam.y + (e.clientY - H / 2) / Z;
  let hit = null, bd = 1e9;
  for (const o of W0.drops) {
    if (o.got) continue;
    const onLabel = o.lb && wx >= o.lb[0] - 2 && wx <= o.lb[0] + o.lb[2] + 2 && wy >= o.lb[1] - 2 && wy <= o.lb[1] + o.lb[3] + 2;
    const d = Math.hypot(o.x - wx, o.y - wy);
    if ((onLabel || d < 8) && d < bd) { bd = d; hit = o; }
  }
  if (!hit) return;
  mouse.down = false; // 這一下不算普攻
  if (dist(hit, W0) < pickReach()) { pickUp(hit, W0); return; }
  AUTO = { x: hit.x, y: hit.y, pick: hit, near: 12 };
});

// 手機：附近有東西時出現「撿」鈕
let pickBtn = null;
function pickBtnTick() {
  if (!pickBtn) {
    pickBtn = document.createElement("button"); pickBtn.id = "pickBtn"; pickBtn.textContent = "撿"; pickBtn.hidden = true;
    pickBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); if (W0) W0.pickReq = true; });
    document.body.appendChild(pickBtn);
  }
  let near = false;
  if (state === "world" && W0 && W0.drops && TOUCH && !document.body.classList.contains("ovopen")) { const r = pickReach(); near = W0.drops.some((o) => !o.got && dist(o, W0) < r); }
  if (pickBtn.hidden === near) pickBtn.hidden = !near;
}

const _updateWorldPick74 = updateWorld;
updateWorld = function (dt) { // eslint-disable-line no-func-assign
  const r = _updateWorldPick74.apply(this, arguments);
  if (typeof AUTO !== "undefined" && AUTO && AUTO.pick && W0) { // 點名字走過去撿
    if (AUTO.pick.got) autoStop();
    else if (dist(AUTO.pick, W0) < pickReach() * 0.8) { const o = AUTO.pick; autoStop(); pickUp(o, W0); }
  }
  pickBtnTick();
  return r;
};

// 設定頁「保留與拾取」用的 HTML（settings.js 呼叫）
const KEEP_SLOTS = () => Object.keys(SLOTS).filter((k) => typeof slotOpen !== "function" || slotOpen(k) || true);
function keepCardTxt(c) {
  const t = [];
  if (c.q && c.q.length) t.push(c.q.map((q) => RARITY[q].n).join("／"));
  if (c.slot) t.push(SLOTS[c.slot] ? SLOTS[c.slot].n : c.slot);
  if (c.wt) t.push(WEAPONS[c.wt] ? WEAPONS[c.wt].n : c.wt);
  if (c.lv) t.push(`物品等級 ≥ ${c.lv}`);
  if (c.t1) t.push("有 T1 詞綴");
  if (c.aff) t.push(`有「${AFFIX[c.aff] ? AFFIX[c.aff].n : c.aff}」`);
  if (c.uq) t.push("傳說");
  return t.length ? t.join("・") : "全部裝備";
}
let keepDraft = null;
function pickKeepHtml() {
  const P = pickCfg(), K = keepCfg();
  const left = `<div class="s74col"><h3>自動撿</h3><p class="dim">勾起來的會走過去自動撿；沒勾的要按 F（手機按「撿」）或點名字撿。符合保留規則的裝備也會自動撿。</p>
    <label class="s74chk on dis"><input type="checkbox" checked disabled> 靈石一律自動撿</label>
    ${PICK_ROWS.map(([k, n, c]) => `<label class="s74chk"><input type="checkbox" data-pk="${k}" ${P[k] ? "checked" : ""}> <span${c ? ` style="color:${c}"` : ""}>${n}</span></label>`).join("")}
    <h3>掉落過濾</h3><p class="dim">低於這個品質（而且不在保留規則裡）的裝備，地上名字變暗。</p>
    <div class="s74seg">${["全部正常", "白色變暗", "白、藍變暗"].map((n, i) => `<button data-fl="${i}" class="${(save.w.filt || 0) === i ? "on" : ""}">${n}</button>`).join("")}</div></div>`;
  const D = keepDraft;
  const editor = D ? `<div class="s74card edit">
      <div class="s74row"><span>品質</span>${[0, 1, 2, 3].map((q) => `<button data-kq="${q}" class="${D.q.includes(q) ? "on" : ""}" style="color:${RARITY[q].c}">${RARITY[q].n}</button>`).join("")}</div>
      <div class="s74row"><span>部位</span><select data-ks="slot"><option value="">不限</option>${Object.keys(SLOTS).map((k) => `<option value="${k}" ${D.slot === k ? "selected" : ""}>${SLOTS[k].n}</option>`).join("")}</select>
        <span>武器</span><select data-ks="wt"><option value="">不限</option>${Object.keys(WEAPONS).map((k) => `<option value="${k}" ${D.wt === k ? "selected" : ""}>${WEAPONS[k].n}</option>`).join("")}</select></div>
      <div class="s74row"><span>物品等級 ≥</span><input type="number" min="0" max="130" step="5" data-ks="lv" value="${D.lv || 0}">
        <label><input type="checkbox" data-kb="t1" ${D.t1 ? "checked" : ""}> 有 T1 詞綴</label><label><input type="checkbox" data-kb="uq" ${D.uq ? "checked" : ""}> 傳說</label></div>
      <div class="s74row"><span>有這條詞綴</span><select data-ks="aff"><option value="">不限</option>${Object.keys(AFFIX).filter((k) => AFFIX[k].t === "p" || AFFIX[k].t === "s").map((k) => `<option value="${k}" ${D.aff === k ? "selected" : ""}>${AFFIX[k].n}</option>`).join("")}</select></div>
      <div class="s74row"><button data-kd="ok" class="gold">加入</button><button data-kd="no">取消</button><span class="dim">${keepCardTxt(D)}</span></div></div>` : `<button data-kd="new" class="s74add">＋ 新增卡片</button>`;
  const right = `<div class="s74col"><h3>保留規則</h3><p class="dim">每張卡片＝一種想留的裝備，符合任何一張就保留：一鍵出售、一鍵分解不會碰。</p>
    <label class="s74chk"><input type="checkbox" data-kb0="base" ${K.base ? "checked" : ""}> <span style="color:#e8c46a">精煉過、用過通貨、鑲過卡片的裝備一律保留</span></label>
    ${(K.cards || []).map((c, i) => `<div class="s74card"><span>${keepCardTxt(c)}</span><button data-kx="${i}" aria-label="刪掉">✕</button></div>`).join("")}
    ${editor}</div>`;
  return `<div class="s74two">${left}${right}</div>`;
}
function pickKeepBind(root, redraw) {
  const w = save.w;
  root.querySelectorAll("[data-pk]").forEach((b) => b.onchange = () => { w.pick = Object.assign(pickCfg(), { [b.dataset.pk]: b.checked ? 1 : 0 }); writeSave(); });
  root.querySelectorAll("[data-fl]").forEach((b) => b.onclick = () => { w.filt = +b.dataset.fl; writeSave(); redraw(); });
  root.querySelectorAll("[data-kb0]").forEach((b) => b.onchange = () => { keepCfg().base = b.checked; writeSave(); });
  root.querySelectorAll("[data-kx]").forEach((b) => b.onclick = () => { keepCfg().cards.splice(+b.dataset.kx, 1); writeSave(); redraw(); });
  root.querySelectorAll("[data-kd]").forEach((b) => b.onclick = () => {
    const k = b.dataset.kd;
    if (k === "new") keepDraft = { q: [], slot: "", wt: "", lv: 0, t1: false, aff: "", uq: false };
    else if (k === "ok") { keepCfg().cards.push(keepDraft); keepDraft = null; writeSave(); }
    else keepDraft = null;
    redraw();
  });
  if (keepDraft) {
    root.querySelectorAll("[data-kq]").forEach((b) => b.onclick = () => { const q = +b.dataset.kq, a = keepDraft.q; const i = a.indexOf(q); if (i >= 0) a.splice(i, 1); else a.push(q); redraw(); });
    root.querySelectorAll("[data-ks]").forEach((b) => b.onchange = () => { const k = b.dataset.ks; keepDraft[k] = k === "lv" ? Math.max(0, +b.value || 0) : b.value; redraw(); });
    root.querySelectorAll("[data-kb]").forEach((b) => b.onchange = () => { keepDraft[b.dataset.kb] = b.checked; redraw(); });
  }
}
