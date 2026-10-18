/* Appearance preferences: fonts and type size for the whole app, on top of
   the theme. Kept in this browser. */
import { THEME_EVENT, getTheme } from "./theme";
import { DEFAULT_SERIF } from "./theme/themes";

const KEY = "silky:prefs";
export const UI_FONTS = [
  { id: "system", name: "System", css: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` },
  { id: "inter", name: "Inter / Helvetica", css: `Inter, "Helvetica Neue", Helvetica, Arial, sans-serif` },
  { id: "georgia", name: "Georgia (serif UI)", css: `Georgia, "Times New Roman", serif` },
  { id: "mono", name: "Monospace", css: `ui-monospace, "SF Mono", Menlo, Consolas, "Courier New", monospace` },
];
export const PROSE_FONTS = [
  { id: "theme", name: "Theme's own", css: null },
  { id: "literata", name: "Literata / Georgia", css: DEFAULT_SERIF },
  { id: "georgia", name: "Georgia", css: `Georgia, "Times New Roman", serif` },
  { id: "garamond", name: "Garamond", css: `"EB Garamond", Garamond, "Cormorant Garamond", Georgia, serif` },
  { id: "palatino", name: "Palatino", css: `Palatino, "Palatino Linotype", "Book Antiqua", serif` },
  { id: "baskerville", name: "Baskerville", css: `Baskerville, "Libre Baskerville", Georgia, serif` },
  { id: "times", name: "Times New Roman", css: `"Times New Roman", Times, serif` },
  { id: "courier", name: "Courier (manuscript)", css: `"Courier New", Courier, "Courier Prime", monospace` },
  { id: "sans", name: "Sans-serif", css: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` },
  { id: "dyslexic", name: "OpenDyslexic (if installed)", css: `OpenDyslexic, "Comic Sans MS", Verdana, sans-serif` },
];
export const DEFAULT_PREFS = { uiFont: "system", proseFont: "theme", proseSize: 18, proseLeading: 1.65, uiSize: 100, pageWidth: 72 };

export const loadPrefs = () => { try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (e) { return { ...DEFAULT_PREFS }; } };
export const savePrefs = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* */ } applyPrefs(p); window.dispatchEvent(new CustomEvent("silky-prefs", { detail: p })); return p; };

export const applyPrefs = (p = loadPrefs()) => {
  const root = document.documentElement;
  const ui = UI_FONTS.find((f) => f.id === p.uiFont) || UI_FONTS[0];
  const prose = PROSE_FONTS.find((f) => f.id === p.proseFont) || PROSE_FONTS[0];
  root.style.setProperty("--font-ui", ui.css);
  root.style.setProperty("--font-prose", prose.css || getTheme().prose || DEFAULT_SERIF);
  root.style.setProperty("--prose-size", `${p.proseSize}px`);
  root.style.setProperty("--prose-leading", String(p.proseLeading));
  root.style.setProperty("--page-width", `${p.pageWidth}ch`);
  root.style.fontSize = p.uiSize === 100 ? "" : `${p.uiSize}%`;
};
// the theme writes its own prose font; put ours back on top whenever it changes
if (typeof window !== "undefined") window.addEventListener(THEME_EVENT, () => applyPrefs());
