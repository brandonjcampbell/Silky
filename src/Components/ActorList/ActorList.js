import React, { useContext, useEffect, useRef, useState } from "react";
import { store } from "../../NewContext";
import "./ActorList.css";

import { loadDir, loadFile, saveFile, renameDir } from "../../utils/";
import DraggableList from "../DraggableList";
import { TiScissors } from "react-icons/ti";
import { GiSpiderWeb, GiSewingString, GiLightBulb, GiSpinningWheel } from "react-icons/gi";
import { HiPuzzle } from "react-icons/hi";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaChartLine, FaBook } from "react-icons/fa";
import { ANALYSES } from "../Analysis";
import { WIKI_INDEX } from "../Wiki";
import { isConfigured } from "../../llm/config";
import logo from "../../images/logo.svg";
import ThemePicker from "../ThemePicker";
import { emojis } from "../TitleBar/emojis.json";

const ActorList = ({ setRefresh }) => {
  const globalState = useContext(store);
  const { dispatch } = globalState;
  const [filter, setFilter] = useState("");
  const [type, setType] = useState("element");
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);

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
      name: "New " + ofType,
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
        <Link to="/">
          <img
            className="logo"
            src={logo}
            alt="silky"
            onClick={() => {
              dispatch({ action: "setProject", payload: { name: "" } });

            }}
          />
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
        <ThemePicker compact />
      </div>
      <nav className="activityBar" aria-label="Kinds">
        {[
          ["", HiOutlineGlobeAlt, "Everything"],
          ["element", HiPuzzle, "Elements"],
          ["fact", GiLightBulb, "Facts"],
          ["snippet", TiScissors, "Snippets — the scenes"],
          ["thread", GiSewingString, "Threads"],
          ["web", GiSpiderWeb, "Webs"],
          ["analysis", FaChartLine, "Analyses — pacing, style, word count, a reader's notes"],
          ["wiki", FaBook, "Wiki — the project as an encyclopedia"],
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
          title={"Spinner — the language model" + (isConfigured() ? " (connected)" : " (not connected)")}
        >
          <GiSpinningWheel />
          {isConfigured() && <i className="activityBar__dot" />}
        </NavLink>
      </nav>

      {type === "analysis" && (
        <div className="content analysisList">
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
      {type === "wiki" && (
        <div className="content wikiList">
          {WIKI_INDEX.map((p) => (
            <NavLink key={p.id} to={"/wiki/" + p.id} className={({ isActive }) => "wikiItem" + (isActive ? " is-active" : "")}>
              {p.name}
            </NavLink>
          ))}
          <p className="wikiList__hint">Every element, scene and thread has a page; follow the links. Download the whole thing as one HTML file from the page header.</p>
        </div>
      )}
      {type !== "analysis" && type !== "wiki" && (
      <div className="content">
        <div className="listSearch">
          <input
            ref={searchRef}
            type="search"
            value={query}
            placeholder={"Search " + (type ? type + "s" : "everything")}
            aria-label="Search the list"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            spellCheck={false}
          />
          {query && <span className="listSearch__count">{shown.length}</span>}
        </div>
        {query && shown.length === 0 && <p className="listSearch__none">Nothing matches.</p>}
        <DraggableList
          showAvatar={type === "" ? true : false}
          list={shown}
          onDrop={(result, list) => handleDrop(result, list)}
        ></DraggableList>

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
            + {type}
          </button>
        )}
      </div>
      )}
    </div>
  );
};
export default ActorList;
