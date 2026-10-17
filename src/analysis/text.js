/* Plain-text statistics over scenes. Everything here is deterministic. */

export const plain = (html) =>
  String(html || "")
    .replace(/<\/(p|div|h[1-6]|li|blockquote|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .trim();

export const words = (text) => (text.match(/[A-Za-zÀ-ɏ'’-]+/g) || []);
export const wordCount = (text) => words(text).length;

const ABBR = /\b(Mr|Mrs|Ms|Dr|St|Prof|Sr|Jr|Capt|Lt|Col|Gen|Rev|Hon|vs|etc|No|p|pp|i\.e|e\.g|A\.M|P\.M|a\.m|p\.m)\./g;
const MARK = "\u0001";

export const sentences = (text) => {
  const flat = text.replace(/\n+/g, " ").replace(ABBR, (m) => m.replace(/\./g, MARK));
  const out = [];
  const re = /[^.!?…]+(?:[.!?…]+["”’']*|$)/g;
  let m;
  while ((m = re.exec(flat))) {
    const s = m[0].trim().replace(new RegExp(MARK, "g"), ".");
    if (!s) break;
    // a fragment that starts lowercase continues the previous sentence
    if (out.length && /^[a-z]/.test(s)) out[out.length - 1] += " " + s;
    else if (wordCount(s) > 0) out.push(s);
    if (m.index + m[0].length >= flat.length) break;
  }
  return out;
};

/** Fraction of words inside quotation marks. */
export const dialogueRatio = (text) => {
  const total = wordCount(text);
  if (!total) return 0;
  let inside = 0;
  const re = /["“]([^"”]{1,2000})["”]/g;
  let m;
  while ((m = re.exec(text))) inside += wordCount(m[1]);
  return Math.min(1, inside / total);
};

const syllables = (w) => {
  const s = w.toLowerCase().replace(/[^a-z]/g, "");
  if (!s) return 0;
  if (s.length <= 3) return 1;
  const stripped = s.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const groups = stripped.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
};

export const STOP = new Set(
  "the a an and or but of to in on at by for with from as is are was were be been being am it its it's this that these those he she they them his her their him we you i me my our your not no so if then than too very can could would should will shall may might must do does did done have has had having there here where when what which who whom whose why how all any each few more most other some such only own same into out up down over under again further once about above below between through during before after off while because until against both".split(/\s+/)
);

export const FILTER_WORDS = [
  "very", "really", "just", "quite", "rather", "somewhat", "suddenly", "began to", "started to", "seemed to", "felt", "feel", "realized", "noticed", "saw", "heard", "wondered", "knew", "thought", "decided", "almost", "basically", "actually", "literally", "that",
];

/** Per-text style metrics. */
export const styleStats = (text) => {
  const ws = words(text);
  const n = ws.length;
  const ss = sentences(text);
  const lens = ss.map((s) => wordCount(s));
  const mean = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const variance = lens.length ? lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length : 0;
  const syl = ws.reduce((a, w) => a + syllables(w), 0);
  const fk = n && ss.length ? 0.39 * (n / ss.length) + 11.8 * (syl / n) - 15.59 : 0;
  const lower = ws.map((w) => w.toLowerCase());
  const adverbs = lower.filter((w) => /ly$/.test(w) && w.length > 4 && !/^(only|early|family|reply|supply|italy|holy|ugly|fly|apply|rely|july|likely|lonely|lovely|friendly|elderly|belly|jelly|folly|rally|tally|bully|silly|chilly|hilly|jolly|woolly|ally)$/.test(w)).length;
  const passive = (text.match(/\b(was|were|been|being|is|are|be)\s+(\w+ed|\w+en)\b/gi) || []).length;
  const exclam = (text.match(/!/g) || []).length;
  const lowerText = " " + text.toLowerCase() + " ";
  const filters = FILTER_WORDS.map((f) => ({ word: f, n: (lowerText.match(new RegExp("\\b" + f.replace(/ /g, "\\s+") + "\\b", "g")) || []).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  // type/token on a fixed window so long and short texts compare
  const win = lower.slice(0, 2000);
  const ttr = win.length ? new Set(win).size / win.length : 0;
  const freq = new Map();
  lower.forEach((w) => { if (!STOP.has(w) && w.length > 2) freq.set(w, (freq.get(w) || 0) + 1); });
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);
  const longest = ss.reduce((a, s) => (wordCount(s) > wordCount(a) ? s : a), "");
  return {
    words: n,
    sentences: ss.length,
    paragraphs: text.split(/\n+/).filter((p) => p.trim()).length,
    avgSentence: mean,
    sdSentence: Math.sqrt(variance),
    longestSentence: longest,
    longestSentenceWords: wordCount(longest),
    dialogue: dialogueRatio(text),
    adverbsPer1k: n ? (adverbs / n) * 1000 : 0,
    passivePer1k: n ? (passive / n) * 1000 : 0,
    exclamPer1k: n ? (exclam / n) * 1000 : 0,
    grade: fk,
    ttr,
    top,
    filters,
    readingMinutes: n / 250,
  };
};

export const fmt = (n, d = 0) => (Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }) : "–");
export const pct = (x) => fmt(x * 100, 0) + "%";
