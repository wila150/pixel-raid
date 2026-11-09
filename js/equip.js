// 御劍渡劫（pixel-raid）— 流派、裝備（隨機詞綴打寶）、戰力、裝備畫面
"use strict";

// ───────── 六大流派（開局前選，三個模式都有效）─────────
const SCHOOLS = {
  ti: { n: "體修", tag: "反傷", d: "生命 +20%，被打時把 60% 傷害反震回去；跑酷撞到損失少 30%" },
  dao: { n: "道修", tag: "回血", d: "每秒回 2 點生命、丹藥回血 +50%；跑酷開場自帶 1 層金鐘罩" },
  fa: { n: "法修", tag: "高爆發", d: "所有傷害 +35%、爆擊傷害 +50%，但生命 −20%；跑酷打封印快 30%" },
  yao: { n: "妖修", tag: "限敵", d: "敵人和火球都變慢 20%；跑酷的妖群少 20%" },
  qi: { n: "氣修", tag: "無視防禦", d: "無視石甲妖、妖將、暴走石魔的防禦，爆擊率 +10%" },
  zen: { n: "禪修", tag: "持續成長", d: "戰鬥中每 10 秒傷害 +5%（一直疊）；跑酷每道加號門多 +3" },
};

// ───────── 裝備 ─────────
const SLOTS = {
  sword: { n: "武器", base: "atk", names: ["青鋼劍", "寒鐵劍", "流雲劍", "赤霄劍", "斬月劍"] },
  crown: { n: "冠", base: "hp", names: ["布冠", "玉簪冠", "紫金冠", "星辰冠", "蓮華冠"] },
  robe: { n: "袍", base: "def", names: ["粗麻袍", "青衫", "鶴紋道袍", "玄鱗甲", "雲錦法衣"] },
  boots: { n: "靴", base: "spd", names: ["草鞋", "布靴", "追風靴", "流光靴", "凌虛靴"] },
  charm: { n: "佩", base: "crit", names: ["木牌", "玉佩", "靈犀佩", "龍紋佩", "太虛佩"] },
  ring: { n: "戒指", base: "none", acc: true, names: ["銅戒", "銀戒", "青玉戒", "紫晶戒", "太虛戒"] }, // 企劃 12 §2-3：純詞綴飾品，三轉開
  ear: { n: "耳飾", base: "none", acc: true, names: ["木耳墜", "銀耳環", "翡翠墜", "鳳羽墜", "星河墜"] }, // 四轉開
};
const SLOT_JOB = { ring: 3, ear: 4 }; // 部位要幾轉才開
const slotOpen = (k) => !SLOT_JOB[k] || (typeof jobLv === "function" && save.w ? jobLv() : 0) >= SLOT_JOB[k];
const slotLockTxt = (k) => `${["", "一", "二", "三", "四"][SLOT_JOB[k]]}轉開放`;
const ACC_NO = ["def", "es", "thorns"]; // 戒指／耳飾不出護甲類
// 掉落部位：開放的部位，戒指／耳飾權重一半
function pickSlot() { const ks = SLOT_KEYS.filter(slotOpen), ws = ks.map((k) => (SLOTS[k].acc ? 1 : 2)); let r = Math.random() * ws.reduce((a, b) => a + b, 0); for (let i = 0; i < ks.length; i++) if ((r -= ws[i]) < 0) return ks[i]; return ks[0]; }
const SLOT_KEYS = Object.keys(SLOTS);
// 武器決定招式（沒有職業，拿什麼武器就打什麼路子）
const WEAPONS = {
  sword: { n: "輕型飛劍", job: "劍修", d: "近身揮砍、劍氣穿透、掌心雷（物理；割小型怪最強，打大型只剩 50%）", names: ["青鋼劍", "寒鐵劍", "流雲劍", "赤霄劍", "斬月劍"] },
  staff: { n: "法杖", job: "法修", d: "遠程法球、火雨範圍、冰環減速（法術；不吃體型修正）", names: ["桃木杖", "青玉杖", "紫焰杖", "玄冰杖", "太乙杖"] },
  bow: { n: "弓", job: "弓修", d: "快速連射、散射、穿雲箭（物理；大型 75%）", names: ["竹弓", "鐵胎弓", "追星弓", "落日弓", "射天弓"] },
  blade: { n: "玄鐵重劍", job: "刀修", d: "大範圍重斬、旋風斬、裂地斬（物理；專剋大型王 125%，小型 75%）", names: ["柴刀", "厚背刀", "虎牙刀", "破山刀", "斷岳刀"] },
  fist: { n: "拳套", job: "拳修", d: "超快連拳、衝拳突進、震地（物理；大型 75%）", names: ["布纏手", "鐵指虎", "熊爪套", "金剛拳套", "龍鱗拳套"] },
  fan: { n: "扇", job: "扇修", d: "迴旋風刃、旋風、清風回血（法術；不吃體型修正）", names: ["竹扇", "羽扇", "流風扇", "青鸞扇", "乾坤扇"] },
};
const WT_KEYS = Object.keys(WEAPONS);
const wtOf = (it) => (it && it.slot === "sword" ? it.wt || "sword" : null);
const curWeapon = () => wtOf(save.eq.sword) || "sword";
const sameWt = (b) => b.slot !== "sword" || wtOf(b) === curWeapon(); // 自動換裝、賣垃圾不會動到別種武器
// 詞綴：lo～hi 是 0 級的範圍，每級裝備 +35%；w 是算戰力的權重
const AFFIX = {
  // 前綴：生存與核心屬性
  atk: { n: "攻擊", lo: 4, hi: 10, w: 6, t: "p" },
  atkP: { n: "攻擊", lo: 3, hi: 8, w: 8, pct: true, t: "p" },
  hp: { n: "生命", lo: 12, hi: 30, w: 1, t: "p" },
  es: { n: "能量護盾", lo: 10, hi: 26, w: 1.2, t: "p" },
  def: { n: "護甲", lo: 6, hi: 16, w: 2.5, t: "p" },
  leech: { n: "吸血", lo: 0.4, hi: 1, w: 40, pct: true, dec: 1, t: "p" },
  thorns: { n: "反震", lo: 5, hi: 12, w: 4, pct: true, t: "p" },
  // 後綴：速度與抗性
  spd: { n: "移動速度", lo: 2, hi: 5, w: 6, t: "s" },
  aspd: { n: "攻擊速度", lo: 2, hi: 5, w: 7, pct: true, t: "s" },
  // 抗性（企劃 22）：sc＝每級裝備只 +12%（不然高等一條就滿）；rw＝出現權重（全抗、混沌比較少見），飾品抗性 ×2.5
  resF: { n: "火焰抗性", lo: 6, hi: 15, w: 3, pct: true, t: "s", sc: 0.12, rw: 0.5 },
  resW: { n: "冰冷抗性", lo: 6, hi: 15, w: 3, pct: true, t: "s", sc: 0.12, rw: 0.5 },
  resT: { n: "閃電抗性", lo: 6, hi: 15, w: 3, pct: true, t: "s", sc: 0.12, rw: 0.5 },
  resA: { n: "全元素抗性", lo: 3, hi: 8, w: 9, pct: true, t: "s", sc: 0.12, rw: 0.3 },
  resP: { n: "混沌抗性", lo: 4, hi: 10, w: 5, pct: true, t: "s", sc: 0.12, rw: 0.2 },
  res: { n: "元素抗性（舊）", w: 4, pct: true, t: "x" }, // 舊存檔：載入時換成全元素抗性一半（resMig）
  dodge: { n: "閃避", lo: 1, hi: 3, w: 10, pct: true, t: "s", cap: 1 },
  supp: { n: "法術壓制", lo: 2, hi: 5, w: 6, pct: true, t: "s", cap: 1 },
  crit: { n: "爆擊率", lo: 1, hi: 3, w: 12, pct: true, t: "s" },
  critD: { n: "爆擊傷害", lo: 6, hi: 15, w: 4, pct: true, t: "s" },
  ult: { n: "天罰充能", lo: 4, hi: 10, w: 3, pct: true, t: "s" },
  magnet: { n: "撿取範圍", lo: 10, hi: 25, w: 2, pct: true, t: "s" },
  swords: { n: "開場飛劍", lo: 2, hi: 6, w: 4, t: "x" }, // 舊模式用，不再掉
  // 只有魔物卡片會給
  sizeS: { n: "對小型傷害", w: 3, pct: true, t: "c" },
  sizeM: { n: "對中型傷害", w: 3, pct: true, t: "c" },
  sizeL: { n: "對大型傷害", w: 4, pct: true, t: "c" },
  critL: { n: "對大型爆擊率", w: 6, pct: true, t: "c" },
  raceB: { n: "對妖獸系傷害", w: 3, pct: true, t: "c" },
  raceP: { n: "對植物系傷害", w: 3, pct: true, t: "c" },
  raceR: { n: "對岩石系傷害", w: 3, pct: true, t: "c" },
  eleF: { n: "對火屬性傷害", w: 3, pct: true, t: "c" },
  eleW: { n: "對冰屬性傷害", w: 3, pct: true, t: "c" },
  eleT: { n: "對雷屬性傷害", w: 3, pct: true, t: "c" },
  eleP: { n: "對毒屬性傷害", w: 3, pct: true, t: "c" },
  drop: { n: "掉寶率", w: 3, pct: true, t: "c" },
};
// 前綴／後綴數量上限（凡、靈、玄、傳說）
const AFF_CAP = [0, 1, 3, 2];

// 詞綴名字：前綴放在名字前面、後綴放在後面（靈品一個、玄品兩個）
const AFF_WORD = { atk: "鋒銳", atkP: "霸道", hp: "厚實", es: "玄光", def: "堅石", leech: "嗜血", thorns: "荊棘", spd: "迅捷", aspd: "疾刃", resF: "避火", resW: "避寒", resT: "避雷", resA: "辟邪", resP: "鎮毒", dodge: "幻影", supp: "鎮魂", crit: "致命", critD: "破軍", swords: "萬劍", ult: "雷罰", magnet: "聚靈" };
function nameItem(it) {
  const en = it.en ? ` +${it.en}` : "";
  if (it.u) { it.name = UNIQUES[it.u].n + en; return; }
  const base = (it.slot === "sword" ? WEAPONS[wtOf(it)].names : SLOTS[it.slot].names)[Math.min(4, Math.floor(it.il / 1.2))], ks = Object.keys(it.aff);
  const pre = ks.find((k) => AFFIX[k] && AFFIX[k].t === "p"), suf = ks.find((k) => AFFIX[k] && AFFIX[k].t === "s");
  it.name = (it.q === 0 || !ks.length ? base : `${pre ? AFF_WORD[pre] : ""}${base}${suf ? `・${AFF_WORD[suf]}` : ""}`) + en;
}
const BASE_VAL = { none: [0, 0], atk: [8, 4], hp: [30, 15], def: [12, 6], spd: [4, 1], crit: [2, 0.5] }; // 主屬性：[0 級, 每級]
const RARITY = [
  { n: "凡品", c: "#ecebf2", aff: [0, 0], sell: 2 }, // 白
  { n: "靈品", c: "#5fa8ff", aff: [1, 2], sell: 6 }, // 藍
  { n: "玄品", c: "#b77dff", aff: [3, 6], sell: 15 }, // 紫
  { n: "傳說", c: "#ff8a3d", aff: [1, 4], sell: 40 }, // 橘：2 倍基礎＋1～4 詞條
];
// 傳說裝：固定名字＋特殊效果
const UNIQUES = {
  thunder: { slot: "sword", wt: "sword", n: "九霄引雷劍", d: "爆擊時引下天雷；E（天罰能量集滿）變成「九霄天雷」：一次劈附近 6 隻；四轉後起源覺醒變成「起源・九霄天雷」" },
  phoenix: { slot: "sword", wt: "staff", n: "朱雀焚天杖", d: "E（天罰能量集滿）變成「朱雀環」：身邊炸出一圈穿透火焰；四轉後起源覺醒變成「起源・朱雀環」" },
  sunbow: { slot: "sword", wt: "bow", n: "落日神弓", d: "E（天罰能量集滿）變成「箭雨」：目標一帶落下 12 支箭；四轉後起源覺醒變成「起源・箭雨」" },
  moon: { slot: "sword", wt: "blade", n: "斬月狂刀", d: "E（天罰能量集滿）變成「月輪」：一大圈刀氣，傷害極高；四轉後起源覺醒變成「起源・月輪」" },
  tiger: { slot: "sword", wt: "fist", n: "伏虎拳套", d: "E（天罰能量集滿）變成「百裂拳」：對眼前的敵人瞬間打 10 拳；四轉後起源覺醒變成「起源・百裂拳」" },
  qiankun: { slot: "sword", wt: "fan", n: "乾坤奪魄扇", d: "E（天罰能量集滿）變成「乾坤吸」：把附近的妖獸全吸過來再震飛；四轉後起源覺醒變成「起源・乾坤吸」" },
  qkhy: { slot: "sword", wt: "sword", n: "太古·乾坤化元劍", mods: ["split", "bounce", "voidQ"], d: "改寫招式：飛出去的劍擊中時分裂成 3 把副劍，副劍會在怪群之間彈跳 2 次；Q 劍陣變成「引力黑洞」" },
  splitbox: { slot: "charm", n: "分光劍匣", mods: ["split"], d: "改寫招式：所有飛出去的招式，擊中第一隻妖獸時分裂成 3 道" },
  starcrown: { slot: "crown", n: "連星折光冠", mods: ["bounce"], d: "改寫招式：所有飛出去的招式，擊中後會彈跳到旁邊的妖獸，最多 2 次" },
  voidrobe: { slot: "robe", n: "歸墟道袍", mods: ["voidQ"], d: "改寫招式：Q 招變成「歸墟黑洞」，把附近妖獸吸進去、持續傷害，最後爆開" },
  orbitboots: { slot: "boots", n: "御劍步雲靴", mods: ["orbit"], d: "改寫招式：普攻每 3 下召喚一把環身飛劍（最多 6 把，8 秒），繞身砍殺" },
  wavecleaver: { slot: "sword", wt: "blade", n: "斬浪玄鐵劍", mods: ["wave"], d: "改寫招式：每一下重斬都放出一道穿透刀浪" },
  vajra: { slot: "crown", n: "不壞金冠", d: "生命低於 30% 時，受到的傷害減半" },
  devour: { slot: "robe", n: "萬妖噬魂袍", d: "斬妖試煉每斬 30 隻妖，傷害 +3%；渡劫時吸血 +2%" },
  cloud: { slot: "boots", n: "踏雲靴", d: "閃身冷卻減半，斬妖試煉移動 +25%" },
  heart: { slot: "charm", n: "劍心玉佩", d: "渡劫時飛劍數量 ×1.3" },
  toadrobe: { slot: "robe", n: "萬毒蟾衣", mods: ["psnHit", "psnConv"], rb: true, d: "王專屬：攻擊有 20% 讓妖獸中毒 3 層；法杖、扇和元素轉化的傷害全部變成可疊 5 層的毒；站在毒池裡不扣血，反而回真氣" },
  hourglass: { slot: "ring", n: "時之沙漏", mods: ["lbDouble"], d: "每次切換武器（1／2／3），下一招段數翻倍" },
  bloodjade: { slot: "ear", n: "血玉佩", mods: ["vamp"], d: "吸血 +3%，每斬一隻妖回 1% 生命" },
  tstep: { slot: "boots", n: "踏雷靴", mods: ["tstep"], rb: true, d: "王專屬（九雷鵬王）：閃身結束時在落點劈下落雷（攻擊 ×3）；閃身冷卻 −20%" },
  wuxiang: { slot: "sword", wt: "sword", n: "無相劍", mods: ["echo"], rb: true, d: "王專屬（無相劍尊）：普攻打中時 25% 劍影再砍一次（60% 傷害）" },
};
const BAG_MAX = 40;
// ───────── 強化（+1～+10，每級全部數值 +10%，越高越容易失敗，失敗只扣靈石）─────────
const EN_MAX = 12;
const EN_RATE = [1, 1, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.12];
const enCost = (it) => Math.round(12 * ((it.en || 0) + 1) * (1 + it.il * 0.3));
// ───────── 輔助寶石（企劃 21 第二版：串在技能鏈上，只影響那一招；3 顆同級合成高一級，最高 5 級）─────────
const GEMS = {
  multi: { n: "連發", c: "#ffb347", d: (l) => `這招 ${25 + l * 10}% 機率再放一次` },
  power: { n: "巨力", c: "#ff6b6b", d: (l) => `這招傷害 +${l * 10}%` },
  haste: { n: "疾風", c: "#7dffb0", d: (l) => `這招冷卻 −${l * 7}%` },
  thrift: { n: "省元", c: "#6fb8ff", d: (l) => `這招真氣倍率 −${l * 15}%` },
  frost: { n: "寒霜", c: "#bfefff", d: (l) => `打中時 ${15 + l * 10}% 機率讓妖獸變慢` },
  chain: { n: "連鎖", c: "#e0d0ff", d: (l) => `打中時 ${8 + l * 5}% 機率引雷打旁邊另一隻` },
  burst: { n: "爆裂", c: "#ff8a3d", d: (l) => `這招斬殺的妖獸會炸開，傷害周圍（威力 ${l} 級）` },
  pierce: { n: "穿透", c: "#d8d2e0", d: (l) => `穿過所有怪，傷害 +${l * 5}%` },
  blood: { n: "嗜血", c: "#c0304a", d: (l) => `吸血 +${(l * 0.5).toFixed(1)}%` },
  lmp: { n: "多重投射", c: "#ffe9a0", d: (l) => `多 ${l >= 3 ? 4 : 2} 道（每道 70%）` },
  ice: { n: "元素轉化：冰", c: "#9fdcff", d: (l) => `打中會減速、${Math.round(10 * (1 + l * 0.6))}% 冰凍（冰凍的怪不能動）。一招只能一種元素` },
  fire: { n: "元素轉化：火", c: "#ff7a3a", d: (l) => `打中會燃燒；打到冰凍的怪「融化」傷害 ×2.5（${l} 級）。一招只能一種元素：用冰的招凍住，再用火的招打` },
  volt: { n: "元素轉化：雷", c: "#c8b8ff", d: (l) => `打中 ${25 + l * 7}% 雷電跳到旁邊 ${l >= 3 ? 2 : 1} 隻（50% 傷害）；打中毒的怪「毒爆」` },
  venom: { n: "元素轉化：毒", c: "#8dff6a", d: (l) => `打中疊 1 層毒（最多 5 層，持續傷害，${l} 級）；用雷打中毒的怪會「毒爆」` },
  det: { n: "引爆", c: "#ffb347", d: (l) => `打中燃燒中的怪 ${12 + l * 5}% 機率炸開` },
  // 第二版新的 15 顆
  split: { n: "分裂", c: "#a8ffd0", d: (l) => `打中後分成 ${l >= 3 ? 3 : 2} 道小的往旁邊飛（分出來的不會再分裂）` },
  bounce: { n: "彈射", c: "#9fe8ff", d: (l) => `打中後跳到下一隻 ${l >= 5 ? 3 : l >= 3 ? 2 : 1} 次（每跳 −20%），撞牆也會折射` },
  boomer: { n: "迴旋", c: "#c8f0e0", d: () => `飛到底再飛回來，回程也能打` },
  seek: { n: "追蹤", c: "#ffe0a0", d: (l) => `飛行中慢慢轉向最近的怪（${l} 級轉得更快）` },
  enlarge: { n: "擴大", c: "#ffb070", d: (l) => `範圍 +${[0, 15, 21, 27, 34, 40][l]}%` },
  after: { n: "餘震", c: "#e0b080", d: (l) => `0.5 秒後同一個地方再炸一次（${Math.round(40 + (l - 1) * 7.5)}%）` },
  trail: { n: "殘影", c: "#bfe6ff", d: (l) => `位移的路上留下 ${3 + l} 道會傷害的殘影` },
  rshield: { n: "護盾", c: "#9fdcff", d: (l) => `位移後 ${(1.5 + l * 0.25).toFixed(2).replace(/0$/, "")} 秒內擋下一次傷害` },
  icepath: { n: "冰徑", c: "#bfefff", d: (l) => `位移的路上結冰 ${(1.5 + l * 0.5).toFixed(1)} 秒，怪踩到變慢` },
  focus: { n: "集中", c: "#ff9a6a", d: (l) => `取捨：範圍 −30%、傷害 +${25 + l * 5}%` },
  volley: { n: "齊射", c: "#d8ffa0", d: (l) => `多重投射改成並排往前（比較集中）；沒串多重投射時多 2 道並排（${55 + l * 3}%）` },
  rapid: { n: "連打", c: "#ff8a8a", d: (l) => `近戰招自動再揮 2 次（每下 ${65 + l * 2}%）` },
  trigc: { n: "觸發：暴擊", c: "#c8a0ff", d: () => `只能串 E：其他招暴擊時自動放 E，不用天罰能量（每次花 ${TRIG_MP} 真氣×倍率）` },
  trigh: { n: "觸發：受傷", c: "#b090ff", d: () => `只能串 E：受傷時自動放 E，不用天罰能量（每次花 ${TRIG_MP} 真氣×倍率）` },
  totem: { n: "法壇", c: "#8fb0ff", d: (l) => `這招改成放一座法壇，${6 + l} 秒內自動朝附近的怪放（自己不用打）` },
  exec: { n: "斬殺", c: "#ff5a5a", d: (l) => `這招打到剩 ${10 + (l - 1)}% 血的怪直接死（王 ${5 + (l - 1) * 0.5}%）` },
  bell: { n: "金鐘", c: "#ffd08a", d: (l) => `近戰打中疊 1 層，每層受傷 −1%（最多 ${10 + l} 層，5 秒）` },
  spread: { n: "火勢蔓延", c: "#ff9a5a", d: (l) => `燃燒會傳到旁邊 ${36 + l * 4} 內的怪（這招要有火元素）` },
  efocus: { n: "元素集中", c: "#d0a8ff", d: (l) => `有元素的這招傷害 +${20 + l * 5}%` },
};
// 企劃 21 §8-6：每顆都有代價；真氣倍率串幾顆就相乘（省元 −15%／級）
const GEM_MP = { power: 1.1, pierce: 1.1, blood: 1.1, frost: 1.1, enlarge: 1.1, haste: 1.1, burst: 1.1, det: 1.1, seek: 1.1, trail: 1.1, rshield: 1.1, icepath: 1.1, exec: 1.1, ice: 1.1, fire: 1.1, volt: 1.1, venom: 1.1,
  split: 1.3, volley: 1.3, chain: 1.3, focus: 1.3, efocus: 1.3, bell: 1.3, spread: 1.3, bounce: 1.3, multi: 1.3, after: 1.3, lmp: 1.5, rapid: 1.5, boomer: 1.5, totem: 2, trigc: 2, trigh: 2, thrift: 1 };
const GEM_COST = { split: "這招每道傷害 −10%，分出來的 50%", volley: "這招每道傷害 −10%；同一次打到同一隻王，第 2 道起只算 50%", chain: "跳到的那隻只有 70% 傷害", lmp: "多出來的每道只有 70%；同一次打到同一隻王，第 2 道起只算 50%", rapid: "多揮的每下傷害打折", boomer: "回程只有 40% 傷害",
  focus: "範圍 −30%", efocus: "不會冰凍、燃燒、中毒，也不會觸發融化、蒸汽、毒爆", totem: "傷害 −50%", trigc: "自動放的傷害 −20%；冷卻 1 秒", trigh: "自動放的傷害 −20%；冷卻 1 秒", bounce: "每跳一次傷害 −20%", after: "第二下傷害較低",
  spread: "要跟火元素串在同一招", bell: "只有近戰招打中才疊", thrift: "沒有" };
const gemMp = (k) => GEM_MP[k] || 1.1;
const gemCostTxt = (k) => { const m = gemMp(k), t = GEM_COST[k]; return k === "thrift" ? "沒有" : `${t ? t + "；" : ""}這招真氣 ×${m}`; };
const gemDesc = (g) => { const [k, l] = g.split(":"); return `好處：${GEMS[k].d(+l)}<br>代價：${gemCostTxt(k)}`; };
const GEM_KEYS = Object.keys(GEMS);
const GEM_MAX = 5;
const SOCKETS = [3, 3, 3, 3]; // 舊的；現在孔數看轉職 sockN()（build.js）
const gemName = (g) => { const [k, l] = g.split(":"); return `輔助寶石「${GEMS[k].n}」${l} 級`; };
// 企劃 21 §8-3：寶石（符文）需要等級＋顏色（紅力量／綠敏捷／藍智力，只用來分類）
const GEM_REQ0 = { power: 1, haste: 1, thrift: 1, frost: 1, blood: 1, multi: 10, pierce: 10, enlarge: 10, rshield: 10, lmp: 20, chain: 20, burst: 20, boomer: 20, icepath: 20, bell: 20, exec: 30, spread: 30, efocus: 30, ice: 30, fire: 30, volt: 30, venom: 30, det: 30, split: 30, bounce: 30, seek: 30, after: 30, trail: 30, focus: 30, volley: 30, rapid: 30, totem: 50, trigc: 70, trigh: 70 };
const GEM_NEW = ["split", "bounce", "boomer", "seek", "enlarge", "after", "trail", "rshield", "icepath", "focus", "volley", "rapid", "trigc", "trigh", "totem", "exec", "bell", "spread", "efocus"]; // Lv.30 以後才會掉
const GEM_REQ_ADD = [0, 0, 10, 20, 35, 50];
const gemReq = (g) => { const [k, l] = g.split(":"); return (GEM_REQ0[k] || 1) + (GEM_REQ_ADD[+l] || 0); };
const gemReqOk = (g) => !save.w || ((save.w.lv || 1) >= gemReq(g) && gemAttrOk(g));
// 企劃 27 A：4、5 級寶石要該顏色的屬性 40／80（天賦樹）
const GEM_ATTR = [0, 0, 0, 0, 40, 80], GEM_ATTRK = { r: "str", g: "agi", b: "wis" };
const gemAttrNeed = (g) => { const l = +g.split(":")[1]; return GEM_ATTR[l] ? [GEM_ATTRK[GEM_COL[g.split(":")[0]] || "b"], GEM_ATTR[l]] : null; };
const gemAttrOk = (g) => { const n = gemAttrNeed(g); return !n || typeof treeAttr !== "function" || treeAttr()[n[0]] >= n[1]; };
const gemNeedTxt = (g) => { if ((save.w.lv || 1) < gemReq(g)) return `需要 Lv.${gemReq(g)}`; const n = gemAttrNeed(g); return `需要${TR_ATTR[n[0]].n} ${n[1]}（目前 ${treeAttr()[n[0]]}）`; };
const GEM_COL = { power: "r", blood: "r", burst: "r", multi: "r", enlarge: "r", after: "r", focus: "r", rapid: "r", exec: "r", bell: "r", spread: "b", efocus: "b", haste: "g", lmp: "g", pierce: "g", split: "g", bounce: "g", boomer: "g", seek: "g", volley: "g", trail: "g", frost: "b", thrift: "b", chain: "b", ice: "b", fire: "b", volt: "b", venom: "b", det: "b", rshield: "b", icepath: "b", trigc: "b", trigh: "b", totem: "b" };
const GEM_COLN = { r: ["紅", "#ff5a5a"], g: ["綠", "#5adc78"], b: ["藍", "#5a9cff"] };
const gemCol = (g) => GEM_COLN[GEM_COL[g.split(":")[0]] || "b"];
const gemSortKey = (g) => "rgb".indexOf(GEM_COL[g.split(":")[0]] || "b") + g;
const gemSort = (a, b) => (gemSortKey(a) < gemSortKey(b) ? -1 : 1);
// 輔助寶石只影響「正在放的那一招」：CUR_SL＝a 普攻／q／e／r 身法（world.js 出招、子彈打中時設定）
// 等級不夠、這招標籤不能串的不生效（chainRow／gemFits 在 tri.js）
let CUR_SL = null, CUR_DM = 1;
const TRIG_MP = 6;
function gemLv(k, sl) {
  if (arguments.length < 2) sl = CUR_SL;
  if (!sl || typeof chainRow !== "function" || !save.w) return 0;
  let n = 0; for (const g of chainRow(sl)) if (g && g.startsWith(k + ":") && gemReqOk(g) && gemFits(g, sl)) n += +g.split(":")[1];
  return n;
}
const gemCantMsg = (g) => (gemReqOk(g) ? null : `${gemName(g)}${gemNeedTxt(g)}`);
// 寶石按鈕（鏈格／背包共用）：邊框＝顏色，等級不夠紅字
const gemTag = (g) => { const c = gemCol(g); return `<i class="gcol" style="background:${c[1]}">${c[0]}</i>`; };
const gemReqTxt = (g) => (gemReqOk(g) ? "" : `<em class="greq">${gemNeedTxt(g)}</em>`);
const addGem = (g, n = 1) => { if (!save.gems) save.gems = {}; save.gems[g] = (save.gems[g] || 0) + n; };
const randGem = (lv = 1) => { const K = save.w && (save.w.lv || 1) >= 30 ? GEM_KEYS : GEM_KEYS.filter((k) => !GEM_NEW.includes(k)); return `${K[Math.floor(Math.random() * K.length)]}:${lv}`; };
// 武器元素（企劃 06／07）：看鑲的元素轉化寶石；一把武器只能一種元素
const ELE_GEM = { fire: "F", ice: "W", volt: "T", venom: "P" };
const ELE_N = { F: "火", W: "冰", T: "雷", P: "毒" }, ELE_C = { F: "#ff7a3a", W: "#9fdcff", T: "#c8b8ff", P: "#8dff6a" }, ELE_PRE = { F: "炎・", W: "霜・", T: "雷・", P: "毒・" };
function itemEle(it) { let best = null, bl = 0; for (const g of (it && it.so) || []) { if (!g) continue; const [k, l] = g.split(":"); if (ELE_GEM[k] && +l > bl) { bl = +l; best = ELE_GEM[k]; } } return best; }
const dispName = (it) => (it.slot === "sword" && ELE_PRE[itemEle(it)] || "") + it.name; // 元素字首只在畫面加，不寫進 it.name
function eleClash(w, g) { const e = ELE_GEM[g.split(":")[0]], cur = itemEle(w); return e && cur && cur !== e ? `這把武器已經是${ELE_N[cur]}元素，一把武器只能一種元素（先拆下原本的元素寶石）` : ""; }
function ungem(it) { if (it && it.so) { for (const g of it.so) if (g) addGem(g); it.so = []; } } // 賣掉、弄丟武器前先把寶石拆回袋子
const fmtAff = (k, v) => `${AFFIX[k].n} +${AFFIX[k].dec ? v.toFixed(1) : v}${AFFIX[k].pct ? "%" : ""}`;
// ───────── 魔物卡片（RO）：插在武器或道袍的符文插槽，一件一張 ─────────
const CARDS = {
  imp: { n: "小妖卡", slot: "sword", st: { sizeS: 15 } },
  wolf: { n: "狼妖卡", slot: "sword", st: { raceB: 20 } },
  treant: { n: "樹妖卡", slot: "robe", st: { hp: 120 } },
  golem: { n: "石甲妖卡", slot: "robe", st: { def: 60 } },
  bomber: { n: "爆石靈卡", slot: "sword", st: { raceR: 20 } },
  crow: { n: "火鴉卡", slot: "sword", st: { eleF: 20 } },
  lava: { n: "熔岩獸卡", slot: "sword", st: { sizeL: 25 } },
  frostwolf: { n: "霜狼卡", slot: "sword", st: { sizeM: 20 } },
  icewisp: { n: "冰靈卡", slot: "robe", st: { resW: 25 } },
  yeti: { n: "雪巨猿卡", slot: "sword", st: { eleW: 25 } },
  shield: { n: "鐵盾妖卡", slot: "robe", st: { def: 100 } },
  witch: { n: "妖巫卡", slot: "sword", st: { raceP: 20 } },
  healer: { n: "靈醫卡", slot: "robe", st: { hp: 250 } },
  rusher: { n: "疾行妖卡", slot: "sword", st: { raceR: 15 } },
  hunter: { n: "獵寶妖卡", slot: "robe", st: { drop: 25 } },
  toad: { n: "毒沼蟾卡", slot: "robe", st: { leech: 2 } },
  bonewolf: { n: "屍骨狼卡", slot: "sword", st: { aspd: 10 } },
  bogtree: { n: "腐沼樹妖卡", slot: "robe", st: { hp: 300 } },
  thawk: { n: "雷鷹卡", slot: "sword", st: { crit: 6 } },
  tgolem: { n: "雷甲巨像卡", slot: "robe", st: { def: 150 } },
  twisp: { n: "雷靈卡", slot: "robe", st: { supp: 12 } },
  crane: { n: "仙鶴妖卡", slot: "robe", st: { dodge: 10 } },
  skyfox: { n: "天狐卡", slot: "sword", st: { critD: 40 } },
  guardian: { n: "天兵石像卡", slot: "robe", st: { es: 200 } },
  jianling: { n: "劍靈卡", slot: "sword", st: { atkP: 15 } },
  wboss: { n: "焚天石魔卡", slot: "sword", st: { critL: 10, sizeL: 15 } },
  rbswamp: { n: "腐骨蟾王卡", slot: "robe", st: { resP: 20, hp: 500 } },
  rbthunder: { n: "九雷鵬王卡", slot: "sword", st: { sizeS: 25 }, d: "爆擊時 20% 連鎖電 2 隻" },
  rbsky: { n: "無相劍尊卡", slot: "robe", st: {}, d: "受到致命傷時不會倒下，改成無敵 3 秒（冷卻 90 秒）" },
};
const CARD_SLOTS = ["sword", "robe"];
const cardDesc = (c) => Object.keys(CARDS[c].st).map((k) => fmtAff(k, CARDS[c].st[k])).concat(CARDS[c].d ? [CARDS[c].d] : []).join("、");
const addCard = (c, n = 1) => { if (!save.cards) save.cards = {}; save.cards[c] = (save.cards[c] || 0) + n; };
// ───────── 精髓與通貨（PoE）：精髓＝保底詞條；天罰碎屑＝換保底裝 ─────────
const ESS_KEYS = Object.keys(AFFIX).filter((k) => AFFIX[k].t === "p" || AFFIX[k].t === "s");
const essName = (k) => `${AFF_WORD[k]}精髓`;
const addEss = (k, n = 1) => { if (!save.ess) save.ess = {}; save.ess[k] = (save.ess[k] || 0) + n; };
const randEss = () => ESS_KEYS[Math.floor(Math.random() * ESS_KEYS.length)];
// 精髓注入：白裝／藍裝直接變紫裝，保底洗出這個詞條（傳說不能用）
function essCraft(it, k) {
  if (it.u) return false;
  if (it.q < 2) { it.q = 2; it.base = SLOTS[it.slot].base === "crit" ? Math.round(it.base * 1.24 * 10) / 10 : Math.round(it.base * 1.24); }
  rollAffixes(it, 3 + Math.floor(Math.random() * 3), k);
  nameItem(it); return true;
}
const SHARD_RARE = 60, SHARD_UNIQ = 250;
// 碎屑兌換：指定部位（武器用目前武器種類），保底玄品或傳說
function shardItem(slot, q) {
  const il = Math.floor(save.w.lv / 3) + 1;
  let it;
  if (q === 3) {
    const us = Object.keys(UNIQUES).filter((u) => UNIQUES[u].slot === slot && !UNIQUES[u].rb && (slot !== "sword" || UNIQUES[u].wt === curWeapon()) && !["devour", "heart"].includes(u));
    const pick = us.length ? us : Object.keys(UNIQUES).filter((u) => UNIQUES[u].slot === slot && !UNIQUES[u].rb);
    do { it = rollItem(1, il, slot === "sword" ? curWeapon() : null); } while (false);
    const u = pick[Math.floor(Math.random() * pick.length)], bv = BASE_VAL[SLOTS[slot].base];
    it.slot = slot; it.u = u; it.q = 3; it.wt = slot === "sword" ? UNIQUES[u].wt : undefined;
    it.base = Math.round((bv[0] + bv[1] * il) * 2); rollAffixes(it, 1 + Math.floor(Math.random() * 4));
  } else {
    for (let i = 0; i < 50; i++) { it = rollItem(0, il, slot === "sword" ? curWeapon() : null); if (it.slot === slot && !it.u) break; }
    it.slot = slot; if (slot === "sword") it.wt = curWeapon(); else delete it.wt;
    const bv = BASE_VAL[SLOTS[slot].base]; it.base = Math.round((bv[0] + bv[1] * il) * 1.24);
    it.q = 2; rollAffixes(it, 4 + Math.floor(Math.random() * 3));
  }
  nameItem(it); return it;
}
const affMul = (k, il) => 1 + (AFFIX[k].sc !== undefined ? AFFIX[k].sc : 0.35) * il;
const isResAff = (k) => k.startsWith("res");
const rollAffVal = (k, il) => { const a = AFFIX[k], v = (a.lo + Math.random() * (a.hi - a.lo)) * affMul(k, il); return a.dec ? Math.round(v * 10) / 10 : Math.max(1, Math.round(v)); };
function rollAffixes(it, n, force = null) {
  const cap = AFF_CAP[it.q] || 1, cnt = { p: 0, s: 0 };
  let pool = Object.keys(AFFIX).filter((k) => (AFFIX[k].t === "p" || AFFIX[k].t === "s") && !(SLOTS[it.slot] && SLOTS[it.slot].acc && ACC_NO.includes(k)));
  it.aff = {};
  if (force && !pool.includes(force)) force = null; // 飾品不吃護甲類保底
  if (force) { it.aff[force] = Math.max(rollAffVal(force, it.il), rollAffVal(force, it.il)); cnt[AFFIX[force].t]++; pool = pool.filter((k) => k !== force); n--; } // 精髓：保底詞條（取兩次較高）
  for (let i = 0; i < n; i++) {
    const ok = pool.filter((k) => cnt[AFFIX[k].t] < cap);
    if (!ok.length) break;
    const acc = SLOTS[it.slot] && SLOTS[it.slot].acc, wt = (k) => (AFFIX[k].rw || 1) * (acc && isResAff(k) ? 2.5 : 1); // 企劃 22：飾品比較常出抗性
    let r = Math.random() * ok.reduce((s, k) => s + wt(k), 0), k = ok[ok.length - 1];
    for (const x of ok) { r -= wt(x); if (r < 0) { k = x; break; } }
    pool = pool.filter((x) => x !== k); cnt[AFFIX[k].t]++; it.aff[k] = rollAffVal(k, it.il);
  }
}
const affTier = (k, v, il) => { const a = AFFIX[k]; if (!a.hi) return ""; const f = (v / affMul(k, il) - a.lo) / (a.hi - a.lo); return f > 0.8 ? "T1" : f > 0.5 ? "T2" : "T3"; };
// 掉一件裝備；boost 越高越容易出好東西（妖將、魔王）
function rollItem(boost = 0, ilv = null, wt = null) {
  const il = ilv !== null ? ilv : realmIdx() + Math.floor(Math.random() * 2);
  const r = Math.random() * 100, w = boost ? [48, 37, 13.5, 1.5] : [72, 23, 4.7, 0.3]; // 凡／靈／玄／傳說（%）
  let q = 0, acc = 0;
  for (; q < 3; q++) { acc += w[q]; if (r < acc) break; }
  let slot = pickSlot(), u = null;
  if (q === 3) { const uk = Object.keys(UNIQUES).filter((k) => !UNIQUES[k].rb && slotOpen(UNIQUES[k].slot)); u = uk[Math.floor(Math.random() * uk.length)]; slot = UNIQUES[u].slot; }
  else if (wt) slot = "sword";
  const s = SLOTS[slot], bv = BASE_VAL[s.base];
  const it = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), slot, q, il, u,
    name: u ? UNIQUES[u].n : s.names[Math.min(4, Math.floor(il / 1.2))], base: Math.round((bv[0] + bv[1] * il) * (0.85 + Math.random() * 0.3) * (q === 3 ? 2 : 1 + q * 0.12) * 10) / 10 };
  if (s.base !== "crit") it.base = Math.round(it.base);
  if (slot === "sword") it.wt = u ? UNIQUES[u].wt : wt || WT_KEYS[Math.floor(Math.random() * WT_KEYS.length)];
  const [a0, a1] = RARITY[q].aff;
  rollAffixes(it, Math.max(s.acc ? 1 : 0, a0 + Math.floor(Math.random() * (a1 - a0 + 1)))); // 飾品沒主屬性：凡品也給 1 條
  nameItem(it);
  return it;
}
// 戰力
const itemStats = (it) => {
  const st = Object.assign({}, it.aff), m = 1 + 0.1 * (it.en || 0);
  st[SLOTS[it.slot].base] = (st[SLOTS[it.slot].base] || 0) + it.base;
  if (m > 1) for (const k in st) if (AFFIX[k]) st[k] = AFFIX[k].dec || k === "crit" ? Math.round(st[k] * m * 10) / 10 : Math.round(st[k] * m);
  if (it.card && CARDS[it.card]) for (const k in CARDS[it.card].st) st[k] = (st[k] || 0) + CARDS[it.card].st[k]; // 卡片不吃強化
  for (const k in st) if (!AFFIX[k]) delete st[k];
  return st;
};
function itemCP(it) {
  if (!it) return 0;
  const st = itemStats(it);
  let cp = 0;
  for (const k in st) cp += st[k] * (AFFIX[k] ? AFFIX[k].w : 0);
  if (it.u) cp += 250 * (1 + 0.3 * it.il);
  return Math.round(cp);
}
function totalCP() {
  const r = realmIdx();
  let cp = 600 + r * 450 + Object.keys(save.tr).reduce((s, k) => s + save.tr[k] * 90, 0) + (save.pet ? save.petLv * 70 : 0);
  for (const k of SLOT_KEYS) cp += Math.round(itemCP(save.eq[k]) * (save.eq[k] && typeof reqMul === "function" ? reqMul(save.eq[k]) : 1));
  return cp;
}
// 把身上裝備＋流派加到這一場的數值上（save.js 的 bonus() 最後呼叫）
function applyBuild(b, daily) {
  const st = {}, uq = {};
  if (!daily) for (const k of SLOT_KEYS) {
    const it = save.eq[k];
    if (!it) continue;
    const s = itemStats(it), f = typeof reqMul === "function" ? reqMul(it) : 1; // 企劃 11 第 4 節：境界不足打折
    for (const a in s) st[a] = (st[a] || 0) + s[a] * f;
    if (it.u) { uq[it.u] = true; for (const md of UNIQUES[it.u].mods || []) uq[md] = true; }
  }
  const g = (k) => st[k] || 0, sc = ""; // 不再選流派：玩法由武器決定，數值由裝備詞綴決定
  b.school = sc; b.uq = uq;
  b.maxHp = Math.round((b.maxHp + g("hp")) * (sc === "ti" ? 1.2 : sc === "fa" ? 0.8 : 1));
  b.atk *= (1 + g("atk") / 100) * (1 + g("atkP") / 100) * (sc === "fa" ? 1.35 : 1);
  b.armor = g("def"); b.dmgTaken = 1; // 護甲在 worldStats／hurtW 算（物理減傷）
  b.es = g("es"); for (const e of ["F", "W", "T"]) b["res" + e] = (g("res" + e) + g("resA") + g("res") / 2) / 100; b.resP = g("resP") / 100; // 全元素抗性不含混沌（PoE） b.dodge = g("dodge") / 100; b.supp = g("supp") / 100; b.aspd = 1 + g("aspd") / 100;
  b.vs = { S: g("sizeS"), M: g("sizeM"), L: g("sizeL"), critL: g("critL") / 100, B: g("raceB"), P: g("raceP"), R: g("raceR"), eF: g("eleF"), eW: g("eleW"), eT: g("eleT"), eP: g("eleP") }; // 屬性卡片用 e 開頭（P 已經是植物系）
  b.drop = g("drop") / 100;
  b.spdMul = 1 + g("spd") / 100;
  b.crit = 0.15 + g("crit") / 100 + (sc === "qi" ? 0.1 : 0);
  b.critDmg = 2 + g("critD") / 100 + (sc === "fa" ? 0.5 : 0);
  b.leech = g("leech") / 100 + (uq.devour ? 0.02 : 0);
  b.thorns = g("thorns") / 100 + (sc === "ti" ? 0.6 : 0);
  b.startSwords += g("swords");
  b.swordsAff = g("swords");
  b.ult *= 1 + g("ult") / 100;
  b.magnet = g("magnet") / 100;
  b.regen = sc === "dao" ? 2 : 0;
  b.potionMul = sc === "dao" ? 1.5 : 1;
  b.slow = sc === "yao" ? 0.8 : 1;
  b.ignoreDef = sc === "qi";
  b.zen = sc === "zen";
  b.runLose = sc === "ti" ? 0.7 : 1;
  b.runShield = sc === "dao" ? 1 : 0;
  b.runPierce = sc === "fa" ? 1.3 : 1;
  b.mobMul = sc === "yao" ? 0.8 : 1;
  b.gatePlus = sc === "zen" ? 3 : 0;
  b.rollCd = uq.cloud ? 0.5 : 1;
  return b;
}
const zenMul = () => (B && B.zen ? 1 + Math.floor(time / 10) * 0.05 : 1);

// 這一場撿到的裝備（結算畫面列出來）
let loot = [];
function grantLoot(it, x, y) {
  if (save.bag.length >= BAG_MAX) { // 背包滿了：自動賣掉最差的
    let worst = 0;
    save.bag.forEach((b, i) => { if (itemCP(b) < itemCP(save.bag[worst])) worst = i; });
    save.stone += sellPrice(save.bag[worst]);
    ungem(save.bag[worst]); save.bag.splice(worst, 1);
  }
  save.bag.push(it);
  loot.push(it);
  writeSave();
  if (x !== undefined) floatText(x, y - 20, `${RARITY[it.q].n}・${it.name}`, RARITY[it.q].c, it.q >= 2);
  if (it.q >= 2) sfx("arrive");
}
const sellPrice = (it) => Math.round(RARITY[it.q].sell * (1 + it.il * 0.3));
const rerollCost = (it) => Math.round(10 * (1 + it.il * 0.3));
const upCost = (it) => Math.round(30 * (1 + it.il * 0.3) * (it.q + 1));
function lootHtml() {
  if (!loot.length) return "";
  return `<div class="drop">撿到裝備：${loot.map((it) => `<b style="color:${RARITY[it.q].c}">${it.name}</b>`).join("、")}<br><small>到主畫面「裝備」換上</small></div>`;
}

// ───────── 流派選擇畫面 ─────────
function renderSchools() {
  screenEl.innerHTML = `<div class="panel wide">
    <h1 class="pick-title">選擇流派</h1>
    <p class="sub">三個模式都有效，隨時可以換</p>
    <div class="cards">${Object.keys(SCHOOLS).map((k) => {
      const s = SCHOOLS[k];
      return `<button class="card${save.school === k ? " picked" : ""}" data-k="${k}"><span class="tag">${s.tag}</span><b>${s.n}</b><span class="desc">${s.d}</span></button>`;
    }).join("")}</div>
    <div class="btns"><button id="back" class="big alt">返回</button></div>
  </div>`;
  const back = () => (inWorld ? renderAP() : renderTitle());
  screenEl.querySelectorAll(".card").forEach((b) => b.addEventListener("click", () => { save.school = b.dataset.k; writeSave(); back(); }));
  document.getElementById("back").onclick = back;
}

// ───────── 裝備畫面 ─────────
const statRows = (it) => {
  if (!it) return `<div class="srow none">（沒有裝備）</div>`;
  const st = itemStats(it);
  return Object.keys(st).map((k) => `<div class="srow"><span>${AFFIX[k].n}${k === SLOTS[it.slot].base ? "（主）" : ""}</span><b>+${AFFIX[k].dec || k === "crit" ? Math.round(st[k] * 10) / 10 : Math.round(st[k])}${AFFIX[k].pct ? "%" : ""}</b></div>`).join("")
    + (it.u ? `<div class="srow uq">${UNIQUES[it.u].d}</div>` : "");
};
const itemHead = (it) => `<div class="ihead" style="color:${RARITY[it.q].c}">${itemIcon(it)}【${RARITY[it.q].n}】${it.name}<small>${it.slot === "sword" ? `${WEAPONS[wtOf(it)].n}（${WEAPONS[wtOf(it)].job}：${WEAPONS[wtOf(it)].d}）` : SLOTS[it.slot].n}・${it.il} 級</small></div>`;
let eqSel = null; // 正在看的裝備 id（或 "eq:slot"）
function renderEquip(msg = "") {
  if (typeof tutEvent === "function") tutEvent("bag");
  if (!inWorld) state = "title";
  const bag = save.bag.slice().sort((a, b) => b.q - a.q || itemCP(b) - itemCP(a));
  const cell = (k) => {
    const it = save.eq[k];
    return `<button class="slot${eqSel === "eq:" + k ? " sel" : ""}" data-eq="${k}" style="border-color:${it ? RARITY[it.q].c : "#4a4060"}"><small>${SLOTS[k].n}</small>${it ? `${itemIcon(it)}<b style="color:${RARITY[it.q].c}">${it.name}</b><i>戰 ${itemCP(it)}</i>` : "<i>空</i>"}</button>`;
  };
  let detail = "";
  const selItem = eqSel && eqSel.startsWith("eq:") ? save.eq[eqSel.slice(3)] : save.bag.find((b) => b.id === eqSel);
  if (selItem) {
    const worn = eqSel.startsWith("eq:"), cur = save.eq[selItem.slot], diff = itemCP(selItem) - itemCP(cur);
    detail = `<div class="compare">
      ${worn ? "" : `<div class="ccol"><div class="clabel">目前裝備</div>${cur ? itemHead(cur) : ""}${statRows(cur)}</div>`}
      <div class="ccol new"><div class="clabel">${worn ? "身上裝備" : `<span class="${diff >= 0 ? "up" : "down"}">戰 ${diff >= 0 ? "+" : ""}${diff}</span>`}</div>${itemHead(selItem)}${statRows(selItem)}
        <div class="cbtns">
          ${worn ? `<button id="unequip" class="sbtn">卸下</button>` : `<button id="equip" class="sbtn gold">裝備</button><button id="sell" class="sbtn red">出售 +${sellPrice(selItem)}</button>`}
          ${!selItem.u && selItem.q > 0 ? `<button id="reroll" class="sbtn">洗練 −${rerollCost(selItem)}</button>` : ""}
          ${selItem.q < 2 ? `<button id="upq" class="sbtn">點金 −${upCost(selItem)}</button>` : ""}
          ${(selItem.en || 0) < EN_MAX ? `<button id="enh" class="sbtn gold">強化 +${(selItem.en || 0) + 1}（${Math.round(EN_RATE[selItem.en || 0] * 100)}%）−${enCost(selItem)}</button>` : `<span class="sbtn">已強化到頂</span>`}
        </div>
        <small class="hint">洗練：重新隨機詞綴　點金：品質升一級、多一條詞綴　強化：每級全部數值 +10%，失敗只扣靈石</small>
      </div></div>`;
  }
  screenEl.innerHTML = `<div class="panel wide equip">
    <h1 class="pick-title">裝備</h1>
    <div class="cpline">戰力 <b>${totalCP()}</b>　靈石 <b class="stone">${save.stone}</b>　招式 <b>${WEAPONS[curWeapon()].job}</b><small>（換武器就換招式）</small></div>
    ${msg ? `<div class="emsg">${msg}</div>` : ""}
    <div class="slots">${SLOT_KEYS.map(cell).join("")}</div>
    ${detail}
    ${gemHtml()}
    <div class="baghead">背包 ${save.bag.length} / ${BAG_MAX}</div>
    <div class="bag">${bag.length ? bag.map((it) => {
      const better = itemCP(it) > itemCP(save.eq[it.slot]);
      return `<button class="bitem${eqSel === it.id ? " sel" : ""}" data-id="${it.id}" style="border-color:${RARITY[it.q].c}"><small>${SLOTS[it.slot].n}</small>${itemIcon(it)}<b style="color:${RARITY[it.q].c}">${it.name}</b><i>戰 ${itemCP(it)}${better ? ' <span class="up">▲</span>' : ""}</i>${it.risk ? '<em class="risk">未帶回</em>' : ""}</button>`;
    }).join("") : `<p class="sub">還沒有裝備：斬妖、跑酷、渡劫都會掉</p>`}</div>
    <div class="btns">
      <button id="autoEq" class="big">一鍵換最強</button>
      <button id="sellJunk" class="big alt">賣掉凡品、靈品</button>
      <button id="back" class="big alt">${inWorld ? "回到仙界" : "返回"}</button>
    </div>
  </div>`;
  screenEl.classList.remove("hidden");
  screenEl.querySelectorAll(".bitem").forEach((b) => b.addEventListener("click", () => { eqSel = eqSel === b.dataset.id ? null : b.dataset.id; renderEquip(); }));
  screenEl.querySelectorAll(".slot").forEach((b) => b.addEventListener("click", () => { eqSel = save.eq[b.dataset.eq] ? (eqSel === "eq:" + b.dataset.eq ? null : "eq:" + b.dataset.eq) : null; renderEquip(); }));
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
  on("back", () => { eqSel = null; inWorld ? worldReturn() : renderTitle(); });
  on("equip", () => { equipItem(selItem); eqSel = null; renderEquip(`換上了 ${selItem.name}`); });
  on("unequip", () => {
    if (save.bag.length >= BAG_MAX) { renderEquip("背包滿了，先賣掉一些"); return; }
    save.bag.push(selItem); delete save.eq[selItem.slot]; eqSel = null; writeSave(); renderEquip();
  });
  on("enh", () => {
    const c = enCost(selItem);
    if (save.stone < c) { renderEquip("靈石不夠"); return; }
    save.stone -= c;
    if (Math.random() < EN_RATE[selItem.en || 0]) { selItem.en = (selItem.en || 0) + 1; nameItem(selItem); writeSave(); sfx("arrive"); renderEquip(`強化成功！${selItem.name}`); }
    else { writeSave(); sfx("hurt"); renderEquip(`強化失敗⋯⋯靈石 −${c}（裝備沒事）`); }
  });
  screenEl.querySelectorAll(".gsock").forEach((b) => b.addEventListener("click", () => { // 拆下寶石
    const w = save.eq.sword, i = +b.dataset.i, g = w.so[i];
    if (!g) return; addGem(g); w.so[i] = null; writeSave(); renderEquip(`拆下 ${gemName(g)}`);
  }));
  screenEl.querySelectorAll(".gem").forEach((b) => b.addEventListener("click", () => { // 鑲上寶石
    const w = save.eq.sword, g = b.dataset.g;
    if (!w) { renderEquip("先裝備一把武器"); return; }
    { const ec = eleClash(w, g); if (ec) { renderEquip(ec); return; } }
    { const rq = gemCantMsg(g); if (rq) { sfx("bad"); renderEquip(rq); return; } }
    w.so = w.so || []; const n = sockN();
    let i = -1; for (let j = 0; j < n; j++) if (!w.so[j]) { i = j; break; }
    if (i < 0) { renderEquip(`武器的孔都滿了（${n} 孔），點孔裡的寶石可以拆下`); return; }
    w.so[i] = g; save.gems[g]--; if (!save.gems[g]) delete save.gems[g]; writeSave(); sfx("good"); renderEquip(`鑲上 ${gemName(g)}`);
  }));
  screenEl.querySelectorAll(".gmerge").forEach((b) => b.addEventListener("click", (e) => {
    e.stopPropagation(); const g = b.dataset.g, [k, l] = g.split(":");
    if ((save.gems[g] || 0) < 3) return;
    save.gems[g] -= 3; if (!save.gems[g]) delete save.gems[g]; const ng = `${k}:${+l + 1}`; addGem(ng); writeSave(); sfx("arrive"); renderEquip(`合成出 ${gemName(ng)}！`);
  }));
  on("sell", () => { ungem(selItem); save.stone += sellPrice(selItem); save.bag = save.bag.filter((b) => b !== selItem); eqSel = null; writeSave(); renderEquip(`賣掉 ${selItem.name}，靈石 +${sellPrice(selItem)}`); });
  on("reroll", () => {
    const c = rerollCost(selItem);
    if (save.stone < c) { renderEquip("靈石不夠"); return; }
    save.stone -= c;
    const [a0, a1] = RARITY[selItem.q].aff;
    rollAffixes(selItem, Math.max(Object.keys(selItem.aff).length, a0 + Math.floor(Math.random() * (a1 - a0 + 1))));
    nameItem(selItem); writeSave(); sfx("good"); renderEquip(`洗練完成：${selItem.name}`);
  });
  on("upq", () => {
    const c = upCost(selItem);
    if (save.stone < c) { renderEquip("靈石不夠"); return; }
    save.stone -= c;
    selItem.q++;
    selItem.base = SLOTS[selItem.slot].base === "crit" ? Math.round(selItem.base * 1.12 * 10) / 10 : Math.round(selItem.base * 1.12);
    const [a0] = RARITY[selItem.q].aff;
    rollAffixes(selItem, Math.max(a0, Object.keys(selItem.aff).length + 1));
    nameItem(selItem); writeSave(); sfx("arrive"); renderEquip(`點金成功：${selItem.name}`);
  });
  on("autoEq", () => {
    let n = 0;
    for (const k of SLOT_KEYS.filter(slotOpen)) {
      const best = save.bag.filter((b) => b.slot === k && sameWt(b)).sort((a, b) => itemCP(b) - itemCP(a))[0];
      if (best && itemCP(best) > itemCP(save.eq[k])) { equipItem(best); n++; }
    }
    eqSel = null; renderEquip(n ? `換上了 ${n} 件更強的裝備` : "身上已經是最強的了");
  });
  on("sellJunk", () => {
    const junk = save.bag.filter((b) => b.q <= 1 && sameWt(b) && itemCP(b) <= itemCP(save.eq[b.slot]));
    const gain = junk.reduce((s, b) => s + sellPrice(b), 0); junk.forEach(ungem);
    save.bag = save.bag.filter((b) => !junk.includes(b)); save.stone += gain; eqSel = null; writeSave();
    renderEquip(junk.length ? `賣掉 ${junk.length} 件，靈石 +${gain}（比身上好的會留著）` : "沒有可以賣的");
  });
}
function gemHtml() {
  const w = save.eq.sword, gs = Object.keys(save.gems || {}).filter((g) => save.gems[g] > 0).sort(gemSort);
  const n = w ? sockN() : 0, so = (w && w.so) || [];
  const socks = w ? Array.from({ length: n }, (_, i) => { const g = so[i]; return g ? `<button class="gsock" data-i="${i}" style="border-color:${gemCol(g)[1]}"><b style="color:${GEMS[g.split(":")[0]].c}">${gemTag(g)} ${gemName(g)}</b>${gemReqTxt(g)}<small>${GEMS[g.split(":")[0]].d(+g.split(":")[1])}</small></button>` : `<span class="gsock empty">空孔</span>`; }).join("") : `<span class="sub">沒有武器</span>`;
  return `<div class="gems"><div class="baghead">技能寶石（武器 ${n} 孔，效果作用在全部招式上；點孔裡的寶石拆下。等級不夠的寶石不能鑲）</div>
    <div class="gsocks">${socks}</div>
    <div class="gbag">${gs.length ? gs.map((g) => { const [k, l] = g.split(":"); return `<button class="gem" data-g="${g}" style="border-color:${gemCol(g)[1]}"><b style="color:${GEMS[k].c}">${gemTag(g)} ${gemName(g)} ×${save.gems[g]}</b>${gemReqTxt(g)}<small>${GEMS[k].d(+l)}</small>${save.gems[g] >= 3 && +l < GEM_MAX ? `<span class="gmerge" data-g="${g}">3 顆合成 ${+l + 1} 級</span>` : ""}</button>`; }).join("") : `<p class="sub">還沒有寶石：精英怪、獵寶妖、任務會掉。點寶石就鑲到武器上</p>`}</div></div>`;
}
function equipItem(it) {
  if (!slotOpen(it.slot)) { sfx("bad"); if (typeof notice === "function") notice(`${SLOTS[it.slot].n}格要${slotLockTxt(it.slot)}`); return false; }
  const old = save.eq[it.slot];
  save.bag = save.bag.filter((b) => b !== it);
  if (old) save.bag.push(old);
  save.eq[it.slot] = it;
  writeSave();
  sfx("good");
  return true;
}
