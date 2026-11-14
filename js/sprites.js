// 萬劍仙途 — 使用者畫的圖示（總表第 21 項，企劃 29–33）：img/ic_*.png 圖集，由 素材/萬劍仙途素材 切出來
// ico(cat, key) 回 HTML（沒有圖回 ""）；icoDraw(ctx, cat, key, x, y, w, h) 畫在 canvas（還沒載好回 false）
"use strict";
const ICO_VER = "9.38";
const ICO = {"gem":{"w":64,"h":64,"cols":8,"k":"multi power blood burst enlarge after focus rapid exec bell haste lmp pierce split bounce boomer seek volley trail frost thrift chain ice fire volt venom det rshield icepath trigc trigh totem spread efocus"},"mat":{"w":64,"h":64,"cols":8,"k":"hide horn wood resin grit soulcore lavac firesoul icem wolffang venomsac bonejade tfeather tcore silk jsoul b_volcano b_swamp b_thunder b_sky herb ore crystal gold chaos regret exalt vaal divine mirror tjseal shard ess sup_meteor sup_swordrain sup_thunder pot fireres iceres psnres thres atkup dropup expup recall"},"tree":{"w":64,"h":64,"cols":8,"k":"atk crit cdmg aspd life armor dodge es mp leech res loot supp kuang jianyi guzhu panshi wuxin huixin tiandao shayi s0 s1 s2 s3 s4 s5 xuemo jianxin xueji tianren duomo fire fire2 ice ice2 thun thun2 psn psn2 swd bow stf bld fst fan t_a t_p t_m t_d t_v t_s still regen qi yuangui budong tiegu xunlei hundun jw1 jw2 jw3 jw4 xinghe guiyuan wanxiang"},"ui":{"w":64,"h":64,"cols":8,"k":"tide tree smith rift more card quest book rank altar set"},"card":{"w":72,"h":96,"cols":8,"k":"imp wolf treant golem bomber crow lava frostwolf icewisp yeti shield witch healer rusher hunter toad bonewolf bogtree thawk tgolem twisp crane skyfox guardian jianling wboss rbswamp rbthunder rbsky"},"skill":{"w":64,"h":64,"cols":8,"k":"sword:a: sword:q: sword:e: sword:a:dance sword:a:ray sword:a:break sword:q:wan sword:q:boom sword:q:rush sword:e:storm sword:e:nova sword:e:judg staff:a: staff:q: staff:e: staff:a:split staff:a:frost staff:a:burst staff:q:shower staff:q:doom staff:q:wall staff:e:blizz staff:e:chainl staff:e:inferno bow:a: bow:q: bow:e: bow:a:tri3 bow:a:home bow:a:snipe bow:q:rain bow:q:refr bow:q:swal bow:e:barr bow:e:seekr bow:e:star blade:a: blade:q: blade:e: blade:a:sweep blade:a:quake blade:a:crack blade:q:gale blade:q:whirl blade:q:leap blade:e:cyclone blade:e:rift blade:e:exec fist:a: fist:q: fist:e: fist:a:lean fist:a:inch fist:a:qi fist:q:chain fist:q:tiger fist:q:roar fist:e:hund fist:e:dragon fist:e:gong fan:a: fan:q: fan:e: fan:a:twin fan:a:gust fan:a:spring fan:q:suck fan:q:storm fan:q:ward fan:e:typh fan:e:bloom fan:e:zephyr r: r:ghost r:surge r:wave r:blink r:pull r:guard blade:e:blades blade:e:roar blade:e:titan blade:e:tthrow bow:e:blast bow:e:trap bow:e:turret fan:e:crane fan:e:petal fan:e:stealth fan:e:wwall fist:a:sanshou fist:e:dragf fist:e:gbell fist:e:grab fist:e:thous fist:q:throw staff:e:curse staff:e:hole staff:e:tslow staff:e:tstorm sword:e:array sword:e:cold sword:e:domain"}};
const ICO_I = {}, ICO_IMG = {};
for (const c in ICO) {
  const M = ICO[c]; M.k = M.k.split(" "); M.rows = Math.ceil(M.k.length / M.cols); ICO_I[c] = {};
  M.k.forEach((k, i) => (ICO_I[c][k] = i));
  const im = new Image(); im.src = `img/ic_${c}.png?v=${ICO_VER}`; ICO_IMG[c] = im;
}
const icoHas = (c, k) => !!(ICO_I[c] && k != null && k in ICO_I[c]);
function icoPos(c, k) { const M = ICO[c], i = ICO_I[c][k]; return [i % M.cols, Math.floor(i / M.cols)]; }
function ico(c, k, cls = "") {
  if (!icoHas(c, k)) return "";
  const M = ICO[c], [x, y] = icoPos(c, k);
  return `<i class="ico ico-${c}${cls ? " " + cls : ""}" style="background-image:url(img/ic_${c}.png?v=${ICO_VER});background-size:${M.cols * 100}% ${M.rows * 100}%;background-position:${M.cols > 1 ? (x / (M.cols - 1)) * 100 : 0}% ${M.rows > 1 ? (y / (M.rows - 1)) * 100 : 0}%"></i>`;
}
function icoDraw(g, c, k, x, y, w, h) {
  const im = ICO_IMG[c]; if (!icoHas(c, k) || !im || !im.complete || !im.naturalWidth) return false;
  const M = ICO[c], [cx, cy] = icoPos(c, k);
  g.drawImage(im, cx * M.w, cy * M.h, M.w, M.h, x, y, w, h); return true;
}
// 道具 key（行囊用的 "gem:power:3"、"mat:hide"、"cur:gold"）→ 圖示
function propIco(k, cls) {
  const [t, a] = String(k).split(":");
  if (t === "gem") return ico("gem", a, cls);
  if (t === "cur" && a === "tide") return ico("ui", "tide", cls);
  if (t === "mat" || t === "cur") return ico("mat", a, cls);
  if (t === "card") return ico("card", a, cls);
  // v7.6 企劃 34 補缺：丹藥、碎屑、精髓、超技能
  if (t === "pot" || t === "shard") return ico("mat", t, cls);
  if (t === "ess") return ico("mat", "ess", cls);
  if (t === "sup") return ico("mat", "sup_" + a, cls);
  if (t === "jw" && typeof jwById === "function") { const j = jwById(+a || a); return j ? ico("tree", jwIk(j), cls) : ""; }
  if (t === "cur" && a === "tide") return ico("ui", "tide", cls);
  return "";
}
const propG = (p) => { const i = propIco(p.k); if (!i) return `<b>${p.g}</b>`; const l = /^gem:/.test(p.k) ? p.k.split(":")[2] : ""; return i + (l ? `<em class="glv">${l}</em>` : ""); };
const gemIco = (g, cls) => ico("gem", String(g).split(":")[0], cls);
// 技能：wt＝武器、l＝a／q／e／r、k＝改招代碼（""＝原本的招式）
const skIco = (wt, l, k, cls) => ico("skill", l === "r" ? "r:" + (k || "") : `${wt}:${l}:${k || ""}`, cls);
ICO_IMG.tree.addEventListener("load", () => { try { if (typeof trDraw === "function" && document.querySelector("#ov canvas")) trDraw(); } catch (e) {} });
// 世界裡的小圖（掉在地上的寶石、卡片、素材）：開平滑縮小，比較不會糊成雜點
function icoDrawS(g, c, k, x, y, w, h) { const sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = true; const r = icoDraw(g, c, k, x, y, w, h); g.imageSmoothingEnabled = sm; return r; }

const jwIk = (j) => (j.u ? j.u : "jw" + Math.min(4, j.q || 1)); // 天賦玉圖示

// ───────── 企劃 素材運用 階段一／二：裝備圖示圖集 img/ic_eq.png（武俠像素圖 CC0，64px、8 欄）─────────
// 一般裝備「部位或武器:基底階」、傳說「u:部位:F|I|G」（火／冰雷／其他）、丹藥「pot:hp|mp|guard|pure」、門派令牌 d_*／s_*。
// 延後載入：進世界 3 秒後或第一次要畫裝備圖示時才載；沒載好／載失敗就照舊用 16px 小圖（iconURL）。
const EQ_KEYS = "sword:1 sword:2 sword:3 sword:4 sword:5 sword:6 sword:7 sword:8 staff:1 staff:2 staff:3 staff:4 staff:5 staff:6 staff:7 staff:8 bow:1 bow:2 bow:3 bow:4 bow:5 bow:6 bow:7 bow:8 blade:1 blade:2 blade:3 blade:4 blade:5 blade:6 blade:7 blade:8 fan:1 fan:2 fan:3 fan:4 fan:5 fan:6 fan:7 fan:8 fist:1 fist:2 fist:3 fist:4 fist:5 fist:6 fist:7 fist:8 crown:1 crown:2 crown:3 crown:4 crown:5 crown:6 crown:7 crown:8 robe:1 robe:2 robe:3 robe:4 robe:5 robe:6 robe:7 robe:8 charm:1 charm:2 charm:3 charm:4 charm:5 charm:6 charm:7 charm:8 ring:1 ring:2 ring:3 ring:4 ring:5 ring:6 ring:7 ring:8 ear:1 ear:2 ear:3 ear:4 ear:5 ear:6 ear:7 ear:8 u:sword:F u:sword:I u:sword:G u:staff:F u:staff:I u:staff:G u:bow:F u:bow:I u:bow:G u:blade:F u:blade:I u:blade:G u:fan:F u:fan:I u:fan:G u:fist:F u:fist:I u:fist:G u:crown:F u:crown:I u:crown:G u:robe:F u:robe:I u:robe:G u:charm:F u:charm:I u:charm:G u:ring:F u:ring:I u:ring:G u:ear:F u:ear:I u:ear:G pot:hp pot:mp pot:guard pot:pure _p125 _p126 _p127 d_sword d_magic d_heal d_shadow s_tieyi s_xuedao s_yujian s_wuxing s_tianji s_xuanjia s_yaowang s_wudu s_jingang s_xueyi s_tang s_xiaoyao".split(" ");
const EQ_I = {}; EQ_KEYS.forEach((k, i) => (EQ_I[k] = i));
let ICO_EQ_SRC = `img/ic_eq.png?v=${ICO_VER}`; // 測試可以改成不存在的檔名看退回舊圖
let EQ_IMG = null, EQ_OK = false; const EQ_URL = {};
function eqLoad() {
  if (EQ_IMG) return; EQ_IMG = new Image();
  EQ_IMG.onload = () => { EQ_OK = !!EQ_IMG.naturalWidth; };
  EQ_IMG.onerror = () => { EQ_OK = false; };
  EQ_IMG.src = ICO_EQ_SRC;
}
// 圖集裡那一格 → dataURL（快取）；沒載好回 ""
function eqURL(k) {
  if (!EQ_IMG) eqLoad();
  if (!EQ_OK || !(k in EQ_I)) return "";
  if (EQ_URL[k]) return EQ_URL[k];
  try {
    const c = document.createElement("canvas"); c.width = c.height = 64; const i = EQ_I[k];
    c.getContext("2d").drawImage(EQ_IMG, (i % 8) * 64, Math.floor(i / 8) * 64, 64, 64, 0, 0, 64, 64);
    return (EQ_URL[k] = c.toDataURL());
  } catch (e) { EQ_OK = false; return ""; }
}
// 傳說用哪一種材質：火系熔岩鐵、冰雷系寒霜鋼、其他金
const EQ_UQ_E = { phoenix: "F", sunbow: "F", fentian: "F", xingyun: "F", xiuluo: "F", moon: "F", thunder: "I", hanxu: "I", tstep: "I", jiuyao: "I", starcrown: "I", wuxiang: "I", taixu: "I" };
function eqKey(it) {
  if (!it || !it.slot || it.slot === "boots") return ""; // 靴子素材包沒有，維持舊圖
  const s = it.slot === "sword" ? (typeof wtOf === "function" ? wtOf(it) : it.wt || "sword") : it.slot;
  if (it.u) return `u:${s}:${EQ_UQ_E[it.u] || "G"}`;
  const bt = Math.max(1, Math.min(8, +it.bt || 1)); // 沒有 bt 的舊裝備當第 1 階
  return `${s}:${bt}`;
}
// 掉在地上的裝備／丹藥：畫圖集那一格（world.js 掉落物迴圈呼叫）。畫了回 true；圖集沒載好、靴子、不認得的回 false → 照舊畫小方塊。
function dropIcon(o) {
  const pot = o.kind === "potion", k = pot ? "pot:hp" : o.kind === "item" ? eqKey(o.it) : "";
  if (!k || !EQ_OK || !(k in EQ_I)) { if (k && !EQ_IMG) eqLoad(); return false; }
  const n = pot ? 10 : 14, low = typeof A11 !== "undefined" && A11.low, bob = low ? 0 : Math.sin(time * 3 + o.x) * 1, i = EQ_I[k];
  ctx.fillStyle = "rgba(0,0,0,0.38)"; ctx.beginPath(); ctx.ellipse(o.x, o.y + 3, n * 0.36 - bob * 0.3, 1.6, 0, 0, Math.PI * 2); ctx.fill();
  const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
  try { ctx.drawImage(EQ_IMG, (i % 8) * 64, Math.floor(i / 8) * 64, 64, 64, o.x - n / 2, o.y + 3 - n - bob, n, n); } catch (e) { ctx.imageSmoothingEnabled = sm; return false; }
  ctx.imageSmoothingEnabled = sm; return true;
}
const potIco = (k, cls = "") => { const u = eqURL("pot:" + k); return u ? `<img class="eqi${cls ? " " + cls : ""}" src="${u}" alt="">` : ""; };
