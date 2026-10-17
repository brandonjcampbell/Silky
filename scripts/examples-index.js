/* Builds public/examples/index.json from the project exports in that folder,
   so adding an example is just dropping a file there. Runs before start/build. */
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "public", "examples");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const titleFrom = (f) => f.replace(/\.silky\.json$|\.json$/i, "").replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const entries = fs
  .readdirSync(dir)
  .filter((f) => /\.json$/i.test(f) && f !== "index.json")
  .sort()
  .map((file) => {
    let name = titleFrom(file);
    let blurb = "";
    let counts = {};
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      let files = null;
      if (data.silky && data.project && data.files) {
        name = data.project;
        blurb = data.blurb || "";
        files = data.files;
      } else {
        const k = Object.keys(data).find((x) => data[x] && typeof data[x] === "object" && !Array.isArray(data[x]));
        if (k && !data.silky) {
          name = k;
          files = data[k];
        } else if (data.files) files = data.files;
      }
      if (files) {
        Object.values(files).forEach((v) => {
          try {
            const a = typeof v === "string" ? JSON.parse(v) : v;
            if (a && a.type) counts[a.type] = (counts[a.type] || 0) + 1;
          } catch (e) { /* not an actor */ }
        });
      }
    } catch (e) {
      console.warn(`examples: could not read ${file}: ${e.message}`);
    }
    const size = fs.statSync(path.join(dir, file)).size;
    return { file, name, blurb, counts, size };
  });

fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify(entries, null, 2));
console.log(`examples: indexed ${entries.length} file(s)`);
