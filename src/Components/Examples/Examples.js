import React, { useEffect, useState } from "react";
import { FaBookOpen } from "react-icons/fa";
import { importProjects } from "../../storage/projectIO";
import "./Examples.css";

const fmt = (n) => (n || 0).toLocaleString();

/**
 * Example projects bundled with the site (public/examples/*.json, indexed at
 * build time). Each one copies into the user's own projects on click.
 */
const Examples = ({ onLoaded, existing = [] }) => {
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let live = true;
    fetch("examples/index.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : []))
      .then((j) => live && setList(Array.isArray(j) ? j : []))
      .catch(() => live && setList([]));
    return () => { live = false; };
  }, []);

  if (!list || !list.length) return null;

  const load = async (ex) => {
    setBusy(ex.file);
    setErr(null);
    try {
      const r = await fetch(`examples/${ex.file}`);
      if (!r.ok) throw new Error(`Could not fetch ${ex.file} (${r.status}).`);
      const names = await importProjects(await r.json(), ex.name);
      onLoaded(names[0]);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  };

  const have = new Set(existing.map((n) => n.toLowerCase()));

  return (
    <section className="examples">
      <h4><FaBookOpen /> Examples</h4>
      <div className="examples__row">
        {list.map((ex) => {
          const c = ex.counts || {};
          const got = have.has(String(ex.name).toLowerCase());
          return (
            <button
              key={ex.file}
              type="button"
              className="exampleCard"
              disabled={busy === ex.file}
              onClick={() => load(ex)}
              title={got ? "You already have a copy; this adds another" : "Copy into your projects"}
            >
              <span className="exampleCard__name">{ex.name}</span>
              {ex.blurb && <span className="exampleCard__blurb">{ex.blurb}</span>}
              <span className="exampleCard__meta">
                {fmt(c.snippet)} scenes · {fmt(c.element)} elements · {fmt(c.fact)} facts
              </span>
              <span className="exampleCard__cta">{busy === ex.file ? "Copying…" : got ? "Copy again" : "Open a copy"}</span>
            </button>
          );
        })}
      </div>
      {err && <p className="examples__err">{err}</p>}
    </section>
  );
};

export default Examples;
