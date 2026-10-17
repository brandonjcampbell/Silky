/**
 * Silky themes. Each one is a complete set of the tokens in index.css.
 * The first entry is the look Silky has always had.
 *
 * Keys:
 *   bg        workspace background
 *   bgSide    sidebar / panels
 *   bgPage    the writing surface
 *   bgRaised  cards, inputs, toolbar buttons
 *   bgHover   hover wash
 *   line      hairlines
 *   ink / inkSoft / inkMuted   text, secondary text, labels
 *   accent / accentSoft        the one accent and its wash
 *   scroll    scrollbar thumb
 *   prose     optional font stack for prose (defaults to Literata)
 *   light     true for light themes (inverts the logo, etc.)
 */

const SERIF = '"Literata", Georgia, "Times New Roman", serif';
const MONO = '"Courier Prime", "Courier New", Courier, monospace';

const THEMES = [
  {
    id: "silky",
    name: "Silky",
    note: "The original. Warm near-black, hot pink.",
    bg: "rgb(30, 29, 30)", bgSide: "#1b1818", bgPage: "rgb(56, 53, 57)", bgRaised: "#333030",
    bgHover: "rgba(255,255,255,0.06)", line: "rgba(255,255,255,0.10)",
    ink: "#f2f0f2", inkSoft: "#b8b3b8", inkMuted: "#7c777c",
    accent: "rgb(254, 0, 76)", accentSoft: "rgba(254,0,76,0.18)", scroll: "rgba(255,255,255,0.16)",
  },
  {
    id: "oxblood",
    name: "Oxblood",
    note: "Black, bone, dried wine.",
    bg: "#141012", bgSide: "#0e0b0c", bgPage: "#241a1e", bgRaised: "#2b1f24",
    bgHover: "rgba(255,230,230,0.06)", line: "rgba(255,230,230,0.10)",
    ink: "#efe6dc", inkSoft: "#b9ada2", inkMuted: "#7d726a",
    accent: "#b3122e", accentSoft: "rgba(179,18,46,0.22)", scroll: "rgba(239,230,220,0.16)",
  },
  {
    id: "midnight",
    name: "Midnight",
    note: "Cold blue-black with an ice accent.",
    bg: "#0f1419", bgSide: "#0a0e12", bgPage: "#182028", bgRaised: "#1e2730",
    bgHover: "rgba(180,210,255,0.06)", line: "rgba(180,210,255,0.10)",
    ink: "#e6edf3", inkSoft: "#aab7c4", inkMuted: "#6e7b88",
    accent: "#4cc9f0", accentSoft: "rgba(76,201,240,0.18)", scroll: "rgba(230,237,243,0.16)",
  },
  {
    id: "ember",
    name: "Ember",
    note: "Charcoal and amber.",
    bg: "#1c1a17", bgSide: "#151310", bgPage: "#2a2622", bgRaised: "#332e28",
    bgHover: "rgba(255,220,160,0.06)", line: "rgba(255,220,160,0.10)",
    ink: "#f4ede2", inkSoft: "#c2b7a6", inkMuted: "#857a6c",
    accent: "#ff9f1c", accentSoft: "rgba(255,159,28,0.18)", scroll: "rgba(244,237,226,0.16)",
  },
  {
    id: "moss",
    name: "Moss",
    note: "Deep green, sage light.",
    bg: "#121714", bgSide: "#0d110f", bgPage: "#1c2420", bgRaised: "#232d28",
    bgHover: "rgba(200,255,220,0.06)", line: "rgba(200,255,220,0.10)",
    ink: "#e8efe9", inkSoft: "#adbdb2", inkMuted: "#6f8075",
    accent: "#8fd19e", accentSoft: "rgba(143,209,158,0.18)", scroll: "rgba(232,239,233,0.16)",
  },
  {
    id: "dusk",
    name: "Dusk",
    note: "Violet grey, lavender accent.",
    bg: "#19171f", bgSide: "#131118", bgPage: "#26222e", bgRaised: "#2e2937",
    bgHover: "rgba(220,200,255,0.06)", line: "rgba(220,200,255,0.10)",
    ink: "#efeaf6", inkSoft: "#b7aec6", inkMuted: "#7b728a",
    accent: "#b388ff", accentSoft: "rgba(179,136,255,0.20)", scroll: "rgba(239,234,246,0.16)",
  },
  {
    id: "phosphor",
    name: "Phosphor",
    note: "Terminal green. Prose in monospace.",
    bg: "#050806", bgSide: "#020403", bgPage: "#0b120d", bgRaised: "#101a13",
    bgHover: "rgba(120,255,160,0.06)", line: "rgba(120,255,160,0.14)",
    ink: "#c8ffd4", inkSoft: "#8fd6a0", inkMuted: "#4f8a5e",
    accent: "#39ff14", accentSoft: "rgba(57,255,20,0.16)", scroll: "rgba(200,255,212,0.18)",
    prose: MONO,
  },
  {
    id: "parchment",
    name: "Parchment",
    note: "Cream paper, brown ink, oxblood accent.",
    light: true,
    bg: "#efe7d8", bgSide: "#e6dcc9", bgPage: "#f8f2e6", bgRaised: "#f3ecdd",
    bgHover: "rgba(60,40,20,0.06)", line: "rgba(60,40,20,0.14)",
    ink: "#2b2118", inkSoft: "#5c4d3f", inkMuted: "#8b7b6a",
    accent: "#8c1d2c", accentSoft: "rgba(140,29,44,0.14)", scroll: "rgba(43,33,24,0.22)",
  },
  {
    id: "paper",
    name: "Paper",
    note: "Plain white and graphite, blue accent.",
    light: true,
    bg: "#f4f4f5", bgSide: "#ebebee", bgPage: "#ffffff", bgRaised: "#fafafb",
    bgHover: "rgba(0,0,0,0.05)", line: "rgba(0,0,0,0.12)",
    ink: "#1c1c21", inkSoft: "#4a4a52", inkMuted: "#80808a",
    accent: "#2457d6", accentSoft: "rgba(36,87,214,0.14)", scroll: "rgba(28,28,33,0.22)",
  },
  {
    id: "typewriter",
    name: "Typewriter",
    note: "Warm tan, monospace prose, red ribbon.",
    light: true,
    bg: "#e9e1d1", bgSide: "#ded4c0", bgPage: "#f5efe2", bgRaised: "#f0e8d8",
    bgHover: "rgba(50,35,20,0.06)", line: "rgba(50,35,20,0.14)",
    ink: "#2a241c", inkSoft: "#584e40", inkMuted: "#8a7e6e",
    accent: "#c4302b", accentSoft: "rgba(196,48,43,0.14)", scroll: "rgba(42,36,28,0.22)",
    prose: MONO,
  },
];

export const DEFAULT_SERIF = SERIF;
export default THEMES;
