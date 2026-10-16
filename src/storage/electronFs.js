/**
 * Electron backend: thin pass-through to Node's fs, exactly what Silky did
 * before the storage layer existed. Only loaded when window.require exists.
 */

// Never call window.require at module scope: this file is imported by the
// browser bundle too (storage/index.js picks a backend at runtime).
const req = (m) => window.require(m);
const hasRequire = () => typeof window !== "undefined" && typeof window.require === "function";

export const SEP = hasRequire() ? req("path").sep : "/";

export const homedir = () => req("os").homedir();

export const existsSync = (p) => req("fs").existsSync(p);
export const readdirSync = (p) => req("fs").readdirSync(p);
export const readFileSync = (p) => req("fs").readFileSync(p, "utf8");
export const writeFileSync = (p, data) => req("fs").writeFileSync(p, data);
export const mkdirSync = (p) => req("fs").mkdirSync(p, { recursive: true });
export const renameSync = (a, b) => req("fs").renameSync(a, b);
export const rmSync = (p, opts) => req("fs").rmSync(p, opts);

export const pickAndStoreImage = async (destPath) => {
  const { dialog } = req("electron").remote;
  const nativeImage = req("electron").nativeImage;
  const data = await dialog.showOpenDialog({ properties: ["openFile"] });
  const filePath = data && data.filePaths && data.filePaths[0];
  if (!filePath) return false;
  const image = nativeImage.createFromPath(filePath);
  req("fs").writeFileSync(destPath, image.resize({ height: 100 }).toPNG());
  return true;
};

export const ready = () => Promise.resolve();
