import { existsSync, renameSync, projectDir } from "../storage";
const renameDir = (name, newName) => {
  if (!name || !newName) return;
  const from = projectDir(name);
  const to = projectDir(newName);
  if (existsSync(from) && !existsSync(to)) {
    renameSync(from, to);
  }
};
export default renameDir;
