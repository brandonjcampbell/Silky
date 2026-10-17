/* Read aloud with the browser's own voices (Web Speech API). No network, no
   key. Text is spoken one sentence at a time, which keeps Chrome from
   cutting long utterances off and lets the player show where it is. */
import { plain, sentences } from "./analysis/text";

const KEY = "silky:voice";
export const supported = () => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

export const loadPrefs = () => {
  try { return { rate: 1, pitch: 1, voice: "", ...(JSON.parse(localStorage.getItem(KEY) || "{}")) }; } catch (e) { return { rate: 1, pitch: 1, voice: "" }; }
};
export const savePrefs = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* ignore */ } };

/** Voices, resolved when the browser has them (Chrome loads them late). */
export const getVoices = () =>
  new Promise((resolve) => {
    if (!supported()) return resolve([]);
    const v = window.speechSynthesis.getVoices();
    if (v.length) return resolve(v);
    const on = () => { window.speechSynthesis.removeEventListener("voiceschanged", on); resolve(window.speechSynthesis.getVoices()); };
    window.speechSynthesis.addEventListener("voiceschanged", on);
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500);
  });

/** Break scenes into a flat list of spoken units: [{sceneFile, sceneName, text, index}] */
export const unitsFor = (scenes) => {
  const out = [];
  scenes.forEach((s) => {
    const text = plain(s.content);
    // keep paragraphs as boundaries so pauses land where the author put them
    text.split(/\n+/).map((p) => p.trim()).filter(Boolean).forEach((para, pi) => {
      sentences(para).forEach((sent) => out.push({ sceneFile: s.file, sceneName: s.name, text: sent, paraStart: pi === 0 && out.filter((u) => u.sceneFile === s.file).length === 0 }));
    });
  });
  return out.map((u, i) => ({ ...u, index: i }));
};

/** A small controller around speechSynthesis. */
export class Reader {
  constructor({ onState }) {
    this.onState = onState || (() => {});
    this.units = [];
    this.i = 0;
    this.playing = false;
    this.paused = false;
    this.voice = null;
    this.rate = 1;
    this.pitch = 1;
    this._utt = null;
  }
  load(units, start = 0) { this.stop(); this.units = units; this.i = Math.max(0, Math.min(start, units.length - 1)); this._emit(); }
  _emit() { this.onState({ playing: this.playing, paused: this.paused, i: this.i, n: this.units.length, unit: this.units[this.i] || null }); }
  play() {
    if (!supported() || !this.units.length) return;
    if (this.paused) { window.speechSynthesis.resume(); this.paused = false; this.playing = true; this._emit(); return; }
    this.playing = true; this.paused = false; this._speak();
  }
  _speak() {
    if (!this.playing || this.i >= this.units.length) { this.playing = false; this._emit(); return; }
    const u = this.units[this.i];
    const utt = new SpeechSynthesisUtterance(u.text);
    if (this.voice) utt.voice = this.voice;
    utt.rate = this.rate; utt.pitch = this.pitch;
    utt.onend = () => { if (this._utt !== utt) return; this.i += 1; this._emit(); if (this.playing) this._speak(); };
    utt.onerror = (e) => { if (this._utt !== utt) return; if (e.error === "interrupted" || e.error === "canceled") return; this.i += 1; if (this.playing) this._speak(); };
    this._utt = utt;
    this._emit();
    window.speechSynthesis.speak(utt);
  }
  pause() { if (!this.playing) return; window.speechSynthesis.pause(); this.paused = true; this.playing = false; this._emit(); }
  stop() { this.playing = false; this.paused = false; this._utt = null; if (supported()) window.speechSynthesis.cancel(); this._emit(); }
  seek(i) { const was = this.playing || this.paused; this.stop(); this.i = Math.max(0, Math.min(i, this.units.length - 1)); if (was) this.play(); else this._emit(); }
  next() { this.seek(this.i + 1); }
  prev() { this.seek(this.i - 1); }
  setVoice(v) { this.voice = v; if (this.playing) { const i = this.i; this.stop(); this.i = i; this.play(); } }
  setRate(r) { this.rate = r; if (this.playing) { const i = this.i; this.stop(); this.i = i; this.play(); } }
}
