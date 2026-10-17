import React, { useEffect, useState } from "react";
import Modal from "../Modal/Modal";
import { PROVIDERS, defaultConfig, getConfig, saveConfig, clearConfig } from "../../llm/config";
import { testConnection } from "../../llm/client";
import { WEBLLM_MODELS, hasWebGPU, PROGRESS_EVENT, deleteModelCache, isEngineReady } from "../../llm/webllm";

/** Configure which model Silky talks to. Everything stays in this browser. */
const LlmSettings = ({ onClose }) => {
  const [cfg, setCfg] = useState(() => getConfig() || defaultConfig());
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState(null); // {ok, msg}
  const [testing, setTesting] = useState(false);
  const [progress, setProgress] = useState(null); // {text, progress}
  const local = cfg.provider === "webllm";
  const gpu = hasWebGPU();

  useEffect(() => {
    const on = (e) => setProgress(e.detail.phase === "ready" ? null : e.detail);
    window.addEventListener(PROGRESS_EVENT, on);
    return () => window.removeEventListener(PROGRESS_EVENT, on);
  }, []);

  const provider = PROVIDERS.find((p) => p.id === cfg.provider) || PROVIDERS[0];
  const set = (k) => (e) => setCfg({ ...cfg, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const pickProvider = (e) => {
    const next = defaultConfig(e.target.value);
    setCfg({ ...next, apiKey: cfg.apiKey });
    setStatus(null);
  };

  const test = async () => {
    setTesting(true);
    setStatus(null);
    try {
      await testConnection(cfg);
      setStatus({ ok: true, msg: local ? "The model runs here and answered." : `Connected. ${cfg.model} answered.` });
    } catch (e) {
      setStatus({ ok: false, msg: e.message });
    } finally {
      setTesting(false);
    }
  };

  const save = () => {
    saveConfig(cfg);
    onClose();
  };

  const forget = () => {
    clearConfig();
    onClose();
  };

  return (
    <Modal
      title="Language model"
      onClose={onClose}
      footer={
        <>
          {getConfig() && <button type="button" onClick={forget}>Forget connection</button>}
          <span className="spacer" />
          {status && <span className={"status " + (status.ok ? "ok" : "err")}>{status.msg}</span>}
          <button type="button" onClick={test} disabled={testing || (provider.needsKey && !cfg.apiKey) || (local && !gpu)}>
            {testing ? (local ? "Loading…" : "Testing…") : local ? (isEngineReady(cfg.model) ? "Test" : "Download & test") : "Test"}
          </button>
          <button type="button" className="primary" onClick={save} disabled={(provider.needsKey && !cfg.apiKey) || (local && !gpu)}>
            Save
          </button>
        </>
      }
    >
      <p className="note">
        Silky can read a manuscript and draft its elements, facts and scenes for you. Point it at a model you
        trust. The key is kept in this browser only and sent to nothing but the address below.
      </p>

      <label className="field">
        <span>Provider</span>
        <select value={cfg.provider} onChange={pickProvider}>
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>
      <p className="hint">{provider.note}</p>

      {local && (
        <>
          {!gpu && (
            <p className="note" style={{ color: "var(--accent)" }}>
              This browser doesn’t expose WebGPU, so a model can’t run here. Chrome or Edge on a computer with a GPU will; or pick another provider.
            </p>
          )}
          <label className="field">
            <span>Model</span>
            <select value={cfg.model} onChange={set("model")}>
              {WEBLLM_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name} — {m.size}</option>
              ))}
            </select>
          </label>
          <p className="hint">{(WEBLLM_MODELS.find((m) => m.id === cfg.model) || {}).note}</p>
          {progress && (
            <div>
              <div className="bar"><i style={{ width: `${Math.round((progress.progress || 0) * 100)}%` }} /></div>
              <p className="hint">{progress.text}</p>
            </div>
          )}
          <p className="hint">
            The first run downloads the weights from Hugging Face and caches them in this browser; later runs start in seconds. Clearing site data removes them.{" "}
            <button type="button" onClick={async () => { try { await deleteModelCache(cfg.model); setStatus({ ok: true, msg: "Cached weights removed." }); } catch (e) { setStatus({ ok: false, msg: e.message }); } }}>Remove downloaded weights</button>
          </p>
        </>
      )}

      {!local && (
      <label className="field">
        <span>Base URL</span>
        <input type="url" value={cfg.baseUrl} onChange={set("baseUrl")} spellCheck={false} />
      </label>
      )}

      {!local && (
      <label className="field">
        <span>Model</span>
        <input type="text" value={cfg.model} onChange={set("model")} spellCheck={false} />
      </label>
      )}

      {!local && (
      <label className="field">
        <span>API key{provider.needsKey ? "" : " (optional)"}</span>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type={showKey ? "text" : "password"}
            value={cfg.apiKey}
            onChange={set("apiKey")}
            autoComplete="off"
            spellCheck={false}
            placeholder={provider.needsKey ? "Required" : "Leave blank for local servers"}
          />
          <button type="button" onClick={() => setShowKey((s) => !s)}>{showKey ? "Hide" : "Show"}</button>
        </div>
      </label>
      )}

      {cfg.provider !== "anthropic" && !local && (
        <label className="check">
          <input type="checkbox" checked={!!cfg.jsonMode} onChange={set("jsonMode")} />
          Server supports JSON mode (<code>response_format</code>). Untick if the test fails with a 400.
        </label>
      )}
    </Modal>
  );
};

export default LlmSettings;
