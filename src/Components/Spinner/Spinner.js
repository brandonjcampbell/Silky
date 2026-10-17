import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Talk from "../Talk";
import { GiSpinningWheel } from "react-icons/gi";
import { FaFileImport, FaBookReader, FaBook, FaPlug } from "react-icons/fa";
import LlmSettings from "../LlmSettings";
import { getConfig, isConfigured, PROVIDERS } from "../../llm/config";
import { WEBLLM_MODELS, hasWebGPU } from "../../llm/webllm";
import "./Spinner.css";

/**
 * Spinner is Silky's model: the thing that spins thread from a manuscript,
 * reads as a reader, and writes the wiki. This page manages its connection.
 */
const Spinner = () => {
  const [, setTick] = useState(0);
  const settings = useLocation().pathname.endsWith("/settings");
  useEffect(() => {
    const on = () => setTick((t) => t + 1);
    window.addEventListener("silky-llm", on);
    return () => window.removeEventListener("silky-llm", on);
  }, []);

  const cfg = getConfig();
  const on = isConfigured();
  const provider = cfg && PROVIDERS.find((p) => p.id === cfg.provider);
  const local = cfg && cfg.provider === "webllm";
  const modelName = local ? ((WEBLLM_MODELS.find((m) => m.id === cfg.model) || {}).name || cfg.model) : cfg && cfg.model;

  return (
    <div className={"workspace spinnerView" + (settings ? "" : " spinnerView--talk")}>
      <h1 className="workspaceHeader">
        <span className="typeIcon"><GiSpinningWheel /></span>
        <p>Spinner</p>
        <nav className="spinner__modes">
          <NavLink to="/spinner" end className={({ isActive }) => (isActive ? "is-active" : "")}>Talk</NavLink>
          <NavLink to="/spinner/settings" className={({ isActive }) => (isActive ? "is-active" : "")}>Connection{on ? "" : " · not connected"}</NavLink>
        </nav>
      </h1>

      {!settings && <Talk />}
      {settings && (
      <div className="spinner">
        <section className={"spinner__status" + (on ? " is-on" : "")}>
          <span className="spinner__dot" />
          {on ? (
            <span>
              <b>Connected</b> — {provider ? provider.name : cfg.provider}, <code>{modelName}</code>
              {local && (hasWebGPU() ? ". Runs on this machine; nothing leaves it." : ". This browser has no WebGPU, so it won’t run here.")}
            </span>
          ) : (
            <span><b>Not connected.</b> Pick a provider below. The no-setup option is <i>In this browser</i>, which downloads a small model once and runs it on your GPU.</span>
          )}
        </section>

        <div className="spinner__cols">
          <LlmSettings inline onClose={() => {}} />

          <aside className="spinner__uses">
            <h3>What Spinner does</h3>
            <ul>
              <li>
                <GiSpinningWheel />
                <div><b>Talk about the book</b><span>A conversation to break a block: bring in the scene you’re stuck on and Spinner asks the right questions. <Link to="/spinner">Open Talk</Link></span></div>
              </li>
              <li>
                <FaFileImport />
                <div><b>Import a manuscript</b><span>Splits it into scenes, extracts elements and facts, traces plot threads and lays out webs. From the project tray.</span></div>
              </li>
              <li>
                <FaBookReader />
                <div><b>Read as a reader</b><span>Plays any of the reader profiles — or ones you write — and tells you how each scene landed. <Link to="/analysis/reader">Open Reader</Link></span></div>
              </li>
              <li>
                <FaBook />
                <div><b>Write the wiki</b><span>Drafts an encyclopedia entry for every element from the project’s own facts, never from outside. <Link to="/wiki/home">Open Wiki</Link></span></div>
              </li>
            </ul>
            <h3>Where things go</h3>
            <p>
              Connection settings live in this browser only. With a cloud provider, scene text is sent to that provider’s API and nowhere else; with <i>In this browser</i>, nothing is sent anywhere. Reader notes and wiki entries are saved inside the project, so they travel with an export.
            </p>
            <p className="spinner__hint"><FaPlug /> The <b>Spinner</b> button on the project tray opens the same settings as a dialog.</p>
          </aside>
        </div>
      </div>
      )}
    </div>
  );
};

export default Spinner;
