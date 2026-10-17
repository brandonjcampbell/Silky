import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaBook, FaDownload, FaFeatherAlt } from "react-icons/fa";
import { store } from "../../NewContext";
import { loadDir, loadFile } from "../../utils/";
import { buildWiki, exportWikiHtml, PAGE, WIKI_CSS } from "../../wiki/build";
import { loadArticles, writeArticles, clearArticles } from "../../wiki/articles";
import { isConfigured } from "../../llm/config";
import "./Wiki.css";

export const WIKI_INDEX = [
  { id: PAGE.home, name: "Overview" },
  { id: PAGE.elements, name: "Elements A–Z" },
  { id: PAGE.threads, name: "Threads" },
  { id: PAGE.timeline, name: "Timeline" },
  { id: PAGE.scenes, name: "Scenes" },
  { id: PAGE.facts, name: "Facts" },
];

const useActors = () => {
  const { state } = useContext(store);
  const dir = state.dir;
  const [tick, setTick] = useState(0);
  const actors = useMemo(
    () => loadDir(dir).filter((f) => f.includes(".element.")).map((f) => loadFile(dir + f)).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dir, state.project, tick]
  );
  return { dir, project: state.project, actors, refresh: () => setTick((t) => t + 1) };
};

/** The project as an encyclopedia: generated pages, cross-linked, exportable. */
const Wiki = () => {
  const { "*": pageId = PAGE.home } = useParams();
  const { dir, project, actors } = useActors();
  const [articleData, setArticleData] = useState(() => loadArticles(dir));
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const abortRef = useRef(null);
  const configured = isConfigured();
  useEffect(() => { setArticleData(loadArticles(dir)); }, [dir]);
  useEffect(() => () => abortRef.current && abortRef.current.abort(), []);

  const wiki = useMemo(
    () => buildWiki(actors, { link: (id) => "#/wiki/" + id, projectName: project, articles: articleData.articles }),
    [actors, project, articleData]
  );
  const page = wiki.pages[pageId] || wiki.pages[PAGE.home];
  const elements = actors.filter((a) => a.type === "element");
  const written = elements.filter((e) => articleData.articles[e.file]).length;
  const eligible = elements.filter((e) => (e.involved_in || []).length >= 3).length;

  const download = () => {
    const html = exportWikiHtml(actors, project, articleData.articles);
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${project.replace(/[\\/:*?"<>|]+/g, "-")} wiki.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const write = async (force) => {
    setErr(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy({ message: "Starting", pct: 0 });
    try {
      const out = await writeArticles(dir, elements, wiki.index, {
        force,
        signal: ctrl.signal,
        onProgress: ({ index, total, message }) => {
          setBusy({ message, pct: Math.round((index / Math.max(total, 1)) * 100) });
          setArticleData(loadArticles(dir));
        },
      });
      setArticleData(out);
    } catch (e) {
      if (!e || e.name !== "AbortError") setErr(e.message || String(e));
      setArticleData(loadArticles(dir));
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    const el = document.querySelector(".wikiView__page");
    if (el) el.scrollTop = 0;
  }, [pageId]);

  return (
    <div className="workspace wikiView">
      <style>{WIKI_CSS}</style>
      <div className="wikiView__bar">
        <span className="wikiView__crumb"><FaBook /> <Link to="/wiki/home">{project}</Link> › {page.kind}</span>
        <span className="spacer" />
        {configured && !busy && (
          <>
            <button type="button" onClick={() => write(false)} disabled={written >= eligible} title="Have the model write an encyclopedia entry for every element with three or more facts, from those facts alone">
              <FaFeatherAlt /> {written >= eligible ? `${written} entries written` : `Write ${eligible - written} entr${eligible - written === 1 ? "y" : "ies"}`}
            </button>
            {written > 0 && <button type="button" onClick={() => write(true)}>Rewrite all</button>}
            {written > 0 && <button type="button" onClick={() => { clearArticles(dir); setArticleData(loadArticles(dir)); }}>Forget entries</button>}
          </>
        )}
        {busy && (
          <>
            <span className="wikiView__busy">{busy.message}…</span>
            <div className="bar"><i style={{ width: `${busy.pct}%` }} /></div>
            <button type="button" onClick={() => abortRef.current && abortRef.current.abort()}>Stop</button>
          </>
        )}
        {err && <span className="err">{err}</span>}
        <button type="button" className="primary" onClick={download} title="One HTML file with every page, searchable, that opens anywhere"><FaDownload /> Download wiki</button>
      </div>
      <div className="wikiView__page">
        <article className="wiki">
          <h1>{page.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: page.html }} />
        </article>
      </div>
    </div>
  );
};

export default Wiki;
