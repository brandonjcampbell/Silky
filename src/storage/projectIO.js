/**
 * Project-level export/import, shared by the storage bar, the project cards
 * and the bundled examples.
 *
 * Canonical file shape (what Export writes):
 *   { "silky": 1, "project": "Dracula", "files": { "<name>.element.json": "<json string>", "rubbish/...": "..." } }
 *
 * Import also accepts:
 *   - a whole-store export        { "silky": 1, "files": { "/.silky/<project>/<file>": "..." } }
 *   - a wrapped store export      { "<Project>": { "/.silky/<anything>/<file>": "..." } }
 *     (the key names the project; the path's own project segment is ignored)
 */
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, projectDir, silkyRoot, SEP } from "./index";

const ROOT_RE = /^(?:.*?[\\/])?\.silky[\\/]/;

/** Walk a project directory and return { relativePath: content }. */
export const readProjectFiles = (name) => {
  const out = {};
  const walk = (dir, rel) => {
    readdirSync(dir).forEach((entry) => {
      const abs = dir + entry;
      const r = rel + entry;
      if (existsSync(abs + SEP) && !/\.json$/i.test(entry)) {
        walk(abs + SEP, r + "/");
      } else {
        try {
          out[r] = readFileSync(abs);
        } catch (e) {
          /* directory marker or unreadable; skip */
        }
      }
    });
  };
  walk(projectDir(name), "");
  return out;
};

export const exportProject = (name) => {
  const payload = { silky: 1, project: name, files: readProjectFiles(name) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name.replace(/[\\/:*?"<>|]+/g, "-")}.silky.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

/** Split absolute "/.silky/<project>/<rest>" into [project, rest]. */
const splitAbs = (k) => {
  const s = String(k).replace(/\\/g, "/").replace(ROOT_RE, "");
  const i = s.indexOf("/");
  return i < 0 ? [null, s] : [s.slice(0, i), s.slice(i + 1)];
};

/**
 * Normalise any accepted payload into [{ name, files: { rel: content } }].
 * A whole-store export yields one entry per project it contains.
 */
export const parsePayload = (data, fallbackName = "Imported project") => {
  if (!data || typeof data !== "object") throw new Error("Not a Silky export.");

  // canonical project export
  if (data.silky && data.project && data.files) {
    return [{ name: String(data.project), files: { ...data.files } }];
  }
  // whole-store export
  if (data.silky && data.files) {
    const byProject = {};
    Object.entries(data.files).forEach(([k, v]) => {
      const [p, rest] = splitAbs(k);
      if (!p || !rest) return;
      (byProject[p] = byProject[p] || {})[rest] = v;
    });
    return Object.entries(byProject).map(([name, files]) => ({ name, files }));
  }
  // wrapped: { "Dracula": { "/.silky/x/file": ... } } — possibly several
  const wrapped = Object.entries(data).filter(([, v]) => v && typeof v === "object" && !Array.isArray(v));
  if (wrapped.length && wrapped.every(([, v]) => Object.keys(v).every((k) => ROOT_RE.test(k) || /\.json$/i.test(k)))) {
    return wrapped.map(([name, v]) => {
      const files = {};
      Object.entries(v).forEach(([k, c]) => {
        const rest = ROOT_RE.test(k) ? splitAbs(k)[1] : k;
        if (rest) files[rest] = c;
      });
      return { name, files };
    });
  }
  // bare map of relative files
  if (Object.keys(data).some((k) => /\.element\.json$/i.test(k))) {
    return [{ name: fallbackName, files: { ...data } }];
  }
  throw new Error("Not a Silky export.");
};

export const uniqueProjectName = (base) => {
  let names = [];
  try { names = readdirSync(silkyRoot()).map((n) => n.toLowerCase()); } catch (e) { /* none yet */ }
  if (!names.includes(base.toLowerCase())) return base;
  let n = 2;
  while (names.includes(`${base} ${n}`.toLowerCase())) n += 1;
  return `${base} ${n}`;
};

/**
 * Write one parsed project. Never overwrites: a name clash gets a numbered
 * name. Returns the name actually used.
 */
export const writeProjectFiles = ({ name, files }, { rename = true } = {}) => {
  const target = rename ? uniqueProjectName(name) : name;
  const dir = projectDir(target);
  if (!existsSync(dir)) {
    mkdirSync(dir);
    mkdirSync(`${dir}rubbish`);
  }
  Object.entries(files).forEach(([rel, content]) => {
    if (content === null || content === undefined) return;
    const parts = rel.split("/");
    for (let i = 1; i < parts.length; i += 1) {
      const sub = dir + parts.slice(0, i).join(SEP) + SEP;
      if (!existsSync(sub)) mkdirSync(sub);
    }
    writeFileSync(dir + parts.join(SEP), typeof content === "string" ? content : JSON.stringify(content));
  });
  return target;
};

/** Import from a File or parsed JSON. Returns the names written. */
export const importProjects = async (fileOrData, fallbackName) => {
  const data = typeof fileOrData.text === "function" ? JSON.parse(await fileOrData.text()) : fileOrData;
  return parsePayload(data, fallbackName).map((p) => writeProjectFiles(p));
};
