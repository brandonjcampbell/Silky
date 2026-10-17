/**
 * LLM connection settings. Stored in this browser's localStorage only; the
 * API key is sent to the configured endpoint and nowhere else.
 */

const KEY = "silky:llm";

export const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI-compatible",
    note: "OpenAI, Ollama, LM Studio, OpenRouter, vLLM — anything with /v1/chat/completions.",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    needsKey: true,
    jsonMode: true,
  },
  {
    id: "ollama",
    name: "Ollama (local)",
    note: "Runs on your machine. Start Ollama with OLLAMA_ORIGINS=* so the browser may call it.",
    baseUrl: "http://localhost:11434/v1",
    model: "llama3.1",
    needsKey: false,
    jsonMode: true,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    note: "Claude models via the Messages API.",
    baseUrl: "https://api.anthropic.com",
    model: "claude-sonnet-4-5",
    needsKey: true,
    jsonMode: false,
  },
];

export const defaultConfig = (providerId = "openai") => {
  const p = PROVIDERS.find((x) => x.id === providerId) || PROVIDERS[0];
  return { provider: p.id, baseUrl: p.baseUrl, model: p.model, apiKey: "", jsonMode: p.jsonMode };
};

export const getConfig = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const c = JSON.parse(raw);
      if (c && c.provider) return { ...defaultConfig(c.provider), ...c };
    }
  } catch (e) {
    /* storage unavailable */
  }
  return null;
};

export const saveConfig = (c) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch (e) {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("silky-llm"));
};

export const clearConfig = () => {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("silky-llm"));
};

export const isConfigured = () => {
  const c = getConfig();
  if (!c || !c.baseUrl || !c.model) return false;
  const p = PROVIDERS.find((x) => x.id === c.provider);
  return !(p && p.needsKey && !c.apiKey);
};
