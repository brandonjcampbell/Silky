import { existsSync, readdirSync, silkyRoot } from "../storage";
const loadDir = (path) => {
  if (!path) path = silkyRoot();
  if (!existsSync(path)) return [];
  return readdirSync(path);
};
export default loadDir;
