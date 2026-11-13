// 萬劍仙途 — 使用者畫的圖示（總表第 21 項，企劃 29–33）：img/ic_*.png 圖集，由 素材/萬劍仙途素材 切出來
// ico(cat, key) 回 HTML（沒有圖回 ""）；icoDraw(ctx, cat, key, x, y, w, h) 畫在 canvas（還沒載好回 false）
"use strict";
const ICO_VER = "9.34";
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
