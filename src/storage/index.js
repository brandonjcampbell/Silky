/**
 * Silky storage layer.
 *
 * Every file operation in the app goes through this module so Silky can run
 * both inside Electron (real filesystem under ~/.silky) and in a plain browser
 * (an in-memory mirror persisted to IndexedDB, optionally synced to a real
 * folder via the File System Access API).
 *
 * The API is deliberately SYNCHRONOUS, because the components call these in
 * render (`options={loadDir(...)}`). In the browser the in-memory mirror is
 * hydrated once before React mounts (see `ready()`), and writes are flushed
 * to IndexedDB asynchronously after each mutation.
 *
 * Paths: callers build paths like `${root}\\.silky\\Project\\file.json`. The
 * browser backend normalises separators and treats `root` as a virtual
 * prefix, so the same string concatenation works everywhere.
 */

import * as electronFs from "./electronFs";
import * as browserFs from "./browserFs";

export const isElectron =
  typeof window !== "undefined" &&
  typeof window.require === "function" &&
  (() => {
    try {
      return !!window.require("fs");
    } catch (e) {
      return false;
    }
  })();

const backend = isElectron ? electronFs : browserFs;

/** Separator used when callers build paths. Both backends accept either. */
export const SEP = isElectron ? backend.SEP : "/";

/** The user's home-equivalent. Callers append `${SEP}.silky${SEP}<project>`. */
export const homedir = () => backend.homedir();

/** The Silky root (`<homedir>/.silky/`), with trailing separator. */
export const silkyRoot = () => `${homedir()}${SEP}.silky${SEP}`;

/** Path to a project directory, with trailing separator. */
export const projectDir = (name) => `${silkyRoot()}${name}${SEP}`;

export const existsSync = (p) => backend.existsSync(p);
export const readdirSync = (p) => backend.readdirSync(p);
export const readFileSync = (p) => backend.readFileSync(p);
export const writeFileSync = (p, data) => backend.writeFileSync(p, data);
export const mkdirSync = (p) => backend.mkdirSync(p);
export const renameSync = (a, b) => backend.renameSync(a, b);
export const rmSync = (p, opts) => backend.rmSync(p, opts);

/**
 * Store an image for an actor. Electron: opens a native file dialog and
 * writes a resized PNG next to the project files. Browser: opens an
 * <input type=file>, resizes on a canvas, stores a PNG data URL.
 * Resolves true if an image was stored.
 */
export const pickAndStoreImage = (destPath) => backend.pickAndStoreImage(destPath);

/**
 * Resolves once the backend is usable. Electron resolves immediately; the
 * browser backend hydrates its in-memory mirror from IndexedDB first.
 */
export const ready = () => backend.ready();

/** Make sure pending writes are durable (browser: IndexedDB). No-op in Electron. */
export const flushNow = () => (isElectron ? Promise.resolve() : browserFs.flushNow());

/** Browser-only extras (no-ops in Electron). */
export const browser = {
  /** True when the File System Access API is available (Chromium). */
  canPickDirectory: () => !isElectron && browserFs.canPickDirectory(),
  /** Ask the user for a real folder and mirror all projects into it. */
  connectDirectory: () => (isElectron ? Promise.resolve(false) : browserFs.connectDirectory()),
  /** Name of the connected folder, or null. */
  connectedDirectoryName: () => (isElectron ? null : browserFs.connectedDirectoryName()),
  /** Download every project as one JSON file. */
  exportAll: () => (isElectron ? Promise.resolve() : browserFs.exportAll()),
  /** Import a JSON produced by exportAll (merges, does not wipe). */
  importAll: (file) => (isElectron ? Promise.resolve(0) : browserFs.importAll(file)),
};
