// 御劍渡劫（pixel-raid）— 機緣功法：跑酷途中三選一（只在這一場有效），湊齊兩種會出現「進化」
"use strict";

const PERKS = {
  split: { n: "劍氣分化", tag: "跑酷", d: "每穿過一道加號門，額外 +5 飛劍", max: 3 },
  mult: { n: "倍化神通", tag: "跑酷", d: "乘號門再多乘 0.5 倍", max: 3 },
  pierce: { n: "破陣劍意", tag: "跑酷", d: "飛劍打封印石、妖群快 50%", max: 3 },
  gold: { n: "金鐘罩", tag: "跑酷", d: "擋下一次妖群或封印石造成的損失", max: 3 },
  devour: { n: "吞妖訣", tag: "跑酷", d: "撞上妖群只損失一半飛劍", max: 1 },
  wind: { n: "御風訣", tag: "跑酷", d: "左右移動快 30%", max: 2 },
  rain: { n: "劍雨", tag: "打王", d: "渡劫時飛劍齊射快 20%", max: 3 },
  edge: { n: "劍道精進", tag: "打王", d: "渡劫時所有傷害 +20%", max: 3 },
  body: { n: "護體靈光", tag: "打王", d: "渡劫時生命 +30", max: 3 },
  focus: { n: "丹田充盈", tag: "打王", d: "天罰能量累積快 30%", max: 2 },
  pill: { n: "靈丹", tag: "打王", d: "丹藥 +1", max: 2 },
  bounty: { n: "斬妖得寶", tag: "跑酷", d: "打碎封印、全滅妖群、斬殺妖將的獎勵 +50%", max: 2 },
  thunder: { n: "引雷訣", tag: "打王", d: "普攻有 25% 機率引下天雷（+35 傷害）", max: 3 },
  vamp: { n: "吸星大法", tag: "打王", d: "普攻命中回 2 點生命", max: 2 },
  // 進化：同時擁有 need 裡的功法才會出現，一出現必定在三張之中
  river: { n: "天河劍陣", tag: "進化", d: "劍雨＋劍氣分化融合：飛劍齊射傷害 ×1.8", max: 1, need: ["rain", "split"] },
  aegis: { n: "不滅金身", tag: "進化", d: "金鐘罩＋護體靈光融合：再擋 2 次、生命 +60", max: 1, need: ["gold", "body"] },
  storm: { n: "九霄雷域", tag: "進化", d: "引雷訣＋劍道精進融合：每輪飛劍齊射都落下天雷", max: 1, need: ["thunder", "edge"] },
  myriad: { n: "萬劍歸宗", tag: "進化", d: "倍化神通＋破陣劍意融合：渡劫時飛劍數量 ×1.5", max: 1, need: ["mult", "pierce"] },
};
const P = (k) => (run && run.perks[k]) || 0;

function applyPerk(k) {
  run.perks[k] = P(k) + 1;
  if (k === "gold") run.shield++;
  else if (k === "rain") B.vol *= 0.8;
  else if (k === "edge") B.atk *= 1.2;
  else if (k === "body") B.maxHp += 30;
  else if (k === "focus") B.ult *= 1.3;
  else if (k === "pill") B.potions += 1;
  else if (k === "river") B.volMul = (B.volMul || 1) * 1.8;
  else if (k === "aegis") { run.shield += 2; B.maxHp += 60; }
}
function rollPerks() {
  const evo = Object.keys(PERKS).filter((k) => PERKS[k].need && !P(k) && PERKS[k].need.every((n) => P(n)));
  const pool = Object.keys(PERKS).filter((k) => !PERKS[k].need && P(k) < PERKS[k].max && !(run.fromHunt && PERKS[k].tag === "跑酷"));
  const out = evo.slice(0, 1);
  while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}
// 打開三選一；選完執行 then
function openPick(title, then) {
  const opts = rollPerks();
  if (!opts.length) { then(); return; }
  pausedFrom = state;
  state = "pick";
  keys.clear(); runDrag.id = null;
  sfx("arrive");
  const owned = Object.keys(run.perks).map((k) => `${PERKS[k].n}${PERKS[k].max > 1 ? ` Lv.${run.perks[k]}` : ""}`);
  screenEl.innerHTML = `<div class="panel wide">
    <h1 class="pick-title">${title}</h1>
    <p class="sub">選一門功法（只在這一場有效）</p>
    <div class="cards">${opts.map((k) => {
      const p = PERKS[k], lv = P(k);
      return `<button class="card tag-${p.tag}" data-k="${k}"><span class="tag">${p.tag}</span><b>${p.n}</b>${p.max > 1 ? `<i>Lv.${lv} → ${lv + 1}</i>` : ""}<span class="desc">${p.d}</span></button>`;
    }).join("")}</div>
    ${owned.length ? `<p class="owned">已學：${owned.join("、")}</p>` : ""}
  </div>`;
  screenEl.classList.remove("hidden");
  screenEl.querySelectorAll(".card").forEach((b) => b.addEventListener("click", () => {
    applyPerk(b.dataset.k);
    screenEl.classList.add("hidden");
    state = pausedFrom;
    last = performance.now();
    floatText(run.x, run.y - 30, `習得 ${PERKS[b.dataset.k].n}`, "#ffe066", true);
    then();
  }));
}
