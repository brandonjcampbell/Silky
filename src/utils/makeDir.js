import { existsSync, mkdirSync, projectDir } from "../storage";
const makeDir = (name) => {
  if (!name) return;
  const dir = projectDir(name);
  if (!existsSync(dir)) {
    mkdirSync(dir);
    mkdirSync(`${dir}rubbish`);
  }
};
export default makeDir;
