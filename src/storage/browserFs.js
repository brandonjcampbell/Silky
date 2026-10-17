/**
 * Browser backend.
 *
 * An in-memory mirror of the virtual filesystem, keyed by normalised path,
 * with:
 *   - persistence to IndexedDB (always), flushed after every mutation
 *   - optional one-way sync to a real folder picked with the File System
 *     Access API (Chromium only), so files land on disk too
 *
 * The virtual root is "/.silky/". Callers may use "\" or "/" as separator and
 * any `homedir()` prefix; `norm()` collapses all of that.
 */

const ROOT = "/.silky/";
const DB_NAME = "silky";
const DB_STORE = "files";
const DB_META = "meta";

// path -> string (file content) | null (directory marker)
const files = new Map();

// ---------------------------------------------------------------------------
// path helpers
// ---------------------------------------------------------------------------

const norm = (p) => {
  let s = String(p || "").replace(/\\/g, "/");
  // strip any homedir prefix the caller may have added; everything lives
  // under the virtual root
  const i = s.indexOf("/.silky");
  if (i >= 0) s = s.slice(i);
  if (!s.startsWith("/")) s = "/" + s;
  s = s.replace(/\/+/g, "/");
  return s;
};

const isDirKey = (k) => k.endsWith("/");
const asDir = (p) => (p.endsWith("/") ? p : p + "/");
const parentOf = (p) => {
  const s = p.endsWith("/") ? p.slice(0, -1) : p;
  return s.slice(0, s.lastIndexOf("/") + 1);
};

export const SEP = "/";
export const homedir = () => "";

// ---------------------------------------------------------------------------
// synchronous API over the in-memory mirror
// ---------------------------------------------------------------------------

export const existsSync = (p) => {
  const n = norm(p);
  return files.has(n) || files.has(asDir(n));
};

export const readdirSync = (p) => {
  const dir = asDir(norm(p));
  const out = new Set();
  for (const k of files.keys()) {
    if (k.startsWith(dir) && k !== dir) {
      const rest = k.slice(dir.length);
      const first = rest.split("/")[0];
      if (first) out.add(first);
    }
  }
  return [...out].sort();
};

export const readFileSync = (p) => {
  const n = norm(p);
  if (!files.has(n) || isDirKey(n)) {
    const err = new Error(`ENOENT: no such file, open '${p}'`);
    err.code = "ENOENT";
    throw err;
  }
  return files.get(n);
};

export const writeFileSync = (p, data) => {
  const n = norm(p);
  ensureDir(parentOf(n));
  files.set(n, typeof data === "string" ? data : String(data));
  scheduleFlush({ put: [n] });
};

const ensureDir = (dir) => {
  const d = asDir(dir);
  if (!files.has(d)) {
    files.set(d, null);
    if (d !== "/" && d !== ROOT) ensureDir(parentOf(d));
  }
};

export const mkdirSync = (p) => {
  const d = asDir(norm(p));
  ensureDir(d);
  scheduleFlush({ put: [d] });
};

export const renameSync = (a, b) => {
  const from = norm(a);
  const to = norm(b);
  const changed = { put: [], del: [] };
  if (files.has(from) && !isDirKey(from)) {
    files.set(to, files.get(from));
    files.delete(from);
    changed.put.push(to);
    changed.del.push(from);
  } else {
    const fromDir = asDir(from);
    const toDir = asDir(to);
    for (const k of [...files.keys()]) {
      if (k === fromDir || k.startsWith(fromDir)) {
        const nk = toDir + k.slice(fromDir.length);
        files.set(nk, files.get(k));
        files.delete(k);
        changed.put.push(nk);
        changed.del.push(k);
      }
    }
  }
  scheduleFlush(changed);
};

export const rmSync = (p) => {
  const n = norm(p);
  const del = [];
  for (const k of [...files.keys()]) {
    if (k === n || k === asDir(n) || k.startsWith(asDir(n))) {
      files.delete(k);
      del.push(k);
    }
  }
  scheduleFlush({ del });
};

// ---------------------------------------------------------------------------
// IndexedDB persistence
// ---------------------------------------------------------------------------

let dbPromise = null;
const openDb = () => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      if (!db.objectStoreNames.contains(DB_META)) db.createObjectStore(DB_META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      console.warn("silky: IndexedDB unavailable, running in-memory only", req.error);
      resolve(null);
    };
  });
  return dbPromise;
};

let pending = { put: new Set(), del: new Set() };
let flushTimer = null;

const scheduleFlush = ({ put = [], del = [] }) => {
  put.forEach((k) => {
    pending.put.add(k);
    pending.del.delete(k);
  });
  del.forEach((k) => {
    pending.del.add(k);
    pending.put.delete(k);
  });
  if (flushTimer) return;
  flushTimer = setTimeout(flush, 50);
};

/** Write everything pending to IndexedDB now. Await before reload/navigation. */
export const flushNow = async () => {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  await flush();
};

const flush = async () => {
  flushTimer = null;
  const put = [...pending.put];
  const del = [...pending.del];
  pending = { put: new Set(), del: new Set() };
  if (!put.length && !del.length) return;

  const db = await openDb();
  if (db) {
    await new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      const store = tx.objectStore(DB_STORE);
      put.forEach((k) => store.put(files.get(k), k));
      del.forEach((k) => store.delete(k));
      tx.oncomplete = resolve;
      tx.onerror = () => {
        console.warn("silky: flush failed", tx.error);
        resolve();
      };
    });
  }
  if (dirHandle) await syncToDirectory(put, del);
};

const hydrate = async () => {
  const db = await openDb();
  if (!db) return;
  await new Promise((resolve) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const req = tx.objectStore(DB_STORE).openCursor();
    req.onsuccess = () => {
      const c = req.result;
      if (c) {
        files.set(c.key, c.value);
        c.continue();
      } else resolve();
    };
    req.onerror = () => resolve();
  });
};

let readyPromise = null;
export const ready = () => {
  if (!readyPromise) {
    readyPromise = (async () => {
      await hydrate();
      ensureDir(ROOT);
      await restoreDirectoryHandle();
    })();
  }
  return readyPromise;
};

// ---------------------------------------------------------------------------
// optional real-folder sync (File System Access API)
// ---------------------------------------------------------------------------

let dirHandle = null;

export const canPickDirectory = () =>
  typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";

export const connectedDirectoryName = () => (dirHandle ? dirHandle.name : null);

const metaPut = async (k, v) => {
  const db = await openDb();
  if (!db) return;
  await new Promise((resolve) => {
    const tx = db.transaction(DB_META, "readwrite");
    tx.objectStore(DB_META).put(v, k);
    tx.oncomplete = resolve;
    tx.onerror = resolve;
  });
};
const metaGet = async (k) => {
  const db = await openDb();
  if (!db) return undefined;
  return new Promise((resolve) => {
    const tx = db.transaction(DB_META, "readonly");
    const req = tx.objectStore(DB_META).get(k);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(undefined);
  });
};

const restoreDirectoryHandle = async () => {
  try {
    const h = await metaGet("dirHandle");
    if (!h) return;
    // Permission may need re-granting; query silently, request on first write.
    const perm = await h.queryPermission({ mode: "readwrite" });
    if (perm === "granted" || perm === "prompt") dirHandle = h;
  } catch (e) {
    /* handle not restorable in this browser */
  }
};

export const connectDirectory = async () => {
  if (!canPickDirectory()) return false;
  try {
    dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    await metaPut("dirHandle", dirHandle);
    // Pull anything already in the folder, then push everything we have.
    await importFromDirectory(dirHandle);
    await syncToDirectory([...files.keys()], []);
    return true;
  } catch (e) {
    if (e && e.name !== "AbortError") console.warn("silky: directory connect failed", e);
    return false;
  }
};

const getDirHandle = async (root, segments, create) => {
  let h = root;
  for (const s of segments) {
    if (!s) continue;
    h = await h.getDirectoryHandle(s, { create });
  }
  return h;
};

const relSegments = (k) => k.slice(ROOT.length).split("/").filter(Boolean);

const syncToDirectory = async (put, del) => {
  if (!dirHandle) return;
  try {
    if ((await dirHandle.requestPermission({ mode: "readwrite" })) !== "granted") return;
    for (const k of del) {
      const segs = relSegments(k);
      if (!segs.length) continue;
      const name = segs.pop();
      try {
        const parent = await getDirHandle(dirHandle, segs, false);
        await parent.removeEntry(name, { recursive: true });
      } catch (e) {
        /* already gone */
      }
    }
    for (const k of put) {
      if (!k.startsWith(ROOT)) continue;
      const segs = relSegments(k);
      if (isDirKey(k)) {
        await getDirHandle(dirHandle, segs, true);
        continue;
      }
      const name = segs.pop();
      const parent = await getDirHandle(dirHandle, segs, true);
      const fh = await parent.getFileHandle(name, { create: true });
      const w = await fh.createWritable();
      await w.write(files.get(k));
      await w.close();
    }
  } catch (e) {
    console.warn("silky: directory sync failed", e);
  }
};

const importFromDirectory = async (root) => {
  const walk = async (h, prefix) => {
    for await (const [name, entry] of h.entries()) {
      const k = prefix + name;
      if (entry.kind === "directory") {
        files.set(k + "/", null);
        await walk(entry, k + "/");
      } else {
        const f = await entry.getFile();
        files.set(k, await f.text());
      }
    }
  };
  await walk(root, ROOT);
  scheduleFlush({ put: [...files.keys()] });
};

// ---------------------------------------------------------------------------
// images
// ---------------------------------------------------------------------------

export const pickAndStoreImage = (destPath) =>
  new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return resolve(false);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const h = 100;
        const w = Math.round((img.width / img.height) * h);
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        writeFileSync(destPath, c.toDataURL("image/png"));
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = url;
    };
    input.click();
  });

// ---------------------------------------------------------------------------
// import / export
// ---------------------------------------------------------------------------

export const exportAll = async () => {
  const out = {};
  for (const [k, v] of files) if (!isDirKey(k)) out[k] = v;
  const blob = new Blob([JSON.stringify({ silky: 1, files: out }, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `silky-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

export const importAll = async (file) => {
  const text = await file.text();
  const data = JSON.parse(text);
  const entries = data && data.files ? Object.entries(data.files) : [];
  for (const [k, v] of entries) writeFileSync(k, v);
  return entries.length;
};
