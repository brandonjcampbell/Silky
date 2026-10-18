import { FaScroll } from "react-icons/fa";
import { FaTimes } from "react-icons/fa";
import SpinnerIcon from "../SpinnerIcon";
import React, { useContext, useEffect, useRef, useState } from "react";
import { store } from "../../NewContext";
import "./ActorList.css";

import { loadDir, loadFile, saveFile, renameDir } from "../../utils/";
import DraggableList from "../DraggableList";
import {GiSpiderWeb, GiSewingString, GiLightBulb} from "react-icons/gi";
import { HiPuzzle } from "react-icons/hi";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaBook, FaTools, FaStream, FaMapMarkedAlt, FaSlidersH } from "react-icons/fa";
import { loadTimelines, newTimeline } from "../../timelines";
import { loadMaps, newMap } from "../../maps";
import { ANALYSES } from "../Analysis";
import { WIKI_INDEX } from "../Wiki";
import "../Wiki/Wiki.css";
import { isConfigured } from "../../llm/config";
import logo from "../../images/logo.svg";
import { emojis } from "../TitleBar/emojis.json";
import { kindOf } from "../../kinds";

const ActorList = ({ setRefresh }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [filter, setFilter] = useState("");
  const [type, setType] = useState("element");
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);
  const [, setLlmTick] = useState(0);
  const [, setMapTick] = useState(0);
  useEffect(() => {
    const on = () => setMapTick((t) => t + 1);
    window.addEventListener("silky-maps", on);
    window.addEventListener("silky-timelines", on);
    return () => { window.removeEventListener("silky-maps", on); window.removeEventListener("silky-timelines", on); };
  }, []);

  // the Spinner glyph's dot follows the connection
  useEffect(() => {
    const on = () => setLlmTick((t) => t + 1);
    window.addEventListener("silky-llm", on);
    return () => window.removeEventListener("silky-llm", on);
  }, []);

  // Ctrl/Cmd+Shift+F focuses the list search from anywhere.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchRef.current && searchRef.current.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const plain = (html) => (typeof html === "string" ? html.replace(/<[^>]+>/g, " ") : "");
  const matches = (a) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    if (String(a.name || "").toLowerCase().includes(q)) return true;
    return q.length >= 3 && plain(a.content).toLowerCase().includes(q);
  };
  const dirs = loadDir(globalState.state.dir).filter((x) =>
    x.includes(".element.")
  );
  console.log("set Refresh type", typeof setRefresh);
  //setRefresh()
  const navigate = useNavigate();

  const loadUp = (x) => {
    const file = loadFile(globalState.state.dir + x);
    return file;
  };

  function compareOrder(a, b) {
    return a.order - b.order;
  }

  function handleDrop(result, list) {
    if (result && result.source && result.destination) {
      const moving = list[result.source.index];
      const to = list[result.destination.index];
      if (result.destination.index === 0) {
        moving.order = to.order - 1;
      } else if (result.destination.index === list.length - 1) {
        moving.order = to.order + 1;
      } else {
        let toTwo;
        if (result.source.index > result.destination.index) {
          toTwo = list[result.destination.index - 1];
        } else {
          toTwo = list[result.destination.index + 1];
        }
        moving.order = (to.order + toTwo.order) / 2;
      }
      saveFile(globalState.state.dir + moving.file, moving);
      setRefresh(Date.now());
    }
  }

  const newElement = (ofType) => {
    const uuid = Date.now();

    const random = Math.floor(Math.random() * emojis.length);
    const icon = emojis[random];

    let test = {
      name: "New " + ((kindOf(ofType) || {}).one || ofType),
      file: uuid + ".element.json",
      type: ofType,
      icon: icon,
      order: 0,
      uuid: uuid,
    };
    if (ofType === "element") {
      test.content = " ";
      test.involved_in = [];
      test.captured_in = [];
    }
    if (ofType === "fact") {
      test.content = [];
      test.causes = [];
      test.because = [];
      test.involves = [];
      test.revealed_by = [];
      test.captured_in = [];
    }
    if (ofType === "snippet") {
      test.content = "";
      test.reveals = [];
      test.sequenced_in = [];
      test.captured_in = [];
    }
    if (ofType === "thread") {
      test.content = "";
      test.sequences = [];
      test.captured_in = [];
    }
    if (ofType === "web") {
      test.captures = [];
      test.expands = ["reveals", "because", "involves", "then"];
    }
    return test;
  };

  const shown = dirs
    .map((x) => loadUp(x))
    .filter((y) => y && (type === "" || y.type === type))
    .filter(matches)
    .sort(compareOrder);

  return (
    <div className="ActorList">
      <div className="project">
        <Link to="/" title="Write — the blank page where the story bible builds itself">
          <img className="logo" src={logo} alt="silky" />
        </Link>

        <div
          className="projectName"
          contentEditable
          onBlur={(e) => {
            const newName =e.currentTarget.innerHTML.replace(/[/\\?%*:|"<>]/g, '')
            renameDir(globalState.state.project, newName );
            dispatch({ action: "setProject", payload: { name: newName } });
          }}
        >
          {globalState.state.project}
        </div>
        <button
          type="button"
          className="closeProject"
          title="Close this project and go back to the project list"
          onClick={() => { dispatch({ action: "setProject", payload: { name: "" } }); navigate("/"); }}
        ><FaTimes /></button>
      </div>
      <nav className="activityBar" aria-label="Kinds">
        {[
          ["", HiOutlineGlobeAlt, "Search & wiki — search everything in the project, or read it as an encyclopedia"],
          ["element", HiPuzzle, "Elements — " + kindOf("element").blurb],
          ["fact", GiLightBulb, "Facts — " + kindOf("fact").blurb],
          ["snippet", FaScroll, "Scenes — " + kindOf("snippet").blurb],
          ["thread", GiSewingString, "Threads — " + kindOf("thread").blurb],
          ["web", GiSpiderWeb, "Webs — " + kindOf("web").blurb],
          ["map", FaTools, "Tools — maps, timelines, analyses, preferences"],
        ].map(([id, Icon, title]) => (
          <button
            key={id}
            type="button"
            className={type === id ? "tab selected" : "tab"}
            title={title}
            aria-pressed={type === id}
            onClick={() => setType(id)}
          >
            <Icon />
          </button>
        ))}
        <span className="activityBar__gap" />
        <NavLink
          to="/spinner"
          className={({ isActive }) => "tab tab--link" + (isActive ? " selected" : "")}
          title={"Spinner — talk about the book, talk to your characters, connection" + (isConfigured() ? " (connected)" : " (not connected)")}
        >
          <SpinnerIcon />
          {isConfigured() && <i className="activityBar__dot" />}
        </NavLink>
      </nav>

      {type === "map" && (
        <div className="content mapsList">
          <NavLink to="/preferences" className={({ isActive }) => "analysisItem analysisItem--prefs" + (isActive ? " is-active" : "")}>
            <span className="analysisItem__icon"><FaSlidersH /></span>
            <span className="analysisItem__text"><span className="analysisItem__name">Preferences</span><span className="analysisItem__blurb">Theme, fonts, Spinner.</span></span>
          </NavLink>
          <h4 className="toolsHead">Maps</h4>
          {loadMaps(globalState.state.dir).maps.map((m) => (
            <NavLink key={m.id} to={"/map/" + m.id} className={({ isActive }) => "analysisItem" + (isActive ? " is-active" : "")}>
              <span className="analysisItem__icon"><FaMapMarkedAlt /></span>
              <span className="analysisItem__text">
                <span className="analysisItem__name">{m.name}</span>
                <span className="analysisItem__blurb">{m.pins.length} pin{m.pins.length === 1 ? "" : "s"} · {m.lines.length} route{m.lines.length === 1 ? "" : "s"}{m.scale ? ` · ${m.scale.length} ${m.unit} scale` : " · no scale"}</span>
              </span>
            </NavLink>
          ))}
          {loadMaps(globalState.state.dir).maps.length === 0 && <p className="listEmpty">No maps yet. A map is an image (or a blank sheet) with your locations pinned on it, routes drawn, and a scale so Silky can tell you how far things are apart.</p>}
          <button type="button" onClick={() => { const m = newMap(globalState.state.dir, "Map " + (loadMaps(globalState.state.dir).maps.length + 1)); navigate("/map/" + m.id); }}>+ map</button>
          <h4 className="toolsHead">Timelines</h4>
          {loadTimelines(globalState.state.dir).timelines.map((t) => (
            <NavLink key={t.id} to={"/timeline/" + t.id} className={({ isActive }) => "analysisItem" + (isActive ? " is-active" : "")}>
              <span className="analysisItem__icon"><FaStream /></span>
              <span className="analysisItem__text">
                <span className="analysisItem__name">{t.name}</span>
                <span className="analysisItem__blurb">{t.threads.length} thread{t.threads.length === 1 ? "" : "s"} as lanes</span>
              </span>
            </NavLink>
          ))}
          {loadTimelines(globalState.state.dir).timelines.length === 0 && <p className="listEmpty">No timelines yet. A timeline lays one or more threads on a shared time axis — what the map is for space. Set when each scene happens on its page.</p>}
          <button type="button" onClick={() => { const all = loadDir(globalState.state.dir).filter((f) => f.includes(".element.")).map((f) => loadFile(globalState.state.dir + f)).filter((a) => a && a.type === "thread"); const manu = all.find((t) => t.name === "Manuscript"); const t = newTimeline(globalState.state.dir, "Timeline " + (loadTimelines(globalState.state.dir).timelines.length + 1), manu ? [manu.file] : []); navigate("/timeline/" + t.id); }}>+ timeline</button>
          <h4 className="toolsHead">Analyses</h4>
          {ANALYSES.map((a) => {
            const Icon = a.icon;
            return (
              <NavLink key={a.id} to={"/analysis/" + a.id} className={({ isActive }) => "analysisItem" + (isActive ? " is-active" : "")}>
                <span className="analysisItem__icon"><Icon /></span>
                <span className="analysisItem__text">
                  <span className="analysisItem__name">{a.name}</span>
                  <span className="analysisItem__blurb">{a.blurb}</span>
                </span>
              </NavLink>
            );
          })}
        </div>
      )}
      {type !== "map" && (
      <div className="content">
        {!type && (
          <div className="wikiList wikiList--inList">
            {WIKI_INDEX.map((p) => (
              <NavLink key={p.id} to={"/wiki/" + p.id} className={({ isActive }) => "wikiItem" + (isActive ? " is-active" : "")}>
                <FaBook /> {p.name}
              </NavLink>
            ))}
            <p className="wikiList__hint">The wiki reads the whole project as an encyclopedia. Or search everything below — names and text, across every kind.</p>
          </div>
        )}
        <div className="listSearch">
          <input
            ref={searchRef}
            type="search"
            value={query}
            placeholder={(type ? "Search " + kindOf(type).label.toLowerCase() : "Search everything") + "  ⌘⇧F"}
            aria-label="Search the list"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            spellCheck={false}
          />
          {query && <span className="listSearch__count">{shown.length}</span>}
        </div>
        {query && shown.length === 0 && <p className="listSearch__none">Nothing matches.</p>}
        {!query && shown.length === 0 && type && <p className="listEmpty">{kindOf(type).empty}</p>}
        {(type || query) && <DraggableList
          showAvatar={type === "" ? true : false}
          list={shown}
          onDrop={(result, list) => handleDrop(result, list)}
        ></DraggableList>}

        {type && (
          <button
            onClick={() => {
              const el = newElement(type);
              saveFile(globalState.state.dir + el.uuid + ".element.json", el);
              setFilter(Date.now());
              navigate("/elements/" + el.file);
              dispatch({
                action: "setActiveElement",
                payload: { file: el.file },
              });
            }}
          >
            + {kindOf(type).one}
          </button>
        )}
      </div>
      )}
    </div>
  );
};
export default ActorList;
