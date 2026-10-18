import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FaTimes, FaCompress } from "react-icons/fa";
import SpinnerIcon from "../SpinnerIcon";
import { subscribe, dismiss, act, start, setDir, LEVELS } from "../../flow/watcher";
import { isFocus, setFocus } from "../../focus";
import "./Flow.css";

/** Spinner's toasts (Flow mode), plus the exit control for blank-page mode. */
const FlowToasts = ({ dir, project }) => {
  const [st, setSt] = useState({ toasts: [], status: "idle", level: "off" });
  const [focus, setF] = useState(isFocus());
  const { pathname } = useLocation();
  useEffect(() => { start(); return subscribe(setSt); }, []);
  useEffect(() => { setDir(dir, project); }, [dir, project]);
  useEffect(() => {
    const on = (e) => setF(!!e.detail);
    const key = (e) => { if (e.key === "Escape" && isFocus()) setFocus(false); };
    window.addEventListener("silky-focus", on);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("silky-focus", on); window.removeEventListener("keydown", key); };
  }, []);
  // leaving a scene leaves the blank page
  useEffect(() => { if (!/^\/elements\//.test(pathname) && isFocus()) setFocus(false); }, [pathname]);

  const level = LEVELS.find((l) => l.id === st.level);
  const lifted = useLocation().pathname.startsWith("/spinner"); // clear of the composer
  return (
    <>
      {focus && (
        <button type="button" className="focusExit" title="Back to the full view (Esc)" onClick={() => setFocus(false)}><FaCompress /> <span>Exit blank page</span></button>
      )}
      {(st.level !== "off" || st.toasts.length > 0) && (
        <div className={"flowToasts" + (lifted ? " flowToasts--lifted" : "")} aria-live="polite">
          {st.toasts.map((t) => (
            <div key={t.id} className={"toast toast--" + t.kind}>
              <span className="toast__icon"><SpinnerIcon /></span>
              <div className="toast__body">
                <p>{t.text}</p>
                {(t.primary || t.secondary) && (
                  <div className="toast__actions">
                    {t.primary && <button type="button" className="primary" onClick={() => act(t.id, "primary")}>{t.primary}</button>}
                    {t.secondary && <button type="button" onClick={() => act(t.id, "secondary")}>{t.secondary}</button>}
                  </div>
                )}
              </div>
              <button type="button" className="toast__close" aria-label="Dismiss" onClick={() => dismiss(t.id, false)}><FaTimes /></button>
            </div>
          ))}
          {st.level !== "off" && (
            <div className={"flowStatus is-" + st.status} title={level ? `Flow: ${level.name} — ${level.blurb}` : ""}>
              <SpinnerIcon className={st.status === "reading" ? "spin" : ""} />
              <span>{st.status === "reading" ? "Spinner is reading…" : st.status === "waiting" ? "Spinner will read when you pause" : `Spinner is watching · ${level ? level.name : ""}`}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FlowToasts;
