import THEMES, { DEFAULT_SERIF } from "./themes";

const KEY = "silky:theme";
export const THEME_EVENT = "silky-theme";

export { THEMES };

export const getThemeId = () => {
  try {
    const id = localStorage.getItem(KEY);
    if (id && THEMES.some((t) => t.id === id)) return id;
  } catch (e) {
    /* storage unavailable */
  }
  return THEMES[0].id;
};

export const getTheme = (id = getThemeId()) =>
  THEMES.find((t) => t.id === id) || THEMES[0];

/** Write a theme's tokens onto <html> so every component picks them up. */
export const applyTheme = (id) => {
  const t = getTheme(id);
  const root = document.documentElement;
  const set = (k, v) => root.style.setProperty(k, v);
  set("--bg", t.bg);
  set("--bg-side", t.bgSide);
  set("--bg-page", t.bgPage);
  set("--bg-raised", t.bgRaised);
  set("--bg-hover", t.bgHover);
  set("--line", t.line);
  set("--ink", t.ink);
  set("--ink-soft", t.inkSoft);
  set("--ink-muted", t.inkMuted);
  set("--accent", t.accent);
  set("--accent-soft", t.accentSoft);
  set("--scroll", t.scroll);
  set("--font-prose", t.prose || DEFAULT_SERIF);
  set("--logo-filter", t.light ? "invert(1) brightness(0.35)" : "none");
  root.setAttribute("data-theme", t.id);
  root.style.colorScheme = t.light ? "light" : "dark";
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: t }));
  return t;
};

export const setTheme = (id) => {
  try {
    localStorage.setItem(KEY, id);
  } catch (e) {
    /* per-browser convenience only */
  }
  return applyTheme(id);
};

/** Read the live token values (for canvases that can't use CSS variables). */
export const readPalette = () => {
  const cs = getComputedStyle(document.documentElement);
  const v = (k) => cs.getPropertyValue(k).trim();
  return {
    bg: v("--bg"),
    bgRaised: v("--bg-raised"),
    bgPage: v("--bg-page"),
    ink: v("--ink"),
    inkSoft: v("--ink-soft"),
    inkMuted: v("--ink-muted"),
    accent: v("--accent"),
    line: v("--line"),
    light: document.documentElement.getAttribute("data-theme")
      ? !!getTheme(document.documentElement.getAttribute("data-theme")).light
      : false,
  };
};
