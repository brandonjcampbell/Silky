import { getConfig, PROVIDERS } from "./config";
import { webllmComplete } from "./webllm";

/**
 * One chat completion. Returns the assistant's text.
 *   complete({ system, user, json, maxTokens, signal })
 * `json: true` asks for a JSON object (provider JSON mode where available,
 * always reinforced in the prompt) and parses it; the parsed object is
 * returned instead of text.
 */
export const complete = async ({ system, user, json = false, maxTokens = 4096, signal, config }) => {
  const c = config || getConfig();
  if (!c) throw new Error("No LLM connection configured.");
  const text =
    c.provider === "anthropic"
      ? await anthropic(c, { system, user, json, maxTokens, signal })
      : c.provider === "webllm"
      ? await webllmComplete(c, { messages: messagesFor(system, user, json), json, maxTokens, signal })
      : await openaiCompatible(c, { system, user, json, maxTokens, signal });
  return json ? parseJson(text) : text;
};

const jsonNudge = (system, json) =>
  json
    ? (system ? system + "\n\n" : "") +
      "Respond with a single JSON object and nothing else: no prose, no code fences."
    : system;

const messagesFor = (system, user, json) => [
  ...(jsonNudge(system, json) ? [{ role: "system", content: jsonNudge(system, json) }] : []),
  { role: "user", content: user },
];

const openaiCompatible = async (c, { system, user, json, maxTokens, signal }) => {
  const url = c.baseUrl.replace(/\/+$/, "") + "/chat/completions";
  const headers = { "Content-Type": "application/json" };
  if (c.apiKey) headers.Authorization = "Bearer " + c.apiKey;
  const body = {
    model: c.model,
    messages: [
      ...(jsonNudge(system, json) ? [{ role: "system", content: jsonNudge(system, json) }] : []),
      { role: "user", content: user },
    ],
    temperature: 0.2,
    max_tokens: maxTokens,
  };
  if (json && c.jsonMode) body.response_format = { type: "json_object" };
  const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal });
  if (!r.ok) throw new Error(await errorText(r));
  const data = await r.json();
  const msg = data.choices && data.choices[0] && data.choices[0].message;
  if (!msg) throw new Error("Unexpected response shape from the model.");
  return msg.content || "";
};

const anthropic = async (c, { system, user, json, maxTokens, signal }) => {
  const url = c.baseUrl.replace(/\/+$/, "") + "/v1/messages";
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": c.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: c.model,
      max_tokens: maxTokens,
      ...(jsonNudge(system, json) ? { system: jsonNudge(system, json) } : {}),
      messages: [{ role: "user", content: user }],
    }),
    signal,
  });
  if (!r.ok) throw new Error(await errorText(r));
  const data = await r.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
};

const errorText = async (r) => {
  let detail = "";
  try {
    const j = await r.json();
    detail = (j.error && (j.error.message || j.error)) || JSON.stringify(j);
  } catch (e) {
    try { detail = await r.text(); } catch (e2) { /* ignore */ }
  }
  const d = detail ? " — " + String(detail).slice(0, 300) : "";
  if (r.status === 401 || r.status === 403) return "The endpoint rejected the API key (" + r.status + ")." + d;
  if (r.status === 404) return "Not found (404): check the base URL and that the model id is current." + d;
  return "Request failed (" + r.status + ")" + d;
};

/** Pull a JSON object out of model output, tolerating fences and chatter. */
export const parseJson = (text) => {
  if (typeof text !== "string") return text;
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  try {
    return JSON.parse(s);
  } catch (e) {
    const a = s.indexOf("{");
    const b = s.lastIndexOf("}");
    if (a >= 0 && b > a) return JSON.parse(s.slice(a, b + 1));
    throw new Error("The model did not return valid JSON.");
  }
};

/** A tiny round-trip to confirm the connection works. */
export const testConnection = async (config) => {
  const out = await complete({
    config,
    system: "You are a connection test.",
    user: 'Reply with the JSON object {"ok": true}.',
    json: true,
    maxTokens: 64,
  });
  if (!out || out.ok !== true) throw new Error("Connected, but the reply was not the expected JSON.");
  return true;
};

export const providerFor = (c) => PROVIDERS.find((p) => p.id === (c && c.provider)) || PROVIDERS[0];
