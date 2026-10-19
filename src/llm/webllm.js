/**
 * In-browser models via WebLLM (MLC). The library is loaded at runtime from a
 * CDN only when this provider is used, so it never weighs on the app bundle;
 * model weights stream from Hugging Face once and are cached by the browser.
 */

const CDN = "https://esm.run/@mlc-ai/web-llm@0.2.79";
export const PROGRESS_EVENT = "silky-llm-progress";

export const WEBLLM_MODELS = [
  { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", name: "Qwen2.5 1.5B", size: "≈1.0 GB", note: "Fastest; fine for reader notes, weak at the import's structured extraction." },
  { id: "Qwen2.5-3B-Instruct-q4f16_1-MLC", name: "Qwen2.5 3B", size: "≈2.0 GB", note: "The default. Follows the JSON prompts reliably; decent prose." },
  { id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", name: "Llama 3.2 3B", size: "≈2.0 GB", note: "Similar to Qwen 3B, a little chattier." },
  { id: "Phi-3.5-mini-instruct-q4f16_1-MLC", name: "Phi-3.5 mini (3.8B)", size: "≈2.3 GB", note: "Strong on instructions; long context." },
  { id: "Qwen2.5-7B-Instruct-q4f16_1-MLC", name: "Qwen2.5 7B", size: "≈5.0 GB", note: "Best quality here; needs roughly 8 GB of GPU memory." },
];
export const WEBLLM_DEFAULT = WEBLLM_MODELS[1].id;

export const hasWebGPU = () => typeof navigator !== "undefined" && !!navigator.gpu;

const emit = (detail) => window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, { detail }));

let libPromise = null;
/** Load the WebLLM module through a <script type="module"> so the bundler never sees the URL. */
const loadLib = () => {
  if (libPromise) return libPromise;
  libPromise = new Promise((resolve, reject) => {
    if (window.__silkyWebLLM) return resolve(window.__silkyWebLLM);
    const s = document.createElement("script");
    s.type = "module";
    s.textContent = `import * as m from "${CDN}"; window.__silkyWebLLM = m; window.dispatchEvent(new Event("silky-webllm-ready"));`;
    const onReady = () => { cleanup(); resolve(window.__silkyWebLLM); };
    const onErr = (e) => { cleanup(); libPromise = null; reject(new Error("Could not load the in-browser model runtime (" + CDN + "). Are you online?")); };
    const cleanup = () => { window.removeEventListener("silky-webllm-ready", onReady); window.removeEventListener("error", onErr); };
    window.addEventListener("silky-webllm-ready", onReady);
    // module script errors surface as window errors
    window.addEventListener("error", onErr, { once: true });
    document.head.appendChild(s);
    setTimeout(() => { if (!window.__silkyWebLLM) onErr(); }, 60000);
  });
  return libPromise;
};

let engine = null;
let engineModel = null;
let enginePromise = null;

/** Get (or build) the engine for a model. Progress goes out on PROGRESS_EVENT. */
export const getEngine = async (modelId) => {
  if (!hasWebGPU()) throw new Error("This browser has no WebGPU, which in-browser models need. Chrome or Edge on a machine with a GPU works; otherwise choose another provider.");
  if (engine && engineModel === modelId) return engine;
  if (enginePromise && engineModel === modelId) return enginePromise;
  engineModel = modelId;
  enginePromise = (async () => {
    const lib = await loadLib();
    emit({ phase: "loading", text: "Loading model…", progress: 0, model: modelId });
    if (engine) {
      try { await engine.unload(); } catch (e) { /* ignore */ }
      engine = null;
    }
    // the prebuilt configs default to a 4k window; a scene brought into a
    // conversation needs more, and these models support it
    const e = await lib.CreateMLCEngine(modelId, {
      initProgressCallback: (r) => emit({ phase: "loading", text: r.text, progress: r.progress, model: modelId }),
    }, { context_window_size: WINDOW, sliding_window_size: -1 });
    engine = e;
    emit({ phase: "ready", text: "Model ready", progress: 1, model: modelId });
    return e;
  })();
  try {
    return await enginePromise;
  } catch (err) {
    enginePromise = null;
    engineModel = null;
    emit({ phase: "error", text: err.message, progress: 0, model: modelId });
    throw err;
  }
};

/** Context window we ask the engine for; prompts are trimmed to fit it. */
export const WINDOW = 16384;
const tokensOf = (text) => Math.ceil(String(text || "").length / 3.5); // generous estimate for English + markup
const trimTo = (text, tokens) => { const chars = Math.max(0, tokens) * 3.5; return text.length <= chars ? text : text.slice(0, Math.max(0, chars - 40)) + "\n…(trimmed to fit the model's context)"; };

/** Drop old turns, then shorten the system prompt, until the request fits. */
export const fitMessages = (messages, maxTokens) => {
  const budget = WINDOW - maxTokens - 256;
  let msgs = messages.map((m) => ({ ...m }));
  const total = () => msgs.reduce((n, m) => n + tokensOf(m.content) + 8, 0);
  // oldest non-system turns go first, but keep the final user turn
  while (total() > budget && msgs.length > 2) {
    const i = msgs.findIndex((m, k) => m.role !== "system" && k < msgs.length - 1);
    if (i < 0) break;
    msgs.splice(i, 1);
  }
  if (total() > budget) {
    const sys = msgs.findIndex((m) => m.role === "system");
    if (sys >= 0) {
      const others = total() - tokensOf(msgs[sys].content);
      msgs[sys].content = trimTo(msgs[sys].content, budget - others);
    }
  }
  if (total() > budget) {
    const last = msgs[msgs.length - 1];
    const others = total() - tokensOf(last.content);
    last.content = trimTo(last.content, budget - others);
  }
  return msgs;
};

export const isEngineReady = (modelId) => !!engine && engineModel === modelId;

/** OpenAI-shaped completion against the local engine. */
export const webllmComplete = async (c, { messages, json, maxTokens, signal }) => {
  const e = await getEngine(c.model);
  if (signal && signal.aborted) throw new DOMException("Aborted", "AbortError");
  const max = Math.min(maxTokens, 2048);
  const req = { messages: fitMessages(messages, max), temperature: 0.2, max_tokens: max };
  if (json) req.response_format = { type: "json_object" };
  // WebLLM has no AbortSignal on create(); interrupt the generation instead.
  const onAbort = () => { try { e.interruptGenerate(); } catch (err) { /* ignore */ } };
  if (signal) signal.addEventListener("abort", onAbort, { once: true });
  try {
    const out = await e.chat.completions.create(req);
    if (signal && signal.aborted) throw new DOMException("Aborted", "AbortError");
    const ch = out.choices && out.choices[0];
    return { text: (ch && ch.message && ch.message.content) || "", cut: !!(ch && ch.finish_reason === "length") };
  } finally {
    if (signal) signal.removeEventListener("abort", onAbort);
  }
};

/** Remove a model's cached weights from this browser. */
export const deleteModelCache = async (modelId) => {
  const lib = await loadLib();
  if (engine && engineModel === modelId) {
    try { await engine.unload(); } catch (e) { /* ignore */ }
    engine = null;
    engineModel = null;
    enginePromise = null;
  }
  if (lib.deleteModelAllInfoInCache) await lib.deleteModelAllInfoInCache(modelId);
};
