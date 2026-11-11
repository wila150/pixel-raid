// 企劃 74 B／C／D：設定三分頁（一般／按鍵配置／保留與拾取）、改鍵、滑鼠點擊移動、顯示傷害數字、一直顯示掉落物名字
// 這些都是「這台裝置」的設定（localStorage）：pr_set74 = { dmg, names, clickMove }、pr_keys = { 動作: [主要, 次要] }（只存改過的）
"use strict";
const SET74 = (() => { try { return Object.assign({ dmg: true, names: true, clickMove: false }, JSON.parse(localStorage.getItem("pr_set74") || "{}")); } catch (e) { return { dmg: true, names: true, clickMove: false }; } })();
const set74Save = () => { try { localStorage.setItem("pr_set74", JSON.stringify(SET74)); } catch (e) {} };

// ───────── 改鍵：實體鍵 → 遊戲原本的鍵（攔在最前面，再發一個「原本那顆鍵」的事件，所以所有快捷鍵都跟著換）─────────
const KEY_ACTS = [
  ["技能", [["skQ", "Q 招", "q"], ["skE", "E 招", "e"], ["roll", "身法（閃身）", " "], ["atk", "普攻（鍵盤）", "j"], ["save", "護身法術", "v"]]],
  ["移動", [["up", "向上", "w"], ["down", "向下", "s"], ["left", "向左", "a"], ["right", "向右", "d"]]],
  ["丹藥", [["pot_hp", "回春丹", "4"], ["pot_mp", "聚氣丹", "5"], ["pot_guard", "護體丹", "6"], ["pot_pure", "淨化丹", "7"]]],
  ["互動", [["pick", "撿東西", "f"], ["ws1", "武器組 1", "1"], ["ws2", "武器組 2", "2"], ["ws3", "武器組 3", "3"], ["names", "顯示掉落物名字（按住）", "alt"]]],
  ["介面", [["bag", "行囊", "i"], ["char", "角色", "c"], ["skill", "技能", "n"], ["tree", "天賦樹", "p"], ["smith", "鐵匠鋪", "b"], ["map", "星盤", "m"], ["quest", "任務", "y"], ["book", "冒險手冊", "k"], ["cards", "卡片", "l"], ["rank", "排行", "r"], ["chat", "聊天", "g"]]],
];
const KEY_DEF = {}; for (const [, L] of KEY_ACTS) for (const [id, , k] of L) KEY_DEF[id] = k;
const keyBinds = (() => { try { return JSON.parse(localStorage.getItem("pr_keys") || "{}"); } catch (e) { return {}; } })();
const keyOf = (id) => (keyBinds[id] || [KEY_DEF[id], ""]);
let KEYMAP = {};
function keyMapBuild() {
  KEYMAP = {};
  const bound = new Set();
  for (const id in KEY_DEF) { const d = KEY_DEF[id]; for (const u of keyOf(id)) { if (!u) continue; bound.add(u); if (u !== d) KEYMAP[u] = d; } }
  for (const id in KEY_DEF) { const d = KEY_DEF[id]; if (!bound.has(d)) KEYMAP[d] = "__none"; } // 原本的鍵沒人用了：按了不做事
}
keyMapBuild();
const keyHit = (id) => pressed.has(KEY_DEF[id]); // 遊戲裡判斷都用「原本的鍵」（實體鍵已經換過了）
const keyLabel = (k) => (!k ? "—" : k === " " ? "空白" : k === "alt" ? "Alt" : k === "shift" ? "Shift" : k === "control" ? "Ctrl" : k.length === 1 ? k.toUpperCase() : k.replace(/^arrow/, "方向").replace(/^(.)/, (m) => m.toUpperCase()));
let keyRemapping = false;
const remapKey = (type) => (e) => {
  if (keyRemapping || !e.isTrusted) return;
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT")) return;
  if (keyCatch && type === "keydown") return; // 正在設定按鍵
  const k = e.key.toLowerCase(), to = KEYMAP[k];
  if (!to || to === k || e.key === "Escape") return;
  e.stopImmediatePropagation(); e.preventDefault();
  if (to === "__none") return;
  keyRemapping = true;
  try { window.dispatchEvent(new KeyboardEvent(type, { key: to === " " ? " " : to.length === 1 ? to : to === "alt" ? "Alt" : to, code: e.code, repeat: e.repeat, bubbles: true, cancelable: true })); } finally { keyRemapping = false; }
};
window.addEventListener("keydown", remapKey("keydown"), true);
window.addEventListener("keyup", remapKey("keyup"), true);

// ───────── 滑鼠點擊移動（設定 → 按鍵配置 → 移動方式）─────────
let cmT = 0;
function clickMoveAt(e) {
  const Z = SCALE * 1.35, wx = cam.x + (e.clientX - W / 2) / Z, wy = cam.y + (e.clientY - H / 2) / Z;
  if (W0.mobs.some((m) => !m.dead && Math.hypot(m.x - wx, m.y - wy) < 14)) return false; // 點到怪＝照樣出左鍵那招
  AUTO = { x: wx, y: wy, mv: 1, near: 6 };
  return true;
}
cvs.addEventListener("pointerdown", (e) => {
  if (!SET74.clickMove || e.pointerType !== "mouse" || e.button !== 0 || state !== "world" || !W0 || (typeof AUTO !== "undefined" && AUTO && AUTO.pick)) return;
  if (clickMoveAt(e)) mouse.down = false;
});
cvs.addEventListener("pointermove", (e) => {
  if (!SET74.clickMove || e.pointerType !== "mouse" || !(e.buttons & 1) || state !== "world" || !W0) return;
  const now = performance.now(); if (now - cmT < 150) return; cmT = now;
  if (typeof AUTO !== "undefined" && AUTO && AUTO.mv) clickMoveAt(e);
});

// 不顯示傷害數字
const _updateWorld74 = updateWorld;
updateWorld = function () { // eslint-disable-line no-func-assign
  const n0 = floaters ? floaters.length : 0;
  const r = _updateWorld74.apply(this, arguments);
  if (!SET74.dmg && floaters && floaters.length) for (let i = floaters.length - 1; i >= 0; i--) if (floaters[i].num) floaters.splice(i, 1);
  return r;
};
// 背景音樂走音樂音量
const _updateBgm74 = updateBgm;
updateBgm = function () { AUDIO_BUS = "music"; try { return _updateBgm74.apply(this, arguments); } finally { AUDIO_BUS = "sfx"; } }; // eslint-disable-line no-func-assign

// ───────── 設定視窗 ─────────
let setTab = "gen", keyCatch = null;
const OPS = [["左鍵（按住）", "普攻；點地上的物品名字＝走過去撿"], ["Q／E", "招式（技能頁換招）"], ["空白", "身法（閃身）"], ["1／2／3", "換武器組"], ["4／5／6／7", "回春／聚氣／護體／淨化丹"], ["F", "撿附近的東西"], ["按住 Alt", "顯示所有掉落物名字"], ["V", "護身法術"], ["I", "行囊"], ["C", "角色"], ["N", "技能"], ["P", "天賦樹"], ["B", "鐵匠鋪"], ["M／Tab", "星盤（大地圖）"], ["Y", "任務"], ["K", "冒險手冊"], ["L", "卡片"], ["R", "排行"], ["G", "聊天"], ["Esc", "關掉視窗／設定"]];
const OPS_TOUCH = [["左下搖桿", "移動"], ["右下大按鈕", "普攻（按住連打）"], ["Q／E 按鈕", "招式"], ["閃身按鈕", "身法"], ["「撿」按鈕", "撿附近的東西（靠近時出現）"], ["下方快捷欄", "換武器組、丹藥、回城符"], ["右上一排", "行囊、角色、技能、天賦…"]];
function setGenHtml() {
  const sl = (k, n) => `<div class="s74sl"><span>${n}</span><input type="range" min="0" max="100" step="5" value="${VOL[k]}" data-vol="${k}" aria-label="${n}"><b>${VOL[k]}</b></div>`;
  const tg = (on, attr, n) => `<label class="s74tg"><span>${n}</span><input type="checkbox" data-${attr} ${on ? "checked" : ""}><i></i></label>`;
  return `<div class="s74two"><div class="s74col">
    <h3>音量</h3>${sl("m", "主音量")}${sl("s", "音效")}${sl("b", "音樂")}${tg(muted, "mute", "靜音")}${tg(A11.bgm, "bgm", "背景音樂（每個地區不同）")}
    <h3>畫面</h3>${tg(SET74.dmg, "dmg", "顯示傷害數字")}${tg(SET74.names, "names", "一直顯示掉落物名字（關掉＝只有按住 Alt 才顯示；紫、橘一定顯示）")}
    ${tg(A11.low, "low", "低階手機模式（解析度降低、特效減半）")}${tg(A11.cb, "cb", "色弱預警（危險範圍加閃爍白色虛線）")}
    <div class="s74row"><span>字體大小</span>${[["s", "小"], ["m", "中"], ["l", "大"]].map(([v, n]) => `<button data-fz="${v}" class="${A11.font === v ? "on" : ""}">${n}</button>`).join("")}</div>
    <div class="s74row"><span>畫面方向</span><button data-o="land" class="${orient === "land" ? "on" : ""}">橫向</button><button data-o="port" class="${orient === "port" ? "on" : ""}">直向</button></div>
    <div class="s74row"><span>隊友招式特效</span>${[["full", "全部"], ["dim", "淡化"], ["off", "關閉"]].map(([v, n]) => `<button data-af="${v}" class="${(save.w.allyFx || "dim") === v ? "on" : ""}">${n}</button>`).join("")}</div>
    <h3>遊戲</h3>${tg(save.w.autoPot !== false, "ap", "血量低於 30% 自動吃回春丹")}${tg(!!save.w.autoAtk, "aa", "半自動朝最近的敵人割草")}
    <h3>帳號</h3><div class="s74row wrap"><button id="s74Upd">更新內容</button><button id="s74Stuck">解除卡住</button><button id="s74Rep">回報問題${typeof ERR_LOG !== "undefined" && ERR_LOG.length ? `（${ERR_LOG.length}）` : ""}</button></div>
  </div><div class="s74col"><h3>操作說明</h3><dl class="s74ops">${(TOUCH ? OPS_TOUCH : OPS).map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join("")}</dl></div></div>`;
}
function setKeyHtml() {
  if (TOUCH) return `<p class="dim">手機、平板沒有鍵盤，這一頁只有接上鍵盤時有用。</p>`;
  const row = ([id, n]) => { const [a, b] = keyOf(id), chg = keyBinds[id]; return `<div class="s74k"><span>${n}</span><button data-kc="${id}:0" class="${keyCatch === id + ":0" ? "catch" : ""}">${keyCatch === id + ":0" ? "按一個鍵…" : keyLabel(a)}</button><button data-kc="${id}:1" class="${keyCatch === id + ":1" ? "catch" : ""}">${keyCatch === id + ":1" ? "按一個鍵…" : keyLabel(b)}</button><button data-kr="${id}" class="s74rst" ${chg ? "" : "disabled"} aria-label="恢復">↺</button></div>`; };
  return `<p class="s74note">點一格再按新的鍵；新的鍵已經被別的動作用了，兩個動作的鍵會對調。Esc、滑鼠不能改。只會存下你改過的鍵。</p>
    <div class="s74row"><span>移動方式</span><button data-cm="0" class="${SET74.clickMove ? "" : "on"}">WASD 鍵盤移動</button><button data-cm="1" class="${SET74.clickMove ? "on" : ""}">滑鼠點擊移動</button><small class="dim">點擊移動：左鍵點地面走過去、點怪出左鍵那招</small></div>
    <div class="s74two keys">${KEY_ACTS.map(([g, L]) => `<div class="s74col"><h3>${g}<small>主要　次要</small></h3>${L.map(row).join("")}</div>`).join("")}</div>
    <div class="s74row"><button id="s74KeyAll">全部恢復預設</button></div>`;
}
function openSettings() {
  if (ovKind !== "menu" && !ovOpen("menu")) return;
  const tabs = [["gen", "一般"], ["key", "按鍵配置"], ["pick", "保留與拾取"]];
  ov.innerHTML = `<div class="col cw s74"><div class="s74tabs">${tabs.map(([k, n]) => `<button data-st="${k}" class="${setTab === k ? "on" : ""}">${n}</button>`).join("")}</div>
    <div class="s74body">${setTab === "gen" ? setGenHtml() : setTab === "key" ? setKeyHtml() : pickKeepHtml()}</div>
    <div class="s74foot"><button id="s74Go" class="gold">繼續遊戲</button><button id="s74Save">存檔</button><button id="s74Out" class="red">${typeof AUTH_ON !== "undefined" && AUTH_ON ? "登出" : "回到主畫面"}</button></div></div>`;
  const re = () => openSettings(), $ = (q) => ov.querySelector(q), all = (q, f) => ov.querySelectorAll(q).forEach(f);
  ov.querySelector(".s74").addEventListener("click", (e) => e.stopPropagation());
  all("[data-st]", (b) => b.onclick = () => { sfx("click"); setTab = b.dataset.st; keyCatch = null; re(); });
  $("#s74Go").onclick = () => ovClose();
  $("#s74Save").onclick = (e) => { writeSave(); if (typeof cloudFlush === "function") try { cloudFlush(); } catch (x) {} e.currentTarget.textContent = "存好了"; sfx("good"); };
  $("#s74Out").onclick = () => { ovKind = null; ov.className = "ov hidden"; typeof AUTH_ON !== "undefined" && AUTH_ON ? logout() : renderTitle(); };
  if (setTab === "gen") {
    all("[data-vol]", (r) => { r.oninput = () => { setVol(r.dataset.vol, +r.value); r.nextElementSibling.textContent = r.value; }; r.onchange = () => sfx("click"); });
    const ck = (a, f) => all(`[data-${a}]`, (c) => c.onchange = () => { f(c.checked); writeSave(); sfx("click"); });
    ck("mute", (v) => setMuted(v)); ck("bgm", (v) => a11Set("bgm", v)); ck("dmg", (v) => { SET74.dmg = v; set74Save(); }); ck("names", (v) => { SET74.names = v; set74Save(); });
    ck("low", (v) => a11Set("low", v)); ck("cb", (v) => a11Set("cb", v)); ck("ap", (v) => { save.w.autoPot = v; }); ck("aa", (v) => { save.w.autoAtk = v; });
    all("[data-fz]", (b) => b.onclick = () => { a11Set("font", b.dataset.fz); sfx("click"); re(); });
    all("[data-o]", (b) => b.onclick = () => { setOrient(b.dataset.o); updateRotHint(); sfx("click"); re(); });
    all("[data-af]", (b) => b.onclick = () => { save.w.allyFx = b.dataset.af; writeSave(); sfx("click"); re(); });
    $("#s74Upd").onclick = () => { sfx("click"); showUpdates(true); };
    $("#s74Stuck").onclick = (e) => { const why = unstuck(false); if (why) e.currentTarget.textContent = why; };
    $("#s74Rep").onclick = (e) => errReport(e.currentTarget);
  } else if (setTab === "key") {
    all("[data-cm]", (b) => b.onclick = () => { SET74.clickMove = b.dataset.cm === "1"; set74Save(); sfx("click"); re(); });
    all("[data-kc]", (b) => b.onclick = () => { sfx("click"); keyCatch = keyCatch === b.dataset.kc ? null : b.dataset.kc; re(); });
    all("[data-kr]", (b) => b.onclick = () => { delete keyBinds[b.dataset.kr]; keySaveAll(); sfx("click"); re(); });
    const ka = $("#s74KeyAll"); if (ka) ka.onclick = () => { for (const k in keyBinds) delete keyBinds[k]; keySaveAll(); sfx("click"); re(); };
  } else pickKeepBind(ov, re);
}
function keySaveAll() { try { localStorage.setItem("pr_keys", JSON.stringify(keyBinds)); } catch (e) {} keyMapBuild(); }
function keySet(id, slot, k) { // 新的鍵已經被別的動作用了 → 對調
  const cur = keyOf(id).slice(), old = cur[slot];
  for (const j in KEY_DEF) { if (j === id) continue; const o = keyOf(j).slice(); let ch = false; for (let s = 0; s < 2; s++) if (o[s] === k) { o[s] = old; ch = true; } if (ch) keyBinds[j] = o; }
  cur[slot] = k; keyBinds[id] = cur;
  for (const j in keyBinds) { const [a, b] = keyBinds[j]; if (a === KEY_DEF[j] && !b) delete keyBinds[j]; }
  keySaveAll();
}
window.addEventListener("keydown", (e) => { // 正在等新的鍵
  if (!keyCatch || ovKind !== "menu") return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (e.key === "Escape") { keyCatch = null; openSettings(); return; }
  const [id, s] = keyCatch.split(":"); keyCatch = null; keySet(id, +s, e.key.toLowerCase()); sfx("good"); openSettings();
}, true);
openMenu = openSettings; // eslint-disable-line no-func-assign
