import { existsSync, rmSync, projectDir } from "../storage";
const deleteDir = (name) => {
  if (!name) return;
  const dir = projectDir(name);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
};
export default deleteDir;
