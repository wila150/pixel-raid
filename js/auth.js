// 御劍渡劫（pixel-raid）— 登入／註冊（Firebase Auth）＋雲端存檔（Firestore users/{uid}）
// 帳號名稱會轉成 帳號@pixelraid.game 給 Firebase 用（玩家不用填 email）
"use strict";

let fbUser = null, fbDb = null, cloudT = null, authReady = false, loggingOut = false;
const AUTH_ON = typeof FIREBASE_CONFIG !== "undefined" && FIREBASE_CONFIG && typeof firebase !== "undefined";
const nameToEmail = (n) => `${encodeURIComponent(n.trim().toLowerCase()).replace(/%/g, "_")}@pixelraid.game`;

function cloudSave() { // writeSave 之後呼叫：10 秒內合併成一次上傳
  if (!fbUser || cloudT) return;
  cloudT = setTimeout(cloudFlush, 10000);
}
// 1.0 企劃第 2 項：上傳失敗（或 15 秒沒回應＝斷線）右上顯示「還沒存到雲端」，每 30 秒重試，成功就消失
let cloudSeq = 0, cloudRetryT = null;
function cloudWarn(on) {
  let el = document.getElementById("cloudWarn");
  if (on && !el) { el = document.createElement("div"); el.id = "cloudWarn"; el.innerHTML = `<b>☁!</b> 還沒存到雲端`; el.title = "連上網路後會自動重試"; el.onclick = () => cloudFlush(); document.body.appendChild(el); }
  if (!on && el) el.remove();
  clearTimeout(cloudRetryT); cloudRetryT = on ? setTimeout(() => { if (fbUser) cloudFlush(); }, 30000) : null;
}
function cloudFlush() {
  clearTimeout(cloudT); cloudT = null;
  if (!fbUser || !fbDb) return;
  if (save.w || (save.chars && save.chars.some(Boolean))) save.uid = fbUser.uid;
  const my = ++cloudSeq, slow = setTimeout(() => { if (my === cloudSeq) cloudWarn(true); }, 15000);
  fbDb.collection("users").doc(fbUser.uid).set({ name: fbUser.displayName || "", save: JSON.stringify(save), updated: Date.now() })
    .then(() => { clearTimeout(slow); if (my === cloudSeq) cloudWarn(false); })
    .catch(() => { clearTimeout(slow); if (my === cloudSeq) cloudWarn(true); });
}
document.addEventListener("visibilitychange", () => { if (document.hidden) cloudFlush(); });

const AUTH_ERR = {
  "auth/invalid-credential": "帳號或密碼錯了", "auth/wrong-password": "帳號或密碼錯了", "auth/user-not-found": "沒有這個帳號，要先註冊",
  "auth/email-already-in-use": "這個帳號名稱有人用了", "auth/weak-password": "密碼至少要 6 個字", "auth/too-many-requests": "試太多次了，等一下再試",
  "auth/network-request-failed": "網路連不上",
};
function renderLogin(msg = "") {
  state = "title"; pad.classList.add("hidden");
  screenEl.innerHTML = `<div class="panel login">
    <h1>萬劍<br>仙途</h1>
    <p class="sub">PIXEL RAID · 原型 v1.3</p>
    <form id="lf">
      <input id="lu" placeholder="帳號名稱" autocomplete="username" maxlength="20">
      <input id="lp" type="password" placeholder="密碼（至少 6 個字）" autocomplete="current-password" maxlength="40">
      ${msg ? `<div class="emsg err">${msg}</div>` : ""}
      <div class="btns"><button id="loginBtn" class="big" type="submit">登入</button><button id="regBtn" class="big alt" type="button">註冊</button></div>
    </form>
    <p class="keys">註冊後換手機、換電腦登入都能接著玩</p>
  </div>`;
  screenEl.classList.remove("hidden");
  const get = () => [document.getElementById("lu").value, document.getElementById("lp").value];
  const busy = (t) => { screenEl.querySelectorAll("button").forEach((b) => (b.disabled = true)); document.getElementById("loginBtn").textContent = t; };
  document.getElementById("lf").onsubmit = (e) => {
    e.preventDefault();
    const [u, p] = get();
    if (!u.trim() || !p) { renderLogin("請輸入帳號和密碼"); return; }
    busy("登入中…");
    firebase.auth().signInWithEmailAndPassword(nameToEmail(u), p).catch((er) => renderLogin(AUTH_ERR[er.code] || "登入失敗：" + er.code));
  };
  document.getElementById("regBtn").onclick = () => {
    const [u, p] = get();
    if (u.trim().length < 2) { renderLogin("帳號名稱至少 2 個字"); return; }
    if (p.length < 6) { renderLogin("密碼至少要 6 個字"); return; }
    busy("註冊中…");
    firebase.auth().createUserWithEmailAndPassword(nameToEmail(u), p)
      .then((c) => c.user.updateProfile({ displayName: u.trim() }))
      .catch((er) => renderLogin(AUTH_ERR[er.code] || "註冊失敗：" + er.code));
  };
}
function renderLoading(t) {
  screenEl.innerHTML = `<div class="panel"><h1>萬劍<br>仙途</h1><p class="sub">${t}</p></div>`;
  screenEl.classList.remove("hidden");
}
// 登入後：讀雲端存檔（新帳號就把這台裝置原本的進度帶上去），然後直接進仙界
async function onLogin(user) {
  fbUser = user;
  renderLoading("讀取存檔中…");
  try {
    const doc = await fbDb.collection("users").doc(user.uid).get();
    if (doc.exists && doc.data().save) {
      const cloud = Object.assign(blankSave(), JSON.parse(doc.data().save));
      if (!cloud.ts) cloud.ts = doc.data().updated || 0;
      const pick = await savePick(save, cloud, user.uid);
      if (pick === "cloud") { saveBackup(save, "這台"); save = cloud; } else saveBackup(cloud, "雲端");
    }
    save.uid = user.uid; writeSave(); cloudFlush();
  } catch (e) { renderLogin("讀不到雲端存檔：" + (e.code || e.message)); return; }
  W0 = null; // 換帳號要重新生成怪物
  enterWorld();
}
// ───────── 1.0 企劃第 2 項：登入時比較本機和雲端存檔 ─────────
const SAVE_BAK = "pixelraid_save_bak";
const saveHas = (s) => !!(s && ((s.w && s.w.created) || (s.chars && s.chars.some((c) => c && c.w && c.w.created))));
const saveLv = (s) => Math.max((s && s.w && s.w.lv) || 0, ...((s && s.chars) || []).map((c) => (c && c.w && c.w.lv) || 0));
const agoTxt = (t) => { if (!t) return "時間不明"; const m = Math.max(0, Math.round((Date.now() - t) / 60000)); return m < 1 ? "剛剛" : m < 60 ? `${m} 分鐘前` : m < 1440 ? `${Math.round(m / 60)} 小時前` : `${Math.round(m / 1440)} 天前`; };
// 回傳 "cloud" 或 "local"
function savePick(local, cloud, uid) {
  if (!saveHas(local)) return Promise.resolve("cloud");
  if (local.uid && local.uid !== uid) return Promise.resolve("cloud"); // 這台是別的帳號留下的：用雲端，本機那份進備份
  const lt = local.ts || 0, ct = cloud.ts || 0;
  if (!saveHas(cloud)) return Promise.resolve("local");
  if (ct >= lt) return Promise.resolve("cloud");
  const far = saveLv(local) !== saveLv(cloud) || lt - ct > 5 * 60000;
  if (!far) return Promise.resolve("local"); // 本機比較新、差不多：用本機並馬上上傳
  return new Promise((res) => {
    screenEl.innerHTML = `<div class="panel spick"><h2>選一份存檔</h2><p class="sub">這台裝置和雲端的進度不一樣，選要用哪一份（另一份會留一份備份，可以在設定裡還原一次）</p>
      <div class="btns"><button class="big" data-p="local">這台<small>Lv.${saveLv(local)}・${agoTxt(lt)}</small></button><button class="big alt" data-p="cloud">雲端<small>Lv.${saveLv(cloud)}・${agoTxt(ct)}</small></button></div></div>`;
    screenEl.classList.remove("hidden");
    screenEl.querySelectorAll("[data-p]").forEach((b) => b.onclick = () => { screenEl.querySelectorAll("[data-p]").forEach((x) => (x.disabled = true)); res(b.dataset.p); });
  });
}
function saveBackup(s, from) { // 被換掉的那份存成備份
  if (!saveHas(s)) return;
  try { localStorage.setItem(SAVE_BAK, JSON.stringify({ t: s.ts || 0, lv: saveLv(s), from, uid: s.uid || null, data: JSON.stringify(s) })); } catch (e) { /* 存不了就算了 */ }
}
function saveBakInfo() { try { const b = JSON.parse(localStorage.getItem(SAVE_BAK) || "null"); return b && b.data && (!b.uid || !fbUser || b.uid === fbUser.uid) ? b : null; } catch (e) { return null; } }
function saveRestore() { // 設定裡還原一次：備份換回來，現在這份不留
  const b = saveBakInfo(); if (!b) return false;
  save = Object.assign(blankSave(), JSON.parse(b.data)); localStorage.removeItem(SAVE_BAK);
  W0 = null; inWorld = false; writeSave(); cloudFlush(); enterWorld(); return true;
}
function logout() {
  if (inWorld && W0 && save.w) { save.w.x = Math.round(W0.x); save.w.y = Math.round(W0.y); writeSave(); }
  cloudFlush();
  inWorld = false; setPadLabels(false);
  if (typeof netStop === "function") netStop();
  loggingOut = true;
  firebase.auth().signOut();
}
if (AUTH_ON) {
  firebase.initializeApp(FIREBASE_CONFIG);
  fbDb = firebase.firestore();
  firebase.auth().onAuthStateChanged((u) => {
    authReady = true;
    if (u) onLogin(u);
    else {
      fbUser = null;
      if (loggingOut) { loggingOut = false; localStorage.removeItem(SAVE_KEY); save = blankSave(); W0 = null; } // 登出就清掉這台的快取（共用裝置）
      renderLogin();
    }
  });
}
