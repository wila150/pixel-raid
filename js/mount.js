// 萬劍仙途 — 坐騎（企劃 12 §2-3、第 8 項）
// 四隻區域王首殺各送一隻，速度都一樣（沒戰鬥時移速 +60%），只差外觀；被打或出招就下來，3 秒沒戰鬥自動再騎。
// 秘境、打王場地不能騎；自動尋路也會騎。別人看得到（gearKey 第 5 欄）。
"use strict";

const MOUNT_SPD = 1.6, MOUNT_CALM = 3;
const MOUNTS = {
  lava: { n: "熔岩獸", boss: "volcano", glow: "#ff8a3d", img: sprite([
    "..........kk....", ".........kRRk...", "..k......kRYRk..", ".kRkkkkkkRRRRRk.", "kRORRORRORRRkk..", "kRRRRRRRRRRRk...", ".kROk.kk.kROk...", ".kk.......kk....",
  ], { k: K, R: "#c8402a", O: "#ff8a3d", Y: "#ffe066" }) },
  toad: { n: "毒蟾", boss: "swamp", glow: "#8ad86a", img: sprite([
    "........kk..kk..", ".......kYek.kYek", "..kkkkkkGGGGGGk.", ".kGgGGgGGGGgGGGk", "kGGGGGGGGGGGGGGk", ".kGGkkkkkkkkGGk.", "kGGk........kGGk", "kkk..........kkk",
  ], { k: K, G: "#4a9a3a", g: "#b8f070", Y: "#ffe066", e: K }) },
  peng: { n: "雷鵬", boss: "thunder", glow: "#6fd8ff", img: sprite([
    "kk..........kk..", "kYk........kYk..", ".kYk..kk..kYk...", "..kYkkBBkkYk....", "...kBBBBBBBkkk..", "...kBWBBBBBBBOk.", "....kBBBBBBkkk..", ".....kk..kk.....",
  ], { k: K, B: "#3c6fd1", W: "#cfe8ff", Y: "#ffe066", O: "#ff8a3d" }) },
  cloud: { n: "劍雲", boss: "sky", glow: "#fff1b0", img: sprite([
    "...kSSSSSSSSYYk.", "....kkkkkkkkkk..", "...kk.kkkk..kk..", "..kWWkWWWWkkWWk.", ".kWWWWWWWWWWWWWk", "kWWwWWWWWWWwWWWk", ".kwwWWwwWWWwwwk.", "..kkkkkkkkkkkk..",
  ], { k: K, S: "#d8e4f0", Y: "#ffd84a", W: "#f4f8ff", w: "#b8c8e0" }) },
};
const MOUNT_KEYS = Object.keys(MOUNTS);
const mountHas = (k) => !!(save.w && (save.w.mounts || []).includes(k));
// 現在有沒有騎著（回傳坐騎 key 或 null）
function mountRide() {
  const w = save.w, p = W0;
  if (!w || !p || !w.mount || !mountHas(w.mount) || state !== "world" || !inWorld) return null;
  if ((typeof RIFT !== "undefined" && RIFT) || (typeof wbArena === "function" && wbArena())) return null;
  if ((p.fightAgo === undefined ? MOUNT_CALM : p.fightAgo) < MOUNT_CALM || p.roll > 0) return null;
  return w.mount;
}
const mountMul = () => (mountRide() ? MOUNT_SPD : 1);
function drawMount(k, x, y, flip, walk) {
  const M = MOUNTS[k]; if (!M) return;
  const bob = Math.floor(walk || 0) % 2;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (flip) ctx.scale(-1, 1);
  if (k === "cloud") { ctx.globalAlpha = 0.5 + 0.2 * Math.sin(time * 3); ctx.fillStyle = M.glow; ctx.fillRect(-9, 8, 18, 1); ctx.globalAlpha = 1; }
  ctx.drawImage(M.img, -8, 1 - (k === "cloud" ? Math.round(Math.sin(time * 2.5)) : bob));
  ctx.restore();
  if (k === "lava" && Math.random() < 0.15) particles.push({ x: x + rand(-6, 6), y: y + 6, vx: 0, vy: -10, life: 0.4, max: 0.4, color: "#ff8a3d", size: 1 });
  if (k === "peng" && Math.random() < 0.08) particles.push({ x: x + rand(-8, 8), y: y + rand(0, 6), vx: 0, vy: 0, life: 0.15, max: 0.15, color: "#cfe8ff", size: 1 });
}
const mountIconCache = {};
function mountIcon(k) {
  if (mountIconCache[k]) return mountIconCache[k];
  const c = document.createElement("canvas"); c.width = 18; c.height = 12;
  c.getContext("2d").drawImage(MOUNTS[k].img, 1, 2);
  return (mountIconCache[k] = c.toDataURL());
}

// 戰鬥判定：被打、出招就下來
const _skillUsedM = skillUsed;
skillUsed = function (k) { if (W0 && k !== "potion") W0.fightAgo = 0; return _skillUsedM.apply(this, arguments); };
const _updateWorldM = updateWorld;
updateWorld = function (dt) {
  const p = W0;
  if (p) { p.fightAgo = (p.fightAgo === undefined ? MOUNT_CALM : p.fightAgo) + dt; if (p.hurt > 0) p.fightAgo = 0; }
  const r = _updateWorldM.apply(this, arguments);
  if (p && W0 === p) {
    const rd = mountRide();
    if (!!rd !== !!p.wasRide) { burst(p.x, p.y + 4, rd ? MOUNTS[rd].glow : "#cfc4dc", 8, 40, 0.3); if (rd && typeof seenHint === "function") seenHint("mount", `騎上${MOUNTS[rd].n}：沒戰鬥時移動 +60%，出招或被打就會下來`); }
    p.wasRide = rd;
  }
  return r;
};

// 首殺補發（也處理舊存檔已經打過的）
function mountGrant() {
  const w = save.w; if (!w || !w.created || typeof rbKilled !== "function") return;
  const got = [];
  for (const k of MOUNT_KEYS) if (!mountHas(k) && rbKilled(MOUNTS[k].boss)) { (w.mounts = w.mounts || []).push(k); got.push(MOUNTS[k].n); if (!w.mount) w.mount = k; }
  if (!got.length) return;
  writeSave();
  if (typeof say === "function") say(`得到坐騎「${got.join("、")}」！沒戰鬥時移動 +60%，角色→外觀可以換`, "#ffe9a8");
  if (ovKind === "bag" && typeof renderBag === "function") renderBag();
}
setInterval(() => { if (inWorld && state === "world") mountGrant(); }, 1500);

// 行囊坐騎格
function mountCell([cx, cy]) {
  const k = save.w && save.w.mount && mountHas(save.w.mount) ? save.w.mount : null;
  return `<button class="eqc mount${k ? " on" : ""}" data-mount="1" title="坐騎（角色→外觀換）" style="grid-column:${cx};grid-row:${cy};--c:${k ? MOUNTS[k].glow : "#6a6078"}">${k ? `<img src="${mountIcon(k)}" alt="">` : "<small>坐騎</small>"}</button>`;
}
document.addEventListener("click", (e) => {
  const b = e.target.closest && e.target.closest("[data-mount]"); if (!b) return;
  sfx("click"); chTab = "look"; renderChar();
});

// 角色→外觀：選坐騎
const _fashionHtmlM = fashionHtml;
fashionHtml = function () {
  const w = save.w, cur = w.mount || "";
  return _fashionHtmlM.apply(this, arguments) + `<div class="mountbox"><div class="baghead">坐騎（沒戰鬥時移動 +60%，每隻速度一樣；秘境、打王場地不能騎）</div>
    <div class="skins">${MOUNT_KEYS.map((k) => { const M = MOUNTS[k], has = mountHas(k);
      return `<button class="skin${cur === k && has ? " sel" : ""}" data-mk="${k}"${has ? "" : " disabled"}><img src="${mountIcon(k)}" alt=""${has ? "" : ' style="filter:grayscale(1) brightness(0.5)"'}><b>${M.n}</b><small>${!has ? `首殺${RBOSS[M.boss].n}取得` : cur === k ? "騎乘中" : "點一下換上"}</small></button>`; }).join("")}
      <button class="skin${!cur ? " sel" : ""}" data-mk=""><b>不騎</b><small>${!cur ? "使用中" : "用走的"}</small></button></div></div>`;
};
const _bindFashionM = bindFashion;
bindFashion = function () {
  _bindFashionM.apply(this, arguments);
  document.querySelectorAll("[data-mk]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.mk; if (k && !mountHas(k)) return;
    save.w.mount = k; writeSave(); sfx("arrive"); renderAP(k ? `坐騎：${MOUNTS[k].n}` : "不騎坐騎");
  }));
};
