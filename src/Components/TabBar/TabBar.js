import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { store } from "../../NewContext";
import { existsSync } from "../../storage";
import { loadFile } from "../../utils/";
import { loadTabs, saveTabs } from "../../tabs";
import { TiScissors } from "react-icons/ti";
import { GiSpiderWeb, GiSewingString, GiLightBulb } from "react-icons/gi";
import { HiPuzzle } from "react-icons/hi";
import "./TabBar.css";

const TYPE_ICON = {
  element: <HiPuzzle />,
  fact: <GiLightBulb />,
  snippet: <TiScissors />,
  thread: <GiSewingString />,
  web: <GiSpiderWeb />,
};

/**
 * Editor tabs across the top of the workspace. Opening an actor adds a tab;
 * tabs survive reloads per project. Middle-click or × closes.
 */
const TabBar = () => {
  const { state } = useContext(store);
  const { file } = useParams();
  const navigate = useNavigate();
  const project = state.project;
  const [tabs, setTabs] = useState(() => loadTabs(project));

  // Reload the set when the project changes.
  useEffect(() => {
    setTabs(loadTabs(project));
  }, [project]);

  // The routed file is always an open tab; a routed file that has gone to
  // the rubbish closes its tab and moves to a neighbour.
  useEffect(() => {
    if (!file) return;
    if (!existsSync(state.dir + file)) {
      if (tabs.includes(file)) {
        const liveNow = tabs.filter((f) => existsSync(state.dir + f));
        const i = tabs.indexOf(file);
        const neighbour = tabs.slice(i + 1).find((f) => liveNow.includes(f)) || [...tabs.slice(0, i)].reverse().find((f) => liveNow.includes(f));
        const next = tabs.filter((x) => x !== file);
        setTabs(next);
        saveTabs(project, next);
        navigate(neighbour ? "/elements/" + neighbour : "/elements/", { replace: true });
      }
      return;
    }
    if (tabs.includes(file)) return;
    const next = [...tabs, file];
    setTabs(next);
    saveTabs(project, next);
  }, [file, tabs, project, state.dir, navigate]);

  const live = useMemo(
    () => tabs.filter((f) => existsSync(state.dir + f)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tabs, state.dir, file]
  );

  const close = (f, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const i = live.indexOf(f);
    const next = tabs.filter((x) => x !== f);
    setTabs(next);
    saveTabs(project, next);
    if (f === file) {
      const neighbour = live[i + 1] || live[i - 1];
      navigate(neighbour ? "/elements/" + neighbour : "/elements/");
    }
  };

  const closeOthers = (keep) => {
    setTabs([keep]);
    saveTabs(project, [keep]);
    if (file !== keep) navigate("/elements/" + keep);
  };

  if (!live.length) return <div className="tabBar tabBar--empty" />;

  return (
    <div className="tabBar" role="tablist">
      {live.map((f) => {
        const a = loadFile(state.dir + f);
        if (!a) return null;
        const active = f === file;
        return (
          <div
            key={f}
            role="tab"
            aria-selected={active}
            className={"tab" + (active ? " is-active" : "")}
            title={a.name}
            onClick={() => !active && navigate("/elements/" + f)}
            onAuxClick={(e) => e.button === 1 && close(f, e)}
            onDoubleClick={() => closeOthers(f)}
          >
            <span className="tab__type">{TYPE_ICON[a.type]}</span>
            <span className="tab__icon">{a.icon}</span>
            <span className="tab__name">{a.name}</span>
            <button type="button" className="tab__close" aria-label={"Close " + a.name} onClick={(e) => close(f, e)}>×</button>
          </div>
        );
      })}
    </div>
  );
};

export default TabBar;
