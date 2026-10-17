/* Weaving a revision into a scene.
   Spinner returns revised prose; we diff it word-by-word against what was
   there and rebuild the scene so that every word the writer already had keeps
   its place, its formatting and its existing provenance, while only the words
   that are actually new are marked as Spinner's. Words the revision dropped
   simply go. */
import { newId } from "./provenance";

const BLOCK = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "LI", "PRE"]);
const FMT = { B: "b", STRONG: "b", I: "i", EM: "i", U: "u", S: "s", STRIKE: "s", DEL: "s" };
const FMT_ORDER = ["b", "i", "u", "s"];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const parseHtml = (html) => new DOMParser().parseFromString(`<body>${html || ""}</body>`, "text/html").body;

/**
 * Break a scene (a live element or a parsed body) into word tokens.
 * token: { t: "w", w, ai, fmt, block } | { t: "¶", br? }
 * `sel` (a Range) marks which tokens are selected → selStart/selEnd.
 */
export const tokenize = (root, sel) => {
  const tokens = [];
  const opaque = []; // { at, html } — images, rules: kept near their old place
  let selStart = -1;
  let selEnd = -1;
  const breakHere = () => { if (tokens.length && tokens[tokens.length - 1].t !== "¶") tokens.push({ t: "¶" }); };
  const inSel = (node, off) => { try { return sel.comparePoint(node, off) === 0; } catch (e) { return false; } };
  const walk = (node, ctx) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        const re = /\S+/g;
        let m;
        while ((m = re.exec(child.nodeValue))) {
          const w = m[0].replace(/​/g, "");
          if (!w) continue;
          if (sel && (inSel(child, m.index) || inSel(child, m.index + m[0].length) || inSel(child, m.index + 1))) {
            if (selStart < 0) selStart = tokens.length;
            selEnd = tokens.length + 1;
          }
          tokens.push({ t: "w", w, ai: ctx.ai, fmt: ctx.fmt, block: ctx.block });
        }
      } else if (child.nodeType === 1) {
        const tag = child.tagName;
        if (tag === "BR") { if (tokens.length && tokens[tokens.length - 1].t !== "¶") tokens.push({ t: "¶", br: true }); return; }
        if (tag === "IMG" || tag === "HR") { opaque.push({ at: tokens.length, html: child.outerHTML }); return; }
        const isBlock = BLOCK.has(tag);
        if (isBlock) breakHere();
        const ai = child.getAttribute && child.getAttribute("data-ai-id") ? child.getAttribute("data-ai-id") : ctx.ai;
        const f = FMT[tag];
        const fmt = f && !ctx.fmt.includes(f) ? FMT_ORDER.filter((x) => ctx.fmt.includes(x) || x === f).join("") : ctx.fmt;
        walk(child, { ai, fmt, block: isBlock ? tag.toLowerCase() : ctx.block });
        if (isBlock) breakHere();
      }
    });
  };
  walk(root, { ai: null, fmt: "", block: "p" });
  while (tokens.length && tokens[tokens.length - 1].t === "¶") tokens.pop();
  return { tokens, opaque, selStart, selEnd };
};

/** Plain text of a token run, paragraphs separated by blank lines. */
export const textOf = (tokens) => {
  let out = "";
  tokens.forEach((tk, i) => {
    if (tk.t === "¶") out += tk.br ? "\n" : "\n\n";
    else out += (i && tokens[i - 1].t === "w" ? " " : "") + tk.w;
  });
  return out.trim();
};

/** Tokens for Spinner's revised text. */
export const tokenizeText = (text) => {
  const tokens = [];
  String(text || "").replace(/\r\n?/g, "\n").split(/\n+/).forEach((para) => {
    const ws = para.match(/\S+/g);
    if (!ws) return;
    if (tokens.length) tokens.push({ t: "¶" });
    ws.forEach((w) => tokens.push({ t: "w", w, ai: null, fmt: "", block: "p" }));
  });
  return tokens;
};

// Words match on their core: a changed comma or capital doesn't make the
// writer's word Spinner's (the new surface form is kept, the provenance isn't).
const key = (tk) => (tk.t === "¶" ? "\n" : tk.w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").toLowerCase() || tk.w);

/** LCS alignment → [{ type: "same"|"del"|"ins", tok, i? }] */
export const align = (A, B) => {
  const n = A.length, m = B.length;
  if ((n + 1) * (m + 1) > 3.2e7) {
    return [...A.map((tok, i) => ({ type: "del", tok, i })), ...B.map((tok) => ({ type: "ins", tok }))];
  }
  const W = m + 1;
  const dp = new Uint16Array((n + 1) * W);
  for (let i = n - 1; i >= 0; i -= 1) {
    const ki = key(A[i]);
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i * W + j] = ki === key(B[j]) ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
    }
  }
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (key(A[i]) === key(B[j])) { out.push({ type: "same", tok: A[i].w === B[j].w || A[i].t === "¶" ? A[i] : { ...A[i], w: B[j].w }, i }); i += 1; j += 1; }
    else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) { out.push({ type: "del", tok: A[i], i }); i += 1; }
    else { out.push({ type: "ins", tok: B[j] }); j += 1; }
  }
  while (i < n) { out.push({ type: "del", tok: A[i], i }); i += 1; }
  while (j < m) { out.push({ type: "ins", tok: B[j] }); j += 1; }
  return out;
};

const openFmt = (fmt) => fmt.split("").map((f) => `<${f}>`).join("");
const closeFmt = (fmt) => fmt.split("").reverse().map((f) => `</${f}>`).join("");

/** Rebuild scene HTML from an alignment; inserted words get `id`. */
export const rebuild = (ops, opaque, id) => {
  const kept = ops.filter((o) => o.type !== "del");
  // inserted words inherit formatting when both neighbours agree
  kept.forEach((o, k) => {
    if (o.type !== "ins" || o.tok.t !== "w") return;
    let l = k - 1; while (l >= 0 && kept[l].type === "ins") l -= 1;
    let r = k + 1; while (r < kept.length && kept[r].type === "ins") r += 1;
    const L = l >= 0 && kept[l].tok.t === "w" ? kept[l].tok : null;
    const R = r < kept.length && kept[r].tok.t === "w" ? kept[r].tok : null;
    const fmt = L && R && L.fmt === R.fmt ? L.fmt : "";
    const block = (L && L.block) || (R && R.block) || "p";
    o.tok = { ...o.tok, ai: id, fmt, block };
  });
  const paras = [[]];
  kept.forEach((o) => {
    if (o.tok.t === "¶") {
      if (o.tok.br && o.type === "same") paras[paras.length - 1].push({ br: true });
      else if (paras[paras.length - 1].length) paras.push([]);
    } else paras[paras.length - 1].push(o);
  });
  let pending = [...opaque];
  let html = "";
  const flushOpaque = (upTo) => {
    while (pending.length && pending[0].at <= upTo) html += pending.shift().html;
  };
  paras.forEach((p) => {
    if (!p.length) return;
    const first = p.find((o) => !o.br);
    const tag = (first && first.tok.block) || "p";
    const minIndex = Math.min(...p.filter((o) => !o.br && o.i !== undefined).map((o) => o.i), Infinity);
    if (minIndex !== Infinity) flushOpaque(minIndex);
    let inner = "";
    let run = null; // { ai, fmt, words: [] }
    const closeRun = () => {
      if (!run) return;
      let s = esc(run.words.join(" "));
      if (run.fmt) s = openFmt(run.fmt) + s + closeFmt(run.fmt);
      if (run.ai) s = `<span data-ai="spinner" data-ai-id="${run.ai}">${s}</span>`;
      inner += (inner && !inner.endsWith("<br>") ? " " : "") + s;
      run = null;
    };
    p.forEach((o) => {
      if (o.br) { closeRun(); inner += "<br>"; return; }
      const tk = o.tok;
      if (run && run.ai === tk.ai && run.fmt === tk.fmt) run.words.push(tk.w);
      else { closeRun(); run = { ai: tk.ai || null, fmt: tk.fmt || "", words: [tk.w] }; }
    });
    closeRun();
    html += `<${tag}>${inner}</${tag}>`;
  });
  flushOpaque(Infinity);
  return html;
};

/**
 * Weave `revisedText` into the scene held in `root`.
 * When a selection was given, Spinner revised only that passage, so the rest
 * of the scene is spliced back around it before aligning.
 * @returns {{ html, ops, added, removed, addedText, id }}
 */
export const weave = ({ root, revisedText, selection, id = newId() }) => {
  const { tokens, opaque, selStart, selEnd } = tokenize(root, selection || null);
  let B = tokenizeText(revisedText);
  if (selection && selStart >= 0) {
    const before = tokens.slice(0, selStart);
    const after = tokens.slice(selEnd);
    const stripAi = (tk) => ({ ...tk, ai: null, fmt: "", block: "p" });
    B = [...before.map(stripAi), ...(before.length && B.length ? [{ t: "¶", soft: true }] : []), ...B, ...(after.length && B.length ? [{ t: "¶", soft: true }] : []), ...after.map(stripAi)];
    // the splice seams shouldn't invent paragraph breaks where there were none
    const seam = (idx) => { if (B[idx] && B[idx].soft) B.splice(idx, 1); };
    if (before.length && tokens[selStart - 1] && tokens[selStart - 1].t !== "¶" && tokens[selStart] && tokens[selStart].t !== "¶") seam(before.length);
    const afterIdx = B.length - after.length - 1;
    if (after.length && tokens[selEnd - 1] && tokens[selEnd - 1].t !== "¶" && tokens[selEnd] && tokens[selEnd].t !== "¶") seam(afterIdx);
  }
  const ops = align(tokens, B);
  const ins = ops.filter((o) => o.type === "ins" && o.tok.t === "w");
  const del = ops.filter((o) => o.type === "del" && o.tok.t === "w");
  const html = rebuild(ops, opaque, id);
  return { html, ops, added: ins.length, removed: del.length, addedText: ins.map((o) => o.tok.w).join(" "), id };
};

/** The scene's text and the selected passage, for the prompt. */
export const sceneText = (root, selection) => {
  const { tokens, selStart, selEnd } = tokenize(root, selection || null);
  const whole = textOf(tokens);
  if (!selection || selStart < 0) return { whole, passage: null, before: null, after: null };
  return {
    whole,
    passage: textOf(tokens.slice(selStart, selEnd)),
    before: textOf(tokens.slice(0, selStart)),
    after: textOf(tokens.slice(selEnd)),
  };
};
