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
  ctx.fillStyle = "#4a2a2a"; ctx.beginPath(); ctx.ellipse(ALTAR.x, ALTAR.y, 26, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `rgba(255,80,40,${0.5 + Math.sin(time * 4) * 0.3})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(ALTAR.x, ALTAR.y, 20, 10, 0, 0, Math.PI * 2); ctx.stroke();
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
function drawOrb(cx, cy, R, f, c1, c2, rim) {
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
function drawOrbs() {
  const p = W0, padOn = !pad.classList.contains("hidden") && getComputedStyle(pad).display !== "none";
  let R = clamp(Math.min(W, H) * 0.11, 34, 56);
  // 左下：生命血球
  const hx = SAFE.l + R + 14, hy = H - R - 18;
  drawOrb(hx, hy, R, p.hp / p.maxHp, "#c8282c", "#5a0a10", p.hp / p.maxHp < 0.3 ? `rgba(255,90,80,${0.6 + Math.sin(time * 8) * 0.4})` : "rgba(200,150,120,0.55)");
  ctx.textAlign = "center"; ctx.font = "bold 11px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#f2dede";
  ctx.fillText(`${Math.ceil(p.hp)}`, hx, hy + 2); ctx.font = "8px 'Noto Sans TC', sans-serif"; ctx.fillStyle = "#c8a8a8"; ctx.fillText(`/ ${p.maxHp}`, hx, hy + 12);
  // 右下：天罰能量球（外圈細藍弧＝真氣）
  let ex = W - SAFE.r - R - 14, ey = H - R - 18;
  if (padOn) {
    if (!atkRect || time - atkRectT > 1) { const b = pad.querySelector(".btn-atk"); atkRect = b && b.getBoundingClientRect(); atkRectT = time; }
    if (atkRect && atkRect.width) { ex = atkRect.left + atkRect.width / 2; ey = atkRect.top + atkRect.height / 2; R = atkRect.width / 2; }
  }
  const ef = (p.en || 0) / EN_FULL, full = ef >= 1;
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
  drawOrb(ex, ey, R, ef, full ? "#b090ff" : "#7a5ae0", "#1e1060", full ? "#ffd84a" : "rgba(150,140,220,0.6)");
  ctx.strokeStyle = "rgba(90,160,255,0.85)"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(ex, ey, R + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p.mp / B.maxMp, 0, 1)); ctx.stroke();
  if (!padOn) { // 電腦：球上寫字＋左邊招式冷卻
    ctx.textAlign = "center"; ctx.font = "bold 11px 'Noto Sans TC', sans-serif"; ctx.fillStyle = full ? "#ffe9a0" : "#d8d0ff";
    ctx.fillText(full ? "E 天罰" : `${Math.floor(ef * 100)}%`, ex, ey + 4);
    const sk = [["左鍵", WSKILL.attack.n, "attack"], ["Q", WSKILL.spin.n, "spin"], ["空白", "閃身", "roll"], ["1", `丹藥×${save.w.potions}`, "potion"]];
    let x = ex - R - 16 - sk.length * 50;
    for (const [k, n, id] of sk) {
      const cdm = id === "roll" ? B.rollCd : 1, f = p.cds[id] / (WSKILL[id].cd * cdm), lack = p.mp < (WSKILL[id].mp || 0);
      ctx.fillStyle = "rgba(14,12,18,0.72)"; ctx.fillRect(x, H - 50, 46, 30);
      if (f > 0) { ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(x, H - 50, 46, 30 * clamp(f, 0, 1)); }
      ctx.strokeStyle = "rgba(200,170,120,0.35)"; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, H - 49.5, 45, 29);
      ctx.fillStyle = lack ? "#6a6070" : "#e8dcc0"; ctx.font = "bold 10px 'Noto Sans TC', sans-serif"; ctx.fillText(n, x + 23, H - 36);
      ctx.fillStyle = "#9a8e78"; ctx.font = "8px 'Noto Sans TC', sans-serif"; ctx.fillText(k, x + 23, H - 25);
      x += 50;
    }
  }
  const ub = pad.querySelector('[data-act="ult"]');
  if (ub) { ub.style.setProperty("--ult", ef); ub.classList.toggle("ready", full); ub.style.opacity = 1; }
}

// ───────── 覆蓋層 #ov ─────────
const ov = document.createElement("div");
ov.id = "ov"; ov.className = "ov hidden";
document.body.appendChild(ov);
let ovKind = null, ovJust = false, ovMsg = "";
function ovOpen(kind) {
  if (!(state === "world" || (state === "pick" && pausedFrom === "world"))) return false;
  pausedFrom = "world"; state = "pick";
  keys.clear(); stick.id = null; mouse.down = false; pad.classList.add("hidden"); screenEl.classList.add("hidden");
  ovKind = kind; ovJust = true; setTimeout(() => { ovJust = false; }, 0);
  ov.className = `ov k-${kind}`; requestAnimationFrame(() => ov.classList.add("show"));
  return true;
}
function ovClose() {
  if (!ovKind) return;
  ovKind = null; eqSel = null; mapSel = null;
  ov.classList.remove("show");
  setTimeout(() => { if (!ovKind) { ov.className = "ov hidden"; ov.innerHTML = ""; } }, 220);
  if (state === "pick" && pausedFrom === "world") worldReturn();
}
// 點到沒有字、沒有按鈕的地方 → 收起來
ov.addEventListener("click", (e) => {
  if (e.target.closest("button, .loot, .star, .cmp-item, .info, .tile, .setrow, .starmap, .gems, .stat, h2, h3, p, b, small, img")) return;
  sfx("click"); ovClose();
});
const OV_KEYS = { bag: ["i", "b", "escape"], map: ["m", "tab", "t", "escape"], menu: ["escape", "p"] };
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (!ovKind || ovJust || e.repeat) return;
  if (k === "tab") e.preventDefault();
  if ((OV_KEYS[ovKind] || []).includes(k)) { ovClose(); return; }
  const sw = { i: "bag", b: "bag", m: "map", tab: "map" }[k];
  if (sw && sw !== ovKind) { ovKind = null; state = "world"; sw === "bag" ? renderEquip() : openStarMap(); }
});

// ───────── 背包：左 星芒裝備位／中 瀑布流／右 詞條對比 ─────────
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
function heroURL() { const c = heroImg(false); return c.toDataURL ? c.toDataURL() : ""; }
function renderEquip(msg = "") {
  if (typeof tutEvent === "function") tutEvent("bag");
  if (ovKind !== "bag" && !ovOpen("bag")) return;
  if (msg) ovMsg = msg;
  const bag = save.bag.slice().sort((a, b) => b.q - a.q || itemCP(b) - itemCP(a));
  const selItem = eqSel && eqSel.startsWith("eq:") ? save.eq[eqSel.slice(3)] : save.bag.find((b) => b.id === eqSel);
  const stars = SLOT_KEYS.map((k) => {
    const it = save.eq[k], [sx, sy] = STAR_POS[k], c = it ? RARITY[it.q].c : "#6a6078";
    return `<button class="star${eqSel === "eq:" + k ? " sel" : ""}${it ? " on" : ""}" data-eq="${k}" style="left:${50 + sx * 38}%;top:${46 + sy * 34}%;--c:${c}">${it ? itemIcon(it) : "<i></i>"}<small>${SLOTS[k].n}${it && it.en ? ` +${it.en}` : ""}</small></button>`;
  }).join("");
  let right = `<div class="r-empty"><h3>詞條對比</h3><p>點中間的裝備，這裡會顯示詳細詞條，並跟身上的比較</p><p>長按卡片＝直接穿上</p><p class="dim">點旁邊空白處、或再按一次 I 收起背包</p></div>`;
  if (selItem) {
    const worn = eqSel.startsWith("eq:"), cur = save.eq[selItem.slot], diff = itemCP(selItem) - itemCP(cur);
    right = `<div class="cmp-item">
      <div class="big-ico" style="--c:${RARITY[selItem.q].c}">${itemIcon(selItem)}</div>
      <h3 style="color:${RARITY[selItem.q].c}">${selItem.name}</h3>
      <small>${RARITY[selItem.q].n}・${selItem.slot === "sword" ? `${WEAPONS[wtOf(selItem)].n}（${WEAPONS[wtOf(selItem)].job}）` : SLOTS[selItem.slot].n}・${selItem.il} 級${selItem.risk ? '・<span class="risk">未帶回</span>' : ""}</small>
      <div class="cp">戰力 ${itemCP(selItem)}${worn || !cur ? "" : ` <em class="${diff >= 0 ? "up" : "down"}">${diff >= 0 ? "+" : ""}${diff} ${diff >= 0 ? "↑" : "↓"}</em>`}</div>
      ${!worn && cur ? `<small class="vs">對比身上：<span style="color:${RARITY[cur.q].c}">${cur.name}</span></small>` : ""}
      <div class="stats">${cmpRows(selItem, cur)}</div>
      <div class="acts">
        ${worn ? `<button id="unequip">卸下</button>` : `<button id="equip" class="gold">穿上</button><button id="sell" class="red">出售 +${sellPrice(selItem)}</button>`}
        ${(selItem.en || 0) < EN_MAX ? `<button id="enh" class="gold">強化 +${(selItem.en || 0) + 1}<small>${Math.round(EN_RATE[selItem.en || 0] * 100)}%・${enCost(selItem)} 靈石</small></button>` : ""}
        ${!selItem.u && selItem.q > 0 ? `<button id="reroll">洗練<small>${rerollCost(selItem)} 靈石</small></button>` : ""}
        ${selItem.q < 2 ? `<button id="upq">點金<small>${upCost(selItem)} 靈石</small></button>` : ""}
      </div></div>`;
  }
  ov.innerHTML = `<div class="col l"><div class="hero-wrap"><img class="hero-big" src="${heroURL()}" alt="">${stars}</div>
      <div class="info"><b>戰力 ${totalCP()}</b><small>靈石 ${save.stone}・招式 ${WEAPONS[curWeapon()].job}</small></div>
      ${gemHtml()}</div>
    <div class="col c"><h2>行囊 <small>${save.bag.length} / ${BAG_MAX}</small></h2>
      <div class="flow">${bag.length ? bag.map((it) => {
        const better = sameWt(it) && itemCP(it) > itemCP(save.eq[it.slot]), aff = Object.keys(it.aff || {});
        return `<div class="loot q${it.q}${eqSel === it.id ? " sel" : ""}" data-id="${it.id}" style="--c:${RARITY[it.q].c}">${itemIcon(it)}<div><b>${it.name}</b><small>${SLOTS[it.slot].n}・${it.il} 級・戰 ${itemCP(it)}${better ? ' <em class="up">↑</em>' : ""}</small>${aff.slice(0, it.q).map((k) => `<i>${fmtAff(k, it.aff[k])}</i>`).join("")}${it.risk ? '<em class="risk">未帶回</em>' : ""}</div></div>`;
      }).join("") : `<p class="dim">行囊是空的。到野外斬妖撿裝備吧</p>`}</div>
      <div class="acts row"><button id="autoEq" class="gold">一鍵換最強</button><button id="sellJunk">賣掉凡品、靈品</button></div></div>
    <div class="col r">${right}</div>
    ${ovMsg ? `<div class="toast">${ovMsg}</div>` : ""}`;
  ovMsg = "";
  bindEquip(selItem);
}
function bindEquip(selItem) {
  const again = (m) => renderEquip(m);
  ov.querySelectorAll(".loot").forEach((c) => {
    let t = null, long = false;
    c.addEventListener("pointerdown", () => { long = false; t = setTimeout(() => { long = true; const it = save.bag.find((b) => b.id === c.dataset.id); if (it) { equipItem(it); eqSel = null; again(`穿上了 ${it.name}`); } }, 450); });
    const stop = () => clearTimeout(t);
    c.addEventListener("pointerup", stop); c.addEventListener("pointerleave", stop); c.addEventListener("pointercancel", stop);
    c.addEventListener("contextmenu", (e) => e.preventDefault());
    c.addEventListener("click", () => { if (long) return; sfx("click"); eqSel = eqSel === c.dataset.id ? null : c.dataset.id; again(); });
  });
  ov.querySelectorAll(".star").forEach((b) => b.addEventListener("click", () => { sfx("click"); eqSel = save.eq[b.dataset.eq] && eqSel !== "eq:" + b.dataset.eq ? "eq:" + b.dataset.eq : null; again(); }));
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = () => { sfx("click"); fn(); }; };
  on("equip", () => { equipItem(selItem); eqSel = null; again(`穿上了 ${selItem.name}`); });
  on("unequip", () => {
    if (save.bag.length >= BAG_MAX) { again("行囊滿了，先賣掉一些"); return; }
    save.bag.push(selItem); delete save.eq[selItem.slot]; eqSel = null; writeSave(); again();
  });
  on("sell", () => { ungem(selItem); save.stone += sellPrice(selItem); save.bag = save.bag.filter((b) => b !== selItem); eqSel = null; writeSave(); again(`賣掉 ${selItem.name}，靈石 +${sellPrice(selItem)}`); });
  on("enh", () => {
    const c = enCost(selItem);
    if (save.stone < c) { again("靈石不夠"); return; }
    save.stone -= c;
    if (Math.random() < EN_RATE[selItem.en || 0]) { selItem.en = (selItem.en || 0) + 1; nameItem(selItem); writeSave(); sfx("arrive"); again(`強化成功！${selItem.name}`); }
    else { writeSave(); sfx("hurt"); again(`強化失敗⋯⋯靈石 −${c}（裝備沒事）`); }
  });
  on("reroll", () => {
    const c = rerollCost(selItem);
    if (save.stone < c) { again("靈石不夠"); return; }
    save.stone -= c;
    const [a0, a1] = RARITY[selItem.q].aff;
    rollAffixes(selItem, Math.max(Object.keys(selItem.aff).length, a0 + Math.floor(Math.random() * (a1 - a0 + 1))));
    nameItem(selItem); writeSave(); sfx("good"); again(`洗練完成：${selItem.name}`);
  });
  on("upq", () => {
    const c = upCost(selItem);
    if (save.stone < c) { again("靈石不夠"); return; }
    save.stone -= c; selItem.q++;
    selItem.base = SLOTS[selItem.slot].base === "crit" ? Math.round(selItem.base * 1.12 * 10) / 10 : Math.round(selItem.base * 1.12);
    rollAffixes(selItem, Math.max(RARITY[selItem.q].aff[0], Object.keys(selItem.aff).length + 1));
    nameItem(selItem); writeSave(); sfx("arrive"); again(`點金成功：${selItem.name}`);
  });
  on("autoEq", () => {
    let n = 0;
    for (const k of SLOT_KEYS) {
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
    w.so = w.so || []; const n = SOCKETS[w.q];
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
const ZONE_BOSS = { town: "無（安全區）", grass: "精英小妖、狼妖首領", forest: "精英樹妖", waste: "精英石甲妖、獵寶妖", volcano: "焚天石魔 Lv.22（祭壇）", snow: "精英雪巨猿" };
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
    : `<div class="info"><h3>星盤</h3><p>發光的飛劍符文是已點亮的營地，點一下看資訊、御劍過去</p><p class="dim">黑霧是還沒去過的地方；走到營地附近就會點亮符文</p><p class="dim">點旁邊空白處、或再按一次 M 收起</p></div>`;
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
  if (fogSeen(ALTAR.x, ALTAR.y)) { g.fillStyle = `rgba(255,70,40,${0.6 + 0.3 * Math.sin(t * 4)})`; g.beginPath(); g.arc(x0 + ALTAR.x * s, y0 + ALTAR.y * s, 4, 0, Math.PI * 2); g.fill(); }
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

// ───────── 功能選單（☰）─────────
const MENU_TILES = [["bag", "行囊", "I"], ["ap", "角色", "C"], ["map", "星盤", "M"], ["rank", "排行", "R"], ["swap", "換武器", "F"], ["mute", "音效", ""]];
function openMenu() {
  if (ovKind !== "menu" && !ovOpen("menu")) return;
  const w = save.w, ap = w.autoPot !== false, aa = !!w.autoAtk;
  ov.innerHTML = `<div class="col l"></div><div class="col c menu"><h2>選單</h2>
    <div class="tiles">${MENU_TILES.map(([k, n, key]) => `<button class="tile" data-m="${k}">${typeof UI_ICON !== "undefined" && UI_ICON[k === "map" ? "tp" : k === "mute" ? (muted ? "mute" : "sound") : k] ? uiIcon(k === "map" ? "tp" : k === "mute" ? (muted ? "mute" : "sound") : k) : ""}<span>${k === "mute" ? (muted ? "音效：關" : "音效：開") : n}</span>${key && !TOUCH ? `<small>${key}</small>` : ""}</button>`).join("")}</div>
    <h3>防疲勞</h3>
    <div class="setrow"><span>血量低於 30% 自動吃丹藥</span><button class="tab${ap ? " on" : ""}" data-ap="1">開</button><button class="tab${!ap ? " on" : ""}" data-ap="0">關</button></div>
    <div class="setrow"><span>半自動朝最近的敵人割草</span><button class="tab${aa ? " on" : ""}" data-aa="1">開</button><button class="tab${!aa ? " on" : ""}" data-aa="0">關</button></div>
    <div class="setrow"><span>畫面方向</span><button class="tab${orient === "land" ? " on" : ""}" data-o="land">橫向</button><button class="tab${orient === "port" ? " on" : ""}" data-o="port">直向</button></div>
    <div class="acts row"><button id="logout" class="red">${typeof AUTH_ON !== "undefined" && AUTH_ON ? "登出" : "回標題（會存檔）"}</button></div>
    <p class="dim">${liveWorld() ? "連線中，遊戲不會暫停" : ""}　點空白處回到戰鬥</p></div><div class="col r"></div>`;
  ov.querySelectorAll(".tile").forEach((b) => b.addEventListener("click", () => {
    sfx("click"); const m = b.dataset.m;
    if (m === "mute") { setMuted(!muted); openMenu(); return; }
    if (m === "bag") { ovKind = null; renderEquip(); return; }
    if (m === "map") { ovKind = null; openStarMap(); return; }
    ovClose(); setTimeout(() => openHud(m), 0);
  }));
  const tog = (attr, fn) => ov.querySelectorAll(`[data-${attr}]`).forEach((b) => b.addEventListener("click", () => { sfx("click"); fn(b.dataset[attr]); writeSave(); openMenu(); }));
  tog("ap", (v) => { w.autoPot = v === "1"; });
  tog("aa", (v) => { w.autoAtk = v === "1"; });
  tog("o", (v) => { setOrient(v); updateRotHint(); });
  document.getElementById("logout").onclick = () => { ovKind = null; ov.className = "ov hidden"; typeof AUTH_ON !== "undefined" && AUTH_ON ? logout() : renderTitle(); };
}

// 右上角「☰」：極細線圓形漢堡選單
pauseBtn.innerHTML = '<span class="burger"><i></i><i></i><i></i></span>';
pauseBtn.setAttribute("aria-label", "選單");
// 背包、角色等舊畫面（screenEl）也一樣：點背景空白處就回到戰鬥
screenEl.addEventListener("click", (e) => { if (e.target === screenEl && state === "pick" && pausedFrom === "world") worldReturn(); });
setInterval(() => document.body.classList.toggle("inworld", typeof inWorld !== "undefined" && inWorld && (state === "world" || pausedFrom === "world")), 300);
