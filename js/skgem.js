// 萬劍仙途 — 技能寶石（企劃 37，總表第 24 項，v8.1）
// 技能要有「技能寶石」才能用：原本的普攻／Q／E／閃身免費；其他到營地「技能商人」用靈石買（需要等級 ×40）。
// 存檔（帳號共用，三個角色一起用）：save.skg = { "sword:q:wan": { lv, xp }, "r:ghost": {...}, "sword:a:base": {...} }
// 寶石 1–20 級：放在技能鏈上的四顆（普攻／Q／E／身法）各分到角色經驗的 10%；有效等級 ≤ 角色等級÷5＋4。
// 每級傷害 +2%（企劃寫 3%，§3 驗算：Lv.100 平均寶石 10 級 → +27%，打王快 21% 超過 15%，照企劃改 2%），每 5 級冷卻 −3%。
"use strict";
const SKG_PRICE = 40, SKG_MAX = 20, SKG_DMG = 0.02, SKG_CD = 0.03, SKG_SHARE = 0.1;
const SL_ID = { a: "attack", q: "spin", e: "ult", r: "roll" };
const skgKey = (wt, l, k) => (l === "r" ? "r:" + (k || "base") : `${wt}:${l}:${k || "base"}`);
const skgStore = () => save.skg || (save.skg = {});
const skgFree = (k) => k.endsWith(":base");
const skgHas = (k) => skgFree(k) || !!skgStore()[k];
const skgCap = () => Math.min(SKG_MAX, Math.floor(wLv() / 5) + 4);
const skgRaw = (k) => { const o = skgStore()[k]; return o ? o.lv : 1; };
const skgLv = (k) => Math.min(skgRaw(k), skgCap()); // 有效等級
const skgNeedXp = (L) => Math.round(0.4 * expNext(Math.max(1, 5 * L - 15)));
const skgPrice = (wt, l, k) => triNeed(wt, l, k) * SKG_PRICE;
// 這一格現在用的是哪顆技能寶石（起源、傳說專屬、被改寫的 Q 不是寶石）
function skgOfSlot(sl, wt = curWeapon()) {
  if (!sl || !save.w || typeof slotSkill !== "function") return null;
  const k = sl === "q" && !B ? triOf(wt, "q") || "base" : slotSkill(sl, wt); if (k === "origin" || k === "uq" || k === "over") return null;
  return skgKey(wt, sl, k);
}
const skgDmg = (sl) => { const k = skgOfSlot(sl); return typeof SPELL_W !== "undefined" && SPELL_W[curWeapon()] ? 1 : k ? 1 + SKG_DMG * (skgLv(k) - 1) : 1; };
const skgCdMul = (sl) => { const k = skgOfSlot(sl); return k ? 1 - SKG_CD * Math.floor(skgLv(k) / 5) : 1; };
function skgName(key) {
  const p = key.split(":");
  if (p[0] === "r") return p[1] === "base" ? "閃身" : (TRI.r.find((o) => o.k === p[1]) || {}).n || p[1];
  const [wt, l, k] = p, ws = WSKILLS[wt];
  if (k === "base") return l === "a" ? ws.attack[0] : l === "q" ? ws.spin[0] : ws.ult[0];
  return ((triList(wt, l) || []).find((o) => o.k === k) || {}).n || k;
}
// 技能能不能用：有寶石＋等級到（舊三選一選過的照舊不看等級）
triOpen = function (wt, l, k) {
  if (!save.w) return false; triMig();
  const own = (save.w.triOwn || []).includes(triOwnKey(wt, l, k));
  return skgHas(skgKey(wt, l, k)) && (own || wLv() >= triNeed(wt, l, k));
};
// 舊存檔（每個角色第一次進來）：已經達到等級的技能全部送
function skgMig() {
  const w = save.w; if (!w || !w.created || w.skgV) return 0;
  const S = skgStore(), lv = w.lv || 1, own = w.triOwn || []; let n = 0;
  const give = (key) => { if (!S[key]) { S[key] = { lv: 1, xp: 0 }; n++; } };
  for (const wt in TRI) { if (wt === "r") continue; for (const l of ["a", "q", "e"]) (triList(wt, l) || []).forEach((o, i) => { if (TRI_LV[l][i] <= lv || own.includes(triOwnKey(wt, l, o.k))) give(skgKey(wt, l, o.k)); }); }
  TRI.r.forEach((o, i) => { if (TRI_LV.r[i] <= lv || own.includes("r:" + o.k)) give("r:" + o.k); });
  w.skgV = 1; return n;
}
const _enterWorldSkg = enterWorld;
enterWorld = function () {
  const out = _enterWorldSkg.apply(this, arguments);
  const n = skgMig();
  if (save.w && save.w.created && !save.skgHint && (n || (save.w.lv || 1) >= 10)) {
    save.skgHint = 1;
    setTimeout(() => { writeSave(); if (typeof notice === "function") notice(`技能變成「技能寶石」了！${n ? `你已經達到等級的 ${n} 個技能直接送你。` : ""}新的技能要到營地的技能商人買（技能 → 技能商人）；技能寶石用越久越強（最高 20 級）`, "#ffe066"); }, 3200);
  } else if (n) writeSave();
  return out;
};
// 經驗分給技能鏈上的四顆技能寶石
function skgGain(n) {
  const w = save.w; if (!w || !(n > 0)) return;
  const S = skgStore(), wt = curWeapon(), cap = skgCap(), up = [];
  for (const sl of ["a", "q", "e", "r"]) {
    const key = skgOfSlot(sl, wt); if (!key) continue;
    const o = S[key] || (S[key] = { lv: 1, xp: 0 });
    if (o.lv >= cap) continue;
    o.xp += n * SKG_SHARE;
    while (o.lv < cap && o.xp >= skgNeedXp(o.lv)) { o.xp -= skgNeedXp(o.lv); o.lv++; up.push(`${skgName(key)}升到 ${o.lv} 級`); }
    if (o.lv >= cap) o.xp = Math.min(o.xp, skgNeedXp(o.lv) - 1);
  }
  if (up.length) { B = worldStats(); if (typeof notice === "function") notice(`技能寶石：${up.join("、")}`, "#9fe8ff"); }
}
const _gainExpSkg = gainExp;
gainExp = function (n) { const r = _gainExpSkg.apply(this, arguments); if (!(typeof medGiving !== "undefined" && medGiving)) skgGain(n); return r; };
// 冷卻：每 5 級 −3%（B.skCd 已經在 skills.js 建好）
const _jobStatsSkg = jobStats;
jobStats = function (b) {
  b = _jobStatsSkg(b);
  if (save.w && b.skCd) for (const sl in SL_ID) { const m = skgCdMul(sl); if (m !== 1) b.skCd[SL_ID[sl]] = (b.skCd[SL_ID[sl]] || 1) * m; }
  return b;
};
// 技能卡上的等級條
function skgBar(key) {
  if (!skgHas(key)) return "";
  const o = skgStore()[key] || { lv: 1, xp: 0 }, cap = skgCap(), L = skgLv(key);
  const f = o.lv >= SKG_MAX ? 1 : o.lv >= cap ? 1 : Math.min(1, o.xp / skgNeedXp(o.lv)), pct = Math.floor(f * 100);
  const tail = o.lv >= SKG_MAX ? "滿級" : o.lv >= cap ? `到上限（Lv.${Math.min(100, (cap - 3) * 5)} 再升）` : pct + "%";
  const lowered = o.lv > L ? `（這個角色只能用到 ${L} 級）` : "";
  return `<span class="skgbar"><em>技能寶石 Lv.${o.lv}</em><i style="--f:${f}"></i><em>${tail}</em>${lowered ? `<em class="skglow">${lowered}</em>` : ""}</span>`;
}
// ───────── 技能商人（技能頁的一個分頁）─────────
let shopWt = null;
function renderSkShop(msg = "") {
  const wt = shopWt || curWeapon(), camp = typeof atCamp === "function" && atCamp(), lv = wLv();
  const tabs = Object.keys(WEAPONS).filter((k) => TRI[k]).map((k) => [k, WEAPONS[k].n]).concat([["r", "身法"]]);
  const head = `<div class="btabs sktabs">${tabs.map(([k, n]) => `<button class="btab${wt === k ? " on" : ""}" data-sw="${k}">${n}</button>`).join("")}</div>`;
  const rows = [];
  const line = (key, ic, n, d, need, price) => {
    const has = skgHas(key);
    const btn = has ? `<span class="skgown">已擁有</span>` : lv < need ? `<button disabled>Lv.${need} 才能買</button>` : !camp ? `<button disabled>回營地才能買</button>` : `<button data-buy="${key}" ${save.stone >= price ? "" : "disabled"}>買 ${price.toLocaleString()} 靈石</button>`;
    rows.push(`<div class="skgrow${has ? " own" : ""}"><div class="skgl">${ic}<div><b>${n}</b><small>${has ? "" : `Lv.${need}・`}${d}</small>${skgBar(key)}</div></div><div class="skgr">${btn}</div></div>`);
  };
  const L2 = { a: "普攻", q: "Q 招", e: "E 招" };
  if (wt === "r") {
    line("r:base", skIco("", "r", "", "tico"), "閃身", "原本的閃身（免費）", 1, 0);
    TRI.r.map((o, i) => [o, TRI_LV.r[i]]).sort((a, b) => a[1] - b[1]).forEach(([o, need]) => line("r:" + o.k, skIco("", "r", o.k, "tico"), o.n, o.d, need, need * SKG_PRICE));
  } else {
    const ws = WSKILLS[wt];
    for (const l of ["a", "q", "e"]) {
      rows.push(`<div class="trihead"><b>${L2[l]}</b></div>`);
      line(skgKey(wt, l, "base"), skIco(wt, l, "", "tico"), l === "a" ? ws.attack[0] : l === "q" ? ws.spin[0] : ws.ult[0], `原本的${L2[l]}（免費）`, l === "e" ? E_LV : 1, 0);
      (triList(wt, l) || []).map((o, i) => [o, TRI_LV[l][i]]).sort((a, b) => a[1] - b[1]).forEach(([o, need]) => line(skgKey(wt, l, o.k), skIco(wt, l, o.k, "tico"), o.n, o.d, need, need * SKG_PRICE));
    }
  }
  const tip = `<p class="sub">技能商人：等級到了就能用靈石買那顆<b>技能寶石</b>（需要等級 ×${SKG_PRICE} 靈石），買過永久擁有、三個角色共用。技能寶石放在技能鏈上，打怪會分到經驗、最高 20 級：每級傷害 +${Math.round(SKG_DMG * 100)}%，每 5 級冷卻 −${Math.round(SKG_CD * 100)}%；等級上限＝角色等級÷5＋4。${camp ? "" : `<b style="color:#ff9a7a">要回到安全營地才能買。</b>`}　靈石 ${Math.floor(save.stone).toLocaleString()}</p>`;
  return `${msg ? `<div class="emsg">${msg}</div>` : ""}${tip}${head}<div class="skglist">${rows.join("")}</div>`;
}
function bindSkShop() {
  ov.querySelectorAll("[data-sw]").forEach((b) => b.addEventListener("click", () => { sfx("click"); shopWt = b.dataset.sw; renderSkills(); }));
  ov.querySelectorAll("[data-buy]").forEach((b) => b.addEventListener("click", () => {
    const key = b.dataset.buy, p = key.split(":"), [wt, l, k] = p[0] === "r" ? ["", "r", p[1]] : p;
    if (skgHas(key)) return;
    if (!(typeof atCamp === "function" && atCamp())) { sfx("bad"); renderSkills("要回到安全營地才能買"); return; }
    const need = triNeed(wt || curWeapon(), l, k), price = need * SKG_PRICE;
    if (wLv() < need) { sfx("bad"); renderSkills(`要 Lv.${need}`); return; }
    if (save.stone < price) { sfx("bad"); renderSkills(`要 ${price.toLocaleString()} 靈石`); return; }
    save.stone -= price; skgStore()[key] = { lv: 1, xp: 0 }; writeSave(); sfx("arrive");
    renderSkills(`買到技能寶石「${skgName(key)}」！到技能鏈換上就能用`);
  }));
}
