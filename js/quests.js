// 萬劍仙途 — 任務視窗：按地區分頁（章節），左邊任務列表、右邊說明（點左上任務欄、按 Y、或右上「任」打開）
const Q_CH = ["grass", "forest", "waste", "volcano", "snow", "swamp", "thunder", "sky"];
// 每個主線任務屬於哪一章：看地區欄位，沒有就跟上一個任務同一章
const questCh = (() => { let last = "grass"; return QUESTS.map((q) => { const z = q.z || q.id || (q.k === "boss" ? "volcano" : null); if (z && Q_CH.includes(z)) last = z; return last; }); })();
let qTab = null, qSel = null;
const qReward = (q) => {
  const w = save.w, r = [`靈石 ${10 + w.lv * 2}`];
  if (q.item !== undefined) r.push(q.wt ? `新武器：${WEAPONS[q.wt].n}` : q.item >= 2 ? "玄品以上裝備" : q.item >= 1 ? "靈品以上裝備" : "裝備");
  return r.join("、");
};
const qWhere = (q, ch) => { const z = ZONES[ch]; return q.k === "boss" ? "焚天火山北邊祭壇" : `${z.n}（妖獸 Lv.${z.lv[0]}–${z.lv[1]}）`; };
const qHow = (q) => ({ kill: "在該地區斬殺妖獸，精英也算", wp: "走到傳送陣附近就會點亮", lv: "斬妖、做任務升級；升級拿能力點和技能點", elite: "精英怪名字是藍色、比較大隻", boss: "火山祭壇召喚世界王打倒它" }[q.k] || "");
function renderQuests() {
  const w = save.w, cur = w.q || 0, done = cur >= QUESTS.length;
  const curCh = done ? "sky" : questCh[cur];
  if (!qTab) qTab = curCh;
  const reached = (ch) => questCh.some((c, i) => c === ch && i <= cur);
  const idx = QUESTS.map((_, i) => i).filter((i) => questCh[i] === qTab);
  if (qSel === null || questCh[qSel] !== qTab) qSel = idx.includes(cur) ? cur : idx[0];
  const sel = QUESTS[qSel], st = (i) => (i < cur ? "done" : i === cur ? "now" : "lock");
  let list = idx.map((i) => `<button class="qrow ${st(i)}${i === qSel ? " sel" : ""}" data-qi="${i}"><i>${i < cur ? "✓" : i === cur ? "▶" : "・"}</i>${i > cur ? "？？？" : QUESTS[i].t}</button>`).join("");
  let right;
  if (qTab === "boss") right = "";
  else if (qSel > cur) right = `<div class="qdet"><h3>？？？</h3><p class="sub">完成前面的任務才會出現</p></div>`;
  else {
    const prog = qSel === cur ? Math.min(questProg(), sel.n) : sel.n;
    right = `<div class="qdet"><h3>${sel.t}</h3>
      <div class="qtag ${st(qSel)}">${qSel < cur ? "已完成" : "進行中"}</div>
      <div class="sr"><span>地點</span><b>${qWhere(sel, questCh[qSel])}</b></div>
      <div class="sr"><span>進度</span><b>${prog} / ${sel.n}</b></div>
      <div class="sr"><span>獎勵</span><b>${qReward(sel)}、經驗</b></div>
      <p class="sub">${qHow(sel)}</p>
      ${qSel === cur ? `<button id="qMap" class="sbtn">在星盤上看地點</button>` : ""}</div>`;
  }
  if (qTab === "boss") { // 區域王分頁：冷卻、首殺
    list = RB_KEYS.map((k) => { const R = RBOSS[k], cd = rbCool(k), kd = rbKilled(k);
      return `<div class="qdet" style="margin-bottom:8px"><h3>${kd ? "✓ " : ""}${R.n}　Lv.${R.lv}</h3>
        <div class="qtag ${cd > 0 ? "lock" : "now"}">${cd > 0 ? `沉睡中 ${Math.ceil(cd)} 秒` : "可以挑戰"}</div>
        <div class="sr"><span>地點</span><b>${R.where}</b></div>
        <div class="sr"><span>建議</span><b>Lv.${R.rec} 以上${kd ? `（已擊敗 ${(save.w.rbK || {})[k] || 1} 次）` : "（還沒擊敗過）"}</b></div>
        <div class="sr"><span>掉落</span><b>${R.loot}</b></div></div>`; }).join("");
    right = `<div class="qdet"><h3>區域王</h3><p class="sub">每區最深處有一座祭壇，走過去按「挑戰」。王的等級、掉落固定，不看你的等級。<br>打倒後要等王重新醒來（冷卻）才能再打。<br>星盤上的祭壇圖示：亮的＝可以打、灰的＝沉睡中。</p></div>`;
  }
  const bq = done || (typeof curQuest === "function" && curQuest() && !curQuest().main) ? curQuest() : null;
  screenEl.innerHTML = `<div class="panel wide equip qwin"><div class="winhead">任務</div>
    <div class="btabs">${Q_CH.map((c) => `<button class="btab${c === qTab ? " on" : ""}" data-qt="${c}" ${reached(c) ? "" : "disabled"}>${reached(c) ? ZONES[c].n : "🔒"}</button>`).join("")}<button class="btab${qTab === "boss" ? " on" : ""}" data-qt="boss">王</button></div>
    <div class="qcols"><div class="qlist">${list}</div>${right}</div>
    ${bq ? `<div class="qbounty"><b>懸賞</b>${bq.t}（${Math.min(questProg(), bq.n)} / ${bq.n}）<small>主線做完後，會一直在適合你等級的地區發懸賞</small></div>` : ""}
    <div class="btns"><button id="close" class="big">離開</button></div></div>`;
  screenEl.classList.remove("hidden");
  screenEl.querySelectorAll("[data-qt]").forEach((b) => b.addEventListener("click", () => { sfx("click"); qTab = b.dataset.qt; qSel = null; renderQuests(); }));
  screenEl.querySelectorAll("[data-qi]").forEach((b) => b.addEventListener("click", () => { sfx("click"); qSel = +b.dataset.qi; renderQuests(); }));
  const qm = document.getElementById("qMap"); if (qm) qm.onclick = () => { worldReturn(); setTimeout(() => openStarMap(), 0); };
  document.getElementById("close").onclick = () => { qTab = null; worldReturn(); };
}
