import React, { useEffect, useRef, useState } from "react";
import { FaPalette } from "react-icons/fa";
import { THEMES, getThemeId, setTheme } from "../../theme";
import "./ThemePicker.css";

/** A palette button that opens a menu of themes. The choice persists per browser. */
const ThemePicker = ({ compact = false }) => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(getThemeId());
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const pick = (id) => {
    setTheme(id);
    setCurrent(id);
    setOpen(false);
  };

  const cur = THEMES.find((t) => t.id === current) || THEMES[0];

  return (
    <div className={"themePicker" + (compact ? " themePicker--compact" : "")} ref={ref}>
      <button
        type="button"
        className="themePicker__btn"
        title="Theme"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <FaPalette />
        {!compact && <span>{cur.name}</span>}
      </button>
      {open && (
        <div className="themePicker__menu" role="menu">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={t.id === current}
              className={"themePicker__item" + (t.id === current ? " is-current" : "")}
              onClick={() => pick(t.id)}
            >
              <span
                className="themePicker__swatch"
                style={{ background: t.bg, borderColor: t.line }}
              >
                <i style={{ background: t.bgPage }} />
                <i style={{ background: t.ink }} />
                <i style={{ background: t.accent }} />
              </span>
              <span className="themePicker__text">
                <span className="themePicker__name">{t.name}</span>
                <span className="themePicker__note">{t.note}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemePicker;
