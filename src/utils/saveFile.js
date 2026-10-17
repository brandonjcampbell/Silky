import { writeFileSync, existsSync, readFileSync } from "../storage";
import { trackSave } from "../history";
import { trackProgress } from "../progress";

/** Write an actor (or any file). Actor saves are versioned in history.json. */
const saveFile = (filepath, content) => {
  let out = content;
  if (content && typeof content === "object" && /\.element\.json$/.test(filepath)) {
    let prev = null;
    try {
      if (existsSync(filepath)) prev = JSON.parse(readFileSync(filepath));
    } catch (e) {
      prev = null;
    }
    out = trackSave(filepath, prev, content);
    try { trackProgress(filepath, prev, content); } catch (e) { /* the log is best-effort */ }
  }
  writeFileSync(filepath, typeof out !== "string" ? JSON.stringify(out) : out);
};
export default saveFile;
