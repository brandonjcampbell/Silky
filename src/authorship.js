/* The authorship certificate: what the keystroke record and the provenance
   log say, together, about who wrote the prose. */
import { loadKeystrokes, verifyChain, hashText, fmtMs, BUCKET_LABELS } from "./keystrokes";
import { loadProvenance, aiWords, insertionStatus } from "./provenance";
import { plain, wordCount, fmt, pct } from "./analysis/text";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Everything the certificate states, as data. */
export const buildRecord = async (dir, project, scenes, { scope = "the whole project" } = {}) => {
  const ks = loadKeystrokes(dir);
  const prov = loadProvenance(dir);
  const chain = await verifyChain(ks);
  const rows = scenes.map((s) => {
    const k = ks.scenes[s.uuid] || {};
    const text = plain(s.content);
    const ai = aiWords(s.content);
    const live = prov.insertions.filter((i) => i.file === s.file).map((i) => insertionStatus(s.content, i)).filter((x) => x.status === "verbatim" || x.status === "edited").length;
    return {
      file: s.file, uuid: s.uuid, name: s.name, icon: s.icon,
      origin: s.origin || "author",
      words: wordCount(text), chars: text.length,
      aiWords: ai.ai, aiInsertions: live,
      typed: k.typed || 0, pasted: k.pasted || 0, deleted: k.deleted || 0, keys: k.keys || 0, ms: k.ms || 0, sessions: k.sessions || 0,
      baseline: k.baseline, first: k.first, last: k.last,
      hist: k.hist || [],
    };
  });
  const sum = (f) => rows.reduce((n, r) => n + (r[f] || 0), 0);
  const hist = BUCKET_LABELS.map((_, i) => rows.reduce((n, r) => n + (r.hist[i] || 0), 0));
  const words = sum("words"), chars = sum("chars");
  const typed = sum("typed"), pasted = sum("pasted"), deleted = sum("deleted");
  const baselineWords = rows.reduce((n, r) => n + (r.baseline || 0), 0);
  const imported = rows.filter((r) => /import/.test(r.origin)).reduce((n, r) => n + r.words, 0);
  const text = scenes.map((s) => plain(s.content)).join("\n\n");
  const contentHash = await hashText(text);
  const aiTotal = sum("aiWords");
  const noAi = aiTotal === 0 && sum("aiInsertions") === 0;
  return {
    project, scope, at: Date.now(), scenes: rows,
    totals: { scenes: rows.length, words, chars, typed, pasted, deleted, keys: sum("keys"), ms: sum("ms"), sessions: sum("sessions"), baselineWords, imported, aiWords: aiTotal, aiInsertions: sum("aiInsertions") },
    shares: {
      // of the characters now in the text, roughly how they got there
      typed: chars ? Math.min(1, Math.max(0, typed - deleted) / chars) : 0,
      pasted: chars ? Math.min(1, pasted / chars) : 0,
    },
    hist, chain: { ok: chain.ok, sessions: ks.sessions.length, head: ks.head, started: ks.started },
    contentHash, noAi,
    spinner: { insertionsEver: prov.insertions.length },
  };
};

/** The statement in words. */
export const statement = (r) => {
  const t = r.totals;
  const parts = [];
  if (r.noAi) parts.push(`No text in ${r.scope} was written by Spinner, Silky's model assistant: the provenance log holds ${t.aiInsertions === 0 && r.spinner.insertionsEver === 0 ? "no insertions" : "no surviving insertions"} in these scenes, and no word in the current text carries an AI mark.`);
  else parts.push(`${fmt(t.aiWords)} of ${fmt(t.words)} words (${pct(t.aiWords / Math.max(1, t.words))}) in ${r.scope} trace to Spinner, across ${t.aiInsertions} surviving insertion${t.aiInsertions === 1 ? "" : "s"}. This is therefore not a certificate of no AI; it is a record of how much.`);
  if (t.keys) parts.push(`The keystroke record holds ${fmt(t.keys)} keystrokes over ${t.sessions} writing session${t.sessions === 1 ? "" : "s"} and ${fmtMs(t.ms)} of active typing: ${fmt(t.typed)} characters typed, ${fmt(t.deleted)} deleted, ${fmt(t.pasted)} pasted from outside the editor. Roughly ${pct(r.shares.typed)} of the characters now in the text were typed keystroke by keystroke in Silky${r.shares.pasted ? `, and ${pct(r.shares.pasted)} arrived by paste, whose origin Silky cannot see` : ""}.`);
  else parts.push("No keystrokes have been recorded for these scenes; the text predates the record or was written elsewhere.");
  if (t.baselineWords) parts.push(`${fmt(t.baselineWords)} words were already present when the record began and are not covered by it.`);
  if (t.imported) parts.push(`${fmt(t.imported)} words are in scenes created by Import manuscript — text brought in from outside, not written in Silky.`);
  parts.push(`The record is a hash chain of ${r.chain.sessions} session${r.chain.sessions === 1 ? "" : "s"} that ${r.chain.ok ? "verifies intact" : "DOES NOT verify — it has been altered since it was written"}. The text certified hashes to ${r.contentHash.slice(0, 16)}… (SHA-256).`);
  return parts;
};

/** A printable certificate. */
export const certificateHtml = (r, { author = "" } = {}) => {
  const t = r.totals;
  const when = new Date(r.at);
  const maxH = Math.max(1, ...r.hist);
  const bars = r.hist.map((n, i) => `<div class="bar"><i style="height:${Math.round((n / maxH) * 60)}px"></i><b>${BUCKET_LABELS[i]}</b></div>`).join("");
  const rows = r.scenes.map((s) => `<tr><td>${esc(s.icon || "")} ${esc(s.name)}</td><td class="n">${fmt(s.words)}</td><td class="n">${s.aiWords ? fmt(s.aiWords) : "—"}</td><td class="n">${fmt(s.typed)}</td><td class="n">${s.pasted ? fmt(s.pasted) : "—"}</td><td class="n">${fmt(s.keys)}</td><td class="n">${s.ms ? fmtMs(s.ms) : "—"}</td><td class="n">${s.baseline ? fmt(s.baseline) : "—"}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Certificate of authorship — ${esc(r.project)}</title>
<style>
body { font: 12pt/1.5 Georgia, "Times New Roman", serif; color: #111; margin: 0; background: #fff; }
.sheet { max-width: 7.2in; margin: 0 auto; padding: 0.9in 0.7in; }
h1 { font: 700 26pt/1.1 Georgia, serif; margin: 0 0 4px; letter-spacing: -0.01em; }
h2 { font: 600 11pt/1.3 Helvetica, Arial, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: #555; margin: 26px 0 8px; }
.sub { color: #555; margin: 0 0 24px; }
.verdict { border: 2px solid ${r.noAi ? "#1f7a3f" : "#b35c00"}; color: ${r.noAi ? "#1f7a3f" : "#b35c00"}; border-radius: 6px; padding: 10px 16px; font: 700 14pt Helvetica, Arial, sans-serif; display: inline-block; margin: 6px 0 18px; }
p { margin: 0 0 10px; }
table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-top: 6px; }
th { text-align: left; font: 600 8.5pt Helvetica, Arial, sans-serif; color: #555; border-bottom: 1px solid #111; padding: 4px 6px; }
td { padding: 4px 6px; border-bottom: 1px solid #ddd; vertical-align: top; }
td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.hist { display: flex; gap: 6px; align-items: flex-end; height: 90px; margin: 8px 0 4px; }
.bar { flex: 1; text-align: center; font: 7.5pt Helvetica, Arial, sans-serif; color: #555; }
.bar i { display: block; background: #333; border-radius: 2px 2px 0 0; margin: 0 4px 4px; min-height: 1px; }
.bar b { font-weight: 400; }
.hash { font: 9pt Menlo, Consolas, monospace; word-break: break-all; color: #333; }
.sig { margin-top: 36px; display: flex; gap: 40px; }
.sig div { flex: 1; border-top: 1px solid #111; padding-top: 6px; font: 9pt Helvetica, Arial, sans-serif; color: #555; }
.fine { font-size: 9pt; color: #555; margin-top: 22px; }
@media print { .sheet { padding: 0; max-width: none; } }
</style></head><body><div class="sheet">
<h1>Certificate of authorship</h1>
<p class="sub">${esc(r.project)} · ${esc(r.scope)} · ${when.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
<div class="verdict">${r.noAi ? "No AI-written text" : `${pct(t.aiWords / Math.max(1, t.words))} of words trace to the model assistant`}</div>
${statement(r).map((p) => `<p>${esc(p)}</p>`).join("")}
<h2>Totals</h2>
<table><tr><th>Scenes</th><th class="n">Words</th><th class="n">Spinner words</th><th class="n">Typed chars</th><th class="n">Pasted chars</th><th class="n">Deleted</th><th class="n">Keystrokes</th><th class="n">Active time</th></tr>
<tr><td>${t.scenes}</td><td class="n">${fmt(t.words)}</td><td class="n">${fmt(t.aiWords)}</td><td class="n">${fmt(t.typed)}</td><td class="n">${fmt(t.pasted)}</td><td class="n">${fmt(t.deleted)}</td><td class="n">${fmt(t.keys)}</td><td class="n">${fmtMs(t.ms)}</td></tr></table>
<h2>Typing rhythm <span style="font-weight:400;text-transform:none;letter-spacing:0">— time between keystrokes</span></h2>
<div class="hist">${bars}</div>
<p class="fine">A person's typing spreads across these bins — bursts under a fifth of a second, pauses of seconds to think, longer gaps between sentences. Text that arrives by paste or script shows almost none.</p>
<h2>Scene by scene</h2>
<table><tr><th>Scene</th><th class="n">Words</th><th class="n">Spinner</th><th class="n">Typed</th><th class="n">Pasted</th><th class="n">Keys</th><th class="n">Time</th><th class="n">Pre-record</th></tr>${rows}</table>
<h2>Integrity</h2>
<p class="hash">Text SHA-256: ${r.contentHash}</p>
<p class="hash">Record head: ${r.chain.head || "(no sessions yet)"} · ${r.chain.sessions} sessions · chain ${r.chain.ok ? "verified" : "BROKEN"} · record began ${new Date(r.chain.started).toLocaleDateString()}</p>
<p class="fine">The record counts input events in Silky's editor — keystrokes, pastes, deletions and the intervals between them — and never the characters themselves. Each writing session is hashed with the one before it. This is evidence, not proof: it shows what happened inside Silky and cannot see what happened before text was pasted in. Produced by Silky (brandonjcampbell.github.io/Silky).</p>
<div class="sig"><div>${author ? esc(author) : "Author"}</div><div>Date</div></div>
</div></body></html>`;
};
