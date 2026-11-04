// 御劍渡劫（pixel-raid）— 數據層：數值管理（境界、法寶、靈獸加成）與存檔（localStorage）
"use strict";

// ───────── 存檔：境界、法寶、靈獸、每日紀錄（存在瀏覽器 localStorage）─────────
const SAVE_KEY = "pixelraid_save_v1";
const REALMS = [
  { n: "練氣", need: 0 }, { n: "築基", need: 300 }, { n: "金丹", need: 900 },
  { n: "元嬰", need: 2000 }, { n: "化神", need: 4000 }, { n: "渡劫", need: 7000 },
];
const TREASURES = {
  box: { n: "青鋒劍匣", d: "開場飛劍 +8" },
  wind: { n: "疾風符", d: "飛劍齊射快 8%" },
  shell: { n: "玄龜甲", d: "生命 +15" },
  pearl: { n: "聚靈珠", d: "天罰能量 +15%" },
  furnace: { n: "回春丹爐", d: "丹藥 +1", max: 3 },
};
const PETS = {
  fox: { n: "赤焰狐", d: "每 3 秒吐火球打魔王" },
  crane: { n: "白羽鶴", d: "每 5 秒幫你回血" },
};
const PET_MAX = 5;
const blankSave = () => ({ xiuwei: 0, tr: {}, pet: null, petLv: 0, daily: {} });
function loadSave() {
  try { return Object.assign(blankSave(), JSON.parse(localStorage.getItem(SAVE_KEY) || "{}")); } catch { return blankSave(); }
}
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* 無痕模式存不了就算了 */ } }
let save = loadSave();
const realmIdx = (xw = save.xiuwei) => REALMS.reduce((i, r, j) => (xw >= r.need ? j : i), 0);
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
let mode = "normal"; // normal：一般修行（吃境界、法寶加成）／ daily：每日渡劫（大家同一張地圖、同樣起點）
let B = null; // 這一場的加成
function bonus() {
  const daily = mode === "daily", r = daily ? 0 : realmIdx(), lv = (k) => (daily ? 0 : save.tr[k] || 0);
  return {
    realm: r, startSwords: 5 + r * 5 + lv("box") * 8, maxHp: 120 + r * 20 + lv("shell") * 15, atk: 1 + 0.15 * r,
    vol: 2.2 * Math.pow(0.92, lv("wind")), ult: 1 + 0.15 * lv("pearl"), potions: 3 + lv("furnace"),
    bossHp: Math.round(1600 * (1 + 0.35 * r)), bossDmg: 1 + 0.12 * r, pet: daily ? null : save.pet, petLv: save.petLv,
  };
}
// 可以指定種子的亂數（每日渡劫用日期當種子，大家的門和妖群都一樣）
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
let rng = Math.random;
const R = (a, b) => a + rng() * (b - a);

const SKILLS = {
  attack: { cd: 0.32 },
  spin: { cd: 6 },
  roll: { cd: 1.1 },
  potion: { cd: 1 },
};
const ULT_MAX = 100;
