import React, { useState } from "react";
import Modal from "../Modal/Modal";
import { PROVIDERS, defaultConfig, getConfig, saveConfig, clearConfig } from "../../llm/config";
import { testConnection } from "../../llm/client";

/** Configure which model Silky talks to. Everything stays in this browser. */
const LlmSettings = ({ onClose }) => {
  const [cfg, setCfg] = useState(() => getConfig() || defaultConfig());
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState(null); // {ok, msg}
  const [testing, setTesting] = useState(false);

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
      setStatus({ ok: true, msg: `Connected. ${cfg.model} answered.` });
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
          <button type="button" onClick={test} disabled={testing || (provider.needsKey && !cfg.apiKey)}>
            {testing ? "Testing…" : "Test"}
          </button>
          <button type="button" className="primary" onClick={save} disabled={provider.needsKey && !cfg.apiKey}>
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

      <label className="field">
        <span>Base URL</span>
        <input type="url" value={cfg.baseUrl} onChange={set("baseUrl")} spellCheck={false} />
      </label>

      <label className="field">
        <span>Model</span>
        <input type="text" value={cfg.model} onChange={set("model")} spellCheck={false} />
      </label>

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

      {cfg.provider !== "anthropic" && (
        <label className="check">
          <input type="checkbox" checked={!!cfg.jsonMode} onChange={set("jsonMode")} />
          Server supports JSON mode (<code>response_format</code>). Untick if the test fails with a 400.
        </label>
      )}
    </Modal>
  );
};

export default LlmSettings;
