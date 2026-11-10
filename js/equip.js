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
const affSlotOk = (k, it) => { const a = AFFIX[k]; if (!a || !it) return !!a; if (SLOTS[it.slot] && SLOTS[it.slot].acc && ACC_NO.includes(k)) return false; return !a.sl || a.sl.includes(it.slot === "sword" ? wtOf(it) : it.slot); }; // 企劃 67：部位限制
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
  mp: { n: "最大真氣", lo: 8, hi: 12, w: 0.8, t: "p", rw: 0.8, sl: ["crown", "robe", "charm", "ring", "ear"] }, // 企劃 67：sl＝只出現在這些部位（武器寫武器種類）
  // 後綴：速度與抗性
  spd: { n: "移動速度", lo: 2, hi: 5, w: 6, t: "s" },
  aspd: { n: "攻擊速度", lo: 2, hi: 5, w: 7, pct: true, t: "s" },
  mpr: { n: "真氣回復", lo: 2, hi: 4, w: 1.5, pct: true, t: "s", rw: 0.8, sl: ["crown", "charm", "ring", "ear", "staff", "fan"] },
  mpc: { n: "減少真氣消耗", lo: 2, hi: 3, w: 4, pct: true, t: "s", rw: 0.8, sl: ["crown", "charm", "ring", "ear"] },
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
  ult: { n: "E 招冷卻縮短", lo: 4, hi: 10, w: 3, pct: true, t: "s" },
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
const MPC_CAP = 0.3; // 企劃 67：減少真氣消耗全身最多 30%

// 詞綴名字：前綴放在名字前面、後綴放在後面（靈品一個、玄品兩個）
const AFF_WORD = { atk: "鋒銳", atkP: "霸道", hp: "厚實", es: "玄光", def: "堅石", leech: "嗜血", thorns: "荊棘", mp: "靈泉", mpr: "吐納", mpc: "凝神", spd: "迅捷", aspd: "疾刃", resF: "避火", resW: "避寒", resT: "避雷", resA: "辟邪", resP: "鎮毒", dodge: "幻影", supp: "鎮魂", crit: "致命", critD: "破軍", swords: "萬劍", ult: "雷罰", magnet: "聚靈" };
function nameItem(it) {
  const en = it.en ? ` +${it.en}` : "";
  if (it.u) { it.name = UNIQUES[it.u].n + en; return; }
  const base = it.bt ? baseName(it) : (it.slot === "sword" ? WEAPONS[wtOf(it)].names : SLOTS[it.slot].names)[Math.min(4, Math.floor(it.il / 1.2))], ks = Object.keys(it.aff);
  const pre = ks.find((k) => AFFIX[k] && AFFIX[k].t === "p"), suf = ks.find((k) => AFFIX[k] && AFFIX[k].t === "s");
  it.name = (it.q === 0 || !ks.length ? base : `${pre ? AFF_WORD[pre] : ""}${base}${suf ? `・${AFF_WORD[suf]}` : ""}`) + en;
}
const BASE_VAL = { none: [0, 0], atk: [8, 4], hp: [30, 15], def: [12, 6], spd: [4, 1], crit: [2, 0.5] }; // 舊的（v9.3 前）：[0 級, 每級]，只剩搬家用
// ───────── 企劃 44（v9.3）：裝備基底 8 階＋詞綴 T5–T1 ─────────
// 物品等級 it.lvI＝掉落的怪等級（1–130）：只決定能掉哪些基底、詞綴最高骰到哪一階。it.il 舊欄位留著算費用（賣價、精煉費）。
const ITEM_LV_MAX = 130;
const itLv = (it) => (it && it.lvI) || Math.max(1, Math.min(ITEM_LV_MAX, ((it && it.il) || 0) * 3));
const BASE_REQ = [1, 10, 20, 35, 50, 70, 90, 110]; // 第 1–8 階的需求等級
const BASE_TBL = { atk: [10, 18, 30, 50, 75, 110, 155, 210], spell: [10, 20, 30, 40, 50, 60, 70, 80], hp: [30, 55, 90, 150, 230, 340, 480, 650], def: [12, 22, 36, 60, 90, 135, 190, 260], spd: [4, 5, 6, 7, 8, 9, 10, 11], crit: [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5], none: [0, 0, 0, 0, 0, 0, 0, 0] };
const BASE_N = {
  sword: ["鐵劍", "青鋼劍", "寒鐵劍", "流雲劍", "赤霄劍", "斬月劍", "星辰劍", "太虛劍"],
  staff: ["桃木杖", "青竹杖", "青玉杖", "紫焰杖", "玄冰杖", "九幽杖", "星辰杖", "太乙杖"],
  bow: ["竹弓", "鐵胎弓", "柘木弓", "追星弓", "落日弓", "穿雲弓", "星辰弓", "射天弓"],
  blade: ["柴刀", "厚背刀", "鬼頭刀", "虎牙刀", "破山刀", "斬月刀", "星辰刀", "斷岳刀"],
  fist: ["布纏手", "鐵指虎", "銅拳套", "熊爪套", "金剛拳套", "伏魔拳套", "星辰拳套", "龍鱗拳套"],
  fan: ["竹扇", "紙扇", "羽扇", "流風扇", "青鸞扇", "鶴翎扇", "星辰扇", "乾坤扇"],
  crown: ["布冠", "木簪冠", "玉簪冠", "紫金冠", "鳳翎冠", "星辰冠", "蓮華冠", "太虛冠"],
  robe: ["粗麻袍", "青衫", "鶴紋道袍", "雲紋袍", "玄鱗甲", "紫綬仙衣", "星辰法袍", "雲錦法衣"],
  boots: ["草鞋", "布靴", "皮靴", "追風靴", "流光靴", "踏雲靴", "星辰靴", "凌虛靴"],
  charm: ["木牌", "銅符", "玉佩", "靈犀佩", "龍紋佩", "鳳血佩", "星辰佩", "太虛佩"],
  ring: ["銅戒", "鐵戒", "銀戒", "青玉戒", "紫晶戒", "赤金戒", "星辰戒", "太虛戒"],
  ear: ["木耳墜", "銅耳環", "銀耳環", "翡翠墜", "鳳羽墜", "龍珠墜", "星辰墜", "星河墜"],
};
// 詞綴不再無限長 → 同等級的玩家比 v9.2 弱（藍裝：Lv.20 ×0.74、Lv.50 ×0.69、Lv.80 ×0.61、Lv.110 ×0.58；防禦 ×0.75–0.88）。
// 怪物血量、傷害照同樣比例縮（scratchpad t.js ?cmp 量的），打王時間才會跟 v8.5.1 差不多（企劃 44 §4 ±15%）
const AFTER_DM = (l) => 0.3 + (l - 1) * 0.05; // 企劃 61 B（v9.13.1）：餘震 40%+7.5%/級 → 30%+5%/級（法杖單體 +52%）
const DODGE_CAP = 0.4, HURT_IFR = 0.25; // 企劃 62 D：被一營圍住太久才死（閃避上限 50%→40%、受傷無敵 0.45→0.25 秒）
const lerpTbl = (t, x) => { if (x <= t[0][0]) return t[0][1]; for (let i = 1; i < t.length; i++) if (x <= t[i][0]) { const [a, va] = t[i - 1], [b, vb] = t[i]; return va + ((vb - va) * (x - a)) / (b - a); } return t[t.length - 1][1]; };
const GEAR_HP_K = [[1, 1], [22, 1.02], [50, 0.75], [75, 1.03], [110, 0.86], [130, 0.86]]; // v9.3.1 企劃 44 §9 打王 bot（最高階藍武器）
const GEAR_DMG_K = [[1, 0.85], [20, 0.79], [80, 0.79], [110, 0.85], [130, 0.75]];
const SPELL_K = [[1, 1], [22, 1.05], [50, 0.88], [75, 1.17], [110, 1.12], [130, 1.12]]; // 法術基礎（技能寶石）跟攻擊武器一起縮
const gearHpK = (lv) => lerpTbl(GEAR_HP_K, lv || 1), gearDmgK = (lv) => lerpTbl(GEAR_DMG_K, lv || 1), spellK = (lv) => lerpTbl(SPELL_K, lv || 1);
const baseKey = (it) => (it.slot === "sword" && SPELL_W[wtOf(it)] ? "spell" : SLOTS[it.slot].base);
const baseName = (it) => (BASE_N[it.slot === "sword" ? wtOf(it) : it.slot] || BASE_N.sword)[(it.bt || 1) - 1];
const QMUL = [1, 1.12, 1.24, 1.3]; // 品質對基底的加成（傳說固定 1.3，不再 2 倍）
function baseVal(it) { const v = BASE_TBL[baseKey(it)][(it.bt || 1) - 1] * QMUL[it.q || 0]; return baseKey(it) === "crit" ? Math.round(v * 10) / 10 : Math.round(v); }
const setBase = (it) => { it.base = baseVal(it); return it; };
// 掉落時抽基底：需求等級 ≤ 物品等級的最高那階 50%、低一階 30%、低兩階 20%（v9.3.1 企劃 44 §9：不再掉到更低的）
function pickBt(lv) {
  let top = 0; for (let i = 0; i < 8; i++) if (BASE_REQ[i] <= lv) top = i;
  const r = Math.random(), d = r < 0.5 ? 0 : r < 0.8 ? 1 : 2;
  return Math.max(0, top - d) + 1;
}
// 詞綴分階：T5（index 0）～T1（index 4）；最低物品等級／權重
const TIER_LV = [1, 15, 30, 55, 80], TIER_W = [100, 80, 60, 35, 15];
const tierCurve = (u, c, dec) => c.map(([a, b]) => [dec ? Math.round(a * u * 10) / 10 : Math.round(a * u), dec ? Math.round(b * u * 10) / 10 : Math.round(b * u)]);
const CURVE_P = [[1, 1.8], [1.9, 3], [3.1, 4.8], [4.9, 6.8], [6.9, 9]]; // 百分比類（攻擊％：5–9…35–45）
const CURVE_F = [[1, 2], [2.1, 4], [4.1, 7.3], [7.4, 12], [12.1, 17.3]]; // 固定值類（生命：15–30…181–260）
const AFF_T = {
  atk: tierCurve(5, CURVE_F), atkP: tierCurve(5, CURVE_P), hp: tierCurve(15, CURVE_F), es: tierCurve(13, CURVE_F), def: tierCurve(8, CURVE_F),
  leech: [[0.5, 0.8], [0.9, 1.4], [1.5, 2.1], [2.2, 2.9], [3, 4]], thorns: tierCurve(5, CURVE_P),
  spd: tierCurve(2, CURVE_P), aspd: [[3, 5], [6, 8], [9, 11], [12, 14], [15, 17]],
  resF: [[6, 10], [11, 16], [17, 25], [26, 35], [36, 45]], resW: [[6, 10], [11, 16], [17, 25], [26, 35], [36, 45]], resT: [[6, 10], [11, 16], [17, 25], [26, 35], [36, 45]],
  resA: [[3, 5], [6, 8], [9, 11], [12, 14], [15, 16]], resP: [[4, 7], [8, 12], [13, 17], [18, 23], [24, 28]],
  dodge: [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]], supp: [[2, 4], [5, 7], [8, 10], [11, 13], [14, 16]],
  mp: [[8, 12], [15, 22], [25, 34], [38, 50], [55, 70]], mpr: [[2, 4], [5, 6], [7, 9], [10, 11], [12, 15]], mpc: [[2, 3], [4, 4], [5, 6], [7, 7], [8, 9]], // 企劃 67
  crit: [[2, 4], [5, 7], [8, 10], [11, 13], [14, 16]], critD: tierCurve(8, CURVE_P), ult: tierCurve(4, CURVE_P), magnet: tierCurve(10, CURVE_P),
};
for (const k in AFF_T) { const t = AFF_T[k], st = AFFIX[k].dec ? 0.1 : 1; for (let i = 1; i < 5; i++) if (t[i][0] <= t[i - 1][1]) { t[i][0] = Math.round((t[i - 1][1] + st) * 10) / 10; if (t[i][1] < t[i][0]) t[i][1] = t[i][0]; } } // 各階不重疊（四捨五入後）
const tierTop = (lv) => { let t = 0; for (let i = 0; i < 5; i++) if (TIER_LV[i] <= lv) t = i; return t; }; // 這個物品等級最高能到的階（index）
function pickTier(lv, top) { const n = tierTop(lv); if (top) return n; let r = Math.random() * TIER_W.slice(0, n + 1).reduce((a, b) => a + b, 0); for (let i = 0; i <= n; i++) if ((r -= TIER_W[i]) < 0) return i; return n; }
const tierName = (i) => `T${5 - i}`;
const tierNote = (it) => { if (it.u) return "傳說：數值固定"; const t = tierTop(itLv(it)); return `詞綴最高 ${tierName(t)}${t < 4 ? `（${TIER_LV.slice(t + 1).map((l, i) => `物品等級 ${l} 開 ${tierName(t + 1 + i)}`).join("、")}）` : ""}`; }; // 企劃 50 C
// 這條詞綴的值落在哪一階（顯示用、搬家用）；超過 T1（渡劫）算 T1
function affTierIdx(k, v) { const t = AFF_T[k]; if (!t) return -1; let r = 0; for (let i = 0; i < 5; i++) if (v >= t[i][0] - 1e-9) r = i; return r; }
const RARITY = [
  { n: "凡品", c: "#ecebf2", aff: [0, 0], sell: 2 }, // 白
  { n: "靈品", c: "#5fa8ff", aff: [1, 2], sell: 6 }, // 藍
  { n: "玄品", c: "#b77dff", aff: [3, 6], sell: 15 }, // 紫
  { n: "傳說", c: "#ff8a3d", aff: [1, 4], sell: 40 }, // 橘：2 倍基礎＋1～4 詞條
];
// 傳說裝：固定名字＋特殊效果
const UNIQUES = {
  thunder: { slot: "sword", wt: "sword", n: "九霄引雷劍", d: "爆擊時引下天雷；E 變成「九霄天雷」：一次劈附近 6 隻；四轉後起源覺醒變成「起源・九霄天雷」" },
  phoenix: { slot: "sword", wt: "staff", n: "朱雀焚天杖", d: "E 變成「朱雀環」：身邊炸出一圈穿透火焰；四轉後起源覺醒變成「起源・朱雀環」" },
  sunbow: { slot: "sword", wt: "bow", n: "落日神弓", d: "E 變成「箭雨」：目標一帶落下 12 支箭；四轉後起源覺醒變成「起源・箭雨」" },
  moon: { slot: "sword", wt: "blade", n: "斬月狂刀", d: "E 變成「月輪」：一大圈刀氣，傷害極高；四轉後起源覺醒變成「起源・月輪」" },
  tiger: { slot: "sword", wt: "fist", n: "伏虎拳套", d: "E 變成「百裂拳」：對眼前的敵人瞬間打 10 拳；四轉後起源覺醒變成「起源・百裂拳」" },
  qiankun: { slot: "sword", wt: "fan", n: "乾坤奪魄扇", d: "E 變成「乾坤吸」：把附近的妖獸全吸過來再震飛；四轉後起源覺醒變成「起源・乾坤吸」" },
  qkhy: { slot: "sword", wt: "sword", n: "太古·乾坤化元劍", mods: ["split", "bounce", "voidQ"], d: "改寫招式：飛出去的劍擊中時分裂成 3 把副劍，副劍會在怪群之間彈跳 2 次；Q 劍陣變成「引力黑洞」" },
  splitbox: { slot: "charm", n: "分光劍匣", mods: ["split"], d: "改寫招式：所有飛出去的招式，擊中第一隻妖獸時分裂成 3 道" },
  starcrown: { slot: "crown", n: "連星折光冠", mods: ["bounce"], d: "改寫招式：所有飛出去的招式，擊中後會彈跳到旁邊的妖獸，最多 2 次" },
  voidrobe: { slot: "robe", n: "歸墟道袍", mods: ["voidQ"], d: "改寫招式：Q 招變成「歸墟黑洞」，把附近妖獸吸進去、持續傷害，最後爆開" },
  orbitboots: { slot: "boots", n: "御劍步雲靴", mods: ["orbit"], d: "改寫招式：普攻每 3 下召喚一把環身飛劍（最多 6 把，8 秒），繞身砍殺" },
  wavecleaver: { slot: "sword", wt: "blade", n: "斬浪玄鐵劍", mods: ["wave"], d: "改寫招式：每一下重斬都放出一道穿透刀浪" },
  vajra: { slot: "crown", n: "不壞金冠", d: "生命低於 30% 時，受到的傷害減半" },
  devour: { slot: "robe", n: "萬妖噬魂袍", d: "吸血 +2%；每殺 30 隻妖，8 秒內傷害 +3%（最多 5 層）" },
  cloud: { slot: "boots", n: "踏雲靴", d: "閃身冷卻減半" },
  heart: { slot: "charm", n: "劍心玉佩", d: "劍的 Q（劍氣斬、萬劍、回旋劍）多 2 道劍" },
  toadrobe: { slot: "robe", n: "萬毒蟾衣", mods: ["psnHit", "psnConv"], rb: true, d: "王專屬：攻擊有 20% 讓妖獸中毒 3 層；法杖、扇和元素轉化的傷害全部變成可疊 5 層的毒；站在毒池裡不扣血，反而回真氣；混沌抗性上限 +3%" },
  hourglass: { slot: "ring", n: "時之沙漏", mods: ["lbDouble"], d: "每次切換武器（1／2／3），下一招段數翻倍" },
  bloodjade: { slot: "ear", n: "血玉佩", mods: ["vamp"], d: "吸血 +3%，每斬一隻妖回 1% 生命" },
  tstep: { slot: "boots", n: "踏雷靴", mods: ["tstep"], rb: true, d: "王專屬（九雷鵬王）：閃身結束時在落點劈下落雷（攻擊 ×3）；閃身冷卻 −20%；閃電抗性上限 +3%" },
  fentian: { slot: "charm", n: "焚天石心", rb: true, anySlot: true, d: "王專屬（焚天石魔，部位隨機）：火焰抗性上限 +3%" },
  wuxiang: { slot: "sword", wt: "sword", n: "無相劍", mods: ["echo"], rb: true, d: "王專屬（無相劍尊）：普攻打中時 25% 劍影再砍一次（60% 傷害）" },
  // 企劃 57：每種武器至少 3 把（都是改打法的）
  hanxu: { slot: "sword", wt: "staff", n: "寒髓玄冰杖", d: "法球打中冰凍的怪會碎冰：炸出 6 片冰刃（各 30% 傷害，20% 再冰凍一次）" },
  xingyun: { slot: "sword", wt: "staff", n: "星隕天樞杖", d: "Q 火雨／流星群／天隕多落 2 顆（各 15% 傷害）；Q 冷卻 +30%；真氣回復上限 +3%" },
  zhuifeng: { slot: "sword", wt: "bow", n: "追風逐影弓", d: "閃身後 1 秒內，普攻必定爆擊" },
  jiuyao: { slot: "sword", wt: "bow", n: "九曜連珠弓", d: "每第 9 支箭變成穿透大箭（傷害 ×2.5）" },
  xiuluo: { slot: "sword", wt: "blade", n: "修羅血飲刀", d: "旋風斬／颶風每打中一隻回 0.3% 生命（每秒最多 4%）；轉的時候傷害更多 40%、受到的傷害 −15%" },
  liuxing: { slot: "sword", wt: "fist", n: "流星鐵臂", d: "散打用：勢最多 7 層；終結技之後自動補一記側踹（×3）" },
  zhenyue: { slot: "sword", wt: "fist", n: "震岳碎山拳", d: "衝拳類的 Q 停下時地裂（範圍 45、Q 傷害 20%）；普攻每 3 拳震地一小圈" },
  liuyun: { slot: "sword", wt: "fan", n: "流雲百花扇", d: "普攻多 1 道風刃（25% 傷害）；風刃回程打中每隻回 0.2% 真氣" },
  taixu: { slot: "sword", wt: "fan", n: "太虛幻月扇", rb: true, tjOnly: true, d: "王專屬（天劫王、天劫秘境之主 8%）：旋風跟著你走，最多同時 3 個" },
};
// 企劃 44 §2-4：傳說完全寫死——固定基底（第 bt 階）＋固定詞綴（小範圍）；物品等級只決定精煉上限
const UQ_FIX = {
  thunder: { bt: 5, aff: { crit: [8, 10], critD: [30, 36] } },
  phoenix: { bt: 5, aff: { atkP: [20, 25], ult: [15, 20] } },
  sunbow: { bt: 5, aff: { aspd: [8, 10], crit: [6, 8] } },
  moon: { bt: 5, aff: { atkP: [22, 26], hp: [80, 110] } },
  tiger: { bt: 5, aff: { aspd: [9, 11], leech: [1.2, 1.6] } },
  qiankun: { bt: 5, aff: { atkP: [18, 22], magnet: [40, 50] } },
  qkhy: { bt: 8, aff: { atkP: [32, 38], crit: [10, 12] } },
  splitbox: { bt: 4, aff: { atkP: [12, 16], aspd: [5, 7] } },
  starcrown: { bt: 4, aff: { es: [60, 80], resA: [6, 8] } },
  voidrobe: { bt: 5, aff: { es: [90, 120], resA: [8, 10] } },
  orbitboots: { bt: 4, aff: { aspd: [6, 8], dodge: [3, 4] } },
  wavecleaver: { bt: 6, aff: { atkP: [25, 30], critD: [20, 25] } },
  vajra: { bt: 6, aff: { hp: [150, 180], def: [70, 90] } },
  devour: { bt: 2, aff: { leech: [0.8, 1] } },
  cloud: { bt: 3, aff: { dodge: [4, 5] } },
  heart: { bt: 2, aff: { critD: [10, 14] } },
  toadrobe: { bt: 5, aff: { resP: [18, 22], hp: [100, 130] } },
  hourglass: { bt: 6, aff: { aspd: [8, 10], atkP: [15, 18] } },
  bloodjade: { bt: 7, aff: { hp: [120, 150], leech: [1.5, 2] } },
  tstep: { bt: 6, aff: { resT: [20, 25], spd: [10, 12] } },
  fentian: { bt: 3, aff: { resF: [15, 20], hp: [50, 70] } },
  wuxiang: { bt: 8, aff: { atkP: [30, 35], aspd: [10, 12] } },
  hanxu: { bt: 4, aff: { atkP: [16, 20], resA: [6, 8] } },
  xingyun: { bt: 7, aff: { atkP: [24, 28], ult: [15, 20], mpr: [14, 18] } }, // 企劃 67：另外真氣回復上限 +3%（mp.js）
  zhuifeng: { bt: 4, aff: { aspd: [7, 9], crit: [6, 8] } },
  jiuyao: { bt: 7, aff: { aspd: [9, 11], crit: [8, 10] } },
  xiuluo: { bt: 7, aff: { hp: [110, 140], leech: [1.2, 1.6] } },
  liuxing: { bt: 4, aff: { aspd: [8, 10], atkP: [14, 18] } },
  zhenyue: { bt: 7, aff: { aspd: [10, 12], atkP: [24, 28] } },
  liuyun: { bt: 4, aff: { atkP: [14, 18], magnet: [30, 40] } },
  taixu: { bt: 8, aff: { atkP: [30, 35], magnet: [50, 60] } },
};
function uqApply(it) { // 設定傳說的固定基底＋詞綴（it.slot、it.u 要先設好）
  const F = UQ_FIX[it.u] || { bt: 1, aff: {} };
  it.q = 3; it.bt = F.bt; setBase(it); it.aff = {};
  for (const k in F.aff) { const [lo, hi] = F.aff[k], v = lo + Math.random() * (hi - lo); it.aff[k] = AFFIX[k].dec ? Math.round(v * 10) / 10 : Math.round(v); }
  it.resV2 = 1; return it;
}
const enMax = (it) => (it && it.u ? (itLv(it) < 40 ? 6 : itLv(it) < 80 ? 9 : 12) : EN_MAX); // 傳說：物品等級 <40 最多 +6、<80 +9、≥80 +12
const BAG_MAX = 30; // 企劃 53：40 → 30（只算裝備；多的放營地倉庫 stash.js）
// ───────── 強化（+1～+10，每級全部數值 +10%，越高越容易失敗，失敗只扣靈石）─────────
const EN_MAX = 12;
const EN_RATE = [1, 1, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.12];
const enCost = (it) => Math.round(12 * ((it.en || 0) + 1) * (1 + it.il * 0.3));
// ───────── 輔助寶石（企劃 21 第二版：串在技能鏈上，只影響那一招；3 顆同級合成高一級，最高 5 級）─────────
const GEMS = {
  multi: { n: "連發", c: "#ffb347", d: (l) => `這招 ${25 + l * 10}% 機率再放一次（只能串法術：法杖、扇）` },
  power: { n: "巨力", c: "#ff6b6b", d: (l) => `這招傷害 +${l * 10}%` },
  haste: { n: "疾風", c: "#7dffb0", d: (l) => `這招冷卻 −${l * 7}%` },
  thrift: { n: "省元", c: "#6fb8ff", d: (l) => `這招真氣倍率 −${l * 15}%` },
  frost: { n: "寒霜", c: "#bfefff", d: (l) => `打中時 ${15 + l * 10}% 機率讓妖獸變慢` },
  chain: { n: "連鎖", c: "#e0d0ff", d: (l) => `打中時 ${8 + l * 5}% 機率引雷打旁邊另一隻` },
  burst: { n: "爆裂", c: "#ff8a3d", d: (l) => `這招斬殺的妖獸會炸開，傷害周圍（威力 ${l} 級）` },
  pierce: { n: "穿透", c: "#d8d2e0", d: (l) => `穿過所有怪，傷害 +${l * 5}%` },
  blood: { n: "嗜血", c: "#c0304a", d: (l) => `吸血 +${(l * 0.5).toFixed(1)}%` },
  lmp: { n: "多重投射", c: "#ffe9a0", d: (l) => `多 ${l >= 3 ? 4 : 2} 道（每道 ${l >= 3 ? 30 : 45}%）` },
  ice: { n: "元素轉化：冰", c: "#9fdcff", d: (l) => `打中會減速、${Math.round(10 * (1 + l * 0.6))}% 冰凍（冰凍的怪不能動）。一招只能一種元素` },
  fire: { n: "元素轉化：火", c: "#ff7a3a", d: (l) => `打中會燃燒；打到冰凍的怪「融化」傷害 ×2.5（${l} 級）。一招只能一種元素：用冰的招凍住，再用火的招打` },
  volt: { n: "元素轉化：雷", c: "#c8b8ff", d: (l) => `打中 ${20 + l * 4}% 雷電跳到旁邊 ${l >= 3 ? 2 : 1} 隻（25% 傷害）；打中毒的怪「毒爆」` },
  venom: { n: "元素轉化：毒", c: "#8dff6a", d: (l) => `打中疊 1 層毒（最多 5 層，持續傷害，${l} 級）；用雷打中毒的怪會「毒爆」` },
  det: { n: "引爆", c: "#ffb347", d: (l) => `打中燃燒中的怪 ${12 + l * 5}% 機率炸開` },
  // 第二版新的 15 顆
  split: { n: "分裂", c: "#a8ffd0", d: (l) => `打中後分成 ${l >= 3 ? 3 : 2} 道小的往旁邊飛（分出來的不會再分裂）` },
  bounce: { n: "彈射", c: "#9fe8ff", d: (l) => `打中後跳到下一隻 ${l >= 5 ? 3 : l >= 3 ? 2 : 1} 次（每跳 −20%），撞牆也會折射` },
  boomer: { n: "迴旋", c: "#c8f0e0", d: () => `飛到底再飛回來，回程也能打` },
  seek: { n: "追蹤", c: "#ffe0a0", d: (l) => `飛行中慢慢轉向最近的怪（${l} 級轉得更快）` },
  enlarge: { n: "擴大", c: "#ffb070", d: (l) => `範圍 +${[0, 15, 21, 27, 34, 40][l]}%` },
  after: { n: "餘震", c: "#e0b080", d: (l) => `0.5 秒後同一個地方再炸一次（${Math.round(AFTER_DM(l) * 100)}%）` },
  trail: { n: "殘影", c: "#bfe6ff", d: (l) => `位移的路上留下 ${3 + l} 道會傷害的殘影` },
  rshield: { n: "護盾", c: "#9fdcff", d: (l) => `位移後 ${(1.5 + l * 0.25).toFixed(2).replace(/0$/, "")} 秒內擋下一次傷害` },
  icepath: { n: "冰徑", c: "#bfefff", d: (l) => `位移的路上結冰 ${(1.5 + l * 0.5).toFixed(1)} 秒，怪踩到變慢` },
  focus: { n: "集中", c: "#ff9a6a", d: (l) => `取捨：範圍 −30%、傷害 +${25 + l * 5}%` },
  volley: { n: "齊射", c: "#d8ffa0", d: (l) => `多重投射改成並排往前（比較集中）；沒串多重投射時多 2 道並排（${40 + l * 3}%）` },
  rapid: { n: "連打", c: "#ff8a8a", d: (l) => `近戰攻擊招自動再揮 2 次（每下 ${65 + l * 2}%）` },
  trigc: { n: "觸發：暴擊", c: "#c8a0ff", d: () => `只能串 E：其他招暴擊時自動放 E，不吃 E 的冷卻（每次花 ${TRIG_MP} 真氣×倍率）` },
  trigh: { n: "觸發：受傷", c: "#b090ff", d: () => `只能串 E：受傷時自動放 E，不吃 E 的冷卻（每次花 ${TRIG_MP} 真氣×倍率）` },
  totem: { n: "法壇", c: "#8fb0ff", d: (l) => `這招改成放一座法壇，${6 + l} 秒內自動朝附近的怪放（自己不用打）` },
  exec: { n: "斬殺", c: "#ff5a5a", d: (l) => `這招打到剩 ${8 + (l - 1)}% 血的怪直接死（王 ${3 + (l - 1) * 0.5}%、天劫王再減半）` },
  bell: { n: "金鐘", c: "#ffd08a", d: (l) => `近戰打中疊 1 層，每層受傷 −1%（最多 ${10 + l} 層，5 秒）` },
  spread: { n: "火勢蔓延", c: "#ff9a5a", d: (l) => `燃燒會傳到旁邊 ${36 + l * 4} 內的怪（這招要有火元素）` },
  efocus: { n: "元素集中", c: "#d0a8ff", d: (l) => `有元素的這招傷害 +${20 + l * 5}%` },
};
// 企劃 21 §8-6：每顆都有代價；真氣倍率串幾顆就相乘（省元 −15%／級）
const GEM_MP = { power: 1.2, pierce: 1.2, blood: 1.2, frost: 1.2, enlarge: 1.2, haste: 1.2, burst: 1.2, det: 1.2, seek: 1.2, trail: 1.2, rshield: 1.2, icepath: 1.2, exec: 1.3, ice: 1.2, fire: 1.2, volt: 1.2, venom: 1.2,
  split: 1.3, volley: 1.3, chain: 1.3, focus: 1.3, efocus: 1.3, bell: 1.3, spread: 1.3, bounce: 1.3, multi: 1.3, after: 1.3, lmp: 1.5, rapid: 1.5, boomer: 1.5, totem: 2.3, trigc: 2.3, trigh: 2.3, thrift: 1 };
const GEM_COST = { exec: "整個角色只能串一顆（每種輔助寶石都一樣）", split: "這招每道傷害 −10%，分出來的 50%", volley: "這招每道傷害 −10%；同一次打到同一隻怪，第 2 道起只算 50%", chain: "跳到的那隻只有 70% 傷害", lmp: "同一次打到同一隻怪，第 2 道起只算 50%", rapid: "多揮的每下傷害打折", boomer: "回程只有 40% 傷害",
  focus: "範圍 −30%", efocus: "不會冰凍、燃燒、中毒，也不會觸發融化、蒸汽、毒爆", totem: "傷害 −50%", trigc: "自動放的傷害 −20%；冷卻 1 秒", trigh: "自動放的傷害 −20%；冷卻 1 秒", bounce: "每跳一次傷害 −20%", after: "第二下傷害較低",
  spread: "要跟火元素串在同一招", bell: "只有近戰招打中才疊", thrift: "沒有" };
const gemMp = (k) => GEM_MP[k] || 1.2;
const gemCostTxt = (k) => { const m = gemMp(k), t = GEM_COST[k]; return k === "thrift" ? "沒有" : `${t ? t + "；" : ""}這招真氣 ×${m}`; };
const gemDesc = (g) => { const [k, l] = g.split(":"); return `好處：${GEMS[k].d(+l)}<br>代價：${gemCostTxt(k)}`; };
const GEM_KEYS = Object.keys(GEMS);
const GEM_MAX = 5;
const SOCKETS = [3, 3, 3, 3]; // 舊的；現在孔數看轉職 sockN()（build.js）
const gemFullN = (k) => GEMS[k].n; // 企劃 21 §12：使用者改主意，名字照舊；類型改在說明小字寫「輔助寶石」
const GEM_TYPE = "輔助寶石"; // 之後的技能寶石（企劃 37）寫「技能寶石」
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
function ungem(it) { if (it && it.so) { for (const g of it.so) if (g) addGem(g); it.so = []; } if (it && it.card) { save.cards = save.cards || {}; save.cards[it.card] = (save.cards[it.card] || 0) + 1; delete it.card; } } // 卡片也一起退回（26 §9） // 賣掉、弄丟武器前先把寶石拆回袋子
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
  icewisp: { n: "冰靈卡", slot: "robe", st: { resW: 25, mp: 30 } },
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
  if (it.q < 2) { it.q = 2; if (it.bt) setBase(it); else it.base = SLOTS[it.slot].base === "crit" ? Math.round(it.base * 1.24 * 10) / 10 : Math.round(it.base * 1.24); }
  rollAffixes(it, 3 + Math.floor(Math.random() * 3), k);
  nameItem(it); return true;
}
const SHARD_RARE = 60, SHARD_UNIQ = 250;
// 碎屑兌換：指定部位（武器用目前武器種類），保底玄品或傳說
function shardItem(slot, q) {
  const il = Math.floor(save.w.lv / 3) + 1;
  let it;
  if (q === 3) {
    const us = Object.keys(UNIQUES).filter((u) => UNIQUES[u].slot === slot && !UNIQUES[u].rb && (slot !== "sword" || UNIQUES[u].wt === curWeapon()));
    const pick = us.length ? us : Object.keys(UNIQUES).filter((u) => UNIQUES[u].slot === slot && !UNIQUES[u].rb);
    const okLv = pick.filter((u) => BASE_REQ[((UQ_FIX[u] || {}).bt || 1) - 1] <= save.w.lv); if (okLv.length) pick.splice(0, pick.length, ...okLv);
    do { it = rollItem(1, il, slot === "sword" ? curWeapon() : null); } while (false);
    const u = pick[Math.floor(Math.random() * pick.length)];
    it.slot = slot; it.u = u; it.q = 3; it.wt = slot === "sword" ? UNIQUES[u].wt : undefined;
    uqApply(it);
  } else {
    for (let i = 0; i < 50; i++) { it = rollItem(0, il, slot === "sword" ? curWeapon() : null); if (it.slot === slot && !it.u) break; }
    it.slot = slot; if (slot === "sword") it.wt = curWeapon(); else delete it.wt;
    it.q = 2; setBase(it); rollAffixes(it, 4 + Math.floor(Math.random() * 3));
  }
  nameItem(it); return it;
}
const affMul = (k, il) => 1 + (AFFIX[k].sc !== undefined ? AFFIX[k].sc : 0.35) * il;
const isResAff = (k) => k.startsWith("res");
// 企劃 22 §11：抗性詞綴固定分級（不再隨物品等級一直乘）。[單抗, 全抗, 混沌] 各 [lo, hi]
const RES_TIER = [[[5, 12], [3, 6], [3, 8]], [[12, 22], [6, 9], [8, 14]], [[20, 32], [9, 12], [13, 20]], [[30, 45], [12, 16], [18, 28]]];
const resTierIdx = (il) => Math.max(0, Math.min(3, Math.floor((il || 0) / 10)));
const resRange = (k, il) => { const t = RES_TIER[resTierIdx(il)]; return k === "resA" ? t[1] : k === "resP" ? t[2] : t[0]; };
const isTierRes = (k) => ["resF", "resW", "resT", "resA", "resP"].includes(k);
// 企劃 44：lv＝新物品等級（itLv(it)）；top＝直接用這個等級最高的那一階（部位鍛造的保底）
const rollAffVal = (k, lv, top) => { const a = AFFIX[k], t = AFF_T[k]; if (!t) return a.lo || 1; const [lo, hi] = t[pickTier(lv, top)], v = lo + Math.random() * (hi - lo); return a.dec ? Math.round(v * 10) / 10 : Math.max(1, Math.round(v)); };
function rollAffixes(it, n, force = null, forceTop = false) {
  const cap = AFF_CAP[it.q] || 1, cnt = { p: 0, s: 0 };
  let pool = Object.keys(AFFIX).filter((k) => (AFFIX[k].t === "p" || AFFIX[k].t === "s") && affSlotOk(k, it));
  it.aff = {};
  if (force && !pool.includes(force)) force = null; // 飾品不吃護甲類保底
  const lv = itLv(it);
  if (force) { it.aff[force] = forceTop ? rollAffVal(force, lv, true) : Math.max(rollAffVal(force, lv), rollAffVal(force, lv)); cnt[AFFIX[force].t]++; pool = pool.filter((k) => k !== force); n--; } // 精髓：保底詞條（取兩次較高）
  for (let i = 0; i < n; i++) {
    const ok = pool.filter((k) => cnt[AFFIX[k].t] < cap);
    if (!ok.length) break;
    const acc = SLOTS[it.slot] && SLOTS[it.slot].acc, wt = (k) => (AFFIX[k].rw || 1) * (acc && isResAff(k) ? 2.5 : 1); // 企劃 22：飾品比較常出抗性
    let r = Math.random() * ok.reduce((s, k) => s + wt(k), 0), k = ok[ok.length - 1];
    for (const x of ok) { r -= wt(x); if (r < 0) { k = x; break; } }
    pool = pool.filter((x) => x !== k); cnt[AFFIX[k].t]++; it.aff[k] = rollAffVal(k, lv);
  }
}
const affTier = (k, v) => { const i = affTierIdx(k, v); return i < 0 ? "" : tierName(i); };
// 掉一件裝備；boost 越高越容易出好東西（妖將、魔王）
function rollItem(boost = 0, ilv = null, wt = null) {
  const il = ilv !== null ? ilv : realmIdx() + Math.floor(Math.random() * 2);
  const r = Math.random() * 100, w = boost ? [48, 37, 13.5, 1.5] : [72, 23, 4.7, 0.3]; // 凡／靈／玄／傳說（%）
  let q = 0, acc = 0;
  for (; q < 3; q++) { acc += w[q]; if (r < acc) break; }
  let slot = pickSlot(), u = null;
  if (q === 3) { const lv0 = Math.max(1, il * 3), uk0 = Object.keys(UNIQUES).filter((k) => !UNIQUES[k].rb && slotOpen(UNIQUES[k].slot)), uk1 = uk0.filter((k) => BASE_REQ[((UQ_FIX[k] || {}).bt || 1) - 1] <= lv0), uk = uk1.length ? uk1 : uk0; u = uk[Math.floor(Math.random() * uk.length)]; slot = UNIQUES[u].slot; } // 企劃 44：傳說也照需求等級，物品等級不夠的不掉
  else if (wt) slot = "sword";
  const s = SLOTS[slot], lvI = Math.max(1, Math.min(ITEM_LV_MAX, il * 3)); // 物品等級＝怪等級（呼叫的地方傳的是舊 il＝怪等級÷3）
  const it = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), slot, q, il, lvI, u, bt: pickBt(lvI), name: u ? UNIQUES[u].n : "" };
  if (slot === "sword") it.wt = u ? UNIQUES[u].wt : wt || WT_KEYS[Math.floor(Math.random() * WT_KEYS.length)];
  if (u) uqApply(it);
  else {
    setBase(it);
    const [a0, a1] = RARITY[q].aff;
    rollAffixes(it, Math.max(s.acc ? 1 : 0, a0 + Math.floor(Math.random() * (a1 - a0 + 1)))); // 飾品沒主屬性：凡品也給 1 條
  }
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
  if (it.u) cp += 250 * (1 + 0.1 * BASE_REQ[(it.bt || 1) - 1]);
  return Math.round(cp);
}
function totalCP() {
  const r = realmIdx();
  let cp = 600 + r * 450 + Object.keys(save.tr).reduce((s, k) => s + save.tr[k] * 90, 0) + (save.pet ? save.petLv * 70 : 0);
  for (const k of SLOT_KEYS) cp += Math.round(itemCP(save.eq[k]) * (save.eq[k] && typeof reqMul === "function" ? reqMul(save.eq[k]) : 1));
  return cp;
}
// 把身上裝備＋流派加到這一場的數值上（save.js 的 bonus() 最後呼叫）
// 企劃 41：攻擊 ＝ 基礎 ×（1＋所有「增加」加總）× 所有「更多」相乘。各來源只改 b.inc／b.more，cap.js 最後算一次 b.atk
const SPELL_W = { staff: 1, fan: 1 }; // 法術武器（world.js 的 SPELL_WT 同一張）
const atkFin = (b) => { b.atk = (b.atk0 || 1) * (1 + (b.inc || 0)) * (b.more || 1); return b; };
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
  // 企劃 41 第二版 §2-3：武器底材＝基礎傷害（攻擊招）；法杖、扇的底材改成「增加法術傷害％」；其他「攻擊 +N」詞綴＝附加傷害（乘招式的傷害效用）
  const wit = save.eq.sword, wb = !daily && wit ? wit.base * (1 + 0.1 * (wit.en || 0)) * (typeof reqMul === "function" ? reqMul(wit) : 1) : 0, spellW = !!(wit && SPELL_W[wtOf(wit)]);
  b.wBase = spellW ? 0 : wb; b.spellInc = spellW ? wb / 100 : 0; b.flatAtk = Math.max(0, g("atk") - wb);
  b.atk0 = b.atk; b.inc = (b.inc || 0) + (g("atkP") + (spellW ? wb : 0)) / 100; b.more = b.more || 1; atkFin(b); // 企劃 41：裝備攻擊％是「增加」
  b.armor = g("def"); b.dmgTaken = 1; // 護甲在 worldStats／hurtW 算（物理減傷）
  b.es = g("es"); for (const e of ["F", "W", "T"]) b["res" + e] = (g("res" + e) + g("resA") + g("res") / 2) / 100; b.resP = g("resP") / 100; // 全元素抗性不含混沌（PoE） b.dodge = g("dodge") / 100; b.supp = g("supp") / 100; b.aspd = 1 + g("aspd") / 100;
  b.vs = { S: g("sizeS"), M: g("sizeM"), L: g("sizeL"), critL: g("critL") / 100, B: g("raceB"), P: g("raceP"), R: g("raceR"), eF: g("eleF"), eW: g("eleW"), eT: g("eleT"), eP: g("eleP") }; // 屬性卡片用 e 開頭（P 已經是植物系）
  b.drop = g("drop") / 100;
  b.gMp = g("mp"); b.gMpr = g("mpr") / 100; b.mpCut = Math.min(MPC_CAP, g("mpc") / 100); // 企劃 67：worldStats 重算真氣之後才套（mp.js）
  b.resCapE = { F: uq.fentian ? 0.03 : 0, W: 0, T: uq.tstep ? 0.03 : 0, P: uq.toadrobe ? 0.03 : 0 }; // 企劃 22 §11：最大抗性只在這 3 件傳說
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
const itemHead = (it) => `<div class="ihead" style="color:${RARITY[it.q].c}">${itemIcon(it)}【${RARITY[it.q].n}】${it.name}<small>${it.slot === "sword" ? `${WEAPONS[wtOf(it)].n}（${WEAPONS[wtOf(it)].job}：${WEAPONS[wtOf(it)].d}）` : SLOTS[it.slot].n}・物品等級 ${itLv(it)}</small></div>`;
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
          ${(selItem.en || 0) < enMax(selItem) ? `<button id="enh" class="sbtn gold">強化 +${(selItem.en || 0) + 1}（${Math.round(EN_RATE[selItem.en || 0] * 100)}%）−${enCost(selItem)}</button>` : `<span class="sbtn">已強化到頂</span>`}
        </div>
        <small class="hint">洗練：重新隨機詞綴　點金：品質升一級、多一條詞綴　強化：每級全部數值 +10%，失敗只扣靈石</small>
      </div></div>`;
  }
  screenEl.innerHTML = `<div class="panel wide equip">
    <h1 class="pick-title">裝備</h1>
    <div class="cpline">戰力 <b>${cpTxt()}</b>　靈石 <b class="stone">${save.stone}</b>　招式 <b>${WEAPONS[curWeapon()].job}</b><small>（換武器就換招式）</small></div>
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
    if (selItem.bt) setBase(selItem); else selItem.base = SLOTS[selItem.slot].base === "crit" ? Math.round(selItem.base * 1.12 * 10) / 10 : Math.round(selItem.base * 1.12);
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
