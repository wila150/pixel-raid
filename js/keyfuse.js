// 萬劍仙途 — 企劃 56 鑰匙合成（總表第 44 項）：營地裡 3 把同層 → 1 把高一層
// 結果靈品；3 把裡有玄品 30% 變玄品。費用 100×層數（用掉的那層）靈石。不能超過 riftCap()；渡劫（cor）、天劫（tj）、鎖定（lock）的不能合
"use strict";
const KF_COST = 100, KF_XUAN = 0.3;
const kfOk = (k) => !k.lock && !k.cor && !k.tj;
const kfCost = (tier) => KF_COST * tier;
// 這層拿哪 3 把：先用品質低、詞綴少的；first＝一定要用這把（選中的那把）
function kfPick(tier, first, pool) {
  const L = (pool || save.keys).filter((k) => k.tier === tier && kfOk(k) && k !== first).sort((a, b) => a.q - b.q || keyModN(a) - keyModN(b));
  const out = first ? [first].concat(L.slice(0, 2)) : L.slice(0, 3);
  return out.length === 3 ? out : null;
}
function kfWhy(tier, first) {
  if (!atCamp()) return "回營地才能合成";
  if (first && !kfOk(first)) return first.lock ? "鎖定的鑰匙不能合成" : first.tj ? "天劫秘境的鑰匙不能合成" : "渡劫過的鑰匙不能合成";
  if (tier + 1 > riftCap()) return `打倒無相劍尊後才能合成到第 ${tier + 1} 層`;
  if (!kfPick(tier, first)) return `第 ${tier} 層能合的鑰匙不到 3 把`;
  if (save.stone < kfCost(tier)) return `靈石不夠（要 ${kfCost(tier).toLocaleString()}）`;
  return null;
}
function kfDo(use) {
  const tier = use[0].tier, xuan = use.some((k) => k.q === 2);
  save.stone -= kfCost(tier);
  save.keys = save.keys.filter((k) => !use.includes(k));
  const nk = makeKey(tier + 1, xuan && Math.random() < KF_XUAN ? 2 : 1);
  save.keys.push(nk); return nk;
}
// 一鍵：從低層往上，能合就合（合出來的也算），錢不夠或碰到上限就停
function kfPlan() {
  const pool = save.keys.slice(), steps = []; let stone = save.stone;
  for (let guard = 0; guard < 60; guard++) {
    const tiers = [...new Set(pool.filter(kfOk).map((k) => k.tier))].sort((a, b) => a - b);
    let did = false;
    for (const t of tiers) {
      if (t + 1 > riftCap() || stone < kfCost(t)) continue;
      const use = kfPick(t, null, pool); if (!use) continue;
      stone -= kfCost(t); use.forEach((k) => pool.splice(pool.indexOf(k), 1));
      const fake = { id: "plan" + guard, tier: t + 1, q: 1, mods: [], plan: 1 }; pool.push(fake);
      steps.push({ tier: t, use }); did = true; break;
    }
    if (!did) break;
  }
  return steps;
}
const kfKeyTxt = (k) => k.plan ? `<span style="color:#cfc4dc">合成出來的第 ${k.tier} 層</span>` : `<span style="color:${KEY_RARITY[k.q].c}">${KEY_RARITY[k.q].n}・${keyModN(k)} 詞綴</span>`;
function kfConfirm(title, steps, onYes) {
  const cost = steps.reduce((s, x) => s + kfCost(x.tier), 0);
  const box = document.createElement("div"); box.className = "kfbox";
  box.innerHTML = `<div class="kfin"><h3>${title}</h3><div class="kfsteps">${steps.map((s) => `<div class="kfstep"><b>第 ${s.tier} 層 ×3 → 第 ${s.tier + 1} 層</b><small>${s.use.map(kfKeyTxt).join("、")}</small></div>`).join("")}</div>
    <p class="dim">共 ${steps.length} 次・${cost.toLocaleString()} 靈石（你有 ${save.stone.toLocaleString()}）。結果是靈品；用掉的有玄品就 30% 變玄品。鎖定、渡劫、天劫的鑰匙不會用到。</p>
    <div class="acts"><button class="gold" data-kf="yes">確定合成</button><button data-kf="no">取消</button></div></div>`;
  ov.appendChild(box);
  box.querySelector('[data-kf="no"]').onclick = () => { sfx("click"); box.remove(); };
  box.querySelector('[data-kf="yes"]').onclick = () => { box.remove(); onYes(); };
}
// 鑰匙太多自動丟最低層時，不丟鎖定的
const _addKeyKf = addKey;
addKey = function (k) { // eslint-disable-line no-func-assign
  if (save.keys.length >= KEY_MAX) {
    const free = save.keys.filter((x) => !x.lock).sort((a, b) => a.tier - b.tier);
    if (free.length) { save.keys = save.keys.filter((x) => x !== free[0]); save.keys.push(k); writeSave(); return; }
  }
  return _addKeyKf.apply(this, arguments);
};
const _renderRiftKf = renderRift;
renderRift = function () { // eslint-disable-line no-func-assign
  _renderRiftKf.apply(this, arguments);
  if (ovKind !== "rift" || RIFT || !riftUnlocked() || !ov.querySelector(".col.l.rift")) return;
  const again = (m) => renderRift(m), camp = atCamp();
  // 列表：鎖頭
  ov.querySelectorAll("[data-rk]").forEach((b) => { const k = save.keys.find((x) => x.id === b.dataset.rk); if (k && k.lock) b.querySelector("b").insertAdjacentHTML("beforeend", ` <i class="kflk">${typeof LOCK_SVG !== "undefined" ? LOCK_SVG : "🔒"}</i>`); });
  // 左欄：一鍵合成
  const plan = kfPlan(), L = ov.querySelector(".col.l.rift");
  L.insertAdjacentHTML("beforeend", `<div class="kfall"><button id="kfAll" ${camp && plan.length ? "" : "disabled"}>一鍵合成<small>${!camp ? "回營地才能合成" : plan.length ? `可以合 ${plan.length} 次` : "沒有 3 把同層可以合的"}</small></button></div>`);
  const ea = document.getElementById("kfAll");
  if (ea) ea.onclick = () => {
    const P = kfPlan(); if (!P.length || !atCamp()) return; sfx("click");
    kfConfirm("一鍵合成", P, () => {
      let n = 0, xn = 0, top = 0;
      for (let i = 0; i < 60; i++) { const S = kfPlan()[0]; if (!S) break; const nk = kfDo(S.use); n++; if (nk.q === 2) xn++; top = Math.max(top, nk.tier); }
      writeSave(); sfx("good"); again(`合成 ${n} 次，最高到第 ${top} 層${xn ? `（${xn} 把玄品）` : ""}`);
    });
  };
  // 中間：選中的鑰匙 合成／鎖定
  const sel = save.keys.find((k) => k.id === riftSel); if (!sel) return;
  const acts = ov.querySelector(".col.c.rift .acts"); if (!acts) return;
  const why = kfWhy(sel.tier, sel);
  acts.insertAdjacentHTML("beforeend", `<button id="kfOne" ${why ? "disabled" : ""}>合成<small>${why || `3 把第 ${sel.tier} 層 → 第 ${sel.tier + 1} 層・${kfCost(sel.tier).toLocaleString()} 靈石`}</small></button><button id="kfLock">${typeof LOCK_SVG !== "undefined" ? LOCK_SVG : ""}${sel.lock ? "解鎖" : "鎖定"}<small>${sel.lock ? "可以合成、丟掉" : "不會被合成、丟掉"}</small></button>`);
  const del = document.getElementById("rdel"); if (del && sel.lock) { del.disabled = true; del.textContent = "已鎖定"; }
  document.getElementById("kfLock").onclick = () => { if (sel.lock) delete sel.lock; else sel.lock = 1; writeSave(); sfx("click"); again(sel.lock ? "鑰匙鎖定了（不會被合成、丟掉）" : "鑰匙解鎖了"); };
  const e1 = document.getElementById("kfOne");
  if (e1) e1.onclick = () => {
    if (kfWhy(sel.tier, sel)) return; sfx("click");
    const use = kfPick(sel.tier, sel);
    kfConfirm("合成鑰匙", [{ tier: sel.tier, use }], () => {
      if (kfWhy(sel.tier, sel)) { again(kfWhy(sel.tier, sel)); return; }
      const nk = kfDo(use); riftSel = nk.id; writeSave(); sfx("good"); again(`合成出【${KEY_RARITY[nk.q].n}】第 ${nk.tier} 層秘境鑰`);
    });
  };
};
