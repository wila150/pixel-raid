// 萬劍仙途 — 天賦樹第一版（總表第 17 項，企劃 25）
// 取代：手動配點（STR／AGI／INT／VIT）、大節點（mind.js 的 KEYSTONE 搬到最外圈）、巔峰點（atlas.js）。
// 樹：中間樞紐＋一圈 6 個起點（紅、紅綠、綠、綠藍、藍、藍紅），每區兩條分支、每條兩個天賦群（4 小格圍一圈＋中間重要天賦），最外圈核心天賦。
// 點數：每升 1 級 1 點、每次轉職 +2；只能點跟已點格子相連的格子；點遠的格子自動找最短路。
// 存檔：save.w.tree = { s: 起點 id, n: [已點的 id], fr: 1＝還有一次免費全部重置 }、save.w.treeV。
// gather.js 後、cap.js 前載入（cap.js 要在所有 worldStats 包裝最後）。
"use strict";

// ───────── 1. 資料 ─────────
const TR_ATTR = { str: { n: "力量", c: "#ff6a5a" }, agi: { n: "敏捷", c: "#6adf7a" }, wis: { n: "智力", c: "#6aa8ff" }, vit: { n: "體魄", c: "#e8c87a" } };
const TR_WMAIN = { blade: "str", fist: "str", sword: "agi", bow: "agi", staff: "wis", fan: "wis" }; // 企劃 25 §13：武器看顏色吃主屬性
const TR_EFF = { // 效果顯示文字（數字是 %，力量那四個是點數）
  str: "力量 +", agi: "敏捷 +", wis: "智力 +", vit: "體魄 +", atk: "攻擊 +%", crit: "爆擊率 +%", cdmg: "爆擊傷害 +%", aspd: "攻擊速度 +%", spd: "移動速度 +%",
  hp: "生命 +%", armor: "護甲 +%", dodge: "閃避 +%", supp: "法術壓制 +%", es: "能量護盾 +%", mp: "真氣上限 +", mpr: "真氣回復 +%", leech: "吸血 +%", res: "火、冰、雷抗性 +%", loot: "秘境物品數量 +%",
  kcr: "每 5 連斬傷害 +%", kc: "連斬增傷上限 +%", tp: "投射招傷害 +%", tm: "近戰招傷害 +%", ta: "範圍招傷害 +%", td: "持續招傷害 +%", tv: "位移招傷害 +%",
  fire: "火焰傷害 +%", ice: "冰冷傷害 +%", thun: "閃電傷害 +%", chaos: "混沌（毒）傷害 +%", // 企劃 42：元素（看這一招的元素）
};
const trEffTxt = (e) => Object.keys(e).map((k) => { const t = TR_EFF[k]; return t.endsWith("%") ? t.slice(0, -1) + e[k] + "%" : t + e[k]; });
// 天賦群主題：4 小格＋1 重要天賦
const TR_TH = {
  atk: { s: { atk: 3 }, n: "破軍", e: { atk: 8 } },
  crit: { s: { crit: 1 }, n: "靈犀", e: { crit: 2, cdmg: 12 } },
  cdmg: { s: { cdmg: 6 }, n: "斬首", e: { cdmg: 20 } },
  aspd: { s: { aspd: 3 }, n: "疾風", e: { aspd: 8, spd: 3 } },
  life: { s: { hp: 3 }, n: "金剛", e: { hp: 5, armor: 15 } },
  armor: { s: { armor: 10 }, n: "鐵壁", e: { armor: 25, hp: 2 } },
  dodge: { s: { dodge: 2 }, n: "凌波", e: { dodge: 4, spd: 5 } },
  es: { s: { es: 8 }, n: "玄光", e: { es: 20, mp: 20 } },
  mp: { s: { mpr: 10 }, n: "吐納", e: { mpr: 25, mp: 30 } },
  kc: { s: { kcr: 0.5, kc: 3 }, n: "連斬", e: { kc: 6 } }, // 企劃 64：點滿每 5 連斬 +2%、最多 +18%（增加）
  leech: { s: { leech: 0.3 }, n: "嗜血", e: { leech: 1 } },
  res: { s: { res: 4 }, n: "避劫", e: { res: 10 } },
  loot: { s: { loot: 4 }, n: "聚寶", e: { loot: 12 } },
  supp: { s: { supp: 3 }, n: "護體", e: { supp: 8 } },
  duomo: { s: { mpr: 10 }, n: "奪魔", e: { mpr: 15, mp: 20 } }, // 第二版：取代藍區一個吐納
  // 企劃 42 A：元素（各 2 群）
  fire: { s: { fire: 6 }, n: "烈焰", e: { fire: 15 } }, fire2: { s: { fire: 5 }, n: "燎原", e: { fire: 10, ta: 3 } },
  ice: { s: { ice: 5 }, n: "寒冰", e: { ice: 12 } }, ice2: { s: { ice: 4 }, n: "凍土", e: { ice: 8, armor: 10 } },
  thun: { s: { thun: 5 }, n: "奔雷", e: { thun: 12 } }, thun2: { s: { thun: 4 }, n: "雷殛", e: { thun: 8, crit: 1 } },
  psn: { s: { chaos: 5 }, n: "劇毒", e: { chaos: 12 } }, psn2: { s: { chaos: 4 }, n: "腐骨", e: { chaos: 8, td: 3 } },
  // 武器專精（放在對應起點旁）
  swd: { s: { atk: 3 }, n: "劍心", e: { atk: 6, crit: 1 } }, bow: { s: { tp: 2 }, n: "箭神", e: { tp: 3, aspd: 4 } },
  stf: { s: { atk: 3 }, n: "法源", e: { atk: 6, mp: 20 } }, bld: { s: { tm: 2 }, n: "刀魂", e: { tm: 3, armor: 15 } },
  fst: { s: { aspd: 3 }, n: "拳意", e: { aspd: 6, tm: 2 } }, fan: { s: { td: 2 }, n: "風骨", e: { td: 4, es: 10 } },
  // 招式類型
  t_a: { s: { ta: 2 }, n: "萬法", e: { ta: 3 } }, t_p: { s: { tp: 2 }, n: "千里", e: { tp: 3 } }, t_m: { s: { tm: 2 }, n: "近身", e: { tm: 3 } },
  t_d: { s: { td: 2 }, n: "綿延", e: { td: 3 } }, t_v: { s: { tv: 2 }, n: "身法", e: { tv: 3, spd: 3 } }, t_s: { s: { atk: 3 }, n: "法壇", e: { atk: 5 } },
  // 防禦／續航
  still: { s: { armor: 8 }, n: "不動", e: { armor: 20, hp: 3 } }, regen: { s: { hp: 2 }, n: "回春", e: { hp: 4 } }, qi: { s: { mp: 8 }, n: "聚氣", e: { mp: 30, mpr: 10 } },
};
// 第二版：重要天賦的特殊效果（效果在 tree2.js）
const TR_SP = {
  kc: "連斬時間 4 → 5 秒（5 秒內殺下一隻才接得上）",
  atk: "對精英、王傷害再 +10%", crit: "爆擊後 2 秒內爆擊率 +15%", cdmg: "對 30% 血以下的敵人爆擊傷害再 +30%", aspd: "閃身後 2 秒攻速 +20%（受攻速上限）",
  life: "生命低於 35% 時受到的傷害 −15%", armor: "站著不動 1 秒後，物理傷害 −8%", dodge: "閃避成功後 1 秒移速 +30%", es: "能量護盾被打破時 1 秒無敵（冷卻 20 秒）",
  mp: "真氣低於 20% 時，回復速度 ×2", leech: "吸血可以超過生命上限，最多 10% 變成血盾（3 秒沒補就消失）", res: "被元素打到後 3 秒，那個元素抗性 +15%（上限可到 80%）",
  loot: "精英有 10% 多掉 1 件裝備", supp: "法術壓制成功時回 2% 生命", duomo: "打中時回造成傷害 1% 的真氣（每秒最多真氣上限 10%）",
  // 企劃 42（效果在 tree3.js）
  fire: "燃燒時間 +30%", fire2: "燃燒中的敵人死掉時，火會燒到旁邊 2 隻", ice: "冰凍時間 +40%", ice2: "打冰凍、變慢的敵人傷害 +10%",
  thun: "感電機率 +15%", thun2: "感電的敵人受到你的傷害再 +10%", psn: "毒最多疊到 8 層（原本 5 層）", psn2: "打中毒的敵人傷害 +12%",
  swd: "拿劍時：打中有 15% 再砍一下（60% 傷害）", bow: "拿弓時：每次射擊多 1 道箭（70% 傷害）", stf: "拿法杖時：傷害更多 10%",
  bld: "拿大刀時：範圍 +20%", fst: "拿拳套時：攻速 +10%；連續打同一隻每下 +1%（最多 +10%，換目標歸零）", fan: "拿扇時：旋風、火牆這類持續招存在時間 +30%",
  t_a: "範圍招傷害更多 5%；範圍 +10%", t_p: "投射招傷害更多 5%；投射物飛得遠 20%", t_m: "近戰招傷害更多 5%；近戰招打中後 2 秒受傷 −5%",
  t_d: "持續招傷害更多 5%；燃燒、中毒多 1 秒", t_v: "位移招傷害更多 5%；閃身冷卻 −10%", t_s: "法壇可以同時放 2 座（普攻、Q 各自算）；法壇傷害更多 8%",
  still: "站著不動 0.5 秒後，受到的所有傷害 −8%", regen: "4 秒沒受傷，每秒回 2% 生命", qi: "真氣高於 80% 時傷害 +8%",
};
const TR_TAGN = { tp: "投射", tm: "近戰", ta: "範圍", td: "持續", tv: "位移" };
// 6 區：角度、顏色、屬性、4 個天賦群（−分支 A、B，＋分支 A、B）、外圈核心（−、＋）
const TR_SEC = [
  { k: "b", n: "藍", a: -90, at: ["wis"], c: "#6aa8ff", th: ["fan", "es", "duomo", "t_a"], ks: ["tiandao", "tianren"], tg: [["ta", "td"], ["ta", "td"]], fit: "法杖、扇" },
  { k: "gb", n: "綠藍", a: -30, at: ["agi", "wis"], c: "#6ad8c8", th: ["bow", "t_d", "supp", "t_p"], ks: ["jianxin", "jianyi"], tg: [["tp", "td"], ["tp", "ta"]], fit: "弓、扇" },
  { k: "g", n: "綠", a: 30, at: ["agi"], c: "#6adf7a", th: ["swd", "dodge", "aspd", "crit"], ks: ["xueji", "huixin"], tg: [["tp", "tv"], ["ta", "tp"]], fit: "弓、劍" },
  { k: "rg", n: "紅綠", a: 90, at: ["str", "agi"], c: "#d8c85a", th: ["fst", "leech", "cdmg", "t_v"], ks: ["wuxin", "shayi"], tg: [["tm", "tv"], ["tp", "tm"]], fit: "劍、拳" },
  { k: "r", n: "紅", a: 150, at: ["str"], c: "#ff6a5a", th: ["bld", "armor", "life", "t_m"], ks: ["kuang", "panshi"], tg: [["tm", "tm"], ["tm", "tv"]], fit: "大刀、拳" },
  { k: "br", n: "藍紅", a: 210, at: ["wis", "str"], c: "#c87aff", th: ["stf", "res", "atk", "t_s"], ks: ["guzhu", "xuemo"], tg: [["ta", "tm"], ["td", "tm"]], fit: "法杖、大刀" },
];
const TR_KS_LV = 40; // 核心天賦 Lv.40 才能點
const TREE = {};
(function buildTree() {
  const P = (r, deg) => [Math.cos(deg * Math.PI / 180) * r, Math.sin(deg * Math.PI / 180) * r];
  const add = (id, x, y, t, o) => { TREE[id] = Object.assign({ id, x: Math.round(x), y: Math.round(y), t, e: {}, adj: [] }, o); return TREE[id]; };
  const link = (a, b) => { if (!TREE[a].adj.includes(b)) TREE[a].adj.push(b); if (!TREE[b].adj.includes(a)) TREE[b].adj.push(a); };
  const attrNode = (id, r, deg, at, sec, v = 10) => add(id, ...P(r, deg), "attr", { e: { [at]: v }, n: `${TR_ATTR[at].n} +${v}`, at, sec }); // 越外面越多：起點附近 +5、中段 +10、外圈 +14
  add("h", 0, 0, "hub", { e: { str: 5, agi: 5, wis: 5 }, n: "萬劍樞紐" });
  TR_SEC.forEach((S, i) => {
    const sid = "s" + i, se = {}; for (const a of S.at) se[a] = S.at.length > 1 ? 3 : 6;
    attrNode("c" + i, 90, S.a, "vit", i, 5); link("h", "c" + i);
    add(sid, ...P(175, S.a), "start", { e: se, n: `${S.n}・起點`, sec: i }); link("c" + i, sid);
    let prev = sid, ai = 0; const nextAt = () => S.at[ai++ % S.at.length];
    [245, 315, 385, 455].forEach((r, j) => { const id = `${i}p${j}`; attrNode(id, r, S.a, nextAt(), i, 5); link(prev, id); prev = id; });
    const j1 = prev;
    [-1, 1].forEach((sg, b) => {
      const da = sg * 13, ang = S.a + da;
      let pv = j1;
      const chain = (r, nm, v) => { const id = `${i}b${b}${nm}`; attrNode(id, r, ang, nextAt(), i, v); link(pv, id); pv = id; };
      const cluster = (rc, nm, thk) => {
        const T = TR_TH[thk], [cx, cy] = P(rc, ang), base = `${i}b${b}${nm}`, ring = [];
        for (let q = 0; q < 4; q++) { // 0＝入口（靠中間）、2＝出口（靠外面）
          const d = (S.a + da) * Math.PI / 180 + Math.PI + q * Math.PI / 2, id = base + q;
          add(id, cx + Math.cos(d) * 40, cy + Math.sin(d) * 40, "small", { e: Object.assign({}, T.s), n: trEffTxt(T.s)[0], sec: i, th: thk, cl: base + "n" }); ring.push(id);
        }
        for (let q = 0; q < 4; q++) link(ring[q], ring[(q + 1) % 4]);
        add(base + "n", cx, cy, "note", { e: Object.assign({}, T.e), n: T.n, sec: i, th: thk }); link(ring[2], base + "n");
        link(pv, ring[0]); pv = ring[2];
      };
      chain(525, "a0");
      { // 第二版：技能標籤小分支（a0 往外側岔出去 2 格）
        let tp = pv; S.tg[b].forEach((tk, q) => { const id = `${i}b${b}t${q}`; add(id, ...P(548 + q * 46, S.a + sg * 24), "small", { e: { [tk]: 4 }, n: `${TR_TAGN[tk]}招傷害 +4%`, sec: i, tag: tk }); link(tp, id); tp = id; });
      }
      chain(595, "a1");
      cluster(700, "A", S.th[b * 2]);
      chain(805, "a2", 14);
      cluster(910, "B", S.th[b * 2 + 1]);
      const ks = S.ks[b];
      if (ks) { add("k_" + ks, ...P(1035, ang), "ks", { ks, sec: i }); link(pv, "k_" + ks); }
    });
  });
  // 區和區之間的走道（體魄）：i 區＋分支第二格 ↔ i+1 區−分支第二格
  TR_SEC.forEach((S, i) => {
    const j = (i + 1) % 6, id = "x" + i;
    attrNode(id, 610, S.a + 30, "vit", -1, 5); link(`${i}b1a1`, id); link(id, `${j}b0a1`);
  });
  // 企劃 42 A／B：區和區中間往外長一條（3 個天賦群＋玉槽，最外面核心），id g{i}…；另外 2 個內圈玉槽 j0、j1
  const GAP = [
    { th: ["thun", "thun2", "qi"], ks: "hundun" }, { th: ["psn", "psn2", "loot"] }, { th: ["leech", "regen", "crit"], ks: "xunlei" },
    { th: ["still", "armor", "cdmg"], ks: "budong" }, { th: ["fire", "fire2", "life"], ks: "tiegu" }, { th: ["ice", "ice2", "mp"], ks: "yuangui" },
  ];
  const clusterAt = (base, rc, ang, thk, from) => { // 4 小格一圈＋中間重要天賦；回傳出口
    const T = TR_TH[thk], [cx, cy] = P(rc, ang), ring = [];
    for (let q = 0; q < 4; q++) { const d = ang * Math.PI / 180 + Math.PI + q * Math.PI / 2, id = base + q; add(id, cx + Math.cos(d) * 40, cy + Math.sin(d) * 40, "small", { e: Object.assign({}, T.s), n: trEffTxt(T.s)[0], sec: -1, th: thk, cl: base + "n" }); ring.push(id); }
    for (let q = 0; q < 4; q++) link(ring[q], ring[(q + 1) % 4]);
    add(base + "n", cx, cy, "note", { e: Object.assign({}, T.e), n: T.n, sec: -1, th: thk }); link(ring[2], base + "n");
    link(from, ring[0]); return ring[2];
  };
  { const a3 = TR_SEC[3].a; clusterAt("kc", 640, a3, "kc", "3p3"); } // 企劃 64：紅綠區中線岔出「連斬」群（新 id kc0–kc3、kcn）
  GAP.forEach((G, i) => {
    const S = TR_SEC[i], S2 = TR_SEC[(i + 1) % 6], ang = S.a + 30, g = "g" + i;
    let pv = clusterAt(g + "C", 730, ang, G.th[0], "x" + i);
    add(g + "j", ...P(850, ang), "jw", { n: "天賦玉槽", sec: -1 }); link(pv, g + "j");
    pv = clusterAt(g + "D", 965, ang, G.th[1], g + "j");
    attrNode(g + "a", 1085, ang, S2.at[0], -1, 14); link(pv, g + "a");
    pv = clusterAt(g + "E", 1195, ang, G.th[2], g + "a");
    if (G.ks) { add("k_" + G.ks, ...P(1325, ang), "ks", { ks: G.ks, sec: -1 }); link(pv, "k_" + G.ks); }
  });
  [[0, 1, 2], [180, 4, 5]].forEach(([deg, a, b], q) => { add("j" + q, ...P(300, deg), "jw", { n: "天賦玉槽", sec: -1 }); link("j" + q, `${a}p1`); link("j" + q, `${b}p1`); });
})();
const TR_IDS = Object.keys(TREE);
const trKsDef = (k) => (typeof ksDef === "function" ? ksDef(k) : null);
function trNodeName(N) { if (N.t === "ks") { const d = trKsDef(N.ks); return d ? d.n : N.ks; } return N.n; }
function trNodeLines(N) {
  if (N.t === "ks") { const d = trKsDef(N.ks); return d ? [d.d] : []; }
  if (N.t === "jw") return typeof trJwLines === "function" ? trJwLines(N.id) : [];
  const L = trEffTxt(N.e);
  if (N.t === "note" && TR_SP[N.th]) L.push(`<b class="trsp">★ ${TR_SP[N.th]}</b>`);
  if (N.tag === "tv") L.push("閃身冷卻 −3%");
  if (N.tag) L.push(`<small class="dim">${TR_TAGN[N.tag]}招＝技能頁標籤有「${TR_TAGN[N.tag]}」的招式</small>`);
  return L;
}

// ───────── 2. 存檔、點數、舊存檔搬家 ─────────
const trJob = () => (typeof jobLv === "function" ? jobLv() : 0);
function treeSt() {
  const w = save.w; if (!w) return null;
  if (!w.treeV) treeMig(w);
  if (!w.tree) w.tree = { s: null, n: [], fr: 1 };
  if (w.treeV === 1) { // 企劃 42：格子主題重排、多了 100 多格 → 全部退點（起點保留）＋送一次免費重置
    const T = w.tree, had = T.n.length > 1; T.n = T.s ? [T.s] : []; T.fr = 1; w.treeV = 2;
    if (had && typeof notice === "function") notice("天賦樹變大了：多了元素、武器專精、招式類型、防禦的天賦群、5 個核心和 8 個天賦玉槽。點數全部退回，打開天賦樹（P）重新點，或按「推薦路線」", "#ffe066");
  }
  return w.tree;
}
function treeMig(w) {
  const a = w.ap || {}, had = (a.str || 0) + (a.agi || 0) + (a.wis || 0) + (a.vit || 0) > 0 || (w.ks && Object.keys(w.ks).length) || (w.para && Object.keys(w.para).length);
  let s = null;
  if (had) { const best = ["str", "agi", "wis"].sort((x, y) => (a[y] || 0) - (a[x] || 0))[0]; s = (a[best] || 0) > 0 ? { str: "s4", agi: "s2", wis: "s0" }[best] : null; }
  if (!s && w.created) s = trWStart();
  w.tree = { s, n: s ? [s] : [], fr: 1 };
  w.ap = { str: 0, vit: 0, agi: 0, wis: 0 }; w.free = 0; delete w.ks; w.para = {};
  w.treeV = 2;
  if (had) { w.treeHint = 1; if (typeof notice === "function") notice("配點、大節點、巔峰點合成「天賦樹」了（右上「天」／P 鍵），點數全部退回。打開後按「推薦路線」可以一鍵點好", "#ffe066"); }
}
function trWStart() { const wt = typeof curWeapon === "function" ? curWeapon() : "sword"; return { str: "s4", agi: "s2", wis: "s0" }[TR_WMAIN[wt] || "agi"]; }
// ── 武器組專屬點（總表第 35 項，企劃 46）：每 TRWS_EVERY 級 1 點，三組各一份，只在拿那一組時生效 ──
const WS_SHORT = { sword: "劍", staff: "法杖", bow: "弓", blade: "大刀", fist: "拳套", fan: "扇" };
const TRWS_EVERY = 8, TRWS_C = ["#5ab4ff", "#6ae08a", "#ffa64a"];
let TRM = 0; // 天賦樹畫面：0＝主樹、1–3＝武器組
const wsCur = () => (save.w && save.w.wi) || 0;
function wsTree(i) {
  const w = save.w; if (!w) return { n: [] };
  if (!Array.isArray(w.treeWs)) {
    w.treeWs = [{ n: [] }, { n: [] }, { n: [] }];
    if (w.created && w.lv >= TRWS_EVERY && w.tree && w.tree.s && typeof notice === "function") notice(`每個武器組多了「專屬天賦點」（每 ${TRWS_EVERY} 級 1 點，組 1／2／3 各一份）：打開天賦樹（P）上面切到「武器組」分頁點，只在拿那一組武器時生效`, "#ffe066");
  }
  return w.treeWs[i] || (w.treeWs[i] = { n: [] });
}
const wsTotal = () => (save.w ? Math.floor(save.w.lv / TRWS_EVERY) : 0);
const wsFree = (i) => wsTotal() - wsTree(i).n.length;
const wsWt = (i) => { const w = save.w; if (!w) return null; const it = i === wsCur() ? save.eq.sword : (w.ws || [])[i]; return it ? wtOf(it) : null; };
const wsNoNode = (N) => N.t === "ks" || N.t === "jw" || N.t === "start"; // 核心、玉槽、起點只能用主樹點
let TRA = null, TRA_K = "";
function treeAll() { // 現在生效的格子＝主樹＋目前武器組
  const T = treeSt(); if (!T) return [];
  if ([0, 1, 2].some((i) => wsTree(i).n.length > wsTotal())) { wsPrune(); TR_SUM = null; }
  const S = wsTree(wsCur()), k = T.n.length + "/" + wsCur() + "/" + S.n.length;
  if (TRA && TRA_K === k && TRA.m === T.n && TRA.w === S.n) return TRA;
  TRA = T.n.concat(S.n); TRA.m = T.n; TRA.w = S.n; TRA_K = k; return TRA;
}
function wsPrune() { // 主樹變了：跟主樹重複的拿掉、接不到主樹的退回
  const T = treeSt(); if (!T) return;
  const main = new Set(T.n);
  for (let i = 0; i < 3; i++) {
    const S = wsTree(i); let L = S.n.filter((id) => TREE[id] && !main.has(id) && !wsNoNode(TREE[id]));
    if (!T.s) L = [];
    while (L.length > wsTotal()) L.pop(); // 點數變少（v9.1.2 改每 8 級）：從最後點的退
    const left = new Set(L), seen = new Set(), q = [...main];
    while (q.length) { const u = q.shift(); for (const v of TREE[u].adj) if (left.has(v) && !seen.has(v)) { seen.add(v); q.push(v); } }
    L = L.filter((id) => seen.has(id));
    if (L.length !== S.n.length) S.n = L;
  }
}
const trHave = () => { const T = treeSt(); return TRM ? T.n.concat(wsTree(TRM - 1).n) : T.n; };
const treeHas = (id) => !!save.w && treeAll().includes(id);
const treeTotal = () => (save.w ? Math.max(0, save.w.lv - 1) + 2 * trJob() : 0);
const treeUsed = () => { const T = treeSt(); return T ? T.n.filter((id) => id !== T.s).length : 0; };
const treeFree = () => treeTotal() - treeUsed();
let TR_SUM = null, TR_SUMA = null, TR_SUML = -1;
function treeSum() { // 快取：同一個陣列、同樣長度就不重算（寶石門檻每一下都會問）
  const T = treeSt(), arr = T ? treeAll() : null, len = arr ? arr.length : 0;
  if (TR_SUM && arr === TR_SUMA && len === TR_SUML) return TR_SUM;
  const s = {}; if (T) for (const id of arr) { const N = TREE[id]; if (N) for (const k in N.e) s[k] = (s[k] || 0) + N.e[k]; }
  if (T && typeof trJwSum === "function") trJwSum(T, s); // 企劃 42 B：鑲在已點玉槽上的天賦玉
  TR_SUM = s; TR_SUMA = arr; TR_SUML = len; return s;
}
function treeAttr() { const s = treeSum(); return { str: s.str || 0, agi: s.agi || 0, wis: s.wis || 0, vit: s.vit || 0 }; }
const treeLoot = () => treeSum().loot || 0;
function treeHasKs(k) { const T = treeSt(); return !!T && T.n.includes("k_" + k); }
// 百分比類的效果：接在 jobStats 後面
const _jobStatsT = jobStats;
jobStats = function (b) {
  b = _jobStatsT(b);
  if (!save.w) return b;
  const s = treeSum(), p = (k) => (s[k] || 0) / 100;
  if (s.atk) b.inc += p("atk"); // 企劃 41：增加
  if (s.crit) b.crit = (b.crit || 0) + p("crit");
  if (s.cdmg) b.critDmg = (b.critDmg || 2) + p("cdmg");
  if (s.aspd) b.aspd = (b.aspd || 1) * (1 + p("aspd"));
  if (s.spd) b.spdMul *= 1 + p("spd");
  if (s.hp) b.maxHp = Math.round(b.maxHp * (1 + p("hp")));
  if (s.armor) b.armor = (b.armor || 0) * (1 + p("armor"));
  if (s.dodge) b.dodge = Math.min(0.5, (b.dodge || 0) + p("dodge"));
  if (s.supp) b.supp = Math.min(0.6, (b.supp || 0) + p("supp"));
  if (s.es) b.maxEs = Math.round((b.maxEs || 0) * (1 + p("es")));
  if (s.mp) b.maxMp += s.mp;
  if (s.mpr) b.mpRegen *= 1 + p("mpr");
  if (s.leech) b.leech = (b.leech || 0) + p("leech");
  if (s.res) for (const e of ["F", "W", "T"]) b["res" + e] = (b["res" + e] || 0) + p("res");
  return b;
};

// ───────── 3. 找路、點亮、退點 ─────────
const trCanPass = (id) => TREE[id].t !== "ks" && !(TRM && wsNoNode(TREE[id])); // 核心天賦在最外面，只能當終點；專屬點不能經過玉槽
function trPath(to) { // 從已點的格子走到 to 的最短路（不含已點的），回傳 id 陣列；走不到 null
  const T = treeSt(), H = trHave(); if (!T || !T.s || H.includes(to)) return null;
  if (TRM && wsNoNode(TREE[to])) return null;
  const have = new Set(H), prev = {}, q = [];
  for (const id of H) { prev[id] = null; q.push(id); }
  while (q.length) {
    const u = q.shift();
    if (u === to) break;
    if (!have.has(u) && !trCanPass(u)) continue;
    for (const v of TREE[u].adj) if (!(v in prev)) { prev[v] = u; q.push(v); }
  }
  if (!(to in prev)) return null;
  const path = []; for (let u = to; u && !have.has(u); u = prev[u]) path.unshift(u);
  return path;
}
function trWhyNot(id, path) {
  const N = TREE[id], T = treeSt();
  if (!T.s) return N.t === "start" && !TRM ? "" : "先在主樹選一個起點";
  if (TRM && wsNoNode(N)) return N.t === "start" ? "起點只能在主樹選" : "核心天賦、天賦玉槽只能用主樹的點";
  if (!path) return TRM ? "走不到這裡（專屬點不能穿過玉槽）" : "走不到這裡";
  if (TRM) return path.length > wsFree(TRM - 1) ? `專屬點不夠（要 ${path.length}，剩 ${wsFree(TRM - 1)}）` : "";
  if (N.t === "ks" && save.w.lv < TR_KS_LV) return `核心天賦 Lv.${TR_KS_LV} 才能點`;
  if (path.length > treeFree()) return `點數不夠（要 ${path.length}，剩 ${treeFree()}）`;
  return "";
}
function trAfter() {
  wsPrune(); TR_SUM = null; writeSave();
  if (typeof W0 !== "undefined" && W0) { B = worldStats(); W0.maxHp = B.maxHp; W0.hp = Math.min(W0.hp, B.maxHp); if (typeof applyWeapon === "function") applyWeapon(); if (typeof setPadLabels === "function") setPadLabels(true); }
}
function trAlloc(id) {
  const path = trPath(id), why = trWhyNot(id, path); if (why) return why;
  (TRM ? wsTree(TRM - 1) : treeSt()).n.push(...path); trAfter(); return "";
}
function trRemovable(id) {
  const T = treeSt();
  if (TRM) { // 專屬點：剩下的都還接得到主樹
    const S = wsTree(TRM - 1); if (!S.n.includes(id)) return false;
    const left = new Set(S.n); left.delete(id); const seen = new Set(), q = [...T.n];
    while (q.length) { const u = q.shift(); for (const v of TREE[u].adj) if (left.has(v) && !seen.has(v)) { seen.add(v); q.push(v); } }
    return seen.size === left.size;
  }
  if (!T.n.includes(id) || id === T.s) return false;
  const left = new Set(T.n); left.delete(id);
  const seen = new Set([T.s]), q = [T.s];
  while (q.length) { const u = q.shift(); for (const v of TREE[u].adj) if (left.has(v) && !seen.has(v)) { seen.add(v); q.push(v); } }
  return seen.size === left.size;
}
const trUndoCost = () => 30 * save.w.lv;
function trUndo(id) {
  if (!trRemovable(id)) return "這格退了會讓後面的斷掉，先退外面的";
  if (TRM) { if (!(typeof atCamp === "function" && atCamp())) return "專屬點在城裡或營地結界裡才能退（免費）"; const S = wsTree(TRM - 1); S.n = S.n.filter((x) => x !== id); trAfter(); return ""; }
  if (!useCur("regret")) { if (save.stone < trUndoCost()) return `要 1 個洗心丹或 ${trUndoCost()} 靈石`; save.stone -= trUndoCost(); }
  const T = treeSt(); T.n = T.n.filter((x) => x !== id); trAfter(); return "";
}
const trResetCost = () => 100 * save.w.lv;
function trReset() {
  const T = treeSt();
  if (!(typeof atCamp === "function" && atCamp())) return "在城裡或營地結界裡才能全部重置";
  if (TRM) { wsTree(TRM - 1).n = []; trAfter(); return ""; } // 專屬點：只重置這一組、免費
  if (T.fr) T.fr = 0;
  else if (curN("regret") >= 5) useCur("regret", 5);
  else if (save.stone >= trResetCost()) save.stone -= trResetCost();
  else return `要 5 個洗心丹或 ${trResetCost()} 靈石`;
  T.s = null; T.n = []; trAfter(); return "";
}
function trPickStart(id) {
  const T = treeSt(); if (T.s) return "已經有起點了（全部重置才能換）";
  T.s = id; T.n = [id]; trAfter(); return "";
}
const trTagUse = (k) => !window.__nt && (typeof slotTags !== "function" || ["a", "q"].some((sl) => slotTags(sl).includes(k[1]))); // 推薦路線只點用得到的標籤
// 推薦路線：照現在的武器，每次挑「整條路平均最值」的格子點下去，直到點數用完（不點核心天賦）
function trValue(N, main) {
  let v = 0;
  for (const k in N.e) {
    const x = N.e[k];
    v += k === main ? x : k === "vit" ? x * 0.45 : ["str", "agi", "wis"].includes(k) ? x * (k === "agi" ? 0.2 : 0.08)
      : ({ atk: 2.2, crit: 3.2, cdmg: 0.55, aspd: main === "agi" ? 2.2 : 2.6, spd: 0.5, hp: 1.2, armor: 0.2, dodge: 1.2, supp: 0.6, es: main === "wis" ? 0.35 : 0.1, mp: 0.08, mpr: 0.15, leech: 9, res: 0.8, loot: 0.15, tp: 1.1, tm: 1.1, ta: 1.0, td: 0.7, tv: 0.5, ...TR_EV }[k] || 0) * x * (k[0] === "t" && k.length === 2 && !trTagUse(k) ? 0 : 1);
  }
  if (N.t === "note" && typeof trNoteVal === "function") v += trNoteVal(N.th);
  if (TR_PREF && N.th && TR_PREF.includes(N.th)) v += N.t === "note" ? 30 : 12; // treeRecommendFor：指定主題優先
  return v;
}
let TR_EV = {};
function trEleVal() { // 推薦路線：只看這把武器普攻／Q 的元素
  const o = { fire: 0, ice: 0, thun: 0, chaos: 0 }, M = { F: "fire", W: "ice", T: "thun", P: "chaos" };
  if (typeof slotEle !== "function") return o;
  for (const sl of ["a", "q"]) { let e = null; try { e = slotEle(sl); } catch (x) {} if (e && M[e]) o[M[e]] += 0.8; }
  return o;
}
let TR_PREF = null;
// 照主題點（給企劃 bot／測試）：treeRecommendFor(["fire", "fire2", "t_d"])＝先往這些天賦群點，其他照推薦路線
function treeRecommendFor(ths) { TR_PREF = ths; try { treeRecommend(); } finally { TR_PREF = null; } }
function wsRecommend(i) { // 專屬點推薦：照那一組武器的主屬性
  const T = treeSt(); if (!T.s) return "先在主樹選一個起點";
  const wt = wsWt(i); if (!wt) return `武器組 ${i + 1} 是空的（行囊裡把武器放到武器 ${i + 1}）`;
  const S = wsTree(i), main = TR_WMAIN[wt] || "agi", M0 = TRM; TRM = i + 1; TR_EV = trEleVal();
  try {
    let free = wsFree(i), guard = 200;
    while (free > 0 && guard--) {
      const have = new Set(T.n.concat(S.n)), dist = {}, prev = {}, val = {}, q = [];
      for (const id of have) { dist[id] = 0; val[id] = 0; q.push(id); }
      let best = null, bs = -1;
      while (q.length) {
        const u = q.shift();
        if (dist[u] >= free || (!have.has(u) && !trCanPass(u))) continue;
        for (const v of TREE[u].adj) {
          if (v in dist || wsNoNode(TREE[v])) continue;
          dist[v] = dist[u] + 1; prev[v] = u; val[v] = val[u] + trValue(TREE[v], main); q.push(v);
          const sc = val[v] / dist[v]; if (sc > bs) { bs = sc; best = v; }
        }
      }
      if (!best) break;
      const path = []; for (let u = best; !have.has(u); u = prev[u]) path.unshift(u);
      S.n.push(...path); free -= path.length;
    }
  } finally { TRM = M0; }
  trAfter(); return "";
}
function treeRecommend() {
  const T = treeSt(); if (!T.s) { T.s = trWStart(); T.n = [T.s]; }
  const main = TR_WMAIN[curWeapon()] || "agi"; TR_EV = trEleVal();
  let free = treeFree(), guard = 400;
  while (free > 0 && guard--) {
    const have = new Set(T.n), dist = {}, prev = {}, val = {}, q = [];
    for (const id of T.n) { dist[id] = 0; val[id] = 0; q.push(id); }
    let best = null, bs = -1;
    while (q.length) {
      const u = q.shift();
      if (dist[u] >= free || (!have.has(u) && !trCanPass(u))) continue;
      for (const v of TREE[u].adj) {
        if (v in dist || TREE[v].t === "ks") continue;
        dist[v] = dist[u] + 1; prev[v] = u; val[v] = val[u] + trValue(TREE[v], main); q.push(v);
        const sc = val[v] / dist[v]; if (sc > bs) { bs = sc; best = v; }
      }
    }
    if (!best) break;
    const path = []; for (let u = best; !have.has(u); u = prev[u]) path.unshift(u);
    T.n.push(...path); free -= path.length;
  }
  trAfter();
}

// ───────── 4. 畫面 ─────────
let trQ = "", trHitSet = null; // 搜尋
let trView = null, trSel = null, trMsg = "", trCv = null, trPtr = new Map(), trPinch = null, trMoved = 0;
const TR_R = { hub: 24, start: 19, attr: 9, small: 9, note: 16, ks: 21, jw: 14 };
function renderTree(msg) {
  if (!save.w) return;
  if (ovKind !== "tree" && !ovOpen("tree")) return;
  const T = treeSt();
  if (msg != null) trMsg = msg;
  if (!ov.querySelector(".trwrap")) {
    ov.innerHTML = `<div class="trwrap"><canvas id="trc"></canvas><div class="trtop"></div><input class="trq" type="search" placeholder="搜尋：火、投射、爆擊…" value="${trQ}"><div class="trinfo"></div></div>`;
    const q = ov.querySelector(".trq");
    q.addEventListener("input", () => { trQ = q.value.trim(); trSearch(); trDraw(); });
    q.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Escape") q.blur(); });
    q.addEventListener("pointerdown", (e) => e.stopPropagation()); q.addEventListener("click", (e) => e.stopPropagation());
    trSearch();
    trCv = ov.querySelector("#trc"); trBindCanvas();
    if (!trView) { trView = { x: 0, y: 0, z: Math.min(innerWidth, innerHeight) < 500 ? 0.5 : 0.7 }; trCenter(); }
    if (save.w.treeHint) { delete save.w.treeHint; writeSave(); }
  }
  trPanel(); trDraw();
}
function trPanel() {
  const T = treeSt(), top = ov.querySelector(".trtop"), info = ov.querySelector(".trinfo"); if (!top) return;
  const wsName = (i) => { const wt = wsWt(i); return wt ? (WS_SHORT[wt] || wt) : "空"; };
  const tabs = `<div class="trtabs">${["主樹", "武器組 1", "武器組 2", "武器組 3"].map((n, i) => `<button class="trtab${TRM === i ? " on" : ""}" data-trm="${i}" style="${i ? `--wc:${TRWS_C[i - 1]}` : ""}">${n}${i ? `<small>${wsName(i - 1)}${wsFree(i - 1) > 0 ? `・剩 ${wsFree(i - 1)}` : ""}${wsCur() === i - 1 ? "・手上" : ""}</small>` : `<small>${treeFree() > 0 ? `剩 ${treeFree()}` : "三組共用"}</small>`}</button>`).join("")}</div>`;
  if (TRM) {
    const i = TRM - 1, f = wsFree(i), n = wsTree(i).n.length;
    top.innerHTML = tabs + `<span class="trpts" style="--wc:${TRWS_C[i]}">武器組 ${i + 1} 專屬點 剩 <b class="${f > 0 ? "hot" : ""}">${f}</b><small>已點 ${n}・共 ${wsTotal()}（每 ${TRWS_EVERY} 級 1 點）</small></span>
    <button id="trHome" class="trb">回到我的格子</button><button id="trRec" class="trb${!n && f > 0 ? " gold" : ""}" ${f > 0 && wsWt(i) ? "" : "disabled"}>推薦路線</button>
    <button id="trReset" class="trb" ${n ? "" : "disabled"}>重置這組<small>營地免費</small></button>`;
  } else {
  const free = treeFree(), cnt = T.n.filter((x) => x !== T.s).length;
  top.innerHTML = tabs + `<span class="trpts">剩餘 <b class="${free > 0 ? "hot" : ""}">${free}</b> 點<small>已點 ${cnt}・共 ${treeTotal()}</small></span>
    <button id="trHome" class="trb">回到我的格子</button><button id="trRec" class="trb${!cnt && free > 0 ? " gold" : ""}" ${free > 0 ? "" : "disabled"}>推薦路線</button>
    <button id="trReset" class="trb" ${T.s ? "" : "disabled"}>全部重置<small>${T.fr ? "第一次免費" : curN("regret") >= 5 ? "−5 洗心丹" : `−${trResetCost()} 靈石`}</small></button>`;
  }
  { const q = ov.querySelector(".trq"); if (q) q.style.top = top.offsetHeight + 14 + "px"; } // 搜尋框放在上面那排按鈕底下（直向會換行）
  let h = "";
  if (trSel && TREE[trSel]) {
    const N = TREE[trSel], has = trHave().includes(trSel), path = has ? null : trPath(trSel), why = has ? "" : trWhyNot(trSel, path);
    const kind = { hub: "樞紐", start: "起點", attr: "屬性", small: "小天賦", note: "重要天賦", ks: "核心天賦（有好有壞）", jw: "天賦玉槽" }[N.t];
    const extra = N.t === "start" ? `<small class="dim">適合：${TR_SEC[N.sec].fit}（不限武器）</small>` : N.t === "ks" ? `<small class="dim">Lv.${TR_KS_LV} 以後才能點</small>` : "";
    let act = "";
    if (!T.s && N.t === "start") act = `<button id="trPick" class="trb gold">選這個起點</button>`;
    else if (TRM && has && T.n.includes(trSel)) act = `<small class="dim">主樹的格子（切到「主樹」分頁才能退）</small>`;
    else if (TRM && has) act = trRemovable(trSel) ? `<button id="trUndo" class="trb">退這一格<small>營地免費</small></button>` : `<small class="dim">已點亮（要先退外面的才能退這格）</small>`;
    else if (has) act = trRemovable(trSel) ? `<button id="trUndo" class="trb">退這一格<small>${curN("regret") ? "−1 洗心丹" : `−${trUndoCost()} 靈石`}</small></button>` : trSel === T.s ? `<small class="dim">你的起點</small>` : `<small class="dim">已點亮（要先退外面的才能退這格）</small>`;
    else if (why) act = `<small class="bad">${why}</small>`;
    else act = `<button id="trGo" class="trb gold">${TRM ? "用專屬點" : ""}${path.length > 1 ? `點亮這條路（${path.length} 點）` : "點亮（1 點）"}</button>`;
    if (N.t === "jw" && typeof trJwAct === "function" && !TRM) act += trJwAct(trSel, has);
    h = `<div class="trcard"><div class="trname" style="color:${N.t === "ks" ? "#ff9ae0" : N.t === "note" ? "#ffe066" : "#f0e2c4"}">${trNodeName(N)}<small>${kind}</small></div>
      <div class="trlines">${trNodeLines(N).map((x) => `<span>${x}</span>`).join("") || "<span class='dim'>（沒有效果，只是路）</span>"}</div>${extra}<div class="tract">${act}</div></div>`;
  } else if (TRM) {
    const i = TRM - 1, wt = wsWt(i);
    h = `<div class="trcard"><div class="trname" style="color:${TRWS_C[i]}">武器組 ${i + 1} 的專屬點<small>${wt ? `這組是${(WS_SHORT[wt] || wt)}` : "這組還沒放武器"}</small></div>
      <div class="trlines"><span>只在拿武器組 ${i + 1} 時生效（按 ${i + 1} 切武器會自動換）</span><span>要接在主樹已點的格子旁邊；核心天賦、天賦玉槽只能用主樹點</span><span>在城裡或營地可以免費退、免費重置這一組</span></div></div>`;
  } else {
    const a = treeAttr(), main = TR_WMAIN[curWeapon()] || "agi";
    h = `<div class="trcard"><div class="trname">${T.s ? "點格子看說明" : "先選一個起點"}<small>${T.s ? "遠的格子也能直接點，會自動找最短路" : "點外圈 6 個大圓其中一個（紅＝力量、綠＝敏捷、藍＝智力）"}</small></div>
      <div class="trlines">${["str", "agi", "wis", "vit"].map((k) => `<span style="color:${TR_ATTR[k].c}">${TR_ATTR[k].n} ${a[k]}${k === main ? "（主屬性）" : ""}</span>`).join("")}</div>
      <small class="dim">你現在拿${WEAPONS[curWeapon()].job.replace(/修$/, "")}：主屬性是${TR_ATTR[main].n}（${main === "agi" ? "每點傷害 +1.2%、攻速 +0.3%" : "每點傷害 +3%"}）。兩指縮放、一指拖動。</small></div>`;
  }
  info.innerHTML = h + (trMsg ? `<div class="trmsg">${trMsg}</div>` : "");
  trMsg = "";
  const on = (id, f) => { const b = ov.querySelector("#" + id); if (b) b.onclick = (e) => { e.stopPropagation(); f(); }; };
  const res = (m, ok) => { sfx(m ? "bad" : "good"); renderTree(m || ok); };
  on("trHome", () => { sfx("click"); trCenter(); trDraw(); });
  on("trRec", () => { if (TRM) { const m = wsRecommend(TRM - 1); trSel = null; res(m, `照武器組 ${TRM} 的武器點好了`); return; } treeRecommend(); trSel = null; res("", "照你現在的武器點好了，不喜歡的格子可以退"); });
  on("trReset", () => { const m = trReset(); if (!m) trSel = null; res(m, TRM ? `武器組 ${TRM} 的專屬點全部退回了` : "全部退回了，重新選起點"); });
  top.querySelectorAll(".trtab").forEach((b) => (b.onclick = (e) => { e.stopPropagation(); sfx("click"); TRM = +b.dataset.trm; trSel = null; renderTree(); }));
  on("trPick", () => { const m = trPickStart(trSel); res(m, "起點選好了，往外點吧"); });
  on("trGo", () => { const N = TREE[trSel], m = trAlloc(trSel); res(m, `點亮：${trNodeName(N)}`); });
  on("trUndo", () => { const N = TREE[trSel], m = trUndo(trSel); res(m, `退掉：${trNodeName(N)}`); });
  if (typeof trJwBind === "function") trJwBind(info, res);
}
function trSearch() { // 名字＋說明文字有這個字就亮起來
  if (!trQ) { trHitSet = null; return; }
  const q = trQ.toLowerCase(); trHitSet = new Set();
  for (const id of TR_IDS) { const N = TREE[id], t = (trNodeName(N) + " " + trNodeLines(N).join(" ") + (N.th && TR_TH[N.th] ? TR_TH[N.th].n : "")).replace(/<[^>]+>/g, "").toLowerCase(); if (t.includes(q)) trHitSet.add(id); }
}
const trCollapsed = () => trView && trView.z < 0.42; // 縮很小：天賦群收成一個點
function trCenter() { // 鏡頭對準已點格子的中心（還沒點就看起點／整棵樹）
  const T = treeSt(), ns = T.n.length > 1 ? T.n : T.s ? [T.s] : ["h"];
  trView.x = ns.reduce((a, id) => a + TREE[id].x, 0) / ns.length; trView.y = ns.reduce((a, id) => a + TREE[id].y, 0) / ns.length;
  if (!T.s) { trView.x = 0; trView.y = 0; }
}
function trXY(N) { if (N.cl && trCollapsed()) N = TREE[N.cl]; const c = trCv, z = trView.z; return [c.width / 2 / trDpr() + (N.x - trView.x) * z, c.height / 2 / trDpr() + (N.y - trView.y) * z]; }
const trDpr = () => Math.min(2, window.devicePixelRatio || 1);
function trDraw() {
  const c = trCv; if (!c || !c.isConnected) return;
  const r = c.getBoundingClientRect(), d = trDpr();
  if (c.width !== Math.round(r.width * d) || c.height !== Math.round(r.height * d)) { c.width = Math.round(r.width * d); c.height = Math.round(r.height * d); }
  const g = c.getContext("2d"), T = treeSt(), have = new Set(trHave()), wsSet = new Set(TRM ? wsTree(TRM - 1).n : []), wsC = TRM ? TRWS_C[TRM - 1] : "", z = trView.z, W = r.width, H = r.height;
  g.setTransform(d, 0, 0, d, 0, 0);
  const bg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7); bg.addColorStop(0, "#1a1712"); bg.addColorStop(1, "#08080a");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // 6 區淡淡的顏色
  const [hx, hy] = trXY(TREE.h);
  for (const S of TR_SEC) {
    const a = S.a * Math.PI / 180, gr = g.createRadialGradient(hx + Math.cos(a) * 560 * z, hy + Math.sin(a) * 560 * z, 0, hx + Math.cos(a) * 560 * z, hy + Math.sin(a) * 560 * z, 520 * z);
    gr.addColorStop(0, S.c + "18"); gr.addColorStop(1, S.c + "00"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  const path = trSel && !have.has(trSel) ? trPath(trSel) : null, pset = new Set(path || []);
  const avail = new Set(); if (T.s) for (const id of have) for (const v of TREE[id].adj) if (!have.has(v) && !(TRM && wsNoNode(TREE[v]))) avail.add(v);
  // 連線
  g.lineCap = "round";
  for (const id of TR_IDS) {
    const N = TREE[id], [x1, y1] = trXY(N);
    for (const v of N.adj) {
      if (v < id) continue;
      const M = TREE[v], [x2, y2] = trXY(M);
      if (x1 === x2 && y1 === y2) continue;
      if (Math.max(x1, x2) < -40 || Math.min(x1, x2) > W + 40 || Math.max(y1, y2) < -40 || Math.min(y1, y2) > H + 40) continue;
      const both = have.has(id) && have.has(v), pth = (pset.has(id) || have.has(id)) && (pset.has(v) || have.has(v)) && (pset.has(id) || pset.has(v));
      g.strokeStyle = both ? (wsSet.has(id) || wsSet.has(v) ? wsC : "#e8b84a") : pth ? "#fff3c0" : "rgba(160,130,70,0.32)"; g.lineWidth = Math.max(1.5, (both || pth ? 5 : 3.5) * z);
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    }
  }
  // 格子
  const small = z < 0.55, col = trCollapsed();
  for (const id of TR_IDS) {
    if (col && TREE[id].cl) continue;
    const N = TREE[id], [x, y] = trXY(N), rr = Math.max(N.t === "attr" || N.t === "small" ? 3 : 6, TR_R[N.t] * z) * (col && N.t === "note" ? 1.5 : 1);
    if (N.t === "jw") { if (!(x < -60 || x > W + 60 || y < -60 || y > H + 60) && typeof trJwDraw === "function") trJwDraw(g, N, x, y, rr, have.has(id), avail.has(id), pset.has(id), trSel === id); continue; }
    if (trHitSet && (trHitSet.has(id) || (col && N.t === "note" && TR_IDS.some((o) => TREE[o].cl === id && trHitSet.has(o))))) { g.beginPath(); g.arc(x, y, rr + 6 + 2 * Math.sin(performance.now() / 200), 0, Math.PI * 2); g.fillStyle = "rgba(120,220,255,0.35)"; g.fill(); }
    if (x < -60 || x > W + 60 || y < -60 || y > H + 60) continue;
    const on = have.has(id), av = avail.has(id) || (!T.s && N.t === "start"), inP = pset.has(id), sel = trSel === id;
    const ac = N.at ? TR_ATTR[N.at].c : N.t === "start" ? TR_SEC[N.sec].c : null;
    g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2);
    g.fillStyle = on ? (wsSet.has(id) ? wsC : N.t === "ks" ? "#ff9ae0" : "#ffd25a") : inP ? "#6a5a30" : N.t === "ks" ? "#3a1c34" : N.t === "note" ? "#3a3220" : "#26241f";
    g.fill();
    if (ac && (N.t !== "start" || !on)) { g.beginPath(); g.arc(x, y, rr * (on ? 0.45 : 0.6), 0, Math.PI * 2); g.fillStyle = ac; g.globalAlpha = on ? 1 : 0.55; g.fill(); g.globalAlpha = 1; }
    g.lineWidth = Math.max(1.2, (sel ? 3.5 : 2) * Math.min(1.3, z));
    g.strokeStyle = sel ? "#ffffff" : on ? "#fff1b0" : inP ? "#fff3c0" : av ? "#f4f0e6" : N.t === "ks" ? "#8a4a7a" : N.t === "note" ? "#8a7440" : "#5a5446";
    g.stroke();
    if (rr >= 7 && (N.t === "note" || N.t === "ks" || N.t === "start")) { // 使用者畫的圖示（企劃 31）
      const ik = N.t === "note" ? N.th : N.t === "ks" ? N.ks : "s" + N.sec, s2 = rr * (N.t === "ks" ? 2.3 : 2.1);
      if (!icoHas("tree", ik)) { const nm = N.t === "note" ? (TR_TH[N.th] ? TR_TH[N.th].n : "") : N.t === "ks" ? trNodeName(N) : ""; if (nm) { g.font = `bold ${Math.round(rr * 1.05)}px 'Noto Sans TC', sans-serif`; g.textAlign = "center"; g.fillStyle = on ? "#3a2a10" : N.t === "ks" ? "#ffb8ea" : "#ffe9a0"; g.globalAlpha = on || inP || av || sel ? 1 : 0.7; g.fillText(nm[0], x, y + rr * 0.38); g.globalAlpha = 1; } }
      else { g.globalAlpha = on || inP || av || sel ? 1 : 0.55; icoDraw(g, "tree", ik, x - s2 / 2, y - s2 / 2, s2, s2); g.globalAlpha = 1; if (on) { g.lineWidth = Math.max(1.2, 2 * Math.min(1.3, z)); g.strokeStyle = "#fff1b0"; g.beginPath(); g.arc(x, y, s2 / 2, 0, Math.PI * 2); g.stroke(); } }
    }
    if (col && N.t === "note") { const ring = TR_IDS.filter((o) => TREE[o].cl === id), k = ring.filter((o) => have.has(o)).length + (on ? 1 : 0); g.font = `bold 10px sans-serif`; g.textAlign = "center"; g.fillStyle = on ? "#3a2a10" : "#d8ccb0"; g.fillText(`${k}/5`, x, y + 4); }
    if (N.tag && !col && z >= 0.55) { g.font = `bold ${Math.max(8, 10 * z)}px 'Noto Sans TC', sans-serif`; g.textAlign = "center"; g.fillStyle = on ? "#3a2a10" : "#9fe8ff"; g.fillText(TR_TAGN[N.tag][0], x, y + 3.5 * Math.max(0.8, z)); }
    if (N.t === "note" || N.t === "ks" || N.t === "start" || N.t === "hub") {
      if (small && N.t !== "note" && N.t !== "ks" && N.t !== "start") continue;
      const fs = Math.max(10, Math.min(15, 12 * Math.sqrt(z)));
      g.font = `bold ${fs}px 'Noto Sans TC', sans-serif`; g.textAlign = "center"; g.lineWidth = 3; g.strokeStyle = "rgba(8,8,10,0.85)";
      const t = trNodeName(N).replace("・起點", ""), ty = y + rr + fs + 1;
      g.strokeText(t, x, ty); g.fillStyle = N.t === "ks" ? "#ffb8ea" : on ? "#ffe9a0" : "#d8ccb0"; g.fillText(t, x, ty);
    }
  }
}
function trHit(px, py) {
  let best = null, bd = 1e9;
  for (const id of TR_IDS) { if (TREE[id].cl && trCollapsed()) continue; const [x, y] = trXY(TREE[id]), d = Math.hypot(x - px, y - py), lim = Math.max(16, TR_R[TREE[id].t] * trView.z + 8); if (d < lim && d < bd) { bd = d; best = id; } }
  return best;
}
function trBindCanvas() {
  const c = trCv, pos = (e) => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const zoomAt = (px, py, nz) => {
    const r = c.getBoundingClientRect(); nz = Math.max(0.2, Math.min(2.6, nz)); // v8.6 樹變大（半徑約 1350）
    const wx = trView.x + (px - r.width / 2) / trView.z, wy = trView.y + (py - r.height / 2) / trView.z;
    trView.z = nz; trView.x = wx - (px - r.width / 2) / nz; trView.y = wy - (py - r.height / 2) / nz;
  };
  c.addEventListener("pointerdown", (e) => { e.stopPropagation(); c.setPointerCapture(e.pointerId); trPtr.set(e.pointerId, pos(e)); trMoved = 0;
    if (trPtr.size === 2) { const [a, b] = [...trPtr.values()]; trPinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: trView.z }; } });
  c.addEventListener("pointermove", (e) => {
    if (!trPtr.has(e.pointerId)) return;
    const p = pos(e), o = trPtr.get(e.pointerId); trPtr.set(e.pointerId, p);
    if (trPtr.size === 1) { trView.x -= (p[0] - o[0]) / trView.z; trView.y -= (p[1] - o[1]) / trView.z; trMoved += Math.abs(p[0] - o[0]) + Math.abs(p[1] - o[1]); }
    else if (trPtr.size === 2 && trPinch) { const [a, b] = [...trPtr.values()]; zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, trPinch.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / trPinch.d); trMoved = 99; }
    trDraw();
  });
  const up = (e) => {
    if (!trPtr.has(e.pointerId)) return;
    const p = trPtr.get(e.pointerId); trPtr.delete(e.pointerId); if (trPtr.size < 2) trPinch = null;
    if (trPtr.size === 0 && trMoved < 8 && e.type === "pointerup") { const id = trHit(p[0], p[1]); sfx("click"); trSel = id === trSel ? null : id; trPanel(); trDraw(); }
  };
  c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up);
  c.addEventListener("wheel", (e) => { e.preventDefault(); const [x, y] = pos(e); zoomAt(x, y, trView.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); trDraw(); }, { passive: false });
  c.addEventListener("click", (e) => e.stopPropagation());
}
window.addEventListener("resize", () => { if (ovKind === "tree") trDraw(); });
// P 鍵開關天賦樹（原本 P 是設定，設定改成只用 Esc）
window.addEventListener("keydown", (e) => {
  if (e.target && e.target.tagName === "INPUT") return;
  if (e.key.toLowerCase() !== "p" || e.repeat) return;
  if (state === "world" && !ovKind) { e.stopImmediatePropagation(); sfx("click"); renderTree(); }
}, true);
OV_KEYS.tree = ["escape", "p"];
// 右上「天」：有點數就亮紅點
setInterval(() => { const b = document.querySelector('#quick .qbtn[data-q="tree"]'); if (b && save.w && save.w.created) b.classList.toggle("dot", treeFree() > 0 || (!!wsWt(wsCur()) && wsFree(wsCur()) > 0)); }, 1000);
