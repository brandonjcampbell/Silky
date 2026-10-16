import { existsSync, renameSync } from "../storage";
const moveFile = (filepath, newFilepath) => {
  if (existsSync(filepath)) {
    renameSync(filepath, newFilepath);
    return true;
  } else return false;
};
export default moveFile;
