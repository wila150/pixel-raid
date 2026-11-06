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
function cloudFlush() {
  clearTimeout(cloudT); cloudT = null;
  if (!fbUser || !fbDb) return;
  fbDb.collection("users").doc(fbUser.uid).set({ name: fbUser.displayName || "", save: JSON.stringify(save), updated: Date.now() }).catch(() => {});
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
    <h1>御劍<br>渡劫</h1>
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
  screenEl.innerHTML = `<div class="panel"><h1>御劍<br>渡劫</h1><p class="sub">${t}</p></div>`;
  screenEl.classList.remove("hidden");
}
// 登入後：讀雲端存檔（新帳號就把這台裝置原本的進度帶上去），然後直接進仙界
async function onLogin(user) {
  fbUser = user;
  renderLoading("讀取存檔中…");
  try {
    const doc = await fbDb.collection("users").doc(user.uid).get();
    if (doc.exists && doc.data().save) save = Object.assign(blankSave(), JSON.parse(doc.data().save));
    writeSave(); cloudFlush();
  } catch (e) { renderLogin("讀不到雲端存檔：" + (e.code || e.message)); return; }
  W0 = null; // 換帳號要重新生成怪物
  enterWorld();
}
function logout() {
  if (inWorld && W0 && save.w) { save.w.x = Math.round(W0.x); save.w.y = Math.round(W0.y); writeSave(); }
  cloudFlush();
  inWorld = false; setPadLabels(false);
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
