// 御劍渡劫（pixel-raid）— 表現層：音效與背景音樂（Web Audio 即時合成，不需要音檔）
"use strict";

let actx = null, master = null, muted = localStorage.getItem("pixelraid_mute") === "1";
// 瀏覽器規定：要等使用者第一次點擊／按鍵後才能出聲
function initAudio() {
  if (actx) { if (actx.state === "suspended") actx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  actx = new AC();
  master = actx.createGain();
  master.connect(actx.destination); applyVol();
}
window.addEventListener("pointerdown", initAudio);
window.addEventListener("keydown", initAudio);
function setMuted(m) {
  muted = m;
  localStorage.setItem("pixelraid_mute", m ? "1" : "0");
  applyVol();
}
// 企劃 74 B：主音量／音效／音樂三條（0–100，這台裝置的設定 pr_vol）；背景音樂播的音走 AUDIO_BUS="music"
const VOL = (() => { try { return Object.assign({ m: 80, s: 80, b: 50 }, JSON.parse(localStorage.getItem("pr_vol") || "{}")); } catch (e) { return { m: 80, s: 80, b: 50 }; } })();
let busS = null, busM = null, AUDIO_BUS = "sfx";
function applyVol() {
  if (master) master.gain.value = muted ? 0 : 0.6 * VOL.m / 100;
  if (busS) busS.gain.value = VOL.s / 80; if (busM) busM.gain.value = VOL.b / 50;
}
function audioBus() {
  if (!busS && actx) { busS = actx.createGain(); busM = actx.createGain(); busS.connect(master); busM.connect(master); applyVol(); }
  return AUDIO_BUS === "music" ? busM : busS;
}
function setVol(k, v) { VOL[k] = Math.max(0, Math.min(100, Math.round(v))); try { localStorage.setItem("pr_vol", JSON.stringify(VOL)); } catch (e) {} applyVol(); }

// 一個音：波形、起始頻率、結束頻率、長度、音量、延遲
function tone(type, f0, f1, dur, vol = 0.2, delay = 0) {
  if (!actx || muted) return;
  const t = actx.currentTime + delay;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(audioBus());
  o.start(t); o.stop(t + dur + 0.02);
}
// 噪音（爆炸、撞擊用）
let noiseBuf = null;
function noise(dur, vol = 0.2, freq = 1200, delay = 0) {
  if (!actx || muted) return;
  if (!noiseBuf) {
    noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = actx.currentTime + delay;
  const src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
  src.buffer = noiseBuf;
  f.type = "lowpass"; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f); f.connect(g); g.connect(audioBus());
  src.start(t); src.stop(t + dur);
}

const SFX = {
  hit: () => { tone("square", 420, 180, 0.08, 0.12); noise(0.05, 0.08, 2500); },
  crit: () => { tone("square", 700, 220, 0.12, 0.16); noise(0.08, 0.14, 3000); },
  tick: () => tone("triangle", 1400, 900, 0.04, 0.05),
  volley: () => { for (let i = 0; i < 4; i++) tone("triangle", 1800 - i * 200, 900, 0.06, 0.05, i * 0.04); },
  hurt: () => { tone("sawtooth", 220, 90, 0.18, 0.15); noise(0.12, 0.12, 900); },
  dash: () => noise(0.12, 0.08, 1800),
  heal: () => { tone("sine", 660, 660, 0.1, 0.12); tone("sine", 990, 990, 0.15, 0.1, 0.08); },
  ult: () => { tone("sawtooth", 200, 1200, 0.35, 0.15); noise(0.5, 0.2, 1500, 0.15); tone("square", 1200, 300, 0.4, 0.1, 0.2); },
  roar: () => { tone("sawtooth", 110, 55, 0.7, 0.2); noise(0.6, 0.15, 500); },
  good: () => { tone("triangle", 660, 660, 0.07, 0.15); tone("triangle", 990, 990, 0.1, 0.15, 0.06); },
  bad: () => tone("square", 300, 120, 0.2, 0.12),
  break: () => { noise(0.3, 0.2, 2000); tone("triangle", 520, 1040, 0.2, 0.12, 0.05); },
  arrive: () => [523, 659, 784, 1047].forEach((f, i) => tone("triangle", f, f, 0.25, 0.12, i * 0.09)),
  win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone("triangle", f, f, 0.3, 0.13, i * 0.12)),
  lose: () => [392, 330, 262, 196].forEach((f, i) => tone("triangle", f, f, 0.35, 0.12, i * 0.18)),
  click: () => tone("triangle", 880, 880, 0.05, 0.1),
};
function sfx(name) { if (SFX[name]) SFX[name](); }

// 背景音樂：五聲音階的簡單旋律＋低音，跑酷輕快、打王緊張
const SCALE_NOTES = [262, 294, 330, 392, 440, 523, 587, 659, 784];
let bgmStep = 0, bgmNext = 0;
function updateBgm() {
  if (!actx || muted || actx.state !== "running") return;
  const vs = viewState();
  const tense = vs === "play" || vs === "intro" || vs === "hunt";
  const calm = vs === "run" || vs === "runEnd" || vs === "title" || vs === "world";
  if (!tense && !calm) return;
  if (state === "paused") return;
  const beat = tense ? 0.2 : 0.26;
  if (bgmNext < actx.currentTime) bgmNext = actx.currentTime + 0.05;
  while (bgmNext < actx.currentTime + 0.3) {
    const d = bgmNext - actx.currentTime;
    const s = bgmStep % 16;
    if (s % 4 === 0) tone(tense ? "sawtooth" : "triangle", tense ? (s < 8 ? 110 : 98) : (s < 8 ? 131 : 147), tense ? 55 : 131, beat * 3, tense ? 0.07 : 0.06, d);
    if (tense ? s % 2 === 0 : s % 2 === 0 || Math.random() < 0.3) {
      const n = SCALE_NOTES[Math.floor((Math.sin(bgmStep * 1.7) * 0.5 + 0.5) * (tense ? 5 : SCALE_NOTES.length))];
      tone(tense ? "square" : "triangle", n, n, beat * 0.9, tense ? 0.03 : 0.045, d);
    }
    bgmStep++;
    bgmNext += beat;
  }
}
